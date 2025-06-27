import React, { useState } from 'react';
import { StudyPlannerProvider } from './contexts/StudyPlannerContext';
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
  TrendingUp
} from 'lucide-react';
import { 
  calculateTopicEstimates, 
  calculateOverallProgress, 
  formatDuration 
, getTopicReadingStats } from './utils/timeCalculations';
import './styles/globals.css';

const AppContent = () => {
  const [currentView, setCurrentView] = useState('topics');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const {
    topics,
    documents,
    createTopic,
    updateTopic,
    deleteTopic,
    addDocumentToTopic,
    getTopicDocuments
  } = useStudyPlanner();

  // Calculate overall progress for dashboard
  const overallProgress = calculateOverallProgress(topics, documents);

  const handleStartReading = (file, topicId) => {
    const topic = topics.find(t => t.id === topicId);
    const documentData = addDocumentToTopic(topicId, file, 0);
    
    setSelectedFile({
      file: file,
      documentId: documentData.id,
      topicId: topicId,
      name: file.name,
      size: file.size
    });
    setSelectedTopic(topic);
    setCurrentView('viewer');
  };

  const handleBackToMain = () => {
    setCurrentView('topics');
    setSelectedFile(null);
    setSelectedTopic(null);
  };

  const handleFileUpload = (event, topicId) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      handleStartReading(file, topicId);
    } else {
      alert('Please select a valid PDF file.');
    }
    event.target.value = '';
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

  const renderTopicsView = () => {
    return (
      <div className="space-y-8">
        {/* Overall Progress Summary */}
        {documents.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">📚 Your Study Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            
            {/* Overall Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress.overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

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
              
              // Calculate topic estimates
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
                        
                        {/* Topic Statistics */}
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

                        {/* Topic Progress Bar */}
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
                      
                      <div className="relative ml-4">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileUpload(e, topic.id)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id={`upload-${topic.id}`}
                        />
                        <label
                          htmlFor={`upload-${topic.id}`}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg cursor-pointer transition-colors shadow-sm"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Upload PDF</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {topicDocuments.length === 0 ? (
                      <div className="text-center py-8 opacity-60">
                        <FileText className="h-12 w-12 mx-auto mb-3" />
                        <p>No PDFs yet. Click "Upload PDF" to add your first document!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Recently Added:</h4>
                        {topicDocuments.slice(0, 3).map((document) => {
                          const progress = document.totalPages > 0 
                            ? (document.currentPage / document.totalPages) * 100 
                            : 0;
                          const totalReadingTime = Object.values(document.pageTimes || {})
                            .reduce((sum, time) => sum + time, 0);

                          return (
                            <div
                              key={document.id}
                              className="bg-white bg-opacity-70 border border-opacity-50 rounded-lg p-3 text-sm hover:bg-opacity-90 transition-colors"
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

                              {/* Mini progress bar */}
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
                        
                        {topicDocuments.length > 3 && (
                          <div className="text-xs text-gray-500 text-center pt-2">
                            +{topicDocuments.length - 3} more documents
                          </div>
                        )}
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
  };

  const navigationItems = [
    { id: 'topics', label: 'Study Hub', icon: Home },
    { id: 'analytics', label: 'Analytics & Goals', icon: BarChart3 },
    { id: 'goals', label: 'Personal Goals', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'insights', label: 'Insights', icon: Lightbulb }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PDF Study Planner</h1>
              <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Enhanced with Goal Tracking
              </span>
            </div>
            
            {currentView === 'viewer' && (
              <button
                onClick={handleBackToMain}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Study Hub</span>
              </button>
            )}

            {/* Quick Stats in Header */}
            {currentView !== 'viewer' && documents.length > 0 && (
              <div className="flex items-center space-x-6 text-sm text-gray-600">
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

      {currentView !== 'viewer' && (
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4">
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

      <div className="max-w-6xl mx-auto px-4 py-6">
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
    </div>
  );
};

function App() {
  return (
    <StudyPlannerProvider>
      <AppContent />
    </StudyPlannerProvider>
  );
}

export default App;