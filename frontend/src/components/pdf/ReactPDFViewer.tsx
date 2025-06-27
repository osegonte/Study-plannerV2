import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Loader2, AlertCircle } from 'lucide-react'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`

interface ReactPDFViewerProps {
  pdfId: string
  onPageChange?: (page: number) => void
  onLoadSuccess?: (numPages: number) => void
  onLoadError?: (error: Error) => void
  className?: string
}

export default function ReactPDFViewer({
  pdfId,
  onPageChange,
  onLoadSuccess,
  onLoadError,
  className = "h-full"
}: ReactPDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fileUrl = `/api/pdfs/${pdfId}/file?t=${Date.now()}`

  const onDocumentLoadSuccess = useCallback(({ numPages }: PDFDocumentProxy) => {
    console.log('📄 PDF loaded successfully with', numPages, 'pages')
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    
    if (onLoadSuccess) {
      onLoadSuccess(numPages)
    }
  }, [onLoadSuccess])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ PDF load error:', error)
    setError(error.message || 'Failed to load PDF')
    setLoading(false)
    
    if (onLoadError) {
      onLoadError(error)
    }
  }, [onLoadError])

  const handlePageChange = useCallback((newPage: number) => {
    setPageNumber(newPage)
    if (onPageChange) {
      onPageChange(newPage)
    }
  }, [onPageChange])

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      handlePageChange(pageNumber - 1)
    }
  }

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      handlePageChange(pageNumber + 1)
    }
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))
  const rotate = () => setRotation(prev => (prev + 90) % 360)

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Loading Failed</h3>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} flex flex-col bg-gray-100`}>
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Page Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={(e) => {
                  const page = parseInt(e.target.value)
                  if (page >= 1 && page <= numPages) {
                    handlePageChange(page)
                  }
                }}
                className="w-16 px-2 py-1 text-center border rounded"
              />
              <span className="text-gray-600">of {numPages}</span>
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 border-l pl-4">
            <button
              onClick={zoomOut}
              className="p-2 rounded hover:bg-gray-100"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600 min-w-[4rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={zoomIn}
              className="p-2 rounded hover:bg-gray-100"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            
            <button
              onClick={rotate}
              className="p-2 rounded hover:bg-gray-100"
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="text-sm text-gray-600">
          {Math.round((pageNumber / numPages) * 100)}% complete
        </div>
      </div>

      {/* PDF Display */}
      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        <div className="flex justify-center">
          <div className="bg-white shadow-lg">
            {loading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                <span>Loading PDF...</span>
              </div>
            )}
            
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                  <span>Loading document...</span>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8 text-red-600">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  <span>Failed to load PDF</span>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                    <span>Loading page...</span>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center p-8 text-red-600">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <span>Failed to load page</span>
                  </div>
                }
              />
            </Document>
          </div>
        </div>
      </div>
    </div>
  )
}