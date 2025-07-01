import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Play, Pause, FileText, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

// Configure PDF.js worker with multiple fallbacks
const configurePDFWorker = () => {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const workerSources = [
      '/pdf.worker.min.js',
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
    ];
    
    pdfjs.GlobalWorkerOptions.workerSrc = workerSources[0];
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
  const [retryCount, setRetryCount] = useState(0);
  
  // Timer state
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

  // Load existing progress
  useEffect(() => {
    if (document) {
      if (document.pageTimes && typeof document.pageTimes === 'object') {
        setPageTimes(document.pageTimes);
        setTotalTime(Object.values(document.pageTimes).reduce((sum, time) => sum + time, 0));
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
        // Try to get file from the file handler
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

  // Timer functionality
  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setCurrentPageTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking]);

  // Auto-start timer when PDF loads
  useEffect(() => {
    if (numPages && !error) {
      const timer = setTimeout(() => {
        setIsTracking(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [numPages, error]);

  // Save page time when navigating
  const saveCurrentPageTime = useCallback(() => {
    if (currentPageTime > 0) {
      const newPageTimes = {
        ...pageTimes,
        [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTime
      };
      setPageTimes(newPageTimes);
      
      try {
        updateDocumentPageTimes(documentId, newPageTimes);
        setTotalTime(Object.values(newPageTimes).reduce((sum, time) => sum + time, 0));
        console.log('💾 Saved', currentPageTime, 'seconds for page', pageNumber);
      } catch (error) {
        console.error('Error saving page times:', error);
      }
    }
  }, [currentPageTime, pageNumber, pageTimes, documentId, updateDocumentPageTimes]);

  // Page navigation
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= numPages && newPage !== pageNumber) {
      console.log(`📄 Navigating from page ${pageNumber} to page ${newPage}`);
      
      // Save current page time
      saveCurrentPageTime();
      
      setPageNumber(newPage);
      setCurrentPageTime(0);
      
      try {
        updateDocumentProgress(documentId, newPage, numPages);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  }, [pageNumber, numPages, saveCurrentPageTime, documentId, updateDocumentProgress]);

  const goToPrevPage = () => goToPage(pageNumber - 1);
  const goToNextPage = () => goToPage(pageNumber + 1);

  // Toggle timer
  const toggleTimer = () => {
    if (isTracking) {
      setIsTracking(false);
      saveCurrentPageTime();
    } else {
      setIsTracking(true);
      setCurrentPageTime(0);
    }
  };

  // PDF document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log('✅ PDF loaded successfully:', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    setRetryCount(0);
    
    if (documentId) {
      updateDocumentProgress(documentId, pageNumber, numPages);
    }
  }, [documentId, pageNumber, updateDocumentProgress]);

  // PDF document load error
  const onDocumentLoadError = useCallback((error) => {
    console.error('❌ PDF loading error:', error);
    setLoading(false);
    
    const errorMessage = error.message || error.toString();
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        setError(null);
        setLoading(true);
      }, 2000);
    } else {
      setError(`Failed to load PDF: ${errorMessage}`);
    }
  }, [retryCount]);

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
      // Convert file to data URL for viewing
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

  // Retry loading
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setLoading(true);
    
    const fileData = getDocumentFile(documentId);
    if (fileData) {
      setPdfFile(fileData);
    } else {
      setError('PDF file not found. Please upload the file again.');
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
          {retryCount > 0 && (
            <p className="text-sm text-yellow-600 mt-2">Retry attempt {retryCount}/2</p>
          )}
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
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 inline mr-2" />
              Try Again
            </button>
            
            <div className="text-sm text-gray-600">or</div>
            
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
                      {numPages ? Math.round((pageNumber / numPages) * 100) : 0}% Complete
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${numPages ? (pageNumber / numPages) * 100 : 0}%` }}
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
                <h3 className="font-semibold text-gray-900">Reading Stats</h3>
                <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Page:</span>
                  <span className="font-mono font-bold text-lg">{formatTime(currentPageTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-medium">{formatTime(totalTime + currentPageTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pages Read:</span>
                  <span className="font-medium">{Object.keys(pageTimes).length + (currentPageTime > 0 ? 1 : 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timer Status:</span>
                  <span className={`font-medium ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                    {isTracking ? '🟢 Recording' : '🔴 Paused'}
                  </span>
                </div>
              </div>
            </div>

            {/* PDF Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📄 PDF Status</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>File: {fileName || 'Unknown'}</p>
                <p>Pages: {numPages || 'Loading...'}</p>
                <p>Current: Page {pageNumber}</p>
                <p>Zoom: {Math.round(scale * 100)}%</p>
                <p>Status: {pdfFile ? '✅ Loaded' : '❌ Not loaded'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealPDFViewer;
