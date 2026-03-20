// ===== 전역 상태 =====
const state = {
  currentPage: 'home',
  genders: { basic: 'male', today: 'male', compat1: 'male', compat2: 'female', newyear: 'male' },
  loading: false
};

const lastResults = {};

// ===== 결과 텍스트 요약 (공유용) =====
function generateResultSummary(type, data) {
  if (!data) return '';
  let text = '🔮 사주포털 분석 결과\n';
  text += '━━━━━━━━━━━━━━━\n';

  if (type === 'basic') {
    var s = data.saju, interp = data.interpretation;
    text += '📅 ' + s.birthInfo.year + '\ub144 ' + s.birthInfo.month + '\uc6d4 ' + s.birthInfo.day + '\uc77c\uc0dd\n';
    text += '🎭 ' + s.personality.title + ' \xB7 ' + s.ilgan + '\uc77c\uac04\n';
    text += '🐾 ' + s.animal + '\ub744 ' + s.animalEmoji + '\n';
    if (s.iljuSpecial) text += '💎 ' + s.dayPillar.ganji + '\uc77c\uc8fc - ' + s.iljuSpecial.title + '\n';
    text += '\n📊 \uc624\ud589: \ubaa9' + s.ohengAnalysis.counts['\ubaa9'] + ' \ud654' + s.ohengAnalysis.counts['\ud654'] + ' \ud1a0' + s.ohengAnalysis.counts['\ud1a0'] + ' \uae08' + s.ohengAnalysis.counts['\uae08'] + ' \uc218' + s.ohengAnalysis.counts['\uc218'] + '\n';
    if (interp && interp.summary) text += '\n💬 ' + interp.summary + '\n';
  } else if (type === 'today') {
    var td = data.today, ti = data.interpretation;
    text += '📅 ' + td.date + '\n';
    text += '⭐ \uc624\ub298\uc758 \uc6b4\uc138: ' + ti.score + '\uc810\n';
    text += '💬 ' + ti.summary + '\n';
  } else if (type === 'compatibility') {
    var s1 = data.saju1, s2 = data.saju2, cp = data.compatibility;
    text += '💕 \uc0ac\uc8fc \uad81\ud569: ' + cp.score + '\uc810\n';
    text += s1.personality.title + ' \u2665 ' + s2.personality.title + '\n';
    if (cp.interpretation) text += '💬 ' + cp.interpretation.title + '\n';
  } else if (type === 'newyear') {
    var ns = data.saju, ni = data.interpretation;
    text += '🐎 2026 \ubcd1\uc624\ub144 \uc2e0\ub144\uc6b4\uc138\n';
    text += '🎭 ' + ns.personality.title + ' \xB7 ' + ns.ilgan + '\uc77c\uac04\n';
    if (ni && ni.chongun) {
      text += '🔑 ' + (ni.chongun.year_keyword || '') + '\n';
      text += '💬 ' + (ni.chongun.year_theme || '') + '\n';
    }
  }

  text += '\n━━━━━━━━━━━━━━━\n';
  text += '📱 \uc0ac\uc8fc\ud3ec\ud138\uc5d0\uc11c \ubb34\ub8cc\ub85c \ud655\uc778\ud558\uc138\uc694!';
  return text;
}

// ===== 온보딩 =====
function showOnboarding() {
  if (localStorage.getItem('saju_onboarded')) return;
  var overlay = document.getElementById('onboardingOverlay');
  if (overlay) overlay.classList.add('show');
}

function closeOnboarding() {
  var overlay = document.getElementById('onboardingOverlay');
  if (overlay) overlay.classList.remove('show');
  localStorage.setItem('saju_onboarded', '1');
}

// ===== 오프라인 알림 =====
window.addEventListener('online', function() { showToast('인터넷 연결이 복구되었습니다'); });
window.addEventListener('offline', function() { showToast('인터넷 연결이 끊어졌습니다. 일부 기능이 제한됩니다.'); });

// ===== Observer 메모리 누수 방지 =====
const activeObservers = [];

// 프론트엔드 에러 리포팅
window.addEventListener('error', (e) => {
  fetch('/api/log/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: e.message,
      source: e.filename,
      line: e.lineno
    })
  }).catch(() => {});
});

function cleanupObservers() {
  activeObservers.forEach(obs => obs.disconnect());
  activeObservers.length = 0;
}

// ===== 렌더링 에러 경계 =====
function safeRender(containerId, renderFn) {
  try {
    renderFn();
  } catch (e) {
    console.error('렌더링 오류:', e);
    document.getElementById(containerId).innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">결과 표시 중 오류가 발생했습니다</p><button class="retry-btn" onclick="resetForm('${containerId.replace('Result','')}')" >다시 시도</button></div>`;
  }
}

const OHENG_COLORS = {
  '목': '#22c55e',
  '화': '#ef4444',
  '토': '#d4a017',
  '금': '#94a3b8',
  '수': '#3b82f6'
};

// ===== 카운트업 애니메이션 =====
function animateCountUp(elementSelector, target, duration = 1000) {
  setTimeout(() => {
    const els = document.querySelectorAll(elementSelector);
    els.forEach(el => {
      if (target <= 0) { el.textContent = target; return; }
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) {
          start = target;
          clearInterval(timer);
        }
        el.textContent = Math.round(start);
      }, 16);
    });
  }, 300);
}

// ===== 오행 테마 설정 =====
function setOhengTheme(strongestOheng) {
  document.documentElement.style.setProperty('--oheng-accent', OHENG_COLORS[strongestOheng] || 'var(--accent)');
}

// ===== 사주 용어 사전 =====
const SAJU_GLOSSARY = [
  { term: '천간(天干)', desc: '하늘의 기운을 나타내는 10개의 글자: 갑을병정무기경신임계' },
  { term: '지지(地支)', desc: '땅의 기운을 나타내는 12개의 글자: 자축인묘진사오미신유술해' },
  { term: '사주팔자(四柱八字)', desc: '년·월·일·시 4개의 기둥(주)에 천간·지지 8글자로 이루어진 운명의 틀' },
  { term: '일간(日干)', desc: '일주의 천간으로, 사주에서 나 자신을 대표하는 핵심 글자' },
  { term: '오행(五行)', desc: '목(나무)·화(불)·토(흙)·금(쇠)·수(물) 다섯 가지 기운' },
  { term: '상생(相生)', desc: '오행이 서로 살려주는 관계: 목→화→토→금→수→목' },
  { term: '상극(相剋)', desc: '오행이 서로 억누르는 관계: 목→토→수→화→금→목' },
  { term: '음양(陰陽)', desc: '우주 만물의 두 가지 상반된 기운. 천간과 지지 각각에 음양이 있음' },
  { term: '십성(十星)', desc: '일간을 기준으로 다른 글자와의 관계를 나타내는 10가지 별: 비견·겁재·식신·상관·편재·정재·편관·정관·편인·정인' },
  { term: '비견(比肩)', desc: '나와 같은 오행, 같은 음양. 독립심과 경쟁심을 나타냄' },
  { term: '겁재(劫財)', desc: '나와 같은 오행, 다른 음양. 사교성과 승부욕을 나타냄' },
  { term: '식신(食神)', desc: '내가 생하는 오행, 같은 음양. 표현력과 재능을 나타냄' },
  { term: '상관(傷官)', desc: '내가 생하는 오행, 다른 음양. 창의력과 자유로움을 나타냄' },
  { term: '편재(偏財)', desc: '내가 극하는 오행, 같은 음양. 큰 재물과 투자를 나타냄' },
  { term: '정재(正財)', desc: '내가 극하는 오행, 다른 음양. 안정적 수입과 저축을 나타냄' },
  { term: '편관(偏官)', desc: '나를 극하는 오행, 같은 음양. 카리스마와 도전정신을 나타냄' },
  { term: '정관(正官)', desc: '나를 극하는 오행, 다른 음양. 명예와 책임감을 나타냄' },
  { term: '편인(偏印)', desc: '나를 생하는 오행, 같은 음양. 특별한 재능과 학문을 나타냄' },
  { term: '정인(正印)', desc: '나를 생하는 오행, 다른 음양. 학문과 지혜를 나타냄' },
  { term: '신강(身強)', desc: '일간의 힘이 강한 상태. 재성과 관성이 좋은 작용을 함' },
  { term: '신약(身弱)', desc: '일간의 힘이 약한 상태. 인성과 비겁이 좋은 작용을 함' },
  { term: '대운(大運)', desc: '10년 단위로 변화하는 큰 운의 흐름' },
  { term: '세운(歲運)', desc: '매년 변화하는 운의 흐름. 해당 년도의 간지로 판단' },
  { term: '십이운성(十二運星)', desc: '장생~양까지 12단계로 나타내는 기운의 성쇠 주기' },
  { term: '역마살(驛馬殺)', desc: '이동과 변화가 많은 신살. 해외 활동이나 이사에 유리' },
  { term: '도화살(桃花殺)', desc: '매력과 이성 인연을 나타내는 신살. 연예·예술에 유리' },
  { term: '화개살(華蓋殺)', desc: '학문과 종교적 감수성을 나타내는 신살. 연구·예술에 유리' },
  { term: '충(沖)', desc: '지지끼리 정반대 위치에서 부딪히는 관계. 변화와 갈등을 의미' },
  { term: '합(合)', desc: '천간이나 지지가 결합하는 관계. 인연과 결합을 의미' },
  { term: '형(刑)', desc: '지지끼리 해를 끼치는 관계. 갈등과 시련을 의미' }
];

