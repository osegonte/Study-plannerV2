import React, { useState } from 'react';
import { StudySessionPDFViewer } from './components/pdf';
import { User, Settings, BarChart3 } from 'lucide-react';

function App() {
  const [currentTopic, setCurrentTopic] = useState('Quantum Physics');
  const [examDate, setExamDate] = useState('2025-08-15');
  const [studyData, setStudyData] = useState({
    totalTime: 0,
    currentPage: 1,
    readingSpeed: 0,
    estimatedTimeLeft: 0
  });

  // Handle time updates from PDF viewer
  const handleTimeUpdate = (totalSeconds, currentPage, topic) => {
    setStudyData(prev => ({
      ...prev,
      totalTime: totalSeconds,
      currentPage: currentPage
    }));
    console.log(`📚 Studied ${topic} for ${totalSeconds}s, on page ${currentPage}`);
  };

  // Handle progress updates with analytics
  const handleProgressUpdate = (progress) => {
    setStudyData(prev => ({
      ...prev,
      readingSpeed: progress.readingSpeed,
      estimatedTimeLeft: progress.estimatedTimeLeft
    }));
    console.log('📊 Reading analytics:', {
      speed: progress.readingSpeed + ' pages/min',
      timeLeft: Math.floor(progress.estimatedTimeLeft / 60) + ' minutes'
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                📚 PDF Study Planner
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <BarChart3 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                Demo User
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PDF Viewer - Main Area */}
          <div className="lg:col-span-3">
            <StudySessionPDFViewer
              currentTopic={currentTopic}
              examDate={examDate}
              onTimeUpdate={handleTimeUpdate}
              onProgressUpdate={handleProgressUpdate}
              className="w-full"
            />
          </div>

          {/* Sidebar - Study Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <h3 className="font-semibold text-gray-900 mb-3">📊 Study Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session Time:</span>
                  <span className="font-mono text-blue-600">
                    {formatTime(studyData.totalTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Page:</span>
                  <span className="font-mono text-green-600">{studyData.currentPage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reading Speed:</span>
                  <span className="font-mono text-purple-600">
                    {studyData.readingSpeed.toFixed(1)} p/min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Remaining:</span>
                  <span className="font-mono text-orange-600">
                    {Math.floor(studyData.estimatedTimeLeft / 60)}m
                  </span>
                </div>
              </div>
            </div>

            {/* Topic Settings */}
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <h3 className="font-semibold text-gray-900 mb-3">⚙️ Study Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Topic
                  </label>
                  <input
                    type="text"
                    value={currentTopic}
                    onChange={(e) => setCurrentTopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Study Tips */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Study Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Start the timer when you begin reading</li>
                <li>• Take breaks every 25-30 minutes</li>
                <li>• Navigate pages to track reading pace</li>
                <li>• Monitor your reading speed trends</li>
                <li>• Use zoom controls for comfortable reading</li>
              </ul>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
