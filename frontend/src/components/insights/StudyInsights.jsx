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
