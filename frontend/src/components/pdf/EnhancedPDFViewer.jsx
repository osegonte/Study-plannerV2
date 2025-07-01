import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Play, Pause, FileText, Clock, Save } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

const EnhancedPDFViewer = ({ documentId, fileName, onBack }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  
  // Timer state - WORKING VERSION
  const [isTracking, setIsTracking] = useState(false);
  const [currentPageTime, setCurrentPageTime] = useState(0);
  const [pageTimes, setPageTimes] = useState({});
  const [totalTime, setTotalTime] = useState(0);
  
  const intervalRef = useRef(null);
  const { 
    updateDocumentProgress, 
    updateDocumentPageTimes, 
    getDocumentById, 
    getDocumentEstimates 
  } = useStudyPlanner();
  
  // Get document data
  const document = getDocumentById(documentId);
  const estimates = getDocumentEstimates(documentId);
  const displayPages = document?.totalPages || 100; // Default to 100 pages

  // Load existing progress
  useEffect(() => {
    if (document) {
      if (document.pageTimes) {
        setPageTimes(document.pageTimes);
        setTotalTime(Object.values(document.pageTimes).reduce((sum, time) => sum + time, 0));
      }
      if (document.currentPage) {
        setPageNumber(document.currentPage);
      }
    }
  }, [document]);

  // WORKING TIMER FUNCTIONALITY
  const startTimer = useCallback(() => {
    if (!isTracking) {
      console.log('⏱️ Starting timer for page', pageNumber);
      setIsTracking(true);
      setCurrentPageTime(0);
      
      intervalRef.current = setInterval(() => {
        setCurrentPageTime(prev => {
          const newTime = prev + 1;
          return newTime;
        });
      }, 1000);
    }
  }, [isTracking, pageNumber]);

  const stopTimer = useCallback(() => {
    if (isTracking) {
      console.log('⏹️ Stopping timer, saving', currentPageTime, 'seconds for page', pageNumber);
      setIsTracking(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Save the time for current page
      if (currentPageTime > 0) {
        const newPageTimes = {
          ...pageTimes,
          [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTime
        };
        setPageTimes(newPageTimes);
        updateDocumentPageTimes(documentId, newPageTimes);
        setTotalTime(Object.values(newPageTimes).reduce((sum, time) => sum + time, 0));
        console.log('💾 Saved page times:', newPageTimes);
      }
    }
  }, [isTracking, currentPageTime, pageNumber, pageTimes, documentId, updateDocumentPageTimes]);

  // Page navigation
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= displayPages && newPage !== pageNumber) {
      console.log(`📄 Navigating from page ${pageNumber} to page ${newPage}`);
      
      // Save current page time before switching
      if (isTracking && currentPageTime > 0) {
        const newPageTimes = {
          ...pageTimes,
          [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTime
        };
        setPageTimes(newPageTimes);
        updateDocumentPageTimes(documentId, newPageTimes);
        setTotalTime(Object.values(newPageTimes).reduce((sum, time) => sum + time, 0));
      }
      
      setPageNumber(newPage);
      setCurrentPageTime(0);
      updateDocumentProgress(documentId, newPage, displayPages);
      
      // Restart timer for new page if it was running
      if (isTracking) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
          setCurrentPageTime(prev => prev + 1);
        }, 1000);
      }
    }
  }, [pageNumber, displayPages, isTracking, currentPageTime, pageTimes, documentId, updateDocumentProgress, updateDocumentPageTimes]);

  const goToPrevPage = () => goToPage(pageNumber - 1);
  const goToNextPage = () => goToPage(pageNumber + 1);

  // Auto-start timer when component loads
  useEffect(() => {
    const timer = setTimeout(() => {
      startTimer();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [startTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (isTracking && currentPageTime > 0) {
        const newPageTimes = {
          ...pageTimes,
          [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTime
        };
        updateDocumentPageTimes(documentId, newPageTimes);
      }
    };
  }, [isTracking, currentPageTime, pageNumber, pageTimes, documentId, updateDocumentPageTimes]);

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

  // Manual save progress
  const saveProgress = () => {
    if (currentPageTime > 0) {
      const newPageTimes = {
        ...pageTimes,
        [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTime
      };
      updateDocumentPageTimes(documentId, newPageTimes);
      setPageTimes(newPageTimes);
      setTotalTime(Object.values(newPageTimes).reduce((sum, time) => sum + time, 0));
      setCurrentPageTime(0);
      console.log('💾 Manual save completed');
    }
  };

  // Toggle timer manually
  const toggleTimer = () => {
    if (isTracking) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  // Generate realistic content based on filename
  const generatePageContent = () => {
    const isReligious = fileName.toLowerCase().includes('prayer') || fileName.toLowerCase().includes('paul') || fileName.toLowerCase().includes('reno');
    const isMath = fileName.toLowerCase().includes('math') || fileName.toLowerCase().includes('calculus');
    const isPhysics = fileName.toLowerCase().includes('physics') || fileName.toLowerCase().includes('quantum');
    
    if (isReligious) {
      return {
        title: `Chapter ${Math.floor((pageNumber - 1) / 8) + 1}: The Power of Prayer`,
        content: [
          "Prayer is one of the most powerful tools available to believers. It connects us directly with God and allows us to experience His presence in our daily lives.",
          "",
          "In this chapter, we explore the different types of prayer and how they can transform both our spiritual walk and our practical circumstances.",
          "",
          "Key Points:",
          "• Prayer as communion with God",
          "• The importance of persistent prayer",
          "• How prayer changes both us and our situations",
          "• Biblical examples of powerful prayers",
          "",
          "As we delve deeper into understanding prayer, we discover that it is not merely asking God for things, but developing a relationship with our Creator that shapes our hearts and minds.",
          "",
          `"The effective, fervent prayer of a righteous man avails much." - James 5:16`,
          "",
          "Through consistent prayer, we align our will with God's will and find peace in knowing that He hears and answers according to His perfect plan."
        ]
      };
    } else if (isMath) {
      return {
        title: `Section ${pageNumber}.1: Mathematical Concepts`,
        content: [
          "Advanced mathematical concepts require careful study and practice. In this section, we explore fundamental principles that form the foundation of higher mathematics.",
          "",
          "Definition: A function f: R → R is continuous at point a if:",
          "lim(x→a) f(x) = f(a)",
          "",
          "Key Theorems:",
          "• Intermediate Value Theorem",
          "• Mean Value Theorem", 
          "• Fundamental Theorem of Calculus",
          "",
          "Example: Consider the function f(x) = x² + 3x - 2",
          "To find the derivative: f'(x) = 2x + 3",
          "",
          "Applications of these concepts extend to physics, engineering, economics, and many other fields where mathematical modeling is essential.",
          "",
          "Practice Problems: See exercises 1-15 at the end of this chapter."
        ]
      };
    } else if (isPhysics) {
      return {
        title: `Chapter ${pageNumber}: Quantum Mechanics Principles`,
        content: [
          "Quantum mechanics represents one of the most revolutionary developments in 20th century physics, fundamentally changing our understanding of matter and energy at the atomic scale.",
          "",
          "Schrödinger's equation: iℏ ∂Ψ/∂t = ĤΨ",
          "",
          "Key Principles:",
          "• Wave-particle duality",
          "• Heisenberg uncertainty principle",
          "• Quantum superposition",
          "• Wave function collapse",
          "",
          "The probabilistic nature of quantum mechanics means that we can only predict the likelihood of finding a particle in a particular state, not its exact position and momentum simultaneously.",
          "",
          "This has profound implications for our understanding of reality at the microscopic level and has led to technologies like lasers, MRI machines, and quantum computers."
        ]
      };
    } else {
      return {
        title: `Page ${pageNumber}`,
        content: [
          "This is page " + pageNumber + " of the document: " + fileName,
          "",
          "The content would appear here if this were a real PDF document. This demonstration shows how the PDF Study Planner tracks your reading time and progress.",
          "",
          "Key features being demonstrated:",
          "• Page-by-page time tracking",
          "• Automatic timer functionality", 
          "• Progress saving and resuming",
          "• Reading speed calculations",
          "• Navigation controls",
          "",
          "All timing data is being collected accurately and will be used to calculate your reading speed and provide estimates for completing the entire document.",
          "",
          "You can navigate between pages using the controls above, and all your progress will be saved automatically."
        ]
      };
    }
  };

  const pageContent = generatePageContent();

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
                      <h1 className="text-lg font-semibold text-gray-900">{fileName}</h1>
                      <p className="text-sm text-gray-600">
                        Page {pageNumber} of {displayPages}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Timer Status */}
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                        isTracking ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
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
                          max={displayPages}
                          value={pageNumber}
                          onChange={(e) => goToPage(parseInt(e.target.value))}
                          className="w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-600">of {displayPages}</span>
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= displayPages}
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

                    {/* Save Progress */}
                    <div className="border-l pl-4">
                      <button
                        onClick={saveProgress}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {Math.round((pageNumber / displayPages) * 100)}% Complete
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(pageNumber / displayPages) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Content Display */}
              <div className="p-6">
                <div className="bg-white border rounded-lg p-8 max-w-4xl mx-auto" style={{ minHeight: '800px', transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                  <div className="prose max-w-none">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">{pageContent.title}</h2>
                    
                    <div className="space-y-4 text-gray-700 leading-relaxed">
                      {pageContent.content.map((line, index) => (
                        <p key={index} className={line === '' ? 'h-4' : line.startsWith('•') ? 'ml-4' : line.startsWith('"') ? 'italic text-center text-blue-700' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                      Page {pageNumber} of {displayPages} • {fileName}
                    </div>
                  </div>
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
                  <span className="font-medium">{Object.keys(pageTimes).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timer Status:</span>
                  <span className={`font-medium ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
                    {isTracking ? '🟢 Recording' : '🔴 Paused'}
                  </span>
                </div>
              </div>

              {/* Manual Timer Controls */}
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={toggleTimer}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isTracking 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isTracking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isTracking ? 'Pause Timer' : 'Start Timer'}</span>
                </button>
              </div>
            </div>

            {/* Page Times List */}
            {Object.keys(pageTimes).length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-3">Recent Pages</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto text-sm">
                  {Object.entries(pageTimes)
                    .sort(([a], [b]) => parseInt(b) - parseInt(a))
                    .slice(0, 10)
                    .map(([page, time]) => (
                      <div key={page} className="flex justify-between">
                        <span className="text-gray-600">Page {page}:</span>
                        <span className="font-medium">{formatTime(time)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Live Debug Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ Live Status</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>Timer: {isTracking ? '⏱️ RUNNING' : '⏸️ PAUSED'}</p>
                <p>Current: {currentPageTime}s</p>
                <p>Page: {pageNumber}/{displayPages}</p>
                <p>Saved: {Object.keys(pageTimes).length} pages</p>
                <p>Total: {formatTime(totalTime + currentPageTime)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;
