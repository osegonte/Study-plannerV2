#!/bin/bash

echo "🚀 PDF Study Planner - Production Mode"
echo "====================================="

# Function to cleanup
cleanup() {
    echo ""
    echo "🧹 Shutting down..."
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "node src/server.js" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check directories
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Project directories not found"
    exit 1
fi

# Start backend
echo "📡 Starting backend..."
cd backend
npm start &
BACKEND_PID=$!
echo "✅ Backend running (PID: $BACKEND_PID)"

sleep 2

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "✅ Frontend running (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Production Environment Ready!"
echo "================================"
echo "📱 Application: http://localhost:3000"
echo "📡 API Server:  http://localhost:3001"
echo ""
echo "✨ Production Features:"
echo "   • Fixed persistent timer (no more resets!)"
echo "   • Optimized for 1000+ PDF library"
echo "   • Advanced caching system"
echo "   • Auto-save every 30 seconds"
echo "   • Enhanced analytics"
echo ""
echo "💻 Mac Mini Optimizations:"
echo "   • Intelligent memory management"
echo "   • Selective file caching"
echo "   • Background optimization"
echo ""
echo "🧪 Test with realistic data:"
echo "   window.createProductionTestData()"
echo "   window.clearProductionData()"
echo ""
echo "Press Ctrl+C to stop"

wait
