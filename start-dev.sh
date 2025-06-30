#!/bin/bash
# Development startup script

echo "🚀 Starting PDF Study Planner Development Environment"

# Function to cleanup background processes
cleanup() {
    echo "🧹 Cleaning up..."
    pkill -f "npm start" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "📡 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 Development servers started!"
echo "📡 Backend:  http://localhost:3001"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for processes
wait
