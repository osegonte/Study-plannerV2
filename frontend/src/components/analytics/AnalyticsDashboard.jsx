import React, { useState } from 'react';
import { BarChart3, Clock, TrendingUp, Target, Calendar, BookOpen, Zap, Award } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import { 
  calculateReadingSpeed, 
  formatDuration, 
  formatDetailedDuration 
} from '../../utils/timeCalculations';
import {
  getTotalStudyTime,
  getStudyStreak,
  getReadingGoalProgress,
  getTopicPerformance,
  getWeeklyStats,
  getProductivityScore
} from '../../utils/analyticsCalculations';

const AnalyticsDashboard = () => {
  const { topics, documents } = useStudyPlanner();
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week', 'month', 'all'

  // Calculate analytics data
  const totalStudyTime = getTotalStudyTime(documents);
  const studyStreak = getStudyStreak(documents);
  const weeklyStats = getWeeklyStats(documents, selectedPeriod);
  const topicPerformance = getTopicPerformance(documents, topics);
  const productivityScore = getProductivityScore(documents);

  const overallReadingSpeed = (() => {
    const allPageTimes = documents.reduce((acc, doc) => ({ ...acc, ...doc.pageTimes }), {});
    return calculateReadingSpeed(allPageTimes);
  })();

  const totalPages = documents.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
  const pagesRead = documents.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);

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
            Keep it up! 🔥
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
    </div>
  );
};

export default AnalyticsDashboard;