function openGlossary() {
  const modal = document.getElementById('glossaryModal');
  renderGlossaryList(SAJU_GLOSSARY);
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeGlossary() {
  document.getElementById('glossaryModal').classList.remove('show');
  document.body.style.overflow = '';
  document.getElementById('glossarySearch').value = '';
}

let _glossaryTimer;
function filterGlossary(query) {
  clearTimeout(_glossaryTimer);
  _glossaryTimer = setTimeout(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? SAJU_GLOSSARY.filter(g => g.term.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q)) : SAJU_GLOSSARY;
    renderGlossaryList(filtered);
  }, 150);
}

function renderGlossaryList(items) {
  document.getElementById('glossaryList').innerHTML = items.map(g =>
    `<div class="glossary-item"><div class="gi-term">${esc(g.term)}</div><div class="gi-desc">${esc(g.desc)}</div></div>`
  ).join('');
}

// ===== XSS 방지: HTML 이스케이프 =====
function esc(str) {
  if (str == null) return '';
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

// ===== 폼 데이터 자동 저장/복원 (localStorage) =====
function saveFormData(prefix, genderKey) {
  try {
    const saved = JSON.parse(localStorage.getItem('saju_form_data') || '{}');
    saved[prefix] = {
      year: document.getElementById(`${prefix}Year`).value,
      month: document.getElementById(`${prefix}Month`).value,
      day: document.getElementById(`${prefix}Day`).value,
      hour: document.getElementById(`${prefix}Hour`).value,
      gender: state.genders[genderKey]
    };
    localStorage.setItem('saju_form_data', JSON.stringify(saved));
  } catch(e) { /* localStorage 실패 무시 */ }
}

function restoreFormData() {
  try {
    const saved = JSON.parse(localStorage.getItem('saju_form_data') || '{}');
    const prefixGenderMap = { basic: 'basic', today: 'today', compat1: 'compat1', compat2: 'compat2', newyear: 'newyear' };
    Object.keys(prefixGenderMap).forEach(prefix => {
      const d = saved[prefix];
      if (!d) return;
      const yEl = document.getElementById(`${prefix}Year`);
      const mEl = document.getElementById(`${prefix}Month`);
      const dEl = document.getElementById(`${prefix}Day`);
      const hEl = document.getElementById(`${prefix}Hour`);
      if (yEl && d.year) yEl.value = d.year;
      if (mEl && d.month) mEl.value = d.month;
      if (dEl && d.day) dEl.value = d.day;
      if (hEl && d.hour !== undefined) hEl.value = d.hour;
      if (d.gender) {
        state.genders[prefix] = d.gender;
        const container = yEl ? yEl.closest('.form-section') : null;
        if (container) {
          container.querySelectorAll(`.gender-btn`).forEach(b => {
            b.classList.toggle('active', b.dataset.gender === d.gender);
          });
        }
      }
    });
  } catch(e) { /* localStorage 실패 무시 */ }
}

// ===== 결과 공유 기능 =====
async function shareResult(title, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title: title, text: text, url: window.location.href });
    } catch(e) { /* 사용자 취소 */ }
  } else {
    try {
      await navigator.clipboard.writeText(text + '\n' + window.location.href);
      showToast('결과가 클립보드에 복사되었습니다!');
    } catch(e) {
      showToast('공유 기능을 사용할 수 없습니다.');
    }
  }
}

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ===== 결과 히스토리 (최근 5개) =====
function saveHistory(type, inputSummary, timestamp) {
  try {
    let history = JSON.parse(localStorage.getItem('saju_history') || '[]');
    history.unshift({ type: type, inputSummary: inputSummary, timestamp: timestamp });
    if (history.length > 5) history = history.slice(0, 5);
    localStorage.setItem('saju_history', JSON.stringify(history));
  } catch(e) { /* localStorage 실패 무시 */ }
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('saju_history') || '[]');
  } catch(e) { return []; }
}

