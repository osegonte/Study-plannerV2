import React from 'react';
import { BarChart3, AlertTriangle } from 'lucide-react';

const EnhancedAnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Study Analytics</h1>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
          <p className="text-gray-600">
            Replace with Enhanced Analytics Dashboard component for detailed statistics
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalyticsDashboard;
