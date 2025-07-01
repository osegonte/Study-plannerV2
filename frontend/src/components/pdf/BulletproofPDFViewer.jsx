import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, AlertCircle, FileText, ZoomIn, ZoomOut, RotateCw, Download, RefreshCw, Eye, Settings } from 'lucide-react';

const BulletproofPDFViewer = ({ 
  onPageChange, 
  onTimeTrack, 
  currentTopic,
  className = "",
  ...props 
}) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [viewerMethod, setViewerMethod] = useState('browser');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef(null);
  const viewerRef = useRef(null);

  // Available viewing methods in order of preference
  const viewingMethods = [
    { 
      id: 'browser', 
      name: 'Browser PDF Viewer', 
      description: 'Uses browser\'s built-in PDF viewer',
      compatibility: 'High - Works in all modern browsers'
    },
    { 
      id: 'embed', 
      name: 'Embedded PDF', 
      description: 'Embeds PDF directly in page',
      compatibility: 'Medium - May not work in some browsers'
    },
    { 
      id: 'iframe', 
      name: 'PDF in Frame', 
      description: 'Shows PDF in isolated frame',
      compatibility: 'Medium - Similar to embed method'
    },
    { 
      id: 'download', 
      name: 'Download & External View', 
      description: 'Downloads PDF to view externally',
      compatibility: 'Universal - Always works'
    }
  ];

  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file');
      return;
    }

    // Check file size (limit to 50MB for better performance)
    if (file.size > 50 * 1024 * 1024) {
      setError('PDF file is too large (max 50MB). Consider compressing it first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Create object URL for the PDF
      const url = URL.createObjectURL(file);
      setPdfFile(file);
      setPdfUrl(url);
      setLoading(false);
      
      // Notify parent component for study tracking
      if (onTimeTrack) {
        onTimeTrack('pdf_loaded', { fileName: file.name, fileSize: file.size });
      }
    } catch (err) {
      setError('Failed to load PDF file: ' + err.message);
      setLoading(false);
    }
  }, [onTimeTrack]);

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

  const downloadPDF = () => {
    if (!pdfFile) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const switchViewerMethod = (method) => {
    setViewerMethod(method);
    setError(null);
  };

  const renderPDFViewer = () => {
    if (!pdfUrl) return null;

    const baseStyle = {
      width: '100%',
      height: '600px',
      border: '1px solid #e5e7eb',
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
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
              style={baseStyle}
              title="PDF Viewer"
              onError={() => {
                setError('Browser PDF viewer failed. Trying alternative method...');
                setViewerMethod('embed');
              }}
            />
          );

        case 'embed':
          return (
            <embed
              ref={viewerRef}
              src={pdfUrl}
              type="application/pdf"
              style={baseStyle}
              onError={() => {
                setError('Embed method failed. Trying iframe method...');
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
              title="PDF Viewer"
              onError={() => {
                setError('Iframe method failed. Please download the PDF to view it.');
                setViewerMethod('download');
              }}
            />
          );

        case 'download':
          return (
            <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">PDF Ready for Download</h3>
              <p className="text-gray-600 mb-4 text-center max-w-md">
                Your browser doesn't support inline PDF viewing. Click below to download and view the PDF in your default PDF viewer.
              </p>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download PDF ({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)
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
          <p className="text-red-700">Failed to display PDF</p>
          <button
            onClick={downloadPDF}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Download Instead
          </button>
        </div>
      );
    }
  };

  const resetViewer = () => {
    setZoom(100);
    setRotation(0);
    setViewerMethod('browser');
    setError(null);
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className={`bulletproof-pdf-viewer ${className}`} {...props}>
      {/* File Upload Area */}
      {!pdfFile && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Upload your PDF file
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop a PDF file here, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports files up to 50MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading PDF...</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 font-semibold">Viewer Issue</p>
              <p className="text-yellow-700 text-sm mt-1">{error}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {viewingMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => switchViewerMethod(method.id)}
                    className={`px-3 py-1 text-xs rounded ${
                      viewerMethod === method.id
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-white text-yellow-700 border border-yellow-300 hover:bg-yellow-50'
                    }`}
                  >
                    Try {method.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Controls */}
      {pdfFile && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              📄 {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)
            </span>
            {currentTopic && (
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                Topic: {currentTopic}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[4rem] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Rotation Control */}
            <button
              onClick={() => setRotation((rotation + 90) % 360)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              onClick={downloadPDF}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              onClick={resetViewer}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* New File */}
            <button
              onClick={() => {
                setPdfFile(null);
                setPdfUrl(null);
                setError(null);
                setZoom(100);
                setRotation(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              New PDF
            </button>
          </div>
        </div>
      )}

      {/* Viewer Method Settings */}
      {showSettings && pdfFile && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3">Viewing Method Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {viewingMethods.map(method => (
              <div
                key={method.id}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  viewerMethod === method.id
                    ? 'border-blue-500 bg-white shadow-sm'
                    : 'border-blue-200 hover:border-blue-400'
                }`}
                onClick={() => switchViewerMethod(method.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">{method.name}</span>
                  {viewerMethod === method.id && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Active</span>
                  )}
                </div>
                <p className="text-sm text-blue-700 mb-1">{method.description}</p>
                <p className="text-xs text-blue-600">{method.compatibility}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {pdfFile && (
        <div className="border rounded-lg overflow-hidden">
          {renderPDFViewer()}
        </div>
      )}
    </div>
  );
};

export default BulletproofPDFViewer;
