import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

const TimeTrackingStats = ({ pageTimes, sessionData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  const getPageList = () => {
    return Object.entries(pageTimes)
      .map(([page, time]) => ({ page: parseInt(page), time }))
      .sort((a, b) => a.page - b.page);
  };

  const pageList = getPageList();
  const maxTime = Math.max(...Object.values(pageTimes), 1);

  if (pageList.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Reading Statistics</span>
          <span className="text-sm text-gray-500">({pageList.length} pages)</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t">
          <div className="space-y-2 mt-4">
            {pageList.map(({ page, time }) => (
              <div key={page} className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 w-16">Page {page}:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(time / maxTime) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  {formatTime(time)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="mt-4 pt-4 border-t bg-gray-50 rounded p-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Fastest Page:</span>
                <div className="font-medium">
                  {Math.min(...Object.values(pageTimes)) > 0 
                    ? formatTime(Math.min(...Object.values(pageTimes)))
                    : 'N/A'
                  }
                </div>
              </div>
              <div>
                <span className="text-gray-600">Slowest Page:</span>
                <div className="font-medium">
                  {formatTime(Math.max(...Object.values(pageTimes)))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingStats;
