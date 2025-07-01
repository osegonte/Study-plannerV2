import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Clock,
  Target,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';

const EnhancedStudyPDFViewer = ({ 
  pdfFile,
  pdfUrl,
  currentTopic = "Study Session",
  examDate,
  onTimeUpdate,
  onPageChange,
  onProgressUpdate,
  className = ""
}) => {
  // PDF Viewer State
  const [viewerMethod, setViewerMethod] = useState('browser');
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const viewerRef = useRef(null);

  // Timer & Study State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [pageStartTime, setPageStartTime] = useState(Date.now());
  const [pageTimeSpent, setPageTimeSpent] = useState({});
  const [readingSpeed, setReadingSpeed] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0);

  // Timer interval ref
  const timerRef = useRef(null);

  // Available viewing methods with fallbacks
  const viewingMethods = [
    { id: 'browser', name: 'Browser PDF Viewer' },
    { id: 'embed', name: 'Embedded PDF' },
    { id: 'iframe', name: 'PDF in Frame' },
    { id: 'download', name: 'Download & External View' }
  ];

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          if (onTimeUpdate) {
            onTimeUpdate(newTime, currentPage, currentTopic);
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, currentPage, currentTopic, onTimeUpdate]);

  // Calculate reading speed and estimates
  useEffect(() => {
    if (currentPage > 1 && sessionTime > 0) {
      const pagesRead = currentPage - 1;
      const speed = pagesRead / (sessionTime / 60); // pages per minute
      setReadingSpeed(speed);

      if (totalPages > 0) {
        const remainingPages = totalPages - currentPage;
        const estimatedMinutes = remainingPages / Math.max(speed, 0.1);
        setEstimatedTimeLeft(estimatedMinutes * 60); // convert to seconds
      }
    }
  }, [currentPage, sessionTime, totalPages]);

  // Page change handler
  const handlePageChange = useCallback((newPage) => {
    // Record time spent on previous page
    const timeOnPage = Date.now() - pageStartTime;
    setPageTimeSpent(prev => ({
      ...prev,
      [currentPage]: (prev[currentPage] || 0) + timeOnPage
    }));

    setCurrentPage(newPage);
    setPageStartTime(Date.now());
    
    if (onPageChange) {
      onPageChange(newPage);
    }

    if (onProgressUpdate) {
      onProgressUpdate({
        currentPage: newPage,
        totalPages,
        sessionTime,
        readingSpeed,
        estimatedTimeLeft,
        topic: currentTopic
      });
    }
  }, [currentPage, pageStartTime, totalPages, sessionTime, readingSpeed, estimatedTimeLeft, currentTopic, onPageChange, onProgressUpdate]);

  // Format time helper
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

  // PDF Viewer with fallbacks
  const renderPDFViewer = () => {
    if (!pdfUrl) return null;

    const baseStyle = {
      width: '100%',
      height: '700px',
      border: 'none',
      borderRadius: '8px',
      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
      transformOrigin: 'top left',
    };

    try {
      switch (viewerMethod) {
        case 'browser':
          return (
            <iframe
              ref={viewerRef}
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${currentPage}&view=FitH`}
              style={baseStyle}
              title="Study PDF Viewer"
              onLoad={() => {
                // Try to detect total pages
                if (pdfFile) {
                  // Estimate pages based on file size (rough estimate)
                  const estimatedPages = Math.max(1, Math.floor(pdfFile.size / 50000));
                  setTotalPages(estimatedPages);
                }
              }}
              onError={() => {
                setError('Browser PDF viewer failed. Switching to alternative...');
                setViewerMethod('embed');
              }}
            />
          );

        case 'embed':
          return (
            <embed
              ref={viewerRef}
              src={`${pdfUrl}#page=${currentPage}`}
              type="application/pdf"
              style={baseStyle}
              onError={() => {
                setError('Embed method failed. Switching to iframe...');
                setViewerMethod('iframe');
              }}
            />
          );

        case 'iframe':
          return (
            <iframe
              ref={viewerRef}
              src={pdfUrl}
              style={baseStyle}
              title="Study PDF Viewer"
              onError={() => {
                setError('All viewing methods failed. Download option available.');
                setViewerMethod('download');
              }}
            />
          );

        case 'download':
          return (
            <div className="flex flex-col items-center justify-center h-96 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
              <FileText className="w-16 h-16 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">PDF Ready for External Viewing</h3>
              <p className="text-blue-700 mb-4 text-center max-w-md">
                Download the PDF to view in your default PDF viewer. Timer will continue running for your study session.
              </p>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = pdfUrl;
                  link.download = pdfFile?.name || 'study-document.pdf';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download PDF ({pdfFile ? (pdfFile.size / 1024 / 1024).toFixed(1) : '?'} MB)
              </button>
            </div>
          );

        default:
          return null;
      }
    } catch (err) {
      setError('Failed to render PDF: ' + err.message);
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-700 mb-4">Failed to display PDF</p>
          <button
            onClick={() => setViewerMethod('download')}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Download Method
          </button>
        </div>
      );
    }
  };

  return (
    <div className={`enhanced-study-pdf-viewer ${className}`}>
      {/* Study Header with Timer and Progress */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              📚 {currentTopic}
            </h3>
            {examDate && (
              <p className="text-sm text-blue-700">
                📅 Exam: {new Date(examDate).toLocaleDateString()} 
                ({Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))} days)
              </p>
            )}
          </div>
          
          {/* Timer Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isTimerRunning 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isTimerRunning ? 'Pause' : 'Start'} Timer
            </button>
          </div>
        </div>

        {/* Study Analytics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-blue-700">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Session:</span>
            <span className="font-mono">{formatTime(sessionTime)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-purple-700">
            <FileText className="w-4 h-4" />
            <span className="font-medium">Page:</span>
            <span className="font-mono">{currentPage}/{totalPages || '?'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-green-700">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">Speed:</span>
            <span className="font-mono">{readingSpeed.toFixed(1)} p/min</span>
          </div>
          
          <div className="flex items-center gap-2 text-orange-700">
            <Target className="w-4 h-4" />
            <span className="font-medium">Est. Left:</span>
            <span className="font-mono">{formatTime(Math.floor(estimatedTimeLeft))}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {totalPages > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{((currentPage / totalPages) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentPage / totalPages) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 text-sm">{error}</p>
              <div className="mt-2 flex gap-2">
                {viewingMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setViewerMethod(method.id);
                      setError(null);
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      viewerMethod === method.id
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-white text-yellow-700 border border-yellow-300 hover:bg-yellow-50'
                    }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <input
              type="number"
              value={currentPage}
              onChange={(e) => handlePageChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
              min="1"
              max={totalPages || 999}
            />
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={totalPages > 0 && currentPage >= totalPages}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {pdfFile && (
            <span className="text-sm text-gray-700">
              📄 {pdfFile.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={() => setZoom(Math.max(50, zoom - 25))}
            disabled={zoom <= 50}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 min-w-[3rem] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 25))}
            disabled={zoom >= 200}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Rotation */}
          <button
            onClick={() => setRotation((rotation + 90) % 360)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        {renderPDFViewer()}
      </div>

      {/* Session Summary */}
      {sessionTime > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center text-sm text-green-800">
            <span>📊 Session Progress: {currentPage} pages in {formatTime(sessionTime)}</span>
            <span>🎯 Average: {sessionTime > 0 ? formatTime(Math.floor(sessionTime / Math.max(currentPage, 1))) : '0s'} per page</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStudyPDFViewer;
