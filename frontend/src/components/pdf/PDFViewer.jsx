import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, FileText, ZoomIn, ZoomOut, Save, Play, Pause, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import ReadingTimer from '../timer/ReadingTimer';
import TimeTrackingStats from '../timer/TimeTrackingStats';
import ReadingEstimates from '../timer/ReadingEstimates';
import ReadingSpeedIndicator from '../timer/ReadingSpeedIndicator';

// Worker configuration
const configureWorker = () => {
  const workerUrls = [
    '/pdf.worker.min.js',
    `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
  ];
  
  for (const url of workerUrls) {
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = url;
      break;
    } catch (error) {
      console.warn('Worker URL failed:', url);
    }
  }
};

configureWorker();

const PDFViewer = ({ file, documentId, topicId, fileName, onBack }) => {
  const [pdfData, setPdfData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { updateDocumentProgress, updateDocumentPageTimes, getDocumentById } = useStudyPlanner();

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

  // Enhanced ArrayBuffer creation with multiple strategies
  const createStableArrayBuffer = useCallback(async (file) => {
    const strategies = [
      // Strategy 1: FileReader with ArrayBuffer
      async () => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const buffer = e.target.result;
              if (!(buffer instanceof ArrayBuffer)) {
                throw new Error('Not an ArrayBuffer');
              }
              const stable = buffer.slice();
              resolve(stable);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsArrayBuffer(file);
        });
      },
      
      // Strategy 2: Direct arrayBuffer() with immediate copy
      async () => {
        const buffer = await file.arrayBuffer();
        return buffer.slice();
      },
      
      // Strategy 3: Fetch blob URL
      async () => {
        const url = URL.createObjectURL(file);
        try {
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          return buffer.slice();
        } finally {
          URL.revokeObjectURL(url);
        }
      }
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        const result = await strategies[i]();
        if (result && result.byteLength > 0) {
          return result;
        }
      } catch (error) {
        if (i === strategies.length - 1) {
          throw new Error(`File processing failed: ${error.message}`);
        }
      }
    }
  }, []);

  // Enhanced file processing with retry logic
  const processFile = useCallback(async (inputFile) => {
    if (!inputFile || !(inputFile instanceof File)) {
      throw new Error('Invalid file object');
    }

    if (inputFile.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported');
    }

    if (inputFile.size > 100 * 1024 * 1024) {
      throw new Error('File size must be less than 100MB');
    }

    setLoading(true);
    setError(null);

    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const stableBuffer = await createStableArrayBuffer(inputFile);
        
        if (!stableBuffer || stableBuffer.byteLength === 0) {
          throw new Error('Created buffer is empty');
        }

        // Test PDF header
        const headerBytes = new Uint8Array(stableBuffer.slice(0, 5));
        const header = String.fromCharCode(...headerBytes);
        if (!header.startsWith('%PDF')) {
          throw new Error('Invalid PDF file format');
        }

        setPdfData(stableBuffer);
        setRetryCount(0);
        return stableBuffer;

      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
  }, [createStableArrayBuffer]);

  // Process file on mount or file change
  useEffect(() => {
    if (file) {
      processFile(file)
        .catch(error => {
          setError(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [file, processFile]);

  // Initialize page number from existing document
  useEffect(() => {
    if (existingDocument && existingDocument.currentPage) {
      setPageNumber(existingDocument.currentPage);
    }
  }, [existingDocument]);

  // PDF document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    setRetryCount(0);
    
    if (documentId) {
      updateDocumentProgress(documentId, pageNumber, numPages);
    }
    
    setTimeout(() => {
      startPageTimer(pageNumber, fileName);
    }, 100);
  }, [documentId, pageNumber, updateDocumentProgress, startPageTimer, fileName]);

  // Enhanced error handling
  const onDocumentLoadError = useCallback((error) => {
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('detached ArrayBuffer') || 
        errorMessage.includes('detached buffer')) {
      setError('File buffer was detached. Attempting to reload...');
      
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          if (file) {
            processFile(file);
          }
        }, 1000);
        return;
      }
    }
    
    setError(`PDF loading failed: ${errorMessage}`);
    setLoading(false);
    stopPageTimer();
  }, [stopPageTimer, file, processFile, retryCount]);

  // Manual retry function
  const handleRetry = useCallback(() => {
    if (file) {
      setError(null);
      setRetryCount(0);
      processFile(file);
    }
  }, [file, processFile]);

  // Handle page navigation
  const navigateToPage = useCallback((newPage) => {
    if (newPage === pageNumber || isPageChanging) return;
    
    setIsPageChanging(true);
    stopPageTimer();
    setPageNumber(newPage);
    
    if (documentId) {
      updateDocumentProgress(documentId, newPage, numPages);
    }
    
    setTimeout(() => {
      startPageTimer(newPage, fileName);
      setIsPageChanging(false);
    }, 100);
  }, [pageNumber, isPageChanging, stopPageTimer, documentId, numPages, updateDocumentProgress, startPageTimer, fileName]);

  const goToPrevPage = useCallback(() => {
    navigateToPage(Math.max(pageNumber - 1, 1));
  }, [pageNumber, navigateToPage]);

  const goToNextPage = useCallback(() => {
    navigateToPage(Math.min(pageNumber + 1, numPages || 1));
  }, [pageNumber, numPages, navigateToPage]);

  const goToPage = useCallback((page) => {
    const pageNum = parseInt(page);
    if (pageNum >= 1 && pageNum <= numPages) {
      navigateToPage(pageNum);
    }
  }, [numPages, navigateToPage]);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const saveProgress = useCallback(() => {
    if (documentId && Object.keys(pageTimes).length > 0) {
      updateDocumentPageTimes(documentId, pageTimes);
    }
  }, [documentId, pageTimes, updateDocumentPageTimes]);

  const toggleTimer = () => {
    if (isTracking) {
      stopPageTimer();
    } else {
      startPageTimer(pageNumber, fileName);
    }
  };

  // Auto-save and cleanup effects
  useEffect(() => {
    const interval = setInterval(saveProgress, 30000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPageTimer();
        saveProgress();
      } else if (pdfData && numPages && !isPageChanging) {
        startPageTimer(pageNumber, fileName);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pdfData, numPages, pageNumber, startPageTimer, stopPageTimer, saveProgress, fileName, isPageChanging]);

  useEffect(() => {
    return () => {
      stopPageTimer();
      saveProgress();
    };
  }, [stopPageTimer, saveProgress]);

  // Loading state
  if (loading || (!pdfData && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Loading PDF...</h2>
          <p className="text-gray-500">Please wait while we prepare your document</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !pdfData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Unable to Load PDF</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Try Again
            </button>
            
            {onBack && (
              <button
                onClick={onBack}
                className="block mx-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Upload
              </button>
            )}
          </div>
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
              {/* Toolbar */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    {/* Navigation Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1 || isPageChanging}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* File Actions */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={saveProgress}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
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
                    loading={
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 mt-2">Loading PDF...</p>
                      </div>
                    }
                    error={
                      <div className="text-center py-12">
                        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-red-600 mb-2">Failed to load PDF</p>
                        <button
                          onClick={handleRetry}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          <RefreshCw className="h-4 w-4 inline mr-1" />
                          Retry
                        </button>
                      </div>
                    }
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
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
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
