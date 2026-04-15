/* ============================================
   BLUETOOTH & WEARABLE SENSORS MODULE
   Connect to heart rate monitors, fitness bands
   ============================================ */

class BluetoothManager {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        this.heartRate = null;
        this.heartRateHistory = [];
        this.listeners = [];
    }
    
    // Check if Bluetooth is supported
    isSupported() {
        return 'bluetooth' in navigator;
    }
    
    // Request Bluetooth device
    async connectToHeartRateMonitor() {
        if (!this.isSupported()) {
            throw new Error('Bluetooth not supported in this browser');
        }
        
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['heart_rate'] },
                    { namePrefix: 'Tranquil' },
                    { namePrefix: 'Apple Watch' },
                    { namePrefix: 'Fitbit' },
                    { namePrefix: 'Mi Band' }
                ],
                optionalServices: ['heart_rate', 'device_information']
            });
            
            console.log('Connected to:', this.device.name);
            
            this.device.addEventListener('gattserverdisconnected', () => {
                this.isConnected = false;
                this.notifyListeners('disconnected', { device: this.device.name });
                showToast(`❌ ${this.device.name} disconnected`);
            });
            
            await this.connectToDevice();
            return this.device;
            
        } catch (error) {
            console.error('Bluetooth error:', error);
            throw error;
        }
    }
    
    async connectToDevice() {
        this.server = await this.device.gatt.connect();
        this.isConnected = true;
        
        try {
            this.service = await this.server.getPrimaryService('heart_rate');
            this.characteristic = await this.service.getCharacteristic('heart_rate_measurement');
            
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', 
                this.handleHeartRateMeasurement.bind(this));
            
            showToast(`✅ Connected to ${this.device.name}`);
            this.notifyListeners('connected', { device: this.device.name });
            
            // Get device info
            await this.getDeviceInfo();
            
        } catch (error) {
            console.error('Failed to get heart rate service:', error);
        }
    }
    
    handleHeartRateMeasurement(event) {
        const value = event.target.value;
        const heartRate = this.parseHeartRate(value);
        
        if (heartRate) {
            this.heartRate = heartRate;
            this.heartRateHistory.push({
                value: heartRate,
                timestamp: Date.now()
            });
            
            // Keep last 100 readings
            if (this.heartRateHistory.length > 100) {
                this.heartRateHistory.shift();
            }
            
            this.notifyListeners('heartrate', { 
                value: heartRate, 
                timestamp: Date.now(),
                history: this.heartRateHistory.slice(-10)
            });
            
            // Calculate stress from heart rate
            const stressScore = this.calculateStressFromHR(heartRate);
            this.notifyListeners('stress', { value: stressScore });
        }
    }
    
    parseHeartRate(value) {
        const flags = value.getUint8(0);
        const rateFormat = flags & 0x01;
        
        let heartRate;
        if (rateFormat === 0) {
            heartRate = value.getUint8(1);
        } else {
            heartRate = value.getUint16(1, true);
        }
        
        return heartRate;
    }
    
    async getDeviceInfo() {
        try {
            const infoService = await this.server.getPrimaryService('device_information');
            const nameChar = await infoService.getCharacteristic('manufacturer_name_string');
            const name = await nameChar.readValue();
            const decoder = new TextDecoder('utf-8');
            const manufacturer = decoder.decode(name);
            
            console.log('Manufacturer:', manufacturer);
            this.notifyListeners('info', { manufacturer });
            
        } catch (error) {
            console.log('Device info not available');
        }
    }
    
    calculateStressFromHR(heartRate) {
        // Calculate resting heart rate from history
        const restingHR = this.getRestingHeartRate();
        
        // Stress score formula: (current HR - resting HR) / (max HR - resting HR) * 100
        const maxHR = 220 - 30; // Assuming age 30 for demo
        
        let stressScore = ((heartRate - restingHR) / (maxHR - restingHR)) * 100;
        stressScore = Math.min(100, Math.max(0, Math.round(stressScore)));
        
        return stressScore;
    }
    
    getRestingHeartRate() {
        if (this.heartRateHistory.length < 10) return 70; // Default
        
        // Get lowest 10 readings as resting
        const sorted = [...this.heartRateHistory]
            .slice(-50)
            .map(h => h.value)
            .sort((a, b) => a - b);
        
        const resting = sorted.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
        return Math.round(resting);
    }
    
    disconnect() {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        this.isConnected = false;
        this.notifyListeners('disconnected', {});
    }
    
    // Event listeners
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    notifyListeners(event, data) {
        this.listeners.forEach(cb => cb(event, data));
    }
    
    // Get heart rate variability (HRV) - advanced stress metric
    calculateHRV() {
        if (this.heartRateHistory.length < 10) return null;
        
        const recent = this.heartRateHistory.slice(-30);
        const rrIntervals = [];
        
        for (let i = 1; i < recent.length; i++) {
            const interval = recent[i].timestamp - recent[i-1].timestamp;
            rrIntervals.push(interval);
        }
        
        const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
        const squaredDiffs = rrIntervals.map(rr => Math.pow(rr - mean, 2));
        const rmssd = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length);
        
        return rmssd;
    }
    
    // Simulate wearable data (for testing without hardware)
    startSimulation() {
        this.simulationInterval = setInterval(() => {
            const simulatedHR = 60 + Math.floor(Math.random() * 40);
            this.notifyListeners('heartrate', {
                value: simulatedHR,
                timestamp: Date.now(),
                simulated: true
            });
            
            const stress = this.calculateStressFromHR(simulatedHR);
            this.notifyListeners('stress', { value: stress, simulated: true });
        }, 2000);
    }
    
    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
    }
}

// Create global instance
window.bluetoothManager = new BluetoothManager();

// Auto-connect if previously connected
const lastDevice = localStorage.getItem('tranquil_last_device');
if (lastDevice && navigator.bluetooth) {
    // Attempt reconnection
    console.log('Attempting to reconnect to', lastDevice);
}