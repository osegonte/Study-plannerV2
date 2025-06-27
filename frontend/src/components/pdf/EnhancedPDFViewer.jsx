import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Upload, FileText, ZoomIn, ZoomOut, Save } from 'lucide-react';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import ReadingTimer from '../timer/ReadingTimer';
import TimeTrackingStats from '../timer/TimeTrackingStats';
import ReadingEstimates from '../timer/ReadingEstimates';
import ReadingSpeedIndicator from '../timer/ReadingSpeedIndicator';
import TopicSelector from '../topics/TopicSelector';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const EnhancedPDFViewer = ({ initialDocument = null, topicId = null, onBack = null }) => {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(topicId);
  const [currentDocument, setCurrentDocument] = useState(initialDocument);

  const {
    topics,
    addDocumentToTopic,
    updateDocumentProgress,
    updateDocumentPageTimes,
    createTopic
  } = useStudyPlanner();

  // Time tracking
  const {
    isTracking,
    currentSessionTime,
    pageTimes,
    sessionData,
    startPageTimer,
    stopPageTimer,
    resetTimingData,
    getPageTime
  } = useTimeTracking();

  // Load initial document if provided
  useEffect(() => {
    if (initialDocument && initialDocument.file) {
      setFile(initialDocument.file);
      setPageNumber(initialDocument.currentPage || 1);
      setCurrentDocument(initialDocument);
      setSelectedTopicId(initialDocument.topicId);
    }
  }, [initialDocument]);

  // PDF document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    console.log(`PDF loaded successfully with ${numPages} pages`);
    
    // If this is a new document, save it
    if (file && selectedTopicId && !currentDocument) {
      const docData = addDocumentToTopic(selectedTopicId, file, numPages);
      setCurrentDocument(docData);
    } else if (currentDocument) {
      // Update existing document with page count
      updateDocumentProgress(currentDocument.id, pageNumber, numPages);
    }
    
    // Start timing for current page
    if (file) {
      startPageTimer(pageNumber, file.name);
    }
  }, [file, selectedTopicId, currentDocument, pageNumber, addDocumentToTopic, updateDocumentProgress, startPageTimer]);

  // PDF document load error
  const onDocumentLoadError = useCallback((error) => {
    setError('Failed to load PDF. Please try again with a different file.');
    setLoading(false);
    stopPageTimer();
    console.error('PDF load error:', error);
  }, [stopPageTimer]);

  // PDF page load error
  const onPageLoadError = useCallback((error) => {
    console.error('PDF page load error:', error);
    setError('Failed to load this page. Try navigating to a different page.');
  }, []);

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      // Stop current timing and reset
      stopPageTimer();
      resetTimingData();
      
      setFile(uploadedFile);
      setLoading(true);
      setError(null);
      setPageNumber(1);
      setNumPages(null);
      setCurrentDocument(null);
      setShowTopicSelector(true);
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const handleTopicSelect = (topicId) => {
    setSelectedTopicId(topicId);
    setShowTopicSelector(false);
  };

  const handleCreateNewTopic = () => {
    // This would typically open a modal or form
    const name = prompt('Enter topic name:');
    if (name && name.trim()) {
      const newTopic = createTopic({ name: name.trim(), color: 'blue' });
      setSelectedTopicId(newTopic.id);
      setShowTopicSelector(false);
    }
  };

  const goToPrevPage = () => {
    const newPage = Math.max(pageNumber - 1, 1);
    if (newPage !== pageNumber) {
      setPageNumber(newPage);
      if (currentDocument) {
        updateDocumentProgress(currentDocument.id, newPage, numPages);
      }
      startPageTimer(newPage, file?.name);
    }
  };

  const goToNextPage = () => {
    const newPage = Math.min(pageNumber + 1, numPages || 1);
    if (newPage !== pageNumber) {
      setPageNumber(newPage);
      if (currentDocument) {
        updateDocumentProgress(currentDocument.id, newPage, numPages);
      }
      startPageTimer(newPage, file?.name);
    }
  };

  const goToPage = (page) => {
    const pageNum = parseInt(page);
    if (pageNum >= 1 && pageNum <= numPages && pageNum !== pageNumber) {
      setPageNumber(pageNum);
      if (currentDocument) {
        updateDocumentProgress(currentDocument.id, pageNum, numPages);
      }
      startPageTimer(pageNum, file?.name);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  // Save reading progress
  const saveProgress = useCallback(() => {
    if (currentDocument && Object.keys(pageTimes).length > 0) {
      updateDocumentPageTimes(currentDocument.id, pageTimes);
    }
  }, [currentDocument, pageTimes, updateDocumentPageTimes]);

  // Handle page changes for timing
  useEffect(() => {
    if (file && numPages) {
      startPageTimer(pageNumber, file.name);
    }
  }, [pageNumber, file, numPages, startPageTimer]);

  // Auto-save progress periodically
  useEffect(() => {
    const interval = setInterval(saveProgress, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [saveProgress]);

  // Stop timer when component unmounts or file changes
  useEffect(() => {
    return () => {
      stopPageTimer();
      saveProgress();
    };
  }, [stopPageTimer, saveProgress]);

  // Handle browser tab visibility for accurate timing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPageTimer();
        saveProgress();
      } else if (file && numPages) {
        startPageTimer(pageNumber, file.name);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [file, numPages, pageNumber, startPageTimer, stopPageTimer, saveProgress]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main PDF Area */}
          <div className="flex-1">
            {!file && (
              <div className="text-center py-12">
                <FileText className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">No PDF loaded</h2>
                <p className="text-gray-500 mb-4">Upload a PDF file to start reading and tracking your study time.</p>
                <div className="mt-6 text-sm text-gray-400 space-y-1">
                  <p>✅ Real PDF Rendering</p>
                  <p>✅ Page Navigation & Zoom</p>
                  <p>✅ Reading Time Tracking</p>
                  <p>✅ Reading Speed & Estimates</p>
                  <p>🎯 ✅ Topic Organization</p>
                </div>
                
                {/* File Upload */}
                <div className="mt-8">
                  <div className="relative inline-block">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Upload PDF
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Topic Selection Modal */}
            {showTopicSelector && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold mb-4">Select Topic for PDF</h3>
                  <TopicSelector
                    topics={topics}
                    selectedTopicId={selectedTopicId}
                    onSelectTopic={handleTopicSelect}
                    onCreateNew={handleCreateNewTopic}
                  />
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => setShowTopicSelector(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
                <p className="text-red-600 text-sm mt-1">
                  Make sure the PDF file is not corrupted and is a standard PDF format.
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading PDF...</p>
              </div>
            )}

            {file && selectedTopicId && (
              <div className="bg-white rounded-lg shadow-sm">
                {/* Toolbar */}
                <div className="border-b px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      {/* Navigation Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={goToPrevPage}
                          disabled={pageNumber <= 1}
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
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            title="Go to page"
                          />
                          <span className="text-gray-600">of {numPages || '?'}</span>
                        </div>
                        
                        <button
                          onClick={goToNextPage}
                          disabled={pageNumber >= (numPages || 1)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Next page"
                        >
                          <ChevronRight className="h-4 w-4" />
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

                    {/* Save and File Info */}
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
                        <span className="font-medium">{file.name}</span>
                        <span className="ml-2">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
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
                      file={file}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="text-center py-12">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="text-gray-600 mt-2">Loading PDF document...</p>
                        </div>
                      }
                      error={
                        <div className="text-center py-12">
                          <div className="text-red-600 mb-2">❌ Failed to load PDF</div>
                          <p className="text-gray-600 text-sm">Please try a different PDF file</p>
                        </div>
                      }
                      className="react-pdf__Document"
                    >
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        onLoadError={onPageLoadError}
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
            )}
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

export default EnhancedPDFViewer;