function renderHistoryOnHome() {
  const history = getHistory();
  const section = document.getElementById('historySection');
  const list = document.getElementById('historyList');
  if (!section || !list || history.length === 0) return;
  section.style.display = 'block';
  const typeLabels = { basic: '종합 사주', today: '오늘의 운세', compatibility: '사주 궁합', newyear: '신년운세' };
  const typeIcons = { basic: '🔮', today: '📅', compatibility: '💕', newyear: '🎆' };
  const typePages = { basic: 'basic', today: 'today', compatibility: 'compatibility', newyear: 'newyear' };
  let h = '';
  history.forEach(item => {
    const label = typeLabels[item.type] || item.type;
    const icon = typeIcons[item.type] || '🔮';
    const page = typePages[item.type] || 'home';
    const date = new Date(item.timestamp);
    const dateStr = `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
    h += `<div class="history-card" onclick="openPage('${esc(page)}')">
      <div class="history-icon">${icon}</div>
      <div class="history-info">
        <div class="history-label">${esc(label)}</div>
        <div class="history-summary">${esc(item.inputSummary)}</div>
      </div>
      <div class="history-date">${esc(dateStr)}</div>
    </div>`;
  });
  list.innerHTML = h;
}

// ===== 프린트 기능 =====
function printResult() {
  window.print();
}

// ===== 초기화 =====
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('hide');
    renderHistoryOnHome();
    fetch('/api/visitors').then(r => r.json()).then(d => {
      const el = document.querySelector('.best-count .number');
      if (el) el.textContent = d.count.toLocaleString();
    }).catch(() => {});
    showOnboarding();
  }, 800);
  restoreFormData();
  // 비핵심 기능 지연 로딩
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      setupAutoFocus();
      setupRealtimeValidation();
    });
  } else {
    setupAutoFocus();
    setupRealtimeValidation();
  }
  // Service Worker 등록
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});

// ===== 페이지 네비게이션 =====
function openPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => {
    const isActive = t.dataset.page === page;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', String(isActive));
  });

  const pageMap = { home:'pageHome', basic:'pageBasic', today:'pageToday', compatibility:'pageCompatibility', newyear:'pageNewyear' };
  const el = document.getElementById(pageMap[page]);
  if (el) el.classList.add('active');

  const backBtn = document.getElementById('backBtn');
  backBtn.classList.toggle('show', page !== 'home');
  document.getElementById('headerLogo').style.display = page === 'home' ? 'block' : 'none';

  state.currentPage = page;
  window.scrollTo(0, 0);
}

function goHome() { openPage('home'); }

// ===== 성별 =====
function selectGender(btn, formType) {
  btn.parentElement.querySelectorAll('.gender-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-checked', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-checked', 'true');
  state.genders[formType] = btn.dataset.gender;
}

// ===== 유효성 =====
function validateForm(prefix) {
  const y = parseInt(document.getElementById(`${prefix}Year`).value);
  const m = parseInt(document.getElementById(`${prefix}Month`).value);
  const d = parseInt(document.getElementById(`${prefix}Day`).value);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return { valid: false, error: '생년월일을 모두 입력해주세요' };
  if (y < 1920 || y > 2030) return { valid: false, error: '1920~2030년 사이로 입력해주세요' };
  if (m < 1 || m > 12) return { valid: false, error: '올바른 월을 입력해주세요' };
  const maxDay = new Date(y, m, 0).getDate();
  if (d < 1 || d > maxDay) return { valid: false, error: `${m}월은 ${maxDay}일까지 입력 가능합니다` };
  return { valid: true };
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function showAnalyzing(targetId) {
  const el = document.getElementById(targetId);
  el.innerHTML = `
    <div class="skeleton-card">
      <div class="skeleton skeleton-circle"></div>
      <div class="skeleton skeleton-title" style="margin:0 auto"></div>
      <div class="skeleton skeleton-line medium" style="margin:8px auto 0"></div>
    </div>
    <div class="skeleton-card">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>
    <div class="skeleton-card">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line medium"></div>
      <div class="skeleton skeleton-line short"></div>
    </div>
    <div class="analyzing" style="background:transparent;padding:16px 20px">
      <p style="font-size:0.82rem;color:var(--text-secondary)">AI가 사주를 분석하고 있습니다<span class="dots"></span></p>
    </div>`;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== 프로그레스 바 =====
function showProgress() {
  let bar = document.getElementById('progressBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'progressBar';
    bar.className = 'progress-bar';
    document.body.prepend(bar);
  }
  bar.className = 'progress-bar active';
}

function hideProgress() {
  const bar = document.getElementById('progressBar');
  if (bar) {
    bar.classList.remove('active');
    bar.classList.add('done');
    setTimeout(() => bar.classList.add('hide'), 200);
    setTimeout(() => bar.remove(), 600);
  }
}

// ===== 버튼 비활성화 (중복 요청 방지) =====
function setSubmitButtons(disabled) {
  state.loading = disabled;
  document.querySelectorAll('.submit-btn').forEach(btn => {
    btn.disabled = disabled;
  });
}

async function apiCall(endpoint, body, retries = 1) {
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '서버 오류');
    }
    return await res.json();
  } catch(e) {
    if (retries > 0) {
      showToast('재시도 중...');
      await new Promise(r => setTimeout(r, 1500));
      return apiCall(endpoint, body, retries - 1);
    }
    throw e;
  }
}

// ===== 공통: 폼 데이터 추출 =====
function getFormData(prefix, genderKey) {
  return {
    year: document.getElementById(`${prefix}Year`).value,
    month: document.getElementById(`${prefix}Month`).value,
    day: document.getElementById(`${prefix}Day`).value,
    hour: parseInt(document.getElementById(`${prefix}Hour`).value),
    gender: state.genders[genderKey]
  };
}

// ===== 기본 사주 =====
async function submitBasic() {
  if (state.loading) return;
  const v = validateForm('basic');
  if (!v.valid) return showError('basicError', v.error);
  saveFormData('basic', 'basic');
  document.getElementById('basicForm').style.display = 'none';
  document.getElementById('basicFormHeader').style.display = 'none';
  showAnalyzing('basicResult');
  showProgress();
  setSubmitButtons(true);
  try {
    const fd = getFormData('basic', 'basic');
    const data = await apiCall('/api/saju/basic', fd);
    lastResults.basic = data;
    saveHistory('basic', `${fd.year}년 ${fd.month}월 ${fd.day}일`, Date.now());
    renderBasicResult(data);
  } catch(e) {
    document.getElementById('basicResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">${esc(e.message)}</p><button class="retry-btn" onclick="resetForm('basic')">다시 시도</button></div>`;
  } finally {
    hideProgress();
    setSubmitButtons(false);
  }
}

// ===== 오행 레이더 차트 (SVG) =====
function renderOhengRadar(ohengAnalysis) {
  const items = [
    { k: '목', e: '🌳', c: '#22c55e' },
    { k: '화', e: '🔥', c: '#ef4444' },
    { k: '토', e: '⛰️', c: '#d4a017' },
    { k: '금', e: '⚔️', c: '#94a3b8' },
    { k: '수', e: '💧', c: '#3b82f6' }
  ];
  const cx = 140, cy = 140, maxR = 100;
  const angleOffset = -Math.PI / 2; // top start

  function polarToXY(angle, r) {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  function pentagonPoints(r) {
    return items.map((_, i) => {
      const angle = angleOffset + (2 * Math.PI * i) / 5;
      const p = polarToXY(angle, r);
      return `${p.x},${p.y}`;
    }).join(' ');
  }

  // Grid lines at 25%, 50%, 75%, 100%
  let gridSvg = '';
  [25, 50, 75, 100].forEach(pct => {
    const r = maxR * pct / 100;
    gridSvg += `<polygon points="${pentagonPoints(r)}" class="radar-grid" fill="none" stroke="#e0e0e0" stroke-width="0.8"/>`;
  });

  // Axis lines
  let axisSvg = '';
  items.forEach((_, i) => {
    const angle = angleOffset + (2 * Math.PI * i) / 5;
    const p = polarToXY(angle, maxR);
    axisSvg += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#e0e0e0" stroke-width="0.5"/>`;
  });

  // Data polygon
  const pcts = ohengAnalysis.percentages;
  const total = items.reduce((s, o) => s + (pcts[o.k] || 0), 0);
  const maxVal = Math.max(...items.map(o => pcts[o.k] || 0), 1);

  const dataPoints = items.map((o, i) => {
    const val = pcts[o.k] || 0;
    const normalized = Math.max(val / maxVal * 100, 8); // min 8% for visibility
    const r = maxR * normalized / 100;
    const angle = angleOffset + (2 * Math.PI * i) / 5;
    return polarToXY(angle, r);
  });
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Labels
  let labelsSvg = '';
  items.forEach((o, i) => {
    const angle = angleOffset + (2 * Math.PI * i) / 5;
    const p = polarToXY(angle, maxR + 28);
    const val = pcts[o.k] || 0;
    const anchor = Math.abs(p.x - cx) < 5 ? 'middle' : p.x > cx ? 'start' : 'end';
    labelsSvg += `<text x="${p.x}" y="${p.y}" text-anchor="${anchor}" dominant-baseline="central" class="radar-label" fill="#555" font-size="11" font-weight="600">${o.e} ${o.k} ${val}%</text>`;
  });

  // Dots on data points
  let dotsSvg = '';
  dataPoints.forEach((p, i) => {
    dotsSvg += `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="${items[i].c}" stroke="#fff" stroke-width="1.5"/>`;
  });

  return `<div class="oheng-radar-wrap">
    <svg width="280" height="280" viewBox="0 0 280 280">
      ${gridSvg}
      ${axisSvg}
      <polygon points="${dataPolygon}" fill="rgba(255,90,95,0.15)" stroke="var(--accent)" stroke-width="2"/>
      ${dotsSvg}
      ${labelsSvg}
    </svg>
  </div>`;
}

// ===== 결과 카드 순차 애니메이션 =====
function animateResultCards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const cards = container.querySelectorAll('.result-card');
  if (!cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  activeObservers.push(observer);

  cards.forEach((card, i) => {
    card.classList.add('fade-in-up');
    card.style.transitionDelay = `${i * 100}ms`;
    observer.observe(card);
  });
}

function renderBasicResult(data) {
  cleanupObservers();
  const { saju, interpretation: interp } = data;
  const pillars = [saju.yearPillar, saju.monthPillar, saju.dayPillar];
  if (saju.hourPillar) pillars.push(saju.hourPillar);
  const oh = saju.ohengAnalysis;
  const ey = saju.eumyangRatio;
  let h = '';

  // 일간 히어로
  h += `<div class="ilgan-hero">
    <div class="animal-emoji">${saju.animalEmoji}</div>
    <div class="ilgan-name">${esc(saju.personality.title)} · ${esc(saju.ilgan)}일간</div>
    <div class="ilgan-sub">${esc(saju.animal)}띠 · ${esc(interp.summary || saju.personality.desc)}</div>
    <div class="ilgan-trait">${esc(saju.personality.trait)}</div>
    ${saju.iljuSpecial ? `<div class="ilju-special"><span class="ilju-label">${esc(saju.dayPillar.ganji)}일주</span> ${esc(saju.iljuSpecial.title)}</div><div class="ilju-trait">${esc(saju.iljuSpecial.trait)}</div>` : ''}
  </div>`;

  // 사주팔자
  h += `<div class="result-card"><h3>사주팔자</h3><div class="saju-table">`;
  pillars.forEach(p => {
    h += `<div class="saju-col">
      <div class="col-label">${esc(p.name)}</div>
      <div class="col-top" style="color:${p.cheonganColor}">${esc(p.cheonganHanja)}</div>
      <div class="col-bottom" style="color:${p.jijiColor}">${esc(p.jijiHanja)}</div>
      <div class="col-korean">${esc(p.cheongan)}${esc(p.jiji)}</div>
    </div>`;
  });
  h += `</div>`;
  const yPct = Math.round((ey.yang / ey.total) * 100);
  h += `<div class="eumyang-bar-wrap"><div class="eumyang-bar"><div class="yang" style="width:${yPct}%"></div><div class="eum" style="width:${100 - yPct}%"></div></div><div class="eumyang-labels"><span>양 ${ey.yang}</span><span>음 ${ey.eum}</span></div></div></div>`;

  // 오행
  h += `<div class="result-card"><h3>오행 분석</h3>`;
  h += renderOhengRadar(oh);
  h += `<div class="oheng-chart">`;
  [{k:'목',c:'wood',e:'🌳'},{k:'화',c:'fire',e:'🔥'},{k:'토',c:'earth',e:'⛰️'},{k:'금',c:'metal',e:'⚔️'},{k:'수',c:'water',e:'💧'}].forEach(o => {
    const pct = oh.percentages[o.k];
    h += `<div class="oheng-row"><div class="oh-label">${o.e} ${o.k}</div><div class="oh-bar-wrap"><div class="oh-bar ${o.c}" style="width:${Math.max(pct, 5)}%">${pct}%</div></div></div>`;
  });
  if (oh.missing.length) h += `<div class="oheng-missing">⚠ 부족한 오행: ${oh.missing.join(', ')}</div>`;
  h += `</div></div>`;

  // 십이운성
  if (saju.sipyiUnsung) {
    h += `<div class="result-card"><h3>십이운성</h3><div class="unsung-grid">`;
    const pillarsForUnsung = [saju.yearPillar, saju.monthPillar, saju.dayPillar];
    if (saju.hourPillar) pillarsForUnsung.push(saju.hourPillar);
    pillarsForUnsung.forEach((p, i) => {
      const u = saju.sipyiUnsung[i];
      if (u) {
        h += `<div class="unsung-item">
          <div class="ui-pillar">${esc(p.name)}</div>
          <div class="ui-name">${esc(u.name)}</div>
          <div class="ui-desc">${esc(u.desc)}</div>
        </div>`;
      }
    });
    h += `</div></div>`;
  }

  // 신살
  if (saju.sinsal && saju.sinsal.length > 0) {
    h += `<div class="result-card"><h3>신살 분석</h3><div class="sinsal-list">`;
    saju.sinsal.forEach(s => {
      h += `<div class="sinsal-item">
        <div class="si-badge">${esc(s.name)}</div>
        <div class="si-info">
          <div class="si-location">${esc(s.pillar)}의 ${esc(s.jiji)}</div>
          <div class="si-desc">${esc(s.desc)}</div>
        </div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // 대운
  if (saju.daeun && saju.daeun.length > 0) {
    h += `<div class="result-card"><h3>대운 흐름</h3><p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:16px">10년 단위로 변화하는 운의 흐름입니다</p><div class="daeun-timeline">`;
    const currentAge = new Date().getFullYear() - saju.birthInfo.year;
    saju.daeun.forEach(d => {
      const isCurrent = currentAge >= d.startAge && currentAge < d.endAge;
      h += `<div class="daeun-item${isCurrent ? ' current' : ''}">
        <div class="di-age">${d.startAge}~${d.endAge}세</div>
        <div class="di-ganji">
          <span style="color:${d.cheonganColor || 'inherit'}">${esc(d.cheonganHanja)}</span>
          <span style="color:${d.jijiColor || 'inherit'}">${esc(d.jijiHanja)}</span>
        </div>
        <div class="di-korean">${esc(d.cheongan)}${esc(d.jiji)}</div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // AI 해석 섹션들
  if (interp.personality) {
    h += `<div class="result-card"><h3>성격 분석</h3>
      <div class="interp-block"><h4>핵심 성격</h4><p>${esc(interp.personality.core)}</p></div>
      <div class="interp-block"><h4>강점</h4><ul>${interp.personality.strengths.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>
      <div class="interp-block"><h4>보완할 점</h4><ul>${interp.personality.weaknesses.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>
      <div class="interp-block"><h4>대인관계</h4><p>${esc(interp.personality.social)}</p></div>
    </div>`;
  }
  if (interp.career) {
    h += `<div class="result-card"><h3>직업운</h3>
      <div class="interp-block"><h4>적합한 분야</h4><div>${interp.career.suitable.map(s=>`<span class="tag primary">${esc(s)}</span>`).join('')}</div></div>
      <div class="interp-block" style="margin-top:10px"><p>${esc(interp.career.advice)}</p></div></div>`;
  }
  if (interp.wealth) {
    h += `<div class="result-card"><h3>재물운</h3><div class="interp-block"><p>${esc(interp.wealth.tendency)}</p></div><div class="interp-block"><h4>조언</h4><p>${esc(interp.wealth.advice)}</p></div></div>`;
  }
  if (interp.love) {
    h += `<div class="result-card"><h3>연애·결혼운</h3><div class="interp-block"><p>${esc(interp.love.tendency)}</p></div><div class="interp-block"><h4>이상적인 상대</h4><p>${esc(interp.love.idealType)}</p></div></div>`;
  }
  if (interp.health) {
    h += `<div class="result-card"><h3>건강운</h3><div class="interp-block"><h4>주의 부위</h4><div>${interp.health.weak_points.map(s=>`<span class="tag caution">${esc(s)}</span>`).join('')}</div></div><div class="interp-block" style="margin-top:8px"><p>${esc(interp.health.advice)}</p></div></div>`;
  }
  if (interp.luck_elements) {
    h += `<div class="result-card"><h3>행운 요소</h3><div class="lucky-grid">
      <div class="lucky-item"><div class="lk-label">행운의 색</div><div class="lk-value">${esc(interp.luck_elements.color)}</div></div>
      <div class="lucky-item"><div class="lk-label">행운의 숫자</div><div class="lk-value">${esc(interp.luck_elements.number)}</div></div>
      <div class="lucky-item"><div class="lk-label">행운의 방향</div><div class="lk-value">${esc(interp.luck_elements.direction)}</div></div>
    </div></div>`;
  }
  if (interp.yearly_flow) {
    h += `<div class="result-card"><h3>2026년 운세 흐름</h3><div class="interp-block"><p>${esc(interp.yearly_flow)}</p></div></div>`;
  }
  if (interp.life_advice) {
    h += `<div class="result-card" style="background:#fafafa"><h3>인생 종합 조언</h3><div class="interp-block"><p>${esc(interp.life_advice)}</p></div></div>`;
  }
  // 오행 보충 가이드
  if (saju.ohengGuide && saju.ohengGuide.length > 0) {
    h += `<div class="result-card"><h3>오행 보충 가이드</h3><p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:14px">부족한 오행을 보충하는 방법입니다</p>`;
    saju.ohengGuide.forEach(g => {
      h += `<div class="oheng-guide-card">
        <div class="og-header"><span class="og-oheng">${esc(g.oheng)}</span> 보충법</div>
        <div class="og-grid">
          <div class="og-item"><span class="og-label">색상</span><span class="og-value">${g.color.map(c => esc(c)).join(', ')}</span></div>
          <div class="og-item"><span class="og-label">방향</span><span class="og-value">${esc(g.direction)}</span></div>
          <div class="og-item"><span class="og-label">계절</span><span class="og-value">${esc(g.season)}</span></div>
          <div class="og-item"><span class="og-label">숫자</span><span class="og-value">${g.number.join(', ')}</span></div>
          <div class="og-item"><span class="og-label">음식</span><span class="og-value">${g.food.map(f => esc(f)).join(', ')}</span></div>
          <div class="og-item"><span class="og-label">활동</span><span class="og-value">${g.activity.map(a => esc(a)).join(', ')}</span></div>
          <div class="og-item"><span class="og-label">아이템</span><span class="og-value">${g.item.map(t => esc(t)).join(', ')}</span></div>
          <div class="og-item"><span class="og-label">관련 신체</span><span class="og-value">${esc(g.body)}</span></div>
        </div>
      </div>`;
    });
    h += `</div>`;
  }
  h += `<div class="result-card action-buttons">
    <button class="share-btn" onclick="shareResult('사주포털', generateResultSummary('basic', lastResults.basic))">결과 공유하기</button>
    <button class="print-btn" onclick="printResult()">프린트</button>
    <button class="retry-btn" onclick="resetForm('basic')">다시 분석하기</button>
  </div>`;
  try {
    document.getElementById('basicResult').innerHTML = h;
    document.getElementById('basicResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    animateResultCards('basicResult');
    if (saju.ohengAnalysis && saju.ohengAnalysis.strongest) {
      setOhengTheme(saju.ohengAnalysis.strongest.name);
    }
  } catch (e) {
    console.error('렌더링 오류:', e);
    document.getElementById('basicResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">결과 표시 중 오류가 발생했습니다</p><button class="retry-btn" onclick="resetForm('basic')">다시 시도</button></div>`;
  }
}

// ===== 오늘의 운세 =====
async function submitToday() {
  if (state.loading) return;
  const v = validateForm('today');
  if (!v.valid) return showError('todayError', v.error);
  saveFormData('today', 'today');
  document.getElementById('todayForm').style.display = 'none';
  document.getElementById('todayFormHeader').style.display = 'none';
  showAnalyzing('todayResult');
  showProgress();
  setSubmitButtons(true);
  try {
    const fd = getFormData('today', 'today');
    const data = await apiCall('/api/saju/today', fd);
    lastResults.today = data;
    saveHistory('today', `${fd.year}년 ${fd.month}월 ${fd.day}일`, Date.now());
    renderTodayResult(data);
  } catch(e) {
    document.getElementById('todayResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">${esc(e.message)}</p><button class="retry-btn" onclick="resetForm('today')">다시 시도</button></div>`;
  } finally {
    hideProgress();
    setSubmitButtons(false);
  }
}

function renderTodayResult(data) {
  cleanupObservers();
  const { today, interpretation: interp } = data;
  const cls = interp.score >= 80 ? 'high' : interp.score >= 50 ? 'mid' : 'low';
  let h = '';
  h += `<div class="today-hero">
    <div class="today-date">${esc(today.date)}</div>
    <div class="today-ilgin">오늘의 일진: ${esc(today.dayPillar.cheongan)}${esc(today.dayPillar.jiji)}</div>
    <div class="today-score-num ${cls}">${interp.score}점</div>
    <div class="today-summary">${esc(interp.summary)}</div>
  </div>`;
  h += `<div class="result-card"><div class="interp-block"><p>${esc(interp.detail)}</p></div></div>`;
  h += `<div class="result-card"><h3>분야별 운세</h3>
    <div class="interp-block"><h4>연애운</h4><p>${esc(interp.love)}</p></div>
    <div class="interp-block"><h4>재물운</h4><p>${esc(interp.money)}</p></div>
    <div class="interp-block"><h4>직장/학업운</h4><p>${esc(interp.work)}</p></div>
    <div class="interp-block"><h4>건강운</h4><p>${esc(interp.health)}</p></div>
  </div>`;
  if (interp.lucky) {
    h += `<div class="result-card"><h3>오늘의 행운</h3><div class="lucky-grid">
      <div class="lucky-item"><div class="lk-label">좋은 시간</div><div class="lk-value">${esc(interp.lucky.time)}</div></div>
      <div class="lucky-item"><div class="lk-label">행운 색</div><div class="lk-value">${esc(interp.lucky.color)}</div></div>
      <div class="lucky-item"><div class="lk-label">행운 음식</div><div class="lk-value">${esc(interp.lucky.food)}</div></div>
    </div></div>`;
  }
  if (interp.caution) {
    h += `<div class="result-card" style="background:#fffbeb"><h3>오늘 주의할 점</h3><div class="interp-block"><p>${esc(interp.caution)}</p></div></div>`;
  }
  h += `<div class="result-card action-buttons">
    <button class="share-btn" onclick="shareResult('사주포털', generateResultSummary('today', lastResults.today))">결과 공유하기</button>
    <button class="print-btn" onclick="printResult()">프린트</button>
    <button class="retry-btn" onclick="resetForm('today')">다시 보기</button>
  </div>`;
  try {
    document.getElementById('todayResult').innerHTML = h;
    document.getElementById('todayResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    animateResultCards('todayResult');
    animateCountUp('.today-score-num', interp.score);
  } catch (e) {
    console.error('렌더링 오류:', e);
    document.getElementById('todayResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">결과 표시 중 오류가 발생했습니다</p><button class="retry-btn" onclick="resetForm('today')">다시 시도</button></div>`;
  }
}

// ===== 궁합 =====
async function submitCompatibility() {
  if (state.loading) return;
  const v1 = validateForm('compat1');
  if (!v1.valid) return showError('compatError', '첫 번째 사람: ' + v1.error);
  const v2 = validateForm('compat2');
  if (!v2.valid) return showError('compatError', '두 번째 사람: ' + v2.error);
  saveFormData('compat1', 'compat1');
  saveFormData('compat2', 'compat2');
  document.getElementById('compatForm').style.display = 'none';
  document.getElementById('compatFormHeader').style.display = 'none';
  showAnalyzing('compatResult');
  showProgress();
  setSubmitButtons(true);
  try {
    const fd1 = getFormData('compat1', 'compat1');
    const fd2 = getFormData('compat2', 'compat2');
    const data = await apiCall('/api/saju/compatibility', { person1: fd1, person2: fd2 });
    lastResults.compatibility = data;
    saveHistory('compatibility', `${fd1.year}년생 & ${fd2.year}년생`, Date.now());
    renderCompatResult(data);
  } catch(e) {
    document.getElementById('compatResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">${esc(e.message)}</p><button class="retry-btn" onclick="resetForm('compatibility')">다시 시도</button></div>`;
  } finally {
    hideProgress();
    setSubmitButtons(false);
  }
}

function renderCompatResult(data) {
  cleanupObservers();
  const { saju1, saju2, compatibility } = data;
  const interp = compatibility.interpretation;
  const score = compatibility.score;
  let h = '';

  h += `<div class="compat-score-hero">
    <div class="compat-score-circle">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="65" fill="none" stroke="#f0f0f0" stroke-width="6"/>
        <circle cx="70" cy="70" r="65" fill="none" stroke="var(--accent)" stroke-width="6"
          stroke-dasharray="408" stroke-dashoffset="${408 - (408 * score / 100)}"
          stroke-linecap="round" style="animation: circleProgress 1.5s ease forwards"/>
      </svg>
      <div class="score-text">
        <div class="score-num score-animate">${score}</div>
        <div class="score-unit">점</div>
      </div>
    </div>
    <div class="compat-score-title" style="margin-top:12px">${esc(interp.title || '인연의 만남')}</div>
  </div>`;

  // 사주 비교
  h += `<div class="result-card"><h3>사주 비교</h3><div class="saju-compare">
    <div class="saju-compare-side"><div class="side-label">${esc(saju1.personality.title)}</div><div class="saju-mini-pillars">
      ${[saju1.yearPillar,saju1.monthPillar,saju1.dayPillar].map(p=>`<div class="saju-mini-col"><div class="mc-top" style="color:${p.cheonganColor}">${esc(p.cheonganHanja)}</div><div class="mc-bottom" style="color:${p.jijiColor}">${esc(p.jijiHanja)}</div></div>`).join('')}
    </div></div>
    <div style="display:flex;align-items:center;font-size:1.2rem;color:var(--accent)">♥</div>
    <div class="saju-compare-side"><div class="side-label">${esc(saju2.personality.title)}</div><div class="saju-mini-pillars">
      ${[saju2.yearPillar,saju2.monthPillar,saju2.dayPillar].map(p=>`<div class="saju-mini-col"><div class="mc-top" style="color:${p.cheonganColor}">${esc(p.cheonganHanja)}</div><div class="mc-bottom" style="color:${p.jijiColor}">${esc(p.jijiHanja)}</div></div>`).join('')}
    </div></div>
  </div></div>`;

  // 오행 비교
  if (saju1.ohengAnalysis && saju2.ohengAnalysis) {
    h += `<div class="result-card"><h3>오행 비교</h3><div class="oheng-compare">`;
    ['목','화','토','금','수'].forEach(oh => {
      const pct1 = saju1.ohengAnalysis.percentages[oh] || 0;
      const pct2 = saju2.ohengAnalysis.percentages[oh] || 0;
      const emoji = {'목':'🌳','화':'🔥','토':'⛰️','금':'⚔️','수':'💧'}[oh];
      h += `<div class="oc-row">
        <div class="oc-bar-left"><div class="oc-fill" style="width:${Math.max(pct1,8)}%">${pct1}%</div></div>
        <div class="oc-label">${emoji} ${oh}</div>
        <div class="oc-bar-right"><div class="oc-fill" style="width:${Math.max(pct2,8)}%">${pct2}%</div></div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // 점수 바
  if (interp.scores) {
    h += `<div class="result-card"><h3>세부 궁합 점수</h3>`;
    [{n:'연애 궁합',k:'love'},{n:'소통 궁합',k:'communication'},{n:'가치관 궁합',k:'values'},{n:'미래 궁합',k:'future'}].forEach(item => {
      const val = parseInt(interp.scores[item.k]) || score;
      h += `<div class="compat-bar-item"><div class="compat-bar-header"><span class="name">${item.n}</span><span class="value">${val}점</span></div><div class="compat-bar-track"><div class="compat-bar-fill" style="width:${val}%"></div></div></div>`;
    });
    h += `</div>`;
  }

  h += `<div class="result-card"><h3>궁합 분석</h3>
    <div class="interp-block"><p>${esc(interp.overall)}</p></div>
    <div class="interp-block"><h4>연애 케미</h4><p>${esc(interp.love_chemistry)}</p></div>
    <div class="interp-block"><h4>소통 방식</h4><p>${esc(interp.communication)}</p></div>
    <div class="interp-block"><h4>갈등 포인트</h4><p>${esc(interp.conflict)}</p></div>
  </div>`;

  h += `<div class="result-card"><h3>이 커플의 장점</h3><ul style="list-style:none;padding:0">${interp.strengths.map(s=>`<li style="padding:6px 0 6px 16px;position:relative;font-size:0.88rem"><span style="position:absolute;left:0;color:#059669">✓</span>${esc(s)}</li>`).join('')}</ul></div>`;
  h += `<div class="result-card" style="background:#fffbeb"><h3>주의할 점</h3><ul style="list-style:none;padding:0">${interp.cautions.map(s=>`<li style="padding:6px 0 6px 16px;position:relative;font-size:0.88rem"><span style="position:absolute;left:0">⚠</span>${esc(s)}</li>`).join('')}</ul></div>`;
  h += `<div class="result-card" style="background:#fafafa"><h3>종합 조언</h3><div class="interp-block"><p>${esc(interp.advice)}</p></div></div>`;
  h += `<div class="result-card action-buttons">
    <button class="share-btn" onclick="shareResult('사주포털', generateResultSummary('compatibility', lastResults.compatibility))">결과 공유하기</button>
    <button class="print-btn" onclick="printResult()">프린트</button>
    <button class="retry-btn" onclick="resetForm('compatibility')">다시 분석하기</button>
  </div>`;
  try {
    document.getElementById('compatResult').innerHTML = h;
    document.getElementById('compatResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    animateResultCards('compatResult');
    animateCountUp('.compat-score-circle .score-num', score);
  } catch (e) {
    console.error('렌더링 오류:', e);
    document.getElementById('compatResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">결과 표시 중 오류가 발생했습니다</p><button class="retry-btn" onclick="resetForm('compatibility')">다시 시도</button></div>`;
  }
}

// ===== 신년운세 =====
async function submitNewYear() {
  if (state.loading) return;
  const v = validateForm('newyear');
  if (!v.valid) return showError('newyearError', v.error);
  saveFormData('newyear', 'newyear');
  document.getElementById('newyearForm').style.display = 'none';
  document.getElementById('newyearFormHeader').style.display = 'none';
  showAnalyzing('newyearResult');
  showProgress();
  setSubmitButtons(true);
  try {
    const fd = getFormData('newyear', 'newyear');
    const data = await apiCall('/api/saju/newyear', fd);
    lastResults.newyear = data;
    saveHistory('newyear', `${fd.year}년 ${fd.month}월 ${fd.day}일`, Date.now());
    renderNewYearResult(data);
  } catch(e) {
    document.getElementById('newyearResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">${esc(e.message)}</p><button class="retry-btn" onclick="resetForm('newyear')">다시 시도</button></div>`;
  } finally {
    hideProgress();
    setSubmitButtons(false);
  }
}

// ===== 신년운세 탭 전환 =====
function switchNyTab(tabName) {
  document.querySelectorAll('.ny-tab-item').forEach(t => {
    t.classList.toggle('active', t.dataset.section === tabName);
  });
  document.querySelectorAll('.ny-section').forEach(s => {
    s.classList.toggle('active', s.id === 'nySection_' + tabName);
  });
}

// ===== 월별 점수 차트 렌더링 =====
function renderMonthlyChart(scores) {
  if (!scores || !Array.isArray(scores) || scores.length !== 12) return '';
  let h = '<div class="monthly-chart">';
  scores.forEach((score, i) => {
    const s = Math.max(0, Math.min(100, parseInt(score) || 50));
    const cls = s >= 80 ? 'score-high' : s >= 50 ? 'score-mid' : 'score-low';
    h += `<div class="monthly-bar">
      <div class="bar-label">${i + 1}월</div>
      <div class="bar-track"><div class="bar-fill ${cls}" style="width:${Math.max(s, 8)}%"><span class="bar-score">${s}</span></div></div>
    </div>`;
  });
  h += '</div>';
  return h;
}

// ===== 신년운세 상세 렌더링 =====
function renderNewYearResult(data) {
  cleanupObservers();
  const { saju, seunAnalysis: sa, interpretation: interp } = data;
  if (!interp) {
    document.getElementById('newyearResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">AI 분석 실패</p><button class="retry-btn" onclick="resetForm('newyear')">다시 시도</button></div>`;
    return;
  }
  const cg = interp.chongun || {};
  const wt = interp.wealth || {};
  const lv = interp.love || {};
  const ht = interp.health || {};
  const cr = interp.career || {};

  let h = '';

  // 히어로
  h += `<div class="newyear-hero">
    <div class="ny-emoji">🐴</div>
    <div class="ny-year">2026 병오년</div>
    <div class="ny-sub">${esc(saju.personality.title)} · ${esc(saju.ilgan)}일간의 신년운세</div>
    <div class="ny-theme">${esc(cg.year_theme || '')}</div>
    ${cg.year_keyword ? `<div class="ny-keyword-badge">${esc(cg.year_keyword)}</div>` : ''}
  </div>`;

  // 섹션 탭
  h += `<div class="ny-section-tabs">
    <button class="ny-tab-item active" data-section="chongun" onclick="switchNyTab('chongun')">총운</button>
    <button class="ny-tab-item" data-section="wealth" onclick="switchNyTab('wealth')">재물운</button>
    <button class="ny-tab-item" data-section="love" onclick="switchNyTab('love')">애정운</button>
    <button class="ny-tab-item" data-section="health" onclick="switchNyTab('health')">건강운</button>
    <button class="ny-tab-item" data-section="career" onclick="switchNyTab('career')">직업운</button>
  </div>`;

  // ===== 총운 섹션 =====
  h += `<div class="ny-section active" id="nySection_chongun">`;

  // 사주원국 테이블 (십성 포함)
  const pillars = [saju.yearPillar, saju.monthPillar, saju.dayPillar];
  if (saju.hourPillar) pillars.push(saju.hourPillar);

  h += `<div class="result-card"><h3>사주원국</h3><div class="ny-saju-table">`;
  pillars.forEach(p => {
    const key = p.name === '년주' ? 'yearPillar' : p.name === '월주' ? 'monthPillar' : p.name === '일주' ? 'dayPillar' : 'hourPillar';
    const sp = sa && sa.pillarSipsung && sa.pillarSipsung[key];
    const cSip = sp ? sp.cheonganSipsung : '';
    const jSip = sp ? sp.jijiSipsung : '';
    h += `<div class="ny-saju-col">
      <div class="col-sipsung">${esc(cSip)}</div>
      <div class="col-label">${esc(p.name)}</div>
      <div class="col-top" style="color:${p.cheonganColor}">${esc(p.cheonganHanja)}</div>
      <div class="col-bottom" style="color:${p.jijiColor}">${esc(p.jijiHanja)}</div>
      <div class="col-sipsung-bottom">${esc(jSip)}</div>
      <div class="col-korean">${esc(p.cheongan)}${esc(p.jiji)}</div>
    </div>`;
  });
  h += `</div>`;

  // 세운 정보
  if (sa) {
    h += `<div class="seun-info-card">
      <div class="sic-row"><span class="sic-label">2026 세운</span><span class="sic-value">병오(丙午) 화(火)</span></div>
      <div class="sic-row"><span class="sic-label">세운 천간 십성</span><span class="sic-value">${esc(sa.seunCheonganSipsung)}</span></div>
      <div class="sic-row"><span class="sic-label">세운 지지 십성</span><span class="sic-value">${esc(sa.seunJijiSipsung)}</span></div>
      <div class="sic-row"><span class="sic-label">신강/신약</span><span class="sic-value">${esc(sa.singang)}</span></div>
      <div class="sic-badges">`;
    if (sa.chungList && sa.chungList.length > 0) {
      sa.chungList.forEach(c => {
        h += `<span class="seun-badge chung">${esc(c.pillar)} ${esc(c.jiji)}-${esc(c.seunJiji)} 충</span>`;
      });
    }
    if (sa.hapList && sa.hapList.length > 0) {
      sa.hapList.forEach(hp => {
        h += `<span class="seun-badge hap">${esc(hp.pillar)} ${esc(hp.jiji)}-${esc(hp.seunJiji)} 합</span>`;
      });
    }
    if (sa.cheonganHapList && sa.cheonganHapList.length > 0) {
      sa.cheonganHapList.forEach(hp => {
        h += `<span class="seun-badge hap">${esc(hp.pillar)} ${esc(hp.cheongan)}-${esc(hp.seunCheongan)} 천간합</span>`;
      });
    }
    h += `</div></div>`;
  }

  // 2026년 월운 간지
  if (sa && sa.monthlyGanji) {
    h += `<div class="result-card"><h3>2026년 월별 간지</h3><div class="monthly-ganji-grid">`;
    sa.monthlyGanji.forEach(mg => {
      h += `<div class="mg-item">
        <div class="mg-month">${mg.month}월</div>
        <div class="mg-hanja"><span style="color:${OHENG_COLORS[mg.oheng] || 'inherit'}">${esc(mg.cheonganHanja)}</span><span style="color:${OHENG_COLORS[mg.jijiOheng] || 'inherit'}">${esc(mg.jijiHanja)}</span></div>
        <div class="mg-korean">${esc(mg.ganji)}</div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // 음양 바
  const ey = saju.eumyangRatio;
  const yPct = Math.round((ey.yang / ey.total) * 100);
  h += `<div class="eumyang-bar-wrap"><div class="eumyang-bar"><div class="yang" style="width:${yPct}%"></div><div class="eum" style="width:${100 - yPct}%"></div></div><div class="eumyang-labels"><span>양 ${ey.yang}</span><span>음 ${ey.eum}</span></div></div>`;
  h += `</div>`; // end result-card

  // 오행 차트
  const oh = saju.ohengAnalysis;
  h += `<div class="result-card"><h3>오행 비율</h3>`;
  h += renderOhengRadar(oh);
  h += `<div class="oheng-chart">`;
  [{k:'목',c:'wood',e:'🌳'},{k:'화',c:'fire',e:'🔥'},{k:'토',c:'earth',e:'⛰️'},{k:'금',c:'metal',e:'⚔️'},{k:'수',c:'water',e:'💧'}].forEach(o => {
    const pct = oh.percentages[o.k];
    h += `<div class="oheng-row"><div class="oh-label">${o.e} ${o.k}</div><div class="oh-bar-wrap"><div class="oh-bar ${o.c}" style="width:${Math.max(pct, 5)}%">${pct}%</div></div></div>`;
  });
  if (oh.missing.length) h += `<div class="oheng-missing">부족한 오행: ${oh.missing.join(', ')}</div>`;
  h += `</div></div>`;

  // 십이운성
  if (saju.sipyiUnsung) {
    h += `<div class="result-card"><h3>십이운성</h3><div class="unsung-grid">`;
    const nyPillarsForUnsung = [saju.yearPillar, saju.monthPillar, saju.dayPillar];
    if (saju.hourPillar) nyPillarsForUnsung.push(saju.hourPillar);
    nyPillarsForUnsung.forEach((p, i) => {
      const u = saju.sipyiUnsung[i];
      if (u) {
        h += `<div class="unsung-item">
          <div class="ui-pillar">${esc(p.name)}</div>
          <div class="ui-name">${esc(u.name)}</div>
          <div class="ui-desc">${esc(u.desc)}</div>
        </div>`;
      }
    });
    h += `</div></div>`;
  }

  // 신살
  if (saju.sinsal && saju.sinsal.length > 0) {
    h += `<div class="result-card"><h3>신살 분석</h3><div class="sinsal-list">`;
    saju.sinsal.forEach(s => {
      h += `<div class="sinsal-item">
        <div class="si-badge">${esc(s.name)}</div>
        <div class="si-info">
          <div class="si-location">${esc(s.pillar)}의 ${esc(s.jiji)}</div>
          <div class="si-desc">${esc(s.desc)}</div>
        </div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // 대운
  if (saju.daeun && saju.daeun.length > 0) {
    h += `<div class="result-card"><h3>대운 흐름</h3><p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:16px">10년 단위로 변화하는 운의 흐름입니다</p><div class="daeun-timeline">`;
    const nyCurrentAge = new Date().getFullYear() - saju.birthInfo.year;
    saju.daeun.forEach(d => {
      const isCurrent = nyCurrentAge >= d.startAge && nyCurrentAge < d.endAge;
      h += `<div class="daeun-item${isCurrent ? ' current' : ''}">
        <div class="di-age">${d.startAge}~${d.endAge}세</div>
        <div class="di-ganji">
          <span style="color:${d.cheonganColor || 'inherit'}">${esc(d.cheonganHanja)}</span>
          <span style="color:${d.jijiColor || 'inherit'}">${esc(d.jijiHanja)}</span>
        </div>
        <div class="di-korean">${esc(d.cheongan)}${esc(d.jiji)}</div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // 총운 내용
  h += `<div class="result-card"><h3>2026년 총운</h3><div class="interp-block"><p>${esc(cg.year_overview)}</p></div></div>`;

  // 기회와 위기
  h += `<div class="result-card"><h3>기회와 위기</h3>`;
  h += `<div class="fortune-card good"><h4>기회 요인</h4><p>${esc(cg.opportunity)}</p></div>`;
  h += `<div class="fortune-card warning"><h4>위기 요인</h4><p>${esc(cg.crisis)}</p></div>`;
  h += `</div>`;

  // 대인관계
  if (cg.relationship_overview) {
    h += `<div class="result-card"><h3>대인관계</h3><div class="interp-block"><p>${esc(cg.relationship_overview)}</p></div></div>`;
  }

  // 종합 조언
  if (cg.advice) {
    h += `<div class="result-card" style="background:#fafafa"><h3>핵심 조언</h3><div class="fortune-card info"><p>${esc(cg.advice)}</p></div></div>`;
  }

  h += `</div>`; // end chongun section

  // ===== 재물운 섹션 =====
  h += `<div class="ny-section" id="nySection_wealth">`;
  h += `<div class="result-card"><h3>2026년 재물운</h3><div class="interp-block"><p>${esc(wt.overview)}</p></div></div>`;

  h += `<div class="result-card"><h3>월별 재물운 점수</h3>${renderMonthlyChart(wt.monthly_scores)}</div>`;

  // 좋은/나쁜 시기
  h += `<div class="result-card"><h3>주요 시기</h3>`;
  if (wt.good_months) {
    wt.good_months.forEach(m => {
      h += `<div class="month-point-card good"><div class="mpc-month">${m.month}월</div><div class="mpc-text">${esc(m.reason)}</div></div>`;
    });
  }
  if (wt.bad_months) {
    wt.bad_months.forEach(m => {
      h += `<div class="month-point-card bad"><div class="mpc-month">${m.month}월</div><div class="mpc-text">${esc(m.reason)}</div></div>`;
    });
  }
  h += `</div>`;

  // 전략
  if (wt.strategy && wt.strategy.length) {
    h += `<div class="result-card"><h3>재물 전략</h3>`;
    wt.strategy.forEach(s => {
      h += `<div class="strategy-card"><p>${esc(s)}</p></div>`;
    });
    h += `</div>`;
  }

  // 주의 인물
  if (wt.warning_people && wt.warning_people.length) {
    h += `<div class="result-card"><h3>주의할 인물 유형</h3>`;
    wt.warning_people.forEach(w => {
      h += `<div class="people-card dangerous"><div class="pc-desc">${esc(w)}</div></div>`;
    });
    h += `</div>`;
  }

  if (wt.summary) {
    h += `<div class="result-card" style="background:#fafafa"><h3>재물운 총평</h3><div class="interp-block"><p>${esc(wt.summary)}</p></div></div>`;
  }
  h += `</div>`; // end wealth section

  // ===== 애정운 섹션 =====
  h += `<div class="ny-section" id="nySection_love">`;
  h += `<div class="result-card"><h3>2026년 애정운</h3><div class="interp-block"><p>${esc(lv.overview)}</p></div></div>`;

  h += `<div class="result-card"><h3>월별 애정운 점수</h3>${renderMonthlyChart(lv.monthly_scores)}</div>`;

  // 이상적 파트너
  if (lv.ideal_partner) {
    const ip = lv.ideal_partner;
    h += `<div class="result-card"><h3>이상적인 파트너</h3>
      <div class="partner-profile">
        <div class="pp-row"><span class="pp-label">성격</span><span class="pp-value">${esc(ip.personality)}</span></div>
        <div class="pp-row"><span class="pp-label">외적</span><span class="pp-value">${esc(ip.appearance)}</span></div>
        <div class="pp-row"><span class="pp-label">직업</span><span class="pp-value">${esc(ip.job_field)}</span></div>
        ${ip.tags ? `<div class="pp-tags">${ip.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  // 미혼 조언
  if (lv.single_advice) {
    const sa2 = lv.single_advice;
    h += `<div class="result-card"><h3>미혼을 위한 조언</h3>`;
    if (sa2.good_months) {
      sa2.good_months.forEach(m => {
        h += `<div class="month-point-card good"><div class="mpc-month">${m.month}월</div><div class="mpc-text">${esc(m.strategy)}</div></div>`;
      });
    }
    if (sa2.bad_months) {
      sa2.bad_months.forEach(m => {
        h += `<div class="month-point-card bad"><div class="mpc-month">${m.month}월</div><div class="mpc-text">${esc(m.warning)}</div></div>`;
      });
    }
    if (sa2.meeting_places) {
      h += `<div class="fortune-card info"><h4>추천 만남 장소</h4><p>${esc(sa2.meeting_places)}</p></div>`;
    }
    if (sa2.charm_items) {
      h += `<div class="fortune-card good"><h4>매력 아이템</h4><p>${esc(sa2.charm_items)}</p></div>`;
    }
    h += `</div>`;
  }

  // 커플 조언
  if (lv.couple_advice) {
    const ca = lv.couple_advice;
    h += `<div class="result-card"><h3>커플을 위한 조언</h3>`;
    if (ca.good_months) {
      ca.good_months.forEach(m => {
        h += `<div class="month-point-card good"><div class="mpc-month">${m.month}월</div><div class="mpc-text">${esc(m.tip)}</div></div>`;
      });
    }
    if (ca.bad_months) {
      ca.bad_months.forEach(m => {
        h += `<div class="month-point-card bad"><div class="mpc-month">${m.month}월</div><div class="mpc-text">${esc(m.warning)}</div></div>`;
      });
    }
    if (ca.couple_items) {
      h += `<div class="fortune-card info"><h4>커플 아이템</h4><p>${esc(ca.couple_items)}</p></div>`;
    }
    if (ca.date_spots) {
      h += `<div class="fortune-card good"><h4>추천 데이트</h4><p>${esc(ca.date_spots)}</p></div>`;
    }
    h += `</div>`;
  }

  if (lv.summary) {
    h += `<div class="result-card" style="background:#fafafa"><h3>애정운 총평</h3><div class="interp-block"><p>${esc(lv.summary)}</p></div></div>`;
  }
  h += `</div>`; // end love section

  // ===== 건강운 섹션 =====
  h += `<div class="ny-section" id="nySection_health">`;
  h += `<div class="result-card"><h3>2026년 건강운</h3><div class="interp-block"><p>${esc(ht.overview)}</p></div></div>`;

  if (ht.constitution) {
    h += `<div class="result-card"><h3>타고난 체질</h3><div class="interp-block"><p>${esc(ht.constitution)}</p></div></div>`;
  }

  h += `<div class="result-card"><h3>월별 건강운 점수</h3>${renderMonthlyChart(ht.monthly_scores)}</div>`;

  // 주의 질환
  if (ht.diseases && ht.diseases.length) {
    h += `<div class="result-card"><h3>주의 질환</h3>`;
    ht.diseases.forEach(d => {
      h += `<div class="fortune-card warning"><h4>${esc(d.name)}</h4><p>${esc(d.desc)}</p></div>`;
    });
    h += `</div>`;
  }

  // 좋은/나쁜 음식
  if ((ht.good_foods && ht.good_foods.length) || (ht.bad_foods && ht.bad_foods.length)) {
    h += `<div class="result-card"><h3>음식 가이드</h3><div class="food-grid">`;
    if (ht.good_foods) {
      ht.good_foods.forEach(f => {
        h += `<div class="food-item good"><div class="fi-name">O ${esc(f.name)}</div><div class="fi-reason">${esc(f.reason)}</div></div>`;
      });
    }
    if (ht.bad_foods) {
      ht.bad_foods.forEach(f => {
        h += `<div class="food-item bad"><div class="fi-name">X ${esc(f.name)}</div><div class="fi-reason">${esc(f.reason)}</div></div>`;
      });
    }
    h += `</div></div>`;
  }

  // 영양제
  if (ht.supplements && ht.supplements.length) {
    h += `<div class="result-card"><h3>추천 영양제</h3><div class="food-grid">`;
    ht.supplements.forEach(s => {
      h += `<div class="food-item good"><div class="fi-name">${esc(s.name)}</div><div class="fi-reason">${esc(s.reason)}</div></div>`;
    });
    h += `</div></div>`;
  }

  // 운동
  if ((ht.good_exercises && ht.good_exercises.length) || (ht.bad_exercises && ht.bad_exercises.length)) {
    h += `<div class="result-card"><h3>운동 가이드</h3><div class="food-grid">`;
    if (ht.good_exercises) {
      ht.good_exercises.forEach(e => {
        h += `<div class="food-item good"><div class="fi-name">O ${esc(e.name)}</div><div class="fi-reason">${esc(e.reason)}</div></div>`;
      });
    }
    if (ht.bad_exercises) {
      ht.bad_exercises.forEach(e => {
        h += `<div class="food-item bad"><div class="fi-name">X ${esc(e.name)}</div><div class="fi-reason">${esc(e.reason)}</div></div>`;
      });
    }
    h += `</div></div>`;
  }

  // 생활습관
  if ((ht.lifestyle_good && ht.lifestyle_good.length) || (ht.lifestyle_bad && ht.lifestyle_bad.length)) {
    h += `<div class="result-card"><h3>생활습관 가이드</h3><div class="lifestyle-list">`;
    if (ht.lifestyle_good) {
      ht.lifestyle_good.forEach(l => {
        h += `<div class="lifestyle-item"><span class="li-icon">O</span><div class="li-content"><div class="li-habit">${esc(l.habit)}</div><div class="li-reason">${esc(l.reason)}</div></div></div>`;
      });
    }
    if (ht.lifestyle_bad) {
      ht.lifestyle_bad.forEach(l => {
        h += `<div class="lifestyle-item"><span class="li-icon">X</span><div class="li-content"><div class="li-habit">${esc(l.habit)}</div><div class="li-reason">${esc(l.reason)}</div></div></div>`;
      });
    }
    h += `</div></div>`;
  }

  if (ht.summary) {
    h += `<div class="result-card" style="background:#fafafa"><h3>건강운 총평</h3><div class="interp-block"><p>${esc(ht.summary)}</p></div></div>`;
  }
  h += `</div>`; // end health section

  // ===== 직업운 섹션 =====
  h += `<div class="ny-section" id="nySection_career">`;
  h += `<div class="result-card"><h3>2026년 직업운</h3><div class="interp-block"><p>${esc(cr.overview)}</p></div></div>`;

  h += `<div class="result-card"><h3>월별 직업운 점수</h3>${renderMonthlyChart(cr.monthly_scores)}</div>`;

  if (cr.reputation) {
    h += `<div class="result-card"><h3>평판 분석</h3><div class="interp-block"><p>${esc(cr.reputation)}</p></div></div>`;
  }

  // 도움/위험 인물
  if ((cr.helpful_people && cr.helpful_people.length) || (cr.dangerous_people && cr.dangerous_people.length)) {
    h += `<div class="result-card"><h3>주변 인물 분석</h3>`;
    if (cr.helpful_people) {
      cr.helpful_people.forEach(p => {
        h += `<div class="people-card helpful"><div class="pc-type">도움: ${esc(p.type)}</div><div class="pc-desc">${esc(p.desc)}</div></div>`;
      });
    }
    if (cr.dangerous_people) {
      cr.dangerous_people.forEach(p => {
        h += `<div class="people-card dangerous"><div class="pc-type">주의: ${esc(p.type)}</div><div class="pc-desc">${esc(p.desc)}</div></div>`;
      });
    }
    h += `</div>`;
  }

  // 직장인/사업가 조언
  if (cr.employee_advice || cr.business_advice) {
    h += `<div class="result-card"><h3>맞춤 조언</h3>`;
    if (cr.employee_advice) {
      h += `<div class="fortune-card info"><h4>직장인</h4><p>${esc(cr.employee_advice)}</p></div>`;
    }
    if (cr.business_advice) {
      h += `<div class="fortune-card good"><h4>사업가</h4><p>${esc(cr.business_advice)}</p></div>`;
    }
    h += `</div>`;
  }

  // 좋은/나쁜 시기
  if ((cr.good_months && cr.good_months.length) || (cr.bad_months && cr.bad_months.length)) {
    h += `<div class="result-card"><h3>주요 시기</h3>`;
    if (cr.good_months) {
      cr.good_months.forEach(m => {
        h += `<div class="month-point-card good"><div class="mpc-month">${m.month}월</div><div class="mpc-text">${esc(m.opportunity)}</div></div>`;
      });
    }
    if (cr.bad_months) {
      cr.bad_months.forEach(m => {
        h += `<div class="month-point-card bad"><div class="mpc-month">${m.month}월</div><div class="mpc-text">${esc(m.warning)}</div></div>`;
      });
    }
    h += `</div>`;
  }

  if (cr.summary) {
    h += `<div class="result-card" style="background:#fafafa"><h3>직업운 총평</h3><div class="interp-block"><p>${esc(cr.summary)}</p></div></div>`;
  }
  h += `</div>`; // end career section

  // 공유/프린트/다시 분석하기 버튼
  const nyTheme = esc(cg.year_theme || '2026 병오년 신년운세');
  h += `<div class="result-card action-buttons">
    <button class="share-btn" onclick="shareResult('사주포털', generateResultSummary('newyear', lastResults.newyear))">결과 공유하기</button>
    <button class="print-btn" onclick="printResult()">프린트</button>
    <button class="retry-btn" onclick="resetForm('newyear')">다시 분석하기</button>
  </div>`;

  try {
    document.getElementById('newyearResult').innerHTML = h;
    document.getElementById('newyearResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    animateResultCards('newyearResult');
    if (saju.ohengAnalysis && saju.ohengAnalysis.strongest) {
      setOhengTheme(saju.ohengAnalysis.strongest.name);
    }
  } catch (e) {
    console.error('렌더링 오류:', e);
    document.getElementById('newyearResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">결과 표시 중 오류가 발생했습니다</p><button class="retry-btn" onclick="resetForm('newyear')">다시 시도</button></div>`;
  }
}

// ===== 리셋 =====
function resetForm(type) {
  const fm = {basic:'basicForm',today:'todayForm',compatibility:'compatForm',newyear:'newyearForm'};
  const fh = {basic:'basicFormHeader',today:'todayFormHeader',compatibility:'compatFormHeader',newyear:'newyearFormHeader'};
  const rm = {basic:'basicResult',today:'todayResult',compatibility:'compatResult',newyear:'newyearResult'};
  const em = {basic:'basicError',today:'todayError',compatibility:'compatError',newyear:'newyearError'};
  document.getElementById(fm[type]).style.display = 'block';
  document.getElementById(fh[type]).style.display = 'block';
  document.getElementById(rm[type]).innerHTML = '';
  const errEl = document.getElementById(em[type]);
  if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
  window.scrollTo(0, 0);
}

// ===== 연도 빠른 선택 =====
function setYearPreset(btn, decade) {
  const targetId = btn.parentElement.dataset.target;
  const input = document.getElementById(targetId);
  input.value = decade + 5;
  input.focus();
  btn.parentElement.querySelectorAll('.year-preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ===== FAQ 토글 =====
function toggleFaq(item) {
  item.classList.toggle('open');
}

// ===== 결과 섹션 접기/펼치기 =====
function toggleResultSection(el) {
  const card = el.closest('.result-card');
  if (card) card.classList.toggle('collapsed');
}

// ===== 실시간 폼 유효성 검사 =====
function setupRealtimeValidation() {
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', function() {
      if (this.id.includes('Year')) {
        const val = parseInt(this.value);
        if (this.value && (val < 1920 || val > 2030)) {
          this.style.borderColor = 'var(--accent)';
        } else {
          this.style.borderColor = '';
        }
      }
      if (this.id.includes('Day')) {
        const val = parseInt(this.value);
        if (this.value && (val < 1 || val > 31)) {
          this.style.borderColor = 'var(--accent)';
        } else {
          this.style.borderColor = '';
        }
      }
    });
  });
}

// ===== Enter키로 폼 제출 =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !state.loading) {
    const page = state.currentPage;
    if (page === 'basic') submitBasic();
    else if (page === 'today') submitToday();
    else if (page === 'compatibility') submitCompatibility();
    else if (page === 'newyear') submitNewYear();
  }
});

// ===== 맨 위로 버튼 =====
(function() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ===== 스크롤 진행 표시기 =====
(function() {
  let indicator = document.createElement('div');
  indicator.className = 'scroll-indicator';
  document.body.prepend(indicator);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      indicator.style.width = (scrollTop / docHeight * 100) + '%';
    }
  }, { passive: true });
})();

// ===== 자동 포커스 (연도→월→일) =====
function setupAutoFocus() {
  // When year input has 4 digits, auto-focus to month
  document.querySelectorAll('input[type="number"]').forEach(input => {
    if (input.id.includes('Year')) {
      input.addEventListener('input', function() {
        if (this.value.length === 4) {
          // Find the next month select in the same form
          const monthSelect = this.closest('.form-row').nextElementSibling?.querySelector('select')
            || this.closest('.form-section').querySelector('select');
          if (monthSelect) monthSelect.focus();
        }
      });
    }
  });

  // When month is selected, auto-focus to day
  document.querySelectorAll('select').forEach(select => {
    if (select.id.includes('Month')) {
      select.addEventListener('change', function() {
        if (this.value) {
          const dayInput = this.closest('.form-row')?.querySelector('input[id*="Day"]')
            || this.closest('.form-section').querySelector('input[id*="Day"]');
          if (dayInput) dayInput.focus();
        }
      });
    }
  });
}

// ===== 스와이프 탭 전환 =====
(function() {
  let touchStartX = 0;
  let touchEndX = 0;
  const pages = ['home', 'basic', 'compatibility', 'newyear', 'today'];

  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) < 60) return; // minimum swipe distance

    const currentIdx = pages.indexOf(state.currentPage);
    if (currentIdx === -1) return;

    if (diff > 0 && currentIdx < pages.length - 1) {
      // Swipe left → next page
      openPage(pages[currentIdx + 1]);
    } else if (diff < 0 && currentIdx > 0) {
      // Swipe right → previous page
      openPage(pages[currentIdx - 1]);
    }
  }, { passive: true });
})();

// ===== 빠른 재분석 버튼 =====
(function() {
  const btn = document.createElement('button');
  btn.className = 'quick-reanalyze-btn';
  btn.innerHTML = '&#x21bb; 재분석';
  btn.onclick = () => {
    const page = state.currentPage;
    resetForm(page === 'compatibility' ? 'compatibility' : page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    const isResultPage = state.currentPage !== 'home';
    const resultIds = { basic: 'basicResult', today: 'todayResult', compatibility: 'compatResult', newyear: 'newyearResult' };
    const resultEl = document.getElementById(resultIds[state.currentPage]);
    const hasResult = resultEl && resultEl.innerHTML.trim().length > 100;
    btn.classList.toggle('show', isResultPage && hasResult && window.scrollY > 300);
  }, { passive: true });
})();

// ===== 글자 크기 조절 =====
let resultFontSize = 100; // percentage

function adjustFontSize(delta) {
  resultFontSize = Math.max(80, Math.min(130, resultFontSize + delta));
  document.querySelectorAll('.result-card').forEach(card => {
    card.style.fontSize = resultFontSize + '%';
  });
  showToast('글자 크기: ' + resultFontSize + '%');
}

// 글자 크기 조절 UI
(function() {
  const wrap = document.createElement('div');
  wrap.className = 'font-size-controls';
  wrap.innerHTML = '<button onclick="adjustFontSize(-10)" aria-label="글자 작게">A-</button><button onclick="adjustFontSize(10)" aria-label="글자 크게">A+</button>';
  document.body.appendChild(wrap);

  window.addEventListener('scroll', () => {
    const isResultPage = state.currentPage !== 'home';
    wrap.classList.toggle('show', isResultPage && window.scrollY > 200);
  }, { passive: true });
})();
