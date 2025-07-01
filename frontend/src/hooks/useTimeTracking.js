import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimeTracking = (initialPageTimes = {}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [pageTimes, setPageTimes] = useState(initialPageTimes);
  const [sessionData] = useState({
    totalTime: 0,
    pagesRead: 0,
    averageTimePerPage: 0,
    currentFileName: null
  });

  const intervalRef = useRef(null);

  const startPageTimer = useCallback((pageNumber, fileName) => {
    console.log('Starting timer for page', pageNumber);
    setIsTracking(true);
    setCurrentSessionTime(0);
  }, []);

  const stopPageTimer = useCallback(() => {
    console.log('Stopping timer');
    setIsTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resetTimingData = useCallback(() => {
    setPageTimes({});
    setCurrentSessionTime(0);
    setIsTracking(false);
  }, []);

  const getTotalTime = useCallback(() => {
    return Object.values(pageTimes).reduce((sum, time) => sum + time, 0);
  }, [pageTimes]);

  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking]);

  return {
    isTracking,
    currentSessionTime,
    pageTimes,
    sessionData,
    startPageTimer,
    stopPageTimer,
    resetTimingData,
    getTotalTime
  };
};
