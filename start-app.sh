#!/bin/bash
# PDF Study Planner - Enhanced Startup Script

echo "🚀 Starting PDF Study Planner (Enhanced Version)"
echo "==============================================="

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    pkill -f "node src/server.js" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check directories
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: backend or frontend directory not found"
    exit 1
fi

# Start backend
echo "📡 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend
sleep 3

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend

# Check if build works
echo "🔧 Testing build configuration..."
if ! npm run build > /dev/null 2>&1; then
    echo "⚠️  Build test failed, but starting development server anyway..."
fi

PORT=3000 npm start &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 PDF Study Planner is running!"
echo "==============================================="
echo "📡 Backend:  http://localhost:3001"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "🔧 Enhanced features now available:"
echo "   ✅ Working PDF viewer with timer"
echo "   ✅ Enhanced topic management"
echo "   ✅ Drag & drop PDF upload"
echo "   ✅ Reading analytics dashboard"
echo "   ✅ Progress tracking and estimates"
echo ""
echo "💡 Pro tip: Open browser console and run:"
echo "   window.injectTestData() - Add sample data"
echo "   window.clearTestData() - Clear all data"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for processes
wait
