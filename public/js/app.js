// ===== 전역 상태 =====
const state = {
  currentPage: 'home',
  genders: {
    basic: 'male',
    today: 'male',
    compat1: 'male',
    compat2: 'female',
    newyear: 'male'
  }
};

// ===== 초기화 =====
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.add('hide');
  }, 1200);
});

// ===== 페이지 네비게이션 =====
function openPage(page) {
  // 모든 페이지 숨기기
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // 네비 활성화
  document.querySelectorAll('.bottom-nav .nav-item').forEach((n, i) => {
    n.classList.remove('active');
    const pages = ['home', 'basic', 'today', 'compatibility', 'newyear'];
    if (pages[i] === page) n.classList.add('active');
  });

  // 타겟 페이지 표시
  const pageMap = {
    home: 'pageHome',
    basic: 'pageBasic',
    today: 'pageToday',
    compatibility: 'pageCompatibility',
    newyear: 'pageNewyear'
  };

  const targetId = pageMap[page];
  if (targetId) {
    document.getElementById(targetId).classList.add('active');
  }

  // 헤더 업데이트
  const titles = {
    home: '사주포털',
    basic: '기본 사주풀이',
    today: '오늘의 운세',
    compatibility: '사주 궁합',
    newyear: '2026 신년운세'
  };
  const subtitles = {
    home: 'AI가 풀어주는 당신의 운명',
    basic: '사주팔자로 보는 당신의 모든 것',
    today: '오늘 하루 행운 가이드',
    compatibility: '두 사람의 인연을 분석합니다',
    newyear: '병오년 월별 상세 운세'
  };

  document.getElementById('headerTitle').textContent = titles[page] || '사주포털';
  document.getElementById('headerSubtitle').textContent = subtitles[page] || '';
  document.getElementById('backBtn').classList.toggle('show', page !== 'home');

  state.currentPage = page;
  window.scrollTo(0, 0);
}

function goHome() {
  openPage('home');
}

// ===== 성별 선택 =====
function selectGender(btn, formType) {
  const parent = btn.parentElement;
  parent.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.genders[formType] = btn.dataset.gender;
}

// ===== 유효성 검사 =====
function validateForm(prefix) {
  const year = document.getElementById(`${prefix}Year`).value;
  const month = document.getElementById(`${prefix}Month`).value;
  const day = document.getElementById(`${prefix}Day`).value;

  if (!year || !month || !day) {
    return { valid: false, error: '생년월일을 모두 입력해주세요' };
  }
  if (year < 1920 || year > 2025) {
    return { valid: false, error: '1920~2025년 사이로 입력해주세요' };
  }
  if (day < 1 || day > 31) {
    return { valid: false, error: '올바른 일자를 입력해주세요' };
  }
  return { valid: true };
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ===== 로딩 표시 =====
function showAnalyzing(targetId) {
  document.getElementById(targetId).innerHTML = `
    <div class="analyzing">
      <div class="spinner"></div>
      <p>사주를 분석하고 있습니다<span class="dots"></span></p>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">AI가 정성껏 풀어드리는 중...</p>
    </div>
  `;
}

// ===== API 호출 =====
async function apiCall(endpoint, body) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('서버 오류');
  return res.json();
}

// ===== 기본 사주 =====
async function submitBasic() {
  const v = validateForm('basic');
  if (!v.valid) return showError('basicError', v.error);

  const year = document.getElementById('basicYear').value;
  const month = document.getElementById('basicMonth').value;
  const day = document.getElementById('basicDay').value;
  const hour = document.getElementById('basicHour').value;

  document.getElementById('basicForm').style.display = 'none';
  showAnalyzing('basicResult');

  try {
    const data = await apiCall('/api/saju/basic', {
      year, month, day, hour: parseInt(hour), gender: state.genders.basic
    });
    renderBasicResult(data);
  } catch (e) {
    document.getElementById('basicResult').innerHTML = `
      <div class="result-section">
        <p style="text-align:center;color:var(--danger);">분석 중 오류가 발생했습니다. 다시 시도해주세요.</p>
        <button class="retry-btn" onclick="resetForm('basic')">다시 입력하기</button>
      </div>
    `;
  }
}

