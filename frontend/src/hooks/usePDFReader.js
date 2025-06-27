import { useState } from 'react';

// Custom hook for PDF reading functionality
export const usePDFReader = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Hook implementation will be expanded in future stages
  
  return {
    currentPage,
    totalPages,
    setCurrentPage,
    setTotalPages
  };
};
