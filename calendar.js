/* ============================================
   MOOD CALENDAR MODULE
   ============================================ */

// Mood emoji mapping
const MOOD_EMOJIS = {
  'Great': '😁',
  'Good': '🙂',
  'Okay': '😐',
  'Low': '😔',
  'Stressed': '😰'
};

let currentCalendarDate = new Date();

/**
 * Get mood for specific date
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {object|null} Mood object or null
 */
function getMoodForDate(dateStr) {
  const entries = getMoodJournal();
  const entry = entries.find(e => new Date(e.ts).toISOString().slice(0, 10) === dateStr);
  return entry ? { mood: entry.mood, emoji: MOOD_EMOJIS[entry.mood] } : null;
}

/**
 * Render calendar for current month
 */
function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthDisplay = document.getElementById('currentMonth');
  if (monthDisplay) {
    monthDisplay.textContent = `${monthNames[month]} ${year}`;
  }
  
  // Build days array
  let days = [];
  for (let i = 0; i < startWeekday; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const mood = getMoodForDate(dateStr);
    days.push({ day: i, mood: mood, dateStr: dateStr });
  }
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let html = dayNames.map(name => `<div class="calendar-day-name">${name}</div>`).join('');
  
  days.forEach(day => {
    if (day === null) {
      html += `<div class="calendar-day empty"></div>`;
    } else {
      const tooltip = day.mood ? `${day.dateStr}: ${day.mood.mood}` : `${day.dateStr}: No mood logged`;
      html += `
        <div class="calendar-day ${day.mood ? 'has-mood' : ''}" 
             onclick="showDayMood('${day.dateStr}')"
             data-tooltip="${tooltip}">
          <div class="mood-emoji-cal">${day.mood ? day.mood.emoji : '📅'}</div>
          <div class="day-number">${day.day}</div>
        </div>
      `;
    }
  });
  
  const grid = document.getElementById('calendarGrid');
  if (grid) grid.innerHTML = html;
  
  updateMoodStats();
}

/**
 * Update mood statistics for current month
 */
function updateMoodStats() {
  const entries = getMoodJournal();
  const currentMonth = currentCalendarDate.getMonth();
  const currentYear = currentCalendarDate.getFullYear();
  
  const monthEntries = entries.filter(e => {
    const d = new Date(e.ts);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const stats = { 'Great': 0, 'Good': 0, 'Okay': 0, 'Low': 0, 'Stressed': 0 };
  monthEntries.forEach(e => {
    if (stats[e.mood] !== undefined) stats[e.mood]++;
  });
  
  const statsHtml = Object.entries(stats).map(([mood, count]) => `
    <div class="mood-stat" onclick="filterByMood('${mood}')">
      <div class="mood-stat-emoji">${MOOD_EMOJIS[mood]}</div>
      <div class="mood-stat-count">${count}</div>
      <div style="font-size: 0.65rem;">${mood}</div>
    </div>
  `).join('');
  
  const statsContainer = document.getElementById('moodStats');
  if (statsContainer) {
    statsContainer.innerHTML = statsHtml || '<div class="journal-empty">No moods this month</div>';
  }
}

/**
 * Show mood for specific day
 * @param {string} dateStr - Date in YYYY-MM-DD format
 */
function showDayMood(dateStr) {
  const mood = getMoodForDate(dateStr);
  if (mood) {
    showToast(`${dateStr}: ${mood.mood} ${mood.emoji}`);
  } else {
    showToast(`${dateStr}: No mood logged yet. Try journaling today!`);
  }
}

/**
 * Filter entries by mood type
 * @param {string} mood - Mood type
 */
function filterByMood(mood) {
  const entries = getMoodJournal();
  const filtered = entries.filter(e => e.mood === mood);
  if (filtered.length > 0) {
    showToast(`${filtered.length} entries with mood: ${mood}`);
  } else {
    showToast(`No entries with mood: ${mood}`);
  }
}

/**
 * Change month
 * @param {number} delta - +1 for next month, -1 for previous month
 */
function changeMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderCalendar();
}

/**
 * Go to today's date
 */
function goToToday() {
  currentCalendarDate = new Date();
  renderCalendar();
  showToast('Showing current month');
}

/**
 * Initialize calendar module
 */
function initCalendarModule() {
  renderCalendar();
}

// Auto-initialize
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initCalendarModule);
}

// Export for global use
window.showDayMood = showDayMood;
window.filterByMood = filterByMood;
window.changeMonth = changeMonth;
window.goToToday = goToToday;