// 천간 (天干) - 10개
const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const CHEONGAN_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 지지 (地支) - 12개
const JIJI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
const JIJI_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 띠 동물
const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
const ANIMAL_EMOJI = ['🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐑', '🐵', '🐔', '🐶', '🐷'];

// 오행 (五行)
const OHENG = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수'
};

const OHENG_JIJI = {
  '자': '수', '축': '토',
  '인': '목', '묘': '목',
  '진': '토', '사': '화',
  '오': '화', '미': '토',
  '신': '금', '유': '금',
  '술': '토', '해': '수'
};

const OHENG_COLOR = {
  '목': '#22c55e', // 초록
  '화': '#ef4444', // 빨강
  '토': '#eab308', // 노랑
  '금': '#a1a1aa', // 은회색
  '수': '#3b82f6'  // 파랑
};

const OHENG_EMOJI = {
  '목': '🌳',
  '화': '🔥',
  '토': '⛰️',
  '금': '⚔️',
  '수': '💧'
};

// 음양
const EUMYANG_CHEONGAN = {
  '갑': '양', '을': '음',
  '병': '양', '정': '음',
  '무': '양', '기': '음',
  '경': '양', '신': '음',
  '임': '양', '계': '음'
};

const EUMYANG_JIJI = {
  '자': '양', '축': '음',
  '인': '양', '묘': '음',
  '진': '양', '사': '음',
  '오': '양', '미': '음',
  '신': '양', '유': '음',
  '술': '양', '해': '음'
};

// 십성 (十星) - 일간 기준 다른 천간과의 관계
const SIPSUNG_MAP = {
  same_yang: '비견',    // 같은 오행, 같은 음양
  same_eum: '겁재',     // 같은 오행, 다른 음양
  generate_yang: '식신', // 내가 생하는 오행, 같은 음양
  generate_eum: '상관',  // 내가 생하는 오행, 다른 음양
  wealth_yang: '편재',   // 내가 극하는 오행, 같은 음양
  wealth_eum: '정재',    // 내가 극하는 오행, 다른 음양
  power_yang: '편관',    // 나를 극하는 오행, 같은 음양
  power_eum: '정관',     // 나를 극하는 오행, 다른 음양
  seal_yang: '편인',     // 나를 생하는 오행, 같은 음양
  seal_eum: '정인'       // 나를 생하는 오행, 다른 음양
};

// 오행 상생상극
const OHENG_GENERATE = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' }; // 생
const OHENG_CONTROL = { '목': '토', '토': '수', '수': '화', '화': '금', '금': '목' };  // 극

// 60갑자
const GANJI_60 = [];
for (let i = 0; i < 60; i++) {
  GANJI_60.push(CHEONGAN[i % 10] + JIJI[i % 12]);
}

// 월주 천간 결정표 (년간 기준)
// 년간이 갑/기 → 월천간 시작: 병(2)
// 년간이 을/경 → 월천간 시작: 무(4)
// 년간이 병/신 → 월천간 시작: 경(6)
// 년간이 정/임 → 월천간 시작: 임(8)
// 년간이 무/계 → 월천간 시작: 갑(0)
const MONTH_CHEONGAN_START = {
  '갑': 2, '기': 2,
  '을': 4, '경': 4,
  '병': 6, '신': 6,
  '정': 8, '임': 8,
  '무': 0, '계': 0
};

// 시주 천간 결정표 (일간 기준)
const HOUR_CHEONGAN_START = {
  '갑': 0, '기': 0,
  '을': 2, '경': 2,
  '병': 4, '신': 4,
  '정': 6, '임': 6,
  '무': 8, '계': 8
};

// 절기 데이터 (양력 기준 대략적 날짜 - 월 구분용)
// 사주의 월은 절기 기준: 입춘~경칩 = 인월(1월), 경칩~청명 = 묘월(2월), ...
const JEOLGI_MONTHS = [
  { month: 1, jiji: '인', start_month: 2, start_day: 4 },   // 입춘
  { month: 2, jiji: '묘', start_month: 3, start_day: 6 },   // 경칩
  { month: 3, jiji: '진', start_month: 4, start_day: 5 },   // 청명
  { month: 4, jiji: '사', start_month: 5, start_day: 6 },   // 입하
  { month: 5, jiji: '오', start_month: 6, start_day: 6 },   // 망종
  { month: 6, jiji: '미', start_month: 7, start_day: 7 },   // 소서
  { month: 7, jiji: '신', start_month: 8, start_day: 7 },   // 입추
  { month: 8, jiji: '유', start_month: 9, start_day: 8 },   // 백로
  { month: 9, jiji: '술', start_month: 10, start_day: 8 },  // 한로
  { month: 10, jiji: '해', start_month: 11, start_day: 7 }, // 입동
  { month: 11, jiji: '자', start_month: 12, start_day: 7 }, // 대설
  { month: 12, jiji: '축', start_month: 1, start_day: 6 }   // 소한
];

