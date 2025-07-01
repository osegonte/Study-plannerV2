import React, { useState } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { StudyPlannerProvider } from './contexts/StudyPlannerContext';
import UserOnboarding from './components/auth/UserOnboarding';
import EnhancedPDFUpload from './components/upload/EnhancedPDFUpload';
import EnhancedPDFViewer from './components/pdf/EnhancedPDFViewer';
import EnhancedTopicManager from './components/topics/EnhancedTopicManager';
import EnhancedAnalyticsDashboard from './components/analytics/EnhancedAnalyticsDashboard';
import { useStudyPlanner } from './contexts/StudyPlannerContext';
import { FileText, FolderPlus, Upload, BarChart3, Home, User, LogOut } from 'lucide-react';
import './styles/globals.css';

const AppContent = () => {
  const { currentUser, userProfile, isAuthenticated, createAccount, logout } = useUser();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    topics,
    documents,
    createTopic,
    updateTopic,
    deleteTopic,
    addDocumentToTopic
  } = useStudyPlanner();

  if (!isAuthenticated) {
    return <UserOnboarding onComplete={createAccount} />;
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'topics', label: 'Topics', icon: FolderPlus },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

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
            
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{userProfile?.displayName || currentUser?.username}</span>
              <button onClick={logout} className="p-2 text-gray-600 hover:text-red-600">
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
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 ${
                      isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
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
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">
                Welcome back, {userProfile?.displayName || currentUser?.username}!
              </h2>
              <p className="text-gray-600">Your PDF Study Planner is ready to use.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center">
                  <FolderPlus className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{topics.length}</div>
                    <div className="text-sm text-gray-600">Study Topics</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">{documents.length}</div>
                    <div className="text-sm text-gray-600">Documents</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-gray-600">Pages Read</div>
                  </div>
                </div>
              </div>
            </div>
            
            {topics.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Get Started</h3>
                <p className="text-blue-700 mb-4">Create your first topic to organize your study materials.</p>
                <button
                  onClick={() => setCurrentView('topics')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
          />
        )}

        {currentView === 'upload' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Upload Study Materials</h1>
            <EnhancedPDFUpload
              topics={topics}
              onCreateTopic={() => setCurrentView('topics')}
            />
          </div>
        )}

        {currentView === 'analytics' && <EnhancedAnalyticsDashboard />}
        
        {currentView === 'viewer' && selectedFile && (
          <EnhancedPDFViewer
            fileName={selectedFile.fileName}
            onBack={() => setCurrentView('dashboard')}
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
