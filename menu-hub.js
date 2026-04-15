/* ============================================
   MENU HUB MODULE
   Central hub for all wellness features
   ============================================ */

// Storage keys
const HUB_ACTIVITY_KEY = 'tranquil_hub_activity';
const HUB_VISITS_KEY = 'tranquil_hub_visits';

// Tips for daily inspiration
const DAILY_TIPS = [
  "Consistent small habits lead to big changes over time.",
  "Drink water first thing in the morning to kickstart hydration.",
  "A 5-minute breathing exercise can reduce stress significantly.",
  "Logging your mood helps identify patterns in your emotions.",
  "Stretch every hour to release physical tension.",
  "Meditation doesn't require silence - just presence.",
  "Sleep quality affects your stress levels more than you think.",
  "Celebrate small wins - they add up to big achievements.",
  "Nature sounds can lower cortisol levels in just 10 minutes.",
  "Your breath is always with you - use it to find calm anywhere."
];

/**
 * Get today's date string
 */
function getTodayString() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Get average stress score
 */
function getAverageStress() {
    const logs = getStressLogs();
    if (!logs.length) return '--';
    const recent = logs.slice(-14); // Last 14 days
    const avg = recent.reduce((sum, l) => sum + l.score, 0) / recent.length;
    return Math.round(avg);
}

/**
 * Get today's water intake
 */
function getTodayWater() {
    const hydration = JSON.parse(localStorage.getItem('tranquil_hydration') || '{"history":[]}');
    const today = getTodayString();
    const todayEntry = hydration.history.find(h => h.date === today);
    return todayEntry ? todayEntry.amount : 0;
}

/**
 * Get total points from achievements
 */
function getTotalPoints() {
    const achievements = JSON.parse(localStorage.getItem('tranquil_achievements') || '[]');
    const achievementsList = [
        { points: 10 }, { points: 50 }, { points: 100 }, { points: 75 },
        { points: 40 }, { points: 60 }, { points: 80 }, { points: 200 }
    ];
    let points = 0;
    achievements.forEach((_, idx) => {
        if (achievementsList[idx]) points += achievementsList[idx].points;
    });
    return points;
}

/**
 * Get meditation session count
 */
function getMeditationCount() {
    const data = JSON.parse(localStorage.getItem('tranquil_meditation') || '{"sessions":0}');
    return data.sessions;
}

/**
 * Get completed challenges count
 */
function getCompletedChallengesCount() {
    const challenges = JSON.parse(localStorage.getItem('tranquil_completed_challenges') || '[]');
    return challenges.length;
}

/**
 * Update hub stats display
 */
function updateHubStats() {
    const avgStress = getAverageStress();
    const moodCount = getMoodJournal().length;
    const waterToday = getTodayWater();
    const points = getTotalPoints();
    
    const avgEl = document.getElementById('hubStressAvg');
    const moodEl = document.getElementById('hubMoodCount');
    const waterEl = document.getElementById('hubWaterToday');
    const pointsEl = document.getElementById('hubPoints');
    
    if (avgEl) avgEl.textContent = avgStress;
    if (moodEl) moodEl.textContent = moodCount;
    if (waterEl) waterEl.textContent = `${waterToday}ml`;
    if (pointsEl) pointsEl.textContent = points;
}

/**
 * Update feature badges
 */
function updateFeatureBadges() {
    // Meditation badge
    const meditationCount = getMeditationCount();
    const meditationBadge = document.getElementById('meditationBadge');
    if (meditationBadge) {
        meditationBadge.textContent = meditationCount;
        if (meditationCount === 0) meditationBadge.style.opacity = '0.5';
        else meditationBadge.style.opacity = '1';
    }
    
    // Achievements badge
    const achievementsCount = JSON.parse(localStorage.getItem('tranquil_achievements') || '[]').length;
    const achievementsBadge = document.getElementById('achievementsBadge');
    if (achievementsBadge) {
        achievementsBadge.textContent = achievementsCount;
        if (achievementsCount === 0) achievementsBadge.textContent = '0';
    }
    
    // Hydration badge (today's progress)
    const waterToday = getTodayWater();
    const hydrationBadge = document.getElementById('hydrationBadge');
    if (hydrationBadge) {
        if (waterToday >= 2000) hydrationBadge.textContent = '✓';
        else if (waterToday > 0) hydrationBadge.textContent = `${Math.floor(waterToday/200)}%`;
        else hydrationBadge.textContent = '0';
    }
    
    // Challenges badge
    const challengesCount = getCompletedChallengesCount();
    const challengesBadge = document.getElementById('challengesBadge');
    if (challengesBadge) {
        challengesBadge.textContent = challengesCount;
        if (challengesCount > 0) challengesBadge.classList.add('new');
    }
    
    // Weekly report badge - show if new week
    const lastVisit = localStorage.getItem(HUB_VISITS_KEY);
    const today = getTodayString();
    if (lastVisit && new Date(lastVisit).getWeek() !== new Date(today).getWeek()) {
        const weeklyBadge = document.getElementById('weeklyBadge');
        if (weeklyBadge) weeklyBadge.style.display = 'block';
    }
}