function renderBasicResult(data) {
  const { saju, interpretation: interp } = data;
  const pillars = [saju.yearPillar, saju.monthPillar, saju.dayPillar];
  if (saju.hourPillar) pillars.push(saju.hourPillar);

  const oheng = saju.ohengAnalysis;
  const ey = saju.eumyangRatio;

  let html = '';

  // 일간 카드
  html += `
    <div class="ilgan-card">
      <div class="animal-emoji">${saju.animalEmoji}</div>
      <div class="ilgan-title">${saju.personality.title} · ${saju.ilgan}일간</div>
      <div class="ilgan-sub">${saju.animal}띠 · ${interp.summary || saju.personality.desc}</div>
      <div class="ilgan-trait">${saju.personality.trait}</div>
    </div>
  `;

  // 사주 팔자
  html += `<div class="result-section"><h3>📋 사주팔자</h3><div class="saju-pillars">`;
  pillars.forEach(p => {
    html += `
      <div class="pillar">
        <div class="label">${p.name}</div>
        <div class="hanja">
          <span class="top" style="color:${p.cheonganColor}">${p.cheonganHanja}</span>
          <span class="bottom" style="color:${p.jijiColor}">${p.jijiHanja}</span>
        </div>
        <div class="korean">${p.cheongan}${p.jiji}</div>
        <div>
          <span class="oheng-dot" style="background:${p.cheonganColor}"></span>
          <span class="oheng-dot" style="background:${p.jijiColor}"></span>
        </div>
      </div>
    `;
  });
  html += `</div>`;

  // 음양
  const yangPct = Math.round((ey.yang / ey.total) * 100);
  html += `
    <div class="eumyang-bar">
      <div class="yang" style="width:${yangPct}%"></div>
      <div class="eum" style="width:${100 - yangPct}%"></div>
    </div>
    <div class="eumyang-labels">
      <span>☀️ 양 ${ey.yang}</span>
      <span>🌙 음 ${ey.eum}</span>
    </div>
  `;
  html += `</div>`;

  // 오행 차트
  html += `<div class="result-section"><h3>🌿 오행 분석</h3><div class="oheng-chart">`;
  const ohengMap = [
    { key: '목', cls: 'wood', emoji: '🌳' },
    { key: '화', cls: 'fire', emoji: '🔥' },
    { key: '토', cls: 'earth', emoji: '⛰️' },
    { key: '금', cls: 'metal', emoji: '⚔️' },
    { key: '수', cls: 'water', emoji: '💧' }
  ];
  ohengMap.forEach(o => {
    const pct = oheng.percentages[o.key];
    html += `
      <div class="oheng-bar-row">
        <div class="label">${o.emoji} ${o.key}</div>
        <div class="oheng-bar-wrap">
          <div class="oheng-bar ${o.cls}" style="width:${Math.max(pct, 5)}%">${pct}%</div>
        </div>
      </div>
    `;
  });
  if (oheng.missing.length > 0) {
    html += `<p style="font-size:0.85rem;color:var(--warning);margin-top:8px;">⚠️ 부족한 오행: ${oheng.missing.join(', ')}</p>`;
  }
  html += `</div></div>`;

  // AI 해석 섹션들
  if (interp.personality) {
    html += `<div class="result-section">
      <h3>🧠 성격 분석</h3>
      <div class="interpret-block">
        <h4>핵심 성격</h4>
        <p>${interp.personality.core}</p>
      </div>
      <div class="interpret-block">
        <h4>💪 강점</h4>
        <ul>${interp.personality.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="interpret-block">
        <h4>⚡ 보완할 점</h4>
        <ul>${interp.personality.weaknesses.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="interpret-block">
        <h4>🤝 대인관계</h4>
        <p>${interp.personality.social}</p>
      </div>
    </div>`;
  }

  if (interp.career) {
    html += `<div class="result-section">
      <h3>💼 직업운</h3>
      <div class="interpret-block">
        <h4>적합한 분야</h4>
        <div>${interp.career.suitable.map(s => `<span class="tag primary">${s}</span>`).join('')}</div>
      </div>
      <div class="interpret-block" style="margin-top:12px">
        <p>${interp.career.advice}</p>
      </div>
    </div>`;
  }

  if (interp.wealth) {
    html += `<div class="result-section">
      <h3>💰 재물운</h3>
      <div class="interpret-block">
        <p>${interp.wealth.tendency}</p>
      </div>
      <div class="interpret-block">
        <h4>조언</h4>
        <p>${interp.wealth.advice}</p>
      </div>
    </div>`;
  }

  if (interp.love) {
    html += `<div class="result-section">
      <h3>❤️ 연애·결혼운</h3>
      <div class="interpret-block">
        <p>${interp.love.tendency}</p>
      </div>
      <div class="interpret-block">
        <h4>이상적인 상대</h4>
        <p>${interp.love.idealType}</p>
      </div>
    </div>`;
  }

  if (interp.health) {
    html += `<div class="result-section">
      <h3>🏥 건강운</h3>
      <div class="interpret-block">
        <h4>주의 부위</h4>
        <div>${interp.health.weak_points.map(s => `<span class="tag caution">${s}</span>`).join('')}</div>
      </div>
      <div class="interpret-block" style="margin-top:12px">
        <p>${interp.health.advice}</p>
      </div>
    </div>`;
  }

  if (interp.luck_elements) {
    html += `<div class="result-section">
      <h3>🍀 행운 요소</h3>
      <div class="lucky-items">
        <div class="lucky-item">
          <div class="lucky-label">행운의 색</div>
          <div class="lucky-value">${interp.luck_elements.color}</div>
        </div>
        <div class="lucky-item">
          <div class="lucky-label">행운의 숫자</div>
          <div class="lucky-value">${interp.luck_elements.number}</div>
        </div>
        <div class="lucky-item">
          <div class="lucky-label">행운의 방향</div>
          <div class="lucky-value">${interp.luck_elements.direction}</div>
        </div>
      </div>
    </div>`;
  }

  if (interp.yearly_flow) {
    html += `<div class="result-section">
      <h3>📆 2026년 운세 흐름</h3>
      <div class="interpret-block"><p>${interp.yearly_flow}</p></div>
    </div>`;
  }

  if (interp.life_advice) {
    html += `<div class="result-section" style="background:linear-gradient(135deg,#F8F6FF,#FFF0E8)">
      <h3>💫 인생 종합 조언</h3>
      <div class="interpret-block"><p>${interp.life_advice}</p></div>
    </div>`;
  }

  html += `<button class="retry-btn" onclick="resetForm('basic')">다시 분석하기</button>`;
  document.getElementById('basicResult').innerHTML = html;
}

