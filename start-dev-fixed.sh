#!/bin/bash
# Fixed development startup script

echo "🚀 Starting PDF Study Planner Development Environment"
echo "=================================================="

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "node src/server.js" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if directories exist
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: backend or frontend directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Start backend
echo "📡 Starting backend server..."
cd backend
if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found"
    exit 1
fi

npm start &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend development server..."
cd ../frontend

if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found"
    exit 1
fi

# Check if start script exists
if ! grep -q '"start"' package.json; then
    echo "❌ Frontend package.json missing start script"
    echo "Run the setup-and-fix.sh script first"
    exit 1
fi

npm start &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Development servers started successfully!"
echo "=================================================="
echo "📡 Backend:  http://localhost:3001"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "📝 Next steps:"
echo "1. Replace frontend/src/App.jsx with the enhanced version"
echo "2. Add EnhancedPDFViewer.jsx to frontend/src/components/pdf/"
echo "3. Add EnhancedTopicManager.jsx to frontend/src/components/topics/"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for processes
wait
