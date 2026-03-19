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

  // 세운 컨텍스트 문자열 빌드 (신년운세 상세용)
  buildSeunContext(sajuResult, seunAnalysis) {
    const { yearPillar, monthPillar, dayPillar, hourPillar, personality, ohengAnalysis, eumyangRatio, gender } = sajuResult;
    const sa = seunAnalysis;

    const hourInfo = hourPillar
      ? `시주: ${hourPillar.cheongan}${hourPillar.jiji} (${hourPillar.cheonganHanja}${hourPillar.jijiHanja}) [${hourPillar.cheonganOheng}/${hourPillar.jijiOheng}] - 천간십성: ${sa.pillarSipsung.hourPillar.cheonganSipsung}, 지지십성: ${sa.pillarSipsung.hourPillar.jijiSipsung}`
      : '시주: 미입력';

    let ctx = `## 사주 원국
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 일간: ${dayPillar.cheongan} (${personality.title} - ${personality.desc})

## 사주팔자 (십성 포함)
- 년주: ${yearPillar.cheongan}${yearPillar.jiji} (${yearPillar.cheonganHanja}${yearPillar.jijiHanja}) [${yearPillar.cheonganOheng}/${yearPillar.jijiOheng}] - 천간십성: ${sa.pillarSipsung.yearPillar.cheonganSipsung}, 지지십성: ${sa.pillarSipsung.yearPillar.jijiSipsung}
- 월주: ${monthPillar.cheongan}${monthPillar.jiji} (${monthPillar.cheonganHanja}${monthPillar.jijiHanja}) [${monthPillar.cheonganOheng}/${monthPillar.jijiOheng}] - 천간십성: ${sa.pillarSipsung.monthPillar.cheonganSipsung}, 지지십성: ${sa.pillarSipsung.monthPillar.jijiSipsung}
- 일주: ${dayPillar.cheongan}${dayPillar.jiji} (${dayPillar.cheonganHanja}${dayPillar.jijiHanja}) [${dayPillar.cheonganOheng}/${dayPillar.jijiOheng}] - 천간십성: 일간, 지지십성: ${sa.pillarSipsung.dayPillar.jijiSipsung}
- ${hourInfo}

## 오행 비율
- 목: ${ohengAnalysis.counts['목']}개 (${ohengAnalysis.percentages['목']}%)
- 화: ${ohengAnalysis.counts['화']}개 (${ohengAnalysis.percentages['화']}%)
- 토: ${ohengAnalysis.counts['토']}개 (${ohengAnalysis.percentages['토']}%)
- 금: ${ohengAnalysis.counts['금']}개 (${ohengAnalysis.percentages['금']}%)
- 수: ${ohengAnalysis.counts['수']}개 (${ohengAnalysis.percentages['수']}%)
- 가장 강한 오행: ${ohengAnalysis.strongest.name} (${ohengAnalysis.strongest.count}개)
- 가장 약한 오행: ${ohengAnalysis.weakest.name} (${ohengAnalysis.weakest.count}개)
${ohengAnalysis.missing.length > 0 ? `- 없는 오행: ${ohengAnalysis.missing.join(', ')}` : '- 모든 오행이 존재'}

## 음양 비율
- 양: ${eumyangRatio.yang}개, 음: ${eumyangRatio.eum}개

## 신강/신약 분석
- 판별: ${sa.singang}
- 설명: ${sa.singangDesc}
- 일간 오행: ${sa.ilganOheng}

## 2026년 병오년(丙午年) 세운 분석
- 세운 천간: 병(丙) = 화(火), 십성: ${sa.seunCheonganSipsung}
- 세운 지지: 오(午) = 화(火), 십성: ${sa.seunJijiSipsung}
- 화(火) 기운이 천간과 지지 모두에 있어 매우 강한 해`;

    if (sa.chungList.length > 0) {
      ctx += `\n\n## 충(沖) 관계`;
      sa.chungList.forEach(c => {
        ctx += `\n- ${c.pillar}의 ${c.jiji}와 세운 ${c.seunJiji}가 충(沖)`;
      });
    }
    if (sa.hapList.length > 0) {
      ctx += `\n\n## 지지 합(合) 관계`;
      sa.hapList.forEach(h => {
        ctx += `\n- ${h.pillar}의 ${h.jiji}와 세운 ${h.seunJiji}가 합(合)`;
      });
    }
    if (sa.cheonganHapList.length > 0) {
      ctx += `\n\n## 천간 합(合) 관계`;
      sa.cheonganHapList.forEach(h => {
        ctx += `\n- ${h.pillar}의 ${h.cheongan}와 세운 ${h.seunCheongan}가 합(合)`;
      });
    }

    return ctx;
  }

  // 신년운세 상세 (5개 섹션 병렬 호출)
  async interpretNewYearDetailed(sajuResult, seunAnalysis) {
    const ctx = this.buildSeunContext(sajuResult, seunAnalysis);
    const baseInstruction = `당신은 40년 경력의 최고 사주명리학 전문가입니다. 아래 사주 정보를 기반으로 2026년 병오년 운세를 분석해주세요.
반드시 유효한 JSON만 출력하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.
모든 텍스트는 한국어로 작성하세요. 사주 전문가답게 깊이있고 구체적으로 분석해주세요.

${ctx}`;

    // 총운 프롬프트
    const promptChongun = `${baseInstruction}

## 요청: 2026년 총운 분석
아래 JSON 형식으로 답변:
{
  "year_theme": "2026년을 관통하는 핵심 테마 한 문장",
  "year_keyword": "3글자 키워드 (예: 도약성장)",
  "year_overview": "2026년 전체 운세 개요 (5~6문장, 구체적으로)",
  "opportunity": "2026년 기회 요인 (4~5문장)",
  "crisis": "2026년 위기 요인 (4~5문장)",
  "relationship_overview": "대인관계 총평 (3~4문장)",
  "advice": "핵심 조언 (4~5문장)"
}`;

    // 재물운 프롬프트
    const promptWealth = `${baseInstruction}

## 요청: 2026년 재물운 분석
monthly_scores는 1월~12월 각 달의 재물운 점수(0~100)를 배열로 넣어주세요. 사주 분석에 근거해서 현실적으로 다양한 점수를 넣어주세요.
아래 JSON 형식으로 답변:
{
  "overview": "재물운 전체 분석 (4~5문장)",
  "monthly_scores": [75, 65, 60, 90, 30, 15, 35, 80, 75, 40, 85, 95],
  "good_months": [{ "month": 4, "reason": "좋은 달 이유 2~3문장" }, { "month": 12, "reason": "이유" }],
  "bad_months": [{ "month": 6, "reason": "나쁜 달 이유 2~3문장" }, { "month": 7, "reason": "이유" }],
  "strategy": ["전략1 제목: 구체적 설명 2~3문장", "전략2 제목: 구체적 설명 2~3문장", "전략3 제목: 구체적 설명 2~3문장"],
  "warning_people": ["유형1: 설명 2문장", "유형2: 설명 2문장"],
  "summary": "재물운 총평 (3~4문장)"
}`;

    // 애정운 프롬프트
    const promptLove = `${baseInstruction}

## 요청: 2026년 애정운 분석
monthly_scores는 1월~12월 각 달의 애정운 점수(0~100)를 배열로 넣어주세요.
아래 JSON 형식으로 답변:
{
  "overview": "애정운 전체 분석 (4~5문장)",
  "monthly_scores": [75, 85, 70, 90, 40, 20, 35, 88, 65, 45, 80, 95],
  "ideal_partner": {
    "personality": "이상적 파트너 성격 특징 2~3문장",
    "appearance": "외적 특징/분위기 2문장",
    "job_field": "적합한 파트너 직업 분야",
    "tags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5"]
  },
  "single_advice": {
    "good_months": [{"month": 2, "strategy": "전략 2~3문장"}, {"month": 4, "strategy": "전략"}],
    "bad_months": [{"month": 6, "warning": "주의사항 2문장"}],
    "meeting_places": "만남 장소 추천 (2~3문장)",
    "charm_items": "매력 아이템 추천 (2~3문장)"
  },
  "couple_advice": {
    "good_months": [{"month": 4, "tip": "팁 2문장"}, {"month": 8, "tip": "팁"}],
    "bad_months": [{"month": 6, "warning": "주의사항 2문장"}],
    "couple_items": "커플 아이템 추천 (2문장)",
    "date_spots": "추천 데이트 장소 (2~3문장)"
  },
  "summary": "애정운 총평 (3~4문장)"
}`;

    // 건강운 프롬프트
    const promptHealth = `${baseInstruction}

## 요청: 2026년 건강운 분석
monthly_scores는 1월~12월 각 달의 건강운 점수(0~100)를 배열로 넣어주세요.
아래 JSON 형식으로 답변:
{
  "overview": "건강운 전체 분석 (4~5문장)",
  "constitution": "타고난 건강 체질 분석 (3~4문장, 오행 기반)",
  "monthly_scores": [80, 60, 65, 90, 40, 25, 30, 55, 65, 45, 90, 95],
  "diseases": [{"name": "주의 질환명", "desc": "설명 2~3문장"}, {"name": "질환명", "desc": "설명"}],
  "good_foods": [{"name": "음식명", "reason": "이유 1~2문장"}, {"name": "음식명", "reason": "이유"}],
  "bad_foods": [{"name": "음식명", "reason": "이유 1~2문장"}, {"name": "음식명", "reason": "이유"}],
  "supplements": [{"name": "영양제명", "reason": "이유 1~2문장"}, {"name": "영양제명", "reason": "이유"}],
  "good_exercises": [{"name": "운동명", "reason": "이유 1~2문장"}, {"name": "운동명", "reason": "이유"}],
  "bad_exercises": [{"name": "운동명", "reason": "이유 1~2문장"}],
  "lifestyle_good": [{"habit": "좋은 습관", "reason": "이유"}, {"habit": "습관", "reason": "이유"}],
  "lifestyle_bad": [{"habit": "나쁜 습관", "reason": "이유"}, {"habit": "습관", "reason": "이유"}],
  "summary": "건강운 총평 (3~4문장)"
}`;

    // 직업운 프롬프트
    const promptCareer = `${baseInstruction}

## 요청: 2026년 직업운 분석
monthly_scores는 1월~12월 각 달의 직업운 점수(0~100)를 배열로 넣어주세요.
아래 JSON 형식으로 답변:
{
  "overview": "직업운 전체 분석 (4~5문장)",
  "monthly_scores": [75, 60, 60, 95, 35, 15, 25, 65, 65, 40, 85, 95],
  "reputation": "직장/사업 평판 분석 (3~4문장)",
  "helpful_people": [{"type": "도움 유형", "desc": "설명 2~3문장"}, {"type": "유형", "desc": "설명"}],
  "dangerous_people": [{"type": "위험 유형", "desc": "설명 2~3문장"}, {"type": "유형", "desc": "설명"}],
  "employee_advice": "직장인 조언 (4~5문장)",
  "business_advice": "사업가 조언 (4~5문장)",
  "good_months": [{"month": 4, "opportunity": "기회 설명 2~3문장"}, {"month": 12, "opportunity": "기회 설명"}],
  "bad_months": [{"month": 6, "warning": "경고 설명 2~3문장"}],
  "summary": "직업운 총평 (3~4문장)"
}`;

    // 5개 병렬 호출
    const callAI = async (prompt, sectionName) => {
      try {
        const result = await this.model.generateContent(prompt);
        return this.extractJSON(result.response.text());
      } catch (e) {
        console.error(`${sectionName} AI 오류:`, e.message);
        return null;
      }
    };

    const [chongun, wealth, love, health, career] = await Promise.all([
      callAI(promptChongun, '총운'),
      callAI(promptWealth, '재물운'),
      callAI(promptLove, '애정운'),
      callAI(promptHealth, '건강운'),
      callAI(promptCareer, '직업운')
    ]);

    return {
      chongun: chongun || this.getFallbackChongun(sajuResult),
      wealth: wealth || this.getFallbackWealth(),
      love: love || this.getFallbackLove(),
      health: health || this.getFallbackHealth(),
      career: career || this.getFallbackCareer()
    };
  }

  // ===== 상세 신년운세 Fallback =====
  getFallbackChongun(sajuResult) {
    const p = sajuResult.personality;
    return {
      year_theme: `${p.title}의 기운이 병오년 화(火)를 만나 변화의 한 해`,
      year_keyword: '변화도약',
      year_overview: '2026년 병오년은 화(火) 기운이 강한 해입니다. 열정과 변화의 에너지가 찾아오며 새로운 시도를 하기 좋은 시기입니다. 상반기에는 준비와 계획에 집중하고, 하반기에는 실행에 옮기면 좋은 결과를 얻을 수 있습니다. 다만 급한 성격을 경계하고 신중함을 유지하는 것이 중요합니다. 주변 사람들과의 협력이 큰 힘이 될 것입니다.',
      opportunity: '상반기에 새로운 기회가 찾아올 가능성이 높습니다. 특히 봄철에는 인맥을 통한 좋은 소식이 기대됩니다. 적극적으로 네트워킹에 참여하면 뜻밖의 기회를 잡을 수 있습니다. 자기계발에 투자하면 하반기에 그 결실을 볼 수 있습니다.',
      crisis: '여름철에는 급한 결정을 피해야 합니다. 감정적인 판단이 큰 손실로 이어질 수 있으니 한 템포 쉬어가는 지혜가 필요합니다. 건강 관리에도 소홀하지 마세요. 과로를 피하고 충분한 휴식을 취하는 것이 중요합니다.',
      relationship_overview: '대인관계가 활발해지는 한 해입니다. 새로운 만남을 통해 시야가 넓어질 수 있습니다. 다만 모든 사람을 믿지 말고 신뢰할 수 있는 사람을 잘 가려내세요.',
      advice: '올해는 변화를 두려워하지 말되, 준비된 변화를 추구하세요. 꾸준한 노력이 연말에 큰 결실로 돌아올 것입니다. 건강을 최우선으로 챙기고, 가까운 사람들과의 관계를 소중히 하세요. 감사하는 마음으로 하루하루를 보내면 행운이 따를 것입니다.'
    };
  }

  getFallbackWealth() {
    return {
      overview: '2026년 재물운은 전반적으로 안정적인 흐름을 보입니다. 상반기에는 지출 관리에 신경쓰고, 하반기에는 새로운 수입원이 생길 수 있습니다. 투자는 신중하게 접근하세요.',
      monthly_scores: [65, 60, 70, 80, 55, 40, 45, 70, 75, 60, 80, 85],
      good_months: [{ month: 4, reason: '봄의 기운과 함께 재물운이 상승합니다.' }, { month: 12, reason: '한 해의 노력이 결실을 맺는 시기입니다.' }],
      bad_months: [{ month: 6, reason: '불필요한 지출이 늘어날 수 있으니 주의하세요.' }],
      strategy: ['저축 우선: 매달 일정 금액을 저축하는 습관을 들이세요.', '투자 신중: 큰 투자는 전문가와 상의 후 결정하세요.', '부업 고려: 관심 분야에서 추가 수입을 만들어보세요.'],
      warning_people: ['과시형 인물: 화려한 말로 투자를 권유하는 사람을 조심하세요.', '빚 요청형: 돈을 빌려달라는 요청에 신중히 대응하세요.'],
      summary: '전반적으로 무난한 재물운이나, 여름철 지출 관리가 관건입니다. 꾸준한 저축과 신중한 투자로 안정적인 재정을 유지하세요.'
    };
  }

  getFallbackLove() {
    return {
      overview: '2026년 애정운은 새로운 만남과 깊어지는 관계의 에너지가 공존합니다. 봄과 가을에 특히 좋은 인연이 기대됩니다.',
      monthly_scores: [70, 75, 80, 85, 50, 35, 40, 80, 70, 55, 75, 85],
      ideal_partner: { personality: '안정감 있고 이해심 깊은 성격', appearance: '차분하고 단정한 분위기', job_field: '교육, 의료, 전문직', tags: ['#안정감', '#이해심', '#지적인', '#따뜻한', '#신뢰감'] },
      single_advice: {
        good_months: [{ month: 4, strategy: '봄에 활발한 사교 활동을 하면 좋은 인연을 만날 수 있습니다.' }],
        bad_months: [{ month: 6, warning: '감정에 휘둘리지 말고 냉정하게 판단하세요.' }],
        meeting_places: '문화 행사, 동호회, 지인 소개가 좋은 만남 채널입니다.',
        charm_items: '깔끔한 향수와 단정한 스타일이 매력을 높여줍니다.'
      },
      couple_advice: {
        good_months: [{ month: 4, tip: '함께 여행을 계획하면 관계가 깊어집니다.' }],
        bad_months: [{ month: 6, warning: '사소한 다툼이 커질 수 있으니 대화로 해결하세요.' }],
        couple_items: '커플 액세서리나 공유 취미가 관계를 강화합니다.',
        date_spots: '자연 속 산책, 문화 공간 방문이 추천됩니다.'
      },
      summary: '사랑에 적극적으로 나서되, 진심을 담아 다가가세요. 좋은 인연은 반드시 찾아올 것입니다.'
    };
  }

  getFallbackHealth() {
    return {
      overview: '2026년 건강운은 상반기 관리가 중요합니다. 규칙적인 생활 습관을 유지하면 큰 문제 없이 건강한 한 해를 보낼 수 있습니다.',
      constitution: '화 기운이 강한 해이므로 심장과 혈액순환에 주의가 필요합니다. 충분한 수분 섭취와 규칙적인 운동이 중요합니다.',
      monthly_scores: [75, 65, 70, 85, 50, 35, 40, 60, 70, 55, 85, 90],
      diseases: [{ name: '심혈관 질환', desc: '화 기운이 강해 심장에 부담이 갈 수 있습니다.' }],
      good_foods: [{ name: '녹색 채소', reason: '목 기운을 보충하여 균형을 맞춰줍니다.' }],
      bad_foods: [{ name: '매운 음식', reason: '이미 강한 화 기운을 더 높일 수 있습니다.' }],
      supplements: [{ name: '오메가3', reason: '혈액순환 개선에 도움이 됩니다.' }],
      good_exercises: [{ name: '수영', reason: '수 기운을 보충하고 전신 운동 효과가 있습니다.' }],
      bad_exercises: [{ name: '과도한 유산소', reason: '무리한 운동은 심장에 부담을 줄 수 있습니다.' }],
      lifestyle_good: [{ habit: '규칙적인 수면', reason: '체력 회복과 면역력 강화에 필수입니다.' }],
      lifestyle_bad: [{ habit: '야식', reason: '소화기에 부담을 주고 수면의 질을 떨어뜨립니다.' }],
      summary: '건강은 예방이 최선입니다. 규칙적인 생활과 적절한 운동으로 건강한 한 해를 보내세요.'
    };
  }

  getFallbackCareer() {
    return {
      overview: '2026년 직업운은 변화와 성장의 기회가 공존합니다. 새로운 프로젝트나 역할에 도전해볼 좋은 시기입니다.',
      monthly_scores: [70, 60, 65, 90, 45, 30, 35, 65, 70, 50, 80, 90],
      reputation: '주변에서 당신의 능력을 인정받는 시기입니다. 꾸준한 성과가 좋은 평판으로 이어질 것입니다.',
      helpful_people: [{ type: '멘토형 선배', desc: '경험이 풍부한 선배의 조언이 큰 도움이 됩니다.' }],
      dangerous_people: [{ type: '무임승차형 동료', desc: '당신의 성과를 가로채려는 사람을 조심하세요.' }],
      employee_advice: '맡은 일에 최선을 다하되, 자기 PR도 잊지 마세요. 상반기에 실력을 쌓고 하반기에 성과를 보여주면 승진이나 인정의 기회가 옵니다.',
      business_advice: '새로운 시장 개척보다는 기존 사업의 내실을 다지는 데 집중하세요. 하반기에 사업 확장의 좋은 기회가 찾아올 수 있습니다.',
      good_months: [{ month: 4, opportunity: '새로운 프로젝트 시작에 좋은 시기입니다.' }],
      bad_months: [{ month: 6, warning: '직장 내 갈등이 생길 수 있으니 신중하게 행동하세요.' }],
      summary: '꾸준한 노력이 인정받는 한 해입니다. 겸손하되 자신감을 가지고 도전하세요.'
    };
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

}

module.exports = SajuInterpreter;
