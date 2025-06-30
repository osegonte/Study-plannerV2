import React from 'react';
import { BarChart3, Clock, TrendingUp, BookOpen } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

const EnhancedAnalyticsDashboard = () => {
  const { topics, documents } = useStudyPlanner();

  const totalPages = documents.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
  const pagesRead = documents.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
  const totalTime = documents.reduce((sum, doc) => {
    return sum + Object.values(doc.pageTimes || {}).reduce((docSum, time) => docSum + time, 0);
  }, 0);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const avgReadingSpeed = totalTime > 0 && pagesRead > 0 ? (pagesRead * 3600) / totalTime : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Study Analytics</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Study Time</p>
              <p className="text-2xl font-bold text-blue-600">{formatTime(totalTime)}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pages Read</p>
              <p className="text-2xl font-bold text-green-600">{pagesRead}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            of {totalPages} total pages
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reading Speed</p>
              <p className="text-2xl font-bold text-purple-600">
                {avgReadingSpeed > 0 ? avgReadingSpeed.toFixed(1) : '0'} p/h
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0}%
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Study Summary */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Summary</h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Upload PDFs and start reading to see your analytics!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
                <div className="text-sm text-gray-600">Documents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{topics.length}</div>
                <div className="text-sm text-gray-600">Topics</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{pagesRead}</div>
                <div className="text-sm text-gray-600">Pages Read</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Completion</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity. Start reading to see your progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.slice(0, 5).map((doc) => {
              const topic = topics.find(t => t.id === doc.topicId);
              const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
              const pagesWithTime = Object.keys(doc.pageTimes || {}).length;
              
              return (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-sm text-gray-500">
                      {topic?.name || 'Unknown Topic'} • {pagesWithTime} pages read
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatTime(docTime)}</div>
                    <div className="text-xs text-gray-500">
                      {doc.lastReadAt ? new Date(doc.lastReadAt).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reading Estimates */}
      {pagesRead >= 2 && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Estimates</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-900">
                  {avgReadingSpeed.toFixed(1)} pages/hour
                </div>
                <div className="text-sm text-blue-700">Your Reading Speed</div>
              </div>
              
              <div>
                <div className="text-lg font-bold text-blue-900">
                  {formatTime((totalPages - pagesRead) * (totalTime / pagesRead))}
                </div>
                <div className="text-sm text-blue-700">Estimated Time Remaining</div>
              </div>
              
              <div>
                <div className="text-lg font-bold text-blue-900">
                  {Math.round(((totalPages - pagesRead) / avgReadingSpeed) * 24)} days
                </div>
                <div className="text-sm text-blue-700">Days to Complete (1h/day)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started */}
      {pagesRead === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Get Started with Analytics</h3>
          <p className="text-yellow-700 text-sm">
            Upload PDFs and start reading to unlock detailed analytics, reading speed calculations, 
            and time estimates. Your study patterns will help predict completion times and optimize your schedule.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedAnalyticsDashboard;
