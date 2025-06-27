import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimeTracking = (initialPageTimes = {}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [pageStartTime, setPageStartTime] = useState(null);
  const [pageTimes, setPageTimes] = useState(initialPageTimes);
  const [sessionData, setSessionData] = useState({
    totalTime: 0,
    pagesRead: 0,
    averageTimePerPage: 0,
    currentFileName: null
  });

  // Refs to avoid stale closures
  const intervalRef = useRef(null);
  const currentPageRef = useRef(null);
  const pageStartTimeRef = useRef(null);
  const isTrackingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    pageStartTimeRef.current = pageStartTime;
  }, [pageStartTime]);

  // Initialize with existing page times
  useEffect(() => {
    if (initialPageTimes && Object.keys(initialPageTimes).length > 0) {
      setPageTimes(prev => ({
        ...prev,
        ...initialPageTimes
      }));
      console.log('📚 Initialized with existing page times:', initialPageTimes);
    }
  }, []);

  // Start tracking time for a specific page
  const startPageTimer = useCallback((pageNumber, fileName = null) => {
    console.log(`🎯 Starting timer for page ${pageNumber}`);
    
    // Save time for previous page if timer was running
    if (currentPageRef.current && pageStartTimeRef.current && isTrackingRef.current) {
      const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      if (timeSpent > 0) {
        console.log(`⏱️ Saving ${timeSpent}s for previous page ${currentPageRef.current}`);
        setPageTimes(prev => ({
          ...prev,
          [currentPageRef.current]: (prev[currentPageRef.current] || 0) + timeSpent
        }));
      }
    }

    // Start timer for new page
    const startTime = Date.now();
    currentPageRef.current = pageNumber;
    setPageStartTime(startTime);
    pageStartTimeRef.current = startTime;
    setIsTracking(true);
    isTrackingRef.current = true;
    setCurrentSessionTime(0);

    // Update session data
    if (fileName) {
      setSessionData(prev => ({
        ...prev,
        currentFileName: fileName
      }));
    }

    console.log(`✅ Timer started for page ${pageNumber} at ${new Date(startTime).toLocaleTimeString()}`);
  }, []);

  // Stop tracking time
  const stopPageTimer = useCallback(() => {
    console.log('🛑 Stopping page timer');
    
    if (currentPageRef.current && pageStartTimeRef.current && isTrackingRef.current) {
      const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      if (timeSpent > 0) {
        console.log(`⏱️ Saving ${timeSpent}s for page ${currentPageRef.current}`);
        setPageTimes(prev => ({
          ...prev,
          [currentPageRef.current]: (prev[currentPageRef.current] || 0) + timeSpent
        }));
      }
    }

    setIsTracking(false);
    isTrackingRef.current = false;
    setPageStartTime(null);
    pageStartTimeRef.current = null;
    setCurrentSessionTime(0);

    console.log('✅ Timer stopped and time saved');
  }, []);

  // Reset all timing data
  const resetTimingData = useCallback(() => {
    console.log('🔄 Resetting all timing data');
    
    // Stop current timer
    setIsTracking(false);
    isTrackingRef.current = false;
    setPageStartTime(null);
    pageStartTimeRef.current = null;
    currentPageRef.current = null;
    
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Reset all data
    setPageTimes({});
    setCurrentSessionTime(0);
    setSessionData({
      totalTime: 0,
      pagesRead: 0,
      averageTimePerPage: 0,
      currentFileName: null
    });
    
    console.log('✅ All timing data reset');
  }, []);

  // Get time spent on a specific page
  const getPageTime = useCallback((pageNumber) => {
    return pageTimes[pageNumber] || 0;
  }, [pageTimes]);

  // Get total reading time
  const getTotalTime = useCallback(() => {
    return Object.values(pageTimes).reduce((total, time) => total + time, 0);
  }, [pageTimes]);

  // Update current session time every second when tracking
  useEffect(() => {
    if (isTracking && pageStartTime) {
      intervalRef.current = setInterval(() => {
        if (pageStartTimeRef.current && isTrackingRef.current) {
          const currentTime = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
          setCurrentSessionTime(currentTime);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (!isTracking) {
        setCurrentSessionTime(0);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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
      console.log('🧹 Cleaning up useTimeTracking');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Save any remaining time before unmount
      if (currentPageRef.current && pageStartTimeRef.current && isTrackingRef.current) {
        const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
        if (timeSpent > 0) {
          console.log(`💾 Final save: ${timeSpent}s for page ${currentPageRef.current}`);
        }
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