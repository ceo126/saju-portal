const { GoogleGenerativeAI } = require('@google/generative-ai');

class SajuInterpreter {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  // 공통: AI 응답에서 JSON 추출
  extractJSON(text) {
    const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }

  // 기본 사주 풀이
  async interpretBasic(sajuResult) {
    const { yearPillar, monthPillar, dayPillar, hourPillar, personality, animal, animalEmoji, ohengAnalysis, eumyangRatio, gender, birthInfo } = sajuResult;

    const hourInfo = hourPillar ? `시주: ${hourPillar.cheongan}${hourPillar.jiji} (${hourPillar.cheonganHanja}${hourPillar.jijiHanja})` : '시주: 미입력';

    const prompt = `당신은 40년 경력의 최고 사주명리학 전문가입니다. 아래 사주팔자를 깊이있게 분석해주세요.

## 기본 정보
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 생년월일: ${birthInfo.year}년 ${birthInfo.month}월 ${birthInfo.day}일 ${birthInfo.hour >= 0 ? birthInfo.hour + '시' : '시간미상'}
- 띠: ${animal} ${animalEmoji}

## 사주팔자
- 년주: ${yearPillar.cheongan}${yearPillar.jiji} (${yearPillar.cheonganHanja}${yearPillar.jijiHanja}) [${yearPillar.cheonganOheng}/${yearPillar.jijiOheng}]
- 월주: ${monthPillar.cheongan}${monthPillar.jiji} (${monthPillar.cheonganHanja}${monthPillar.jijiHanja}) [${monthPillar.cheonganOheng}/${monthPillar.jijiOheng}]
- 일주: ${dayPillar.cheongan}${dayPillar.jiji} (${dayPillar.cheonganHanja}${dayPillar.jijiHanja}) [${dayPillar.cheonganOheng}/${dayPillar.jijiOheng}]
- ${hourInfo}

## 일간 (나를 나타내는 글자)
- ${dayPillar.cheongan} = ${personality.title} (${personality.desc})

## 오행 분석
- 목: ${ohengAnalysis.counts['목']}개 (${ohengAnalysis.percentages['목']}%)
- 화: ${ohengAnalysis.counts['화']}개 (${ohengAnalysis.percentages['화']}%)
- 토: ${ohengAnalysis.counts['토']}개 (${ohengAnalysis.percentages['토']}%)
- 금: ${ohengAnalysis.counts['금']}개 (${ohengAnalysis.percentages['금']}%)
- 수: ${ohengAnalysis.counts['수']}개 (${ohengAnalysis.percentages['수']}%)
- 가장 강한 오행: ${ohengAnalysis.strongest.name}
- 가장 약한 오행: ${ohengAnalysis.weakest.name}
${ohengAnalysis.missing.length > 0 ? `- 없는 오행: ${ohengAnalysis.missing.join(', ')}` : '- 모든 오행이 존재'}

## 음양 비율
- 양: ${eumyangRatio.yang}, 음: ${eumyangRatio.eum}

## 분석 요청
아래 항목을 JSON 형태로 답변해주세요. 각 항목은 구체적이고 실용적으로 작성하되, 사주 전문가답게 깊이있는 분석을 해주세요.

{
  "summary": "이 사주의 핵심을 한 문장으로 (30자 이내)",
  "personality": {
    "core": "핵심 성격 (3~4문장, 구체적으로)",
    "strengths": ["강점 3가지"],
    "weaknesses": ["약점 3가지"],
    "social": "대인관계 성향 (2~3문장)"
  },
  "career": {
    "suitable": ["적합한 직업/분야 5가지"],
    "advice": "직업운 조언 (3~4문장)"
  },
  "wealth": {
    "tendency": "재물운 성향 (2~3문장)",
    "advice": "재물 관련 조언 (2~3문장)"
  },
  "love": {
    "tendency": "연애/결혼운 성향 (3~4문장)",
    "idealType": "잘 맞는 상대 유형 (2문장)"
  },
  "health": {
    "weak_points": ["건강 주의 부위 2~3가지"],
    "advice": "건강 조언 (2문장)"
  },
  "luck_elements": {
    "color": "행운의 색",
    "number": "행운의 숫자",
    "direction": "행운의 방향"
  },
  "yearly_flow": "2026년 병오년 운세 흐름 (3~4문장)",
  "life_advice": "인생 종합 조언 (4~5문장, 격려와 실용적 조언)"
}

반드시 유효한 JSON만 출력하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

    try {
      const result = await this.model.generateContent(prompt);
      return this.extractJSON(result.response.text());
    } catch (e) {
      console.error('AI 해석 오류:', e.message);
      return this.getFallbackBasic(sajuResult);
    }
  }

  // 궁합 해석
  async interpretCompatibility(compatResult) {
    const { saju1, saju2, score } = compatResult;

    const prompt = `당신은 40년 경력의 사주명리학 전문가입니다. 두 사람의 사주 궁합을 분석해주세요.

## 첫 번째 사람
- 일간: ${saju1.dayPillar.cheongan} (${saju1.personality.title})
- 사주: ${saju1.yearPillar.ganji} ${saju1.monthPillar.ganji} ${saju1.dayPillar.ganji} ${saju1.hourPillar ? saju1.hourPillar.ganji : '미상'}
- 강한 오행: ${saju1.ohengAnalysis.strongest.name}, 약한 오행: ${saju1.ohengAnalysis.weakest.name}

## 두 번째 사람
- 일간: ${saju2.dayPillar.cheongan} (${saju2.personality.title})
- 사주: ${saju2.yearPillar.ganji} ${saju2.monthPillar.ganji} ${saju2.dayPillar.ganji} ${saju2.hourPillar ? saju2.hourPillar.ganji : '미상'}
- 강한 오행: ${saju2.ohengAnalysis.strongest.name}, 약한 오행: ${saju2.ohengAnalysis.weakest.name}

## 기본 궁합 점수: ${score}점

다음 JSON 형식으로 궁합 분석을 해주세요.
scores의 각 항목은 사주 분석 결과를 기반으로 30~98 사이 점수를 직접 판단해서 넣어주세요:

{
  "title": "이 커플을 한 마디로 표현 (예: '물과 나무의 만남')",
  "overall": "종합 궁합 분석 (4~5문장)",
  "love_chemistry": "연애 케미 분석 (3~4문장)",
  "communication": "소통 방식 분석 (3문장)",
  "conflict": "갈등 포인트와 해결 방법 (3~4문장)",
  "strengths": ["이 커플의 장점 3가지"],
  "cautions": ["주의할 점 3가지"],
  "advice": "이 커플에게 드리는 조언 (3~4문장)",
  "scores": {
    "love": "연애궁합 점수 (30~98)",
    "communication": "소통궁합 점수 (30~98)",
    "values": "가치관궁합 점수 (30~98)",
    "future": "미래궁합 점수 (30~98)"
  }
}

반드시 유효한 JSON만 출력하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

    try {
      const result = await this.model.generateContent(prompt);
      return this.extractJSON(result.response.text());
    } catch (e) {
      console.error('궁합 AI 해석 오류:', e.message);
      return this.getFallbackCompatibility(score);
    }
  }

