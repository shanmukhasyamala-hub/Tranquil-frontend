/* ============================================
   EXERCISES MODULE
   ============================================ */

// Exercise library
const EXERCISES_LIBRARY = [
  {
    title: "Shoulder Rolls",
    desc: "Release tension in shoulders and neck",
    icon: "🔄",
    duration: "1 min",
    instructions: [
      "Sit or stand with your back straight",
      "Slowly roll your shoulders forward in a circular motion for 30 seconds",
      "Then roll them backward for 30 seconds",
      "Repeat twice for best results"
    ]
  },
  {
    title: "Neck Stretch",
    desc: "Relieve neck stiffness and headaches",
    icon: "🦒",
    duration: "2 min",
    instructions: [
      "Gently tilt your head to the right, bringing ear toward shoulder",
      "Hold for 15-20 seconds, feeling the stretch",
      "Repeat on left side",
      "Do 3 times on each side"
    ]
  },
  {
    title: "Deep Breathing",
    desc: "Calm your nervous system",
    icon: "🌬️",
    duration: "3 min",
    instructions: [
      "Find a comfortable seated position",
      "Inhale deeply through nose for 4 seconds",
      "Hold for 4 seconds",
      "Exhale slowly through mouth for 6 seconds",
      "Repeat 10 times"
    ]
  },
  {
    title: "Desk Stretch",
    desc: "Perfect for office workers",
    icon: "💺",
    duration: "2 min",
    instructions: [
      "Stand up and reach arms overhead",
      "Interlace fingers and press palms up",
      "Lean gently to the right, hold 10 seconds",
      "Lean left, hold 10 seconds",
      "Roll shoulders back 5 times"
    ]
  },
  {
    title: "Progressive Relaxation",
    desc: "Release tension throughout body",
    icon: "😌",
    duration: "5 min",
    instructions: [
      "Sit or lie down comfortably",
      "Tense your feet for 5 seconds, then release",
      "Move up to calves, thighs, stomach, chest",
      "Continue to hands, arms, shoulders, face",
      "Notice the difference between tension and relaxation"
    ]
  },
  {
    title: "Walking Meditation",
    desc: "Mindful movement",
    icon: "🚶",
    duration: "5-10 min",
    instructions: [
      "Find a quiet path or room",
      "Walk slowly, focusing on each step",
      "Notice the sensation of your feet touching the ground",
      "If mind wanders, gently bring focus back to walking",
      "Continue for 5-10 minutes"
    ]
  }
];

// Storage key
const EXERCISES_KEY = 'tranquil_exercises';

/**
 * Get completed exercises
 */
function getCompletedExercises() {
  return JSON.parse(localStorage.getItem(EXERCISES_KEY) || '[]');
}

/**
 * Log exercise completion
 * @param {object} exercise - Exercise object
 */
function logExerciseCompletion(exercise) {
  const completed = getCompletedExercises();
  completed.push({
    title: exercise.title,
    timestamp: Date.now()
  });
  localStorage.setItem(EXERCISES_KEY, JSON.stringify(completed.slice(-50)));
}

/**
 * Render exercises list
 */
function renderExercisesList() {
  const container = document.getElementById('exercisesList');
  if (!container) return;
  
  container.innerHTML = EXERCISES_LIBRARY.map((ex, idx) => `
    <div class="exercise-card" onclick="showExercise(${idx})">
      <div class="exercise-header">
        <div class="exercise-icon">${ex.icon}</div>
        <div class="exercise-title">${ex.title}</div>
      </div>
      <div class="exercise-desc">${ex.desc}</div>
      <span class="exercise-duration">⏱️ ${ex.duration}</span>
    </div>
  `).join('');
}

/**
 * Show exercise modal with instructions
 * @param {number} idx - Exercise index
 */
function showExercise(idx) {
  const ex = EXERCISES_LIBRARY[idx];
  const modal = document.getElementById('exerciseModal');
  
  if (!modal) return;
  
  const iconEl = document.getElementById('modalIcon');
  const titleEl = document.getElementById('modalTitle');
  const descEl = document.getElementById('modalDesc');
  const instructionsEl = document.getElementById('modalInstructions');
  
  if (iconEl) iconEl.textContent = ex.icon;
  if (titleEl) titleEl.textContent = ex.title;
  if (descEl) descEl.textContent = ex.desc;
  
  if (instructionsEl) {
    instructionsEl.innerHTML = ex.instructions.map(i => `<li>${i}</li>`).join('');
  }
  
  modal.classList.remove('hidden');
  
  // Store current exercise for completion
  modal.dataset.currentExercise = idx;
}

/**
 * Close exercise modal and log completion
 */
function closeExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  if (!modal) return;
  
  const idx = modal.dataset.currentExercise;
  if (idx !== undefined && EXERCISES_LIBRARY[idx]) {
    logExerciseCompletion(EXERCISES_LIBRARY[idx]);
    showToast('✓ Great job! Stress relief exercise completed');
  }
  
  modal.classList.add('hidden');
}

/**
 * Get exercise streak
 */
function getExerciseStreak() {
  const completed = getCompletedExercises();
  if (!completed.length) return 0;
  
  const now = Date.now();
  const dayMs = 86400000;
  let streak = 0;
  
  for (let i = 0; i < 30; i++) {
    const dayStart = now - i * dayMs;
    const hasExercise = completed.some(e => e.timestamp >= dayStart && e.timestamp < dayStart + dayMs);
    if (hasExercise) streak++;
    else break;
  }
  
  return streak;
}

/**
 * Initialize exercises module
 */
function initExercisesModule() {
  renderExercisesList();
  
  // Close modal on overlay click
  const modal = document.getElementById('exerciseModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeExerciseModal();
    });
  }
}

// Auto-initialize
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initExercisesModule);
}

// Export for global use
window.showExercise = showExercise;
window.closeExerciseModal = closeExerciseModal;
window.getExerciseStreak = getExerciseStreak;