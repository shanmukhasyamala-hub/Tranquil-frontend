// Meditation Module - Works with existing app.js functions

let meditationTimer = null;
let meditationSeconds = 300; // 5 minutes default
let meditationActive = false;
let meditationPaused = false;
let currentStyle = 'Mindfulness';

// Get meditation stats from localStorage
function getMeditationStats() {
  return JSON.parse(localStorage.getItem('tranquil_meditation') || '{"sessions":0, "minutes":0}');
}

function saveMeditationStats(stats) {
  localStorage.setItem('tranquil_meditation', JSON.stringify(stats));
}

function updateMeditationDisplay() {
  const mins = Math.floor(meditationSeconds / 60);
  const secs = meditationSeconds % 60;
  document.getElementById('meditationTime').textContent = 
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  const circle = document.getElementById('meditationCircle');
  if (meditationActive && !meditationPaused) {
    circle.classList.add('meditating');
    document.getElementById('meditationLabel').textContent = currentStyle;
  } else {
    circle.classList.remove('meditating');
    document.getElementById('meditationLabel').textContent = 
      meditationPaused ? 'Paused' : 'Ready to begin?';
  }
}

function setMeditationTime(seconds, style) {
  if (meditationActive) {
    showToast('Please finish or reset current session first');
    return;
  }
  meditationSeconds = seconds;
  currentStyle = style;
  updateMeditationDisplay();
  document.getElementById('resetMedBtn').disabled = false;
  showToast(`${style} meditation ready - ${Math.floor(seconds/60)} minutes`);
}

function startMeditation() {
  if (meditationActive) return;
  
  meditationActive = true;
  meditationPaused = false;
  
  document.getElementById('startMedBtn').disabled = true;
  document.getElementById('pauseMedBtn').disabled = false;
  document.getElementById('resetMedBtn').disabled = false;
  
  // Optional: Play meditation bell sound
  playBell();
  
  meditationTimer = setInterval(() => {
    if (!meditationPaused && meditationSeconds > 0) {
      meditationSeconds--;
      updateMeditationDisplay();
      
      // Show progress every minute
      if (meditationSeconds % 60 === 0 && meditationSeconds > 0) {
        showToast(`${Math.floor(meditationSeconds/60)} minutes remaining`);
      }
      
      if (meditationSeconds === 0) {
        completeMeditation();
      }
    }
  }, 1000);
}

function pauseMeditation() {
  if (!meditationActive) return;
  meditationPaused = !meditationPaused;
  document.getElementById('pauseMedBtn').textContent = meditationPaused ? '▶ Resume' : '⏸ Pause';
  updateMeditationDisplay();
}

function resetMeditation() {
  if (meditationTimer) {
    clearInterval(meditationTimer);
    meditationTimer = null;
  }
  meditationActive = false;
  meditationPaused = false;
  meditationSeconds = 300; // Reset to 5 minutes
  currentStyle = 'Mindfulness';
  
  document.getElementById('startMedBtn').disabled = false;
  document.getElementById('pauseMedBtn').disabled = true;
  document.getElementById('pauseMedBtn').textContent = '⏸ Pause';
  document.getElementById('resetMedBtn').disabled = true;
  
  updateMeditationDisplay();
  showToast('Meditation reset');
}

function completeMeditation() {
  if (meditationTimer) {
    clearInterval(meditationTimer);
    meditationTimer = null;
  }
  
  meditationActive = false;
  
  // Save stats
  const stats = getMeditationStats();
  const sessionMinutes = Math.floor(meditationSeconds / 60);
  stats.sessions++;
  stats.minutes += sessionMinutes;
  saveMeditationStats(stats);
  
  // Update display
  document.getElementById('meditationCount').textContent = stats.sessions;
  document.getElementById('meditationMinutes').textContent = stats.minutes;
  
  // Play completion sound/alert
  playBell();
  showToast(`✨ Meditation complete! +${sessionMinutes} minutes of mindfulness`);
  
  // Add to stress logs (meditation reduces stress)
  const currentStress = getLatestStress();
  if (currentStress.score > 20) {
    addStressLog(Math.max(10, currentStress.score - 15));
    showToast('🧘 Your stress level decreased!');
  }
  
  resetMeditation();
}

function playBell() {
  // Simple beep for meditation bell
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.frequency.value = 880;
    gain.gain.value = 0.3;
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 2);
    oscillator.stop(audioCtx.currentTime + 2);
  } catch(e) {}
}

// Load stats on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('meditationCount')) {
    const stats = getMeditationStats();
    document.getElementById('meditationCount').textContent = stats.sessions;
    document.getElementById('meditationMinutes').textContent = stats.minutes;
    updateMeditationDisplay();
  }
  syncHeaderAvatar();
});