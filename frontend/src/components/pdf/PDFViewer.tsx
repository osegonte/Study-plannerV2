import { useState, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useReadingTimer } from '@/hooks/useReadingTimer'
import { usePDF } from '@/contexts/PDFContext'
import { apiClient } from '@/utils/api'

// Set up PDF.js worker with multiple fallbacks
const workerSources = [
  new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString(),
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `/node_modules/pdfjs-dist/build/pdf.worker.min.js`
]

let workerIndex = 0
const setWorker = () => {
  if (workerIndex < workerSources.length) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerSources[workerIndex]
    console.log(`Setting PDF.js worker to: ${workerSources[workerIndex]}`)
  }
}

// Initialize first worker
setWorker()

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
  const [fileUrl, setFileUrl] = useState<string>('')
  
  const { startTimer, stopTimer, isRunning, formattedTime } = useReadingTimer()
  const { dispatch } = usePDF()

  // Set up file URL
  useEffect(() => {
    if (typeof file === 'string') {
      setFileUrl(file)
      console.log('PDF URL set to:', file)
    } else if (file instanceof File) {
      const url = URL.createObjectURL(file)
      setFileUrl(url)
      console.log('PDF blob URL created:', url)
      
      return () => {
        URL.revokeObjectURL(url)
        console.log('PDF blob URL revoked')
      }
    }
  }, [file])

  // Test file accessibility
  useEffect(() => {
    if (fileUrl && typeof file === 'string') {
      // Test if the URL is accessible
      fetch(fileUrl, { method: 'HEAD' })
        .then(response => {
          console.log('PDF file accessibility test:', response.status, response.statusText)
          if (!response.ok) {
            setError(`PDF file not accessible (${response.status}): ${response.statusText}`)
          }
        })
        .catch(err => {
          console.error('PDF file accessibility test failed:', err)
          setError('Cannot access PDF file. Backend may not be running.')
        })
    }
  }, [fileUrl, file])

  // Handle successful PDF load
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', { numPages, fileUrl })
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    setRetryCount(0)
    
    // Update context
    dispatch({ type: 'SET_TOTAL_PAGES', payload: numPages })
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 })
    
    // Start timer for first page
    startTimer()
  }, [dispatch, startTimer, fileUrl])

  // Handle PDF load error with retry logic
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error)
    
    // Try next worker source
    if (retryCount < workerSources.length - 1) {
      console.log('Trying alternative worker source...')
      workerIndex++
      setWorker()
      setRetryCount(prev => prev + 1)
      setLoading(true)
      return
    }
    
    let errorMessage = 'Failed to load PDF. '
    
    if (error.message.includes('worker')) {
      errorMessage += 'PDF.js worker failed to load. This might be a network issue.'
    } else if (error.message.includes('format') || error.message.includes('Invalid PDF')) {
      errorMessage += 'Invalid PDF format or corrupted file.'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage += 'Network error. Please check your connection and ensure the backend is running.'
    } else if (error.message.includes('404')) {
      errorMessage += 'PDF file not found. It may have been deleted.'
    } else {
      errorMessage += error.message || 'Unknown error occurred.'
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
        console.log('Reading session saved:', { page: currentPage, duration: timeSpent })
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
        console.log('Progress updated:', { page })
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
    console.log('Retrying PDF load...')
    setError(null)
    setLoading(true)
    setRetryCount(0)
    // Reset worker to first option
    workerIndex = 0
    setWorker()
  }

  // Force refresh file URL (for backend file issues)
  const refreshFile = () => {
    if (pdfId) {
      const newUrl = `${apiClient.getPDFFileUrl(pdfId)}?t=${Date.now()}`
      setFileUrl(newUrl)
      console.log('Refreshing PDF URL:', newUrl)
      retryLoad()
    }
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Loading Error</h3>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <div className="space-y-2">
            <div className="flex space-x-2 justify-center">
              <button onClick={retryLoad} className="btn-primary">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              {pdfId && (
                <button onClick={refreshFile} className="btn-secondary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh File
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-4">
              <p><strong>Troubleshooting:</strong></p>
              <ul className="mt-1 space-y-1 text-left">
                <li>• Check if the backend server is running on port 8000</li>
                <li>• Verify the PDF file exists and is not corrupted</li>
                <li>• Try refreshing the page</li>
                <li>• Check your internet connection</li>
              </ul>
              {pdfId && (
                <p className="mt-2">
                  <strong>File URL:</strong> {fileUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!fileUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-gray-600">Preparing PDF...</p>
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
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="shadow-lg"
            options={{
              cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
              standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
              withCredentials: false,
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