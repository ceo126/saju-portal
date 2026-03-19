const {
  CHEONGAN, CHEONGAN_HANJA, JIJI, JIJI_HANJA,
  ANIMALS, ANIMAL_EMOJI,
  OHENG, OHENG_JIJI, OHENG_COLOR, OHENG_EMOJI,
  EUMYANG_CHEONGAN, EUMYANG_JIJI,
  OHENG_GENERATE, OHENG_CONTROL,
  GANJI_60, MONTH_CHEONGAN_START, HOUR_CHEONGAN_START,
  JEOLGI_MONTHS, HOUR_TO_JIJI, ILGAN_PERSONALITY
} = require('./saju-data');

class SajuEngine {
  /**
   * 사주팔자 계산
   * @param {number} year - 양력 년도
   * @param {number} month - 양력 월 (1~12)
   * @param {number} day - 양력 일
   * @param {number} hour - 시간 (0~23), -1이면 시주 없음
   * @param {string} gender - 'male' or 'female'
   */
  calculate(year, month, day, hour = -1, gender = 'male') {
    // 년주 계산
    const yearPillar = this.getYearPillar(year, month, day);

    // 월주 계산
    const monthPillar = this.getMonthPillar(year, month, day, yearPillar.cheongan);

    // 일주 계산
    const dayPillar = this.getDayPillar(year, month, day);

    // 시주 계산
    let hourPillar = null;
    if (hour >= 0) {
      hourPillar = this.getHourPillar(hour, dayPillar.cheongan);
    }

    // 오행 분석
    const ohengAnalysis = this.analyzeOheng(yearPillar, monthPillar, dayPillar, hourPillar);

    // 일간 성격
    const personality = ILGAN_PERSONALITY[dayPillar.cheongan];

    // 띠
    const jijiIdx = JIJI.indexOf(yearPillar.jiji);
    const animal = ANIMALS[jijiIdx];
    const animalEmoji = ANIMAL_EMOJI[jijiIdx];

    // 음양 비율
    const eumyangRatio = this.analyzeEumyang(yearPillar, monthPillar, dayPillar, hourPillar);

    return {
      yearPillar: this.formatPillar(yearPillar, '년주'),
      monthPillar: this.formatPillar(monthPillar, '월주'),
      dayPillar: this.formatPillar(dayPillar, '일주'),
      hourPillar: hourPillar ? this.formatPillar(hourPillar, '시주') : null,
      ilgan: dayPillar.cheongan,
      personality,
      animal,
      animalEmoji,
      ohengAnalysis,
      eumyangRatio,
      gender,
      birthInfo: { year, month, day, hour }
    };
  }

  // 년주 계산 (입춘 기준)
  getYearPillar(year, month, day) {
    let sajuYear = year;
    // 입춘 전이면 전년도
    if (month < 2 || (month === 2 && day < 4)) {
      sajuYear = year - 1;
    }
    const idx = (sajuYear - 4) % 60;
    const ganIdx = (sajuYear - 4) % 10;
    const jiIdx = (sajuYear - 4) % 12;
    return {
      cheongan: CHEONGAN[ganIdx],
      cheonganHanja: CHEONGAN_HANJA[ganIdx],
      jiji: JIJI[jiIdx],
      jijiHanja: JIJI_HANJA[jiIdx],
      ganji: GANJI_60[((idx % 60) + 60) % 60]
    };
  }

  // 월주 계산 (절기 기준)
  getMonthPillar(year, month, day, yearCheongan) {
    // 절기 기준으로 사주 월 결정
    let sajuMonth = this.getSajuMonth(month, day);

    // 월지 결정
    const monthJijiIdx = (sajuMonth + 1) % 12; // 인월(1월)=2, 묘월(2월)=3, ...
    const jiji = JIJI[monthJijiIdx];
    const jijiHanja = JIJI_HANJA[monthJijiIdx];

    // 월간 결정
    const startIdx = MONTH_CHEONGAN_START[yearCheongan];
    const ganIdx = (startIdx + (sajuMonth - 1)) % 10;
    const cheongan = CHEONGAN[ganIdx];
    const cheonganHanja = CHEONGAN_HANJA[ganIdx];

    return { cheongan, cheonganHanja, jiji, jijiHanja, ganji: cheongan + jiji };
  }

