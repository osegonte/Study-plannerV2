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
