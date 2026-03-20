require('dotenv').config();
const express = require('express');
const compression = require('compression');
const path = require('path');
const sajuEngine = require('./lib/saju-engine');
const SajuInterpreter = require('./lib/saju-interpreter');

const app = express();
const PORT = process.env.PORT || 8210;

// API 응답 캐시 (동일 생년월일 데이터 → 1시간 캐싱)
const CACHE_TTL = 60 * 60 * 1000; // 1시간
const responseCache = new Map();

function getCacheKey(endpoint, data) {
  return `${endpoint}:${JSON.stringify(data)}`;
}

function getCachedResponse(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedResponse(key, data) {
  responseCache.set(key, { data, timestamp: Date.now() });
}

// 오래된 캐시 엔트리 정리 (10분마다)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of responseCache) {
    if (now - entry.timestamp > CACHE_TTL) responseCache.delete(key);
  }
}, 10 * 60 * 1000).unref();

// 방문자 카운터 (인메모리)
let visitorCount = 152380;
const visitedIPs = new Set();

app.get('/api/visitors', (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!visitedIPs.has(ip)) {
    visitedIPs.add(ip);
    visitorCount++;
  }
  res.json({ count: visitorCount });
});

// Rate Limiting (IP당 분당 최대 요청 수)
const RATE_LIMIT = 10; // 분당 10회
const RATE_WINDOW = 60 * 1000; // 1분
const requestCounts = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now - entry.start > RATE_WINDOW) {
    requestCounts.set(ip, { start: now, count: 1 });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
  }
  next();
}

// 오래된 rate limit 엔트리 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of requestCounts) {
    if (now - entry.start > RATE_WINDOW * 2) requestCounts.delete(ip);
  }
}, 5 * 60 * 1000).unref();

if (!process.env.GEMINI_API_KEY) {
  console.error('⚠️  GEMINI_API_KEY가 .env 파일에 설정되지 않았습니다.');
  console.error('   .env 파일에 GEMINI_API_KEY=your_key 를 추가해주세요.');
  process.exit(1);
}
const interpreter = new SajuInterpreter(process.env.GEMINI_API_KEY);

// gzip 압축
app.use(compression());

// 보안 헤더 + CORS
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public'), { etag: true }));

// 공통: 생년월일시 파싱 + 검증
function parseBirthInput(data) {
  if (!data || typeof data !== 'object') return { error: '입력 데이터가 올바르지 않습니다' };
  const year = parseInt(data.year);
  const month = parseInt(data.month);
  const day = parseInt(data.day);
  const gender = data.gender === 'female' ? 'female' : 'male';

  if (isNaN(year) || isNaN(month) || isNaN(day)) return { error: '생년월일을 입력해주세요' };
  if (year < 1920 || year > 2030) return { error: '1920~2030년 사이로 입력해주세요' };
  if (month < 1 || month > 12) return { error: '올바른 월을 입력해주세요' };
  const maxDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDay) return { error: `${month}월은 ${maxDay}일까지 입력 가능합니다` };

  const parsedHour = parseInt(data.hour);
  const hour = (data.hour !== undefined && data.hour !== '' && data.hour !== null && parsedHour >= 0 && parsedHour <= 23)
    ? parsedHour
    : -1;

  return { year, month, day, hour, gender };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cacheSize: responseCache.size,
  });
});

// 기본 사주 풀이
app.post('/api/saju/basic', rateLimit, async (req, res) => {
  try {
    const input = parseBirthInput(req.body);
    if (input.error) return res.status(400).json({ error: input.error });

    const cacheKey = getCacheKey('basic', input);
    const cached = getCachedResponse(cacheKey);
    if (cached) return res.json(cached);

    const sajuResult = sajuEngine.calculate(input.year, input.month, input.day, input.hour, input.gender);
    const interpretation = await interpreter.interpretBasic(sajuResult);

    const result = { success: true, saju: sajuResult, interpretation };
    setCachedResponse(cacheKey, result);
    res.json(result);
  } catch (e) {
    console.error('기본 사주 오류:', e);
    res.status(500).json({ error: '사주 분석 중 오류가 발생했습니다' });
  }
});

