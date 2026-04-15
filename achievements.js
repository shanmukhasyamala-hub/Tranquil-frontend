/* ============================================
   ACHIEVEMENTS MODULE
   ============================================ */

// Storage keys
const ACHIEVEMENTS_KEY = 'tranquil_achievements';

// Achievement definitions
const ACHIEVEMENTS_LIST = [
  { id: 'first_steps', name: 'First Steps', desc: 'Complete your first stress check-in', icon: '👣', points: 10, check: () => getStressLogs().length >= 1 },
  { id: 'stress_warrior', name: 'Stress Warrior', desc: 'Log stress 7 days in a row', icon: '⚔️', points: 50, check: () => hasStreak(7) },
  { id: 'meditation_master', name: 'Meditation Master', desc: 'Complete 10 meditation sessions', icon: '🧘', points: 100, check: () => getMeditationCount() >= 10 },
  { id: 'mood_tracker', name: 'Mood Tracker', desc: 'Log 30 mood entries', icon: '📔', points: 75, check: () => getMoodJournal().length >= 30 },
  { id: 'calm_mind', name: 'Calm Mind', desc: 'Achieve stress score below 30', icon: '😌', points: 40, check: () => hasLowStress() },
  { id: 'sleep_scholar', name: 'Sleep Scholar', desc: 'Log sleep for 14 nights', icon: '😴', points: 60, check: () => getSleepCount() >= 14 },
  { id: 'breathe_easy', name: 'Breathe Easy', desc: 'Complete 20 breathing sessions', icon: '🌬️', points: 80, check: () => getBreathingSessions() >= 20 },
  { id: 'wellness_guru', name: 'Wellness Guru', desc: 'Unlock all achievements', icon: '🌟', points: 200, check: () => getAllUnlocked() }
];

/**
 * Get unlocked achievements
 */
function getUnlockedAchievements() {
  return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]');
}

/**
 * Save unlocked achievements
 */
function saveUnlockedAchievements(unlocked) {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
}

/**
 * Get meditation count from storage
 */
function getMeditationCount() {
  const data = JSON.parse(localStorage.getItem('tranquil_meditation') || '{"sessions":0}');
  return data.sessions;
}

/**
 * Get sleep count from storage
 */
function getSleepCount() {
  const sleep = JSON.parse(localStorage.getItem('tranquil_sleep') || '[]');
  return sleep.length;
}

/**
 * Get breathing sessions count
 */
function getBreathingSessions() {
  const sessions = getSessions();
  return sessions.breathing || 0;
}

/**
 * Check if user has streak of consecutive days
 */
function hasStreak(days) {
  const logs = getStressLogs();
  if (logs.length < days) return false;
  
  const now = Date.now();
  const dayMs = 86400000;
  
  for (let i = 0; i < days; i++) {
    const dayStart = now - i * dayMs;
    const hasEntry = logs.some(l => l.ts >= dayStart && l.ts < dayStart + dayMs);
    if (!hasEntry) return false;
  }
  return true;
}

/**
 * Check if user has low stress
 */
function hasLowStress() {
  const logs = getStressLogs();
  if (!logs.length) return false;
  const recent = logs.slice(-7);
  return recent.some(l => l.score < 30);
}

/**
 * Check if all achievements are unlocked
 */
function getAllUnlocked() {
  const unlocked = getUnlockedAchievements();
  return unlocked.length === ACHIEVEMENTS_LIST.length;
}

/**
 * Play unlock sound effect
 */
function playUnlockSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.2;
    
    // Fanfare melody
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }, i * 120);
    });
  } catch (e) {
    console.log('Audio not supported');
  }
}

/**
 * Check and unlock achievements
 */
function checkAndUnlockAchievements() {
  const unlocked = getUnlockedAchievements();
  let newUnlocked = false;
  let newlyUnlocked = [];
  
  ACHIEVEMENTS_LIST.forEach(achievement => {
    if (!unlocked.includes(achievement.id) && achievement.check()) {
      unlocked.push(achievement.id);
      newUnlocked = true;
      newlyUnlocked.push(achievement);
    }
  });
  
  if (newUnlocked) {
    saveUnlockedAchievements(unlocked);
    newlyUnlocked.forEach(ach => {
      showToast(`🏆 Achievement Unlocked: ${ach.name}! +${ach.points} points`);
    });
    playUnlockSound();
  }
  
  renderAchievements();
}

/**
 * Render achievements grid
 */
function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');
  if (!grid) return;
  
  const unlocked = getUnlockedAchievements();
  let totalPoints = 0;
  
  grid.innerHTML = ACHIEVEMENTS_LIST.map(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    if (isUnlocked) totalPoints += ach.points;
    
    const progress = isUnlocked ? 100 : 0;
    
    return `
      <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
        ${isUnlocked ? '<div class="unlock-badge">✓</div>' : ''}
        <div class="achievement-icon">${ach.icon}</div>
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${ach.desc}</div>
        <div class="achievement-progress">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div style="font-size: 0.65rem; margin-top: 6px; color: var(--purple);">${ach.points} pts</div>
      </div>
    `;
  }).join('');
  
  const scoreEl = document.getElementById('wellnessScore');
  if (scoreEl) scoreEl.textContent = totalPoints;
}

/**
 * Initialize achievements module
 */
function initAchievementsModule() {
  checkAndUnlockAchievements();
  
  // Re-check achievements when certain actions happen
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.includes('tranquil_')) {
      setTimeout(checkAndUnlockAchievements, 500);
    }
  });
}

// Auto-initialize
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initAchievementsModule);
}

// Export for global use
window.checkAchievements = checkAndUnlockAchievements;