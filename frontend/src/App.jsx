import React, { useState, useEffect } from 'react';
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
import PDFDiagnostic from './components/debug/PDFDiagnostic';
// Phase 1 New Imports - Folder Management
import ExamDateManager from './components/exams/ExamDateManager';
import FolderManager from './components/folders/FolderManager';

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
  Calendar,
  HardDrive,
  TrendingUp,
  User,
  LogOut,
  AlertCircle,
  Save,
  Database // Added for storage indicator
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
  const [storageStatus, setStorageStatus] = useState('initializing'); // Added storage status

  const {
    topics,
    documents,
    createTopic,
    updateTopic,
    deleteTopic,
    addDocumentToTopic,
    getTopicDocuments
  } = useStudyPlanner();

  // Enhanced persistent storage initialization
  useEffect(() => {
    const initializePersistentStorage = async () => {
      try {
        console.log('🗄️ Initializing persistent storage...');
        
        // Wait for storage manager to be available
        let attempts = 0;
        const maxAttempts = 20;
        
        const waitForStorage = () => {
          return new Promise((resolve) => {
            const checkStorage = () => {
              if (window.persistentStorage) {
                resolve(true);
              } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkStorage, 500);
              } else {
                resolve(false);
              }
            };
            checkStorage();
          });
        };

        const storageAvailable = await waitForStorage();
        
        if (storageAvailable) {
          await window.persistentStorage.initialize();
          setStorageStatus('connected');
          console.log('✅ Persistent storage initialized successfully');
          
          // Show success notification
          if (window.showNotification) {
            window.showNotification('💾 Persistent storage enabled - your data is safe!', 'success');
          }
          
          // Set up auto-backup notification
          setTimeout(() => {
            if (window.showNotification) {
              window.showNotification('📦 Auto-backup system active', 'info', 3000);
            }
          }, 2000);
          
        } else {
          setStorageStatus('unavailable');
          console.warn('⚠️ Persistent storage not available - using localStorage only');
          
          if (window.showNotification) {
            window.showNotification('⚠️ Using browser storage only - consider enabling persistent storage', 'warning');
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize persistent storage:', error);
        setStorageStatus('error');
        
        if (window.showNotification) {
          window.showNotification('❌ Storage initialization failed', 'error');
        }
      }
    };

    initializePersistentStorage();
  }, []);

  // Enhanced storage save function
  const saveWithPersistence = async (key, data) => {
    try {
      // Save to localStorage (existing behavior)
      localStorage.setItem(key, JSON.stringify(data));
      
      // Save to persistent storage if available
      if (window.persistentStorage && storageStatus === 'connected') {
        await window.persistentStorage.saveToFile(key.replace('pdf-study-planner-', ''), data);
        console.log(`💾 Saved ${key} to persistent storage`);
      }
    } catch (error) {
      console.error('Failed to save with persistence:', error);
    }
  };

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

  // Manual backup function
  const handleManualBackup = async () => {
    if (window.persistentStorage && storageStatus === 'connected') {
      try {
        await window.persistentStorage.backupAllData();
        if (window.showNotification) {
          window.showNotification('📦 Backup created successfully!', 'success');
        }
      } catch (error) {
        console.error('Backup failed:', error);
        if (window.showNotification) {
          window.showNotification('❌ Backup failed', 'error');
        }
      }
    }
  };

  // Storage status indicator
  const getStorageStatusIcon = () => {
    switch (storageStatus) {
      case 'connected':
        return <Database className="h-4 w-4 text-green-600" title="Persistent storage active" />;
      case 'unavailable':
        return <Database className="h-4 w-4 text-yellow-600" title="Browser storage only" />;
      case 'error':
        return <Database className="h-4 w-4 text-red-600" title="Storage error" />;
      default:
        return <Database className="h-4 w-4 text-gray-400" title="Initializing storage" />;
    }
  };

  // Phase 1: Enhanced dashboard with exam countdown
  const renderDashboard = () => {
    const upcomingExams = topics
      .filter(topic => topic.examDate)
      .map(topic => {
        const examDate = new Date(topic.examDate.examDate);
        const daysUntil = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
        return { ...topic, daysUntil, examDate };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    const urgentExams = upcomingExams.filter(exam => exam.daysUntil <= 7 && exam.daysUntil >= 0);

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

        {/* Storage Status Banner */}
        {storageStatus === 'connected' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-green-800 font-medium">✅ Persistent Storage Active</h3>
                <p className="text-green-700 text-sm">Your data is automatically saved and backed up every 5 minutes</p>
              </div>
              <button
                onClick={handleManualBackup}
                className="ml-auto px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                📦 Backup Now
              </button>
            </div>
          </div>
        )}

        {urgentExams.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-800">🚨 Urgent: Exams This Week!</h3>
            </div>
            <div className="space-y-2">
              {urgentExams.map(exam => (
                <div key={exam.id} className="text-sm text-red-700">
                  <strong>{exam.name}</strong> - {exam.daysUntil === 0 ? 'Today!' : `${exam.daysUntil} days left`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {userProfile?.displayName || currentUser?.username}! 📚
          </h2>
          <p className="text-blue-100">
            {upcomingExams.length > 0 
              ? `${upcomingExams.length} upcoming exams • Next: ${upcomingExams[0]?.name} in ${upcomingExams[0]?.daysUntil} days`
              : 'Ready to study? Set some exam dates to get personalized schedules!'
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <button
            onClick={() => setCurrentView('upload')}
            className="p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
          >
            <Upload className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload PDFs</h3>
            <p className="text-gray-600">Add study materials</p>
          </button>

          <button
            onClick={() => setCurrentView('topics')}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-center"
          >
            <FolderPlus className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Topics</h3>
            <p className="text-gray-600">Organize subjects</p>
          </button>

          <button
            onClick={() => setCurrentView('exams')}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-center"
          >
            <Calendar className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Exam Dates</h3>
            <p className="text-gray-600">Set exam schedules</p>
          </button>

          <button
            onClick={() => setCurrentView('folders')}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-center"
          >
            <HardDrive className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Folders</h3>
            <p className="text-gray-600">Organize files</p>
          </button>
        </div>

        {/* Recent Documents & Topics */}
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
                  const topicDocuments = documents.filter(doc => doc.topicId === topic.id);
                  const hasFolder = !!topic.folderPath;
                  
                  return (
                    <div
                      key={topic.id}
                      className="p-3 rounded-lg cursor-pointer hover:shadow-sm transition-shadow bg-blue-100 text-blue-800 border-blue-300"
                      onClick={() => setCurrentView('topics')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FolderPlus className="h-4 w-4" />
                          <div>
                            <h4 className="font-medium">{topic.name}</h4>
                            <p className="text-sm opacity-75">
                              {topicDocuments.length} documents
                              {hasFolder ? ' • 📁 Folder planned' : ' • ⏳ Folder pending'}
                            </p>
                          </div>
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

  // Updated navigation items with new Phase 1 features
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload PDFs', icon: Upload },
    { id: 'topics', label: 'Topics', icon: FolderPlus },
    { id: 'exams', label: 'Exam Dates', icon: Calendar },
    { id: 'folders', label: 'Folder Manager', icon: HardDrive },
    { id: 'debug', label: '🔧 Debug PDF', icon: AlertCircle },
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
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Phase 1 ✨
              </span>
              {/* Storage status indicator */}
              <div className="flex items-center space-x-1">
                {getStorageStatusIcon()}
                <span className="text-xs text-gray-500">
                  {storageStatus === 'connected' ? 'Persistent' : 
                   storageStatus === 'unavailable' ? 'Browser Only' : 
                   storageStatus === 'error' ? 'Error' : 'Loading...'}
                </span>
              </div>
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

              {/* Manual backup button */}
              {storageStatus === 'connected' && (
                <button
                  onClick={handleManualBackup}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  title="Create manual backup"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden md:block">Backup</span>
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
        {currentView === 'exams' && <ExamDateManager />}
        {currentView === 'folders' && <FolderManager />}
        {currentView === 'debug' && <PDFDiagnostic />}
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