// 사주 궁합
app.post('/api/saju/compatibility', rateLimit, async (req, res) => {
  try {
    const { person1, person2 } = req.body || {};
    const input1 = parseBirthInput(person1);
    if (input1.error) return res.status(400).json({ error: '첫 번째 사람: ' + input1.error });
    const input2 = parseBirthInput(person2);
    if (input2.error) return res.status(400).json({ error: '두 번째 사람: ' + input2.error });

    const cacheKey = getCacheKey('compatibility', { input1, input2 });
    const cached = getCachedResponse(cacheKey);
    if (cached) return res.json(cached);

    const saju1 = sajuEngine.calculate(input1.year, input1.month, input1.day, input1.hour, input1.gender);
    const saju2 = sajuEngine.calculate(input2.year, input2.month, input2.day, input2.hour, input2.gender);

    const compatResult = sajuEngine.calculateCompatibility(saju1, saju2);
    const interpretation = await interpreter.interpretCompatibility(compatResult);

    const result = { success: true, saju1, saju2, compatibility: { ...compatResult, interpretation } };
    setCachedResponse(cacheKey, result);
    res.json(result);
  } catch (e) {
    console.error('궁합 오류:', e);
    res.status(500).json({ error: '궁합 분석 중 오류가 발생했습니다' });
  }
});

// 오늘의 운세
app.post('/api/saju/today', rateLimit, async (req, res) => {
  try {
    const input = parseBirthInput(req.body);
    if (input.error) return res.status(400).json({ error: input.error });

    // 오늘 날짜를 캐시 키에 포함 (날짜가 바뀌면 캐시 무효화)
    const todayStr = new Date().toISOString().slice(0, 10);
    const cacheKey = getCacheKey('today', { ...input, todayStr });
    const cached = getCachedResponse(cacheKey);
    if (cached) return res.json(cached);

    const sajuResult = sajuEngine.calculate(input.year, input.month, input.day, input.hour, input.gender);
    const todayInfo = sajuEngine.getTodayInfo();
    const interpretation = await interpreter.interpretToday(sajuResult, todayInfo);

    const result = { success: true, saju: sajuResult, today: todayInfo, interpretation };
    setCachedResponse(cacheKey, result);
    res.json(result);
  } catch (e) {
    console.error('오늘의 운세 오류:', e);
    res.status(500).json({ error: '오늘의 운세 분석 중 오류가 발생했습니다' });
  }
});

// 2026 신년운세 (상세 5섹션)
app.post('/api/saju/newyear', rateLimit, async (req, res) => {
  try {
    const input = parseBirthInput(req.body);
    if (input.error) return res.status(400).json({ error: input.error });

    const cacheKey = getCacheKey('newyear', input);
    const cached = getCachedResponse(cacheKey);
    if (cached) return res.json(cached);

    const sajuResult = sajuEngine.calculate(input.year, input.month, input.day, input.hour, input.gender);
    const seunAnalysis = sajuEngine.getSeunAnalysis(sajuResult);
    const interpretation = await interpreter.interpretNewYearDetailed(sajuResult, seunAnalysis);

    const result = { success: true, saju: sajuResult, seunAnalysis, interpretation };
    setCachedResponse(cacheKey, result);
    res.json(result);
  } catch (e) {
    console.error('신년운세 오류:', e);
    res.status(500).json({ error: '신년운세 분석 중 오류가 발생했습니다' });
  }
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '요청하신 페이지를 찾을 수 없습니다' });
});

process.on('uncaughtException', (err) => {
  console.error('미처리 예외:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('미처리 Promise 거부:', err);
});

const server = app.listen(PORT, () => {
  console.log(`\n✨ 사주포털 서버 시작: http://localhost:${PORT}\n`);
});

// Graceful shutdown
function shutdown() {
  console.log('\n서버 종료 중...');
  server.close(() => {
    console.log('서버 종료 완료');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
