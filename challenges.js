/* ============================================
   WELLNESS CHALLENGES MODULE
   ============================================ */

// Storage keys
const CHALLENGES_KEY = 'tranquil_completed_challenges';
const DAILY_COUNTERS_KEY = 'tranquil_daily_counters';

// Challenge definitions
const CHALLENGES_LIST = [
  { id: 'stress_check', name: 'Stress Check-in', desc: 'Log your stress level 3 times today', icon: '📊', points: 10, required: 3, check: () => getTodayStressCount() },
  { id: 'breathe_once', name: 'Breathe Easy', desc: 'Complete 1 breathing session', icon: '🌬️', points: 15, required: 1, check: () => getTodayBreathingCount() },
  { id: 'mood_log', name: 'Mood Tracker', desc: 'Log your mood today', icon: '📔', points: 10, required: 1, check: () => getTodayMoodCount() },
  { id: 'hydration_goal', name: 'Hydration Hero', desc: 'Drink 1500ml of water', icon: '💧', points: 20, required: 1500, check: () => getTodayWaterIntake() },
  { id: 'sleep_quality', name: 'Sleep Well', desc: 'Log 7+ hours of sleep', icon: '😴', points: 25, required: 420, check: () => getLastSleepHours() },
  { id: 'meditate', name: 'Mindful Moment', desc: 'Complete a 5-min meditation', icon: '🧘', points: 20, required: 1, check: () => getTodayMeditationCount() }
];

/**
 * Get completed challenges
 */
function getCompletedChallenges() {
  return JSON.parse(localStorage.getItem(CHALLENGES_KEY) || '[]');
}

/**
 * Save completed challenges
 */
function saveCompletedChallenges(completed) {
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(completed));
}

/**
 * Get daily counter
 * @param {string} key - Counter key
 */
function getDailyCounter(key) {
  const today = new Date().toISOString().slice(0, 10);
  const counters = JSON.parse(localStorage.getItem(DAILY_COUNTERS_KEY) || '{}');
  return (counters[today] && counters[today][key]) || 0;
}

/**
 * Increment daily counter
 * @param {string} key - Counter key
 */
function incrementDailyCounter(key) {
  const today = new Date().toISOString().slice(0, 10);
  const counters = JSON.parse(localStorage.getItem(DAILY_COUNTERS_KEY) || '{}');
  if (!counters[today]) counters[today] = {};
  counters[today][key] = (counters[today][key] || 0) + 1;
  localStorage.setItem(DAILY_COUNTERS_KEY, JSON.stringify(counters));
}

/**
 * Get today's stress count
 */
function getTodayStressCount() {
  const logs = getStressLogs();
  const today = new Date().toISOString().slice(0, 10);
  return logs.filter(l => new Date(l.ts).toISOString().slice(0, 10) === today).length;
}

/**
 * Get today's breathing count
 */
function getTodayBreathingCount() {
  return getDailyCounter('breathing');
}

/**
 * Get today's mood count
 */
function getTodayMoodCount() {
  const entries = getMoodJournal();
  const today = new Date().toISOString().slice(0, 10);
  return entries.filter(e => new Date(e.ts).toISOString().slice(0, 10) === today).length;
}

/**
 * Get today's water intake
 */
function getTodayWaterIntake() {
  const hydration = JSON.parse(localStorage.getItem('tranquil_hydration') || '{"history":[]}');
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = hydration.history.find(h => h.date === today);
  return todayEntry ? todayEntry.amount : 0;
}

/**
 * Get last sleep hours
 */
function getLastSleepHours() {
  const sleep = JSON.parse(localStorage.getItem('tranquil_sleep') || '[]');
  if (!sleep.length) return 0;
  const last = sleep[0];
  const diff = (last.wakeH * 60 + last.wakeM) - (last.bedH * 60 + last.bedM);
  return diff > 0 ? diff : diff + 1440;
}

/**
 * Get today's meditation count
 */
function getTodayMeditationCount() {
  return getDailyCounter('meditation');
}

/**
 * Record breathing session (call from breathe.html)
 */
function recordBreathingSession() {
  incrementDailyCounter('breathing');
}

/**
 * Record meditation session (call from meditation.html)
 */
function recordMeditationSession() {
  incrementDailyCounter('meditation');
}

/**
 * Play reward sound
 */
function playRewardSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.1;
    
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      }, i * 120);
    });
  } catch (e) {}
}

/**
 * Complete a challenge
 * @param {string} id - Challenge ID
 * @param {number} points - Points to award
 */
function completeChallenge(id, points) {
  const completed = getCompletedChallenges();
  if (!completed.includes(id)) {
    completed.push(id);
    saveCompletedChallenges(completed);
    showToast(`🎉 Challenge completed! +${points} points`);
    playRewardSound();
    renderChallengesList();
  }
}

/**
 * Render challenges list
 */
function renderChallengesList() {
  const container = document.getElementById('challengesList');
  if (!container) return;
  
  const completed = getCompletedChallenges();
  let totalPoints = 0;
  
  container.innerHTML = CHALLENGES_LIST.map(ch => {
    const isCompleted = completed.includes(ch.id);
    const currentValue = ch.check();
    const progress = Math.min(100, (currentValue / ch.required) * 100);
    
    if (isCompleted) totalPoints += ch.points;
    
    let progressText = '';
    if (ch.id === 'hydration_goal') progressText = `${currentValue}/${ch.required}ml`;
    else if (ch.id === 'sleep_quality') progressText = `${Math.floor(currentValue / 60)}h/${Math.floor(ch.required / 60)}h`;
    else progressText = `${currentValue}/${ch.required}`;
    
    return `
      <div class="challenge-card ${isCompleted ? 'completed' : ''}">
        <div class="challenge-header">
          <div class="challenge-icon">${ch.icon}</div>
          <div class="challenge-title">${ch.name}</div>
          <div class="challenge-points">${ch.points} pts</div>
        </div>
        <div class="challenge-desc">${ch.desc}</div>
        <div class="challenge-progress">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${progress}%"></div>
          </div>
        </div>
        <div class="challenge-status">Progress: ${progressText}</div>
        ${!isCompleted && currentValue >= ch.required ? 
          `<button class="btn btn-primary btn-sm btn-complete" onclick="completeChallenge('${ch.id}', ${ch.points})">Claim Reward 🎉</button>` : 
          (isCompleted ? '<div class="challenge-status" style="color: var(--green);">✓ Completed!</div>' : '')}
      </div>
    `;
  }).join('');
  
  const pointsEl = document.getElementById('totalPoints');
  if (pointsEl) pointsEl.textContent = totalPoints;
}

/**
 * Reset daily counters (call at midnight)
 */
function resetDailyCounters() {
  const today = new Date().toISOString().slice(0, 10);
  const lastReset = localStorage.getItem('challenges_last_reset');
  if (lastReset !== today) {
    localStorage.setItem('challenges_last_reset', today);
    // Daily counters handled by increment functions
  }
}

/**
 * Initialize challenges module
 */
function initChallengesModule() {
  resetDailyCounters();
  renderChallengesList();
  
  // Listen for storage events to refresh
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.includes('tranquil_')) {
      setTimeout(renderChallengesList, 500);
    }
  });
}

// Auto-initialize
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initChallengesModule);
}

// Export for global use
window.completeChallenge = completeChallenge;
window.recordBreathingSession = recordBreathingSession;
window.recordMeditationSession = recordMeditationSession;