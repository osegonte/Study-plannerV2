import { useState, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react'
import { useReadingTimer } from '@/hooks/useReadingTimer'
import { usePDF } from '@/contexts/PDFContext'
import { apiClient } from '@/utils/api'

// Set up PDF.js worker with multiple fallbacks
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString()

// Fallback worker sources
const workerSources = [
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `/node_modules/pdfjs-dist/build/pdf.worker.min.js`
]

// Try different worker sources if the first one fails
let workerIndex = 0
const tryNextWorker = () => {
  if (workerIndex < workerSources.length) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerSources[workerIndex]
    workerIndex++
  }
}

interface PDFViewerProps {
  file: File | string
  pdfId?: string
}

export default function PDFViewer({ file, pdfId }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)
  
  const { startTimer, stopTimer, isRunning, formattedTime } = useReadingTimer()
  const { dispatch } = usePDF()

  // Handle successful PDF load
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', { numPages })
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    setRetryCount(0)
    
    // Update context
    dispatch({ type: 'SET_TOTAL_PAGES', payload: numPages })
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 })
    
    // Start timer for first page
    startTimer()
  }, [dispatch, startTimer])

  // Handle PDF load error with retry logic
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error)
    
    // Try next worker source
    if (retryCount < workerSources.length - 1) {
      console.log('Trying alternative worker source...')
      tryNextWorker()
      setRetryCount(prev => prev + 1)
      setLoading(true)
      return
    }
    
    let errorMessage = 'Failed to load PDF. '
    
    if (error.message.includes('worker')) {
      errorMessage += 'PDF.js worker failed to load. This might be a network issue.'
    } else if (error.message.includes('format')) {
      errorMessage += 'Invalid PDF format or corrupted file.'
    } else if (error.message.includes('network')) {
      errorMessage += 'Network error. Please check your connection.'
    } else {
      errorMessage += 'Please try refreshing the page or uploading the file again.'
    }
    
    setError(errorMessage)
    setLoading(false)
  }, [retryCount])

  // Handle page change
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > numPages) return

    // Save reading time for current page
    if (isRunning && pdfId) {
      const timeSpent = stopTimer()
      
      try {
        await apiClient.saveReadingSession({
          pdfId,
          page: currentPage,
          startTime: new Date(Date.now() - timeSpent),
          endTime: new Date(),
          duration: timeSpent
        })
      } catch (error) {
        console.error('Failed to save reading session:', error)
      }
    }

    // Update page
    setCurrentPage(page)
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page })
    
    // Start timer for new page
    startTimer()

    // Update progress on backend
    if (pdfId) {
      try {
        await apiClient.request(`/pdfs/${pdfId}/progress`, {
          method: 'PUT',
          body: JSON.stringify({ currentPage: page })
        })
      } catch (error) {
        console.error('Failed to update progress:', error)
      }
    }
  }, [currentPage, numPages, isRunning, pdfId, stopTimer, startTimer, dispatch])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        goToPage(currentPage - 1)
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        goToPage(currentPage + 1)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, goToPage])

  // Zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const resetZoom = () => setScale(1.0)

  // Retry loading
  const retryLoad = () => {
    setError(null)
    setLoading(true)
    setRetryCount(0)
    // Reset worker to first option
    workerIndex = 0
    pdfjs.GlobalWorkerOptions.workerSrc = workerSources[0]
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Loading Error</h3>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <div className="space-y-2">
            <button onClick={retryLoad} className="btn-primary">
              Try Again
            </button>
            <div className="text-xs text-gray-500">
              <p>If the problem persists:</p>
              <ul className="mt-1 space-y-1">
                <li>• Check if the PDF file is valid</li>
                <li>• Try refreshing the page</li>
                <li>• Check your internet connection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          {/* Page Navigation */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (!isNaN(page)) goToPage(page)
              }}
              className="w-16 px-2 py-1 text-center border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="1"
              max={numPages}
              disabled={loading}
            />
            <span className="text-gray-600 text-sm">
              of {loading ? '...' : numPages}
            </span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages || loading}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page (→)"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <span className="text-sm text-gray-600 min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          
          <button
            onClick={resetZoom}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Reset zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Reading Timer */}
        {isRunning && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Reading: {formattedTime}</span>
          </div>
        )}
      </div>

      {/* PDF Document */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="flex justify-center p-4">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">
                Loading PDF... {retryCount > 0 && `(attempt ${retryCount + 1})`}
              </span>
            </div>
          )}
          
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="shadow-lg"
            options={{
              cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
              standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
            }}
          >
            {!loading && !error && (
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="border border-gray-300 bg-white"
                loading={
                  <div className="flex items-center justify-center h-96 bg-gray-100 border">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-96 bg-red-50 border border-red-200">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-700 text-sm">Failed to load page</p>
                    </div>
                  </div>
                }
                noData={
                  <div className="flex items-center justify-center h-96 bg-gray-100 border">
                    <p className="text-gray-500">No page data</p>
                  </div>
                }
              />
            )}
          </Document>
        </div>
      </div>
    </div>
  )
}
