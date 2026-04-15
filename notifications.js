/* ============================================
   NOTIFICATIONS MODULE
   Push notifications and reminders for TRANQUIL
   ============================================ */

// Notification configuration
const NOTIFICATION_CONFIG = {
    // Check if notifications are supported
    isSupported: 'Notification' in window,
    
    // Default reminder intervals (in milliseconds)
    REMINDER_INTERVALS: {
        hydration: 60 * 60 * 1000,      // 1 hour
        break: 45 * 60 * 1000,          // 45 minutes
        stretch: 60 * 60 * 1000,        // 1 hour
        mood: 4 * 60 * 60 * 1000,       // 4 hours
        stress: 2 * 60 * 60 * 1000,     // 2 hours
        meditation: 8 * 60 * 60 * 1000, // 8 hours
        sleep: 21 * 60 * 60 * 1000      // 9 PM reminder
    },
    
    // Reminder messages
    MESSAGES: {
        hydration: [
            '💧 Time to hydrate! Drink a glass of water.',
            '💧 Stay hydrated - your body needs water!',
            '💧 Water break! Keep your energy up.'
        ],
        break: [
            '☕ Take a 5-minute break. Step away from your screen.',
            '☕ Time to rest your eyes and mind for a moment.',
            '☕ Short breaks improve focus and reduce stress.'
        ],
        stretch: [
            '🧘 Time to stretch! Stand up and reach for the sky.',
            '🧘 Your body needs movement. Take a stretch break.',
            '🧘 Roll your shoulders and stretch your neck.'
        ],
        mood: [
            '📔 How are you feeling? Take a moment to check in.',
            '📔 Log your mood to track your wellness journey.',
            '📔 Your feelings matter. Take a mood check-in.'
        ],
        stress: [
            '📊 Take a deep breath. How\'s your stress level?',
            '📊 Stress check-in time. Be mindful of your state.',
            '📊 Pause and assess your stress levels.'
        ],
        meditation: [
            '🧘 Time for a mindful moment. Try a 5-minute meditation.',
            '🧘 Breathe deeply and find your center.',
            '🧘 Your mind deserves peace. Take a meditation break.'
        ],
        sleep: [
            '😴 Getting ready for sleep? Wind down with calming sounds.',
            '😴 Your sleep matters. Prepare for a restful night.',
            '😴 Time to relax before bed. Try deep breathing.'
        ]
    }
};

// Storage keys
const NOTIFICATION_PERMISSION_KEY = 'tranquil_notification_permission';
const REMINDER_SETTINGS_KEY = 'tranquil_reminder_settings';
const REMINDER_TIMERS_KEY = 'tranquil_reminder_timers';

// Active timers
let reminderTimers = {};

/**
 * Check if notifications are supported
 */
function areNotificationsSupported() {
    return NOTIFICATION_CONFIG.isSupported;
}

/**
 * Request notification permission
 * @returns {Promise<boolean>} Permission granted status
 */
async function requestNotificationPermission() {
    if (!areNotificationsSupported()) {
        showToast('Notifications not supported in this browser');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
        return true;
    }
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';
        
        if (granted) {
            localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
            showToast('✓ Notifications enabled!');
        } else {
            showToast('⚠️ Notifications disabled');
        }
        
        return granted;
    }
    
    return false;
}

/**
 * Send a notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} icon - Notification icon URL
 * @param {string} tag - Notification tag (for grouping)
 */
function sendNotification(title, body, icon = '/assets/images/icon-192.png', tag = null) {
    if (!areNotificationsSupported()) return false;
    if (Notification.permission !== 'granted') return false;
    
    try {
        const options = {
            body: body,
            icon: icon,
            badge: icon,
            vibrate: [200, 100, 200],
            silent: false,
            requireInteraction: false
        };
        
        if (tag) options.tag = tag;
        
        const notification = new Notification(title, options);
        
        // Handle click on notification
        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            notification.close();
            
            // Navigate based on notification type
            if (tag === 'hydration') {
                window.location.href = 'hydration-tracker.html';
            } else if (tag === 'meditation') {
                window.location.href = 'meditation.html';
            } else if (tag === 'mood') {
                window.location.href = 'journal.html';
            } else if (tag === 'stress') {
                window.location.href = 'home.html';
            } else if (tag === 'breathe') {
                window.location.href = 'breathe.html';
            }
        };
        
        return true;
    } catch (error) {
        console.error('Notification error:', error);
        return false;
    }
}

