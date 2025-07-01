#!/bin/bash

echo "🧪 Quick Production Test"
echo "======================"

echo "🔧 Starting development servers for testing..."

# Kill any existing processes
pkill -f "npm start" 2>/dev/null || true
pkill -f "node src/server.js" 2>/dev/null || true

sleep 1

# Start backend
echo "📡 Starting backend..."
cd backend
npm start &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

sleep 3

# Start frontend  
echo "🎨 Starting frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Test Environment Ready!"
echo "========================="
echo "📱 Open: http://localhost:3000"
echo ""
echo "🧪 IMMEDIATE TESTS:"
echo "1. Open browser console (F12)"
echo "2. Run: window.createProductionTestData()"
echo "3. Go to any PDF and watch timer count: 1s, 2s, 3s..."
echo "4. Change pages - timer should save and restart"
echo "5. Timer should NEVER reset to 0s unexpectedly"
echo ""
echo "✅ If timer counts continuously = SUCCESS!"
echo "❌ If timer resets to 0s = Need further fixes"
echo ""
echo "Press Ctrl+C to stop"

# Function to cleanup
cleanup() {
    echo ""
    echo "🧹 Stopping test servers..."
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "node src/server.js" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