// Helper: Get week number
Date.prototype.getWeek = function() {
    const date = new Date(this);
    const firstJan = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(((date - firstJan) / 86400000 + firstJan.getDay() + 1) / 7);
};

/**
 * Update greeting message
 */
function updateGreeting() {
    const profile = getProfile();
    const greetingName = document.getElementById('greetingName');
    const greetingMessage = document.getElementById('greetingMessage');
    
    if (greetingName) greetingName.textContent = `Hello, ${profile.name}!`;
    
    const hour = new Date().getHours();
    let message = '';
    
    if (hour < 12) message = 'Start your day with mindfulness';
    else if (hour < 17) message = 'Take a moment to breathe';
    else message = 'Wind down with calming sounds';
    
    if (greetingMessage) greetingMessage.textContent = message;
}

/**
 * Update daily tip
 */
function updateDailyTip() {
    const tipIndex = new Date().getDate() % DAILY_TIPS.length;
    const tipEl = document.getElementById('dailyTip');
    if (tipEl) tipEl.textContent = DAILY_TIPS[tipIndex];
}

/**
 * Log activity in hub
 * @param {string} featureName - Name of feature accessed
 */
function logActivity(featureName) {
    const activities = JSON.parse(localStorage.getItem(HUB_ACTIVITY_KEY) || '[]');
    activities.unshift({
        feature: featureName,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
    });
    
    // Keep only last 20 activities
    const trimmed = activities.slice(0, 20);
    localStorage.setItem(HUB_ACTIVITY_KEY, JSON.stringify(trimmed));
    
    renderActivityList();
}

/**
 * Render activity list
 */
