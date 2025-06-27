import React from 'react';
import { Clock, TrendingUp, Target, Calendar } from 'lucide-react';
import { 
  calculateAverageReadingTime,
  calculateReadingSpeed,
  estimateTotalReadingTime,
  predictCompletionTime,
  formatDuration,
  formatDetailedDuration,
  getConfidenceInfo
} from '../../utils/timeCalculations';

const ReadingEstimates = ({ pageTimes, currentPage, totalPages, sessionData }) => {
  // Calculate estimates
  const averageTimePerPage = calculateAverageReadingTime(pageTimes);
  const readingSpeed = calculateReadingSpeed(pageTimes);
  const pagesRead = Object.keys(pageTimes).length;
  
  const estimates = estimateTotalReadingTime(averageTimePerPage, totalPages, pagesRead);
  const completion = predictCompletionTime(pageTimes, currentPage, totalPages);
  
  const confidenceInfo = getConfidenceInfo(estimates.confidence);

  // Don't show estimates if we don't have enough data
  if (pagesRead < 2) {
    return (
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Reading Estimates</h3>
        </div>
        <div className="text-center py-6 text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Read a few more pages to see estimates</p>
          <p className="text-xs text-gray-400 mt-1">Need at least 2 pages for calculations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Reading Estimates</h3>
        </div>
        
        {/* Confidence Badge */}
        <div className={`text-xs px-2 py-1 rounded-full ${confidenceInfo.bgColor} ${confidenceInfo.color}`}>
          {confidenceInfo.label} Confidence
        </div>
      </div>

      <div className="space-y-4">
        {/* Reading Speed */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Reading Speed</span>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                {readingSpeed.toFixed(1)} pages/hour
              </div>
              <div className="text-xs text-gray-500">
                ~{formatDetailedDuration(averageTimePerPage)} per page
              </div>
            </div>
          </div>
        </div>

        {/* Total Document Estimate */}
        <div className="border-t pt-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Full Document</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {formatDuration(estimates.totalEstimate)}
              </div>
              <div className="text-xs text-gray-500">total estimated time</div>
            </div>
          </div>
          
          {/* Progress bar for document completion */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${estimates.completionPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 text-center">
            {estimates.completionPercentage.toFixed(1)}% complete
          </div>
        </div>

        {/* Remaining Time */}
        {estimates.remainingEstimate > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Time Remaining</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-orange-600">
                  {formatDuration(estimates.remainingEstimate)}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.max(totalPages - currentPage, 0)} pages left
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estimated Completion Time */}
        {completion.estimatedFinishTime && completion.remainingMinutes > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Finish By</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">
                  {completion.estimatedFinishTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  {completion.remainingMinutes < 60 
                    ? `in ${completion.remainingMinutes} min`
                    : `in ${Math.round(completion.remainingMinutes / 60)}h ${completion.remainingMinutes % 60}m`
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        <div className="border-t pt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{pagesRead}</div>
            <div className="text-xs text-gray-500">pages analyzed</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {((pagesRead / totalPages) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">data coverage</div>
          </div>
        </div>

        {/* Confidence Info */}
        <div className="border-t pt-3">
          <div className="text-xs text-gray-500 text-center">
            <span className={confidenceInfo.color}>●</span> {confidenceInfo.description}
            {completion.useMedian && (
              <div className="mt-1">Using median time for better accuracy</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingEstimates;
