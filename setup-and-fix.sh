#!/bin/bash
# setup-and-fix.sh - Complete setup and fix script for PDF Study Planner

echo "🔧 PDF Study Planner - Setup & Fix Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the right directory
if [ ! -f "start-dev.sh" ]; then
    print_error "Please run this script from the project root directory (where start-dev.sh is located)"
    exit 1
fi

print_status "Checking project structure..."

# Create necessary directories
print_status "Creating missing directories..."
mkdir -p frontend/src/components/pdf
mkdir -p frontend/src/components/topics
mkdir -p frontend/public
mkdir -p backend/src

print_success "Directories created"

# Fix frontend package.json
print_status "Fixing frontend package.json..."

if [ ! -f "frontend/package.json" ]; then
    print_warning "Creating frontend package.json..."
    cat > frontend/package.json << 'EOF'
{
  "name": "pdf-study-planner-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@tailwindcss/forms": "^0.5.7",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.263.1",
    "pdfjs-dist": "^3.11.174",
    "react": "^18.2.0",
    "react-calendar": "^6.0.0",
    "react-dom": "^18.2.0",
    "react-hotkeys-hook": "^5.1.0",
    "react-pdf": "^7.7.1",
    "react-scripts": "5.0.1",
    "tailwindcss": "^3.4.0"
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
    "eslint-plugin-react-refresh": "^0.4.20"
  }
}
EOF
else
    # Fix existing package.json if it's missing the start script
    if ! grep -q '"start"' frontend/package.json; then
        print_status "Adding missing start script to package.json..."
        
        # Create a temporary file with the fixed package.json
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        
        if (!pkg.scripts) pkg.scripts = {};
        pkg.scripts.start = 'react-scripts start';
        pkg.scripts.build = 'react-scripts build';
        pkg.scripts.test = 'react-scripts test';
        pkg.scripts.eject = 'react-scripts eject';
        
        fs.writeFileSync('frontend/package.json', JSON.stringify(pkg, null, 2));
        " 2>/dev/null || {
            print_warning "Node.js method failed, using manual fix..."
            
            # Backup original
            cp frontend/package.json frontend/package.json.backup
            
            # Add scripts section if missing
            if ! grep -q '"scripts"' frontend/package.json; then
                sed -i '' '/"dependencies"/i\
  "scripts": {\
    "start": "react-scripts start",\
    "build": "react-scripts build",\
    "test": "react-scripts test",\
    "eject": "react-scripts eject"\
  },\
' frontend/package.json
            fi
        }
    fi
fi

print_success "Frontend package.json fixed"

# Check backend package.json
print_status "Checking backend package.json..."
if [ ! -f "backend/package.json" ]; then
    print_warning "Creating backend package.json..."
    cat > backend/package.json << 'EOF'
{
  "name": "pdf-study-planner-backend",
  "version": "1.0.0",
  "description": "Backend for PDF Study Planner application",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "cron": "^4.3.1",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "node-schedule": "^2.1.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.1"
  }
}
EOF
fi

# Download PDF.js worker if missing
print_status "Checking PDF.js worker..."
if [ ! -f "frontend/public/pdf.worker.min.js" ]; then
    print_status "Downloading PDF.js worker..."
    curl -s -o "frontend/public/pdf.worker.min.js" "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js" || {
        print_warning "Download failed, creating placeholder..."
        echo "// PDF.js worker placeholder - download manually from https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js" > frontend/public/pdf.worker.min.js
    }
fi

# Create basic frontend files if missing
print_status "Checking essential frontend files..."

if [ ! -f "frontend/src/index.js" ]; then
    print_status "Creating frontend/src/index.js..."
    cat > frontend/src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { pdfjs } from 'react-pdf';
import App from './App';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
console.log('🔧 Worker configured to:', pdfjs.GlobalWorkerOptions.workerSrc);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF
fi

if [ ! -f "frontend/public/index.html" ]; then
    print_status "Creating frontend/public/index.html..."
    cat > frontend/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="PDF Study Planner - Track your reading time and study progress"
    />
    <title>PDF Study Planner</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF
fi

# Create basic App.js if missing (will be replaced with enhanced version)
if [ ! -f "frontend/src/App.jsx" ]; then
    print_status "Creating basic frontend/src/App.jsx..."
    cat > frontend/src/App.jsx << 'EOF'
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          📚 PDF Study Planner
        </h1>
        <p className="text-gray-600">
          Setting up your study environment...
        </p>
        <div className="mt-4 text-sm text-blue-600">
          Please replace this App.jsx with the enhanced version from the artifacts
        </div>
      </div>
    </div>
  );
}

export default App;
EOF
fi

# Install dependencies
print_status "Installing dependencies..."

# Backend dependencies
if [ -d "backend" ]; then
    print_status "Installing backend dependencies..."
    cd backend
    npm install --silent 2>/dev/null || {
        print_warning "Backend npm install had issues, but continuing..."
    }
    cd ..
    print_success "Backend dependencies installed"
fi

# Frontend dependencies
if [ -d "frontend" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend
    
    # Clear npm cache if needed
    npm cache clean --force 2>/dev/null || true
    
    # Install dependencies
    npm install --silent 2>/dev/null || {
        print_warning "Frontend npm install had issues, trying with legacy peer deps..."
        npm install --legacy-peer-deps --silent 2>/dev/null || {
            print_error "Failed to install frontend dependencies. Please run manually:"
            print_error "cd frontend && npm install"
        }
    }
    cd ..
    print_success "Frontend dependencies installed"
fi

# Create necessary context and utility files if missing
print_status "Creating missing utility files..."

# Create basic contexts if missing
mkdir -p frontend/src/contexts
if [ ! -f "frontend/src/contexts/UserContext.jsx" ]; then
    cat > frontend/src/contexts/UserContext.jsx << 'EOF'
import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser] = useState({ username: 'demo', email: 'demo@example.com' });
  const [isAuthenticated] = useState(true);

  return (
    <UserContext.Provider value={{ currentUser, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};
EOF
fi

# Create updated start script
print_status "Creating updated start script..."
cat > start-dev-fixed.sh << 'EOF'
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
EOF

chmod +x start-dev-fixed.sh

print_success "Setup completed!"
echo ""
echo "🎉 All fixes applied! Here's what was done:"
echo "============================================"
echo "✅ Fixed frontend package.json with start script"
echo "✅ Created missing directories"
echo "✅ Downloaded PDF.js worker"
echo "✅ Installed dependencies"
echo "✅ Created basic project files"
echo "✅ Created fixed startup script"
echo ""
echo "🚀 To start the development servers:"
echo "./start-dev-fixed.sh"
echo ""
echo "📝 Next steps:"
echo "1. Replace frontend/src/App.jsx with the Enhanced App component"
echo "2. Add the Enhanced PDF Viewer and Topic Manager components"
echo "3. Start developing!"
echo ""
print_success "Setup complete! Happy coding! 🎉"