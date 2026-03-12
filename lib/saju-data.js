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
  '금': '#f8fafc', // 흰색(밝은회색)
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

module.exports = {
  CHEONGAN, CHEONGAN_HANJA, JIJI, JIJI_HANJA,
  ANIMALS, ANIMAL_EMOJI,
  OHENG, OHENG_JIJI, OHENG_COLOR, OHENG_EMOJI,
  EUMYANG_CHEONGAN, EUMYANG_JIJI,
  SIPSUNG_MAP, OHENG_GENERATE, OHENG_CONTROL,
  GANJI_60, MONTH_CHEONGAN_START, HOUR_CHEONGAN_START,
  JEOLGI_MONTHS, HOUR_TO_JIJI, ILGAN_PERSONALITY
};
