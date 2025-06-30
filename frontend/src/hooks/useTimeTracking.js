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
  const [debugInfo, setDebugInfo] = useState({
    lastUpdate: null,
    timerActive: false,
    currentPage: null
  });

  // Refs to avoid stale closures
  const intervalRef = useRef(null);
  const currentPageRef = useRef(null);
  const pageStartTimeRef = useRef(null);
  const isTrackingRef = useRef(false);

  // Debug logging function
  const debugLog = useCallback((message, data = {}) => {
    console.log(`🕒 Timer Debug: ${message}`, data);
    setDebugInfo(prev => ({
      ...prev,
      lastUpdate: new Date().toLocaleTimeString(),
      ...data
    }));
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    isTrackingRef.current = isTracking;
    debugLog('Tracking state changed', { isTracking });
  }, [isTracking, debugLog]);

  useEffect(() => {
    pageStartTimeRef.current = pageStartTime;
    debugLog('Page start time updated', { pageStartTime });
  }, [pageStartTime, debugLog]);

  // Initialize with existing page times
  useEffect(() => {
    if (initialPageTimes && Object.keys(initialPageTimes).length > 0) {
      setPageTimes(prev => ({
        ...prev,
        ...initialPageTimes
      }));
      debugLog('Initialized with existing page times', { 
        count: Object.keys(initialPageTimes).length,
        pages: Object.keys(initialPageTimes)
      });
    }
  }, [debugLog]);

  // Start tracking time for a specific page
  const startPageTimer = useCallback((pageNumber, fileName = null) => {
    debugLog(`Starting timer for page ${pageNumber}`, { pageNumber, fileName });
    
    // Save time for previous page if timer was running
    if (currentPageRef.current && pageStartTimeRef.current && isTrackingRef.current) {
      const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      if (timeSpent > 0) {
        debugLog(`Saving time for previous page`, { 
          page: currentPageRef.current, 
          timeSpent,
          timeSpentFormatted: `${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`
        });
        
        setPageTimes(prev => {
          const newTimes = {
            ...prev,
            [currentPageRef.current]: (prev[currentPageRef.current] || 0) + timeSpent
          };
          debugLog('Updated page times', { 
            page: currentPageRef.current,
            newTime: newTimes[currentPageRef.current],
            totalPages: Object.keys(newTimes).length
          });
          return newTimes;
        });
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

    debugLog(`Timer started successfully`, {
      page: pageNumber,
      startTime: new Date(startTime).toLocaleTimeString(),
      fileName
    });
  }, [debugLog]);

  // Stop tracking time
  const stopPageTimer = useCallback(() => {
    debugLog('Stopping page timer', { 
      currentPage: currentPageRef.current,
      wasTracking: isTrackingRef.current 
    });
    
    if (currentPageRef.current && pageStartTimeRef.current && isTrackingRef.current) {
      const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      if (timeSpent > 0) {
        debugLog(`Final save before stop`, { 
          page: currentPageRef.current, 
          timeSpent,
          timeSpentFormatted: `${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`
        });
        
        setPageTimes(prev => {
          const newTimes = {
            ...prev,
            [currentPageRef.current]: (prev[currentPageRef.current] || 0) + timeSpent
          };
          debugLog('Final page times update', { 
            page: currentPageRef.current,
            finalTime: newTimes[currentPageRef.current],
            totalPages: Object.keys(newTimes).length
          });
          return newTimes;
        });
      }
    }

    setIsTracking(false);
    isTrackingRef.current = false;
    setPageStartTime(null);
    pageStartTimeRef.current = null;
    setCurrentSessionTime(0);

    debugLog('Timer stopped successfully');
  }, [debugLog]);

  // Reset all timing data
  const resetTimingData = useCallback(() => {
    debugLog('Resetting all timing data');
    
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
    
    debugLog('All timing data reset');
  }, [debugLog]);

  // Get time spent on a specific page
  const getPageTime = useCallback((pageNumber) => {
    const time = pageTimes[pageNumber] || 0;
    debugLog(`Page time requested`, { page: pageNumber, time });
    return time;
  }, [pageTimes, debugLog]);

  // Get total reading time
  const getTotalTime = useCallback(() => {
    const total = Object.values(pageTimes).reduce((sum, time) => sum + time, 0);
    debugLog(`Total time calculated`, { total, pagesCount: Object.keys(pageTimes).length });
    return total;
  }, [pageTimes, debugLog]);

  // Update current session time every second when tracking
  useEffect(() => {
    if (isTracking && pageStartTime) {
      debugLog('Starting session timer interval');
      
      intervalRef.current = setInterval(() => {
        if (pageStartTimeRef.current && isTrackingRef.current) {
          const currentTime = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
          setCurrentSessionTime(currentTime);
          
          // Debug every 10 seconds to avoid spam
          if (currentTime % 10 === 0) {
            debugLog('Session timer update', { 
              currentTime,
              formatted: `${Math.floor(currentTime / 60)}m ${currentTime % 60}s`,
              page: currentPageRef.current
            });
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        debugLog('Clearing session timer interval');
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
  }, [isTracking, pageStartTime, debugLog]);

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

    debugLog('Session stats updated', {
      totalTime,
      pagesRead: pagesWithTime,
      averageTime: Math.round(averageTime),
      hasData: totalTime > 0
    });
  }, [pageTimes, getTotalTime, debugLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debugLog('Cleaning up useTimeTracking');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Save any remaining time before unmount
      if (currentPageRef.current && pageStartTimeRef.current && isTrackingRef.current) {
        const timeSpent = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
        if (timeSpent > 0) {
          debugLog(`Final cleanup save`, { 
            page: currentPageRef.current, 
            timeSpent 
          });
        }
      }
    };
  }, [debugLog]);

  return {
    // State
    isTracking,
    currentSessionTime,
    pageTimes,
    sessionData,
    debugInfo, // Added for debugging

    // Actions
    startPageTimer,
    stopPageTimer,
    resetTimingData,
    getPageTime,
    getTotalTime
  };
};
