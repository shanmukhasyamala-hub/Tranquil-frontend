/* ============================================
   PUSH NOTIFICATIONS MODULE
   ============================================ */

class PushNotificationManager {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.swRegistration = null;
        this.subscription = null;
        this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'; // Replace with your VAPID key
    }
    
    async init() {
        if (!this.isSupported) {
            console.log('Push notifications not supported');
            return false;
        }
        
        try {
            this.swRegistration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered');
            
            const permission = await this.requestPermission();
            if (permission) {
                await this.subscribe();
            }
            
            return true;
        } catch (error) {
            console.error('Push notification init error:', error);
            return false;
        }
    }
    
    async requestPermission() {
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return false;
    }
    
    async subscribe() {
        try {
            this.subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });
            
            // Send subscription to backend
            await this.sendSubscriptionToServer(this.subscription);
            
            console.log('Push subscription created');
            return this.subscription;
        } catch (error) {
            console.error('Failed to subscribe:', error);
            return null;
        }
    }
    
    async unsubscribe() {
        if (this.subscription) {
            await this.subscription.unsubscribe();
            this.subscription = null;
            console.log('Unsubscribed from push');
        }
    }
    
    async sendSubscriptionToServer(subscription) {
        // Send to your backend
        try {
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
        }
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }
    
    // Send local notification (for reminders)
    sendLocalNotification(title, body, options = {}) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: options.icon || '/assets/icon-192.png',
                ...options
            });
            
            notification.onclick = () => {
                window.focus();
                if (options.url) {
                    window.location.href = options.url;
                }
                notification.close();
            };
        }
    }
    
    // Schedule reminders
    scheduleReminders() {
        const settings = getReminderSettings();
        
        // Check every minute for reminders
        setInterval(() => {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            
            // Hydration reminder (every hour)
            if (settings.hydration && minute === 0) {
                this.sendLocalNotification(
                    '💧 Hydration Reminder',
                    'Time to drink some water! Stay hydrated for better focus.',
                    { url: '/hydration-tracker.html' }
                );
            }
            
            // Break reminder (every 2 hours)
            if (settings.break && hour % 2 === 0 && minute === 0) {
                this.sendLocalNotification(
                    '☕ Time for a Break',
                    'Step away from your screen for 5 minutes. Your mind will thank you!',
                    { url: '/breathe.html' }
                );
            }
            
            // Morning check-in (9 AM)
            if (hour === 9 && minute === 0) {
                this.sendLocalNotification(
                    '🌅 Good Morning!',
                    'Start your day with a quick mood check-in.',
                    { url: '/journal.html' }
                );
            }
            
            // Evening wind-down (9 PM)
            if (hour === 21 && minute === 0) {
                this.sendLocalNotification(
                    '😴 Time to Wind Down',
                    'Try a breathing exercise before bed for better sleep.',
                    { url: '/sleep.html' }
                );
            }
        }, 60000);
    }
    
    // Send stress alert
    sendStressAlert(stressLevel) {
        if (stressLevel > 80) {
            this.sendLocalNotification(
                '⚠️ High Stress Alert',
                'Your stress level is very high. Take a deep breath and try a quick meditation.',
                { url: '/breathe.html', tag: 'stress-alert' }
            );
        }
    }
}

// Create global instance
window.pushNotifications = new PushNotificationManager();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        window.pushNotifications.init();
        window.pushNotifications.scheduleReminders();
    }
});