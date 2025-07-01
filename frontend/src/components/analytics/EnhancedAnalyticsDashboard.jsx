import React, { useState } from 'react';
import { BarChart3, Clock, TrendingUp, Target, Calendar, BookOpen, Zap, Award } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

const EnhancedAnalyticsDashboard = () => {
  const { topics, documents } = useStudyPlanner();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Calculate analytics data
  const totalStudyTime = documents.reduce((total, doc) => {
    const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
    return total + docTime;
  }, 0);

  const totalPages = documents.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
  const pagesRead = documents.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateReadingSpeed = () => {
    const allPageTimes = documents.reduce((acc, doc) => ({ ...acc, ...doc.pageTimes }), {});
    const totalTime = Object.values(allPageTimes).reduce((sum, time) => sum + time, 0);
    const pageCount = Object.keys(allPageTimes).length;
    
    if (totalTime === 0 || pageCount === 0) return 0;
    return (pageCount * 3600) / totalTime; // pages per hour
  };

  const overallReadingSpeed = calculateReadingSpeed();

  const getStudyStreak = () => {
    const today = new Date();
    const studyDates = new Set();
    
    documents.forEach(doc => {
      if (doc.lastReadAt) {
        const date = new Date(doc.lastReadAt).toDateString();
        studyDates.add(date);
      }
    });

    let streak = 0;
    let currentDate = new Date(today);
    
    while (streak < 365) { // Safety limit
      const dateString = currentDate.toDateString();
      if (studyDates.has(dateString)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (streak === 0 && dateString === today.toDateString()) {
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const studyStreak = getStudyStreak();

  const getProductivityScore = () => {
    if (documents.length === 0) return 0;
    
    const consistencyScore = Math.min((studyStreak / 7) * 40, 40);
    const speedScore = Math.min((overallReadingSpeed / 100) * 30, 30);
    const completionRate = totalPages > 0 ? (pagesRead / totalPages) : 0;
    const completionScore = completionRate * 30;
    
    return Math.round(consistencyScore + speedScore + completionScore);
  };

  const productivityScore = getProductivityScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Study Analytics</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Study Time</p>
              <p className="text-2xl font-bold text-blue-600">{formatDuration(totalStudyTime)}</p>
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
              <p className="text-sm text-gray-600">Study Streak</p>
              <p className="text-2xl font-bold text-green-600">{studyStreak} days</p>
            </div>
            <Zap className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {studyStreak > 0 ? 'Keep it up! 🔥' : 'Start your streak today!'}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reading Speed</p>
              <p className="text-2xl font-bold text-purple-600">{overallReadingSpeed.toFixed(1)} p/h</p>
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
              <p className="text-sm text-gray-600">Productivity Score</p>
              <p className="text-2xl font-bold text-orange-600">{productivityScore}/100</p>
            </div>
            <Award className="h-8 w-8 text-orange-600" />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Based on consistency & speed
          </div>
        </div>
      </div>

      {/* Study Summary */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Summary</h3>
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

      {/* Recent Activity */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Start studying to see your activity here!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.slice(0, 5).map((doc) => {
              const topic = topics.find(t => t.id === doc.topicId);
              const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
              
              return (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-sm text-gray-500">{topic?.name || 'Unknown Topic'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatDuration(docTime)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(doc.lastReadAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Study Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Study Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Consistent Daily Study</p>
              <p className="text-gray-600">Study a little every day rather than cramming.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Track Your Progress</p>
              <p className="text-gray-600">Use the timer to identify your peak reading hours.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Set Realistic Goals</p>
              <p className="text-gray-600">Break large documents into manageable daily goals.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-semibold">4</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Take Regular Breaks</p>
              <p className="text-gray-600">Use the timer to schedule short breaks every hour.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;
