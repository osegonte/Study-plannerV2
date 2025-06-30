import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Use the local worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const TestPDF = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('✅ Test PDF loaded successfully:', numPages, 'pages');
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error) => {
    console.error('❌ Test PDF failed to load:', error);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">🧪 PDF Test Component</h2>
          <p className="text-yellow-700 text-sm">
            This tests basic PDF loading with a known working file from Mozilla.
            If this works, the issue is with your uploaded files. If this fails, there's a worker/configuration problem.
          </p>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Test PDF Loading</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Worker:</strong> {pdfjs.GlobalWorkerOptions.workerSrc}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Status:</strong> {numPages ? `✅ Loaded ${numPages} pages` : '⏳ Loading...'}
            </p>
          </div>

          <Document
            file="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading test PDF...</p>
              </div>
            }
            error={
              <div className="text-center py-8 bg-red-50 border border-red-200 rounded">
                <p className="text-red-600">❌ Test PDF failed to load</p>
                <p className="text-red-500 text-sm mt-1">Check browser console for details</p>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              scale={0.5} 
              renderTextLayer={false}
              renderAnnotationLayer={false}
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
        </div>
      </div>
    );
  };

export default TestPDF;