  // 오늘의 운세
  async interpretToday(sajuResult, todayInfo) {
    const prompt = `당신은 사주명리학 전문가입니다. 오늘의 운세를 분석해주세요.

## 사주 정보
- 일간: ${sajuResult.dayPillar.cheongan} (${sajuResult.personality.title})
- 사주: ${sajuResult.yearPillar.ganji} ${sajuResult.monthPillar.ganji} ${sajuResult.dayPillar.ganji} ${sajuResult.hourPillar ? sajuResult.hourPillar.ganji : '미상'}

## 오늘 일진
- 날짜: ${todayInfo.date}
- 일진: ${todayInfo.dayPillar.cheongan}${todayInfo.dayPillar.jiji} (${todayInfo.dayOheng})

다음 JSON 형식으로 답변:

{
  "score": 1~100 사이의 오늘 운세 점수,
  "emoji": "오늘을 표현하는 이모지 1개",
  "summary": "오늘 운세 한 줄 요약",
  "detail": "오늘의 상세 운세 (4~5문장, 구체적인 조언 포함)",
  "love": "오늘의 연애운 (2문장)",
  "money": "오늘의 재물운 (2문장)",
  "work": "오늘의 직장/학업운 (2문장)",
  "health": "오늘의 건강운 (1~2문장)",
  "lucky": {
    "time": "가장 좋은 시간대",
    "color": "오늘의 행운 색",
    "food": "오늘의 행운 음식"
  },
  "caution": "오늘 주의할 점 (1~2문장)"
}

반드시 유효한 JSON만 출력하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

    try {
      const result = await this.model.generateContent(prompt);
      return this.extractJSON(result.response.text());
    } catch (e) {
      console.error('오늘의 운세 AI 오류:', e.message);
      return {
        score: 75,
        emoji: '\u2600\uFE0F',
        summary: '긍정적인 에너지가 흐르는 하루입니다',
        detail: '오늘은 전반적으로 무난한 하루가 예상됩니다. 새로운 시도보다는 기존에 하던 일에 집중하면 좋은 결과를 얻을 수 있습니다.',
        love: '소중한 사람에게 따뜻한 말 한마디가 큰 힘이 됩니다.',
        money: '충동적인 소비는 자제하고, 계획된 지출 위주로 관리하세요.',
        work: '오전에 중요한 업무를 처리하면 효율이 높습니다.',
        health: '가벼운 스트레칭으로 몸을 풀어주세요.',
        lucky: { time: '오전 9~11시', color: '파란색', food: '따뜻한 국물 요리' },
        caution: '급한 결정은 피하고, 한 번 더 생각한 후 행동하세요.'
      };
    }
  }

  // 신년운세
  async interpretNewYear(sajuResult) {
    const prompt = `당신은 40년 경력의 사주명리학 전문가입니다. 2026년 병오년(丙午年) 신년 운세를 상세하게 분석해주세요.

## 사주 정보
- 성별: ${sajuResult.gender === 'male' ? '남성' : '여성'}
- 일간: ${sajuResult.dayPillar.cheongan} (${sajuResult.personality.title})
- 사주: ${sajuResult.yearPillar.ganji} ${sajuResult.monthPillar.ganji} ${sajuResult.dayPillar.ganji} ${sajuResult.hourPillar ? sajuResult.hourPillar.ganji : '미상'}
- 강한 오행: ${sajuResult.ohengAnalysis.strongest.name}
- 약한 오행: ${sajuResult.ohengAnalysis.weakest.name}

## 2026년 병오년 특성
- 천간 병(丙) = 화(火), 지지 오(午) = 화(火)
- 화기운이 매우 강한 해

다음 JSON 형식으로 월별 포함 상세 신년운세:

{
  "year_theme": "2026년을 관통하는 핵심 테마 (한 문장)",
  "year_overview": "2026년 전체 운세 개요 (5~6문장, 구체적)",
  "career_year": "2026년 직업/사업운 (4~5문장)",
  "wealth_year": "2026년 재물운 (4~5문장)",
  "love_year": "2026년 연애/결혼운 (4~5문장)",
  "health_year": "2026년 건강운 (3~4문장)",
  "monthly": [
    {"month": 1, "title": "1월 운세 키워드", "desc": "1월 운세 (2~3문장)"},
    {"month": 2, "title": "2월 운세 키워드", "desc": "2월 운세 (2~3문장)"},
    {"month": 3, "title": "3월 운세 키워드", "desc": "3월 운세 (2~3문장)"},
    {"month": 4, "title": "4월 운세 키워드", "desc": "4월 운세 (2~3문장)"},
    {"month": 5, "title": "5월 운세 키워드", "desc": "5월 운세 (2~3문장)"},
    {"month": 6, "title": "6월 운세 키워드", "desc": "6월 운세 (2~3문장)"},
    {"month": 7, "title": "7월 운세 키워드", "desc": "7월 운세 (2~3문장)"},
    {"month": 8, "title": "8월 운세 키워드", "desc": "8월 운세 (2~3문장)"},
    {"month": 9, "title": "9월 운세 키워드", "desc": "9월 운세 (2~3문장)"},
    {"month": 10, "title": "10월 운세 키워드", "desc": "10월 운세 (2~3문장)"},
    {"month": 11, "title": "11월 운세 키워드", "desc": "11월 운세 (2~3문장)"},
    {"month": 12, "title": "12월 운세 키워드", "desc": "12월 운세 (2~3문장)"}
  ],
  "best_months": [가장 좋은 달 3개 숫자],
  "caution_months": [주의할 달 2개 숫자],
  "lucky": {
    "color": "2026년 행운의 색",
    "number": "행운의 숫자",
    "direction": "행운의 방향"
  },
  "final_advice": "2026년을 잘 보내기 위한 종합 조언 (4~5문장)"
}

반드시 유효한 JSON만 출력하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.`;

    try {
      const result = await this.model.generateContent(prompt);
      return this.extractJSON(result.response.text());
    } catch (e) {
      console.error('신년운세 AI 오류:', e.message);
      return this.getFallbackNewYear(sajuResult);
    }
  }

  // ===== Fallback 해석 =====

  getFallbackBasic(sajuResult) {
    const p = sajuResult.personality;
    return {
      summary: `${p.title}의 기운을 가진 사주`,
      personality: {
        core: `${p.desc}의 성품을 지니고 있습니다. ${p.trait}으로 주변에 영향력을 미칩니다.`,
        strengths: ['강한 의지력', '뛰어난 판단력', '높은 책임감'],
        weaknesses: ['완벽주의 경향', '스트레스에 민감', '고집이 셀 수 있음'],
        social: '사람들과의 관계에서 진실된 모습을 보여주는 편입니다.'
      },
      career: {
        suitable: ['경영/관리', '전문직', '창의적 분야', '교육', '컨설팅'],
        advice: '자신의 강점을 살릴 수 있는 분야에서 큰 성과를 거둘 수 있습니다.'
      },
      wealth: {
        tendency: '꾸준한 노력으로 재물을 모아가는 타입입니다.',
        advice: '투자보다는 안정적인 저축을 기반으로 자산을 불려가세요.'
      },
      love: {
        tendency: '진실된 감정을 중시하며, 한 번 마음을 주면 깊이 사랑하는 타입입니다.',
        idealType: '안정감 있고 이해심 깊은 사람과 좋은 궁합을 이룹니다.'
      },
      health: {
        weak_points: ['소화기계', '스트레스성 질환'],
        advice: '규칙적인 생활 습관과 적절한 운동이 중요합니다.'
      },
      luck_elements: { color: '파란색', number: '3', direction: '동쪽' },
      yearly_flow: '2026년은 새로운 시작의 에너지가 강한 해입니다. 그동안 준비해온 일들이 결실을 맺을 수 있습니다.',
      life_advice: '자신의 본질을 이해하고 강점을 살리는 것이 가장 중요합니다. 조급함을 버리고 꾸준히 노력하면 반드시 좋은 결과를 얻을 수 있습니다.'
    };
  }

  getFallbackCompatibility(score) {
    return {
      title: '서로를 보완하는 인연',
      overall: '두 사람의 사주를 종합적으로 보았을 때, 서로의 부족한 부분을 채워줄 수 있는 관계입니다.',
      love_chemistry: '감정적으로 깊은 교감이 가능한 조합입니다.',
      communication: '서로의 의사소통 방식을 이해하면 더 좋은 관계가 될 수 있습니다.',
      conflict: '가치관의 차이에서 갈등이 올 수 있으나, 대화로 해결 가능합니다.',
      strengths: ['서로 보완적', '성장 가능성 높음', '안정적 관계'],
      cautions: ['소통 노력 필요', '가치관 차이 존중', '개인 시간 존중'],
      advice: '서로의 다름을 인정하고 존중하는 것이 이 관계의 핵심입니다.',
      scores: { love: score, communication: Math.max(30, score - 3), values: Math.min(98, score + 2), future: Math.min(98, score + 5) }
    };
  }

  getFallbackNewYear(sajuResult) {
    const p = sajuResult.personality;
    const months = [];
    const titles = ['새로운 시작', '준비의 시간', '도약의 기회', '안정과 성장', '활발한 교류', '전환점', '수확의 계절', '재충전', '도전과 성취', '내면의 성장', '정리와 마무리', '감사의 시간'];
    for (let i = 1; i <= 12; i++) {
      months.push({ month: i, title: titles[i - 1], desc: `${i}월은 차분하게 자신의 페이스를 유지하며 나아가는 것이 중요합니다. 주변의 조언에 귀를 기울이세요.` });
    }
    return {
      year_theme: `${p.title}의 기운이 병오년 화(火)를 만나 변화의 한 해`,
      year_overview: `2026년 병오년은 화(火) 기운이 매우 강한 해입니다. ${p.title}의 성향을 가진 당신에게 열정과 변화의 에너지가 찾아옵니다. 상반기에는 새로운 기회가 찾아오고, 하반기에는 그 성과를 정리하는 시간이 될 것입니다.`,
      career_year: '직업적으로 새로운 도전을 시도하기 좋은 해입니다. 그동안 준비해온 프로젝트가 빛을 발할 수 있습니다. 다만 성급한 판단은 피하고, 신중하게 결정하세요.',
      wealth_year: '재물운은 전반적으로 안정적입니다. 상반기에 좋은 투자 기회가 올 수 있으나, 무리한 지출은 삼가세요. 꾸준한 저축이 하반기 안정의 기반이 됩니다.',
      love_year: '인간관계가 활발해지는 해입니다. 미혼이라면 좋은 인연을 만날 가능성이 높고, 기혼이라면 가정에 더 많은 관심을 기울이면 좋겠습니다.',
      health_year: '화 기운이 강하므로 심장과 혈액순환에 주의하세요. 규칙적인 운동과 충분한 수분 섭취가 중요합니다.',
      monthly: months,
      best_months: [3, 6, 9],
      caution_months: [5, 11],
      lucky: { color: '초록색', number: '3, 8', direction: '동쪽' },
      final_advice: '2026년은 열정을 가지되 균형을 잃지 않는 것이 핵심입니다. 자신의 강점을 살리면서 부족한 부분은 주변의 도움을 받으세요. 건강을 최우선으로 챙기고, 가까운 사람들과의 관계를 소중히 하면 풍요로운 한 해가 될 것입니다.'
    };
  }
}

module.exports = SajuInterpreter;
