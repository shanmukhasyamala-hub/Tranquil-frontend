/* ============================================
   TRANQUIL DARK MODE - FINAL WORKING VERSION
   ============================================ */

(function() {
    const STORAGE_KEY = 'tranquil_dark_mode';
    const DARK_CLASS = 'dark-mode';
    
    // Apply dark mode
    function applyDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add(DARK_CLASS);
        } else {
            document.body.classList.remove(DARK_CLASS);
        }
        localStorage.setItem(STORAGE_KEY, isDark);
        
        // Update toggle if exists
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) toggle.checked = isDark;
        
        // Update icon if exists
        const icon = document.getElementById('darkModeIcon');
        if (icon) icon.textContent = isDark ? '☀️' : '🌙';
        
        console.log('Dark mode:', isDark ? 'ON' : 'OFF');
    }
    
    // Toggle function
    window.toggleDarkMode = function() {
        const isDark = !document.body.classList.contains(DARK_CLASS);
        applyDarkMode(isDark);
        if (typeof showToast !== 'undefined') {
            showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
        }
        return isDark;
    };
    
    // Load saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
        applyDarkMode(saved === 'true');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyDarkMode(prefersDark);
    }
    
    // Listen for toggle clicks
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'darkModeToggle') {
            applyDarkMode(e.target.checked);
        }
    });
    
    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', function(e) {
        if (e.key === STORAGE_KEY) {
            applyDarkMode(e.newValue === 'true');
        }
    });
    
    console.log('Dark mode script loaded');
})();