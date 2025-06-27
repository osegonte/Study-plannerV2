// Enhanced time calculation utilities for topic-based reading estimates and goal tracking

/**
 * Calculate reading time estimates for a single document
 * @param {Object} pageTimes - Page timing data
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total pages in document
 * @returns {Object} Document reading estimates
 */
export const calculateDocumentEstimates = (pageTimes, currentPage, totalPages) => {
  const pagesRead = Object.keys(pageTimes).length;
  const totalTimeSpent = Object.values(pageTimes).reduce((sum, time) => sum + time, 0);
  
  if (pagesRead === 0 || totalTimeSpent === 0) {
    return {
      averageTimePerPage: 0,
      totalEstimatedTime: 0,
      timeRemaining: 0,
      completionPercentage: 0,
      estimatedFinishDate: null,
      confidence: 'none'
    };
  }

  // Calculate average time per page using median for better accuracy
  const pageTimes_array = Object.values(pageTimes).sort((a, b) => a - b);
  const medianTime = pageTimes_array[Math.floor(pageTimes_array.length / 2)];
  const averageTime = totalTimeSpent / pagesRead;
  
  // Use median if we have enough data and significant variance
  const useMedian = pagesRead >= 5 && Math.abs(averageTime - medianTime) > averageTime * 0.3;
  const timePerPage = useMedian ? medianTime : averageTime;

  // Calculate estimates
  const totalEstimatedTime = timePerPage * totalPages;
  const pagesRemaining = Math.max(totalPages - currentPage, 0);
  const timeRemaining = timePerPage * pagesRemaining;
  const completionPercentage = (currentPage / totalPages) * 100;

  // Estimate finish date based on typical reading session length
  const estimatedFinishDate = calculateFinishDate(timeRemaining);

  // Confidence level based on data quality
  let confidence = 'low';
  if (pagesRead >= 3) confidence = 'medium';
  if (pagesRead >= 7) confidence = 'high';
  if (pagesRead >= totalPages * 0.15) confidence = 'very-high';

  return {
    averageTimePerPage: timePerPage,
    totalEstimatedTime,
    timeRemaining,
    completionPercentage,
    estimatedFinishDate,
    confidence,
    pagesRead,
    useMedian
  };
};

/**
 * Calculate topic-level reading estimates and goals
 * @param {Array} documents - Documents in the topic
 * @param {Object} topicGoals - Topic-specific goals
 * @returns {Object} Topic reading estimates
 */
/**
 * Calculate topic-level reading estimates using cross-document data
 * @param {Array} documents - Documents in the topic
 * @param {Object} topicGoals - Topic-specific goals
 * @returns {Object} Topic reading estimates
 */