// ===== 오늘의 운세 =====
async function submitToday() {
  const v = validateForm('today');
  if (!v.valid) return showError('todayError', v.error);

  const year = document.getElementById('todayYear').value;
  const month = document.getElementById('todayMonth').value;
  const day = document.getElementById('todayDay').value;
  const hour = document.getElementById('todayHour').value;

  document.getElementById('todayForm').style.display = 'none';
  showAnalyzing('todayResult');

  try {
    const data = await apiCall('/api/saju/today', {
      year, month, day, hour: parseInt(hour), gender: state.genders.today
    });
    renderTodayResult(data);
  } catch (e) {
    document.getElementById('todayResult').innerHTML = `
      <div class="result-section">
        <p style="text-align:center;color:var(--danger);">오류가 발생했습니다.</p>
        <button class="retry-btn" onclick="resetForm('today')">다시 시도</button>
      </div>
    `;
  }
}

function renderTodayResult(data) {
  const { saju, today, interpretation: interp } = data;
  let html = '';

  // 오늘 일진
  html += `<div class="result-section" style="text-align:center">
    <p style="font-size:0.85rem;color:var(--text-light)">${today.date}</p>
    <p style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">오늘의 일진: ${today.dayPillar.cheongan}${today.dayPillar.jiji} ${today.dayEmoji}</p>
  </div>`;

  // 점수
  const scoreColor = interp.score >= 80 ? 'var(--success)' : interp.score >= 50 ? 'var(--primary)' : 'var(--warning)';
  html += `<div class="result-section">
    <div class="today-score">
      <div class="big-emoji">${interp.emoji || '✨'}</div>
      <div class="score-text" style="color:${scoreColor}">${interp.score}점</div>
      <div class="score-desc">${interp.summary}</div>
    </div>
    <div class="interpret-block"><p>${interp.detail}</p></div>
  </div>`;

  // 분야별
  html += `<div class="result-section">
    <h3>📊 분야별 운세</h3>
    <div class="interpret-block"><h4>❤️ 연애운</h4><p>${interp.love}</p></div>
    <div class="interpret-block"><h4>💰 재물운</h4><p>${interp.money}</p></div>
    <div class="interpret-block"><h4>💼 직장/학업운</h4><p>${interp.work}</p></div>
    <div class="interpret-block"><h4>🏥 건강운</h4><p>${interp.health}</p></div>
  </div>`;

  // 행운 요소
  if (interp.lucky) {
    html += `<div class="result-section">
      <h3>🍀 오늘의 행운</h3>
      <div class="lucky-items">
        <div class="lucky-item">
          <div class="lucky-label">좋은 시간</div>
          <div class="lucky-value">${interp.lucky.time}</div>
        </div>
        <div class="lucky-item">
          <div class="lucky-label">행운 색</div>
          <div class="lucky-value">${interp.lucky.color}</div>
        </div>
        <div class="lucky-item">
          <div class="lucky-label">행운 음식</div>
          <div class="lucky-value">${interp.lucky.food}</div>
        </div>
      </div>
    </div>`;
  }

  // 주의사항
  if (interp.caution) {
    html += `<div class="result-section" style="background:#FFFBEB">
      <h3>⚠️ 오늘 주의할 점</h3>
      <div class="interpret-block"><p>${interp.caution}</p></div>
    </div>`;
  }

  html += `<button class="retry-btn" onclick="resetForm('today')">다시 보기</button>`;
  document.getElementById('todayResult').innerHTML = html;
}

