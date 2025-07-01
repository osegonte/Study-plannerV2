#!/bin/bash
# update-components.sh - Update components with enhanced versions

echo "🔄 Updating Components with Enhanced Versions"
echo "=============================================="

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

print_status "Updating App.jsx with working version..."

# Create a working App.jsx that imports the placeholder components correctly
cat > frontend/src/App.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { StudyPlannerProvider } from './contexts/StudyPlannerContext';
import { pdfjs } from 'react-pdf';
import UserOnboarding from './components/auth/UserOnboarding';
import EnhancedPDFUpload from './components/upload/EnhancedPDFUpload';
import EnhancedPDFViewer from './components/pdf/EnhancedPDFViewer';
import EnhancedTopicManager from './components/topics/EnhancedTopicManager';
import EnhancedAnalyticsDashboard from './components/analytics/EnhancedAnalyticsDashboard';
import { useStudyPlanner } from './contexts/StudyPlannerContext';
import { 
  FileText, 
  FolderPlus, 
  Upload, 
  ArrowLeft, 
  BarChart3, 
  Home,
  User,
  LogOut,
  AlertCircle,
  X,
  Play,
  Clock,
  BookOpen,
  CheckCircle
} from 'lucide-react';
import './styles/globals.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const AppContent = () => {
  const { currentUser, userProfile, isAuthenticated, createAccount, logout } = useUser();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const {
    topics,
    documents,
    createTopic,
    updateTopic,
    deleteTopic,
    addDocumentToTopic,
    updateDocumentProgress,
    updateDocumentPageTimes
  } = useStudyPlanner();

  const handleOnboardingComplete = (userData) => {
    createAccount(userData);
  };

  const handlePDFUpload = async (file, metadata) => {
    try {
      setUploadError(null);
      
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file object');
      }
      
      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are supported');
      }

      const documentData = addDocumentToTopic(metadata.topicId, {
        name: file.name,
        size: file.size,
        topicId: metadata.topicId
      });

      console.log(`✅ PDF uploaded: ${file.name}`);
      return documentData;
      
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      setUploadError(error.message);
      throw error;
    }
  };

  const handleStartReading = (documentId, topicId) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) {
      setUploadError('Document not found.');
      return;
    }

    setSelectedFile({
      documentId: documentId,
      topicId: topicId,
      name: document.name,
      startPage: 1
    });
    setCurrentView('viewer');
  };

  const handleBackToMain = () => {
    setCurrentView('dashboard');
    setSelectedFile(null);
    setUploadError(null);
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'topics', label: 'Topics', icon: FolderPlus },
    { id: 'upload', label: 'Upload PDFs', icon: Upload },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  if (!isAuthenticated) {
    return <UserOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PDF Study Planner</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentView === 'viewer' && (
                <button
                  onClick={handleBackToMain}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </button>
              )}

              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden md:block">{userProfile?.displayName || currentUser?.username}</span>
                <button
                  onClick={logout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {currentView !== 'viewer' && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex space-x-8 overflow-x-auto">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Global Error Display */}
        {uploadError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 text-sm">{uploadError}</p>
              </div>
              <button
                onClick={() => setUploadError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome back, {userProfile?.displayName || currentUser?.username}!
              </h2>
              <p className="text-gray-600">
                Track your reading progress and manage your study materials.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center">
                  <FolderPlus className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{topics.length}</div>
                    <div className="text-sm text-gray-600">Study Topics</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
                    <div className="text-sm text-gray-600">PDF Documents</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {documents.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Pages Read</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Get Started */}
            {topics.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Get Started</h3>
                <p className="text-blue-700 mb-4">
                  Create your first topic to organize your study materials.
                </p>
                <button
                  onClick={() => setCurrentView('topics')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Topic
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'topics' && (
          <EnhancedTopicManager
            topics={topics}
            documents={documents}
            onCreateTopic={createTopic}
            onUpdateTopic={updateTopic}
            onDeleteTopic={deleteTopic}
            onUploadPDF={handlePDFUpload}
            onStartReading={handleStartReading}
          />
        )}

        {currentView === 'upload' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Upload className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Upload Study Materials</h1>
            </div>
            
            <EnhancedPDFUpload
              topics={topics}
              onUpload={handlePDFUpload}
              onCreateTopic={() => setCurrentView('topics')}
            />
          </div>
        )}

        {currentView === 'analytics' && <EnhancedAnalyticsDashboard />}
        
        {currentView === 'viewer' && selectedFile && (
          <EnhancedPDFViewer
            documentId={selectedFile.documentId}
            topicId={selectedFile.topicId}
            fileName={selectedFile.name}
            startPage={selectedFile.startPage}
            onBack={handleBackToMain}
            onProgress={(page, totalPages) => {
              updateDocumentProgress(selectedFile.documentId, page, totalPages);
            }}
          />
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <StudyPlannerProvider>
        <AppContent />
      </StudyPlannerProvider>
    </UserProvider>
  );
}

export default App;
EOF

print_success "App.jsx updated with working imports"

print_status "Creating instructions file..."
cat > COMPONENT_REPLACEMENT_GUIDE.md << 'EOF'
# Component Replacement Guide

## 🎯 Current Status
Your app is now running with placeholder components. Follow these steps to get the full enhanced functionality:

## 📁 Files to Replace

### 1. Enhanced PDF Viewer
**File:** `frontend/src/components/pdf/EnhancedPDFViewer.jsx`
**Current:** Placeholder showing instructions
**Replace with:** Enhanced PDF Viewer artifact from Claude
**Features:** Resume reading, enhanced timer, progress tracking

### 2. Enhanced Topic Manager  
**File:** `frontend/src/components/topics/EnhancedTopicManager.jsx`
**Current:** Placeholder showing instructions
**Replace with:** Enhanced Topic Manager artifact from Claude
**Features:** Color circles, direct upload, expandable cards

### 3. Enhanced App Component (Optional - for full features)
**File:** `frontend/src/App.jsx`
**Current:** Working basic version
**Replace with:** Enhanced App artifact from Claude
**Features:** PDF storage system, resume functionality

## 🚀 How to Replace

1. Copy the content from the Enhanced PDF Viewer artifact
2. Paste it into `frontend/src/components/pdf/EnhancedPDFViewer.jsx`
3. Copy the content from the Enhanced Topic Manager artifact  
4. Paste it into `frontend/src/components/topics/EnhancedTopicManager.jsx`
5. Save the files and the app will hot-reload

## 🎉 What You'll Get

After replacing the components:
- ✅ Color circle topic selection
- ✅ Direct PDF upload from topics
- ✅ Resume reading from where you left off
- ✅ Enhanced time tracking and estimates
- ✅ Beautiful progress indicators
- ✅ Expandable topic cards

## 🔧 Current Working Features

Even with placeholders, you can:
- Create topics
- Upload PDFs (basic)
- View analytics
- Navigate between sections

Replace the components for the full enhanced experience!
EOF

print_success "Component replacement guide created"

echo ""
echo "🎉 App Updated Successfully!"
echo "==========================="
echo "✅ App.jsx updated with working imports"
echo "✅ All placeholder components are functional"
echo "✅ Created replacement guide"
echo ""
echo "🚀 Your app should now compile and run!"
echo ""
print_instruction "NEXT STEPS:"
echo "1. Check that the app is running at http://localhost:3000"
echo "2. You'll see placeholder messages in the PDF viewer and topic manager"
echo "3. Replace the placeholder components with enhanced versions:"
echo "   📁 frontend/src/components/pdf/EnhancedPDFViewer.jsx"
echo "   📁 frontend/src/components/topics/EnhancedTopicManager.jsx"
echo ""
echo "📖 See COMPONENT_REPLACEMENT_GUIDE.md for detailed instructions"
echo ""
print_success "Ready to enhance! 🎉"