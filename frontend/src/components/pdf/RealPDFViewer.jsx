import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Play, Pause, FileText, Clock, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';
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
  
  // FIXED Timer state
  const [isTracking, setIsTracking] = useState(false);
  const [currentPageTime, setCurrentPageTime] = useState(0);
  const [pageTimes, setPageTimes] = useState({});
  const [totalTime, setTotalTime] = useState(0);
  
  const intervalRef = useRef(null);
  const fileInputRef = useRef(null);
  
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

  // FIXED Timer functionality
  useEffect(() => {
    if (isTracking) {
      console.log('✅ Timer started for page', pageNumber);
      intervalRef.current = setInterval(() => {
        setCurrentPageTime(prev => {
          const newTime = prev + 1;
          if (newTime % 5 === 0) { // Log every 5 seconds
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
  }, [isTracking, pageNumber]);

  // Auto-start timer when PDF loads
  useEffect(() => {
    if (numPages && !error && !isTracking) {
      console.log('🚀 Auto-starting timer for PDF');
      setTimeout(() => {
        setIsTracking(true);
        setCurrentPageTime(0);
      }, 1000);
    }
  }, [numPages, error, isTracking]);

  // Save page time function
  const saveCurrentPageTime = useCallback(() => {
    if (currentPageTime > 0) {
      const newPageTimes = {
        ...pageTimes,
        [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTime
      };
      
      setPageTimes(newPageTimes);
      
      const newTotal = Object.values(newPageTimes).reduce((sum, time) => sum + time, 0);
      setTotalTime(newTotal);
      
      console.log('💾 Saving page time:', {
        page: pageNumber,
        timeAdded: currentPageTime,
        totalForPage: newPageTimes[pageNumber],
        overallTotal: newTotal
      });
      
      try {
        updateDocumentPageTimes(documentId, newPageTimes);
        console.log('✅ Page times saved to context');
      } catch (error) {
        console.error('❌ Error saving page times:', error);
      }
      
      return newPageTimes;
    }
    return pageTimes;
  }, [currentPageTime, pageNumber, pageTimes, documentId, updateDocumentPageTimes]);

  // Page navigation
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= numPages && newPage !== pageNumber) {
      console.log(`📄 Navigating from page ${pageNumber} to page ${newPage}`);
      
      // Save current page time
      saveCurrentPageTime();
      
      // Update page and reset timer
      setPageNumber(newPage);
      setCurrentPageTime(0);
      
      try {
        updateDocumentProgress(documentId, newPage, numPages);
      } catch (error) {
        console.error('❌ Error updating progress:', error);
      }
    }
  }, [pageNumber, numPages, saveCurrentPageTime, documentId, updateDocumentProgress]);

  const goToPrevPage = () => goToPage(pageNumber - 1);
  const goToNextPage = () => goToPage(pageNumber + 1);

  // Toggle timer
  const toggleTimer = () => {
    if (isTracking) {
      console.log('⏸️ Manually pausing timer');
      setIsTracking(false);
      saveCurrentPageTime();
    } else {
      console.log('▶️ Manually starting timer');
      setIsTracking(true);
      setCurrentPageTime(0);
    }
  };

  // Manual save
  const manualSave = () => {
    console.log('💾 Manual save triggered');
    saveCurrentPageTime();
    setCurrentPageTime(0);
    alert('Progress saved!');
  };

  // PDF load success
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log('✅ PDF loaded successfully:', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    
    if (documentId) {
      updateDocumentProgress(documentId, pageNumber, numPages);
    }
  }, [documentId, pageNumber, updateDocumentProgress]);

  // PDF load error
  const onDocumentLoadError = useCallback((error) => {
    console.error('❌ PDF loading error:', error);
    setLoading(false);
    setError(`Failed to load PDF: ${error.message || error.toString()}`);
  }, []);

  // File upload handler
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
        console.log('📄 PDF file uploaded successfully');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload file: ' + err.message);
      setLoading(false);
    }
  };

  // Format time
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

  // Calculate estimates
  const calculateEstimates = () => {
    const pagesWithTime = Object.keys(pageTimes).length;
    const includeCurrentPage = currentPageTime > 0;
    const totalPagesForCalc = pagesWithTime + (includeCurrentPage ? 1 : 0);
    
    if (totalPagesForCalc === 0) {
      return {
        avgTimePerPage: 0,
        estimatedTimeRemaining: 0,
        readingSpeed: 0,
        completion: 0,
        pagesWithTime: 0
      };
    }

    const totalTimeSpent = Object.values(pageTimes).reduce((sum, time) => sum + time, 0) + currentPageTime;
    const avgTimePerPage = totalTimeSpent / totalPagesForCalc;
    const pagesRemaining = Math.max(numPages - pageNumber, 0);
    const estimatedTimeRemaining = avgTimePerPage * pagesRemaining;
    const readingSpeed = avgTimePerPage > 0 ? 3600 / avgTimePerPage : 0; // pages per hour
    const completion = numPages > 0 ? (pageNumber / numPages) * 100 : 0;

    return {
      avgTimePerPage,
      estimatedTimeRemaining,
      readingSpeed,
      completion,
      pagesWithTime: totalPagesForCalc
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
        console.log('🧹 Cleanup: saving page time on unmount');
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

  // Error state
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
                    {/* Timer Display */}
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 ${
                        isTracking ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-600 border-red-300'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-lg font-mono font-bold">{formatTime(currentPageTime)}</span>
                      </div>
                      <button
                        onClick={toggleTimer}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          isTracking 
                            ? 'hover:bg-red-50 text-red-600 border-red-300' 
                            : 'hover:bg-green-50 text-green-600 border-green-300'
                        }`}
                        title={isTracking ? 'Pause Timer' : 'Start Timer'}
                      >
                        {isTracking ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={manualSave}
                        className="p-2 rounded-lg border-2 border-blue-300 hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Save Progress"
                      >
                        <RefreshCw className="h-5 w-5" />
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

              {/* PDF Display */}
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

          {/* Sidebar */}
          <div className="w-80 space-y-4">
            {/* Timer Stats */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Timer Stats</h3>
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
                  <span className="text-gray-600">Status:</span>
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
                  <h3 className="font-semibold text-gray-900">Reading Estimates</h3>
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

            {/* Debug Panel */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ Debug Info</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>Timer Active: {isTracking ? '✅ YES' : '❌ NO'}</p>
                <p>Current Time: {currentPageTime}s</p>
                <p>Page: {pageNumber}/{numPages || '?'}</p>
                <p>Total: {formatTime(totalTime + currentPageTime)}</p>
                <p>Data Points: {Object.keys(pageTimes).length}</p>
                <p>PDF Loaded: {pdfFile ? '✅' : '❌'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealPDFViewer;
