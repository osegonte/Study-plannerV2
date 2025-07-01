#!/bin/bash
# start-dev-working.sh - Working development startup script

echo "🚀 Starting PDF Study Planner (Fixed Version)"
echo "=============================================="

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

# Start frontend with better error handling
echo "🎨 Starting frontend development server..."
cd ../frontend

# Check if react-scripts is available
if ! npx react-scripts --version > /dev/null 2>&1; then
    echo "❌ react-scripts not found. Please run ./fix-react-scripts.sh first"
    exit 1
fi

# Start with npx to ensure we use the right version
PORT=3000 npx react-scripts start &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Both servers started successfully!"
echo "=============================================="
echo "📡 Backend:  http://localhost:3001"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "📝 Ready to develop! Replace the placeholder components with enhanced versions."
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for processes
wait
