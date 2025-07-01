import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Play, Pause, FileText, Clock, Save, AlertTriangle } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const RealContentPDFViewer = ({ documentId, fileName, onBack }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // FIXED: Persistent timer state
  const [currentPageTime, setCurrentPageTime] = useState(0);
  const [pageTimes, setPageTimes] = useState({});
  const [isTracking, setIsTracking] = useState(true);
  
  const timerRef = useRef(null);
  const currentPageTimeRef = useRef(0);
  const isTrackingRef = useRef(true);
  const fileInputRef = useRef(null);
  
  const { 
    updateDocumentProgress, 
    updateDocumentPageTimes, 
    getDocumentById,
    getDocumentFile
  } = useStudyPlanner();
  
  const document = getDocumentById(documentId);

  // Load document and PDF file
  useEffect(() => {
    const loadPDFFile = async () => {
      if (!document) {
        setError('Document not found');
        setLoading(false);
        return;
      }

      console.log('📄 Loading PDF for document:', document.name);

      // Load existing page times and progress
      if (document.pageTimes) {
        setPageTimes(document.pageTimes);
        console.log('⏱️ Loaded existing page times:', Object.keys(document.pageTimes).length, 'pages');
      }
      
      if (document.currentPage && document.currentPage > 0) {
        setPageNumber(document.currentPage);
      }

      // Try to get the PDF file
      try {
        const fileData = getDocumentFile(documentId);
        if (fileData) {
          console.log('✅ Found PDF file in cache');
          setPdfFile(fileData);
        } else {
          console.log('❌ PDF file not found in cache');
          setError('PDF file not found. Please re-upload the file.');
        }
      } catch (err) {
        console.error('❌ Error loading PDF file:', err);
        setError('Failed to load PDF file: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPDFFile();
  }, [document, documentId, getDocumentFile]);

  // Timer functionality
  useEffect(() => {
    if (isTracking) {
      console.log('▶️ Starting timer for page', pageNumber);
      
      timerRef.current = setInterval(() => {
        currentPageTimeRef.current += 1;
        setCurrentPageTime(currentPageTimeRef.current);
        
        // Auto-save every 30 seconds
        if (currentPageTimeRef.current % 30 === 0) {
          saveCurrentProgress();
        }
        
        if (currentPageTimeRef.current % 10 === 0) {
          console.log(`⏱️ Page ${pageNumber}: ${currentPageTimeRef.current}s`);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTracking, pageNumber]);

  // Save current progress
  const saveCurrentProgress = useCallback(() => {
    if (currentPageTimeRef.current > 0) {
      const newPageTimes = {
        ...pageTimes,
        [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTimeRef.current
      };
      
      setPageTimes(newPageTimes);
      
      try {
        updateDocumentPageTimes(documentId, newPageTimes);
        console.log('💾 Auto-saved:', currentPageTimeRef.current, 'seconds for page', pageNumber);
      } catch (error) {
        console.error('❌ Save error:', error);
      }
    }
  }, [pageNumber, pageTimes, documentId, updateDocumentPageTimes]);

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

  // Page navigation
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= (numPages || 1) && newPage !== pageNumber) {
      console.log(`📄 Navigating: ${pageNumber} → ${newPage}`);
      
      // Save current page time before switching
      saveCurrentProgress();
      
      // Reset timer for new page
      currentPageTimeRef.current = 0;
      setCurrentPageTime(0);
      setPageNumber(newPage);
      
      try {
        updateDocumentProgress(documentId, newPage, numPages || 1);
      } catch (error) {
        console.error('❌ Progress update error:', error);
      }
    }
  }, [pageNumber, numPages, saveCurrentProgress, documentId, updateDocumentProgress]);

  const goToPrevPage = () => goToPage(pageNumber - 1);
  const goToNextPage = () => goToPage(pageNumber + 1);

  // Manual timer toggle
  const toggleTimer = () => {
    isTrackingRef.current = !isTrackingRef.current;
    setIsTracking(isTrackingRef.current);
    
    if (!isTrackingRef.current) {
      saveCurrentProgress();
    }
    
    console.log(isTrackingRef.current ? '▶️ Timer resumed' : '⏸️ Timer paused');
  };

  // Manual save
  const manualSave = () => {
    saveCurrentProgress();
    alert(`✅ Saved ${currentPageTimeRef.current}s for page ${pageNumber}`);
  };

  // File upload handler for missing PDFs
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

  // Calculate statistics
  const totalTime = Object.values(pageTimes).reduce((sum, time) => sum + time, 0) + currentPageTimeRef.current;
  const pagesWithTime = Object.keys(pageTimes).length + (currentPageTimeRef.current > 0 ? 1 : 0);
  const avgTimePerPage = pagesWithTime > 0 ? totalTime / pagesWithTime : 0;
  const readingSpeed = avgTimePerPage > 0 ? 3600 / avgTimePerPage : 0;
  const completion = numPages > 0 ? (pageNumber / numPages) * 100 : 0;

  // Format time
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (currentPageTimeRef.current > 0) {
        saveCurrentProgress();
      }
    };
  }, [saveCurrentProgress]);

  // Loading state
  if (loading) {
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

  // Error state with upload option
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
              {/* Header with Timer */}
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
                      <p className="text-sm text-gray-600">
                        Page {pageNumber} of {numPages || '?'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Timer Display */}
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border-2 ${
                      isTracking ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-50 text-gray-600 border-gray-300'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <span className="text-xl font-mono font-bold">{formatTime(currentPageTime)}</span>
                    </div>
                    
                    <button
                      onClick={toggleTimer}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        isTracking 
                          ? 'text-red-600 border-red-300 hover:bg-red-50' 
                          : 'text-green-600 border-green-300 hover:bg-green-50'
                      }`}
                    >
                      {isTracking ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                    
                    <button
                      onClick={manualSave}
                      className="p-2 rounded-lg border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      <input
                        type="number"
                        min="1"
                        max={numPages || 1}
                        value={pageNumber}
                        onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-600">of {numPages || '?'}</span>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= (numPages || 1)}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Zoom Controls */}
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

                  {/* Progress Bar */}
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {Math.round(completion)}% Complete
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completion}%` }}
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="w-80 space-y-4">
            {/* Timer Stats */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Live Timer</h3>
                <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Page:</span>
                  <span className="font-mono font-bold text-lg text-blue-600">{formatTime(currentPageTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-medium">{formatTime(totalTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pages Timed:</span>
                  <span className="font-medium">{pagesWithTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${isTracking ? 'text-green-600' : 'text-gray-600'}`}>
                    {isTracking ? '🟢 Recording' : '⏸️ Paused'}
                  </span>
                </div>
              </div>
            </div>

            {/* Reading Analytics */}
            {pagesWithTime > 1 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-3">Reading Analytics</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg/Page:</span>
                    <span className="font-medium">{formatTime(Math.round(avgTimePerPage))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Speed:</span>
                    <span className="font-medium">{readingSpeed.toFixed(1)} p/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium text-green-600">{completion.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* System Status */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ System Status</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>Timer: {isTracking ? '⏱️ ACTIVE' : '⏸️ PAUSED'}</p>
                <p>Current: {currentPageTime}s</p>
                <p>Page: {pageNumber}/{numPages || '?'}</p>
                <p>PDF: {pdfFile ? '✅ Loaded' : '❌ Missing'}</p>
                <p>File: {fileName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealContentPDFViewer;