// ===== 궁합 =====
async function submitCompatibility() {
  const v1 = validateForm('compat1');
  if (!v1.valid) return showError('compatError', '첫 번째 사람: ' + v1.error);
  const v2 = validateForm('compat2');
  if (!v2.valid) return showError('compatError', '두 번째 사람: ' + v2.error);

  document.getElementById('compatForm').style.display = 'none';
  showAnalyzing('compatResult');

  try {
    const data = await apiCall('/api/saju/compatibility', {
      person1: {
        year: document.getElementById('compat1Year').value,
        month: document.getElementById('compat1Month').value,
        day: document.getElementById('compat1Day').value,
        hour: parseInt(document.getElementById('compat1Hour').value),
        gender: state.genders.compat1
      },
      person2: {
        year: document.getElementById('compat2Year').value,
        month: document.getElementById('compat2Month').value,
        day: document.getElementById('compat2Day').value,
        hour: parseInt(document.getElementById('compat2Hour').value),
        gender: state.genders.compat2
      }
    });
    renderCompatResult(data);
  } catch (e) {
    document.getElementById('compatResult').innerHTML = `
      <div class="result-section">
        <p style="text-align:center;color:var(--danger);">궁합 분석 중 오류가 발생했습니다.</p>
        <button class="retry-btn" onclick="resetForm('compatibility')">다시 시도</button>
      </div>
    `;
  }
}

