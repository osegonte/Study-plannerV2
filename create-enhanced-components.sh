#!/bin/bash
# create-enhanced-components.sh - Script to create the enhanced components

echo "📦 Creating Enhanced Components for PDF Study Planner"
echo "===================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_instruction() {
    echo -e "${YELLOW}[INSTRUCTION]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "frontend/src" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Create directories
print_status "Creating component directories..."
mkdir -p frontend/src/components/pdf
mkdir -p frontend/src/components/topics
mkdir -p frontend/src/components/upload
mkdir -p frontend/src/components/analytics
mkdir -p frontend/src/components/auth
mkdir -p frontend/src/contexts
mkdir -p frontend/src/hooks
mkdir -p frontend/src/utils

# Create placeholder for EnhancedPDFViewer
print_status "Creating EnhancedPDFViewer placeholder..."
cat > frontend/src/components/pdf/EnhancedPDFViewer.jsx << 'EOF'
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const EnhancedPDFViewer = ({ fileName, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Enhanced PDF Viewer</h2>
        <p className="text-gray-600 mb-4">
          Replace this file with the Enhanced PDF Viewer component from the artifacts.
        </p>
        <p className="text-sm text-gray-500 mb-4">File: {fileName}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;
EOF

# Create placeholder for EnhancedTopicManager
print_status "Creating EnhancedTopicManager placeholder..."
cat > frontend/src/components/topics/EnhancedTopicManager.jsx << 'EOF'
import React from 'react';
import { FolderPlus, AlertTriangle } from 'lucide-react';

const EnhancedTopicManager = ({ topics = [], onCreateTopic }) => {
  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="text-center py-8">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Enhanced Topic Manager</h2>
        <p className="text-gray-600 mb-4">
          Replace this file with the Enhanced Topic Manager component from the artifacts.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>Features to be added:</p>
          <ul className="list-disc list-inside">
            <li>Color circle selection</li>
            <li>Direct PDF upload from topics</li>
            <li>Expandable document lists</li>
            <li>Progress indicators</li>
          </ul>
        </div>
        {onCreateTopic && (
          <button
            onClick={() => onCreateTopic({ name: 'Sample Topic', color: 'blue', description: 'Test topic' })}
            className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Create Sample Topic</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedTopicManager;
EOF

# Create basic contexts
print_status "Creating basic contexts..."

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
  const [currentUser] = useState({ 
    id: 'demo-user',
    username: 'demo', 
    email: 'demo@example.com' 
  });
  const [userProfile] = useState({
    displayName: 'Demo User',
    school: 'Demo University'
  });
  const [isAuthenticated] = useState(true);

  const createAccount = () => console.log('Account created');
  const logout = () => console.log('Logged out');

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      userProfile, 
      isAuthenticated, 
      createAccount, 
      logout 
    }}>
      {children}
    </UserContext.Provider>
  );
};
EOF

cat > frontend/src/contexts/StudyPlannerContext.jsx << 'EOF'
import React, { createContext, useContext, useState } from 'react';

const StudyPlannerContext = createContext();

export const useStudyPlanner = () => {
  const context = useContext(StudyPlannerContext);
  if (!context) {
    throw new Error('useStudyPlanner must be used within a StudyPlannerProvider');
  }
  return context;
};

export const StudyPlannerProvider = ({ children }) => {
  const [topics, setTopics] = useState([]);
  const [documents, setDocuments] = useState([]);

  const createTopic = (topicData) => {
    const newTopic = {
      id: Date.now().toString(),
      ...topicData,
      createdAt: new Date().toISOString()
    };
    setTopics(prev => [...prev, newTopic]);
    return newTopic;
  };

  const updateTopic = (id, updates) => {
    setTopics(prev => prev.map(topic => 
      topic.id === id ? { ...topic, ...updates } : topic
    ));
  };

  const deleteTopic = (id) => {
    setTopics(prev => prev.filter(topic => topic.id !== id));
    setDocuments(prev => prev.filter(doc => doc.topicId !== id));
  };

  const addDocumentToTopic = (topicId, fileData) => {
    const newDoc = {
      id: Date.now().toString(),
      topicId,
      name: fileData.name,
      size: fileData.size,
      currentPage: 1,
      totalPages: 0,
      pageTimes: {},
      uploadedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString()
    };
    setDocuments(prev => [...prev, newDoc]);
    return newDoc;
  };

  const updateDocumentProgress = (docId, currentPage, totalPages) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId 
        ? { ...doc, currentPage, totalPages, lastReadAt: new Date().toISOString() }
        : doc
    ));
  };

  const updateDocumentPageTimes = (docId, pageTimes) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId 
        ? { ...doc, pageTimes, lastReadAt: new Date().toISOString() }
        : doc
    ));
  };

  const getDocumentById = (id) => documents.find(doc => doc.id === id);

  return (
    <StudyPlannerContext.Provider value={{
      topics,
      documents,
      createTopic,
      updateTopic,
      deleteTopic,
      addDocumentToTopic,
      updateDocumentProgress,
      updateDocumentPageTimes,
      getDocumentById
    }}>
      {children}
    </StudyPlannerContext.Provider>
  );
};
EOF

# Create basic hooks
print_status "Creating basic hooks..."

