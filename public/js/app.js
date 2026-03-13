// ===== 전역 상태 =====
const state = {
  currentPage: 'home',
  genders: { basic: 'male', today: 'male', compat1: 'male', compat2: 'female', newyear: 'male' }
};

// ===== XSS 방지: HTML 이스케이프 =====
function esc(str) {
  if (str == null) return '';
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

// ===== 초기화 =====
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loadingScreen').classList.add('hide'), 800);
});

// ===== 페이지 네비게이션 =====
function openPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => {
    t.classList.toggle('active', t.dataset.page === page);
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
  btn.parentElement.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.genders[formType] = btn.dataset.gender;
}

// ===== 유효성 =====
function validateForm(prefix) {
  const y = document.getElementById(`${prefix}Year`).value;
  const m = document.getElementById(`${prefix}Month`).value;
  const d = document.getElementById(`${prefix}Day`).value;
  if (!y || !m || !d) return { valid: false, error: '생년월일을 모두 입력해주세요' };
  if (y < 1920 || y > 2025) return { valid: false, error: '1920~2025년 사이로 입력해주세요' };
  if (d < 1 || d > 31) return { valid: false, error: '올바른 일자를 입력해주세요' };
  return { valid: true };
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function showAnalyzing(targetId) {
  document.getElementById(targetId).innerHTML = `
    <div class="analyzing">
      <div class="an-spinner"></div>
      <p>사주를 분석하고 있습니다<span class="dots"></span></p>
      <p style="font-size:0.78rem;color:var(--text-muted);margin-top:6px">AI가 정성껏 풀어드리는 중...</p>
    </div>`;
}

async function apiCall(endpoint, body) {
  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error('서버 오류');
  return res.json();
}

// ===== 기본 사주 =====
async function submitBasic() {
  const v = validateForm('basic');
  if (!v.valid) return showError('basicError', v.error);
  document.getElementById('basicForm').style.display = 'none';
  document.getElementById('basicFormHeader').style.display = 'none';
  showAnalyzing('basicResult');
  try {
    const data = await apiCall('/api/saju/basic', {
      year: document.getElementById('basicYear').value,
      month: document.getElementById('basicMonth').value,
      day: document.getElementById('basicDay').value,
      hour: parseInt(document.getElementById('basicHour').value),
      gender: state.genders.basic
    });
    renderBasicResult(data);
  } catch(e) {
    document.getElementById('basicResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">분석 중 오류가 발생했습니다.</p><button class="retry-btn" onclick="resetForm('basic')">다시 시도</button></div>`;
  }
}

function renderBasicResult(data) {
  const { saju, interpretation: interp } = data;
  const pillars = [saju.yearPillar, saju.monthPillar, saju.dayPillar];
  if (saju.hourPillar) pillars.push(saju.hourPillar);
  const oh = saju.ohengAnalysis;
  const ey = saju.eumyangRatio;
  let h = '';

  // 일간 히어로
  h += `<div class="ilgan-hero">
    <div class="animal-emoji">${saju.animalEmoji}</div>
    <div class="ilgan-name">${saju.personality.title} · ${saju.ilgan}일간</div>
    <div class="ilgan-sub">${esc(saju.animal)}띠 · ${esc(interp.summary || saju.personality.desc)}</div>
    <div class="ilgan-trait">${saju.personality.trait}</div>
  </div>`;

  // 사주팔자
  h += `<div class="result-card"><h3>사주팔자</h3><div class="saju-table">`;
  pillars.forEach(p => {
    h += `<div class="saju-col">
      <div class="col-label">${p.name}</div>
      <div class="col-top" style="color:${p.cheonganColor}">${p.cheonganHanja}</div>
      <div class="col-bottom" style="color:${p.jijiColor}">${p.jijiHanja}</div>
      <div class="col-korean">${p.cheongan}${p.jiji}</div>
    </div>`;
  });
  h += `</div>`;
  const yPct = Math.round((ey.yang / ey.total) * 100);
  h += `<div class="eumyang-bar-wrap"><div class="eumyang-bar"><div class="yang" style="width:${yPct}%"></div><div class="eum" style="width:${100 - yPct}%"></div></div><div class="eumyang-labels"><span>양 ${ey.yang}</span><span>음 ${ey.eum}</span></div></div></div>`;

  // 오행
  h += `<div class="result-card"><h3>오행 분석</h3><div class="oheng-chart">`;
  [{k:'목',c:'wood',e:'🌳'},{k:'화',c:'fire',e:'🔥'},{k:'토',c:'earth',e:'⛰️'},{k:'금',c:'metal',e:'⚔️'},{k:'수',c:'water',e:'💧'}].forEach(o => {
    const pct = oh.percentages[o.k];
    h += `<div class="oheng-row"><div class="oh-label">${o.e} ${o.k}</div><div class="oh-bar-wrap"><div class="oh-bar ${o.c}" style="width:${Math.max(pct, 5)}%">${pct}%</div></div></div>`;
  });
  if (oh.missing.length) h += `<div class="oheng-missing">⚠ 부족한 오행: ${oh.missing.join(', ')}</div>`;
  h += `</div></div>`;

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
  h += `<div class="result-card"><button class="retry-btn" onclick="resetForm('basic')">다시 분석하기</button></div>`;
  document.getElementById('basicResult').innerHTML = h;
}

// ===== 오늘의 운세 =====
async function submitToday() {
  const v = validateForm('today');
  if (!v.valid) return showError('todayError', v.error);
  document.getElementById('todayForm').style.display = 'none';
  document.getElementById('todayFormHeader').style.display = 'none';
  showAnalyzing('todayResult');
  try {
    const data = await apiCall('/api/saju/today', {
      year: document.getElementById('todayYear').value,
      month: document.getElementById('todayMonth').value,
      day: document.getElementById('todayDay').value,
      hour: parseInt(document.getElementById('todayHour').value),
      gender: state.genders.today
    });
    renderTodayResult(data);
  } catch(e) {
    document.getElementById('todayResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">오류 발생</p><button class="retry-btn" onclick="resetForm('today')">다시 시도</button></div>`;
  }
}

function renderTodayResult(data) {
  const { today, interpretation: interp } = data;
  const cls = interp.score >= 80 ? 'high' : interp.score >= 50 ? 'mid' : 'low';
  let h = '';
  h += `<div class="today-hero">
    <div class="today-date">${today.date}</div>
    <div class="today-ilgin">오늘의 일진: ${today.dayPillar.cheongan}${today.dayPillar.jiji}</div>
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
  h += `<div class="result-card"><button class="retry-btn" onclick="resetForm('today')">다시 보기</button></div>`;
  document.getElementById('todayResult').innerHTML = h;
}

// ===== 궁합 =====
async function submitCompatibility() {
  const v1 = validateForm('compat1');
  if (!v1.valid) return showError('compatError', '첫 번째 사람: ' + v1.error);
  const v2 = validateForm('compat2');
  if (!v2.valid) return showError('compatError', '두 번째 사람: ' + v2.error);
  document.getElementById('compatForm').style.display = 'none';
  document.getElementById('compatFormHeader').style.display = 'none';
  showAnalyzing('compatResult');
  try {
    const data = await apiCall('/api/saju/compatibility', {
      person1: { year: document.getElementById('compat1Year').value, month: document.getElementById('compat1Month').value, day: document.getElementById('compat1Day').value, hour: parseInt(document.getElementById('compat1Hour').value), gender: state.genders.compat1 },
      person2: { year: document.getElementById('compat2Year').value, month: document.getElementById('compat2Month').value, day: document.getElementById('compat2Day').value, hour: parseInt(document.getElementById('compat2Hour').value), gender: state.genders.compat2 }
    });
    renderCompatResult(data);
  } catch(e) {
    document.getElementById('compatResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">오류 발생</p><button class="retry-btn" onclick="resetForm('compatibility')">다시 시도</button></div>`;
  }
}

function renderCompatResult(data) {
  const { saju1, saju2, compatibility } = data;
  const interp = compatibility.interpretation;
  const score = compatibility.score;
  let h = '';

  h += `<div class="compat-score-hero">
    <div class="compat-score-num">${score}<span style="font-size:1.5rem">점</span></div>
    <div class="compat-score-title">${esc(interp.title || '인연의 만남')}</div>
  </div>`;

  // 사주 비교
  h += `<div class="result-card"><h3>사주 비교</h3><div class="saju-compare">
    <div class="saju-compare-side"><div class="side-label">${saju1.personality.title}</div><div class="saju-mini-pillars">
      ${[saju1.yearPillar,saju1.monthPillar,saju1.dayPillar].map(p=>`<div class="saju-mini-col"><div class="mc-top" style="color:${p.cheonganColor}">${p.cheonganHanja}</div><div class="mc-bottom" style="color:${p.jijiColor}">${p.jijiHanja}</div></div>`).join('')}
    </div></div>
    <div style="display:flex;align-items:center;font-size:1.2rem;color:var(--accent)">♥</div>
    <div class="saju-compare-side"><div class="side-label">${saju2.personality.title}</div><div class="saju-mini-pillars">
      ${[saju2.yearPillar,saju2.monthPillar,saju2.dayPillar].map(p=>`<div class="saju-mini-col"><div class="mc-top" style="color:${p.cheonganColor}">${p.cheonganHanja}</div><div class="mc-bottom" style="color:${p.jijiColor}">${p.jijiHanja}</div></div>`).join('')}
    </div></div>
  </div></div>`;

  // 점수 바
  if (interp.scores) {
    h += `<div class="result-card"><h3>세부 궁합 점수</h3>`;
    [{n:'연애 궁합',k:'love'},{n:'소통 궁합',k:'communication'},{n:'가치관 궁합',k:'values'},{n:'미래 궁합',k:'future'}].forEach(item => {
      const val = interp.scores[item.k] || score;
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
  h += `<div class="result-card"><button class="retry-btn" onclick="resetForm('compatibility')">다시 분석하기</button></div>`;
  document.getElementById('compatResult').innerHTML = h;
}

// ===== 신년운세 =====
async function submitNewYear() {
  const v = validateForm('newyear');
  if (!v.valid) return showError('newyearError', v.error);
  document.getElementById('newyearForm').style.display = 'none';
  document.getElementById('newyearFormHeader').style.display = 'none';
  showAnalyzing('newyearResult');
  try {
    const data = await apiCall('/api/saju/newyear', {
      year: document.getElementById('newyearYear').value,
      month: document.getElementById('newyearMonth').value,
      day: document.getElementById('newyearDay').value,
      hour: parseInt(document.getElementById('newyearHour').value),
      gender: state.genders.newyear
    });
    renderNewYearResult(data);
  } catch(e) {
    document.getElementById('newyearResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">오류 발생</p><button class="retry-btn" onclick="resetForm('newyear')">다시 시도</button></div>`;
  }
}

function renderNewYearResult(data) {
  const { saju, interpretation: interp } = data;
  if (!interp) {
    document.getElementById('newyearResult').innerHTML = `<div class="result-card"><p style="text-align:center;color:var(--accent)">AI 분석 실패</p><button class="retry-btn" onclick="resetForm('newyear')">다시 시도</button></div>`;
    return;
  }
  let h = '';
  h += `<div class="newyear-hero">
    <div class="ny-emoji">🐴</div>
    <div class="ny-year">2026 병오년</div>
    <div class="ny-sub">${saju.personality.title} · ${saju.ilgan}일간의 신년운세</div>
    <div class="ny-theme">${esc(interp.year_theme)}</div>
  </div>`;

  h += `<div class="result-card"><h3>2026년 총운</h3><div class="interp-block"><p>${esc(interp.year_overview)}</p></div></div>`;
  h += `<div class="result-card"><h3>분야별 운세</h3>
    <div class="interp-block"><h4>직업/사업운</h4><p>${esc(interp.career_year)}</p></div>
    <div class="interp-block"><h4>재물운</h4><p>${esc(interp.wealth_year)}</p></div>
    <div class="interp-block"><h4>연애/결혼운</h4><p>${esc(interp.love_year)}</p></div>
    <div class="interp-block"><h4>건강운</h4><p>${esc(interp.health_year)}</p></div>
  </div>`;

  if (interp.monthly) {
    h += `<div class="result-card"><h3>월별 운세</h3><div class="monthly-grid">`;
    interp.monthly.forEach(m => {
      const isBest = interp.best_months && interp.best_months.includes(m.month);
      const isCaution = interp.caution_months && interp.caution_months.includes(m.month);
      h += `<div class="month-card ${isBest?'best':isCaution?'caution':''}">
        <div class="mc-num">${m.month}월 ${isBest?'★':isCaution?'⚠':''}</div>
        <div class="mc-title">${esc(m.title)}</div>
        <div class="mc-desc">${esc(m.desc)}</div>
      </div>`;
    });
    h += `</div></div>`;
  }

  if (interp.lucky) {
    h += `<div class="result-card"><h3>2026년 행운 요소</h3><div class="lucky-grid">
      <div class="lucky-item"><div class="lk-label">행운의 색</div><div class="lk-value">${esc(interp.lucky.color)}</div></div>
      <div class="lucky-item"><div class="lk-label">행운의 숫자</div><div class="lk-value">${esc(interp.lucky.number)}</div></div>
      <div class="lucky-item"><div class="lk-label">행운의 방향</div><div class="lk-value">${esc(interp.lucky.direction)}</div></div>
    </div></div>`;
  }
  if (interp.final_advice) {
    h += `<div class="result-card" style="background:#fafafa"><h3>2026년 종합 조언</h3><div class="interp-block"><p>${esc(interp.final_advice)}</p></div></div>`;
  }
  h += `<div class="result-card"><button class="retry-btn" onclick="resetForm('newyear')">다시 분석하기</button></div>`;
  document.getElementById('newyearResult').innerHTML = h;
}

// ===== 리셋 =====
function resetForm(type) {
  const fm = {basic:'basicForm',today:'todayForm',compatibility:'compatForm',newyear:'newyearForm'};
  const fh = {basic:'basicFormHeader',today:'todayFormHeader',compatibility:'compatFormHeader',newyear:'newyearFormHeader'};
  const rm = {basic:'basicResult',today:'todayResult',compatibility:'compatResult',newyear:'newyearResult'};
  document.getElementById(fm[type]).style.display = 'block';
  document.getElementById(fh[type]).style.display = 'block';
  document.getElementById(rm[type]).innerHTML = '';
  window.scrollTo(0, 0);
}
