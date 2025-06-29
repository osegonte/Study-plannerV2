#!/bin/bash

echo "🚀 Quick Development Start"
echo "========================="

# Check if app is already running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ App is already running at http://localhost:3000"
    echo "🧪 Injecting test data..."
    
    # Open browser with test data injection
    osascript << 'APPLESCRIPT'
tell application "Safari"
    activate
    set URL of document 1 to "http://localhost:3000"
    delay 2
    do JavaScript "
        console.log('🧪 Auto-injecting test data...');
        if (window.injectTestData) {
            window.injectTestData();
            console.log('✅ Test data injected!');
            window.location.reload();
        } else {
            console.log('⏳ Waiting for app to load...');
        }
    " in document 1
end tell
APPLESCRIPT
else
    echo "🔄 Starting development server..."
    cd frontend
    npm start &
    
    echo "⏳ Waiting for server to start..."
    sleep 10
    
    echo "🌐 Opening browser..."
    open http://localhost:3000
fi

echo ""
echo "📋 Quick Commands:"
echo "  - Test Data: Open console and run 'window.injectTestData()'"
echo "  - Clear Data: 'window.clearTestData()'"
echo "  - Dev Tools: 'window.devTools.logAppState()'"
echo ""
echo "Happy coding! 🎉"