export const calculateTopicEstimates = (documents, topicGoals = {}) => {
  if (!documents || documents.length === 0) {
    return {
      totalDocuments: 0,
      totalPages: 0,
      totalEstimatedTime: 0,
      timeRemaining: 0,
      averageProgress: 0,
      documentsCompleted: 0,
      estimatedCompletionDate: null,
      dailyReadingRequired: 0,
      weeklyReadingRequired: 0,
      goalProgress: {
        timeGoal: null,
        pageGoal: null,
        completionGoal: null
      }
    };
  }

  // Calculate topic-wide reading speed from all documents with timing data
  const allTopicPageTimes = {};
  documents.forEach(doc => {
    if (doc.pageTimes && Object.keys(doc.pageTimes).length > 0) {
      Object.assign(allTopicPageTimes, doc.pageTimes);
    }
  });

  // Get topic-wide reading speed
  const topicReadingSpeed = calculateAverageReadingTime(allTopicPageTimes);
  const hasTopicReadingData = Object.keys(allTopicPageTimes).length > 0;

  let totalEstimatedTime = 0;
  let totalTimeRemaining = 0;
  let totalPages = 0;
  let totalProgress = 0;
  let documentsCompleted = 0;
  let documentsWithEstimates = 0;

  // Calculate estimates for each document
  documents.forEach(doc => {
    const docPageTimes = doc.pageTimes || {};
    const docPages = doc.totalPages || 0;
    const currentPage = doc.currentPage || 1;

    if (docPages === 0) return; // Skip documents without page count

    let docEstimatedTime = 0;
    let docTimeRemaining = 0;
    let docProgress = 0;

    if (Object.keys(docPageTimes).length > 0) {
      // Document has its own timing data - use it
      const docEstimates = calculateDocumentEstimates(docPageTimes, currentPage, docPages);
      docEstimatedTime = docEstimates.totalEstimatedTime;
      docTimeRemaining = docEstimates.timeRemaining;
      docProgress = docEstimates.completionPercentage;
      documentsWithEstimates++;
    } else if (hasTopicReadingData && topicReadingSpeed > 0) {
      // Document has no timing data but topic has reading speed data
      // Use topic-wide reading speed to estimate this document
      docEstimatedTime = topicReadingSpeed * docPages;
      const pagesRemaining = Math.max(docPages - currentPage + 1, 0);
      docTimeRemaining = topicReadingSpeed * pagesRemaining;
      docProgress = (currentPage / docPages) * 100;
      documentsWithEstimates++;
      
      console.log(`📊 Estimated ${doc.name}: ${formatDuration(docEstimatedTime)} total, ${formatDuration(docTimeRemaining)} remaining (using topic reading speed: ${(3600/topicReadingSpeed).toFixed(1)} p/h)`);
    } else {
      // No timing data available - can't estimate
      docProgress = (currentPage / docPages) * 100;
    }

    totalEstimatedTime += docEstimatedTime;
    totalTimeRemaining += docTimeRemaining;
    totalPages += docPages;
    totalProgress += docProgress;
    
    if (docProgress >= 100) {
      documentsCompleted++;
    }
  });

  const averageProgress = documents.length > 0 ? totalProgress / documents.length : 0;
  
  // Calculate completion date based on reading goals
  const estimatedCompletionDate = calculateTopicCompletionDate(
    totalTimeRemaining,
    topicGoals
  );

  // Calculate daily/weekly reading requirements
  const { dailyReadingRequired, weeklyReadingRequired } = calculateReadingRequirements(
    totalTimeRemaining,
    topicGoals,
    estimatedCompletionDate
  );

  // Calculate goal progress
  const goalProgress = calculateGoalProgress(documents, topicGoals);

  return {
    totalDocuments: documents.length,
    totalPages,
    totalEstimatedTime,
    timeRemaining: totalTimeRemaining,
    averageProgress,
    documentsCompleted,
    documentsWithEstimates,
    estimatedCompletionDate,
    dailyReadingRequired,
    weeklyReadingRequired,
    goalProgress,
    topicReadingSpeed, // Include for debugging
    hasTopicReadingData
  };
};) => {
  if (!documents || documents.length === 0) {
    return {
      totalDocuments: 0,
      totalPages: 0,
      totalEstimatedTime: 0,
      timeRemaining: 0,
      averageProgress: 0,
      documentsCompleted: 0,
      estimatedCompletionDate: null,
      dailyReadingRequired: 0,
      weeklyReadingRequired: 0,
      goalProgress: {
        timeGoal: null,
        pageGoal: null,
        completionGoal: null
      }
    };
  }

  let totalEstimatedTime = 0;
  let totalTimeRemaining = 0;
  let totalPages = 0;
  let totalProgress = 0;
  let documentsCompleted = 0;
  let documentsWithEstimates = 0;

  // Calculate estimates for each document
  documents.forEach(doc => {
    const docEstimates = calculateDocumentEstimates(
      doc.pageTimes || {},
      doc.currentPage || 1,
      doc.totalPages || 0
    );

    if (docEstimates.totalEstimatedTime > 0) {
      totalEstimatedTime += docEstimates.totalEstimatedTime;
      totalTimeRemaining += docEstimates.timeRemaining;
      documentsWithEstimates++;
    }

    totalPages += doc.totalPages || 0;
    totalProgress += docEstimates.completionPercentage;
    
    if (docEstimates.completionPercentage >= 100) {
      documentsCompleted++;
    }
  });

  const averageProgress = documents.length > 0 ? totalProgress / documents.length : 0;
  
  // Calculate completion date based on reading goals
  const estimatedCompletionDate = calculateTopicCompletionDate(
    totalTimeRemaining,
    topicGoals
  );

  // Calculate daily/weekly reading requirements
  const { dailyReadingRequired, weeklyReadingRequired } = calculateReadingRequirements(
    totalTimeRemaining,
    topicGoals,
    estimatedCompletionDate
  );

  // Calculate goal progress
  const goalProgress = calculateGoalProgress(documents, topicGoals);

  return {
    totalDocuments: documents.length,
    totalPages,
    totalEstimatedTime,
    timeRemaining: totalTimeRemaining,
    averageProgress,
    documentsCompleted,
    documentsWithEstimates,
    estimatedCompletionDate,
    dailyReadingRequired,
    weeklyReadingRequired,
    goalProgress
  };
};

/**
 * Calculate reading requirements to meet deadlines
 * @param {number} timeRemaining - Time remaining in seconds
 * @param {Object} goals - Topic goals
 * @param {Date} estimatedCompletion - Estimated completion date
 * @returns {Object} Reading requirements
 */
