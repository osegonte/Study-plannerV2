// Complete App.jsx with User Authentication
// frontend/src/App.jsx

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
import { FileManager } from './utils/fileManager';
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
  Settings,
  LogOut,
  ChevronDown
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
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const {
    topics,
    documents,
    createTopic,
    updateTopic,
    deleteTopic,
    addDocumentToTopic,
    getTopicDocuments
  } = useStudyPlanner();

  const fileManager = currentUser ? new FileManager(currentUser.id) : null;

  // Handle user onboarding
  const handleOnboardingComplete = (userData) => {
    createAccount(userData);
  };

  // Handle PDF upload with enhanced metadata
  const handlePDFUpload = async (file, metadata) => {
    try {
      const documentData = addDocumentToTopic(metadata.topicId, file, 0);
      
      // Save enhanced metadata
      if (fileManager) {
        fileManager.saveUserData('file-metadata', {
          ...fileManager.loadUserData('file-metadata', {}),
          [documentData.id]: metadata
        });
      }

      console.log('PDF uploaded successfully:', documentData);
      return documentData;
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      throw error;
    }
  };

  const handleStartReading = (file, documentId, topicId) => {
    const topic = topics.find(t => t.id === topicId);
    
    setSelectedFile({
      file: file,
      documentId: documentId,
      topicId: topicId,
      name: file.name,
      size: file.size
    });
    setSelectedTopic(topic);
    setCurrentView('viewer');
  };

  const handleBackToMain = () => {
    setCurrentView('dashboard');
    setSelectedFile(null);
    setSelectedTopic(null);
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300',
      pink: 'bg-pink-100 text-pink-800 border-pink-300',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      red: 'bg-red-100 text-red-800 border-red-300'
    };
    return colorMap[color] || colorMap.blue;
  };

  // Calculate overall progress for dashboard
  const overallProgress = calculateOverallProgress(topics, documents);

  const renderDashboard = () => {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {userProfile?.displayName || currentUser?.username}! 📚
          </h2>
          <p className="text-blue-100">
            {userProfile?.school && `${userProfile.school} • `}
            {userProfile?.major || 'Ready to study?'}
          </p>
          
          {documents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatDuration(overallProgress.totalEstimatedTime, 'goal')}
                </div>
                <div className="text-sm opacity-90">Total Estimated Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatDuration(overallProgress.totalTimeRemaining, 'goal')}
                </div>
                <div className="text-sm opacity-90">Time Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(overallProgress.overallProgress)}%
                </div>
                <div className="text-sm opacity-90">Overall Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {overallProgress.totalDocuments}
                </div>
                <div className="text-sm opacity-90">Documents</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
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

        {/* Recent Activity & Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Documents */}
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
                  const totalReadingTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => {
                        // Create a mock file object for reading
                        const mockFile = new File([''], doc.name, { type: 'application/pdf' });
                        handleStartReading(mockFile, doc.id, doc.topicId);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-red-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.name}</h4>
                          <p className="text-sm text-gray-600">{topic?.name || 'Unknown Topic'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{Math.round(progress)}%</div>
                        <div className="text-xs text-gray-500">{formatDuration(totalReadingTime)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Topics Overview */}
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
                  const colorClasses = getColorClasses(topic.color);

                  return (
                    <div
                      key={topic.id}
                      className={`p-3 rounded-lg border-l-4 ${colorClasses} cursor-pointer hover:shadow-sm transition-shadow`}
                      onClick={() => setCurrentView('topics')}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{topic.name}</h4>
                          <p className="text-sm opacity-75">
                            {estimates.totalDocuments} documents • {Math.round(estimates.averageProgress)}% progress
                          </p>
                        </div>
                        {estimates.totalEstimatedTime > 0 && (
                          <div className="text-right text-sm">
                            <div>{formatDuration(estimates.timeRemaining, 'goal')} left</div>
                          </div>
                        )}
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

  const renderUploadView = () => (
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
  );

  const renderTopicsView = () => (
    <div className="space-y-6">
      <TopicManager
        topics={topics}
        onCreateTopic={createTopic}
        onUpdateTopic={updateTopic}
        onDeleteTopic={deleteTopic}
      />

      {topics.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Study Topics</h2>
          
          {topics.map((topic) => {
            const topicDocuments = getTopicDocuments(topic.id);
            const colorClasses = getColorClasses(topic.color);
            const estimates = calculateTopicEstimates(topicDocuments);

            return (
              <div key={topic.id} className={`border-2 rounded-lg ${colorClasses}`}>
                <div className="p-6 border-b border-opacity-30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FolderPlus className="h-6 w-6" />
                        <h3 className="text-xl font-bold">{topic.name}</h3>
                      </div>
                      {topic.description && (
                        <p className="opacity-80 mb-2">{topic.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <div className="font-medium">Documents</div>
                          <div className="opacity-80">{estimates.totalDocuments}</div>
                        </div>
                        <div>
                          <div className="font-medium">Progress</div>
                          <div className="opacity-80">{Math.round(estimates.averageProgress)}%</div>
                        </div>
                        {estimates.totalEstimatedTime > 0 && (
                          <>
                            <div>
                              <div className="font-medium">Est. Total Time</div>
                              <div className="opacity-80">
                                {formatDuration(estimates.totalEstimatedTime, 'goal')}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Time Remaining</div>
                              <div className="opacity-80">
                                {formatDuration(estimates.timeRemaining, 'goal')}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {estimates.averageProgress > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                            <div
                              className="bg-white bg-opacity-80 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${estimates.averageProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {topicDocuments.length === 0 ? (
                    <div className="text-center py-8 opacity-60">
                      <FileText className="h-12 w-12 mx-auto mb-3" />
                      <p>No PDFs yet. Upload documents to this topic!</p>
                      <button
                        onClick={() => setCurrentView('upload')}
                        className="mt-3 px-4 py-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg transition-colors"
                      >
                        Upload PDFs
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Documents:</h4>
                      {topicDocuments.map((document) => {
                        const progress = document.totalPages > 0 
                          ? (document.currentPage / document.totalPages) * 100 
                          : 0;
                        const totalReadingTime = Object.values(document.pageTimes || {})
                          .reduce((sum, time) => sum + time, 0);

                        return (
                          <div
                            key={document.id}
                            className="bg-white bg-opacity-70 border border-opacity-50 rounded-lg p-3 text-sm hover:bg-opacity-90 transition-colors cursor-pointer"
                            onClick={() => {
                              const mockFile = new File([''], document.name, { type: 'application/pdf' });
                              handleStartReading(mockFile, document.id, document.topicId);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 flex-1">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-gray-900 truncate">{document.name}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(document.lastReadAt).toLocaleDateString()}
                              </div>
                            </div>
                            
                            {document.totalPages > 0 && (
                              <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                                <span>Page {document.currentPage} of {document.totalPages}</span>
                                <span>{Math.round(progress)}% complete</span>
                              </div>
                            )}

                            {totalReadingTime > 0 && (
                              <div className="mt-1 text-xs text-gray-500">
                                Reading time: {formatDuration(totalReadingTime)}
                              </div>
                            )}

                            {progress > 0 && (
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                                <div
                                  className="bg-gray-600 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload PDFs', icon: Upload },
    { id: 'topics', label: 'Topics', icon: FolderPlus },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'insights', label: 'Insights', icon: Lightbulb }
  ];

  // Show onboarding if not authenticated
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
              <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Enhanced Academic Edition
              </span>
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

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:block">{userProfile?.displayName || currentUser?.username}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{userProfile?.displayName || currentUser?.username}</p>
                      <p className="text-sm text-gray-500">{currentUser?.email}</p>
                      {userProfile?.school && (
                        <p className="text-xs text-gray-500">{userProfile.school}</p>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentView('profile');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Profile Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats in Header */}
              {currentView !== 'viewer' && documents.length > 0 && (
                <div className="hidden lg:flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(overallProgress.totalTimeSpent)} studied</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{Math.round(overallProgress.overallProgress)}% overall progress</span>
                  </div>
                </div>
              )}
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
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'upload' && renderUploadView()}
        {currentView === 'topics' && renderTopicsView()}
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

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

// Main App Component
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