import React, { useState } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { StudyPlannerProvider } from './contexts/StudyPlannerContext';
import UserOnboarding from './components/auth/UserOnboarding';
import EnhancedPDFUpload from './components/upload/EnhancedPDFUpload';
import PDFViewer from './components/pdf/PDFViewer';
import TopicManager from './components/topics/TopicManager';
import EnhancedAnalyticsDashboard from './components/analytics/EnhancedAnalyticsDashboard';
import StudyGoals from './components/goals/StudyGoals';
import StudyReports from './components/reports/StudyReports';
import StudyInsights from './components/insights/StudyInsights';
import { useStudyPlanner } from './contexts/StudyPlannerContext';
import { 
  FileText, 
  FolderPlus, 
  Upload, 
  ArrowLeft, 
  BarChart3, 
  Target, 
  FileBarChart, 
  Lightbulb,
  Home,
  Clock,
  TrendingUp,
  User,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { 
  calculateTopicEstimates, 
  calculateOverallProgress, 
  formatDuration 
} from './utils/timeCalculations';
import './styles/globals.css';

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
    getTopicDocuments
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

  const handleBackToMain = () => {
    setCurrentView('dashboard');
    setSelectedFile(null);
    setUploadError(null);
  };

  const overallProgress = calculateOverallProgress(topics, documents);

  const renderDashboard = () => {
    return (
      <div className="space-y-8">
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Upload Error</h3>
                <p className="text-red-700 text-sm">{uploadError}</p>
              </div>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {documents.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="text-yellow-800 font-medium">Session-Based Storage</h3>
                <p className="text-yellow-700 text-sm">
                  PDF files are only available during your current session. You'll need to re-upload files after refreshing the page.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {userProfile?.displayName || currentUser?.username}! 📚
          </h2>
          <p className="text-blue-100">
            {userProfile?.school && `${userProfile.school} • `}
            Ready to study?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setCurrentView('upload')}
            className="p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
          >
            <Upload className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload New PDFs</h3>
            <p className="text-gray-600">Add textbooks, notes, and study materials</p>
          </button>

          <button
            onClick={() => setCurrentView('topics')}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-center"
          >
            <FolderPlus className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Topics</h3>
            <p className="text-gray-600">Organize courses and subjects</p>
          </button>

          <button
            onClick={() => setCurrentView('analytics')}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-center"
          >
            <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">View Analytics</h3>
            <p className="text-gray-600">Track reading progress and goals</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Documents</h3>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No documents yet. Upload your first PDF to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.slice(0, 5).map((doc) => {
                  const topic = topics.find(t => t.id === doc.topicId);
                  const progress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
                  const fileAvailable = currentFileSession.has(doc.id);

                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        fileAvailable 
                          ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer' 
                          : 'bg-red-50 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (fileAvailable) {
                          handleStartReading(null, doc.id, doc.topicId);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className={`h-8 w-8 ${fileAvailable ? 'text-red-600' : 'text-gray-400'}`} />
                        <div>
                          <h4 className={`font-medium ${fileAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                            {doc.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {topic?.name || 'Unknown Topic'}
                            {!fileAvailable && <span className="text-red-600 ml-2">(Re-upload needed)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{Math.round(progress)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Topics</h3>
            {topics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No topics yet. Create topics to organize your study materials!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topics.slice(0, 4).map((topic) => {
                  const topicDocuments = getTopicDocuments(topic.id);
                  const estimates = calculateTopicEstimates(topicDocuments);

                  return (
                    <div
                      key={topic.id}
                      className="p-3 rounded-lg cursor-pointer hover:shadow-sm transition-shadow bg-blue-100 text-blue-800 border-blue-300"
                      onClick={() => setCurrentView('topics')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{topic.name}</h4>
                          <p className="text-sm opacity-75">
                            {estimates.totalDocuments} documents • {Math.round(estimates.averageProgress)}% progress
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload PDFs', icon: Upload },
    { id: 'topics', label: 'Topics', icon: FolderPlus },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'insights', label: 'Insights', icon: Lightbulb }
  ];

  if (!isAuthenticated) {
    return <UserOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'upload' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Upload className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Upload Study Materials</h1>
            </div>
            
            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="text-red-800 font-medium">Upload Error</h3>
                    <p className="text-red-700 text-sm">{uploadError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <EnhancedPDFUpload
              topics={topics}
              onUpload={handlePDFUpload}
              onCreateTopic={() => setCurrentView('topics')}
            />
          </div>
        )}
        {currentView === 'topics' && (
          <TopicManager
            topics={topics}
            onCreateTopic={createTopic}
            onUpdateTopic={updateTopic}
            onDeleteTopic={deleteTopic}
          />
        )}
        {currentView === 'analytics' && <EnhancedAnalyticsDashboard />}
        {currentView === 'goals' && <StudyGoals />}
        {currentView === 'reports' && <StudyReports />}
        {currentView === 'insights' && <StudyInsights />}
        
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
