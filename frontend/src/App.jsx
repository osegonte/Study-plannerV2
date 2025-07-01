import React, { useState } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { StudyPlannerProvider } from './contexts/StudyPlannerContext';
import { useStudyPlanner } from './contexts/StudyPlannerContext';
import UserOnboarding from './components/auth/UserOnboarding';
import EnhancedPDFUpload from './components/upload/EnhancedPDFUpload';
import RealContentPDFViewer from './components/pdf/RealContentPDFViewer';
import EnhancedTopicManager from './components/topics/EnhancedTopicManager';
import EnhancedAnalyticsDashboard from './components/analytics/EnhancedAnalyticsDashboard';
import { FileText, FolderPlus, Upload, BarChart3, Home, User, LogOut } from 'lucide-react';
import './styles/globals.css';
import './utils/testData.js';

const AppContent = () => {
  // Safe destructuring with fallbacks
  const userContext = useUser();
  const { 
    currentUser = {}, 
    userProfile = {}, 
    isAuthenticated = false, 
    createAccount = () => {}, 
    logout = () => {} 
  } = userContext || {};

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDocument, setSelectedDocument] = useState(null);

  const {
    topics = [],
    documents = [],
    createTopic = () => {},
    updateTopic = () => {},
    deleteTopic = () => {}
  } = useStudyPlanner() || {};

  if (!isAuthenticated) {
    return <UserOnboarding onComplete={createAccount} />;
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'topics', label: 'Topics', icon: FolderPlus },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const handleStartReading = (document) => {
    if (document && document.id) {
      setSelectedDocument(document);
      setCurrentView('viewer');
    }
  };

  const handleBackFromViewer = () => {
    setCurrentView('dashboard');
    setSelectedDocument(null);
  };

  // Safe profile access with fallbacks
  const displayName = userProfile?.displayName || 
                      currentUser?.profile?.displayName || 
                      currentUser?.username || 
                      'Demo User';

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
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-gray-700">{displayName}</span>
              </div>
              <button 
                onClick={logout} 
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {currentView !== 'viewer' && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex space-x-8">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                      isActive 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {displayName}! 👋
              </h2>
              <p className="text-blue-100">Track your reading progress and stay organized with your study materials.</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <FolderPlus className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{topics.length}</div>
                    <div className="text-sm text-gray-600">Study Topics</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
                    <div className="text-sm text-gray-600">PDF Documents</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
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
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">🎯 Get Started</h3>
                  <p className="text-blue-700 mb-4">Create your first topic to organize your study materials.</p>
                  <button
                    onClick={() => setCurrentView('topics')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Topic
                  </button>
                </div>
              )}

              {topics.length > 0 && documents.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">📚 Upload PDFs</h3>
                  <p className="text-green-700 mb-4">Add your study materials to start tracking your progress.</p>
                  <button
                    onClick={() => setCurrentView('upload')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Upload Files
                  </button>
                </div>
              )}

              {documents.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">📊 View Analytics</h3>
                  <p className="text-purple-700 mb-4">Check your reading progress and statistics.</p>
                  <button
                    onClick={() => setCurrentView('analytics')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View Analytics
                  </button>
                </div>
              )}
            </div>

            {/* Recent Documents */}
            {documents.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📖 Recent Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.slice(0, 6).map((doc) => {
                    const topic = topics.find(t => t.id === doc.topicId);
                    const progress = doc.readingProgress?.percentage || 0;
                    
                    return (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleStartReading(doc)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <FileText className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
                          <div className="text-sm text-gray-500">
                            {Math.round(progress)}%
                          </div>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1 truncate">{doc.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{topic?.name || 'Unknown Topic'}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Test Data Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">🧪 Testing Tools</h3>
              <p className="text-yellow-700 mb-4">Use these tools to test the app functionality with sample data.</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (window.injectTestData) {
                      window.injectTestData();
                    } else {
                      console.log('Test data function not available');
                    }
                  }}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Load Test Data
                </button>
                <button
                  onClick={() => {
                    if (window.clearTestData) {
                      window.clearTestData();
                    } else {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'topics' && (
          <EnhancedTopicManager
            topics={topics}
            documents={documents}
            onCreateTopic={createTopic}
            onUpdateTopic={updateTopic}
            onDeleteTopic={deleteTopic}
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
              onCreateTopic={() => setCurrentView('topics')}
            />
          </div>
        )}

        {currentView === 'analytics' && <EnhancedAnalyticsDashboard />}
        
        {currentView === 'viewer' && selectedDocument && (
          <RealContentPDFViewer
            documentId={selectedDocument.id}
            fileName={selectedDocument.name}
            onBack={handleBackFromViewer}
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
