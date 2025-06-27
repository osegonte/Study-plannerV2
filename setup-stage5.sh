#!/bin/bash

# PDF Study Planner - Stage 5: Dashboard & Analytics Setup Script
echo "🚀 Setting up PDF Study Planner - Stage 5: Dashboard & Analytics"

# Create new components directory structure
echo "📁 Creating component directories..."
mkdir -p frontend/src/components/analytics
mkdir -p frontend/src/components/goals
mkdir -p frontend/src/components/reports
mkdir -p frontend/src/components/insights
mkdir -p frontend/src/hooks
mkdir -p frontend/src/utils

# Create Analytics Dashboard Component
echo "📝 Creating AnalyticsDashboard.jsx..."
cat > frontend/src/components/analytics/AnalyticsDashboard.jsx << 'EOF'
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
EOF

# Create Study Goals Component
echo "📝 Creating StudyGoals.jsx..."
cat > frontend/src/components/goals/StudyGoals.jsx << 'EOF'
import React, { useState } from 'react';
import { Target, Plus, Edit3, Trash2, CheckCircle, Clock, BookOpen, TrendingUp } from 'lucide-react';
import { useStudyGoals } from '../../hooks/useStudyGoals';
import { formatDuration } from '../../utils/timeCalculations';

const GOAL_TYPES = {
  DAILY_TIME: 'daily_time',
  WEEKLY_TIME: 'weekly_time',
  PAGES_PER_DAY: 'pages_per_day',
  COMPLETE_DOCUMENT: 'complete_document',
  READING_SPEED: 'reading_speed'
};

