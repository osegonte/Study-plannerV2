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

// 🔧 Verify worker is set correctly
console.log('📄 PDFViewer - Current worker:', pdfjs.GlobalWorkerOptions.workerSrc);

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
  const [debugInfo, setDebugInfo] = useState({});

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

  // 🔍 ENHANCED DEBUG LOGGING
  useEffect(() => {
    const debug = {
      file: file ? { name: file.name, size: file.size, type: file.type } : null,
      pdfData: pdfData ? { 
        type: typeof pdfData, 
        size: pdfData.byteLength || pdfData.length,
        isArrayBuffer: pdfData instanceof ArrayBuffer,
        isUint8Array: pdfData instanceof Uint8Array,
        constructor: pdfData.constructor.name
      } : null,
      fileKey,
      error,
      loading,
      worker: pdfjs.GlobalWorkerOptions.workerSrc,
      pdfFileHandlerAvailable: typeof pdfFileHandler !== 'undefined',
      pdfFileHandlerMethods: typeof pdfFileHandler === 'object' ? Object.keys(pdfFileHandler) : [],
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(debug);
    console.log('🔍 PDFViewer Debug Info:', debug);
  }, [file, pdfData, fileKey, error, loading]);

  // Enhanced file processing with multiple fallback strategies
  useEffect(() => {
    const processFileForViewing = async () => {
      if (!file) return;

      console.log('🔄 Starting file processing for:', file.name);
      setLoading(true);
      setError(null);

      try {
        // Strategy 1: Try enhanced file handler
        if (typeof pdfFileHandler !== 'undefined' && pdfFileHandler.processFile) {
          console.log('📄 Trying Strategy 1: Enhanced file handler...');
          
          try {
            const cacheKey = await pdfFileHandler.processFile(file);
            console.log('✅ File handler processed successfully:', cacheKey);
            setFileKey(cacheKey);
            
            const stableData = pdfFileHandler.getStableFileData(cacheKey);
            if (stableData) {
              console.log('✅ Stable data created:', stableData.constructor.name, stableData.length || stableData.byteLength);
              setPdfData(stableData);
              
              if (documentId && updateDocumentCacheKey) {
                updateDocumentCacheKey(documentId, cacheKey);
              }
              
              setLoading(false);
              return;
            } else {
              throw new Error('Failed to create stable file data');
            }
          } catch (handlerError) {
            console.warn('⚠️ File handler failed, trying fallback:', handlerError.message);
          }
        } else {
          console.warn('⚠️ File handler not available, using fallback');
        }

        // Strategy 2: Direct ArrayBuffer conversion
        console.log('📄 Trying Strategy 2: Direct ArrayBuffer...');
        
        const arrayBuffer = await file.arrayBuffer();
        console.log('✅ ArrayBuffer created:', arrayBuffer.byteLength, 'bytes');
        
        // Create stable Uint8Array
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log('✅ Uint8Array created:', uint8Array.length, 'bytes');
        
        setPdfData(uint8Array);
        setLoading(false);
        console.log('✅ File ready for viewing via direct conversion');
        
      } catch (error) {
        console.error('❌ All file processing strategies failed:', error);
        setError(`File processing failed: ${error.message}`);
        setLoading(false);
      }
    };

    processFileForViewing();
  }, [file, documentId, updateDocumentCacheKey]);

  // Initialize page number from existing document
  useEffect(() => {
    if (existingDocument && existingDocument.currentPage) {
      setPageNumber(existingDocument.currentPage);
      console.log(`📖 Loaded document at page ${existingDocument.currentPage}`);
    }
  }, [existingDocument]);

  // Enhanced PDF document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log('✅ PDF LOAD SUCCESS:', { 
      numPages, 
      pdfDataType: typeof pdfData, 
      pdfDataSize: pdfData?.byteLength || pdfData?.length,
      fileName 
    });
    
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
  }, [documentId, pageNumber, updateDocumentProgress, startPageTimer, fileName, pdfData]);

  // Enhanced PDF document load error handling
  const onDocumentLoadError = useCallback((error) => {
    console.error('❌ PDF LOAD ERROR:', {
      error: error.message,
      stack: error.stack,
      pdfDataType: typeof pdfData,
      pdfDataSize: pdfData?.byteLength || pdfData?.length,
      pdfData: pdfData,
      fileName,
      worker: pdfjs.GlobalWorkerOptions.workerSrc
    });
    
    setError(`PDF Load Error: ${error.message}`);
    setLoading(false);
    stopPageTimer();
  }, [stopPageTimer, pdfData, fileName]);

  // Manual retry function with enhanced strategies
  const handleRetry = () => {
    console.log('🔄 Manual retry initiated');
    
    if (file) {
      setRetryCount(prev => prev + 1);
      setError(null);
      
      // Clear existing cache
      if (fileKey && pdfFileHandler?.removeFile) {
        pdfFileHandler.removeFile(fileKey);
        setFileKey(null);
      }
      
      setPdfData(null);
      
      // Trigger reprocessing with delay
      setTimeout(() => {
        console.log(`🔄 Retry attempt ${retryCount + 1}`);
        // The useEffect will handle reprocessing
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
        <div className="text-center max-w-2xl">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {loading ? 'Processing PDF...' : 'No PDF File'}
          </h2>
          <p className="text-gray-500 mb-4">
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
          
          {/* Enhanced Debug Info */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="font-semibold text-gray-800 mb-2">🔍 Debug Information</h3>
            <div className="space-y-1 text-xs text-gray-600 font-mono">
              <div><strong>Worker:</strong> {pdfjs.GlobalWorkerOptions.workerSrc}</div>
              <div><strong>File:</strong> {debugInfo.file?.name || 'None'} ({debugInfo.file?.size || 0} bytes)</div>
              <div><strong>PDF Data:</strong> {debugInfo.pdfData?.type || 'None'} ({debugInfo.pdfData?.size || 0} bytes)</div>
              <div><strong>File Handler:</strong> {debugInfo.pdfFileHandlerAvailable ? '✅ Available' : '❌ Missing'}</div>
              <div><strong>Error:</strong> {error || 'None'}</div>
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            </div>
            
            {error && (
              <button
                onClick={handleRetry}
                className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
              >
                🔄 Retry
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
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-800 font-medium">PDF Loading Error</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                    <details className="mt-2">
                      <summary className="text-red-500 text-xs cursor-pointer">Debug Details</summary>
                      <pre className="text-xs text-red-500 mt-1 overflow-auto">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Retry</span>
                  </button>
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
                    onLoadProgress={(progressData) => {
                      console.log('📊 PDF LOAD PROGRESS:', progressData);
                    }}
                    options={{
                      disableTextLayer: true,
                      disableAnnotationLayer: true,
                      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                      cMapPacked: true,
                      verbosity: 1, // Enable verbose logging
                    }}
                    loading={
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 mt-2">Loading PDF document...</p>
                        <div className="mt-4 text-xs text-gray-500 space-y-1">
                          <p><strong>File:</strong> {fileName}</p>
                          <p><strong>Data Type:</strong> {typeof pdfData}</p>
                          <p><strong>Data Size:</strong> {pdfData?.byteLength || pdfData?.length || 'unknown'} bytes</p>
                          <p><strong>Worker:</strong> {pdfjs.GlobalWorkerOptions.workerSrc}</p>
                        </div>
                        {retryCount > 0 && (
                          <p className="text-yellow-600 text-sm mt-2">Retry {retryCount}/3</p>
                        )}
                      </div>
                    }
                    error={
                      <div className="text-center py-12">
                        <div className="text-red-600 mb-2">❌ Failed to load PDF</div>
                        <p className="text-gray-600 text-sm mb-4">Check console for detailed error information</p>
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
                      onLoadSuccess={(page) => {
                        console.log('✅ PAGE LOAD SUCCESS:', { pageNumber, pageInfo: page });
                      }}
                      onLoadError={(error) => {
                        console.error('❌ PAGE LOAD ERROR:', { pageNumber, error: error.message });
                      }}
                      onRenderSuccess={() => {
                        console.log('✅ PAGE RENDER SUCCESS:', pageNumber);
                      }}
                      onRenderError={(error) => {
                        console.error('❌ PAGE RENDER ERROR:', { pageNumber, error: error.message });
                      }}
                      loading={
                        <div className="bg-white shadow-lg rounded border p-8 animate-pulse">
                          <div className="h-96 bg-gray-200 rounded"></div>
                          <div className="mt-2 text-center text-xs text-gray-500">
                            Loading page {pageNumber}...
                          </div>
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
