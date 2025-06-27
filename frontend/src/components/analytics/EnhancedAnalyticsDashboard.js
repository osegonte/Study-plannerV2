import React, { useState } from 'react';
import { BarChart3, Clock, TrendingUp, Target, Calendar, BookOpen, Zap, Award, Globe } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import { 
  calculateTopicEstimates,
  calculateOverallProgress,
  calculateReadingVelocity,
  formatDuration
} from '../../utils/timeCalculations';
import TopicGoalManager from '../goals/TopicGoalManager';

const EnhancedAnalyticsDashboard = () => {
  const { topics, documents } = useStudyPlanner();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'week', 'month', 'all'
  const [topicGoals, setTopicGoals] = useState({}); // Store goals for each topic

  // Calculate overall progress
  const overallProgress = calculateOverallProgress(topics, documents);

  // Calculate topic-specific data
  const topicData = topics.map(topic => {
    const topicDocuments = documents.filter(doc => doc.topicId === topic.id);
    const estimates = calculateTopicEstimates(topicDocuments, topicGoals[topic.id]);
    
    return {
      ...topic,
      documents: topicDocuments,
      estimates
    };
  }).sort((a, b) => b.estimates.totalEstimatedTime - a.estimates.totalEstimatedTime);

  // Calculate reading velocity trends
  const allPageTimes = documents.reduce((acc, doc) => ({ ...acc, ...doc.pageTimes }), {});
  const velocityTrends = calculateReadingVelocity(allPageTimes);

  const handleUpdateTopicGoals = (topicId, goals) => {
    setTopicGoals(prev => ({
      ...prev,
      [topicId]: goals
    }));
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

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  if (selectedTopic) {
    const topic = topics.find(t => t.id === selectedTopic);
    const topicDocuments = documents.filter(doc => doc.topicId === selectedTopic);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedTopic(null)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Overview
            </button>
          </div>
        </div>
        
        <TopicGoalManager
          topic={topic}
          documents={topicDocuments}
          goals={topicGoals[selectedTopic]}
          onUpdateGoals={handleUpdateTopicGoals}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Study Analytics & Goals</h1>
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

      {/* Overall Progress Card */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Globe className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Overall Study Progress</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {formatDuration(overallProgress.totalEstimatedTime, 'goal')}
            </div>
            <div className="text-sm text-gray-600">Total Est. Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {formatDuration(overallProgress.totalTimeRemaining, 'goal')}
            </div>
            <div className="text-sm text-gray-600">Time Remaining</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {Math.round(overallProgress.overallProgress)}%
            </div>
            <div className="text-sm text-gray-600">Overall Progress</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {overallProgress.estimatedCompletionDate ? 
                overallProgress.estimatedCompletionDate.toLocaleDateString() : 'TBD'}
            </div>
            <div className="text-sm text-gray-600">Est. Completion</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress.overallProgress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress.overallProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Reading Velocity Trends */}
      {velocityTrends.trend !== 'insufficient-data' && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Reading Performance</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {velocityTrends.velocity.toFixed(1)} p/h
              </div>
              <div className="text-sm text-blue-700">Current Speed</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {getTrendIcon(velocityTrends.trend)} {Math.abs(velocityTrends.improvement)}%
              </div>
              <div className="text-sm text-green-700">
                {velocityTrends.trend === 'improving' ? 'Improvement' : 
                 velocityTrends.trend === 'declining' ? 'Decline' : 'Stable'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(overallProgress.totalPagesRead)}
              </div>
              <div className="text-sm text-purple-700">Pages Read</div>
            </div>
          </div>
        </div>
      )}

      {/* Topic Breakdown */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Topic Progress & Goals</h2>
        </div>

        {topicData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No topics yet. Create topics to see detailed analytics!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topicData.map((topic) => {
              const colorClasses = getColorClasses(topic.color);
              const estimates = topic.estimates;
              
              return (
                <div
                  key={topic.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${colorClasses}`}
                  onClick={() => setSelectedTopic(topic.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{topic.name}</h3>
                      <p className="text-sm opacity-80">
                        {estimates.totalDocuments} documents • {estimates.documentsCompleted} completed
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {Math.round(estimates.averageProgress)}%
                      </div>
                      <div className="text-sm opacity-80">Average Progress</div>
                    </div>
                  </div>

                  {/* Topic Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-white bg-opacity-50 rounded-full h-3">
                      <div
                        className="bg-white bg-opacity-80 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${estimates.averageProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Topic Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                    
                    <div>
                      <div className="font-medium">Est. Completion</div>
                      <div className="opacity-80">
                        {estimates.estimatedCompletionDate ? 
                          estimates.estimatedCompletionDate.toLocaleDateString() : 'TBD'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium">Daily Required</div>
                      <div className="opacity-80">
                        {estimates.dailyReadingRequired}m
                      </div>
                    </div>
                  </div>

                  {/* Goal Progress Indicators */}
                  {topicGoals[topic.id] && (
                    <div className="mt-3 pt-3 border-t border-opacity-30">
                      <div className="flex items-center space-x-4 text-sm">
                        {estimates.goalProgress.timeGoal && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>Time: {Math.round(estimates.goalProgress.timeGoal.percentage)}%</span>
                          </div>
                        )}
                        {estimates.goalProgress.pageGoal && (
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4" />
                            <span>Pages: {Math.round(estimates.goalProgress.pageGoal.percentage)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm text-center">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{overallProgress.totalDocuments}</div>
          <div className="text-sm text-gray-600">Total Documents</div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm text-center">
          <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{overallProgress.totalTopics}</div>
          <div className="text-sm text-gray-600">Study Topics</div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm text-center">
          <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {formatDuration(overallProgress.totalTimeSpent)}
          </div>
          <div className="text-sm text-gray-600">Time Studied</div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm text-center">
          <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {topicData.reduce((sum, topic) => sum + topic.estimates.documentsCompleted, 0)}
          </div>
          <div className="text-sm text-gray-600">Docs Completed</div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;