/**
 * Get random message from array
 */
function getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Send hydration reminder
 */
function sendHydrationReminder() {
    const message = getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.hydration);
    sendNotification('💧 Hydration Reminder', message, '', 'hydration');
}

/**
 * Send break reminder
 */
function sendBreakReminder() {
    const message = getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.break);
    sendNotification('☕ Time for a Break', message, '', 'break');
}

/**
 * Send stretch reminder
 */
function sendStretchReminder() {
    const message = getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.stretch);
    sendNotification('🧘 Stretch Break', message, '', 'stretch');
}

/**
 * Send mood reminder
 */
function sendMoodReminder() {
    const message = getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.mood);
    sendNotification('📔 Mood Check-in', message, '', 'mood');
}

/**
 * Send stress check reminder
 */
function sendStressReminder() {
    const message = getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.stress);
    sendNotification('📊 Stress Check', message, '', 'stress');
}

/**
 * Send meditation reminder
 */
function sendMeditationReminder() {
    const message = getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.meditation);
    sendNotification('🧘 Meditation Time', message, '', 'meditation');
}

/**
 * Send sleep reminder
 */
function sendSleepReminder() {
    const message = getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.sleep);
    sendNotification('😴 Sleep Time', message, '', 'sleep');
}

/**
 * Get reminder settings from localStorage
 */
function getReminderSettings() {
    const defaultSettings = {
        hydration: true,
        break: true,
        stretch: true,
        mood: true,
        stress: true,
        meditation: true,
        sleep: true,
        startHour: 8,      // Start reminders at 8 AM
        endHour: 22        // End reminders at 10 PM
    };
    
    const saved = localStorage.getItem(REMINDER_SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
}

/**
 * Save reminder settings
 */
function saveReminderSettings(settings) {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Check if it's within reminder hours
 */
function isWithinReminderHours() {
    const settings = getReminderSettings();
    const hour = new Date().getHours();
    return hour >= settings.startHour && hour < settings.endHour;
}

/**
 * Set up a repeating reminder
 * @param {string} type - Reminder type
 * @param {function} callback - Callback function
 * @param {number} interval - Interval in milliseconds
 */
function setupRepeatingReminder(type, callback, interval) {
    // Clear existing timer
    if (reminderTimers[type]) {
        clearInterval(reminderTimers[type]);
    }
    
    // Set new timer
    reminderTimers[type] = setInterval(() => {
        const settings = getReminderSettings();
        if (settings[type] && isWithinReminderHours()) {
            callback();
        }
    }, interval);
}

/**
 * Start all reminders based on settings
 */
function startAllReminders() {
    // Clear all existing timers
    Object.keys(reminderTimers).forEach(key => {
        if (reminderTimers[key]) {
            clearInterval(reminderTimers[key]);
        }
    });
    reminderTimers = {};
    
    const settings = getReminderSettings();
    
    if (settings.hydration) {
        setupRepeatingReminder('hydration', sendHydrationReminder, NOTIFICATION_CONFIG.REMINDER_INTERVALS.hydration);
    }
    
    if (settings.break) {
        setupRepeatingReminder('break', sendBreakReminder, NOTIFICATION_CONFIG.REMINDER_INTERVALS.break);
    }
    
    if (settings.stretch) {
        setupRepeatingReminder('stretch', sendStretchReminder, NOTIFICATION_CONFIG.REMINDER_INTERVALS.stretch);
    }
    
    if (settings.mood) {
        setupRepeatingReminder('mood', sendMoodReminder, NOTIFICATION_CONFIG.REMINDER_INTERVALS.mood);
    }
    
    if (settings.stress) {
        setupRepeatingReminder('stress', sendStressReminder, NOTIFICATION_CONFIG.REMINDER_INTERVALS.stress);
    }
    
    if (settings.meditation) {
        setupRepeatingReminder('meditation', sendMeditationReminder, NOTIFICATION_CONFIG.REMINDER_INTERVALS.meditation);
    }
    
    if (settings.sleep) {
        // Schedule sleep reminder for specific time (9 PM)
        scheduleSleepReminder();
    }
}

/**
 * Schedule sleep reminder for specific time
 */
function scheduleSleepReminder() {
    const now = new Date();
    const sleepTime = new Date();
    sleepTime.setHours(21, 0, 0); // 9:00 PM
    
    let timeUntilSleep = sleepTime - now;
    if (timeUntilSleep < 0) {
        // If past 9 PM, schedule for tomorrow
        timeUntilSleep += 24 * 60 * 60 * 1000;
    }
    
    if (reminderTimers.sleep) {
        clearTimeout(reminderTimers.sleep);
    }
    
    reminderTimers.sleep = setTimeout(() => {
        const settings = getReminderSettings();
        if (settings.sleep) {
            sendSleepReminder();
            // Reschedule for next day
            scheduleSleepReminder();
        }
    }, timeUntilSleep);
}

/**
 * Stop all reminders
 */
function stopAllReminders() {
    Object.keys(reminderTimers).forEach(key => {
        if (reminderTimers[key]) {
            clearInterval(reminderTimers[key]);
            clearTimeout(reminderTimers[key]);
        }
    });
    reminderTimers = {};
}

/**
 * Toggle a specific reminder
 * @param {string} type - Reminder type
 * @param {boolean} enabled - Whether to enable
 */
function toggleReminder(type, enabled) {
    const settings = getReminderSettings();
    settings[type] = enabled;
    saveReminderSettings(settings);
    
    if (enabled) {
        startAllReminders();
        showToast(`✓ ${type} reminders enabled`);
    } else {
        // Stop only this type
        if (reminderTimers[type]) {
            clearInterval(reminderTimers[type]);
            clearTimeout(reminderTimers[type]);
            delete reminderTimers[type];
        }
        showToast(`✗ ${type} reminders disabled`);
    }
}

/**
 * Send a test notification
 */
async function sendTestNotification() {
    const granted = await requestNotificationPermission();
    if (granted) {
        sendNotification('🔔 TRANQUIL Test', 'Notifications are working! You\'ll receive wellness reminders.', '', 'test');
        showToast('✓ Test notification sent!');
    }
}

/**
 * Check and send reminders based on user activity
 * Called when user hasn't interacted for a while
 */
let lastActivityTime = Date.now();

function recordUserActivity() {
    lastActivityTime = Date.now();
}

function checkInactivityReminder() {
    const inactiveTime = Date.now() - lastActivityTime;
    const settings = getReminderSettings();
    
    // Send break reminder after 2 hours of inactivity
    if (settings.break && inactiveTime > 2 * 60 * 60 * 1000) {
        sendBreakReminder();
        lastActivityTime = Date.now(); // Reset
    }
}

// Track user activity
if (typeof window !== 'undefined') {
    ['click', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, recordUserActivity);
    });
    
    // Check inactivity every 30 minutes
    setInterval(checkInactivityReminder, 30 * 60 * 1000);
}

