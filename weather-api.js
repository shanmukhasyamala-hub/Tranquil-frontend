/* ============================================
   WEATHER API MODULE
   Integrates with OpenWeatherMap API
   ============================================ */

// Weather API Configuration
const WEATHER_CONFIG = {
    // Get your free API key from: https://openweathermap.org/api
    API_KEY: '', // Leave empty to use demo mode, or add your key: 'your_api_key_here'
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    ICON_URL: 'https://openweathermap.org/img/wn',
    UNITS: 'metric', // 'metric' for Celsius, 'imperial' for Fahrenheit
    LANGUAGE: 'en',
    CACHE_DURATION: 30 * 60 * 1000, // 30 minutes cache
    USE_DEMO_MODE: true // Set to false when you have API key
};

// Storage keys
const WEATHER_STORAGE_KEY = 'tranquil_weather_data';
const WEATHER_CACHE_KEY = 'tranquil_weather_cache';

// Weather condition mapping to mood suggestions
const WEATHER_MOOD_MAP = {
    'Clear': { emoji: '☀️', suggestion: 'Great day for outdoor activities!', moodBoost: 2 },
    'Clouds': { emoji: '☁️', suggestion: 'Perfect weather for reading or meditation', moodBoost: 1 },
    'Rain': { emoji: '🌧️', suggestion: 'Cozy day inside - try some calming sounds', moodBoost: 0 },
    'Drizzle': { emoji: '🌦️', suggestion: 'Light rain can be soothing - try nature sounds', moodBoost: 0 },
    'Thunderstorm': { emoji: '⛈️', suggestion: 'Stormy weather - stay safe and practice breathing', moodBoost: -1 },
    'Snow': { emoji: '❄️', suggestion: 'Beautiful winter day - enjoy the quiet', moodBoost: 2 },
    'Mist': { emoji: '🌫️', suggestion: 'Mysterious weather - perfect for mindfulness', moodBoost: 1 },
    'Fog': { emoji: '🌫️', suggestion: 'Take it slow and be present', moodBoost: 0 },
    'Haze': { emoji: '🌫️', suggestion: 'Stay hydrated and take breaks', moodBoost: 0 },
    'Smoke': { emoji: '💨', suggestion: 'Air quality alert - stay indoors', moodBoost: -1 }
};

/**
 * Get cached weather data
 */
function getCachedWeather() {
    try {
        const cache = localStorage.getItem(WEATHER_CACHE_KEY);
        if (!cache) return null;
        
        const { data, timestamp } = JSON.parse(cache);
        const now = Date.now();
        
        if (now - timestamp < WEATHER_CONFIG.CACHE_DURATION) {
            return data;
        }
        return null;
    } catch (e) {
        console.error('Cache read error:', e);
        return null;
    }
}

/**
 * Save weather data to cache
 */
function saveWeatherCache(data) {
    try {
        const cache = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error('Cache save error:', e);
    }
}

/**
 * Get weather icon URL
 */
function getWeatherIconUrl(iconCode) {
    return `${WEATHER_CONFIG.ICON_URL}/${iconCode}@2x.png`;
}

/**
 * Fetch weather by city name
 * @param {string} city - City name
 * @returns {Promise<object>} Weather data
 */