cat > frontend/src/hooks/useTimeTracking.js << 'EOF'
import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimeTracking = (initialPageTimes = {}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [pageTimes, setPageTimes] = useState(initialPageTimes);
  const [sessionData] = useState({
    totalTime: 0,
    pagesRead: 0,
    averageTimePerPage: 0,
    currentFileName: null
  });

  const intervalRef = useRef(null);

  const startPageTimer = useCallback((pageNumber, fileName) => {
    console.log('Starting timer for page', pageNumber);
    setIsTracking(true);
    setCurrentSessionTime(0);
  }, []);

  const stopPageTimer = useCallback(() => {
    console.log('Stopping timer');
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resetTimingData = useCallback(() => {
    setPageTimes({});
    setCurrentSessionTime(0);
    setIsTracking(false);
  }, []);

  const getTotalTime = useCallback(() => {
    return Object.values(pageTimes).reduce((sum, time) => sum + time, 0);
  }, [pageTimes]);

  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking]);

  return {
    isTracking,
    currentSessionTime,
    pageTimes,
    sessionData,
    startPageTimer,
    stopPageTimer,
    resetTimingData,
    getTotalTime
  };
};
EOF

# Create basic components
print_status "Creating basic upload component..."
mkdir -p frontend/src/components/upload
cat > frontend/src/components/upload/EnhancedPDFUpload.jsx << 'EOF'
import React, { useState } from 'react';
import { Upload, AlertTriangle } from 'lucide-react';

const EnhancedPDFUpload = ({ topics = [], onUpload, onCreateTopic }) => {
  const [selectedTopic, setSelectedTopic] = useState('');

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || !selectedTopic) return;

    for (const file of files) {
      if (file.type === 'application/pdf') {
        try {
          await onUpload(file, { topicId: selectedTopic });
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic PDF Upload</h3>
          <p className="text-gray-600 mb-4">
            Replace with Enhanced PDF Upload component for full functionality
          </p>
          
          {topics.length > 0 && (
            <div className="space-y-4 max-w-md mx-auto">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a topic...</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
              
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
          
          {topics.length === 0 && (
            <button
              onClick={onCreateTopic}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create a topic first
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFUpload;
EOF

print_status "Creating basic analytics component..."
mkdir -p frontend/src/components/analytics
cat > frontend/src/components/analytics/EnhancedAnalyticsDashboard.jsx << 'EOF'
import React from 'react';
import { BarChart3, AlertTriangle } from 'lucide-react';

const EnhancedAnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Study Analytics</h1>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
          <p className="text-gray-600">
            Replace with Enhanced Analytics Dashboard component for detailed statistics
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;
EOF

print_status "Creating basic auth component..."
mkdir -p frontend/src/components/auth
cat > frontend/src/components/auth/UserOnboarding.jsx << 'EOF'
import React, { useState } from 'react';
import { User, BookOpen } from 'lucide-react';

const UserOnboarding = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    username: 'demo',
    email: 'demo@example.com',
    displayName: 'Demo User'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(formData);
  };

  const handleQuickSetup = () => {
    onComplete({
      username: 'testuser',
      email: 'test@example.com',
      displayName: 'Test User',
      quickSetup: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome to PDF Study Planner!</h2>
          <p className="text-gray-600">Set up your study environment</p>
        </div>

        <div className="mb-4">
          <button
            onClick={handleQuickSetup}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🚀 Quick Demo Setup
          </button>
        </div>

        <div className="text-center text-gray-500 text-sm mb-4">— OR —</div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserOnboarding;
EOF

# Create CSS file
print_status "Creating basic CSS..."
mkdir -p frontend/src/styles
cat > frontend/src/styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.react-pdf__Document {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.react-pdf__Page {
  margin: 1rem 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
}

.react-pdf__Page__canvas {
  display: block;
  border-radius: 0.5rem;
  max-width: 100%;
  height: auto;
}
EOF

# Create Tailwind config
print_status "Creating Tailwind config..."
cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
EOF

print_success "All basic components created!"

echo ""
echo "📦 Components Created Successfully!"
echo "=================================="
echo "✅ EnhancedPDFViewer.jsx (placeholder)"
echo "✅ EnhancedTopicManager.jsx (placeholder)"
echo "✅ UserContext.jsx"
echo "✅ StudyPlannerContext.jsx"
echo "✅ useTimeTracking.js"
echo "✅ EnhancedPDFUpload.jsx (basic)"
echo "✅ EnhancedAnalyticsDashboard.jsx (basic)"
echo "✅ UserOnboarding.jsx"
echo "✅ globals.css"
echo "✅ tailwind.config.js"
echo ""

print_instruction "NEXT STEPS:"
echo "1. Replace the placeholder files with the enhanced versions from the artifacts:"
echo "   📁 frontend/src/components/pdf/EnhancedPDFViewer.jsx"
echo "   📁 frontend/src/components/topics/EnhancedTopicManager.jsx"
echo "   📁 frontend/src/App.jsx"
echo ""
echo "2. Start the development server:"
echo "   ./start-dev-fixed.sh"
echo ""
echo "🎯 The placeholders will show instructions when you run the app"
echo "Replace them with the enhanced components from the artifacts for full functionality!"

print_success "Component creation complete! 🎉"