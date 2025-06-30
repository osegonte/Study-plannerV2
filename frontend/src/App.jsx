import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { StudyPlannerProvider } from './contexts/StudyPlannerContext';
import { pdfjs } from 'react-pdf';
import TestPDF from './components/pdf/TestPDF'; // TEST COMPONENT
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
  Database,
  TestTube // Added for test component
} from 'lucide-react';
import { 
  calculateTopicEstimates, 
  calculateOverallProgress, 
  formatDuration 
} from './utils/timeCalculations';
import './styles/globals.css';

// 🔧 CRITICAL: Set worker BEFORE any PDF operations
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
console.log('🔧 Worker configured in App.jsx:', pdfjs.GlobalWorkerOptions.workerSrc);

const AppContent = () => {
  const { currentUser, userProfile, isAuthenticated, createAccount, logout } = useUser();
  const [currentView, setCurrentView] = useState('test'); // START WITH TEST VIEW
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [currentFileSession, setCurrentFileSession] = useState(new Map());
  const [storageStatus, setStorageStatus] = useState('initializing');

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

  // Updated navigation items with test component
  const navigationItems = [
    { id: 'test', label: '🧪 PDF Test', icon: TestTube }, // NEW TEST TAB
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload PDFs', icon: Upload },
    { id: 'topics', label: 'Topics', icon: FolderPlus },
    { id: 'debug', label: '🔧 Debug PDF', icon: AlertCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
              <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                DEBUG MODE 🔍
              </span>
              <div className="text-xs text-gray-500">
                Worker: {pdfjs.GlobalWorkerOptions.workerSrc}
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
        {currentView === 'test' && <TestPDF />}
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-2">
                Debug Mode Active 🔍
              </h2>
              <p className="text-blue-100">
                Use the PDF Test tab to verify basic functionality, then try uploading files.
              </p>
            </div>
          </div>
        )}
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
        {currentView === 'debug' && <PDFDiagnostic />}
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
