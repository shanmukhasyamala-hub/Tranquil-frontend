/* ============================================
   MACHINE LEARNING MODULE
   Stress prediction and personalized insights
   ============================================ */

class MLStressPredictor {
    constructor() {
        this.model = null;
        this.isTrained = false;
        this.trainingData = [];
        this.features = ['heartRate', 'sleep', 'mood', 'timeOfDay', 'dayOfWeek'];
    }
    
    // Prepare features from user data
    extractFeatures(stressLogs, moodEntries, sleepData, heartRateData) {
        const features = [];
        const labels = [];
        
        // Use last 30 days of data
        const recentStress = stressLogs.slice(-30);
        
        recentStress.forEach((stress, idx) => {
            const timestamp = new Date(stress.ts);
            const hour = timestamp.getHours();
            const dayOfWeek = timestamp.getDay();
            
            // Find mood around same time
            const nearbyMood = moodEntries.find(m => 
                Math.abs(m.ts - stress.ts) < 3600000 // within 1 hour
            );
            
            // Find sleep from previous night
            const prevSleep = sleepData.find(s => 
                new Date(s.timestamp).getDate() === timestamp.getDate() - 1
            );
            
            // Find heart rate data
            const hrData = heartRateData?.find(h => 
                Math.abs(h.timestamp - stress.ts) < 300000 // within 5 min
            );
            
            features.push([
                hrData?.value || 75,                          // Heart rate
                prevSleep?.duration || 480,                   // Sleep minutes
                nearbyMood ? this.moodToNumber(nearbyMood.mood) : 3, // Mood
                hour / 24,                                    // Time of day normalized
                dayOfWeek / 7                                 // Day of week normalized
            ]);
            
            labels.push(stress.score / 100); // Normalize stress score
        });
        
        return { features, labels };
    }
    
    moodToNumber(mood) {
        const map = { 'Great': 5, 'Good': 4, 'Okay': 3, 'Low': 2, 'Stressed': 1 };
        return map[mood] || 3;
    }
    
    // Simple linear regression model (can be replaced with TensorFlow.js)
    trainSimpleModel(features, labels) {
        if (features.length < 10) return null;
        
        // Calculate weights using linear regression
        const n = features.length;
        const weights = [0, 0, 0, 0, 0];
        const learningRate = 0.01;
        
        for (let epoch = 0; epoch < 1000; epoch++) {
            let totalError = 0;
            
            for (let i = 0; i < n; i++) {
                let prediction = 0;
                for (let j = 0; j < weights.length; j++) {
                    prediction += weights[j] * features[i][j];
                }
                
                const error = labels[i] - prediction;
                totalError += Math.abs(error);
                
                for (let j = 0; j < weights.length; j++) {
                    weights[j] += learningRate * error * features[i][j];
                }
            }
            
            if (totalError / n < 0.01) break;
        }
        
        return { weights, type: 'linear' };
    }
    
    // Predict stress score
    predictStress(currentData) {
        if (!this.model) return null;
        
        const { heartRate, mood, sleepHours, hour } = currentData;
        
        const features = [
            heartRate || 75,
            (sleepHours || 8) * 60,
            this.moodToNumber(mood || 'Okay'),
            (hour || new Date().getHours()) / 24,
            new Date().getDay() / 7
        ];
        
        let prediction = 0;
        for (let j = 0; j < this.model.weights.length; j++) {
            prediction += this.model.weights[j] * features[j];
        }
        
        // Clamp to 0-100 range
        let stressScore = Math.min(100, Math.max(0, Math.round(prediction * 100)));
        
        return stressScore;
    }
    
    // Train model with user data
    async train(stressLogs, moodEntries, sleepData, heartRateData) {
        const { features, labels } = this.extractFeatures(
            stressLogs, moodEntries, sleepData, heartRateData
        );
        
        if (features.length < 20) {
            console.log('Need more data to train model (at least 20 samples)');
            return false;
        }
        
        this.model = this.trainSimpleModel(features, labels);
        this.isTrained = true;
        
        console.log('Model trained with', features.length, 'samples');
        return true;
    }
    
    // Generate personalized insights
    generateInsights(stressLogs, moodEntries, sleepData) {
        const insights = [];
        
        // Analyze stress patterns by time of day
        const stressByHour = {};
        stressLogs.forEach(log => {
            const hour = new Date(log.ts).getHours();
            if (!stressByHour[hour]) stressByHour[hour] = [];
            stressByHour[hour].push(log.score);
        });
        
        let worstHour = null;
        let worstScore = 0;
        let bestHour = null;
        let bestScore = 100;
        
        for (const [hour, scores] of Object.entries(stressByHour)) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            if (avg > worstScore) {
                worstScore = avg;
                worstHour = hour;
            }
            if (avg < bestScore) {
                bestScore = avg;
                bestHour = hour;
            }
        }
        
