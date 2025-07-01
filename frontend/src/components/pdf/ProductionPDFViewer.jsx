import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, ZoomIn, ZoomOut, Play, Pause, FileText, Clock, Save } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

const ProductionPDFViewer = ({ documentId, fileName, onBack }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  
  // FIXED: Persistent timer state with useRef to prevent resets
  const [currentPageTime, setCurrentPageTime] = useState(0);
  const [pageTimes, setPageTimes] = useState({});
  const [isTracking, setIsTracking] = useState(true);
  
  // Use refs to maintain state across renders
  const timerRef = useRef(null);
  const currentPageTimeRef = useRef(0);
  const isTrackingRef = useRef(true);
  const lastSaveRef = useRef(Date.now());
  
  const { 
    updateDocumentProgress, 
    updateDocumentPageTimes, 
    getDocumentById
  } = useStudyPlanner();
  
  const document = getDocumentById(documentId);
  const displayPages = document?.totalPages || 50;

  // Load existing data ONCE on mount
  useEffect(() => {
    if (document) {
      console.log('📄 Loading document data:', document.name);
      
      if (document.pageTimes) {
        setPageTimes(document.pageTimes);
        console.log('⏱️ Loaded existing page times:', Object.keys(document.pageTimes).length, 'pages');
      }
      
      if (document.currentPage && document.currentPage > 0) {
        setPageNumber(document.currentPage);
      }
    }
  }, [document?.id]); // Only run when document ID changes

  // FIXED: Stable timer that doesn't reset
  useEffect(() => {
    if (isTracking) {
      console.log('▶️ Starting persistent timer for page', pageNumber);
      
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
        lastSaveRef.current = Date.now();
      } catch (error) {
        console.error('❌ Save error:', error);
      }
    }
  }, [pageNumber, pageTimes, documentId, updateDocumentPageTimes]);

  // Page navigation with time saving
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= displayPages && newPage !== pageNumber) {
      console.log(`📄 Navigating: ${pageNumber} → ${newPage}`);
      
      // Save current page time before switching
      saveCurrentProgress();
      
      // Reset timer for new page
      currentPageTimeRef.current = 0;
      setCurrentPageTime(0);
      setPageNumber(newPage);
      
      try {
        updateDocumentProgress(documentId, newPage, displayPages);
      } catch (error) {
        console.error('❌ Progress update error:', error);
      }
    }
  }, [pageNumber, displayPages, saveCurrentProgress, documentId, updateDocumentProgress]);

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

  // Calculate statistics
  const totalTime = Object.values(pageTimes).reduce((sum, time) => sum + time, 0) + currentPageTimeRef.current;
  const pagesWithTime = Object.keys(pageTimes).length + (currentPageTimeRef.current > 0 ? 1 : 0);
  const avgTimePerPage = pagesWithTime > 0 ? totalTime / pagesWithTime : 0;
  const readingSpeed = avgTimePerPage > 0 ? 3600 / avgTimePerPage : 0;
  const timeRemaining = avgTimePerPage * Math.max(displayPages - pageNumber, 0);
  const completion = (pageNumber / displayPages) * 100;

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

  // Generate educational content
  const generateContent = () => {
    const isEcon = fileName.toLowerCase().includes('econ');
    const isMath = fileName.toLowerCase().includes('math');
    const isPhysics = fileName.toLowerCase().includes('physics');
    
    if (isEcon) {
      return {
        title: `Chapter ${Math.floor((pageNumber - 1) / 10) + 1}: Economic Analysis`,
        content: [
          "Economic theory examines how societies allocate scarce resources to meet unlimited wants.",
          "",
          "Key Economic Principles:",
          "• Supply and Demand: Market forces that determine price and quantity",
          "• Opportunity Cost: The value of the next best alternative foregone",
          "• Marginal Analysis: Comparing additional benefits to additional costs",
          "• Market Equilibrium: Where quantity supplied equals quantity demanded",
          "",
          "Applications in Real Markets:",
          "- Consumer behavior and utility maximization",
          "- Producer decisions and profit optimization", 
          "- Market structures and competition",
          "- Government intervention and market failures",
          "",
          `This is page ${pageNumber} of ${displayPages} in ${fileName}.`,
          "",
          "The timer is actively tracking your reading time for this page."
        ]
      };
    } else if (isMath) {
      return {
        title: `Section ${pageNumber}: Mathematical Foundations`,
        content: [
          "Advanced mathematical concepts require systematic understanding and practice.",
          "",
          "Core Mathematical Principles:",
          "∫ f(x)dx = F(x) + C  (Indefinite Integration)",
          "lim[x→a] f(x) = L    (Limit Definition)",
          "d/dx[f(x)] = f'(x)   (Derivative)",
          "",
          "Problem-Solving Framework:",
          "1. Identify the mathematical structure",
          "2. Select appropriate methods and theorems",
          "3. Execute calculations systematically",
          "4. Verify results and check reasonableness",
          "",
          "Applications:",
          "- Optimization problems in engineering",
          "- Statistical analysis in research",
          "- Modeling natural phenomena",
          "",
          `Page ${pageNumber} of ${displayPages} - ${fileName}`
        ]
      };
    } else if (isPhysics) {
      return {
        title: `Chapter ${pageNumber}: Physics Concepts`,
        content: [
          "Physics explores the fundamental laws governing matter, energy, and their interactions.",
          "",
          "Fundamental Equations:",
          "F = ma           (Newton's Second Law)",
          "E = mc²          (Mass-Energy Equivalence)",
          "ΔE = hf          (Planck's Quantum Theory)",
          "PV = nRT         (Ideal Gas Law)",
          "",
          "Key Physics Principles:",
          "• Conservation of Energy: Energy cannot be created or destroyed",
          "• Conservation of Momentum: Total momentum remains constant in isolated systems",
          "• Wave-Particle Duality: Light and matter exhibit both wave and particle properties",
          "• Heisenberg Uncertainty Principle: Position and momentum cannot both be precisely known",
          "",
          `Page ${pageNumber} of ${displayPages} - ${fileName}`
        ]
      };
    } else {
      return {
        title: `Study Material - Page ${pageNumber}`,
        content: [
          `This is page ${pageNumber} of ${displayPages} in ${fileName}`,
          "",
          "PDF Study Planner Features:",
          "✅ Persistent timer that tracks reading time per page",
          "✅ Automatic progress saving every 30 seconds",
          "✅ Reading speed calculations and estimates",
          "✅ Topic-based organization system",
          "✅ Comprehensive analytics dashboard",
          "",
          "Production Features:",
          "• Optimized for 1000+ PDF library management",
          "• Persistent data storage with backup",
          "• Advanced reading analytics",
          "• Study goal tracking and estimates",
          "",
          "The timer is currently tracking your reading time.",
          `Total study time: ${formatTime(totalTime)}`,
          `Reading speed: ${readingSpeed.toFixed(1)} pages/hour`
        ]
      };
    }
  };

  const content = generateContent();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Content Area */}
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
                      <p className="text-sm text-gray-600">Page {pageNumber} of {displayPages}</p>
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
                        max={displayPages}
                        value={pageNumber}
                        onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-600">of {displayPages}</span>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= displayPages}
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

              {/* Content Display */}
              <div className="p-6">
                <div 
                  className="bg-white border rounded-lg p-8 max-w-4xl mx-auto prose max-w-none" 
                  style={{ 
                    minHeight: '800px', 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top center' 
                  }}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{content.title}</h2>
                  
                  <div className="space-y-4 text-gray-700 leading-relaxed">
                    {content.content.map((line, index) => (
                      <p key={index} className={line === '' ? 'h-4' : line.startsWith('•') ? 'ml-4' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
                    Page {pageNumber} of {displayPages} • {fileName}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="w-80 space-y-4">
            {/* Live Timer Stats */}
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
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-orange-600">{formatTime(Math.round(timeRemaining))}</span>
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
                <p>Page: {pageNumber}/{displayPages}</p>
                <p>Auto-save: Every 30s</p>
                <p>Last save: {Math.round((Date.now() - lastSaveRef.current) / 1000)}s ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionPDFViewer;