const StudyGoals = () => {
  const {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalProgress
  } = useStudyGoals();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: GOAL_TYPES.DAILY_TIME,
    target: '',
    description: '',
    deadline: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.target) return;

    const goalData = {
      ...formData,
      target: parseFloat(formData.target),
      deadline: formData.deadline || null
    };

    if (editingId) {
      updateGoal(editingId, goalData);
      setEditingId(null);
    } else {
      createGoal(goalData);
      setIsCreating(false);
    }
    
    setFormData({
      title: '',
      type: GOAL_TYPES.DAILY_TIME,
      target: '',
      description: '',
      deadline: ''
    });
  };

  const startEdit = (goal) => {
    setFormData({
      title: goal.title,
      type: goal.type,
      target: goal.target.toString(),
      description: goal.description || '',
      deadline: goal.deadline || ''
    });
    setEditingId(goal.id);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      title: '',
      type: GOAL_TYPES.DAILY_TIME,
      target: '',
      description: '',
      deadline: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Target className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Study Goals</h1>
        </div>
        
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Goal</span>
          </button>
        )}
      </div>

      {(isCreating || editingId) && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Goal' : 'Create New Goal'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Read 30 minutes daily"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={GOAL_TYPES.DAILY_TIME}>Daily Study Time (minutes)</option>
                  <option value={GOAL_TYPES.WEEKLY_TIME}>Weekly Study Time (minutes)</option>
                  <option value={GOAL_TYPES.PAGES_PER_DAY}>Pages Per Day</option>
                  <option value={GOAL_TYPES.READING_SPEED}>Reading Speed (pages/hour)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Value *
              </label>
              <input
                type="number"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  formData.type.includes('time') ? 'Minutes' :
                  formData.type === GOAL_TYPES.PAGES_PER_DAY ? 'Pages' :
                  'Pages per hour'
                }
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{editingId ? 'Update Goal' : 'Create Goal'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {goals.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Goals Yet</h3>
            <p className="text-gray-500 mb-4">Set study goals to track your progress!</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create First Goal</span>
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = getGoalProgress(goal);
            const isCompleted = progress.percentage >= 100;
            
            return (
              <div
                key={goal.id}
                className={`border-2 rounded-lg p-6 ${
                  isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                    <p className="text-sm text-gray-600">{goal.type.replace('_', ' ')}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEdit(goal)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-gray-900'}`}>
                      {progress.current} / {progress.target}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    {Math.round(progress.percentage)}% complete
                  </div>
                </div>

                {isCompleted && (
                  <div className="mt-4 flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Goal Completed! 🎉</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudyGoals;
EOF

# Create Study Reports Component
echo "📝 Creating StudyReports.jsx..."
cat > frontend/src/components/reports/StudyReports.jsx << 'EOF'
import React, { useState } from 'react';
import { FileText, Download, BarChart3, Clock, BookOpen, TrendingUp } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import { formatDuration, calculateReadingSpeed } from '../../utils/timeCalculations';

const StudyReports = () => {
  const { topics, documents } = useStudyPlanner();
  const [selectedReport, setSelectedReport] = useState('summary');
  const [dateRange, setDateRange] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const getFilteredDocuments = () => {
    let filtered = documents;

    if (selectedTopic !== 'all') {
      filtered = filtered.filter(doc => doc.topicId === selectedTopic);
    }

    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(doc => new Date(doc.lastReadAt) >= cutoffDate);
    }

    return filtered;
  };

  const handleExport = () => {
    const filteredDocs = getFilteredDocuments();
    let csvContent = 'Document Name,Topic,Progress (%),Study Time (seconds),Last Read\n';
    
    filteredDocs.forEach(doc => {
      const topic = topics.find(t => t.id === doc.topicId);
      const progress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
      const totalTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
      
      csvContent += `"${doc.name}","${topic?.name || 'Unknown'}",${progress.toFixed(1)},${totalTime},"${doc.lastReadAt}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `study-report-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSummaryReport = () => {
    const filteredDocs = getFilteredDocuments();
    const totalTime = filteredDocs.reduce((sum, doc) => 
      sum + Object.values(doc.pageTimes || {}).reduce((t, time) => t + time, 0), 0
    );
    const totalPages = filteredDocs.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
    const pagesRead = filteredDocs.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
    
    const allPageTimes = filteredDocs.reduce((acc, doc) => ({ ...acc, ...doc.pageTimes }), {});
    const avgReadingSpeed = calculateReadingSpeed(allPageTimes);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Total Study Time</h3>
                <p className="text-2xl font-bold text-blue-600">{formatDuration(totalTime)}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Pages Read</h3>
                <p className="text-2xl font-bold text-green-600">{pagesRead}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-purple-900">Avg Speed</h3>
                <p className="text-2xl font-bold text-purple-600">{avgReadingSpeed.toFixed(1)} p/h</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Document</th>
                  <th className="text-left py-2">Topic</th>
                  <th className="text-left py-2">Progress</th>
                  <th className="text-left py-2">Study Time</th>
                  <th className="text-left py-2">Last Read</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const topic = topics.find(t => t.id === doc.topicId);
                  const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
                  const progress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
                  
                  return (
                    <tr key={doc.id} className="border-b">
                      <td className="py-2 font-medium">{doc.name}</td>
                      <td className="py-2">{topic?.name || 'Unknown'}</td>
                      <td className="py-2">{Math.round(progress)}%</td>
                      <td className="py-2">{formatDuration(docTime)}</td>
                      <td className="py-2">{new Date(doc.lastReadAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Study Reports</h1>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Topics</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {renderSummaryReport()}
    </div>
  );
};

export default StudyReports;
EOF

# Create remaining utility files
echo "📝 Creating utility files..."

# useStudyGoals hook
cat > frontend/src/hooks/useStudyGoals.js << 'EOF'
import { useState, useEffect } from 'react';
import { useStudyPlanner } from '../contexts/StudyPlannerContext';

const STORAGE_KEY = 'pdf-study-planner-goals';

export const useStudyGoals = () => {
  const [goals, setGoals] = useState([]);
  const { documents } = useStudyPlanner();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setGoals(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load goals from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Failed to save goals to localStorage:', error);
    }
  }, [goals]);

  const createGoal = (goalData) => {
    const newGoal = {
      id: Date.now().toString(),
      title: goalData.title.trim(),
      type: goalData.type,
      target: goalData.target,
      description: goalData.description?.trim() || '',
      deadline: goalData.deadline || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false
    };

    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  };

  const updateGoal = (goalId, updates) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
        : goal
    ));
  };

  const deleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    }
  };

  const getGoalProgress = (goal) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let current = 0;
    let target = goal.target;

    switch (goal.type) {
      case 'daily_time':
        current = documents.reduce((sum, doc) => {
          const todayTimes = Object.entries(doc.pageTimes || {}).filter(([page, time]) => {
            return new Date(doc.lastReadAt) >= startOfDay;
          });
          return sum + todayTimes.reduce((pageSum, [, time]) => pageSum + time, 0);
        }, 0) / 60;
        break;

      case 'weekly_time':
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        current = documents.reduce((sum, doc) => {
          const weekTimes = Object.entries(doc.pageTimes || {}).filter(([page, time]) => {
            return new Date(doc.lastReadAt) >= startOfWeek;
          });
          return sum + weekTimes.reduce((pageSum, [, time]) => pageSum + time, 0);
        }, 0) / 60;
        break;

      case 'pages_per_day':
        current = documents.reduce((sum, doc) => {
          if (new Date(doc.lastReadAt) >= startOfDay) {
            return sum + Object.keys(doc.pageTimes || {}).length;
          }
          return sum;
        }, 0);
        break;

      case 'reading_speed':
        const allPageTimes = documents.reduce((acc, doc) => ({ ...acc, ...doc.pageTimes }), {});
        const totalTime = Object.values(allPageTimes).reduce((sum, time) => sum + time, 0);
        current = totalTime > 0 ? (Object.keys(allPageTimes).length * 3600) / totalTime : 0;
        break;

      default:
        current = 0;
    }

    const percentage = target > 0 ? (current / target) * 100 : 0;

    return {
      current: Math.round(current * 10) / 10,
      target: target,
      percentage: Math.min(percentage, 100)
    };
  };

  return {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalProgress
  };
};
EOF

# Analytics calculations utility
cat > frontend/src/utils/analyticsCalculations.js << 'EOF'
export const getTotalStudyTime = (documents) => {
  return documents.reduce((total, doc) => {
    const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
    return total + docTime;
  }, 0);
};

export const getStudyStreak = (documents) => {
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
  
  while (true) {
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

export const getWeeklyStats = (documents, period = 'week') => {
  const today = new Date();
  const daysToShow = period === 'week' ? 7 : period === 'month' ? 30 : 7;
  
  const stats = [];
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toDateString();
    
    let dayMinutes = 0;
    documents.forEach(doc => {
      if (doc.lastReadAt && new Date(doc.lastReadAt).toDateString() === dateString) {
        const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
        dayMinutes += Math.floor(docTime / 60);
      }
    });
    
    stats.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dateString,
      minutes: dayMinutes
    });
  }
  
  return stats;
};

export const getTopicPerformance = (documents, topics) => {
  const topicStats = topics.map(topic => {
    const topicDocs = documents.filter(doc => doc.topicId === topic.id);
    
    const totalTime = topicDocs.reduce((sum, doc) => {
      return sum + Object.values(doc.pageTimes || {}).reduce((docSum, time) => docSum + time, 0);
    }, 0);
    
    const totalPages = topicDocs.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
    const pagesRead = topicDocs.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
    
    const completionRate = totalPages > 0 ? (pagesRead / totalPages) * 100 : 0;
    
    return {
      id: topic.id,
      name: topic.name,
      color: topic.color,
      documentsCount: topicDocs.length,
      totalTime,
      totalPages,
      pagesRead,
      completionRate
    };
  });
  
  return topicStats.sort((a, b) => b.totalTime - a.totalTime);
};

export const getProductivityScore = (documents) => {
  if (documents.length === 0) return 0;
  
  const streak = getStudyStreak(documents);
  const consistencyScore = Math.min((streak / 7) * 40, 40);
  
  const allPageTimes = documents.reduce((acc, doc) => ({ ...acc, ...doc.pageTimes }), {});
  const avgSpeed = Object.keys(allPageTimes).length > 0 
    ? (Object.keys(allPageTimes).length * 3600) / Object.values(allPageTimes).reduce((sum, time) => sum + time, 0)
    : 0;
  const speedScore = Math.min((avgSpeed / 100) * 30, 30);
  
  const totalPages = documents.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
  const pagesRead = documents.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
  const completionRate = totalPages > 0 ? (pagesRead / totalPages) : 0;
  const completionScore = completionRate * 30;
  
  return Math.round(consistencyScore + speedScore + completionScore);
};

export const getReadingGoalProgress = (documents, goalType, targetValue) => {
  return {
    current: 0,
    target: targetValue,
    percentage: 0
  };
};
EOF

# Study Insights component
cat > frontend/src/components/insights/StudyInsights.jsx << 'EOF'
import React from 'react';
import { Lightbulb, TrendingUp, Target, Zap, BookOpen, Clock, Award } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import { getTotalStudyTime, getStudyStreak, getProductivityScore } from '../../utils/analyticsCalculations';
import { formatDuration, calculateReadingSpeed } from '../../utils/timeCalculations';

const StudyInsights = () => {
  const { documents, topics } = useStudyPlanner();
  
  const totalStudyTime = getTotalStudyTime(documents);
  const studyStreak = getStudyStreak(documents);
  const productivityScore = getProductivityScore(documents);
  
  const allPageTimes = documents.reduce((acc, doc) => ({ ...acc, ...doc.pageTimes }), {});
  const overallReadingSpeed = calculateReadingSpeed(allPageTimes);

  const insights = [];

  if (studyStreak >= 3) {
    insights.push({
      type: 'consistency',
      title: 'Great Consistency!',
      description: `${studyStreak} day study streak! Keep up the excellent habit.`,
      icon: 'calendar',
      color: 'green'
    });
  }

  if (overallReadingSpeed > 50) {
    insights.push({
      type: 'reading_speed',
      title: 'Excellent Reading Speed!',
      description: `You're reading at ${overallReadingSpeed.toFixed(1)} pages per hour - above average!`,
      icon: 'zap',
      color: 'blue'
    });
  }

  if (totalStudyTime > 3600) {
    insights.push({
      type: 'dedication',
      title: 'Dedicated Learner',
      description: `You've studied for ${formatDuration(totalStudyTime)}! Your commitment shows.`,
      icon: 'award',
      color: 'purple'
    });
  }

  const getInsightIcon = (iconType) => {
    const icons = {
      'calendar': Clock,
      'zap': Zap,
      'award': Award,
      'book': BookOpen
    };
    return icons[iconType] || Lightbulb;
  };

  const getInsightColor = (color) => {
    const colors = {
      green: 'bg-green-50 border-green-200 text-green-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Lightbulb className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Study Insights</h1>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Study Insights</h3>
        
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Study more to unlock personalized insights!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight, index) => {
              const IconComponent = getInsightIcon(insight.icon);
              const colorClasses = getInsightColor(insight.color);
              
              return (
                <div key={index} className={`border rounded-lg p-4 ${colorClasses}`}>
                  <div className="flex items-start space-x-3">
                    <IconComponent className="h-6 w-6 mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm">{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Tips</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">📚 Active Reading</h4>
            <p className="text-sm text-gray-600">
              Take notes while reading to improve comprehension and retention.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">⏰ Time Management</h4>
            <p className="text-sm text-gray-600">
              Use the timer to identify your most productive reading hours.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">🎯 Goal Setting</h4>
            <p className="text-sm text-gray-600">
              Set specific daily goals like "read 10 pages" for better motivation.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">🔄 Regular Review</h4>
            <p className="text-sm text-gray-600">
              Review previous material weekly to improve long-term retention.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">{documents.length}</div>
          <div className="text-sm text-gray-600">Documents Added</div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">{topics.length}</div>
          <div className="text-sm text-gray-600">Study Topics</div>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {documents.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0)}
          </div>
          <div className="text-sm text-gray-600">Pages Read</div>
        </div>
      </div>
    </div>
  );
};

export default StudyInsights;
EOF

# Updated App.jsx with Stage 5 navigation
cat > frontend/src/App.jsx << 'EOF'
import React, { useState } from 'react';
import { StudyPlannerProvider } from './contexts/StudyPlannerContext';
import PDFViewer from './components/pdf/PDFViewer';
import TopicManager from './components/topics/TopicManager';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
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
  Home
} from 'lucide-react';
import './styles/globals.css';

const AppContent = () => {
  const [currentView, setCurrentView] = useState('topics'); // 'topics' | 'viewer' | 'analytics' | 'goals' | 'reports' | 'insights'
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

              return (
                <div key={topic.id} className={`border-2 rounded-lg ${colorClasses}`}>
                  <div className="p-6 border-b border-opacity-30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <FolderPlus className="h-6 w-6" />
                          <h3 className="text-xl font-bold">{topic.name}</h3>
                        </div>
                        {topic.description && (
                          <p className="opacity-80 mb-2">{topic.description}</p>
                        )}
                        <div className="text-sm opacity-70">
                          {topicDocuments.length} PDF{topicDocuments.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="relative">
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
                              className="bg-white bg-opacity-70 border border-opacity-50 rounded-lg p-3 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
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
                                  Reading time: {Math.floor(totalReadingTime / 60)}m {totalReadingTime % 60}s
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
    { id: 'topics', label: 'Study Topics', icon: Home },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
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
                Stage 5 - Complete Analytics
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
        {currentView === 'analytics' && <AnalyticsDashboard />}
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
EOF

echo ""
echo "✅ Stage 5: Dashboard & Analytics setup complete!"
echo ""
echo "🎯 New Stage 5 Features:"
echo "   📊 Comprehensive analytics dashboard"
echo "   🎯 Smart goal setting and tracking"
echo "   📋 Detailed reports with CSV export"
echo "   💡 Personalized study insights"
echo "   🏆 Achievement tracking system"
echo ""
echo "🚀 To run your complete PDF Study Planner:"
echo "   cd frontend && npm start"
echo ""
echo "🎉 CONGRATULATIONS! All 5 stages complete:"
echo "   ✅ Stage 1: PDF Viewer Core"
echo "   ✅ Stage 2: Reading Time Tracking"  
echo "   ✅ Stage 3: Estimated Reading Time"
echo "   ✅ Stage 4: Topic Organization"
echo "   ✅ Stage 5: Dashboard & Analytics"
echo ""
echo "📚 You now have a professional study analytics platform!")