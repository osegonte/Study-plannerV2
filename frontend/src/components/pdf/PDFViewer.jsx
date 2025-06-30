import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, FileText, ZoomIn, ZoomOut, Save, Play, Pause, RefreshCw } from 'lucide-react';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import { pdfFileHandler, PDFErrorHandler } from '../../utils/pdfFileHandler';
import ReadingTimer from '../timer/ReadingTimer';
import TimeTrackingStats from '../timer/TimeTrackingStats';
import ReadingEstimates from '../timer/ReadingEstimates';
import ReadingSpeedIndicator from '../timer/ReadingSpeedIndicator';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer = ({ file, documentId, topicId, fileName, onBack }) => {
  const [pdfData, setPdfData] = useState(null);
  const [fileKey, setFileKey] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { updateDocumentProgress, updateDocumentPageTimes, getDocumentById, updateDocumentCacheKey } = useStudyPlanner();

  // Get existing document data
  const existingDocument = documentId ? getDocumentById(documentId) : null;
  const initialPageTimes = existingDocument?.pageTimes || {};

  // Time tracking with existing data
  const {
    isTracking,
    currentSessionTime,
    pageTimes,
    sessionData,
    startPageTimer,
    stopPageTimer,
    resetTimingData,
    getPageTime
  } = useTimeTracking(initialPageTimes);

  // Enhanced file processing with retry logic
  useEffect(() => {
    const processFileForViewing = async () => {
      if (!file) return;

      // Check if document already has a cache key and it's still valid
      if (existingDocument?.cacheKey && pdfFileHandler.hasFile(existingDocument.cacheKey)) {
        console.log('📄 Using existing cache key:', existingDocument.cacheKey);
        setFileKey(existingDocument.cacheKey);
        
        try {
          const stableData = pdfFileHandler.getStableFileData(existingDocument.cacheKey);
          if (stableData) {
            setPdfData(stableData);
            return;
          }
        } catch (error) {
          console.warn('⚠️ Existing cache key failed, reprocessing file');
        }
      }

      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Processing file for viewing:', file.name || 'uploaded-file.pdf');
        
        // Process the file with enhanced buffer handling
        const cacheKey = await pdfFileHandler.processFile(file);
        setFileKey(cacheKey);
        
        // Get stable data for PDF viewing
        const stableData = pdfFileHandler.getStableFileData(cacheKey);
        if (!stableData) {
          throw new Error('Failed to create stable file data');
        }
        
        setPdfData(stableData);
        
        // Save cache key to document if we have a document ID
        if (documentId && updateDocumentCacheKey) {
          updateDocumentCacheKey(documentId, cacheKey);
        }
        
        console.log('✅ File ready for viewing');
        setRetryCount(0); // Reset retry count on success
        
      } catch (error) {
        console.error('❌ Error processing file:', error);
        
        // Check if we should retry for buffer detachment errors
        if (PDFErrorHandler.shouldRetry(error) && retryCount < 3) {
          console.log(`🔄 Retrying file processing (attempt ${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
          
          // Clear any cached data and retry
          if (fileKey) {
            pdfFileHandler.removeFile(fileKey);
          }
          
          setTimeout(() => {
            processFileForViewing();
          }, 1000 * (retryCount + 1)); // Exponential backoff
          
          return;
        }
        
        setError(PDFErrorHandler.getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    processFileForViewing();
  }, [file, retryCount]);

  // Initialize page number from existing document
  useEffect(() => {
    if (existingDocument && existingDocument.currentPage) {
      setPageNumber(existingDocument.currentPage);
      console.log(`📖 Loaded document at page ${existingDocument.currentPage}`);
    }
  }, [existingDocument]);

  // PDF document load success with enhanced error handling
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log(`📄 PDF loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    setRetryCount(0);
    
    // Update document with page count
    if (documentId) {
      updateDocumentProgress(documentId, pageNumber, numPages);
    }
    
    // Start timing for current page after a brief delay
    setTimeout(() => {
      startPageTimer(pageNumber, fileName);
    }, 100);
  }, [documentId, pageNumber, updateDocumentProgress, startPageTimer, fileName]);

  // Enhanced PDF document load error handling
  const onDocumentLoadError = useCallback((error) => {
    console.error('📄 PDF load error:', error);
    
    // Check if it's a buffer detachment error
    if (PDFErrorHandler.shouldRetry(error) && retryCount < 3) {
      console.log(`🔄 Retrying PDF load due to buffer error (attempt ${retryCount + 1}/3)`);
      setRetryCount(prev => prev + 1);
      
      // Try to refresh the buffer
      if (fileKey && file) {
        pdfFileHandler.refreshBuffer(fileKey, file).then(() => {
          const refreshedData = pdfFileHandler.getStableFileData(fileKey);
          if (refreshedData) {
            setPdfData(refreshedData);
          }
        });
      }
      
      return;
    }
    
    setError(PDFErrorHandler.getErrorMessage(error));
    setLoading(false);
    stopPageTimer();
  }, [stopPageTimer, retryCount, fileKey, file]);

  // Manual retry function
  const handleRetry = () => {
    if (file) {
      setRetryCount(0);
      setError(null);
      
      // Clear existing cache
      if (fileKey) {
        pdfFileHandler.removeFile(fileKey);
        setFileKey(null);
      }
      
      setPdfData(null);
      
      // Trigger reprocessing
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 100);
    }
  };

  // Handle page navigation with proper timer management
  const navigateToPage = useCallback((newPage) => {
    if (newPage === pageNumber || isPageChanging) return;
    
    console.log(`🔄 Navigating from page ${pageNumber} to page ${newPage}`);
    setIsPageChanging(true);
    
    // Stop current timer and save time
    stopPageTimer();
    
    // Update page number
    setPageNumber(newPage);
    
    // Update document progress
    if (documentId) {
      updateDocumentProgress(documentId, newPage, numPages);
    }
    
    // Start timer for new page after a brief delay
    setTimeout(() => {
      startPageTimer(newPage, fileName);
      setIsPageChanging(false);
    }, 100);
  }, [pageNumber, isPageChanging, stopPageTimer, documentId, numPages, updateDocumentProgress, startPageTimer, fileName]);

  const goToPrevPage = useCallback(() => {
    const newPage = Math.max(pageNumber - 1, 1);
    navigateToPage(newPage);
  }, [pageNumber, navigateToPage]);

  const goToNextPage = useCallback(() => {
    const newPage = Math.min(pageNumber + 1, numPages || 1);
    navigateToPage(newPage);
  }, [pageNumber, numPages, navigateToPage]);

  const goToPage = useCallback((page) => {
    const pageNum = parseInt(page);
    if (pageNum >= 1 && pageNum <= numPages) {
      navigateToPage(pageNum);
    }
  }, [numPages, navigateToPage]);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  // Save reading progress
  const saveProgress = useCallback(() => {
    if (documentId && Object.keys(pageTimes).length > 0) {
      updateDocumentPageTimes(documentId, pageTimes);
      console.log(`💾 Progress saved for ${fileName}: ${Object.keys(pageTimes).length} pages`);
    }
  }, [documentId, pageTimes, updateDocumentPageTimes, fileName]);

  // Manual timer control
  const toggleTimer = () => {
    if (isTracking) {
      stopPageTimer();
    } else {
      startPageTimer(pageNumber, fileName);
    }
  };

  // Auto-save progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(pageTimes).length > 0) {
        saveProgress();
      }
    }, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [saveProgress, pageTimes]);

  // Handle browser tab visibility for accurate timing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Tab hidden - stopping timer');
        stopPageTimer();
        saveProgress();
      } else if (pdfData && numPages && !isPageChanging) {
        console.log('👁️ Tab visible - starting timer');
        startPageTimer(pageNumber, fileName);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pdfData, numPages, pageNumber, startPageTimer, stopPageTimer, saveProgress, fileName, isPageChanging]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 PDF Viewer cleanup');
      stopPageTimer();
      saveProgress();
    };
  }, [stopPageTimer, saveProgress]);

  if (!pdfData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {loading ? 'Processing PDF...' : 'No PDF File'}
          </h2>
          <p className="text-gray-500">
            {loading ? 'Please wait while we prepare your PDF for viewing' : 'Please select a PDF file to start reading.'}
          </p>
          {loading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
          {retryCount > 0 && (
            <p className="text-yellow-600 text-sm mt-2">
              Retry attempt {retryCount}/3...
            </p>
          )}
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
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-800 font-medium">PDF Loading Error</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                    {PDFErrorHandler.shouldRetry({message: error}) && (
                      <p className="text-red-500 text-xs mt-2">
                        This might be a temporary issue. Try refreshing the file.
                      </p>
                    )}
                  </div>
                  {PDFErrorHandler.shouldRetry({message: error}) && (
                    <button
                      onClick={handleRetry}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">
                  {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Loading PDF...'}
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm">
              {/* Enhanced Toolbar */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    {/* Navigation Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1 || isPageChanging}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={numPages || 1}
                          value={pageNumber}
                          onChange={(e) => goToPage(e.target.value)}
                          disabled={isPageChanging}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          title="Go to page"
                        />
                        <span className="text-gray-600">of {numPages || '?'}</span>
                        {isPageChanging && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= (numPages || 1) || isPageChanging}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Timer Control */}
                    <div className="flex items-center space-x-2 border-l pl-4">
                      <button
                        onClick={toggleTimer}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm ${
                          isTracking 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={isTracking ? "Stop timer" : "Start timer"}
                      >
                        {isTracking ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        <span>Timer</span>
                      </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center space-x-2 border-l pl-4">
                      <button
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Zoom out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      
                      <span className="text-sm text-gray-600 min-w-12 text-center">
                        {Math.round(scale * 100)}%
                      </span>
                      
                      <button
                        onClick={zoomIn}
                        disabled={scale >= 3.0}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Zoom in"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Page Time Display */}
                    {getPageTime(pageNumber) > 0 && (
                      <div className="border-l pl-4">
                        <span className="text-sm text-gray-600">
                          This page: {Math.floor(getPageTime(pageNumber) / 60)}m {getPageTime(pageNumber) % 60}s
                        </span>
                      </div>
                    )}
                  </div>

                  {/* File Actions */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={saveProgress}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      title="Save progress"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{fileName}</span>
                    </div>

                    {onBack && (
                      <button
                        onClick={onBack}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        ← Back
                      </button>
                    )}
                  </div>
                </div>

                {/* Reading Speed Indicator */}
                <ReadingSpeedIndicator 
                  pageTimes={pageTimes}
                  totalPages={numPages || 0}
                  currentPage={pageNumber}
                />
              </div>

              {/* PDF Display Area */}
              <div className="p-6">
                <div className="bg-gray-100 rounded-lg min-h-96 flex items-center justify-center overflow-auto">
                  <Document
                    file={pdfData}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    options={{
                      disableTextLayer: true,
                      disableAnnotationLayer: true,
                      cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                      cMapPacked: true,
                    }}
                    loading={
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 mt-2">Loading PDF document...</p>
                        {retryCount > 0 && (
                          <p className="text-yellow-600 text-sm">Retry {retryCount}/3</p>
                        )}
                      </div>
                    }
                    error={
                      <div className="text-center py-12">
                        <div className="text-red-600 mb-2">❌ Failed to load PDF</div>
                        <p className="text-gray-600 text-sm mb-4">Please try refreshing or uploading a different file</p>
                        <button
                          onClick={handleRetry}
                          className="flex items-center space-x-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors mx-auto"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Retry Loading</span>
                        </button>
                      </div>
                    }
                    className="react-pdf__Document"
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={
                        <div className="bg-white shadow-lg rounded border p-8 animate-pulse">
                          <div className="h-96 bg-gray-200 rounded"></div>
                        </div>
                      }
                      className="react-pdf__Page shadow-lg rounded"
                      canvasBackground="white"
                    />
                  </Document>
                </div>
              </div>

              {/* Progress Bar */}
              {numPages && (
                <div className="border-t px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Reading Progress</span>
                    <span className="text-sm font-medium text-gray-800">
                      {Math.round((pageNumber / numPages) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(pageNumber / numPages) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Page 1</span>
                    <span>Page {numPages}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar with Timer and Stats */}
          <div className="w-80 space-y-4">
            <ReadingTimer
              isTracking={isTracking}
              currentSessionTime={currentSessionTime}
              sessionData={sessionData}
              onReset={resetTimingData}
              currentPage={pageNumber}
            />
            
            <ReadingEstimates
              pageTimes={pageTimes}
              currentPage={pageNumber}
              totalPages={numPages || 0}
              sessionData={sessionData}
            />
            
            <TimeTrackingStats
              pageTimes={pageTimes}
              sessionData={sessionData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
