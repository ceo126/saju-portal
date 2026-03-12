require('dotenv').config();
const express = require('express');
const path = require('path');
const sajuEngine = require('./lib/saju-engine');
const SajuInterpreter = require('./lib/saju-interpreter');

const app = express();
const PORT = process.env.PORT || 8210;
const interpreter = new SajuInterpreter(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 기본 사주 풀이
app.post('/api/saju/basic', async (req, res) => {
  try {
    const { year, month, day, hour, gender } = req.body;
    if (!year || !month || !day) {
      return res.status(400).json({ error: '생년월일을 입력해주세요' });
    }

    const sajuResult = sajuEngine.calculate(
      parseInt(year), parseInt(month), parseInt(day),
      hour !== undefined && hour !== '' && hour !== -1 ? parseInt(hour) : -1,
      gender || 'male'
    );

    const interpretation = await interpreter.interpretBasic(sajuResult);

    res.json({
      success: true,
      saju: sajuResult,
      interpretation
    });
  } catch (e) {
    console.error('기본 사주 오류:', e);
    res.status(500).json({ error: '사주 분석 중 오류가 발생했습니다' });
  }
});

// 사주 궁합
app.post('/api/saju/compatibility', async (req, res) => {
  try {
    const { person1, person2 } = req.body;

    const saju1 = sajuEngine.calculate(
      parseInt(person1.year), parseInt(person1.month), parseInt(person1.day),
      person1.hour !== undefined && person1.hour !== '' && person1.hour !== -1 ? parseInt(person1.hour) : -1,
      person1.gender || 'male'
    );

    const saju2 = sajuEngine.calculate(
      parseInt(person2.year), parseInt(person2.month), parseInt(person2.day),
      person2.hour !== undefined && person2.hour !== '' && person2.hour !== -1 ? parseInt(person2.hour) : -1,
      person2.gender || 'female'
    );

    const compatResult = sajuEngine.calculateCompatibility(saju1, saju2);
    const interpretation = await interpreter.interpretCompatibility(compatResult);

    res.json({
      success: true,
      saju1,
      saju2,
      compatibility: { ...compatResult, interpretation }
    });
  } catch (e) {
    console.error('궁합 오류:', e);
    res.status(500).json({ error: '궁합 분석 중 오류가 발생했습니다' });
  }
});

// 오늘의 운세
app.post('/api/saju/today', async (req, res) => {
  try {
    const { year, month, day, hour, gender } = req.body;

    const sajuResult = sajuEngine.calculate(
      parseInt(year), parseInt(month), parseInt(day),
      hour !== undefined && hour !== '' && hour !== -1 ? parseInt(hour) : -1,
      gender || 'male'
    );

    const todayInfo = sajuEngine.getTodayInfo();
    const interpretation = await interpreter.interpretToday(sajuResult, todayInfo);

    res.json({
      success: true,
      saju: sajuResult,
      today: todayInfo,
      interpretation
    });
  } catch (e) {
    console.error('오늘의 운세 오류:', e);
    res.status(500).json({ error: '오늘의 운세 분석 중 오류가 발생했습니다' });
  }
});

// 2026 신년운세
app.post('/api/saju/newyear', async (req, res) => {
  try {
    const { year, month, day, hour, gender } = req.body;

    const sajuResult = sajuEngine.calculate(
      parseInt(year), parseInt(month), parseInt(day),
      hour !== undefined && hour !== '' && hour !== -1 ? parseInt(hour) : -1,
      gender || 'male'
    );

    const interpretation = await interpreter.interpretNewYear(sajuResult);

    res.json({
      success: true,
      saju: sajuResult,
      interpretation
    });
  } catch (e) {
    console.error('신년운세 오류:', e);
    res.status(500).json({ error: '신년운세 분석 중 오류가 발생했습니다' });
  }
});

app.listen(PORT, () => {
  console.log(`\n✨ 사주포털 서버 시작: http://localhost:${PORT}\n`);
});
