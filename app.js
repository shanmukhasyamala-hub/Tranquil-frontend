/* =============================================
   TRANQUIL - Shared App Logic (app.js)
   ============================================= */

// ── LOCAL STORAGE KEYS ──
const KEYS = {
  profile:  'tranquil_profile',
  mood:     'tranquil_mood_journal',
  stress:   'tranquil_stress_logs',
  settings: 'tranquil_settings',
  session:  'tranquil_sessions',
};

// ── DEFAULTS ──
const defaultProfile = {
  name: 'Shanmukha',
  avatar: '🧘',
  id: 'ownuf-sevc-' + Math.random().toString(36).slice(2,6),
};
const defaultSettings = {
  darkMode: false,
  hydration: true,
  breakReminder: true,
  stretchReminder: true,
  analyticsTracking: true,
  aiPrediction: false,
  cloudBackup: true,
};

// ── STORAGE HELPERS ──
function getStorage(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function setStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── PROFILE ──
function getProfile() { return getStorage(KEYS.profile, defaultProfile); }
function saveProfile(p) { setStorage(KEYS.profile, p); }

// ── SETTINGS ──
function getSettings() { return { ...defaultSettings, ...getStorage(KEYS.settings, {}) }; }
function saveSettings(s) { setStorage(KEYS.settings, s); }

// ── STRESS LOGS ──
function getStressLogs() { return getStorage(KEYS.stress, []); }
function addStressLog(score) {
  const logs = getStressLogs();
  logs.push({ score, ts: Date.now() });
  setStorage(KEYS.stress, logs.slice(-200));
}
function getLatestStress() {
  const logs = getStressLogs();
  if (!logs.length) return { score: 38, label: 'Medium Stress', color: '#7c6fcd' };
  const s = logs[logs.length - 1].score;
  if (s < 30) return { score: s, label: 'Low Stress',    color: '#5bbf8a' };
  if (s < 60) return { score: s, label: 'Medium Stress', color: '#7c6fcd' };
  return          { score: s, label: 'High Stress',   color: '#e85c5c' };
}
function getWeeklyStats() {
  const logs = getStressLogs();
  const now  = Date.now();
  const day  = 86400000;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = now - i * day;
    const dayEnd   = dayStart + day;
    const dayLogs  = logs.filter(l => l.ts >= dayStart && l.ts < dayEnd);
    const avg      = dayLogs.length
      ? Math.round(dayLogs.reduce((s, l) => s + l.score, 0) / dayLogs.length)
      : 0;
    const d = new Date(dayStart);
    result.push({ day: days[d.getDay()], score: avg, count: dayLogs.length });
  }
  return result;
}

// ── MOOD JOURNAL ──
function getMoodJournal() { return getStorage(KEYS.mood, []); }
function addMoodEntry(mood, note = '') {
  const entries = getMoodJournal();
  entries.unshift({ mood, note, ts: Date.now() });
  setStorage(KEYS.mood, entries.slice(-100));
}

// ── SESSIONS (breathing) ──
function getSessions() { return getStorage(KEYS.session, { breathing: 0, moodEntries: 0 }); }
function incBreathingSession() {
  const s = getSessions();
  s.breathing = (s.breathing || 0) + 1;
  setStorage(KEYS.session, s);
}

// ── DATE HELPERS ──
function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function getTodayShort() {
  return new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// ── TOAST ──
function showToast(msg, duration = 2500) {
  let t = document.getElementById('globalToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'globalToast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ── BOTTOM NAV ACTIVE STATE ──
function setActiveNav(page) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

// ── PROFILE AVATAR IN HEADER ──
function syncHeaderAvatar() {
  const p = getProfile();
  document.querySelectorAll('.header-avatar').forEach(el => {
    el.textContent = p.avatar;
  });
}

// ── ONBOARDING CHECK ──
function needsOnboarding() {
  return !localStorage.getItem(KEYS.profile);
}

// ── SIMULATE LIVE STRESS (for demo) ──
let stressInterval = null;
function startLiveStress(callback) {
  stopLiveStress();
  let base = getLatestStress().score || 38;
  stressInterval = setInterval(() => {
    base = Math.max(5, Math.min(90, base + (Math.random() * 6 - 3)));
    const score = Math.round(base);
    addStressLog(score);
    if (callback) callback(score);
  }, 3000);
}
function stopLiveStress() {
  if (stressInterval) { clearInterval(stressInterval); stressInterval = null; }
}

// ── GAUGE DRAW ──
function drawGauge(svgEl, score, color) {
  if (!svgEl) return;
  const r = 85, cx = 100, cy = 100;
  const startAngle = -Math.PI;
  const endAngle   = 0;
  const pct        = score / 100;
  const angle      = startAngle + pct * (endAngle - startAngle);
  const bgX1 = cx + r * Math.cos(startAngle), bgY1 = cy + r * Math.sin(startAngle);
  const bgX2 = cx + r * Math.cos(endAngle),   bgY2 = cy + r * Math.sin(endAngle);
  const fgX  = cx + r * Math.cos(angle),       fgY  = cy + r * Math.sin(angle);

  svgEl.innerHTML = `
    <path d="M ${bgX1} ${bgY1} A ${r} ${r} 0 0 1 ${bgX2} ${bgY2}"
      fill="none" stroke="#e0e5f0" stroke-width="14" stroke-linecap="round"/>
    <path d="M ${bgX1} ${bgY1} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${fgX} ${fgY}"
      fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"
      style="filter:drop-shadow(0 2px 6px ${color}55)"/>
  `;
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  syncHeaderAvatar();
  // Attach nav link behavior if present
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', () => {
      const p = el.dataset.page;
      if (p) window.location.href = p + '.html';
    });
  });
});
// ============================================
// DARK MODE FUNCTIONS - Add to app.js
// ============================================

const DARK_MODE_KEY = 'tranquil_dark_mode';

/**
 * Check if dark mode is enabled
 */
function isDarkModeEnabled() {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) {
        return saved === 'true';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Apply dark mode to page
 */
function applyDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Save preference
    localStorage.setItem(DARK_MODE_KEY, enabled);
    
    // Update settings toggle if it exists
    const settingsToggle = document.getElementById('darkModeToggle');
    if (settingsToggle) {
        settingsToggle.checked = enabled;
    }
    
    // Update any header toggle if exists
    const headerToggle = document.getElementById('darkModeHeaderBtn');
    if (headerToggle) {
        headerToggle.textContent = enabled ? '☀️' : '🌙';
    }
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    const isDark = !isDarkModeEnabled();
    applyDarkMode(isDark);
    
    // Show feedback
    if (typeof showToast !== 'undefined') {
        showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
    }
}

/**
 * Initialize dark mode on page load
 */
function initDarkMode() {
    const enabled = isDarkModeEnabled();
    applyDarkMode(enabled);
    
    // Listen for system preference changes
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set preference
        if (localStorage.getItem(DARK_MODE_KEY) === null) {
            applyDarkMode(e.matches);
        }
    });
    
    console.log('Dark mode initialized:', enabled ? 'dark' : 'light');
}

// Initialize dark mode when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
    initDarkMode();
}