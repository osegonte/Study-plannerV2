export const getTotalStudyTime = (documents) => {
  return documents.reduce((total, doc) => {
    const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
    return total + docTime;
  }, 0);
};

export const getStudyStreak = (documents) => {
  const today = new Date();
  const studyDates = new Set();
  
  documents.forEach(doc => {
    if (doc.lastReadAt) {
      const date = new Date(doc.lastReadAt).toDateString();
      studyDates.add(date);
    }
  });

  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dateString = currentDate.toDateString();
    if (studyDates.has(dateString)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (streak === 0 && dateString === today.toDateString()) {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

export const getWeeklyStats = (documents, period = 'week') => {
  const today = new Date();
  const daysToShow = period === 'week' ? 7 : period === 'month' ? 30 : 7;
  
  const stats = [];
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toDateString();
    
    let dayMinutes = 0;
    documents.forEach(doc => {
      if (doc.lastReadAt && new Date(doc.lastReadAt).toDateString() === dateString) {
        const docTime = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
        dayMinutes += Math.floor(docTime / 60);
      }
    });
    
    stats.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dateString,
      minutes: dayMinutes
    });
  }
  
  return stats;
};

export const getTopicPerformance = (documents, topics) => {
  const topicStats = topics.map(topic => {
    const topicDocs = documents.filter(doc => doc.topicId === topic.id);
    
    const totalTime = topicDocs.reduce((sum, doc) => {
      return sum + Object.values(doc.pageTimes || {}).reduce((docSum, time) => docSum + time, 0);
    }, 0);
    
    const totalPages = topicDocs.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
    const pagesRead = topicDocs.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
    
    const completionRate = totalPages > 0 ? (pagesRead / totalPages) * 100 : 0;
    
    return {
      id: topic.id,
      name: topic.name,
      color: topic.color,
      documentsCount: topicDocs.length,
      totalTime,
      totalPages,
      pagesRead,
      completionRate
    };
  });
  
  return topicStats.sort((a, b) => b.totalTime - a.totalTime);
};

export const getProductivityScore = (documents) => {
  if (documents.length === 0) return 0;
  
  const streak = getStudyStreak(documents);
  const consistencyScore = Math.min((streak / 7) * 40, 40);
  
  const allPageTimes = documents.reduce((acc, doc) => ({ ...acc, ...doc.pageTimes }), {});
  const avgSpeed = Object.keys(allPageTimes).length > 0 
    ? (Object.keys(allPageTimes).length * 3600) / Object.values(allPageTimes).reduce((sum, time) => sum + time, 0)
    : 0;
  const speedScore = Math.min((avgSpeed / 100) * 30, 30);
  
  const totalPages = documents.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
  const pagesRead = documents.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
  const completionRate = totalPages > 0 ? (pagesRead / totalPages) : 0;
  const completionScore = completionRate * 30;
  
  return Math.round(consistencyScore + speedScore + completionScore);
};

export const getReadingGoalProgress = (documents, goalType, targetValue) => {
  return {
    current: 0,
    target: targetValue,
    percentage: 0
  };
};
