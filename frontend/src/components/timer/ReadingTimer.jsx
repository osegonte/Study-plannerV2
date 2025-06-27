import React from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';

const ReadingTimer = ({ 
  isTracking, 
  currentSessionTime, 
  sessionData, 
  onReset,
  currentPage 
}) => {
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTimeShort = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Reading Timer</h3>
        </div>
        
        {sessionData.totalTime > 0 && (
          <button
            onClick={onReset}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Reset timer data"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Current Page Timer */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current Page {currentPage}</span>
          <div className="flex items-center space-x-1">
            {isTracking ? (
              <Play className="h-3 w-3 text-green-500" />
            ) : (
              <Pause className="h-3 w-3 text-gray-400" />
            )}
            <span className={`text-lg font-mono ${isTracking ? 'text-green-600' : 'text-gray-600'}`}>
              {formatTimeShort(currentSessionTime)}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              isTracking ? 'bg-green-500' : 'bg-gray-400'
            }`}
            style={{ 
              width: isTracking && currentSessionTime > 0 
                ? `${Math.min((currentSessionTime / 60) * 100, 100)}%` 
                : '0%' 
            }}
          ></div>
        </div>
      </div>

      {/* Session Statistics */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Time:</span>
          <span className="font-medium">{formatTime(sessionData.totalTime)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Pages Read:</span>
          <span className="font-medium">{sessionData.pagesRead}</span>
        </div>
        
        {sessionData.averageTimePerPage > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Avg per Page:</span>
            <span className="font-medium">{formatTime(Math.round(sessionData.averageTimePerPage))}</span>
          </div>
        )}

        {sessionData.currentFileName && (
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500 truncate" title={sessionData.currentFileName}>
              📄 {sessionData.currentFileName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingTimer;
