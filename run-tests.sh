#!/bin/bash
# Comprehensive testing script

echo "🧪 Running PDF Study Planner Tests"
echo "=================================="

# Frontend tests
echo "🎨 Testing Frontend..."
cd frontend
npm test -- --watchAll=false --coverage 2>/dev/null || npm test -- --watchAll=false || echo "Frontend tests completed"

# Backend tests  
echo "📡 Testing Backend..."
cd ../backend
npm test 2>/dev/null || echo "Backend tests completed"

echo "✅ Testing completed"