function renderActivityList() {
    const activities = JSON.parse(localStorage.getItem(HUB_ACTIVITY_KEY) || '[]');
    const activityList = document.getElementById('activityList');
    
    if (!activityList) return;
    
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">✨</div>
                <div class="activity-text">Complete your first challenge to see activity here</div>
            </div>
        `;
        return;
    }
    
    // Feature icons mapping
    const featureIcons = {
        'meditation.html': '🧘',
        'weekly-report.html': '📊',
        'achievements.html': '🏆',
        'weather-mood.html': '🌤️',
        'daily-quotes.html': '💭',
        'hydration-tracker.html': '💧',
        'exercises.html': '🏋️',
        'calendar.html': '📅',
        'help-guide.html': '❓',
        'challenges.html': '🎯'
    };
    
    const featureNames = {
        'meditation.html': 'Meditation',
        'weekly-report.html': 'Weekly Report',
        'achievements.html': 'Achievements',
        'weather-mood.html': 'Weather & Mood',
        'daily-quotes.html': 'Daily Quotes',
        'hydration-tracker.html': 'Hydration',
        'exercises.html': 'Exercises',
        'calendar.html': 'Mood Calendar',
        'help-guide.html': 'Help Guide',
        'challenges.html': 'Challenges'
    };
    
    activityList.innerHTML = activities.slice(0, 5).map(activity => {
        const timeAgo = getTimeAgo(activity.timestamp);
        const icon = featureIcons[activity.feature] || '🌟';
        const name = featureNames[activity.feature] || activity.feature.replace('.html', '');
        
        return `
            <div class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-text">Opened <strong>${name}</strong></div>
                <div class="activity-time">${timeAgo}</div>
            </div>
        `;
    }).join('');
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

/**
 * Open feature with animation and logging
 * @param {string} featureUrl - URL of the feature page
 */
function openFeature(featureUrl) {
    // Log activity before navigation
    logActivity(featureUrl);
    
    // Add click animation
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        if (card.getAttribute('onclick')?.includes(featureUrl)) {
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
        }
    });
    
    // Show toast and navigate
    const featureName = featureUrl.replace('.html', '').replace(/-/g, ' ');
    showToast(`Opening ${featureName}...`);
    
    setTimeout(() => {
        window.location.href = featureUrl;
    }, 200);
}

/**
 * Show feature modal (alternative to direct navigation)
 */
function showFeatureModal(feature) {
    const modal = document.getElementById('featureModal');
    if (!modal) return;
    
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalOpenBtn = document.getElementById('modalOpenBtn');
    
    const features = {
        meditation: { icon: '🧘', title: 'Guided Meditation', desc: 'Find peace with guided meditation sessions. Perfect for reducing stress and anxiety.' },
        weekly: { icon: '📊', title: 'Weekly Report', desc: 'View your weekly wellness summary. Track progress and see improvements over time.' },
        achievements: { icon: '🏆', title: 'Achievements', desc: 'Earn badges and points for completing wellness activities. Celebrate your progress!' },
        weather: { icon: '🌤️', title: 'Weather & Mood', desc: 'See how weather affects your mood. Get personalized suggestions based on conditions.' },
        quotes: { icon: '💭', title: 'Daily Quotes', desc: 'Get inspired with daily motivational quotes. Save your favorites for later.' },
        hydration: { icon: '💧', title: 'Hydration Tracker', desc: 'Track your daily water intake. Stay hydrated for better focus and energy.' },
        exercises: { icon: '🏋️', title: 'Stress Relief Exercises', desc: 'Quick exercises to release tension and reduce stress anywhere, anytime.' },
        calendar: { icon: '📅', title: 'Mood Calendar', desc: 'Visualize your emotional journey. See patterns and track your mood over time.' },
        help: { icon: '❓', title: 'Help Guide', desc: 'Learn how to use all TRANQUIL features. Get answers to common questions.' },
        challenges: { icon: '🎯', title: 'Wellness Challenges', desc: 'Complete daily challenges to build healthy habits and earn rewards.' }
    };
    
    const f = features[feature];
    if (f) {
        if (modalIcon) modalIcon.textContent = f.icon;
        if (modalTitle) modalTitle.textContent = f.title;
        if (modalDesc) modalDesc.textContent = f.desc;
        if (modalOpenBtn) modalOpenBtn.onclick = () => {
            closeFeatureModal();
            openFeature(`${feature}.html`);
        };
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close feature modal
 */
function closeFeatureModal() {
    const modal = document.getElementById('featureModal');
    if (modal) modal.classList.add('hidden');
}

/**
 * Initialize menu hub
 */
function initMenuHub() {
    // Update all stats
    updateHubStats();
    updateFeatureBadges();
    updateGreeting();
    updateDailyTip();
    renderActivityList();
    
    // Record hub visit
    const today = getTodayString();
    localStorage.setItem(HUB_VISITS_KEY, today);
    
    // Refresh stats every 30 seconds
    setInterval(() => {
        updateHubStats();
        updateFeatureBadges();
    }, 30000);
    
    // Check for new features (first-time visit)
    const hasSeenHub = localStorage.getItem('hub_seen');
    if (!hasSeenHub) {
        setTimeout(() => {
            showToast('🌟 Welcome to the Wellness Hub! Explore all features here.');
        }, 1000);
        localStorage.setItem('hub_seen', 'true');
    }
}

/**
 * Quick action: Open random feature
 */
function openRandomFeature() {
    const features = [
        'meditation.html', 'weekly-report.html', 'achievements.html',
        'weather-mood.html', 'daily-quotes.html', 'hydration-tracker.html',
        'exercises.html', 'calendar.html', 'challenges.html'
    ];
    const random = features[Math.floor(Math.random() * features.length)];
    openFeature(random);
}

// Export functions for global use
window.openFeature = openFeature;
window.showFeatureModal = showFeatureModal;
window.closeFeatureModal = closeFeatureModal;
window.openRandomFeature = openRandomFeature;
window.logActivity = logActivity;
window.getTotalPoints = getTotalPoints;

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initMenuHub);
}