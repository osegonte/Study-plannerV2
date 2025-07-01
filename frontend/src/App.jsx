import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { StudyPlannerProvider } from './contexts/StudyPlannerContext';
import { pdfjs } from 'react-pdf';
import UserOnboarding from './components/auth/UserOnboarding';
import EnhancedPDFUpload from './components/upload/EnhancedPDFUpload';
import PDFViewer from './components/pdf/PDFViewer';
import TopicManager from './components/topics/TopicManager';
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
  AlertCircle
} from 'lucide-react';
import './styles/globals.css';

// Clean worker configuration
const configureWorker = () => {
  const workerUrls = [
    '/pdf.worker.min.js',
    `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
  ];
  
  for (const url of workerUrls) {
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = url;
      break;
    } catch (error) {
      console.warn('Worker URL failed:', url);
    }
  }
};

configureWorker();

const AppContent = () => {
  const { currentUser, userProfile, isAuthenticated, createAccount, logout } = useUser();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [currentFileSession, setCurrentFileSession] = useState(new Map());

  const {
    topics,
    documents,
    createTopic,
    updateTopic,
    deleteTopic,
    addDocumentToTopic,
    getTopicDocuments,
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
      
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('File size must be less than 100MB');
      }

      const documentData = addDocumentToTopic(metadata.topicId, {
        name: file.name,
        size: file.size,
        topicId: metadata.topicId
      }, 0);

      setCurrentFileSession(prev => new Map(prev.set(documentData.id, file)));
      
      // Auto-navigate to viewer after upload
      handleStartReading(file, documentData.id, metadata.topicId);
      
      return documentData;
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      setUploadError(error.message);
      throw error;
    }
  };

  const handleStartReading = (file, documentId, topicId) => {
    try {
      setUploadError(null);
      
      let fileToUse = file;
      if (!fileToUse && currentFileSession.has(documentId)) {
        fileToUse = currentFileSession.get(documentId);
      }
      
      if (!fileToUse || !(fileToUse instanceof File)) {
        setUploadError('File is no longer available. Please upload the PDF again.');
        return;
      }

      setSelectedFile({
        file: fileToUse,
        documentId: documentId,
        topicId: topicId,
        name: fileToUse.name,
        size: fileToUse.size
      });
      setCurrentView('viewer');
    } catch (error) {
      console.error('Failed to start reading:', error);
      setUploadError('Failed to start reading the PDF. Please try again.');
    }
  };

  // Handle starting reading from topic management
  const handleStartReadingFromTopic = (document) => {
    // Check if we have the file in session
    if (currentFileSession.has(document.id)) {
      const file = currentFileSession.get(document.id);
      handleStartReading(file, document.id, document.topicId);
    } else {
      // File not in session, user needs to re-upload
      setUploadError('File needs to be re-uploaded. Please go to Upload section and re-upload this PDF.');
    }
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

            {/* Recent Activity */}
            {documents.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {documents.slice(0, 5).map((doc) => {
                    const topic = topics.find(t => t.id === doc.topicId);
                    const progress = doc.totalPages > 0 ? Math.round((doc.currentPage / doc.totalPages) * 100) : 0;
                    
                    return (
                      <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <div className="font-medium text-gray-900">{doc.name}</div>
                          <div className="text-sm text-gray-500">{topic?.name || 'Unknown Topic'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{progress}% complete</div>
                          <div className="text-xs text-gray-500">
                            Page {doc.currentPage} of {doc.totalPages}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
          <TopicManager
            topics={topics}
            documents={documents}
            onCreateTopic={createTopic}
            onUpdateTopic={updateTopic}
            onDeleteTopic={deleteTopic}
            onUploadPDF={handlePDFUpload}
            onStartReading={handleStartReadingFromTopic}
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
          <PDFViewer
            file={selectedFile.file}
            documentId={selectedFile.documentId}
            topicId={selectedFile.topicId}
            fileName={selectedFile.name}
            onBack={handleBackToMain}
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
