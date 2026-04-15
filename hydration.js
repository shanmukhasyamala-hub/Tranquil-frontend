/* ============================================
   HYDRATION TRACKER MODULE
   ============================================ */

// Constants
const DAILY_GOAL_ML = 2000;
const HYDRATION_KEY = 'tranquil_hydration';

/**
 * Get hydration data from localStorage
 */
function getHydrationData() {
  return JSON.parse(localStorage.getItem(HYDRATION_KEY) || '{"history":[]}');
}

/**
 * Save hydration data
 */
function saveHydrationData(data) {
  localStorage.setItem(HYDRATION_KEY, JSON.stringify(data));
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get today's water intake
 */
function getTodayWaterAmount() {
  const data = getHydrationData();
  const today = data.history.find(h => h.date === getTodayKey());
  return today ? today.amount : 0;
}

/**
 * Add water intake
 * @param {number} ml - Amount in milliliters
 */
function addWater(ml) {
  const data = getHydrationData();
  const todayKey = getTodayKey();
  let todayEntry = data.history.find(h => h.date === todayKey);
  
  if (todayEntry) {
    todayEntry.amount += ml;
  } else {
    data.history.unshift({ date: todayKey, amount: ml });
  }
  
  saveHydrationData(data);
  updateHydrationUI();
  showToast(`+${ml}ml water logged!`);
  
  const newAmount = getTodayWaterAmount();
  if (newAmount >= DAILY_GOAL_ML && newAmount - ml < DAILY_GOAL_ML) {
    showToast('🎉 Congratulations! You reached your daily hydration goal!');
    playCheerSound();
  }
}

/**
 * Reset today's water intake
 */
function resetTodayWater() {
  const data = getHydrationData();
  data.history = data.history.filter(h => h.date !== getTodayKey());
  saveHydrationData(data);
  updateHydrationUI();
  showToast('Today reset');
}

/**
 * Play cheer sound for reaching goal
 */
function playCheerSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.15;
    
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }, i * 150);
    });
  } catch (e) {
    console.log('Audio not supported');
  }
}

/**
 * Update hydration UI
 */
function updateHydrationUI() {
  const todayAmount = getTodayWaterAmount();
  const percentage = Math.min(100, (todayAmount / DAILY_GOAL_ML) * 100);
  
  const amountEl = document.getElementById('todayAmount');
  const fillEl = document.getElementById('waterFill');
  const historyContainer = document.getElementById('historyContainer');
  
  if (amountEl) amountEl.textContent = todayAmount;
  if (fillEl) fillEl.style.height = `${percentage}%`;
  
  if (historyContainer) {
    const data = getHydrationData();
    const recentHistory = data.history.slice(0, 7);
    
    if (recentHistory.length === 0) {
      historyContainer.innerHTML = '<div class="journal-empty">No hydration data yet</div>';
    } else {
      historyContainer.innerHTML = recentHistory.map(h => {
        const date = new Date(h.date);
        const dateStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const glasses = Math.floor(h.amount / 250);
        return `
          <div class="history-item">
            <span>${dateStr}</span>
            <span style="font-weight: 700;">${h.amount}ml</span>
            <span style="color: var(--teal);">${glasses} glasses</span>
          </div>
        `;
      }).join('');
    }
  }
}

/**
 * Get weekly hydration summary
 */
function getWeeklyHydration() {
  const data = getHydrationData();
  const weekly = [];
  const now = Date.now();
  const dayMs = 86400000;
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now - i * dayMs);
    const dateKey = date.toISOString().slice(0, 10);
    const entry = data.history.find(h => h.date === dateKey);
    weekly.push({
      date: dateKey,
      amount: entry ? entry.amount : 0,
      day: date.toLocaleDateString('en-IN', { weekday: 'short' })
    });
  }
  
  return weekly;
}

/**
 * Initialize hydration module
 */
function initHydrationModule() {
  updateHydrationUI();
  
  // Reset daily at midnight (check on load)
  const today = getTodayKey();
  const lastCheck = localStorage.getItem('hyd_last_check');
  if (lastCheck !== today) {
    localStorage.setItem('hyd_last_check', today);
  }
}

// Auto-initialize
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initHydrationModule);
}

// Export for global use
window.addWater = addWater;
window.resetTodayWater = resetTodayWater;
window.getWeeklyHydration = getWeeklyHydration;