/**
 * Initialize notifications module
 */
async function initNotificationsModule() {
    if (!areNotificationsSupported()) {
        console.log('Notifications not supported');
        return false;
    }
    
    // Check if we already have permission
    if (Notification.permission === 'granted') {
        startAllReminders();
        return true;
    }
    
    // Auto-request permission after user interaction
    const requestOnInteraction = () => {
        requestNotificationPermission().then(granted => {
            if (granted) {
                startAllReminders();
            }
        });
        ['click', 'keypress'].forEach(event => {
            window.removeEventListener(event, requestOnInteraction);
        });
    };
    
    // Request permission on first user interaction
    ['click', 'keypress'].forEach(event => {
        window.addEventListener(event, requestOnInteraction);
    });
    
    return false;
}

/**
 * Get reminder status for UI
 */
function getReminderStatus() {
    const settings = getReminderSettings();
    return {
        ...settings,
        activeReminders: Object.keys(reminderTimers).length
    };
}

// Export functions for global use
window.requestNotificationPermission = requestNotificationPermission;
window.sendNotification = sendNotification;
window.toggleReminder = toggleReminder;
window.startAllReminders = startAllReminders;
window.stopAllReminders = stopAllReminders;
window.sendTestNotification = sendTestNotification;
window.getReminderSettings = getReminderSettings;
window.saveReminderSettings = saveReminderSettings;
window.getReminderStatus = getReminderStatus;
window.initNotificationsModule = initNotificationsModule;

// Auto-initialize
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initNotificationsModule);
}