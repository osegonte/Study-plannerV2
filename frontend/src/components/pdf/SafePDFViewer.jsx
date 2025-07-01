import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Play, Pause, FileText, Clock } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const SafePDFViewer = ({ documentId, topicId, fileName, startPage = 1, onBack }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(startPage);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Timer state
  const [isTracking, setIsTracking] = useState(false);
  const [currentPageTime, setCurrentPageTime] = useState(0);
  const [pageTimes, setPageTimes] = useState({});
  
  const intervalRef = useRef(null);
  const { updateDocumentProgress, updateDocumentPageTimes, getDocumentById } = useStudyPlanner();
  
  // Get document data
  const document = getDocumentById(documentId);
  
  useEffect(() => {
    if (document?.pageTimes) {
      setPageTimes(document.pageTimes);
    }
  }, [document]);

  // Timer functionality
  const startTimer = useCallback(() => {
    if (!isTracking) {
      setIsTracking(true);
      setCurrentPageTime(0);
      
      intervalRef.current = setInterval(() => {
        setCurrentPageTime(prev => prev + 1);
      }, 1000);
    }
  }, [isTracking]);

  const stopTimer = useCallback(() => {
    if (isTracking) {
      setIsTracking(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Save the time for current page
      if (currentPageTime > 0) {
        const newPageTimes = {
          ...pageTimes,
          [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTime
        };
        setPageTimes(newPageTimes);
        updateDocumentPageTimes(documentId, newPageTimes);
      }
    }
  }, [isTracking, currentPageTime, pageNumber, pageTimes, documentId, updateDocumentPageTimes]);

  // Page navigation
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= numPages && newPage !== pageNumber) {
      // Save current page time before switching
      if (isTracking && currentPageTime > 0) {
        const newPageTimes = {
          ...pageTimes,
          [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTime
        };
        setPageTimes(newPageTimes);
        updateDocumentPageTimes(documentId, newPageTimes);
      }
      
      setPageNumber(newPage);
      setCurrentPageTime(0);
      updateDocumentProgress(documentId, newPage, numPages);
      
      // Restart timer for new page
      if (isTracking) {
        startTimer();
      }
    }
  }, [pageNumber, numPages, isTracking, currentPageTime, pageTimes, documentId, updateDocumentProgress, updateDocumentPageTimes, startTimer]);

  const goToPrevPage = () => goToPage(pageNumber - 1);
  const goToNextPage = () => goToPage(pageNumber + 1);

  // Auto-start timer when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      startTimer();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      stopTimer();
    };
  }, [startTimer, stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calculate statistics
  const totalTimeSpent = Object.values(pageTimes).reduce((sum, time) => sum + time, 0) + currentPageTime;
  const pagesRead = Object.keys(pageTimes).length + (currentPageTime > 0 ? 1 : 0);
  const avgTimePerPage = pagesRead > 0 ? totalTimeSpent / pagesRead : 0;
  const readingSpeed = avgTimePerPage > 0 ? 3600 / avgTimePerPage : 0;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    updateDocumentProgress(documentId, pageNumber, numPages);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF loading error:', error);
    setError('Failed to load PDF. Using demo mode.');
    setLoading(false);
    // Set demo values
    setNumPages(10);
    updateDocumentProgress(documentId, pageNumber, 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-600">Loading PDF...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main PDF Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Header */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {onBack && (
                      <button
                        onClick={onBack}
                        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                      </button>
                    )}
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">{fileName}</h1>
                      <p className="text-sm text-gray-600">Page {pageNumber} of {numPages}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Timer Status */}
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 px-3 py-1 rounded-lg ${
                        isTracking ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isTracking ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                        <span className="text-sm font-mono">{formatTime(currentPageTime)}</span>
                      </div>
                      <button
                        onClick={isTracking ? stopTimer : startTimer}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        {isTracking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Navigation */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={numPages}
                          value={pageNumber}
                          onChange={(e) => goToPage(parseInt(e.target.value))}
                          className="w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-600">of {numPages}</span>
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center space-x-2 border-l pl-4">
                      <button
                        onClick={() => setScale(Math.max(0.5, scale - 0.2))}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-gray-600 min-w-12 text-center">
                        {Math.round(scale * 100)}%
                      </span>
                      <button
                        onClick={() => setScale(Math.min(3.0, scale + 0.2))}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {Math.round((pageNumber / numPages) * 100)}% Complete
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(pageNumber / numPages) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Display */}
              <div className="p-6">
                <div className="bg-gray-100 rounded-lg overflow-hidden flex justify-center min-h-96">
                  {error ? (
                    <div className="flex items-center justify-center w-full">
                      <div className="text-center p-8">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Demo Mode</h3>
                        <p className="text-gray-600 mb-4">PDF viewer is running in demo mode</p>
                        <p className="text-sm text-gray-500">File: {fileName}</p>
                        <p className="text-sm text-gray-500">Page: {pageNumber} of {numPages}</p>
                      </div>
                    </div>
                  ) : (
                    <Document
                      file={`/sample_pdfs/${fileName}`}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Loading PDF...</p>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-4">
            {/* Timer Stats */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Reading Stats</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Page:</span>
                  <span className="font-medium">{formatTime(currentPageTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-medium">{formatTime(totalTimeSpent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pages Read:</span>
                  <span className="font-medium">{pagesRead}</span>
                </div>
                {avgTimePerPage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg/Page:</span>
                    <span className="font-medium">{formatTime(Math.round(avgTimePerPage))}</span>
                  </div>
                )}
                {readingSpeed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speed:</span>
                    <span className="font-medium">{readingSpeed.toFixed(1)} p/h</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafePDFViewer;
