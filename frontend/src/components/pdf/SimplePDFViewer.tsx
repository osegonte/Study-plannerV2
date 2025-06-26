import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`

interface SimplePDFViewerProps {
  fileUrl: string
}

export default function SimplePDFViewer({ fileUrl }: SimplePDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    console.log('PDF loaded successfully:', { numPages })
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error)
    setError(error.message)
    setLoading(false)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-red-50 border border-red-200 rounded">
        <div className="text-center p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to load PDF</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <p className="text-sm text-red-600">
            Please try refreshing the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Controls */}
      <div className="flex items-center space-x-4 p-4 bg-white border rounded-lg shadow-sm">
        <button
          onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
          disabled={pageNumber <= 1}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        
        <span className="text-sm font-medium">
          Page {pageNumber} of {numPages || '...'}
        </span>
        
        <button
          onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
          disabled={pageNumber >= numPages}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>

      {/* PDF Document */}
      <div className="border border-gray-300 bg-white shadow-lg rounded">
        {loading && (
          <div className="flex items-center justify-center h-96 w-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}
        
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="flex items-center justify-center h-96 w-96">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            }
          />
        </Document>
      </div>
    </div>
  )
}
