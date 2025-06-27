import React, { useState } from 'react';
import { Target, Clock, BookOpen, Calendar, TrendingUp, Award, Plus, Edit3, Save, X } from 'lucide-react';
import { 
  calculateTopicEstimates, 
  calculateReadingRequirements,
  formatDuration 
} from '../../utils/timeCalculations';

const TopicGoalManager = ({ topic, documents, goals, onUpdateGoals }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoals, setEditedGoals] = useState(goals || {});

  // Calculate topic estimates
  const estimates = calculateTopicEstimates(documents, goals);
  const requirements = calculateReadingRequirements(
    estimates.timeRemaining,
    goals,
    estimates.estimatedCompletionDate
  );

  const handleSave = () => {
    onUpdateGoals(topic.id, editedGoals);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedGoals(goals || {});
    setIsEditing(false);
  };

  const getGoalStatusColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Target className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Goals & Progress - {topic.name}
          </h3>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Goals</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      {/* Goal Setting Form */}
      {isEditing && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Set Study Goals</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Time Goal (hours)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={editedGoals.timeGoal || ''}
                onChange={(e) => setEditedGoals({
                  ...editedGoals,
                  timeGoal: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Time Goal (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={editedGoals.dailyTimeGoal || ''}
                onChange={(e) => setEditedGoals({
                  ...editedGoals,
                  dailyTimeGoal: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 45"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pages Goal
              </label>
              <input
                type="number"
                min="0"
                value={editedGoals.pageGoal || ''}
                onChange={(e) => setEditedGoals({
                  ...editedGoals,
                  pageGoal: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Completion Date
              </label>
              <input
                type="date"
                value={editedGoals.deadline || ''}
                onChange={(e) => setEditedGoals({
                  ...editedGoals,
                  deadline: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Topic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <div className="text-sm text-blue-700">Total Estimated Time</div>
              <div className="text-xl font-bold text-blue-900">
                {formatDuration(estimates.totalEstimatedTime, 'goal')}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-6 w-6 text-orange-600" />
            <div>
              <div className="text-sm text-orange-700">Time Remaining</div>
              <div className="text-xl font-bold text-orange-900">
                {formatDuration(estimates.timeRemaining, 'goal')}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <div>
              <div className="text-sm text-green-700">Average Progress</div>
              <div className="text-xl font-bold text-green-900">
                {Math.round(estimates.averageProgress)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress */}
      {(goals?.timeGoal || goals?.pageGoal) && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Goal Progress</h4>
          
          <div className="space-y-4">
            {estimates.goalProgress.timeGoal && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Time Goal ({formatDuration(estimates.goalProgress.timeGoal.target, 'goal')})
                  </span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    getGoalStatusColor(estimates.goalProgress.timeGoal.percentage)
                  }`}>
                    {Math.round(estimates.goalProgress.timeGoal.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(estimates.goalProgress.timeGoal.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDuration(estimates.goalProgress.timeGoal.current)} completed
                </div>
              </div>
            )}

            {estimates.goalProgress.pageGoal && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Pages Goal ({estimates.goalProgress.pageGoal.target} pages)
                  </span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    getGoalStatusColor(estimates.goalProgress.pageGoal.percentage)
                  }`}>
                    {Math.round(estimates.goalProgress.pageGoal.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(estimates.goalProgress.pageGoal.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {estimates.goalProgress.pageGoal.current} pages read
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reading Requirements */}
      {estimates.timeRemaining > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Reading Plan</h4>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-900">
                  {requirements.dailyReadingRequired}m
                </div>
                <div className="text-sm text-yellow-700">Daily Reading</div>
                <div className="text-xs text-yellow-600 mt-1">
                  To finish by {requirements.targetDate.toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-yellow-900">
                  {Math.ceil(requirements.weeklyReadingRequired / 60)}h
                </div>
                <div className="text-sm text-yellow-700">Weekly Reading</div>
                <div className="text-xs text-yellow-600 mt-1">
                  {requirements.weeklyReadingRequired}m total
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-yellow-900">
                  {requirements.daysRemaining}
                </div>
                <div className="text-sm text-yellow-700">Days Remaining</div>
                <div className="text-xs text-yellow-600 mt-1">
                  Until target date
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Breakdown */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Document Progress</h4>
        
        <div className="space-y-3">
          {documents.map((doc) => {
            const docProgress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
            const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
            
            return (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {doc.name}
                  </span>
                  <span className="text-sm text-gray-600">
                    {Math.round(docProgress)}% complete
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${docProgress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Page {doc.currentPage} of {doc.totalPages}</span>
                  <span>Time: {formatDuration(docTime)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      {estimates.documentsCompleted > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              🎉 {estimates.documentsCompleted} document{estimates.documentsCompleted !== 1 ? 's' : ''} completed!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicGoalManager;