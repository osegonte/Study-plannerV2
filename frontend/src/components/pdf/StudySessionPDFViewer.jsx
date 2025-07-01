import React, { useState, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import EnhancedStudyPDFViewer from './EnhancedStudyPDFViewer';

const StudySessionPDFViewer = ({
  currentTopic,
  examDate,
  onTimeUpdate,
  onPageChange,
  onProgressUpdate,
  className = ""
}) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    
    // Validate file
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      setError('PDF file is too large (max 100MB)');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const url = URL.createObjectURL(file);
      setPdfFile(file);
      setPdfUrl(url);
      setLoading(false);
    } catch (err) {
      setError('Failed to load PDF: ' + err.message);
      setLoading(false);
    }
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Cleanup URL on unmount
  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!pdfFile) {
    return (
      <div className={`study-session-pdf-viewer ${className}`}>
        <div
          className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-blue-50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('pdf-upload')?.click()}
        >
          <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📚 Upload Study Material
          </h3>
          <p className="text-blue-700 mb-4">
            Drag and drop a PDF file here, or click to browse
          </p>
          <p className="text-sm text-blue-600">
            Perfect for textbooks, notes, research papers • Max 100MB
          </p>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-4 flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-blue-600">Loading PDF...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`study-session-pdf-viewer ${className}`}>
      <EnhancedStudyPDFViewer
        pdfFile={pdfFile}
        pdfUrl={pdfUrl}
        currentTopic={currentTopic}
        examDate={examDate}
        onTimeUpdate={onTimeUpdate}
        onPageChange={onPageChange}
        onProgressUpdate={onProgressUpdate}
      />
      
      {/* Option to load new PDF */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setPdfFile(null);
            setPdfUrl(null);
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Load Different PDF
        </button>
      </div>
    </div>
  );
};

export default StudySessionPDFViewer;
