import React from 'react';
import { BarChart3, Clock, TrendingUp, BookOpen, Target, Zap } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

const EnhancedAnalyticsDashboard = () => {
  const { topics, documents } = useStudyPlanner();

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDetailedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Calculate comprehensive statistics
  const stats = React.useMemo(() => {
    const totalPages = documents.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
    const pagesRead = documents.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
    const totalTime = documents.reduce((sum, doc) => {
      return sum + Object.values(doc.pageTimes || {}).reduce((docSum, time) => docSum + time, 0);
    }, 0);

    // Calculate reading speed (pages per hour)
    const avgReadingSpeed = totalTime > 0 && pagesRead > 0 ? (pagesRead * 3600) / totalTime : 0;

    // Calculate estimated time remaining across all documents
    const totalEstimatedRemaining = documents.reduce((sum, doc) => {
      const pageTimes = doc.pageTimes || {};
      const docPagesRead = Object.keys(pageTimes).length;
      
      if (docPagesRead === 0) return sum;
      
      const avgTimePerPage = Object.values(pageTimes).reduce((total, time) => total + time, 0) / docPagesRead;
      const pagesRemaining = Math.max((doc.totalPages || 0) - (doc.currentPage || 0), 0);
      
      return sum + (avgTimePerPage * pagesRemaining);
    }, 0);

    // Document completion stats
    const completedDocuments = documents.filter(doc => {
      const progress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
      return progress >= 100;
    }).length;

    const documentsInProgress = documents.filter(doc => {
      const progress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
      return progress > 0 && progress < 100;
    }).length;

    // Topic-specific stats
    const topicStats = topics.map(topic => {
      const topicDocs = documents.filter(doc => doc.topicId === topic.id);
      const topicTotalTime = topicDocs.reduce((sum, doc) => {
        return sum + Object.values(doc.pageTimes || {}).reduce((docSum, time) => docSum + time, 0);
      }, 0);
      
      const topicPagesRead = topicDocs.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
      const topicTotalPages = topicDocs.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
      
      return {
        ...topic,
        documentsCount: topicDocs.length,
        totalTime: topicTotalTime,
        pagesRead: topicPagesRead,
        totalPages: topicTotalPages,
        completionRate: topicTotalPages > 0 ? (topicPagesRead / topicTotalPages) * 100 : 0
      };
    }).sort((a, b) => b.totalTime - a.totalTime);

    return {
      totalPages,
      pagesRead,
      totalTime,
      avgReadingSpeed,
      totalEstimatedRemaining,
      completedDocuments,
      documentsInProgress,
      topicStats,
      overallProgress: totalPages > 0 ? (pagesRead / totalPages) * 100 : 0
    };
  }, [topics, documents]);

  const getTopicColorInfo = (colorName) => {
    const colorMap = {
      blue: '#3B82F6',
      green: '#10B981',
      purple: '#8B5CF6',
      orange: '#F59E0B',
      pink: '#EC4899',
      indigo: '#6366F1',
      yellow: '#EAB308',
      red: '#EF4444'
    };
    return colorMap[colorName] || colorMap.blue;
  };

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
              <p className="text-2xl font-bold text-blue-600">{formatTime(stats.totalTime)}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Across {documents.length} documents
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pages Read</p>
              <p className="text-2xl font-bold text-green-600">{stats.pagesRead}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            of {stats.totalPages} total pages
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reading Speed</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.avgReadingSpeed > 0 ? stats.avgReadingSpeed.toFixed(1) : '0'} p/h
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Pages per hour average
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Time Remaining</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatTime(stats.totalEstimatedRemaining)}
              </p>
            </div>
            <Target className="h-8 w-8 text-orange-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Estimated to finish all
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.completedDocuments}</div>
            <div className="text-sm text-gray-600">Completed Documents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.documentsInProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{documents.length - stats.completedDocuments - stats.documentsInProgress}</div>
            <div className="text-sm text-gray-600">Not Started</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Reading Progress</span>
            <span className="font-medium">{stats.overallProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(stats.overallProgress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Topic Performance */}
      {stats.topicStats.length > 0 && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Topic Performance</h3>
          
          <div className="space-y-4">
            {stats.topicStats.map((topic) => (
              <div key={topic.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getTopicColorInfo(topic.color) }}
                    ></div>
                    <h4 className="font-medium text-gray-900">{topic.name}</h4>
                  </div>
                  <div className="text-sm text-gray-500">
                    {topic.documentsCount} document{topic.documentsCount !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">{formatTime(topic.totalTime)}</div>
                    <div className="text-gray-600">Time Spent</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{topic.pagesRead}</div>
                    <div className="text-gray-600">Pages Read</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{topic.totalPages}</div>
                    <div className="text-gray-600">Total Pages</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{topic.completionRate.toFixed(1)}%</div>
                    <div className="text-gray-600">Complete</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(topic.completionRate, 100)}%`,
                        backgroundColor: getTopicColorInfo(topic.color)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Documents */}
      {documents.length > 0 && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Documents</h3>
          
          <div className="space-y-3">
            {documents
              .sort((a, b) => new Date(b.lastReadAt) - new Date(a.lastReadAt))
              .slice(0, 5)
              .map((doc) => {
                const topic = topics.find(t => t.id === doc.topicId);
                const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
                const progress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
                const pagesRead = Object.keys(doc.pageTimes || {}).length;
                
                return (
                  <div key={doc.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getTopicColorInfo(topic?.color || 'blue') }}
                      ></div>
                      <div>
                        <div className="font-medium text-gray-900">{doc.name}</div>
                        <div className="text-sm text-gray-500">
                          {topic?.name || 'Unknown Topic'} • {pagesRead} pages read
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{progress.toFixed(1)}% complete</div>
                      <div className="text-xs text-gray-500">
                        {formatDetailedTime(docTime)} • Last read {new Date(doc.lastReadAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {documents.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <Zap className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">Get Started with Analytics</h3>
          </div>
          <p className="text-yellow-700 text-sm mt-2">
            Upload PDFs and start reading to unlock detailed analytics, reading speed calculations, 
            and time estimates. Your study patterns will help predict completion times and optimize your schedule.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedAnalyticsDashboard;
