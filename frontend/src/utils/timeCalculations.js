// Time calculation utilities for reading speed and estimates

/**
 * Calculate average reading time per page from page timing data
 * @param {Object} pageTimes - Object with page numbers as keys and time in seconds as values
 * @returns {number} Average time per page in seconds
 */
export const calculateAverageReadingTime = (pageTimes) => {
  const times = Object.values(pageTimes).filter(time => time > 0);
  if (times.length === 0) return 0;
  
  return times.reduce((sum, time) => sum + time, 0) / times.length;
};

/**
 * Calculate median reading time per page (more robust than average)
 * @param {Object} pageTimes - Object with page numbers as keys and time in seconds as values
 * @returns {number} Median time per page in seconds
 */
export const calculateMedianReadingTime = (pageTimes) => {
  const times = Object.values(pageTimes).filter(time => time > 0).sort((a, b) => a - b);
  if (times.length === 0) return 0;
  
  const mid = Math.floor(times.length / 2);
  return times.length % 2 === 0 
    ? (times[mid - 1] + times[mid]) / 2 
    : times[mid];
};

/**
 * Estimate total reading time for entire document
 * @param {number} averageTimePerPage - Average time per page in seconds
 * @param {number} totalPages - Total number of pages in document
 * @param {number} pagesRead - Number of pages already read
 * @returns {Object} Estimation data
 */
export const estimateTotalReadingTime = (averageTimePerPage, totalPages, pagesRead = 0) => {
  if (averageTimePerPage <= 0 || totalPages <= 0) {
    return {
      totalEstimate: 0,
      remainingEstimate: 0,
      completionPercentage: 0,
      confidence: 'low'
    };
  }

  const totalEstimate = averageTimePerPage * totalPages;
  const remainingPages = Math.max(totalPages - pagesRead, 0);
  const remainingEstimate = averageTimePerPage * remainingPages;
  const completionPercentage = pagesRead > 0 ? (pagesRead / totalPages) * 100 : 0;
  
  // Confidence based on number of pages read
  let confidence = 'low';
  if (pagesRead >= 5) confidence = 'medium';
  if (pagesRead >= 10) confidence = 'high';
  if (pagesRead >= totalPages * 0.2) confidence = 'very-high';

  return {
    totalEstimate,
    remainingEstimate,
    completionPercentage,
    confidence,
    averageTimePerPage
  };
};

/**
 * Calculate reading speed in pages per hour
 * @param {Object} pageTimes - Object with page numbers as keys and time in seconds as values
 * @returns {number} Pages per hour
 */
export const calculateReadingSpeed = (pageTimes) => {
  const averageTimePerPage = calculateAverageReadingTime(pageTimes);
  if (averageTimePerPage <= 0) return 0;
  
  return 3600 / averageTimePerPage; // 3600 seconds in an hour
};

/**
 * Predict completion time based on current pace
 * @param {Object} pageTimes - Page timing data
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total pages in document
 * @returns {Object} Completion prediction
 */
export const predictCompletionTime = (pageTimes, currentPage, totalPages) => {
  const averageTime = calculateAverageReadingTime(pageTimes);
  const medianTime = calculateMedianReadingTime(pageTimes);
  const pagesRead = Object.keys(pageTimes).length;
  
  if (averageTime <= 0) {
    return {
      estimatedFinishTime: null,
      remainingMinutes: 0,
      useMedian: false,
      confidence: 'low'
    };
  }

  // Use median if we have enough data points and there's significant variance
  const useMedian = pagesRead >= 5 && Math.abs(averageTime - medianTime) > averageTime * 0.3;
  const timePerPage = useMedian ? medianTime : averageTime;
  
  const remainingPages = Math.max(totalPages - currentPage, 0);
  const remainingSeconds = timePerPage * remainingPages;
  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  
  const now = new Date();
  const estimatedFinishTime = new Date(now.getTime() + (remainingSeconds * 1000));
  
  let confidence = 'low';
  if (pagesRead >= 3) confidence = 'medium';
  if (pagesRead >= 7) confidence = 'high';
  if (pagesRead >= totalPages * 0.15) confidence = 'very-high';

  return {
    estimatedFinishTime,
    remainingMinutes,
    useMedian,
    confidence,
    timePerPage
  };
};

/**
 * Format time duration in a human-readable way
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.round((seconds % 86400) / 3600);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
};

/**
 * Format time for display (more detailed)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatDetailedDuration = (seconds) => {
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${minutes} min ${secs}s` : `${minutes} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

/**
 * Get confidence level description
 * @param {string} confidence - Confidence level
 * @returns {Object} Confidence info
 */
export const getConfidenceInfo = (confidence) => {
  const confidenceMap = {
    'low': { 
      label: 'Low', 
      color: 'text-gray-500', 
      bgColor: 'bg-gray-100',
      description: 'Need more data for accurate estimates' 
    },
    'medium': { 
      label: 'Medium', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-100',
      description: 'Estimates based on limited data' 
    },
    'high': { 
      label: 'High', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-100',
      description: 'Reliable estimates based on reading pattern' 
    },
    'very-high': { 
      label: 'Very High', 
      color: 'text-green-600', 
      bgColor: 'bg-green-100',
      description: 'Highly accurate estimates' 
    }
  };
  
  return confidenceMap[confidence] || confidenceMap['low'];
};