async function fetchWeatherByCity(city) {
    // Check cache first
    const cached = getCachedWeather();
    if (cached && cached.city === city) {
        return cached;
    }
    
    // Demo mode (no API key)
    if (WEATHER_CONFIG.USE_DEMO_MODE || !WEATHER_CONFIG.API_KEY) {
        return getDemoWeather(city);
    }
    
    try {
        const url = `${WEATHER_CONFIG.BASE_URL}/weather?q=${encodeURIComponent(city)}&units=${WEATHER_CONFIG.UNITS}&lang=${WEATHER_CONFIG.LANGUAGE}&appid=${WEATHER_CONFIG.API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        const weatherData = processWeatherData(data);
        weatherData.city = city;
        
        saveWeatherCache(weatherData);
        return weatherData;
    } catch (error) {
        console.error('Weather fetch error:', error);
        return getDemoWeather(city);
    }
}

/**
 * Fetch weather by coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<object>} Weather data
 */
async function fetchWeatherByCoords(lat, lon) {
    // Check cache for coordinates
    const cached = getCachedWeather();
    const cacheKey = `${lat},${lon}`;
    if (cached && cached.coords === cacheKey) {
        return cached;
    }
    
    // Demo mode
    if (WEATHER_CONFIG.USE_DEMO_MODE || !WEATHER_CONFIG.API_KEY) {
        return getDemoWeatherByCoords(lat, lon);
    }
    
    try {
        const url = `${WEATHER_CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${WEATHER_CONFIG.UNITS}&lang=${WEATHER_CONFIG.LANGUAGE}&appid=${WEATHER_CONFIG.API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        const weatherData = processWeatherData(data);
        weatherData.coords = cacheKey;
        
        saveWeatherCache(weatherData);
        return weatherData;
    } catch (error) {
        console.error('Weather fetch error:', error);
        return getDemoWeatherByCoords(lat, lon);
    }
}

/**
 * Process raw weather API data
 */
function processWeatherData(data) {
    const condition = data.weather[0].main;
    const moodData = WEATHER_MOOD_MAP[condition] || WEATHER_MOOD_MAP['Clear'];
    
    return {
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: condition,
        conditionDescription: data.weather[0].description,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        icon: data.weather[0].icon,
        iconUrl: getWeatherIconUrl(data.weather[0].icon),
        sunrise: new Date(data.sys.sunrise * 1000),
        sunset: new Date(data.sys.sunset * 1000),
        moodEmoji: moodData.emoji,
        suggestion: moodData.suggestion,
        moodBoost: moodData.moodBoost,
        timestamp: Date.now()
    };
}

/**
 * Get demo weather data (for testing without API)
 */
function getDemoWeather(city) {
    const conditions = Object.keys(WEATHER_MOOD_MAP);
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const moodData = WEATHER_MOOD_MAP[randomCondition];
    
    return {
        city: city || 'Your City',
        country: 'Demo',
        temperature: Math.floor(Math.random() * 25) + 15,
        feelsLike: Math.floor(Math.random() * 25) + 15,
        condition: randomCondition,
        conditionDescription: randomCondition.toLowerCase(),
        humidity: Math.floor(Math.random() * 60) + 30,
        pressure: Math.floor(Math.random() * 50) + 1000,
        windSpeed: Math.floor(Math.random() * 20),
        icon: '01d',
        iconUrl: '',
        sunrise: new Date(),
        sunset: new Date(),
        moodEmoji: moodData.emoji,
        suggestion: moodData.suggestion,
        moodBoost: moodData.moodBoost,
        timestamp: Date.now(),
        isDemo: true
    };
}

/**
 * Get demo weather by coordinates
 */
function getDemoWeatherByCoords(lat, lon) {
    const weather = getDemoWeather('');
    weather.coords = `${lat},${lon}`;
    weather.lat = lat;
    weather.lon = lon;
    return weather;
}

/**
 * Get user's location and fetch weather
 * @returns {Promise<object>} Weather data
 */
async function getWeatherForCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const weather = await fetchWeatherByCoords(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    resolve(weather);
                } catch (error) {
                    reject(error);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                reject(error);
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    });
}

/**
 * Get weather-based wellness suggestion
 */
function getWellnessSuggestion(weather) {
    const temp = weather.temperature;
    const condition = weather.condition;
    const moodBoost = weather.moodBoost;
    
    let suggestion = weather.suggestion;
    
    // Temperature-based suggestions
    if (temp > 30) {
        suggestion += ' Stay hydrated and avoid direct sunlight.';
    } else if (temp < 10) {
        suggestion += ' Dress warmly and have a warm drink.';
    }
    
    // Humidity-based suggestions
    if (weather.humidity > 80) {
        suggestion += ' High humidity - take it easy today.';
    } else if (weather.humidity < 30) {
        suggestion += ' Low humidity - keep your skin hydrated.';
    }
    
    // Mood boost suggestion
    if (moodBoost > 0) {
        suggestion += ' Take advantage of the good weather with outdoor activities!';
    } else if (moodBoost < 0) {
        suggestion += ' Try some indoor relaxation techniques today.';
    }
    
    return suggestion;
}

/**
 * Get weather-based activity recommendation
 */
function getActivityRecommendation(weather) {
    const temp = weather.temperature;
    const condition = weather.condition;
    
    if (condition === 'Clear' && temp > 15 && temp < 30) {
        return 'Perfect for a walk outdoors or outdoor meditation.';
    } else if (condition === 'Rain' || condition === 'Thunderstorm') {
        return 'Great day for indoor breathing exercises and calming sounds.';
    } else if (condition === 'Snow') {
        return 'Enjoy the winter scenery with a warm drink and mindfulness.';
    } else if (temp > 30) {
        return 'Stay cool indoors with meditation and hydration tracking.';
    } else if (temp < 5) {
        return 'Cozy up with a blanket and try the guided meditation.';
    }
    
    return 'Any weather is good for mindfulness. Try a breathing session!';
}

