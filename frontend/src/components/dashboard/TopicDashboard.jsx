import React from 'react';
import { Folder, FileText, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { formatDuration, calculateReadingSpeed } from '../../utils/timeCalculations';

const TopicDashboard = ({ topics, documents, onSelectTopic, onSelectDocument }) => {
  const getTopicStats = (topicId) => {
    const topicDocs = documents.filter(doc => doc.topicId === topicId);
    const totalPages = topicDocs.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
    const totalReadingTime = topicDocs.reduce((sum, doc) => {
      const docTime = Object.values(doc.pageTimes || {}).reduce((t, time) => t + time, 0);
      return sum + docTime;
    }, 0);
    
    let avgReadingSpeed = 0;
    if (totalReadingTime > 0 && totalPages > 0) {
      const pagesWithTime = topicDocs.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
      if (pagesWithTime > 0) {
        avgReadingSpeed = calculateReadingSpeed(
          topicDocs.reduce((all, doc) => ({ ...all, ...doc.pageTimes }), {})
        );
      }
    }

    return {
      documentCount: topicDocs.length,
      totalPages,
      totalReadingTime,
      avgReadingSpeed,
      documents: topicDocs
    };
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

  if (topics.length === 0) {
    return (
      <div className="text-center py-12">
        <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">No Topics Yet</h2>
        <p className="text-gray-500">Create topics to organize your study materials</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Study Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => {
          const stats = getTopicStats(topic.id);
          const colorClasses = getColorClasses(topic.color);

          return (
            <div
              key={topic.id}
              className={`border-2 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all ${colorClasses}`}
              onClick={() => onSelectTopic(topic.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">{topic.name}</h3>
                </div>
              </div>

              {topic.description && (
                <p className="text-sm opacity-80 mb-4">{topic.description}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Documents</span>
                  </div>
                  <span className="font-semibold">{stats.documentCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Total Pages</span>
                  </div>
                  <span className="font-semibold">{stats.totalPages}</span>
                </div>

                {stats.totalReadingTime > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Reading Time</span>
                      </div>
                      <span className="font-semibold">{formatDuration(stats.totalReadingTime)}</span>
                    </div>

                    {stats.avgReadingSpeed > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm">Avg Speed</span>
                        </div>
                        <span className="font-semibold">{stats.avgReadingSpeed.toFixed(1)} p/h</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {stats.documents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-opacity-30">
                  <h4 className="text-sm font-medium mb-2">Recent Documents:</h4>
                  <div className="space-y-1">
                    {stats.documents.slice(0, 2).map((doc) => (
                      <div
                        key={doc.id}
                        className="text-xs opacity-75 truncate hover:opacity-100 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDocument(doc);
                        }}
                      >
                        📄 {doc.name}
                      </div>
                    ))}
                    {stats.documents.length > 2 && (
                      <div className="text-xs opacity-60">
                        +{stats.documents.length - 2} more documents
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicDashboard;
