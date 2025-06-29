#!/bin/bash

echo "🧪 Running Test Scenarios"
echo "========================"

# Check if app is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ App is not running. Please start it with 'npm start' first."
    exit 1
fi

echo "🎯 Running comprehensive test scenarios..."

osascript << 'APPLESCRIPT'
tell application "Safari"
    activate
    do JavaScript "
        console.log('🧪 Starting comprehensive test scenarios...');
        
        // Clear existing data
        console.log('1️⃣ Clearing existing data...');
        window.clearTestData && window.clearTestData();
        
        // Inject fresh test data
        console.log('2️⃣ Injecting fresh test data...');
        window.injectTestData && window.injectTestData();
        
        // Simulate some study sessions
        console.log('3️⃣ Simulating study sessions...');
        if (window.devTools) {
            window.devTools.simulateStudySession('1', 3);
            window.devTools.simulateStudySession('2', 5);
            window.devTools.simulateStudySession('4', 10);
        }
        
        // Set realistic exam schedule
        console.log('4️⃣ Setting exam schedule...');
        window.devTools && window.devTools.setExamSchedule([5, 12, 20, 35]);
        
        console.log('✅ Test scenarios complete!');
        console.log('📊 Current state:');
        window.devTools && window.devTools.logAppState();
        
        // Refresh to see changes
        setTimeout(() => {
            console.log('🔄 Refreshing to show changes...');
            window.location.reload();
        }, 2000);
        
    " in document 1
end tell
APPLESCRIPT

echo "✅ Test scenarios completed!"
echo ""
echo "🎯 What was created:"
echo "  - 5 topics with exams in 5, 12, 20, and 35 days"
echo "  - 5 documents with realistic reading progress"
echo "  - 3 study goals"
echo "  - Simulated study sessions with timing data"
echo "  - User profile and preferences"
echo ""
echo "🌐 Check your browser to see the results!"
