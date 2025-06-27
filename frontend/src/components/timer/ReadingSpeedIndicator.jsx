import React from 'react';
import { Gauge } from 'lucide-react';
import { calculateReadingSpeed, formatDuration, calculateAverageReadingTime } from '../../utils/timeCalculations';

const ReadingSpeedIndicator = ({ pageTimes, totalPages, currentPage }) => {
  const readingSpeed = calculateReadingSpeed(pageTimes);
  const averageTime = calculateAverageReadingTime(pageTimes);
  const pagesRead = Object.keys(pageTimes).length;

  if (pagesRead < 2) {
    return null;
  }

  const remainingPages = Math.max(totalPages - currentPage, 0);
  const estimatedRemaining = averageTime * remainingPages;

  return (
    <div className="flex items-center space-x-3 text-sm">
      <div className="flex items-center space-x-1">
        <Gauge className="h-4 w-4 text-blue-600" />
        <span className="text-gray-600">Speed:</span>
        <span className="font-semibold text-blue-600">
          {readingSpeed.toFixed(1)} p/h
        </span>
      </div>
      
      {remainingPages > 0 && (
        <div className="border-l pl-3">
          <span className="text-gray-600">Est. remaining:</span>
          <span className="font-semibold text-orange-600 ml-1">
            {formatDuration(estimatedRemaining)}
          </span>
        </div>
      )}
    </div>
  );
};

export default ReadingSpeedIndicator;
