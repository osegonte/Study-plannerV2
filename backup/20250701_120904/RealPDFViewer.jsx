import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Play, Pause, FileText, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

// Configure PDF.js worker
const configurePDFWorker = () => {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    console.log('🔧 PDF Worker configured:', pdfjs.GlobalWorkerOptions.workerSrc);
  }
};

configurePDFWorker();

const RealPDFViewer = ({ documentId, fileName, onBack }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  
  // WORKING Timer state
  const [isTracking, setIsTracking] = useState(false);
  const [currentPageTime, setCurrentPageTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [pageTimes, setPageTimes] = useState({});
  const [totalTime, setTotalTime] = useState(0);
  
  const intervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const pageStartTimeRef = useRef(null);
  
  const { 
    updateDocumentProgress, 
    updateDocumentPageTimes, 
    getDocumentById,
    getDocumentFile
  } = useStudyPlanner();
  
  // Get document data
  const document = getDocumentById(documentId);

  // Load existing progress and page times
  useEffect(() => {
    if (document) {
      console.log('📄 Loading document data:', document);
      
      if (document.pageTimes && typeof document.pageTimes === 'object') {
        setPageTimes(document.pageTimes);
        const existingTotal = Object.values(document.pageTimes).reduce((sum, time) => sum + time, 0);
        setTotalTime(existingTotal);
        console.log('⏱️ Loaded existing page times:', document.pageTimes);
        console.log('⏱️ Total existing time:', existingTotal, 'seconds');
      }
      
      if (document.currentPage && document.currentPage > 0) {
        setPageNumber(document.currentPage);
      }
    }
  }, [document]);

  // Try to get the PDF file from storage
  useEffect(() => {
    const loadPDFFile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fileData = getDocumentFile(documentId);
        
        if (fileData) {
          console.log('📄 Found PDF file in storage');
          setPdfFile(fileData);
        } else {
          console.log('⚠️ PDF file not found in storage');
          setError('PDF file not found in storage. Please re-upload the file.');
        }
      } catch (err) {
        console.error('❌ Error loading PDF:', err);
        setError('Failed to load PDF file: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      loadPDFFile();
    }
  }, [documentId, getDocumentFile]);

  // WORKING Timer functionality with proper cleanup
  useEffect(() => {
    if (isTracking && numPages) {
      console.log('✅ Starting timer for page', pageNumber);
      pageStartTimeRef.current = Date.now();
      setSessionStartTime(Date.now());
      
      intervalRef.current = setInterval(() => {
        setCurrentPageTime(prev => {
          const newTime = prev + 1;
          if (newTime % 10 === 0) { // Log every 10 seconds
            console.log(`⏱️ Page ${pageNumber}: ${newTime}s`);
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏹️ Timer stopped');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTracking, pageNumber, numPages]);

  // Auto-start timer when PDF loads
  useEffect(() => {
    if (numPages && !error && !isTracking) {
      console.log('🚀 Auto-starting timer for PDF with', numPages, 'pages');
      const timer = setTimeout(() => {
        setIsTracking(true);
        setCurrentPageTime(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [numPages, error, isTracking]);

  // Save page time when navigating or stopping
  const saveCurrentPageTime = useCallback(() => {
    if (currentPageTime > 0) {
      const newPageTimes = {
        ...pageTimes,
        [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTime
      };
      
      setPageTimes(newPageTimes);
      
      // Calculate new total
      const newTotal = Object.values(newPageTimes).reduce((sum, time) => sum + time, 0);
      setTotalTime(newTotal);
      
      console.log('💾 Saving page time:', {
        page: pageNumber,
        time: currentPageTime,
        totalForPage: newPageTimes[pageNumber],
        newTotal: newTotal
      });
      
      // Update context
      try {
        updateDocumentPageTimes(documentId, newPageTimes);
        console.log('✅ Page times saved to context');
      } catch (error) {
        console.error('❌ Error saving page times to context:', error);
      }
      
      return newPageTimes;
    }
    return pageTimes;
  }, [currentPageTime, pageNumber, pageTimes, documentId, updateDocumentPageTimes]);

  // Page navigation with proper time saving
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= numPages && newPage !== pageNumber) {
      console.log(`📄 Navigating from page ${pageNumber} to page ${newPage}`);
      
      // Save current page time before switching
      const updatedPageTimes = saveCurrentPageTime();
      
      // Update page number and reset timer
      setPageNumber(newPage);
      setCurrentPageTime(0);
      
      // Update progress in context
      try {
        updateDocumentProgress(documentId, newPage, numPages);
      } catch (error) {
        console.error('❌ Error updating progress:', error);
      }
      
      // Reset timer for new page if tracking
      if (isTracking) {
        pageStartTimeRef.current = Date.now();
      }
    }
  }, [pageNumber, numPages, saveCurrentPageTime, documentId, updateDocumentProgress, isTracking]);

  const goToPrevPage = () => goToPage(pageNumber - 1);
  const goToNextPage = () => goToPage(pageNumber + 1);

  // Toggle timer manually
  const toggleTimer = () => {
    if (isTracking) {
      console.log('⏸️ Pausing timer');
      setIsTracking(false);
      saveCurrentPageTime();
    } else {
      console.log('▶️ Resuming timer');
      setIsTracking(true);
      setCurrentPageTime(0);
    }
  };

  // Manual save function
  const manualSave = () => {
    console.log('💾 Manual save triggered');
    saveCurrentPageTime();
    alert('Progress saved!');
  };

  // PDF document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log('✅ PDF loaded successfully:', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    
    if (documentId) {
      updateDocumentProgress(documentId, pageNumber, numPages);
    }
  }, [documentId, pageNumber, updateDocumentProgress]);

  // PDF document load error
  const onDocumentLoadError = useCallback((error) => {
    console.error('❌ PDF loading error:', error);
    setLoading(false);
    setError(`Failed to load PDF: ${error.message || error.toString()}`);
  }, []);

  // Handle file upload for missing PDFs
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfFile(e.target.result);
        console.log('📄 PDF file uploaded and ready');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload file: ' + err.message);
      setLoading(false);
    }
  };

  // Format time display
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

  // Calculate reading estimates
  const calculateEstimates = () => {
    const pagesWithTime = Object.keys(pageTimes).length;
    if (pagesWithTime === 0) {
      return {
        avgTimePerPage: 0,
        estimatedTimeRemaining: 0,
        readingSpeed: 0,
        completion: 0
      };
    }

    const totalTimeSpent = Object.values(pageTimes).reduce((sum, time) => sum + time, 0) + currentPageTime;
    const avgTimePerPage = totalTimeSpent / (pagesWithTime + (currentPageTime > 0 ? 1 : 0));
    const pagesRemaining = Math.max(numPages - pageNumber, 0);
    const estimatedTimeRemaining = avgTimePerPage * pagesRemaining;
    const readingSpeed = avgTimePerPage > 0 ? 3600 / avgTimePerPage : 0; // pages per hour
    const completion = numPages > 0 ? (pageNumber / numPages) * 100 : 0;

    return {
      avgTimePerPage,
      estimatedTimeRemaining,
      readingSpeed,
      completion,
      pagesWithTime: pagesWithTime + (currentPageTime > 0 ? 1 : 0)
    };
  };

  const estimates = calculateEstimates();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (isTracking && currentPageTime > 0) {
        saveCurrentPageTime();
      }
    };
  }, [isTracking, currentPageTime, saveCurrentPageTime]);

  // Loading state
  if (loading && !error) {
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

  // Error state with file upload option
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Unable to Load PDF</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          
          <div className="space-y-3">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Upload PDF File
              </button>
            </div>
            
            {onBack && (
              <button
                onClick={onBack}
                className="block mx-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Documents
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
              {/* Header */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {onBack && (
                      <button
                        onClick={onBack}
                        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                      </button>
                    )}
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">{fileName || 'Document'}</h1>
                      <p className="text-sm text-gray-600">
                        Page {pageNumber} of {numPages || '?'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Timer Status */}
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                        isTracking ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-mono font-bold">{formatTime(currentPageTime)}</span>
                        {isTracking ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                      </div>
                      <button
                        onClick={toggleTimer}
                        className={`p-2 rounded-lg border transition-colors ${
                          isTracking 
                            ? 'hover:bg-red-50 text-red-600 border-red-200' 
                            : 'hover:bg-green-50 text-green-600 border-green-200'
                        }`}
                        title={isTracking ? 'Pause Timer' : 'Start Timer'}
                      >
                        {isTracking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={manualSave}
                        className="p-2 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Save Progress"
                      >
                        <RefreshCw className="h-4 w-4" />
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
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (!isNaN(page)) {
                              goToPage(page);
                            }
                          }}
                          className="w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-600">of {numPages || '?'}</span>
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= (numPages || 1)}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center space-x-2 border-l pl-4">
                      <button
                        onClick={() => setScale(Math.max(0.5, scale - 0.2))}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-gray-600 min-w-12 text-center">
                        {Math.round(scale * 100)}%
                      </span>
                      <button
                        onClick={() => setScale(Math.min(3.0, scale + 0.2))}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {Math.round(estimates.completion)}% Complete
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${estimates.completion}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Display Area */}
              <div className="p-6">
                <div className="bg-gray-100 rounded-lg min-h-96 flex items-center justify-center overflow-auto">
                  {pdfFile ? (
                    <Document
                      file={pdfFile}
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
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No PDF file loaded</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Upload PDF File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar with Timer Stats and Estimates */}
          <div className="w-80 space-y-4">
            {/* Timer Stats */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Reading Stats</h3>
                <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Page:</span>
                  <span className="font-mono font-bold text-lg text-blue-600">{formatTime(currentPageTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-medium">{formatTime(totalTime + currentPageTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pages Timed:</span>
                  <span className="font-medium">{estimates.pagesWithTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timer Status:</span>
                  <span className={`font-medium ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                    {isTracking ? '🟢 Recording' : '🔴 Paused'}
                  </span>
                </div>
              </div>
            </div>

            {/* Reading Estimates */}
            {estimates.pagesWithTime > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Estimates</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg/Page:</span>
                    <span className="font-medium">{formatTime(Math.round(estimates.avgTimePerPage))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reading Speed:</span>
                    <span className="font-medium">{estimates.readingSpeed.toFixed(1)} p/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Remaining:</span>
                    <span className="font-medium text-orange-600">{formatTime(Math.round(estimates.estimatedTimeRemaining))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion:</span>
                    <span className="font-medium text-green-600">{estimates.completion.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ Timer Status</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>Active: {isTracking ? '⏱️ YES' : '❌ NO'}</p>
                <p>Current: {currentPageTime}s</p>
                <p>Page: {pageNumber}/{numPages || '?'}</p>
                <p>Total: {formatTime(totalTime + currentPageTime)}</p>
                <p>Pages with data: {Object.keys(pageTimes).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealPDFViewer;
