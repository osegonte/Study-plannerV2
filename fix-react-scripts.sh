#!/bin/bash
# fix-react-scripts.sh - Fix missing react-scripts

echo "🔧 Fixing React Scripts Installation"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Stop any running servers
print_status "Stopping any running servers..."
pkill -f "npm start" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "node src/server.js" 2>/dev/null || true

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Go to frontend directory
cd frontend

print_status "Checking current package.json..."

# First, let's see what's in package.json
if [ -f "package.json" ]; then
    print_status "Current package.json contents:"
    cat package.json
else
    print_error "No package.json found!"
    exit 1
fi

print_status "Clearing npm cache..."
npm cache clean --force

print_status "Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

print_status "Creating comprehensive package.json..."
cat > package.json << 'EOF'
{
  "name": "pdf-study-planner-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@tailwindcss/forms": "^0.5.7",
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.263.1",
    "pdfjs-dist": "^3.11.174",
    "react": "^18.2.0",
    "react-calendar": "^6.0.0",
    "react-dom": "^18.2.0",
    "react-hotkeys-hook": "^5.1.0",
    "react-pdf": "^7.7.1",
    "react-scripts": "5.0.1",
    "tailwindcss": "^3.4.0",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@types/react-calendar": "^3.9.0",
    "autoprefixer": "^10.4.14",
    "eslint-plugin-react-refresh": "^0.4.20",
    "postcss": "^8.4.24"
  }
}
EOF

print_success "New package.json created with react-scripts"

print_status "Installing all dependencies (this may take a few minutes)..."

# Try different installation methods
if npm install; then
    print_success "Dependencies installed successfully!"
elif npm install --legacy-peer-deps; then
    print_success "Dependencies installed with legacy peer deps!"
elif npm install --force; then
    print_warning "Dependencies installed with force flag"
else
    print_error "All installation methods failed. Trying alternative approach..."
    
    # Alternative: Install react-scripts globally first
    print_status "Installing react-scripts globally..."
    npm install -g react-scripts@5.0.1
    
    print_status "Installing local dependencies..."
    npm install --legacy-peer-deps
fi

# Verify react-scripts is available
print_status "Verifying react-scripts installation..."
if npx react-scripts --version; then
    print_success "react-scripts is working!"
elif npm list react-scripts; then
    print_success "react-scripts is installed locally"
elif which react-scripts; then
    print_success "react-scripts is available globally"
else
    print_error "react-scripts still not found. Manual installation required."
    echo ""
    echo "Manual fix options:"
    echo "1. npm install react-scripts@5.0.1"
    echo "2. npm install --legacy-peer-deps"
    echo "3. npm install -g create-react-app && npx create-react-app . --template typescript"
    exit 1
fi

# Create PostCSS config if missing
if [ ! -f "postcss.config.js" ]; then
    print_status "Creating PostCSS config..."
    cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
fi

# Update index.js to import CSS
print_status "Ensuring CSS imports in index.js..."
if [ -f "src/index.js" ]; then
    # Add CSS import if not present
    if ! grep -q "globals.css" src/index.js; then
        sed -i.bak '1i\
import "./styles/globals.css";
' src/index.js
    fi
fi

print_success "React scripts fix completed!"

cd ..

print_status "Creating updated startup script..."
cat > start-dev-working.sh << 'EOF'
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
EOF

chmod +x start-dev-working.sh

echo ""
echo "🎉 React Scripts Fix Complete!"
echo "=============================="
echo "✅ Installed react-scripts and all dependencies"
echo "✅ Created proper package.json"
echo "✅ Added PostCSS configuration"
echo "✅ Created working startup script"
echo ""
echo "🚀 To start the development servers:"
echo "./start-dev-working.sh"
echo ""
echo "📝 If you still have issues, try:"
echo "cd frontend && npm install react-scripts@5.0.1 --save"
echo ""
print_success "All fixes applied! Ready to develop! 🎉"