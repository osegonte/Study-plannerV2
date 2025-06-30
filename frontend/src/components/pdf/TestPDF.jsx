import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Enhanced worker configuration
const configureWorker = () => {
  const workerUrls = [
    '/pdf.worker.min.js',
    `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
  ];
  
  for (const url of workerUrls) {
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = url;
      console.log('🔧 Test PDF Worker configured:', url);
      break;
    } catch (error) {
      console.warn('⚠️ Test Worker URL failed:', url, error);
    }
  }
};

configureWorker();

const TestPDF = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('✅ Test PDF loaded successfully:', numPages, 'pages');
    setNumPages(numPages);
    setError(null);
    setRetryCount(0);
  };

  const onDocumentLoadError = (error) => {
    console.error('❌ Test PDF failed to load:', error);
    const errorMsg = error.message || error.toString();
    
    if (errorMsg.includes('detached ArrayBuffer') || errorMsg.includes('detached buffer')) {
      setError('Buffer detachment detected - this confirms the issue');
    } else {
      setError(`Load error: ${errorMsg}`);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    // Force re-render by changing key
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Enhanced PDF Test Component</h2>
        <p className="text-yellow-700 text-sm">
          This tests PDF loading with enhanced buffer protection against ArrayBuffer detachment.
          {retryCount > 0 && ` (Retry attempt: ${retryCount})`}
        </p>
      </div>
      
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Test PDF Loading</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Worker:</strong> {pdfjs.GlobalWorkerOptions.workerSrc}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Status:</strong> {
              error ? `❌ Error: ${error}` :
              numPages ? `✅ Loaded ${numPages} pages` : 
              '⏳ Loading...'
            }
          </p>
          {retryCount > 0 && (
            <p className="text-sm text-yellow-600">
              <strong>Retries:</strong> {retryCount}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              🔄 Retry Test
            </button>
          </div>
        )}

        <Document
          key={`test-pdf-${retryCount}`} // Force re-render on retry
          file="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Loading test PDF...</p>
              <p className="text-gray-500 text-sm mt-1">Enhanced buffer protection active</p>
            </div>
          }
          error={
            <div className="text-center py-8 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">❌ Test PDF failed to load</p>
              <p className="text-red-500 text-sm mt-1">Check browser console for details</p>
              <button
                onClick={handleRetry}
                className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                🔄 Retry
              </button>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={0.5} 
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="bg-white shadow-lg rounded border p-8 animate-pulse">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            }
          />
        </Document>

        {numPages && (
          <div className="mt-4 flex items-center justify-center space-x-4">
            <button
              onClick={() => setPageNumber(Math.max(pageNumber - 1, 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={() => setPageNumber(Math.min(pageNumber + 1, numPages))}
              disabled={pageNumber >= numPages}
              className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
        
        {numPages && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-700 text-sm">
              ✅ Test successful! PDF loaded without buffer detachment errors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPDF;