export const calculateReadingRequirements = (timeRemaining, goals = {}, estimatedCompletion) => {
  const now = new Date();
  
  // Default to 30 days if no specific deadline
  let targetDate = goals.deadline ? new Date(goals.deadline) : null;
  if (!targetDate && estimatedCompletion) {
    targetDate = estimatedCompletion;
  }
  if (!targetDate) {
    targetDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
  }

  const daysRemaining = Math.max(1, Math.ceil((targetDate - now) / (24 * 60 * 60 * 1000)));
  const minutesRemaining = timeRemaining / 60;

  return {
    dailyReadingRequired: Math.ceil(minutesRemaining / daysRemaining),
    weeklyReadingRequired: Math.ceil(minutesRemaining / (daysRemaining / 7)),
    daysRemaining,
    targetDate
  };
};

/**
 * Calculate progress toward topic goals
 * @param {Array} documents - Documents in topic
 * @param {Object} goals - Topic goals
 * @returns {Object} Goal progress
 */
export const calculateGoalProgress = (documents, goals = {}) => {
  const totalTimeSpent = documents.reduce((sum, doc) => {
    return sum + Object.values(doc.pageTimes || {}).reduce((docSum, time) => docSum + time, 0);
  }, 0);

  const totalPagesRead = documents.reduce((sum, doc) => {
    return sum + Object.keys(doc.pageTimes || {}).length;
  }, 0);

  const documentsCompleted = documents.filter(doc => {
    const progress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
    return progress >= 100;
  }).length;

  return {
    timeGoal: goals.timeGoal ? {
      target: goals.timeGoal * 60, // Convert minutes to seconds
      current: totalTimeSpent,
      percentage: Math.min((totalTimeSpent / (goals.timeGoal * 60)) * 100, 100)
    } : null,
    
    pageGoal: goals.pageGoal ? {
      target: goals.pageGoal,
      current: totalPagesRead,
      percentage: Math.min((totalPagesRead / goals.pageGoal) * 100, 100)
    } : null,
    
    completionGoal: goals.completionGoal ? {
      target: goals.completionGoal,
      current: documentsCompleted,
      percentage: Math.min((documentsCompleted / goals.completionGoal) * 100, 100)
    } : null
  };
};

/**
 * Calculate estimated finish date for a document
 * @param {number} timeRemaining - Time remaining in seconds
 * @returns {Date|null} Estimated finish date
 */
export const calculateFinishDate = (timeRemaining) => {
  if (timeRemaining <= 0) return null;

  // Assume average reading session of 45 minutes, 5 days per week
  const avgSessionMinutes = 45;
  const sessionsPerWeek = 5;
  const sessionsNeeded = Math.ceil((timeRemaining / 60) / avgSessionMinutes);
  const weeksNeeded = Math.ceil(sessionsNeeded / sessionsPerWeek);
  
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + (weeksNeeded * 7));
  
  return finishDate;
};

/**
 * Calculate topic completion date based on goals
 * @param {number} timeRemaining - Time remaining in seconds
 * @param {Object} goals - Topic goals
 * @returns {Date|null} Estimated completion date
 */
export const calculateTopicCompletionDate = (timeRemaining, goals = {}) => {
  if (timeRemaining <= 0) return new Date();

  // If there's a specific deadline goal
  if (goals.deadline) {
    return new Date(goals.deadline);
  }

  // If there's a daily time goal
  if (goals.dailyTimeGoal) {
    const daysNeeded = Math.ceil((timeRemaining / 60) / goals.dailyTimeGoal);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysNeeded);
    return completionDate;
  }

  // Default calculation based on typical reading patterns
  return calculateFinishDate(timeRemaining);
};

/**
 * Get overall study progress across all topics
 * @param {Array} topics - All topics
 * @param {Array} documents - All documents
 * @returns {Object} Overall progress
 */
export const calculateOverallProgress = (topics, documents) => {
  let totalEstimatedTime = 0;
  let totalTimeRemaining = 0;
  let totalTimeSpent = 0;
  let totalPages = 0;
  let totalPagesRead = 0;

  documents.forEach(doc => {
    const docEstimates = calculateDocumentEstimates(
      doc.pageTimes || {},
      doc.currentPage || 1,
      doc.totalPages || 0
    );

    totalEstimatedTime += docEstimates.totalEstimatedTime;
    totalTimeRemaining += docEstimates.timeRemaining;
    totalTimeSpent += Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
    totalPages += doc.totalPages || 0;
    totalPagesRead += Object.keys(doc.pageTimes || {}).length;
  });

  const overallProgress = totalEstimatedTime > 0 
    ? ((totalEstimatedTime - totalTimeRemaining) / totalEstimatedTime) * 100 
    : 0;

  return {
    totalTopics: topics.length,
    totalDocuments: documents.length,
    totalEstimatedTime,
    totalTimeRemaining,
    totalTimeSpent,
    totalPages,
    totalPagesRead,
    overallProgress: Math.max(0, Math.min(100, overallProgress)),
    estimatedCompletionDate: calculateFinishDate(totalTimeRemaining)
  };
};

