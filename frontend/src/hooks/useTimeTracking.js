import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimeTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [pageStartTime, setPageStartTime] = useState(null);
  const [pageTimes, setPageTimes] = useState({}); // { pageNumber: totalTimeInSeconds }
  const [sessionData, setSessionData] = useState({
    totalTime: 0,
    pagesRead: 0,
    averageTimePerPage: 0,
    currentFileName: null
  });

  const intervalRef = useRef(null);
  const currentPageRef = useRef(null);

  // Start tracking time for a specific page
  const startPageTimer = useCallback((pageNumber, fileName = null) => {
    // Save time for previous page if exists
    if (currentPageRef.current && pageStartTime) {
      const timeSpent = Math.floor((Date.now() - pageStartTime) / 1000);
      if (timeSpent > 0) {
        setPageTimes(prev => ({
          ...prev,
          [currentPageRef.current]: (prev[currentPageRef.current] || 0) + timeSpent
        }));
      }
    }

    // Start timer for new page
    currentPageRef.current = pageNumber;
    setPageStartTime(Date.now());
    setIsTracking(true);

    // Update session data
    if (fileName) {
      setSessionData(prev => ({
        ...prev,
        currentFileName: fileName
      }));
    }

    console.log(`⏱️ Started timer for page ${pageNumber}`);
  }, [pageStartTime]);

  // Stop tracking time
  const stopPageTimer = useCallback(() => {
    if (currentPageRef.current && pageStartTime) {
      const timeSpent = Math.floor((Date.now() - pageStartTime) / 1000);
      if (timeSpent > 0) {
        setPageTimes(prev => ({
          ...prev,
          [currentPageRef.current]: (prev[currentPageRef.current] || 0) + timeSpent
        }));
      }
    }

    setIsTracking(false);
    setPageStartTime(null);
    currentPageRef.current = null;

    console.log('⏹️ Stopped page timer');
  }, [pageStartTime]);

  // Reset all timing data
  const resetTimingData = useCallback(() => {
    setPageTimes({});
    setCurrentSessionTime(0);
    setSessionData({
      totalTime: 0,
      pagesRead: 0,
      averageTimePerPage: 0,
      currentFileName: null
    });
    stopPageTimer();
    console.log('🔄 Reset all timing data');
  }, [stopPageTimer]);

  // Get time spent on a specific page
  const getPageTime = useCallback((pageNumber) => {
    return pageTimes[pageNumber] || 0;
  }, [pageTimes]);

  // Get total reading time
  const getTotalTime = useCallback(() => {
    return Object.values(pageTimes).reduce((total, time) => total + time, 0);
  }, [pageTimes]);

  // Update current session time every second
  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        if (pageStartTime) {
          const currentTime = Math.floor((Date.now() - pageStartTime) / 1000);
          setCurrentSessionTime(currentTime);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentSessionTime(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, pageStartTime]);

  // Calculate session statistics
  useEffect(() => {
    const totalTime = getTotalTime();
    const pagesWithTime = Object.keys(pageTimes).length;
    const averageTime = pagesWithTime > 0 ? totalTime / pagesWithTime : 0;

    setSessionData(prev => ({
      ...prev,
      totalTime,
      pagesRead: pagesWithTime,
      averageTimePerPage: averageTime
    }));
  }, [pageTimes, getTotalTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    isTracking,
    currentSessionTime,
    pageTimes,
    sessionData,

    // Actions
    startPageTimer,
    stopPageTimer,
    resetTimingData,
    getPageTime,
    getTotalTime
  };
};