        if (worstHour) {
            insights.push({
                type: 'pattern',
                message: `Your stress peaks around ${this.formatHour(worstHour)}. Consider taking a break at this time.`,
                severity: 'high'
            });
        }
        
        if (bestHour) {
            insights.push({
                type: 'pattern',
                message: `You're most relaxed around ${this.formatHour(bestHour)}. Great time for focused work!`,
                severity: 'low'
            });
        }
        
        // Mood-stress correlation
        const moodStress = {};
        moodEntries.forEach(entry => {
            const nearbyStress = stressLogs.find(s => 
                Math.abs(s.ts - entry.ts) < 3600000
            );
            if (nearbyStress) {
                if (!moodStress[entry.mood]) moodStress[entry.mood] = [];
                moodStress[entry.mood].push(nearbyStress.score);
            }
        });
        
        const bestMood = Object.entries(moodStress).sort((a, b) => {
            const avgA = a[1].reduce((x, y) => x + y, 0) / a[1].length;
            const avgB = b[1].reduce((x, y) => x + y, 0) / b[1].length;
            return avgA - avgB;
        })[0];
        
        if (bestMood) {
            insights.push({
                type: 'correlation',
                message: `Your stress is lowest when you're feeling ${bestMood[0]}. Practice activities that bring this mood!`,
                severity: 'medium'
            });
        }
        
        // Sleep impact
        if (sleepData.length > 0) {
            const sleepImpact = [];
            sleepData.forEach(sleep => {
                const nextDayStress = stressLogs.filter(s => 
                    new Date(s.ts).getDate() === new Date(sleep.timestamp).getDate() + 1
                );
                if (nextDayStress.length) {
                    const avgStress = nextDayStress.reduce((a, b) => a + b.score, 0) / nextDayStress.length;
                    sleepImpact.push({ sleep: sleep.duration, stress: avgStress });
                }
            });
            
            if (sleepImpact.length > 5) {
                const correlation = this.calculateCorrelation(
                    sleepImpact.map(s => s.sleep),
                    sleepImpact.map(s => s.stress)
                );
                
                if (correlation < -0.3) {
                    insights.push({
                        type: 'sleep',
                        message: `Getting enough sleep significantly reduces your next-day stress. Aim for 7-8 hours!`,
                        severity: 'high'
                    });
                }
            }
        }
        
        return insights;
    }
    
    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumY2 = y.reduce((a, b) => a + b * b, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        if (denominator === 0) return 0;
        return numerator / denominator;
    }
    
    formatHour(hour) {
        const hourNum = parseInt(hour);
        if (hourNum === 0) return 'midnight';
        if (hourNum < 12) return `${hourNum} AM`;
        if (hourNum === 12) return 'noon';
        return `${hourNum - 12} PM`;
    }
    
    // Get AI tip based on current state
    getAITip(currentStress, currentMood, timeOfDay) {
        const tips = [];
        
        if (currentStress > 70) {
            tips.push({
                title: 'High Stress Detected',
                message: 'Try the 4-7-8 breathing technique for immediate relief. Inhale 4s, hold 7s, exhale 8s.',
                action: 'breathe'
            });
        }
        
        if (currentMood === 'Stressed' || currentMood === 'Low') {
            tips.push({
                title: 'Mood Boost',
                message: 'Listen to calming nature sounds for 5 minutes to improve your mood.',
                action: 'sounds'
            });
        }
        
        const hour = new Date().getHours();
        if (hour > 22 || hour < 6) {
            tips.push({
                title: 'Bedtime Routine',
                message: 'Time to wind down. Try the sleep meditation for better rest.',
                action: 'sleep'
            });
        } else if (hour > 12 && hour < 14) {
            tips.push({
                title: 'Post-Lunch Slump',
                message: 'Take a 10-minute walk to boost energy and reduce stress.',
                action: 'exercise'
            });
        }
        
        return tips;
    }
}

// Create global instance
window.mlPredictor = new MLStressPredictor();

// Auto-train on page load
document.addEventListener('DOMContentLoaded', async () => {
    const stressLogs = getStressLogs();
    const moodEntries = getMoodJournal();
    const sleepData = JSON.parse(localStorage.getItem('tranquil_sleep') || '[]');
    
    if (stressLogs.length > 20) {
        await window.mlPredictor.train(stressLogs, moodEntries, sleepData, []);
    }
});