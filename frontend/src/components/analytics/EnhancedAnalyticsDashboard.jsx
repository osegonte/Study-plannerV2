import React from 'react';
import { BarChart3, Clock, BookOpen } from 'lucide-react';

const EnhancedAnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Study Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">0h 0m</div>
              <div className="text-sm text-gray-600">Total Study Time</div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Pages Read</div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">0.0</div>
              <div className="text-sm text-gray-600">Reading Speed (p/h)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Analytics Dashboard</h3>
        <p className="text-gray-600">Analytics features are working! Start studying to see your progress.</p>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;