// 시간대 → 지지 매핑
const HOUR_TO_JIJI = [
  { start: 23, end: 1, jiji: '자', idx: 0 },
  { start: 1, end: 3, jiji: '축', idx: 1 },
  { start: 3, end: 5, jiji: '인', idx: 2 },
  { start: 5, end: 7, jiji: '묘', idx: 3 },
  { start: 7, end: 9, jiji: '진', idx: 4 },
  { start: 9, end: 11, jiji: '사', idx: 5 },
  { start: 11, end: 13, jiji: '오', idx: 6 },
  { start: 13, end: 15, jiji: '미', idx: 7 },
  { start: 15, end: 17, jiji: '신', idx: 8 },
  { start: 17, end: 19, jiji: '유', idx: 9 },
  { start: 19, end: 21, jiji: '술', idx: 10 },
  { start: 21, end: 23, jiji: '해', idx: 11 }
];

// 십이운성 (十二運星) 단계 이름
const UNSUNG_STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];

// 십이운성 설명
const UNSUNG_DESC = {
  '장생': '새로운 시작, 성장의 에너지',
  '목욕': '변화와 불안정, 새로운 시도',
  '관대': '자신감, 사회적 성장',
  '건록': '안정과 실력 발휘',
  '제왕': '최고의 전성기, 절정의 힘',
  '쇠': '서서히 하강, 안정 추구',
  '병': '약해지는 기운, 휴식 필요',
  '사': '끝과 새 시작의 기로',
  '묘': '잠재력 저장, 내면 성장',
  '절': '단절과 새로운 가능성',
  '태': '새 생명의 시작, 가능성',
  '양': '성장 준비, 보호와 양육'
};

// 십이운성 매핑 테이블: SIPYI_UNSUNG[천간][지지] → 운성 이름
// 각 천간의 장생 시작 지지 및 순행/역행 정보
// 순행: 자→축→인→묘→진→사→오→미→신→유→술→해 순서
// 역행: 자→해→술→유→신→미→오→사→진→묘→인→축 역순
const SIPYI_UNSUNG = {};
(function buildSipyiUnsung() {
  // [천간, 장생시작지지, 순행여부]
  const config = [
    ['갑', '해', true],
    ['을', '오', false],
    ['병', '인', true],
    ['정', '유', false],
    ['무', '인', true],
    ['기', '유', false],
    ['경', '사', true],
    ['신', '자', false],
    ['임', '신', true],
    ['계', '묘', false]
  ];

  config.forEach(([gan, startJiji, forward]) => {
    SIPYI_UNSUNG[gan] = {};
    const startIdx = JIJI.indexOf(startJiji);
    for (let i = 0; i < 12; i++) {
      let jijiIdx;
      if (forward) {
        jijiIdx = (startIdx + i) % 12;
      } else {
        jijiIdx = ((startIdx - i) % 12 + 12) % 12;
      }
      SIPYI_UNSUNG[gan][JIJI[jijiIdx]] = UNSUNG_STAGES[i];
    }
  });
})();

// 신살 (神殺) 조견표
// 삼합 그룹별 기준지지 매핑
const SINSAL_GROUPS = {
  '역마살': { '신': '인', '자': '인', '진': '인', '해': '사', '묘': '사', '미': '사', '인': '신', '오': '신', '술': '신', '사': '해', '유': '해', '축': '해' },
  '도화살': { '신': '유', '자': '유', '진': '유', '해': '자', '묘': '자', '미': '자', '인': '묘', '오': '묘', '술': '묘', '사': '오', '유': '오', '축': '오' },
  '화개살': { '신': '진', '자': '진', '진': '진', '해': '미', '묘': '미', '미': '미', '인': '술', '오': '술', '술': '술', '사': '축', '유': '축', '축': '축' }
};

