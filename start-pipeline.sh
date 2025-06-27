#!/bin/bash

echo "🚀 Starting PDF Pipeline..."

# Function to check if service is ready
wait_for_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=0
    
    echo "⏳ Waiting for $service..."
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s -f "$url" >/dev/null 2>&1; then
            echo "✅ $service is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo "❌ $service failed to start"
    return 1
}

# Cleanup function
cleanup() {
    echo "🧹 Stopping services..."
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "tsx watch" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
}

trap cleanup EXIT

# Start backend
echo "🔧 Starting backend..."
cd backend
npm run dev &
cd ..

# Wait for backend
if ! wait_for_service "Backend" "http://localhost:8000/api/health"; then
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd frontend
npm run dev &
cd ..

# Wait for frontend
if ! wait_for_service "Frontend" "http://localhost:3000"; then
    echo "❌ Frontend failed to start"
    exit 1
fi

echo "🎉 PDF Pipeline is ready!"
echo "📖 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"

wait
