// DOM Elements
const authScreen = document.getElementById('auth-screen');
const welcomeScreen = document.getElementById('welcome-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const historyScreen = document.getElementById('history-screen');

const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const authError = document.getElementById('auth-error');

const startBtn = document.getElementById('start-btn');
const viewHistoryBtn = document.getElementById('view-history-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const saveBtn = document.getElementById('save-btn');
const restartBtn = document.getElementById('restart-btn');
const backHomeBtn = document.getElementById('back-home-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');

const questionNumberEl = document.getElementById('question-number');
const questionTextEl = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const progressFill = document.getElementById('progress-fill');

const primaryResultEl = document.getElementById('primary-result');
const secondaryResultEl = document.getElementById('secondary-result');
const historyListEl = document.getElementById('history-list');

// State Variables
let currentQuestionIndex = 0;
// answers array to store user choices { most: 'D', least: 'C' }
let answers = Array(quizData.length).fill(null).map(() => ({ most: null, least: null }));
let radarChartInstance = null;

// Initialization
function init() {
  loginBtn.addEventListener('click', handleLogin);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  startBtn.addEventListener('click', startQuiz);
  viewHistoryBtn.addEventListener('click', showHistory);
  prevBtn.addEventListener('click', () => navigateQuestion(-1));
  nextBtn.addEventListener('click', () => navigateQuestion(1));
  saveBtn.addEventListener('click', saveResult);
  restartBtn.addEventListener('click', resetQuiz);
  backHomeBtn.addEventListener('click', () => switchScreen(welcomeScreen));
  clearHistoryBtn.addEventListener('click', clearHistory);
}

// Authentication
function handleLogin() {
  const pwd = passwordInput.value.trim();
  // 注意：此為前端驗證，僅作為簡易防護。
  if (pwd === '52404') {
    authError.textContent = '';
    switchScreen(welcomeScreen);
  } else {
    authError.textContent = '❌ 密碼錯誤，請重新輸入';
    passwordInput.value = '';
    passwordInput.focus();
  }
}

// Navigation & Screen Switching
function switchScreen(screen) {
  [authScreen, welcomeScreen, quizScreen, resultScreen, historyScreen].forEach(s => {
    s.classList.add('hidden');
  });
  screen.classList.remove('hidden');
}

function startQuiz() {
  currentQuestionIndex = 0;
  answers = Array(quizData.length).fill(null).map(() => ({ most: null, least: null }));
  switchScreen(quizScreen);
  renderQuestion();
}

function resetQuiz() {
  switchScreen(welcomeScreen);
}

// Quiz Rendering & Logic
function renderQuestion() {
  const currentQ = quizData[currentQuestionIndex];
  
  // Update Header
  questionNumberEl.textContent = `Question ${currentQuestionIndex + 1} / ${quizData.length}`;
  questionTextEl.textContent = currentQ.question;
  
  // Update Progress
  const progress = ((currentQuestionIndex) / quizData.length) * 100;
  progressFill.style.width = `${progress}%`;

  // Render Options
  optionsContainer.innerHTML = '';
  currentQ.options.forEach((opt, index) => {
    const row = document.createElement('div');
    row.className = 'option-row';
    
    // Check if currently selected
    const isMost = answers[currentQuestionIndex].most === opt.type;
    const isLeast = answers[currentQuestionIndex].least === opt.type;

    row.innerHTML = `
      <div class="option-text">${opt.text}</div>
      <div class="radio-group">
        <label class="radio-label most" title="最符合">
          <input type="radio" name="most_${currentQuestionIndex}" value="${opt.type}" ${isMost ? 'checked' : ''} onchange="handleSelection('${opt.type}', 'most')">
          <div class="custom-radio"></div>
        </label>
        <label class="radio-label least" title="最不符合">
          <input type="radio" name="least_${currentQuestionIndex}" value="${opt.type}" ${isLeast ? 'checked' : ''} onchange="handleSelection('${opt.type}', 'least')">
          <div class="custom-radio"></div>
        </label>
      </div>
    `;
    optionsContainer.appendChild(row);
  });

  updateNavButtons();
}

window.handleSelection = function(type, category) {
  // 記錄使用者的選擇
  answers[currentQuestionIndex][category] = type;
  
  // 互斥防呆邏輯：同一個選項不能同時為「最符合」與「最不符合」
  if (category === 'most' && answers[currentQuestionIndex].least === type) {
    answers[currentQuestionIndex].least = null;
    // 透過 DOM 操作取消另一個的勾選狀態，避免整個畫面重新渲染造成卡頓
    const leastRadio = document.querySelector(`input[name="least_${currentQuestionIndex}"][value="${type}"]`);
    if (leastRadio) leastRadio.checked = false;
  }
  if (category === 'least' && answers[currentQuestionIndex].most === type) {
    answers[currentQuestionIndex].most = null;
    const mostRadio = document.querySelector(`input[name="most_${currentQuestionIndex}"][value="${type}"]`);
    if (mostRadio) mostRadio.checked = false;
  }
  
  // 僅更新按鈕狀態，不重建 DOM
  updateNavButtons();
}

function updateNavButtons() {
  prevBtn.style.visibility = currentQuestionIndex === 0 ? 'hidden' : 'visible';
  
  const currentAns = answers[currentQuestionIndex];
  const isValid = currentAns.most !== null && currentAns.least !== null && currentAns.most !== currentAns.least;
  
  nextBtn.disabled = !isValid;
  
  // 更新提示訊息
  const hintEl = document.getElementById('validation-hint');
  if (hintEl) {
    if (isValid) {
      hintEl.textContent = '✅ 已完成選擇，請點擊下一題';
      hintEl.style.color = 'var(--primary-teal)';
    } else if (currentAns.most === null && currentAns.least === null) {
      hintEl.textContent = '⚠️ 必須：請各選出 1 個「最符合」與 1 個「最不符合」';
      hintEl.style.color = 'var(--secondary-red)';
    } else if (currentAns.most === null) {
      hintEl.textContent = '⚠️ 還差 1 個「最符合」，請點擊左側綠圈';
      hintEl.style.color = 'var(--secondary-red)';
    } else if (currentAns.least === null) {
      hintEl.textContent = '⚠️ 還差 1 個「最不符合」，請點擊右側紅圈';
      hintEl.style.color = 'var(--secondary-red)';
    }
  }
  
  if (currentQuestionIndex === quizData.length - 1) {
    nextBtn.textContent = '完成測驗';
  } else {
    nextBtn.textContent = '下一題';
  }
}

function navigateQuestion(dir) {
  if (dir === 1 && currentQuestionIndex === quizData.length - 1) {
    calculateResults();
  } else {
    currentQuestionIndex += dir;
    renderQuestion();
  }
}

// Result Calculation
function calculateResults() {
  const scores = { D: 0, I: 0, S: 0, C: 0 };
  
  answers.forEach(ans => {
    if (ans.most) scores[ans.most] += 1;
    if (ans.least) scores[ans.least] -= 1;
  });

  // Sort scores descending
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = sortedScores[0][0];
  const secondary = sortedScores[1][0];

  renderResultScreen(scores, primary, secondary);
}

function renderResultScreen(scores, primary, secondary) {
  switchScreen(resultScreen);
  progressFill.style.width = '100%';

  // Render Chart with Corporate Infographic Colors (Teal / Red)
  const ctx = document.getElementById('radarChart').getContext('2d');
  if (radarChartInstance) radarChartInstance.destroy();

  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['支配型 (D)', '影響型 (I)', '穩健型 (S)', '分析型 (C)'],
      datasets: [{
        label: '您的 DISC 分數',
        data: [scores.D, scores.I, scores.S, scores.C],
        backgroundColor: 'rgba(15, 118, 110, 0.15)', // Teal with opacity
        borderColor: '#0f766e', // Teal
        pointBackgroundColor: '#dc2626', // Red
        borderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      scales: {
        r: {
          min: -15,
          max: 15,
          ticks: { stepSize: 5, color: '#64748b', backdropColor: 'transparent' },
          grid: { color: 'rgba(0,0,0,0.05)' },
          angleLines: { color: 'rgba(0,0,0,0.05)' },
          pointLabels: { color: '#1e293b', font: { size: 14, family: 'Inter', weight: '600' } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Render Text Analysis
  const pData = resultAnalysis[primary];
  const sData = resultAnalysis[secondary];

  primaryResultEl.innerHTML = `
    <h3>🥇 主型性格：${pData.title} (得分: ${scores[primary]})</h3>
    <p><strong>核心特質：</strong>${pData.traits}</p>
    <p><strong>適合角色：</strong>${pData.suitable}</p>
    <div class="warning-text">⚠️ 專家提醒：${pData.warning}</div>
  `;

  secondaryResultEl.innerHTML = `
    <h3 style="color: var(--primary-teal);">🥈 副型性格：${sData.title} (得分: ${scores[secondary]})</h3>
    <p><strong>輔助特質：</strong>在工作情境中，您也常展現出${sData.traits}的特質，這能有效補足您主型性格的盲點。</p>
  `;

  // Temporarily store current result globally for saving
  window.currentResultData = {
    date: new Date().toLocaleString('zh-TW'),
    scores: scores,
    primary: primary,
    secondary: secondary
  };
}

// Local Storage History
function saveResult() {
  if (!window.currentResultData) return;
  
  let history = JSON.parse(localStorage.getItem('discHistory') || '[]');
  history.unshift(window.currentResultData);
  localStorage.setItem('discHistory', JSON.stringify(history));
  
  alert('紀錄已儲存！');
  saveBtn.disabled = true;
  saveBtn.textContent = '已儲存';
}

function showHistory() {
  switchScreen(historyScreen);
  const history = JSON.parse(localStorage.getItem('discHistory') || '[]');
  
  if (history.length === 0) {
    historyListEl.innerHTML = '<p>尚無測驗紀錄。</p>';
    return;
  }

  historyListEl.innerHTML = history.map((item, index) => `
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: left; border: 1px solid var(--border-color);">
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">${item.date}</div>
      <div style="font-size: 1.1rem; color: var(--primary-teal); font-weight: 600;">主型：${resultAnalysis[item.primary].title.split(' ')[0]} | 副型：${resultAnalysis[item.secondary].title.split(' ')[0]}</div>
      <div style="font-size: 0.9rem; margin-top: 5px; display: flex; gap: 10px; color: var(--text-main);">
        <span>D: ${item.scores.D}</span>
        <span>I: ${item.scores.I}</span>
        <span>S: ${item.scores.S}</span>
        <span>C: ${item.scores.C}</span>
      </div>
    </div>
  `).join('');
}

function clearHistory() {
  if(confirm('確定要清除所有歷史紀錄嗎？')) {
    localStorage.removeItem('discHistory');
    showHistory();
  }
}

// Start
document.addEventListener('DOMContentLoaded', init);