/**
 * Save weather preference for mood correlation
 */
function saveWeatherPreference(weather, mood) {
    const key = 'tranquil_weather_mood_logs';
    const logs = JSON.parse(localStorage.getItem(key) || '[]');
    
    logs.push({
        weather: weather.condition,
        temperature: weather.temperature,
        mood: mood,
        timestamp: Date.now()
    });
    
    localStorage.setItem(key, JSON.stringify(logs.slice(-100)));
}

/**
 * Get weather-mood correlation statistics
 */
function getWeatherMoodCorrelation() {
    const key = 'tranquil_weather_mood_logs';
    const logs = JSON.parse(localStorage.getItem(key) || '[]');
    
    const moodValues = { 'Great': 5, 'Good': 4, 'Okay': 3, 'Low': 2, 'Stressed': 1 };
    const stats = {};
    
    logs.forEach(log => {
        if (!stats[log.weather]) {
            stats[log.weather] = { total: 0, count: 0 };
        }
        stats[log.weather].total += moodValues[log.mood] || 3;
        stats[log.weather].count++;
    });
    
    const result = {};
    for (const [weather, data] of Object.entries(stats)) {
        result[weather] = {
            averageMood: (data.total / data.count).toFixed(1),
            count: data.count
        };
    }
    
    return result;
}

/**
 * Update weather display in UI
 */
function updateWeatherDisplay(weather) {
    const container = document.getElementById('weatherCard');
    if (!container) return;
    
    container.innerHTML = `
        <div style="font-size: 3rem;">${weather.moodEmoji}</div>
        <div class="weather-temp">${weather.temperature}°C</div>
        <div class="weather-condition">${weather.conditionDescription}</div>
        <div style="font-size: 0.85rem; margin-top: 8px;">${weather.city}, ${weather.country}</div>
        <div style="font-size: 0.75rem; color: var(--text3); margin-top: 4px;">
            💧 ${weather.humidity}% | 💨 ${weather.windSpeed} km/h
        </div>
        ${weather.isDemo ? '<div style="font-size: 0.7rem; margin-top: 8px; background: rgba(0,0,0,0.1); display: inline-block; padding: 2px 8px; border-radius: 100px;">Demo Mode</div>' : ''}
    `;
    
    const insightEl = document.getElementById('weatherInsight');
    if (insightEl) {
        insightEl.innerHTML = getWellnessSuggestion(weather);
    }
    
    const activityEl = document.getElementById('weatherActivity');
    if (activityEl) {
        activityEl.innerHTML = getActivityRecommendation(weather);
    }
}

/**
 * Initialize weather module
 */
async function initWeatherModule() {
    try {
        let weather;
        
        // Try to get location-based weather
        try {
            weather = await getWeatherForCurrentLocation();
            showToast(`🌤️ Weather updated: ${weather.temperature}°C, ${weather.condition}`);
        } catch (error) {
            // Fallback to city-based or demo
            const savedCity = localStorage.getItem('tranquil_weather_city');
            if (savedCity) {
                weather = await fetchWeatherByCity(savedCity);
            } else {
                weather = await fetchWeatherByCity('New York'); // Default city
            }
            showToast(`📍 Using location: ${weather.city}`);
        }
        
        updateWeatherDisplay(weather);
        
        // Save to storage for other pages
        localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(weather));
        
        return weather;
    } catch (error) {
        console.error('Weather initialization error:', error);
        showToast('⚠️ Weather service unavailable');
        return null;
    }
}

/**
 * Refresh weather data
 */
async function refreshWeather() {
    showToast('🔄 Updating weather...');
    const weather = await initWeatherModule();
    return weather;
}

/**
 * Set default city for weather
 */
function setDefaultCity(city) {
    localStorage.setItem('tranquil_weather_city', city);
    refreshWeather();
}

// Export functions for global use
window.fetchWeatherByCity = fetchWeatherByCity;
window.getWeatherForCurrentLocation = getWeatherForCurrentLocation;
window.getWellnessSuggestion = getWellnessSuggestion;
window.getActivityRecommendation = getActivityRecommendation;
window.saveWeatherPreference = saveWeatherPreference;
window.getWeatherMoodCorrelation = getWeatherMoodCorrelation;
window.updateWeatherDisplay = updateWeatherDisplay;
window.initWeatherModule = initWeatherModule;
window.refreshWeather = refreshWeather;
window.setDefaultCity = setDefaultCity;

// Auto-initialize if DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only auto-init if weather elements exist
        if (document.getElementById('weatherCard')) {
            initWeatherModule();
        }
    });
}