// 신살 설명
const SINSAL_DESC = {
  '역마살': '이동, 변화, 활동이 많은 기운. 해외, 이사, 출장이 잦을 수 있음',
  '도화살': '매력, 인기, 이성운. 예술적 감각과 사교성이 뛰어남',
  '화개살': '학문, 예술, 종교적 기질. 깊은 사색과 정신적 세계에 관심'
};

/**
 * 신살 계산
 * @param {string} yearJiji - 년지
 * @param {Array} allPillars - 모든 기둥 [{jiji, name, ...}, ...]
 * @returns {Array} [{ name, jiji, pillar, desc }, ...]
 */
function getSinsal(yearJiji, allPillars) {
  const result = [];
  Object.entries(SINSAL_GROUPS).forEach(([sinsalName, map]) => {
    const targetJiji = map[yearJiji];
    if (!targetJiji) return;
    allPillars.forEach(p => {
      if (p.jiji === targetJiji) {
        result.push({
          name: sinsalName,
          jiji: targetJiji,
          pillar: p.name,
          desc: SINSAL_DESC[sinsalName]
        });
      }
    });
  });
  return result;
}

// 일간별 성격 키워드
const ILGAN_PERSONALITY = {
  '갑': { title: '큰 나무', desc: '리더십, 정직, 곧은 성품, 우직함', trait: '대들보 같은 존재감' },
  '을': { title: '꽃과 풀', desc: '유연함, 적응력, 섬세함, 인내력', trait: '부드러우나 강한 생명력' },
  '병': { title: '태양', desc: '열정, 밝음, 자신감, 화려함', trait: '모든 것을 비추는 존재' },
  '정': { title: '촛불', desc: '따뜻함, 배려, 집중력, 섬세함', trait: '은은하지만 꺼지지 않는 빛' },
  '무': { title: '큰 산', desc: '안정감, 신뢰, 포용력, 중후함', trait: '흔들리지 않는 대지' },
  '기': { title: '논밭', desc: '실용적, 꼼꼼함, 생산력, 봉사', trait: '만물을 기르는 대지' },
  '경': { title: '강철', desc: '결단력, 의리, 정의감, 카리스마', trait: '단단하고 날카로운 칼날' },
  '신': { title: '보석', desc: '완벽주의, 예리함, 세련됨, 지성', trait: '빛나는 보석 같은 존재' },
  '임': { title: '큰 바다', desc: '지혜, 포용력, 자유로움, 깊이', trait: '끝없이 넓은 바다' },
  '계': { title: '이슬비', desc: '감수성, 섬세함, 직감, 적응력', trait: '조용히 스며드는 힘' }
};

// 오행 보충 가이드 (부족한 오행을 보완하는 방법)
const OHENG_BALANCE_GUIDE = {
  '목': {
    color: ['초록색', '청록색'],
    direction: '동쪽',
    season: '봄',
    number: [3, 8],
    food: ['푸른 채소', '신맛 음식', '간 건강 음식'],
    activity: ['등산', '산림욕', '원예'],
    item: ['나무 소재 액세서리', '관엽식물'],
    body: '간, 담, 눈, 근육'
  },
  '화': {
    color: ['빨간색', '보라색'],
    direction: '남쪽',
    season: '여름',
    number: [2, 7],
    food: ['쓴맛 음식', '붉은색 음식', '심장 건강 음식'],
    activity: ['러닝', '핫요가', '사교 활동'],
    item: ['빨간 소품', '캔들'],
    body: '심장, 소장, 혀, 혈관'
  },
  '토': {
    color: ['노란색', '갈색', '베이지'],
    direction: '중앙',
    season: '환절기',
    number: [5, 10],
    food: ['단맛 음식', '노란색 음식', '위장 건강 음식'],
    activity: ['요가', '명상', '도자기'],
    item: ['도자기', '흙 소재 인테리어'],
    body: '위장, 비장, 입, 피부'
  },
  '금': {
    color: ['흰색', '은색', '금색'],
    direction: '서쪽',
    season: '가을',
    number: [4, 9],
    food: ['매운맛 음식', '흰색 음식', '폐 건강 음식'],
    activity: ['호흡 운동', '악기 연주', '공예'],
    item: ['금속 액세서리', '시계'],
    body: '폐, 대장, 코, 피부'
  },
  '수': {
    color: ['검은색', '남색', '파란색'],
    direction: '북쪽',
    season: '겨울',
    number: [1, 6],
    food: ['짠맛 음식', '검은색 음식', '신장 건강 음식'],
    activity: ['수영', '명상', '독서'],
    item: ['수정', '물 관련 인테리어'],
    body: '신장, 방광, 귀, 뼈'
  }
};

