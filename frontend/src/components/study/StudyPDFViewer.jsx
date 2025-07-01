import React from 'react';
import { BulletproofPDFViewer } from '../pdf';
import { usePDFViewer } from '../../hooks/usePDFViewer';

const StudyPDFViewer = ({ 
  currentTopic, 
  examDate, 
  studyGoals,
  onProgressUpdate,
  className = ""
}) => {
  const {
    currentPDF,
    readingTime,
    currentPage,
    handlePDFLoad,
    handlePageChange,
    handleTimeTrack,
  } = usePDFViewer();

  // Enhanced time tracking for study purposes
  const handleStudyTimeTrack = (event, data) => {
    handleTimeTrack(event, data);
    
    // Notify parent component about progress
    if (onProgressUpdate) {
      onProgressUpdate({
        event,
        data,
        currentPDF,
        readingTime,
        currentPage,
        topic: currentTopic
      });
    }
  };

  return (
    <div className={`study-pdf-viewer ${className}`}>
      {/* Study-specific header */}
      {currentTopic && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-blue-900">
                📚 Studying: {currentTopic}
              </h3>
              {examDate && (
                <p className="text-sm text-blue-700">
                  📅 Exam Date: {new Date(examDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">
                ⏱️ Session Time: {Math.floor(readingTime / 60)}m {readingTime % 60}s
              </p>
              {currentPDF && (
                <p className="text-sm text-blue-600">
                  📄 Current Page: {currentPage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulletproof PDF Viewer with study tracking */}
      <BulletproofPDFViewer
        currentTopic={currentTopic}
        onPageChange={handlePageChange}
        onTimeTrack={handleStudyTimeTrack}
        className="study-enhanced"
      />

      {/* Study progress footer */}
      {currentPDF && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              📊 Total Reading Time: {Math.floor(readingTime / 60)} minutes
            </span>
            <span>
              📈 Pages Read: {currentPage}
            </span>
            {studyGoals && (
              <span>
                🎯 Goal Progress: {Math.min(100, (currentPage / studyGoals.totalPages) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPDFViewer;
