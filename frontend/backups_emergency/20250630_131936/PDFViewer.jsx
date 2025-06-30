import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, FileText, ZoomIn, ZoomOut, Save, Play, Pause, RefreshCw } from 'lucide-react';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import ReadingTimer from '../timer/ReadingTimer';
import TimeTrackingStats from '../timer/TimeTrackingStats';
import ReadingEstimates from '../timer/ReadingEstimates';
import ReadingSpeedIndicator from '../timer/ReadingSpeedIndicator';

// Verify worker is set correctly
console.log('📄 PDFViewer - Current worker:', pdfjs.GlobalWorkerOptions.workerSrc);

const PDFViewer = ({ file, documentId, topicId, fileName, onBack }) => {
  const [pdfData, setPdfData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [processingMethod, setProcessingMethod] = useState('');

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

  // EMERGENCY FIX: Direct file processing with multiple strategies
  useEffect(() => {
    const processFileEmergency = async () => {
      if (!file) {
        console.log('❌ No file provided');
        return;
      }

      console.log('🚨 EMERGENCY: Starting file processing for:', file.name, file.size, 'bytes');
      setLoading(true);
      setError(null);

      try {
        // Strategy 1: Direct ArrayBuffer
        console.log('📄 Strategy 1: Direct ArrayBuffer conversion...');
        setProcessingMethod('Direct ArrayBuffer');
        
        const arrayBuffer = await file.arrayBuffer();
        console.log('✅ ArrayBuffer created:', arrayBuffer.byteLength, 'bytes');
        
        if (arrayBuffer.byteLength === 0) {
          throw new Error('ArrayBuffer is empty');
        }
        
        setPdfData(arrayBuffer);
        setLoading(false);
        console.log('✅ File ready via ArrayBuffer');
        return;

      } catch (arrayBufferError) {
        console.warn('⚠️ ArrayBuffer failed:', arrayBufferError.message);
        
        try {
          // Strategy 2: FileReader
          console.log('📄 Strategy 2: FileReader...');
          setProcessingMethod('FileReader');
          
          const reader = new FileReader();
          
          reader.onload = (event) => {
            try {
              const result = event.target.result;
              console.log('✅ FileReader result:', typeof result, result.byteLength || result.length);
              
              if (result instanceof ArrayBuffer) {
                setPdfData(result);
              } else {
                // Convert to ArrayBuffer if needed
                const buffer = new ArrayBuffer(result.length);
                const view = new Uint8Array(buffer);
                for (let i = 0; i < result.length; i++) {
                  view[i] = result.charCodeAt(i);
                }
                setPdfData(buffer);
              }
              
              setLoading(false);
              console.log('✅ File ready via FileReader');
            } catch (readerProcessError) {
              console.error('❌ FileReader processing failed:', readerProcessError);
              setError(`FileReader processing failed: ${readerProcessError.message}`);
              setLoading(false);
            }
          };
          
          reader.onerror = (error) => {
            console.error('❌ FileReader error:', error);
            setError('FileReader failed to read file');
            setLoading(false);
          };
          
          reader.readAsArrayBuffer(file);
          
        } catch (fileReaderError) {
          console.error('❌ FileReader setup failed:', fileReaderError);
          
          try {
            // Strategy 3: URL object (last resort)
            console.log('📄 Strategy 3: URL.createObjectURL...');
            setProcessingMethod('URL Object');
            
            const fileUrl = URL.createObjectURL(file);
            console.log('✅ File URL created:', fileUrl);
            
            setPdfData(fileUrl);
            setLoading(false);
            console.log('✅ File ready via URL');
            
          } catch (urlError) {
            console.error('❌ All file processing strategies failed:', urlError);
            setError(`All file processing failed. ArrayBuffer: ${arrayBufferError.message}, FileReader: ${fileReaderError.message}, URL: ${urlError.message}`);
            setLoading(false);
          }
        }
      }
    };

    processFileEmergency();
  }, [file]);

  // Initialize page number from existing document
  useEffect(() => {
    if (existingDocument && existingDocument.currentPage) {
      setPageNumber(existingDocument.currentPage);
      console.log(`📖 Loaded document at page ${existingDocument.currentPage}`);
    }
  }, [existingDocument]);

  // PDF document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log('✅ PDF LOAD SUCCESS:', { 
      numPages, 
      processingMethod,
      pdfDataType: typeof pdfData,
      pdfDataSize: pdfData?.byteLength || pdfData?.length || 'unknown'
    });
    
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    
    // Update document with page count
    if (documentId) {
      updateDocumentProgress(documentId, pageNumber, numPages);
    }
    
    // Start timing for current page after a brief delay
    setTimeout(() => {
      startPageTimer(pageNumber, fileName);
    }, 100);
  }, [documentId, pageNumber, updateDocumentProgress, startPageTimer, fileName, pdfData, processingMethod]);

  // PDF document load error handling
  const onDocumentLoadError = useCallback((error) => {
    console.error('❌ PDF LOAD ERROR:', {
      error: error.message,
      stack: error.stack,
      processingMethod,
      pdfDataType: typeof pdfData,
      pdfDataSize: pdfData?.byteLength || pdfData?.length || 'unknown'
    });
    
    setError(`PDF Load Error (${processingMethod}): ${error.message}`);
    setLoading(false);
    stopPageTimer();
  }, [stopPageTimer, pdfData, processingMethod]);

  // Manual retry function
  const handleRetry = () => {
    console.log('🔄 Manual retry initiated');
    setPdfData(null);
    setError(null);
    setLoading(false);
    // The useEffect will handle reprocessing
  };

  // Handle page navigation
  const navigateToPage = useCallback((newPage) => {
    if (newPage === pageNumber || isPageChanging) return;
    
    console.log(`🔄 Navigating from page ${pageNumber} to page ${newPage}`);
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
    }, 30000);
    return () => clearInterval(interval);
  }, [saveProgress, pageTimes]);

  // Handle browser tab visibility
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
              <p className="ml-2 text-sm text-gray-600">Method: {processingMethod}</p>
            </div>
          )}
          
          {/* Debug Info */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="font-semibold text-gray-800 mb-2">🔍 Emergency Debug Info</h3>
            <div className="space-y-1 text-xs text-gray-600 font-mono">
              <div><strong>Worker:</strong> {pdfjs.GlobalWorkerOptions.workerSrc}</div>
              <div><strong>File:</strong> {file?.name || 'None'} ({file?.size || 0} bytes)</div>
              <div><strong>PDF Data:</strong> {typeof pdfData} ({pdfData?.byteLength || pdfData?.length || 0} bytes)</div>
              <div><strong>Processing Method:</strong> {processingMethod || 'None'}</div>
              <div><strong>Error:</strong> {error || 'None'}</div>
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            </div>
            
            {error && (
              <button
                onClick={handleRetry}
                className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
              >
                🔄 Retry Processing
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
                    <p className="text-red-800 font-medium">PDF Processing Error</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                    <p className="text-red-500 text-xs mt-1">Method: {processingMethod}</p>
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

            <div className="bg-white rounded-lg shadow-sm">
              {/* Success Banner */}
              {numPages && (
                <div className="bg-green-50 border-b border-green-200 px-6 py-3">
                  <p className="text-green-800 text-sm">
                    ✅ PDF loaded successfully using <strong>{processingMethod}</strong> method
                  </p>
                </div>
              )}

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
                    options={{
                      disableTextLayer: true,
                      disableAnnotationLayer: true,
                    }}
                    loading={
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 mt-2">Loading PDF document...</p>
                        <p className="text-gray-500 text-sm mt-1">Method: {processingMethod}</p>
                      </div>
                    }
                    error={
                      <div className="text-center py-12">
                        <div className="text-red-600 mb-2">❌ Failed to load PDF</div>
                        <p className="text-gray-600 text-sm mb-2">Method: {processingMethod}</p>
                        <button
                          onClick={handleRetry}
                          className="flex items-center space-x-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors mx-auto"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>Retry</span>
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