// 60갑자 일주론 (일주별 특성)
const ILJU_SPECIAL = {
  '갑자': { title: '바다 위의 큰 나무', trait: '지혜롭고 리더십이 강하며, 큰 뜻을 품고 있습니다' },
  '갑인': { title: '숲속의 큰 나무', trait: '당당하고 자존심이 강하며, 자립심이 뛰어납니다' },
  '갑진': { title: '비를 부르는 용', trait: '야망이 크고 변화를 주도하는 혁신가입니다' },
  '갑오': { title: '초원의 거목', trait: '열정적이고 활발하며, 행동력이 뛰어납니다' },
  '갑신': { title: '가을 숲의 나무', trait: '실용적이고 결단력이 있으며, 변화에 능합니다' },
  '갑술': { title: '산 위의 소나무', trait: '고독하지만 강인하며, 지조가 굳습니다' },
  '을축': { title: '얼어붙은 풀', trait: '인내심이 강하고 끈기 있으며, 실속을 추구합니다' },
  '을묘': { title: '봄날의 꽃', trait: '섬세하고 예술적이며, 인간관계가 좋습니다' },
  '을사': { title: '뜨거운 대지의 풀', trait: '적응력이 뛰어나고 임기응변에 강합니다' },
  '을미': { title: '정원의 화초', trait: '온화하고 배려심이 깊으며, 봉사 정신이 있습니다' },
  '을유': { title: '가을 들판의 풀', trait: '예리하고 분석적이며, 완벽을 추구합니다' },
  '을해': { title: '물가의 수초', trait: '유연하고 지혜로우며, 깊은 사고력을 가졌습니다' },
  '병자': { title: '겨울의 태양', trait: '따뜻한 마음을 가졌으며, 희망을 주는 존재입니다' },
  '병인': { title: '새벽의 태양', trait: '에너지가 넘치고 개척 정신이 강합니다' },
  '병진': { title: '무지개 너머의 태양', trait: '화려하고 카리스마 있으며, 꿈이 큽니다' },
  '병오': { title: '한낮의 태양', trait: '열정의 절정이며, 강렬한 존재감을 가졌습니다' },
  '병신': { title: '석양', trait: '성숙하고 원숙하며, 예술적 감각이 뛰어납니다' },
  '병술': { title: '산 너머의 태양', trait: '이상을 추구하며, 따뜻한 리더십을 가졌습니다' },
  '정축': { title: '토기 속의 불', trait: '내면의 열정이 강하며, 집중력이 뛰어납니다' },
  '정묘': { title: '봄밤의 촛불', trait: '로맨틱하고 감성적이며, 예술적 재능이 있습니다' },
  '정사': { title: '용광로의 불', trait: '변화를 두려워하지 않는 강인한 의지의 소유자입니다' },
  '정미': { title: '여름밤의 등불', trait: '따뜻하고 헌신적이며, 가정적입니다' },
  '정유': { title: '보석을 비추는 빛', trait: '세련되고 지적이며, 감각이 탁월합니다' },
  '정해': { title: '바다의 등대', trait: '희생정신이 강하고 다른 사람을 이끄는 힘이 있습니다' },
  '무자': { title: '비 오는 날의 대지', trait: '포용력이 크고 재물복이 있습니다' },
  '무인': { title: '봄산', trait: '생명력이 넘치고 포용적이며 활동적입니다' },
  '무진': { title: '태산', trait: '넓은 도량과 큰 그릇을 가졌으며, 중후합니다' },
  '무오': { title: '뜨거운 대지', trait: '열정적이고 활발하며, 추진력이 강합니다' },
  '무신': { title: '가을 들판', trait: '결실을 맺는 실용주의자이며, 지혜롭습니다' },
  '무술': { title: '거대한 바위산', trait: '우직하고 믿음직하며, 한번 정한 것은 끝까지 합니다' },
  '기축': { title: '겨울 논밭', trait: '내실을 다지는 실속파이며, 근면 성실합니다' },
  '기묘': { title: '봄 정원', trait: '섬세하고 감각적이며, 예술적 안목이 있습니다' },
  '기사': { title: '화산 토양', trait: '변화를 만들어내는 창조적 에너지가 있습니다' },
  '기미': { title: '비옥한 대지', trait: '배려심이 깊고 생산적이며, 사람을 키우는 힘이 있습니다' },
  '기유': { title: '황금 들판', trait: '실용적이고 효율적이며, 결과를 중시합니다' },
  '기해': { title: '물가의 옥토', trait: '지혜롭고 유연하며, 재물 복이 있습니다' },
  '경자': { title: '겨울의 강철', trait: '냉철하고 판단력이 뛰어나며, 지략이 있습니다' },
  '경인': { title: '새벽의 칼', trait: '결단력이 강하고 개척 정신이 있습니다' },
  '경진': { title: '용의 갑옷', trait: '야심이 크고 능력이 뛰어나며, 권위가 있습니다' },
  '경오': { title: '타오르는 검', trait: '열정적인 실행력과 강한 추진력을 가졌습니다' },
  '경신': { title: '단련된 강철', trait: '자기 관리가 철저하고 완벽주의적입니다' },
  '경술': { title: '녹슨 명검', trait: '숨겨진 실력이 있으며, 때를 기다리는 인내가 있습니다' },
  '신축': { title: '땅속의 보석', trait: '겸손하지만 내면의 가치가 빛나는 사람입니다' },
  '신묘': { title: '봄날의 은장도', trait: '우아하고 섬세하며, 예술적 재능이 있습니다' },
  '신사': { title: '불에 단련된 금', trait: '시련을 통해 성장하며, 강인한 정신력을 가졌습니다' },
  '신미': { title: '황금 브로치', trait: '세련되고 품위 있으며, 사교적입니다' },
  '신유': { title: '빛나는 다이아몬드', trait: '완벽을 추구하고 높은 기준을 가졌습니다' },
  '신해': { title: '바다 속 진주', trait: '깊은 내면의 아름다움과 지혜를 가졌습니다' },
  '임자': { title: '깊은 바다', trait: '무한한 가능성과 깊은 지혜를 품고 있습니다' },
  '임인': { title: '봄비', trait: '생명력을 불어넣는 힘이 있으며, 창의적입니다' },
  '임진': { title: '폭포', trait: '강력한 추진력과 변화를 일으키는 에너지가 있습니다' },
  '임오': { title: '무지개를 만드는 비', trait: '감성적이고 낭만적이며, 예술적 영감이 풍부합니다' },
  '임신': { title: '가을 호수', trait: '맑고 투명한 지성을 가졌으며, 분석력이 뛰어납니다' },
  '임술': { title: '구름 속의 비', trait: '때를 기다리는 인내심이 있으며, 잠재력이 큽니다' },
  '계축': { title: '얼음 아래 물', trait: '차분하고 인내심이 강하며, 내면이 풍부합니다' },
  '계묘': { title: '봄날의 이슬', trait: '섬세하고 감수성이 풍부하며, 치유의 힘이 있습니다' },
  '계사': { title: '뜨거운 안개', trait: '신비로운 매력이 있으며, 직감이 뛰어납니다' },
  '계미': { title: '여름 소나기', trait: '감정이 풍부하고 표현력이 뛰어납니다' },
  '계유': { title: '가을 서리', trait: '예리한 판단력과 냉정한 분석력을 가졌습니다' },
  '계해': { title: '대양', trait: '끝없는 포용력과 깊은 지혜, 무한한 가능성을 가졌습니다' }
};

module.exports = {
  CHEONGAN, CHEONGAN_HANJA, JIJI, JIJI_HANJA,
  ANIMALS, ANIMAL_EMOJI,
  OHENG, OHENG_JIJI, OHENG_COLOR, OHENG_EMOJI,
  EUMYANG_CHEONGAN, EUMYANG_JIJI,
  SIPSUNG_MAP, OHENG_GENERATE, OHENG_CONTROL,
  GANJI_60, MONTH_CHEONGAN_START, HOUR_CHEONGAN_START,
  JEOLGI_MONTHS, HOUR_TO_JIJI, ILGAN_PERSONALITY,
  SIPYI_UNSUNG, UNSUNG_STAGES, UNSUNG_DESC,
  SINSAL_GROUPS, SINSAL_DESC, getSinsal,
  OHENG_BALANCE_GUIDE, ILJU_SPECIAL
};