function renderCompatResult(data) {
  const { saju1, saju2, compatibility } = data;
  const interp = compatibility.interpretation;
  const score = compatibility.score;

  let html = '';

  // 두 사람 사주 + 점수
  const scoreColor = score >= 80 ? '#10B981' : score >= 60 ? '#6C3CE1' : '#F59E0B';
  html += `<div class="result-section" style="text-align:center">
    <div class="score-circle" style="background:linear-gradient(135deg,${scoreColor}22,${scoreColor}11);border:3px solid ${scoreColor}">
      <div class="number" style="color:${scoreColor}">${score}</div>
      <div class="unit" style="color:${scoreColor}">점</div>
    </div>
    <p style="font-size:1.1rem;font-weight:700">${interp.title || '인연의 만남'}</p>
  </div>`;

  // 두 사람 팔자 비교
  html += `<div class="result-section">
    <h3>📋 사주 비교</h3>
    <div style="display:flex;gap:12px">
      <div style="flex:1;text-align:center">
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">${saju1.gender === 'male' ? '👨' : '👩'} ${saju1.personality.title}</p>
        <div class="saju-pillars" style="margin:0">
          ${[saju1.yearPillar, saju1.monthPillar, saju1.dayPillar].map(p => `
            <div class="pillar" style="padding:8px 4px;max-width:60px">
              <div class="hanja" style="font-size:1.1rem">
                <span class="top" style="color:${p.cheonganColor}">${p.cheonganHanja}</span>
                <span class="bottom" style="color:${p.jijiColor}">${p.jijiHanja}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="flex:1;text-align:center">
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">${saju2.gender === 'male' ? '👨' : '👩'} ${saju2.personality.title}</p>
        <div class="saju-pillars" style="margin:0">
          ${[saju2.yearPillar, saju2.monthPillar, saju2.dayPillar].map(p => `
            <div class="pillar" style="padding:8px 4px;max-width:60px">
              <div class="hanja" style="font-size:1.1rem">
                <span class="top" style="color:${p.cheonganColor}">${p.cheonganHanja}</span>
                <span class="bottom" style="color:${p.jijiColor}">${p.jijiHanja}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>`;

  // 점수 바
  if (interp.scores) {
    html += `<div class="result-section"><h3>📊 세부 궁합 점수</h3>`;
    const scoreItems = [
      { name: '연애 궁합', key: 'love', emoji: '❤️' },
      { name: '소통 궁합', key: 'communication', emoji: '💬' },
      { name: '가치관 궁합', key: 'values', emoji: '⚖️' },
      { name: '미래 궁합', key: 'future', emoji: '🔮' }
    ];
    scoreItems.forEach(item => {
      const val = interp.scores[item.key] || score;
      html += `
        <div class="compat-score-bar">
          <div class="bar-label">
            <span class="name">${item.emoji} ${item.name}</span>
            <span class="value">${val}점</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${val}%"></div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  // 상세 해석
  html += `<div class="result-section">
    <h3>💕 궁합 분석</h3>
    <div class="interpret-block"><p>${interp.overall}</p></div>
    <div class="interpret-block"><h4>💘 연애 케미</h4><p>${interp.love_chemistry}</p></div>
    <div class="interpret-block"><h4>💬 소통 방식</h4><p>${interp.communication}</p></div>
    <div class="interpret-block"><h4>⚡ 갈등 포인트</h4><p>${interp.conflict}</p></div>
  </div>`;

  // 장점 & 주의
  html += `<div class="result-section">
    <h3>✅ 이 커플의 장점</h3>
    <ul style="list-style:none;padding:0">
      ${interp.strengths.map(s => `<li style="padding:8px 0;padding-left:20px;position:relative;font-size:0.9rem"><span style="position:absolute;left:0;color:var(--success)">✓</span>${s}</li>`).join('')}
    </ul>
  </div>`;

  html += `<div class="result-section" style="background:#FFFBEB">
    <h3>⚠️ 주의할 점</h3>
    <ul style="list-style:none;padding:0">
      ${interp.cautions.map(s => `<li style="padding:8px 0;padding-left:20px;position:relative;font-size:0.9rem"><span style="position:absolute;left:0">⚠️</span>${s}</li>`).join('')}
    </ul>
  </div>`;

  // 조언
  html += `<div class="result-section" style="background:linear-gradient(135deg,#F8F6FF,#FFF0E8)">
    <h3>💫 종합 조언</h3>
    <div class="interpret-block"><p>${interp.advice}</p></div>
  </div>`;

  html += `<button class="retry-btn" onclick="resetForm('compatibility')">다시 분석하기</button>`;
  document.getElementById('compatResult').innerHTML = html;
}

// ===== 신년운세 =====
async function submitNewYear() {
  const v = validateForm('newyear');
  if (!v.valid) return showError('newyearError', v.error);

  const year = document.getElementById('newyearYear').value;
  const month = document.getElementById('newyearMonth').value;
  const day = document.getElementById('newyearDay').value;
  const hour = document.getElementById('newyearHour').value;

  document.getElementById('newyearForm').style.display = 'none';
  showAnalyzing('newyearResult');

  try {
    const data = await apiCall('/api/saju/newyear', {
      year, month, day, hour: parseInt(hour), gender: state.genders.newyear
    });
    renderNewYearResult(data);
  } catch (e) {
    document.getElementById('newyearResult').innerHTML = `
      <div class="result-section">
        <p style="text-align:center;color:var(--danger);">신년운세 분석 중 오류가 발생했습니다.</p>
        <button class="retry-btn" onclick="resetForm('newyear')">다시 시도</button>
      </div>
    `;
  }
}

function renderNewYearResult(data) {
  const { saju, interpretation: interp } = data;
  if (!interp) {
    document.getElementById('newyearResult').innerHTML = `
      <div class="result-section">
        <p style="text-align:center;color:var(--danger);">AI 분석에 실패했습니다. 다시 시도해주세요.</p>
        <button class="retry-btn" onclick="resetForm('newyear')">다시 시도</button>
      </div>
    `;
    return;
  }

  let html = '';

  // 헤더
  html += `<div class="ilgan-card" style="background:linear-gradient(135deg,#FF6B35,#FF8F5E)">
    <div class="animal-emoji">🐴</div>
    <div class="ilgan-title">2026 병오년</div>
    <div class="ilgan-sub">${saju.personality.title} · ${saju.ilgan}일간의 신년운세</div>
    <div class="ilgan-trait">${interp.year_theme}</div>
  </div>`;

  // 종합 운세
  html += `<div class="result-section">
    <h3>🎆 2026년 총운</h3>
    <div class="interpret-block"><p>${interp.year_overview}</p></div>
  </div>`;

  // 분야별
  html += `<div class="result-section">
    <h3>📊 분야별 운세</h3>
    <div class="interpret-block"><h4>💼 직업/사업운</h4><p>${interp.career_year}</p></div>
    <div class="interpret-block"><h4>💰 재물운</h4><p>${interp.wealth_year}</p></div>
    <div class="interpret-block"><h4>❤️ 연애/결혼운</h4><p>${interp.love_year}</p></div>
    <div class="interpret-block"><h4>🏥 건강운</h4><p>${interp.health_year}</p></div>
  </div>`;

  // 월별 운세
  if (interp.monthly) {
    html += `<div class="result-section"><h3>📅 월별 운세</h3><div class="monthly-grid">`;
    interp.monthly.forEach(m => {
      const isBest = interp.best_months && interp.best_months.includes(m.month);
      const isCaution = interp.caution_months && interp.caution_months.includes(m.month);
      const cls = isBest ? 'best' : isCaution ? 'caution' : '';
      html += `
        <div class="month-card ${cls}">
          <div class="month-num">${m.month}월 ${isBest ? '⭐' : isCaution ? '⚠️' : ''}</div>
          <div class="month-title">${m.title}</div>
          <div class="month-desc">${m.desc}</div>
        </div>
      `;
    });
    html += `</div></div>`;
  }

  // 행운 요소
  if (interp.lucky) {
    html += `<div class="result-section">
      <h3>🍀 2026년 행운 요소</h3>
      <div class="lucky-items">
        <div class="lucky-item">
          <div class="lucky-label">행운의 색</div>
          <div class="lucky-value">${interp.lucky.color}</div>
        </div>
        <div class="lucky-item">
          <div class="lucky-label">행운의 숫자</div>
          <div class="lucky-value">${interp.lucky.number}</div>
        </div>
        <div class="lucky-item">
          <div class="lucky-label">행운의 방향</div>
          <div class="lucky-value">${interp.lucky.direction}</div>
        </div>
      </div>
    </div>`;
  }

  // 종합 조언
  if (interp.final_advice) {
    html += `<div class="result-section" style="background:linear-gradient(135deg,#F8F6FF,#FFF0E8)">
      <h3>💫 2026년 종합 조언</h3>
      <div class="interpret-block"><p>${interp.final_advice}</p></div>
    </div>`;
  }

  html += `<button class="retry-btn" onclick="resetForm('newyear')">다시 분석하기</button>`;
  document.getElementById('newyearResult').innerHTML = html;
}

// ===== 폼 리셋 =====
function resetForm(type) {
  const formMap = {
    basic: 'basicForm',
    today: 'todayForm',
    compatibility: 'compatForm',
    newyear: 'newyearForm'
  };
  const resultMap = {
    basic: 'basicResult',
    today: 'todayResult',
    compatibility: 'compatResult',
    newyear: 'newyearResult'
  };

  document.getElementById(formMap[type]).style.display = 'block';
  document.getElementById(resultMap[type]).innerHTML = '';
  window.scrollTo(0, 0);
}
