/**
 * Performance Test Script for Optimized WhatsApp Bot
 * Tests response times and caching effectiveness
 */

const { detectIntent } = require('./services/intentService');
const { generateResponse } = require('./services/conversationService');
const { getUserState, updateUserState } = require('./services/stateService');

// Test messages
const testMessages = [
    'menu',
    'browse',
    '1',
    'buy',
    'speaker',
    'cancel',
    'help',
    'track',
    'laptop',
    '2'
];

async function runPerformanceTest() {
    console.log('=== PERFORMANCE TEST ===');
    console.log('Testing optimized WhatsApp bot performance...\n');
    
    const testPhone = 'test1234567890';
    const results = [];
    
    // Test each message
    for (const message of testMessages) {
        const userState = getUserState(testPhone);
        
        // Measure intent detection time
        const intentStart = Date.now();
        const intent = await detectIntent(message, userState);
        const intentTime = Date.now() - intentStart;
        
        // Measure response generation time
        const responseStart = Date.now();
        const response = await generateResponse(intent, userState, message);
        const responseTime = Date.now() - responseStart;
        
        // Update state for next test
        if (response.stateUpdates) {
            updateUserState(testPhone, response.stateUpdates);
        }
        
        results.push({
            message,
            intent: intent.type,
            intentTime,
            responseTime,
            totalTime: intentTime + responseTime
        });
        
        console.log(`"${message}" -> ${intent.type} (${intentTime}ms + ${responseTime}ms = ${intentTime + responseTime}ms)`);
    }
    
    // Calculate statistics
    const avgIntentTime = results.reduce((sum, r) => sum + r.intentTime, 0) / results.length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const avgTotalTime = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;
    
    console.log('\n=== PERFORMANCE RESULTS ===');
    console.log(`Average Intent Detection: ${avgIntentTime.toFixed(2)}ms`);
    console.log(`Average Response Generation: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Average Total Time: ${avgTotalTime.toFixed(2)}ms`);
    
    // Test caching effectiveness
    console.log('\n=== CACHING TEST ===');
    const cacheTestStart = Date.now();
    
    // Run same message multiple times to test cache
    for (let i = 0; i < 5; i++) {
        await detectIntent('1', getUserState(testPhone));
    }
    
    const cacheTestTime = Date.now() - cacheTestStart;
    console.log(`5 repeated intent detections: ${cacheTestTime}ms (avg: ${(cacheTestTime/5).toFixed(2)}ms)`);
    
    // Performance goals
    console.log('\n=== PERFORMANCE GOALS ===');
    console.log(`Target: <100ms average response time`);
    console.log(`Target: <50ms intent detection`);
    console.log(`Target: <50ms response generation`);
    
    if (avgTotalTime < 100) {
        console.log('â PERFORMANCE GOAL MET!');
    } else {
        console.log('â Performance needs improvement');
    }
    
    console.log('\n=== TEST COMPLETE ===');
}

// Run test if called directly
if (require.main === module) {
    runPerformanceTest().catch(console.error);
}

module.exports = { runPerformanceTest };
