import { useState, useCallback } from 'react';

export const usePDFViewer = () => {
  const [currentPDF, setCurrentPDF] = useState(null);
  const [readingTime, setReadingTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const handlePDFLoad = useCallback((file) => {
    setCurrentPDF(file);
    setCurrentPage(1);
    setReadingTime(0);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleTimeTrack = useCallback((event, data) => {
    // Integrate with your existing time tracking logic
    console.log('PDF Event:', event, data);
  }, []);

  return {
    currentPDF,
    readingTime,
    currentPage,
    handlePDFLoad,
    handlePageChange,
    handleTimeTrack,
  };
};