/**
 * Format time duration with context-aware precision
 * @param {number} seconds - Time in seconds
 * @param {string} context - Context for formatting ('short', 'detailed', 'goal')
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds, context = 'short') => {
  if (seconds < 60) {
    return context === 'detailed' ? `${Math.round(seconds)} seconds` : `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (context === 'goal' && days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (context === 'detailed') {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return context === 'detailed' ? `${minutes} minutes` : `${minutes}m`;
};

/**
 * Calculate reading velocity trends
 * @param {Object} pageTimes - Page timing data
 * @returns {Object} Velocity trends
 */
export const calculateReadingVelocity = (pageTimes) => {
  const times = Object.entries(pageTimes)
    .map(([page, time]) => ({ page: parseInt(page), time }))
    .sort((a, b) => a.page - b.page);
    
  if (times.length < 3) {
    return { trend: 'insufficient-data', velocity: 0, improvement: 0 };
  }
  
  const recentTimes = times.slice(-5); // Last 5 pages
  const earlierTimes = times.slice(0, Math.min(5, times.length - 5)); // First 5 pages
  
  const recentAvg = recentTimes.reduce((sum, t) => sum + t.time, 0) / recentTimes.length;
  const earlierAvg = earlierTimes.length > 0 
    ? earlierTimes.reduce((sum, t) => sum + t.time, 0) / earlierTimes.length 
    : recentAvg;
  
  const improvement = earlierAvg > 0 ? ((earlierAvg - recentAvg) / earlierAvg) * 100 : 0;
  const velocity = recentAvg > 0 ? 3600 / recentAvg : 0; // pages per hour
  
  let trend = 'stable';
  if (improvement > 10) trend = 'improving';
  else if (improvement < -10) trend = 'declining';
  
  return { trend, velocity, improvement: Math.round(improvement) };
};
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

/**
 * Get topic-wide reading speed from all documents with timing data
 * @param {Array} documents - All documents in the topic
 * @returns {Object} Topic reading statistics
 */
export const getTopicReadingStats = (documents) => {
  const allPageTimes = {};
  let totalDocumentsWithData = 0;
  let totalPagesWithData = 0;

  documents.forEach(doc => {
    if (doc.pageTimes && Object.keys(doc.pageTimes).length > 0) {
      Object.assign(allPageTimes, doc.pageTimes);
      totalDocumentsWithData++;
      totalPagesWithData += Object.keys(doc.pageTimes).length;
    }
  });

  const averageTimePerPage = calculateAverageReadingTime(allPageTimes);
  const readingSpeed = averageTimePerPage > 0 ? 3600 / averageTimePerPage : 0;

  return {
    averageTimePerPage,
    readingSpeed,
    totalPagesWithData,
    totalDocumentsWithData,
    hasData: totalPagesWithData > 0,
    confidence: totalPagesWithData >= 10 ? 'high' : totalPagesWithData >= 5 ? 'medium' : 'low'
  };
};

/**
 * Estimate time for a new document based on topic reading speed
 * @param {number} documentPages - Total pages in the new document
 * @param {number} currentPage - Current page in the document
 * @param {Object} topicStats - Topic reading statistics
 * @returns {Object} Document time estimates
 */
export const estimateDocumentFromTopicStats = (documentPages, currentPage, topicStats) => {
  if (!topicStats.hasData || documentPages === 0) {
    return {
      totalEstimatedTime: 0,
      timeRemaining: 0,
      completionPercentage: 0,
      confidence: 'none'
    };
  }

  const totalEstimatedTime = topicStats.averageTimePerPage * documentPages;
  const pagesRemaining = Math.max(documentPages - currentPage + 1, 0);
  const timeRemaining = topicStats.averageTimePerPage * pagesRemaining;
  const completionPercentage = (currentPage / documentPages) * 100;

  return {
    totalEstimatedTime,
    timeRemaining,
    completionPercentage,
    confidence: topicStats.confidence,
    estimatedFromTopic: true
  };
};
