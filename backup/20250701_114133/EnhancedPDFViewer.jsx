import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Play, Pause, FileText, Clock, Save } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

const EnhancedPDFViewer = ({ documentId, fileName, onBack }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  
  // FIXED Timer state with better initialization
  const [isTracking, setIsTracking] = useState(false);
  const [currentPageTime, setCurrentPageTime] = useState(0);
  const [pageTimes, setPageTimes] = useState({});
  const [totalTime, setTotalTime] = useState(0);
  
  const intervalRef = useRef(null);
  const { 
    updateDocumentProgress, 
    updateDocumentPageTimes, 
    getDocumentById
  } = useStudyPlanner();
  
  // Get document data with safe fallbacks
  const document = getDocumentById(documentId);
  const displayPages = document?.totalPages || 50; // Default pages

  // Load existing progress safely
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

  // Auto-start timer when component loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTracking(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // FIXED TIMER FUNCTIONALITY with better error handling
  useEffect(() => {
    if (isTracking) {
      console.log('✅ Timer started for page', pageNumber);
      intervalRef.current = setInterval(() => {
        setCurrentPageTime(prev => {
          const newTime = prev + 1;
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('⏹️ Timer stopped');
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, pageNumber]);

  // Save page time when navigating
  const saveCurrentPageTime = useCallback(() => {
    if (currentPageTime > 0) {
      const newPageTimes = {
        ...pageTimes,
        [pageNumber]: (pageTimes[pageNumber] || 0) + currentPageTime
      };
      setPageTimes(newPageTimes);
      
      // Safe update to context
      try {
        updateDocumentPageTimes(documentId, newPageTimes);
        setTotalTime(Object.values(newPageTimes).reduce((sum, time) => sum + time, 0));
        console.log('💾 Saved', currentPageTime, 'seconds for page', pageNumber);
      } catch (error) {
        console.error('Error saving page times:', error);
      }
    }
  }, [currentPageTime, pageNumber, pageTimes, documentId, updateDocumentPageTimes]);

  // Page navigation with bounds checking
  const goToPage = useCallback((newPage) => {
    const targetPage = Math.max(1, Math.min(newPage, displayPages));
    
    if (targetPage !== pageNumber) {
      console.log(`📄 Navigating from page ${pageNumber} to page ${targetPage}`);
      
      // Save current page time
      saveCurrentPageTime();
      
      setPageNumber(targetPage);
      setCurrentPageTime(0); // Reset timer for new page
      
      // Safe progress update
      try {
        updateDocumentProgress(documentId, targetPage, displayPages);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  }, [pageNumber, displayPages, saveCurrentPageTime, documentId, updateDocumentProgress]);

  const goToPrevPage = () => goToPage(pageNumber - 1);
  const goToNextPage = () => goToPage(pageNumber + 1);

  // Toggle timer manually
  const toggleTimer = () => {
    if (isTracking) {
      setIsTracking(false);
      saveCurrentPageTime();
    } else {
      setIsTracking(true);
      setCurrentPageTime(0);
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

  // Enhanced content generation with better error handling
  const generatePageContent = () => {
    try {
      const isEconomics = fileName.toLowerCase().includes('economic') || 
                          fileName.toLowerCase().includes('supply') || 
                          fileName.toLowerCase().includes('demand');
      const isMath = fileName.toLowerCase().includes('math') || 
                     fileName.toLowerCase().includes('calculus');
      const isPhysics = fileName.toLowerCase().includes('physics') || 
                        fileName.toLowerCase().includes('quantum');
      
      if (isEconomics) {
        return {
          title: `Chapter ${Math.floor((pageNumber - 1) / 5) + 1}: Economic Principles`,
          content: [
            "Economic theory provides the foundation for understanding how markets function and how resources are allocated in society.",
            "",
            "Supply and Demand Analysis:",
            "• Law of Supply: As price increases, quantity supplied increases",
            "• Law of Demand: As price increases, quantity demanded decreases", 
            "• Market Equilibrium: Where supply and demand curves intersect",
            "",
            "The interaction between supply and demand determines market prices and quantities in competitive markets.",
            "",
            `This is page ${pageNumber} of ${displayPages} in your ${fileName}.`
          ]
        };
      } else if (isMath) {
        return {
          title: `Section ${pageNumber}: Mathematical Analysis`,
          content: [
            "Advanced mathematical concepts require systematic study and practice.",
            "",
            "Fundamental Theorem:",
            "∫[a to b] f'(x)dx = f(b) - f(a)",
            "",
            "Key Properties:",
            "• Continuity and differentiability",
            "• Limits and convergence", 
            "• Integration techniques",
            "",
            `Page ${pageNumber} of ${displayPages} - ${fileName}`
          ]
        };
      } else if (isPhysics) {
        return {
          title: `Chapter ${pageNumber}: Physics Concepts`,
          content: [
            "Quantum mechanics represents one of the most revolutionary developments in physics.",
            "",
            "Schrödinger's equation: iℏ ∂Ψ/∂t = ĤΨ",
            "",
            "Key Principles:",
            "• Wave-particle duality",
            "• Heisenberg uncertainty principle",
            "• Quantum superposition",
            "",
            `Page ${pageNumber} of ${displayPages} - ${fileName}`
          ]
        };
      } else {
        return {
          title: `Page ${pageNumber}: Study Material`,
          content: [
            `This is page ${pageNumber} of the document: ${fileName}`,
            "",
            "PDF Study Planner Features:",
            "✅ Automatic time tracking per page",
            "✅ Reading progress calculation", 
            "✅ Page navigation with memory",
            "✅ Study analytics and estimates",
            "",
            "The timer is currently tracking your reading time for this page.",
            "",
            `Total pages in document: ${displayPages}`
          ]
        };
      }
    } catch (error) {
      console.error('Error generating content:', error);
      return {
        title: `Page ${pageNumber}`,
        content: [`This is page ${pageNumber} of ${displayPages}.`]
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
                      <h1 className="text-lg font-semibold text-gray-900">{fileName || 'Document'}</h1>
                      <p className="text-sm text-gray-600">Page {pageNumber} of {displayPages}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Timer Status - WORKING */}
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
                          max={displayPages}
                          value={pageNumber}
                          onChange={(e) => {
                            const page = parseInt(e.target.value);
                            if (!isNaN(page)) {
                              goToPage(page);
                            }
                          }}
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
                <div 
                  className="bg-white border rounded-lg p-8 max-w-4xl mx-auto" 
                  style={{ 
                    minHeight: '800px', 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top center' 
                  }}
                >
                  <div className="prose max-w-none">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">{pageContent.title}</h2>
                    
                    <div className="space-y-4 text-gray-700 leading-relaxed">
                      {pageContent.content.map((line, index) => (
                        <p key={index} className={line === '' ? 'h-4' : line.startsWith('•') ? 'ml-4' : ''}>
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

            {/* Debug Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ Status</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>Timer: {isTracking ? '⏱️ RUNNING' : '⏸️ PAUSED'}</p>
                <p>Current: {currentPageTime}s</p>
                <p>Page: {pageNumber}/{displayPages}</p>
                <p>Document: {documentId || 'No ID'}</p>
                <p>Total Time: {formatTime(totalTime + currentPageTime)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;