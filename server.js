require('dotenv').config();
const express = require('express');
const path = require('path');
const sajuEngine = require('./lib/saju-engine');
const SajuInterpreter = require('./lib/saju-interpreter');

const app = express();
const PORT = process.env.PORT || 8210;

// Rate Limiting (IP당 분당 최대 요청 수)
const RATE_LIMIT = 10; // 분당 10회
const RATE_WINDOW = 60 * 1000; // 1분
const requestCounts = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
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

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

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

// 기본 사주 풀이
app.post('/api/saju/basic', rateLimit, async (req, res) => {
  try {
    const input = parseBirthInput(req.body);
    if (input.error) return res.status(400).json({ error: input.error });

    const sajuResult = sajuEngine.calculate(input.year, input.month, input.day, input.hour, input.gender);
    const interpretation = await interpreter.interpretBasic(sajuResult);

    res.json({ success: true, saju: sajuResult, interpretation });
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

    const saju1 = sajuEngine.calculate(input1.year, input1.month, input1.day, input1.hour, input1.gender);
    const saju2 = sajuEngine.calculate(input2.year, input2.month, input2.day, input2.hour, input2.gender);

    const compatResult = sajuEngine.calculateCompatibility(saju1, saju2);
    const interpretation = await interpreter.interpretCompatibility(compatResult);

    res.json({ success: true, saju1, saju2, compatibility: { ...compatResult, interpretation } });
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

    const sajuResult = sajuEngine.calculate(input.year, input.month, input.day, input.hour, input.gender);
    const todayInfo = sajuEngine.getTodayInfo();
    const interpretation = await interpreter.interpretToday(sajuResult, todayInfo);

    res.json({ success: true, saju: sajuResult, today: todayInfo, interpretation });
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

    const sajuResult = sajuEngine.calculate(input.year, input.month, input.day, input.hour, input.gender);
    const seunAnalysis = sajuEngine.getSeunAnalysis(sajuResult);
    const interpretation = await interpreter.interpretNewYearDetailed(sajuResult, seunAnalysis);

    res.json({ success: true, saju: sajuResult, seunAnalysis, interpretation });
  } catch (e) {
    console.error('신년운세 오류:', e);
    res.status(500).json({ error: '신년운세 분석 중 오류가 발생했습니다' });
  }
});

process.on('uncaughtException', (err) => {
  console.error('미처리 예외:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('미처리 Promise 거부:', err);
});

app.listen(PORT, () => {
  console.log(`\n✨ 사주포털 서버 시작: http://localhost:${PORT}\n`);
});
