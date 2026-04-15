/* ============================================
   PWA MODULE - Make app installable
   ============================================ */

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    }
    
    async init() {
        // Check if app is already installed
        if (this.isStandalone) {
            console.log('App is running in standalone mode');
            this.isInstalled = true;
        }
        
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });
        
        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.deferredPrompt = null;
            console.log('App installed successfully');
            showToast('✅ TRANQUIL installed! You can now use it offline.');
        });
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
    
    showInstallPrompt() {
        // Create install banner
        if (this.isInstalled || !this.deferredPrompt) return;
        
        const banner = document.createElement('div');
        banner.className = 'install-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--purple);
            color: white;
            padding: 12px 20px;
            border-radius: 100px;
            display: flex;
            gap: 12px;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            animation: slideUp 0.3s ease;
        `;
        
        banner.innerHTML = `
            <span>📱</span>
            <span>Install TRANQUIL App</span>
            <button style="background: white; border: none; padding: 4px 12px; border-radius: 100px; cursor: pointer;">Install</button>
            <button style="background: none; border: none; color: white; cursor: pointer;">✕</button>
        `;
        
        document.body.appendChild(banner);
        
        const installBtn = banner.querySelector('button:first-of-type');
        const closeBtn = banner.querySelector('button:last-of-type');
        
        installBtn.onclick = async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                console.log(`User response to install: ${outcome}`);
                this.deferredPrompt = null;
                banner.remove();
            }
        };
        
        closeBtn.onclick = () => banner.remove();
    }
    
    // Check if app is installed
    isAppInstalled() {
        return this.isStandalone || this.isInstalled;
    }
    
    // Get install status
    getInstallStatus() {
        return {
            isInstalled: this.isAppInstalled(),
            isStandalone: this.isStandalone,
            canInstall: !!this.deferredPrompt
        };
    }
    
    // Show install guide for iOS
    showIOSInstallGuide() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (!isIOS || this.isStandalone) return;
        
        const guide = document.createElement('div');
        guide.className = 'ios-install-guide';
        guide.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        guide.innerHTML = `
            <div style="background: white; border-radius: 20px; padding: 24px; max-width: 300px; text-align: center;">
                <div style="font-size: 3rem;">📱</div>
                <h3 style="margin: 12px 0;">Install TRANQUIL</h3>
                <p style="color: #666; margin-bottom: 16px;">Tap the Share button, then "Add to Home Screen"</p>
                <img src="/assets/ios-install-guide.png" style="width: 100%; border-radius: 12px; margin: 12px 0;" alt="Install guide">
                <button style="background: var(--purple); color: white; border: none; padding: 10px 20px; border-radius: 100px; cursor: pointer;">Got it</button>
            </div>
        `;
        
        document.body.appendChild(guide);
        
        guide.querySelector('button').onclick = () => guide.remove();
    }
    
    // Enable offline support
    async enableOfflineSupport() {
        if (!navigator.onLine) {
            showToast('📡 You are offline. Some features may be limited.');
        }
        
        window.addEventListener('online', () => {
            showToast('✅ Back online! Syncing your data...');
            if (window.tranquilAPI) {
                window.tranquilAPI.syncOfflineData();
            }
        });
        
        window.addEventListener('offline', () => {
            showToast('📡 You are offline. Using cached data.');
        });
    }
}

// Create global instance
window.pwaManager = new PWAManager();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager.init();
    window.pwaManager.enableOfflineSupport();
    
    // Show iOS install guide after a delay
    setTimeout(() => {
        if (!window.pwaManager.isAppInstalled()) {
            window.pwaManager.showIOSInstallGuide();
        }
    }, 5000);
});