  // 절기 기준 사주 월 (1~12)
  getSajuMonth(month, day) {
    // 소한(1/6) ~ 입춘(2/4) = 축월(12)
    // 입춘(2/4) ~ 경칩(3/6) = 인월(1)
    for (let i = 0; i < JEOLGI_MONTHS.length; i++) {
      const curr = JEOLGI_MONTHS[i];
      const next = JEOLGI_MONTHS[(i + 1) % 12];

      if (curr.start_month <= next.start_month) {
        if ((month === curr.start_month && day >= curr.start_day) ||
            (month > curr.start_month && month < next.start_month) ||
            (month === next.start_month && day < next.start_day)) {
          return curr.month;
        }
      } else {
        // 12월 → 1월 경계 (대설~소한)
        if ((month === curr.start_month && day >= curr.start_day) ||
            (month > curr.start_month) ||
            (month < next.start_month) ||
            (month === next.start_month && day < next.start_day)) {
          return curr.month;
        }
      }
    }
    return 1; // 기본값
  }

  // 일주 계산 (기준일로부터 계산)
  getDayPillar(year, month, day) {
    // 기준일: 2000년 1월 1일 = 병자일 (index 12)
    // UTC 사용하여 DST(일광절약시간) 영향 방지
    const baseDate = Date.UTC(2000, 0, 1);
    const targetDate = Date.UTC(year, month - 1, day);
    const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));

    const baseIdx = 12; // 2000-01-01 = 병자일 (index 12 in 60 cycle)
    let idx = ((baseIdx + diffDays) % 60 + 60) % 60;

    const ganIdx = idx % 10;
    const jiIdx = idx % 12;

    return {
      cheongan: CHEONGAN[ganIdx],
      cheonganHanja: CHEONGAN_HANJA[ganIdx],
      jiji: JIJI[jiIdx],
      jijiHanja: JIJI_HANJA[jiIdx],
      ganji: CHEONGAN[ganIdx] + JIJI[jiIdx]
    };
  }

  // 시주 계산
  getHourPillar(hour, dayCheongan) {
    // 시간 범위 방어 (0~23)
    hour = Math.max(0, Math.min(23, Math.floor(hour)));

    // 시간 → 지지
    let jijiIdx = 0;
    if (hour === 23 || hour === 0) jijiIdx = 0;
    else jijiIdx = Math.floor((hour + 1) / 2);

    const jiji = JIJI[jijiIdx];
    const jijiHanja = JIJI_HANJA[jijiIdx];

    // 시간 → 천간
    const startIdx = HOUR_CHEONGAN_START[dayCheongan];
    const ganIdx = (startIdx + jijiIdx) % 10;
    const cheongan = CHEONGAN[ganIdx];
    const cheonganHanja = CHEONGAN_HANJA[ganIdx];

    return { cheongan, cheonganHanja, jiji, jijiHanja, ganji: cheongan + jiji };
  }

  // 기둥 포맷팅
  formatPillar(pillar, name) {
    return {
      name,
      cheongan: pillar.cheongan,
      cheonganHanja: pillar.cheonganHanja,
      jiji: pillar.jiji,
      jijiHanja: pillar.jijiHanja,
      ganji: pillar.ganji,
      cheonganOheng: OHENG[pillar.cheongan],
      jijiOheng: OHENG_JIJI[pillar.jiji],
      cheonganEumyang: EUMYANG_CHEONGAN[pillar.cheongan],
      jijiEumyang: EUMYANG_JIJI[pillar.jiji],
      cheonganColor: OHENG_COLOR[OHENG[pillar.cheongan]],
      jijiColor: OHENG_COLOR[OHENG_JIJI[pillar.jiji]]
    };
  }

  // 오행 분석
  analyzeOheng(yearP, monthP, dayP, hourP) {
    const counts = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
    const pillars = [yearP, monthP, dayP];
    if (hourP) pillars.push(hourP);

    pillars.forEach(p => {
      counts[OHENG[p.cheongan]]++;
      counts[OHENG_JIJI[p.jiji]]++;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const percentages = {};
    Object.keys(counts).forEach(k => {
      percentages[k] = Math.round((counts[k] / total) * 100);
    });

    // 가장 강한/약한 오행
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    // 부족한 오행 찾기
    const missing = Object.entries(counts).filter(([k, v]) => v === 0).map(([k]) => k);

    return {
      counts,
      percentages,
      strongest: { name: strongest[0], count: strongest[1], emoji: OHENG_EMOJI[strongest[0]] },
      weakest: { name: weakest[0], count: weakest[1], emoji: OHENG_EMOJI[weakest[0]] },
      missing,
      total
    };
  }

  // 음양 분석
  analyzeEumyang(yearP, monthP, dayP, hourP) {
    let yang = 0, eum = 0;
    const pillars = [yearP, monthP, dayP];
    if (hourP) pillars.push(hourP);

    pillars.forEach(p => {
      if (EUMYANG_CHEONGAN[p.cheongan] === '양') yang++; else eum++;
      if (EUMYANG_JIJI[p.jiji] === '양') yang++; else eum++;
    });

    return { yang, eum, total: yang + eum };
  }

  // 궁합 계산
  calculateCompatibility(saju1, saju2) {
    let score = 50; // 기본 50점
    const details = [];

    // 1. 일간 오행 상생/상극 체크
    const oh1 = OHENG[saju1.ilgan];
    const oh2 = OHENG[saju2.ilgan];

    if (OHENG_GENERATE[oh1] === oh2 || OHENG_GENERATE[oh2] === oh1) {
      score += 20;
      details.push({ type: 'good', text: '일간 오행이 상생 관계로 서로를 살려줍니다' });
    } else if (OHENG_CONTROL[oh1] === oh2 || OHENG_CONTROL[oh2] === oh1) {
      score -= 10;
      details.push({ type: 'caution', text: '일간 오행이 상극 관계로 갈등이 생길 수 있습니다' });
    } else if (oh1 === oh2) {
      score += 10;
      details.push({ type: 'neutral', text: '같은 오행으로 공감대가 높습니다' });
    }

    // 2. 음양 조화
    const ey1 = EUMYANG_CHEONGAN[saju1.ilgan];
    const ey2 = EUMYANG_CHEONGAN[saju2.ilgan];
    if (ey1 !== ey2) {
      score += 10;
      details.push({ type: 'good', text: '음양이 조화를 이루어 균형 잡힌 관계입니다' });
    }

    // 3. 오행 보완 분석
    const missing1 = saju1.ohengAnalysis.missing;
    const strong2 = saju2.ohengAnalysis.strongest.name;
    const missing2 = saju2.ohengAnalysis.missing;
    const strong1 = saju1.ohengAnalysis.strongest.name;

    if (missing1.includes(strong2)) {
      score += 10;
      details.push({ type: 'good', text: `상대방이 부족한 ${strong2}(${OHENG_EMOJI[strong2]})을 보완해줍니다` });
    }
    if (missing2.includes(strong1)) {
      score += 10;
      details.push({ type: 'good', text: `내가 상대의 부족한 ${strong1}(${OHENG_EMOJI[strong1]})을 채워줍니다` });
    }

    // 점수 범위 조정
    score = Math.max(30, Math.min(98, score));

    return { score, details, saju1, saju2 };
  }

  // 오늘의 운세용 일진 정보
  getTodayInfo() {
    const today = new Date();
    const dayPillar = this.getDayPillar(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return {
      date: `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`,
      dayPillar,
      dayOheng: OHENG[dayPillar.cheongan],
      dayEmoji: OHENG_EMOJI[OHENG[dayPillar.cheongan]]
    };
  }

  // 특정 년도의 년주 계산 (세운용)
  getYearPillarForYear(year) {
    const ganIdx = ((year - 4) % 10 + 10) % 10;
    const jiIdx = ((year - 4) % 12 + 12) % 12;
    return {
      cheongan: CHEONGAN[ganIdx],
      cheonganHanja: CHEONGAN_HANJA[ganIdx],
      jiji: JIJI[jiIdx],
      jijiHanja: JIJI_HANJA[jiIdx],
      ganji: CHEONGAN[ganIdx] + JIJI[jiIdx]
    };
  }

  // 십성 계산: 일간과 대상 천간의 관계
  getSipsung(ilgan, targetCheongan) {
    const myOheng = OHENG[ilgan];
    const targetOheng = OHENG[targetCheongan];
    const myEumyang = EUMYANG_CHEONGAN[ilgan];
    const targetEumyang = EUMYANG_CHEONGAN[targetCheongan];
    const sameEumyang = (myEumyang === targetEumyang);

    // 같은 오행
    if (myOheng === targetOheng) {
      return sameEumyang ? '비견' : '겁재';
    }
    // 내가 생하는 오행
    if (OHENG_GENERATE[myOheng] === targetOheng) {
      return sameEumyang ? '식신' : '상관';
    }
    // 내가 극하는 오행
    if (OHENG_CONTROL[myOheng] === targetOheng) {
      return sameEumyang ? '편재' : '정재';
    }
    // 나를 극하는 오행
    if (OHENG_CONTROL[targetOheng] === myOheng) {
      return sameEumyang ? '편관' : '정관';
    }
    // 나를 생하는 오행
    if (OHENG_GENERATE[targetOheng] === myOheng) {
      return sameEumyang ? '편인' : '정인';
    }
    return '비견'; // fallback
  }

  // 지지 십성 계산 (지지의 본기 천간 기준)
  getSipsungJiji(ilgan, targetJiji) {
    // 지지의 본기(主氣) 천간 매핑
    const JIJI_BONGI = {
      '자': '계', '축': '기', '인': '갑', '묘': '을',
      '진': '무', '사': '병', '오': '정', '미': '기',
      '신': '경', '유': '신', '술': '무', '해': '임'
    };
    const bongi = JIJI_BONGI[targetJiji];
    if (!bongi) return '비견';
    return this.getSipsung(ilgan, bongi);
  }

  // 세운 분석 (2026 병오년)
  getSeunAnalysis(sajuResult) {
    const yearPillar2026 = this.getYearPillarForYear(2026);
    const ilgan = sajuResult.ilgan;
    const seunCheongan = yearPillar2026.cheongan; // 병
    const seunJiji = yearPillar2026.jiji;         // 오

    // 세운 천간/지지의 십성
    const seunCheonganSipsung = this.getSipsung(ilgan, seunCheongan);
    const seunJijiSipsung = this.getSipsungJiji(ilgan, seunJiji);

    // 사주 각 기둥의 십성 계산
    const pillars = ['yearPillar', 'monthPillar', 'dayPillar'];
    if (sajuResult.hourPillar) pillars.push('hourPillar');

    const pillarSipsung = {};
    pillars.forEach(key => {
      const p = sajuResult[key];
      pillarSipsung[key] = {
        cheonganSipsung: key === 'dayPillar' ? '일간' : this.getSipsung(ilgan, p.cheongan),
        jijiSipsung: this.getSipsungJiji(ilgan, p.jiji)
      };
    });

    // 충(沖) 체크: 지지 대충 관계
    const CHUNG_MAP = {
      '자': '오', '오': '자',
      '축': '미', '미': '축',
      '인': '신', '신': '인',
      '묘': '유', '유': '묘',
      '진': '술', '술': '진',
      '사': '해', '해': '사'
    };

    const chungList = [];
    pillars.forEach(key => {
      const p = sajuResult[key];
      if (CHUNG_MAP[seunJiji] === p.jiji) {
        chungList.push({ pillar: p.name, jiji: p.jiji, seunJiji: seunJiji });
      }
    });

    // 합(合) 체크: 지지 육합
    const HAP_MAP = {
      '자': '축', '축': '자',
      '인': '해', '해': '인',
      '묘': '술', '술': '묘',
      '진': '유', '유': '진',
      '사': '신', '신': '사',
      '오': '미', '미': '오'
    };

    const hapList = [];
    pillars.forEach(key => {
      const p = sajuResult[key];
      if (HAP_MAP[seunJiji] === p.jiji) {
        hapList.push({ pillar: p.name, jiji: p.jiji, seunJiji: seunJiji });
      }
    });

    // 천간 합 체크
    const CHEONGAN_HAP = {
      '갑': '기', '기': '갑',
      '을': '경', '경': '을',
      '병': '신', '신': '병',
      '정': '임', '임': '정',
      '무': '계', '계': '무'
    };

    const cheonganHapList = [];
    pillars.forEach(key => {
      const p = sajuResult[key];
      if (CHEONGAN_HAP[seunCheongan] === p.cheongan) {
        cheonganHapList.push({ pillar: p.name, cheongan: p.cheongan, seunCheongan: seunCheongan });
      }
    });

    // 신강/신약 판별
    const oheng = sajuResult.ohengAnalysis;
    const ilganOheng = OHENG[ilgan];
    // 나를 돕는 오행: 같은 오행 + 나를 생하는 오행
    const generateMe = Object.entries(OHENG_GENERATE).find(([k, v]) => v === ilganOheng);
    const helpOheng = generateMe ? generateMe[0] : null;
    const helpCount = oheng.counts[ilganOheng] + (helpOheng ? oheng.counts[helpOheng] : 0);
    const totalCount = oheng.total;
    const singang = helpCount >= (totalCount / 2) ? '신강' : '신약';
    const singangDesc = singang === '신강'
      ? '일간의 힘이 강하여 재성(편재/정재)과 관성(편관/정관)이 좋은 작용을 합니다.'
      : '일간의 힘이 약하여 인성(편인/정인)과 비겁(비견/겁재)이 좋은 작용을 합니다.';

    return {
      yearPillar2026,
      seunCheongan,
      seunJiji,
      seunCheonganOheng: OHENG[seunCheongan],
      seunJijiOheng: OHENG_JIJI[seunJiji],
      seunCheonganSipsung,
      seunJijiSipsung,
      pillarSipsung,
      chungList,
      hapList,
      cheonganHapList,
      singang,
      singangDesc,
      ilganOheng
    };
  }
}

module.exports = new SajuEngine();
