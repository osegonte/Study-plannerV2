import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useReadingTimer } from '@/hooks/useReadingTimer'
import { usePDF } from '@/contexts/PDFContext'
import { apiClient } from '@/utils/api'

// CRITICAL FIX: Set up PDF.js worker correctly
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString()

// Fallback worker URLs in case the primary fails
const WORKER_FALLBACKS = [
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
]

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
  const [workerRetryCount, setWorkerRetryCount] = useState<number>(0)
  
  const { startTimer, stopTimer, isRunning, formattedTime } = useReadingTimer()
  const { dispatch } = usePDF()
  
  // Refs to prevent multiple requests
  const fileUrlRef = useRef<string>('')
  const sessionSaveInProgress = useRef<boolean>(false)
  const lastSessionSave = useRef<number>(0)

  // IMPROVED: Better file URL handling with proxy support
  const fileUrl = useMemo(() => {
    if (typeof file === 'string') {
      // Check if it's already a full URL
      if (file.startsWith('http')) {
        return file
      }
      // Use the API endpoint for serving files
      if (pdfId) {
        return `/api/pdfs/${pdfId}/file`
      }
      return file
    } else if (file instanceof File) {
      // Only create blob URL once
      if (!fileUrlRef.current) {
        fileUrlRef.current = URL.createObjectURL(file)
        console.log('PDF blob URL created:', fileUrlRef.current)
      }
      return fileUrlRef.current
    }
    return ''
  }, [file, pdfId])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (fileUrlRef.current && file instanceof File) {
        URL.revokeObjectURL(fileUrlRef.current)
        console.log('PDF blob URL revoked')
      }
    }
  }, [file])

  // IMPROVED: Better error handling with worker fallbacks
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error)
    
    // Try fallback worker URLs
    if (workerRetryCount < WORKER_FALLBACKS.length) {
      console.log(`Trying fallback worker ${workerRetryCount + 1}:`, WORKER_FALLBACKS[workerRetryCount])
      pdfjs.GlobalWorkerOptions.workerSrc = WORKER_FALLBACKS[workerRetryCount]
      setWorkerRetryCount(prev => prev + 1)
      setRetryCount(prev => prev + 1)
      setLoading(true)
      setError(null)
      return
    }
    
    let errorMessage = 'Failed to load PDF. '
    
    if (error.message.includes('worker') || error.message.includes('Worker')) {
      errorMessage += 'PDF.js worker failed. This might be a network or browser compatibility issue.'
    } else if (error.message.includes('Invalid PDF') || error.message.includes('format')) {
      errorMessage += 'Invalid PDF format or corrupted file.'
    } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('NetworkError')) {
      errorMessage += 'Network error. Please check your connection and ensure the backend is running.'
    } else if (error.message.includes('404') || error.message.includes('Not Found')) {
      errorMessage += 'PDF file not found. It may have been deleted or moved.'
    } else if (error.message.includes('CORS')) {
      errorMessage += 'Cross-origin request blocked. Please check CORS configuration.'
    } else {
      errorMessage += error.message || 'Unknown error occurred.'
    }
    
    setError(errorMessage)
    setLoading(false)
  }, [workerRetryCount])

  // Handle successful PDF load
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', { numPages, fileUrl, workerUsed: pdfjs.GlobalWorkerOptions.workerSrc })
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    setRetryCount(0)
    setWorkerRetryCount(0)
    
    // Update context
    dispatch({ type: 'SET_TOTAL_PAGES', payload: numPages })
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 })
    
    // Start timer for first page
    startTimer()
  }, [dispatch, startTimer, fileUrl])

  // Debounced session saving to prevent spam
  const saveReadingSessionDebounced = useCallback(async (page: number, timeSpent: number) => {
    if (!pdfId || sessionSaveInProgress.current) return
    
    const now = Date.now()
    if (now - lastSessionSave.current < 2000) { // Minimum 2 seconds between saves
      return
    }
    
    sessionSaveInProgress.current = true
    lastSessionSave.current = now
    
    try {
      await apiClient.saveReadingSession({
        pdfId,
        page,
        startTime: new Date(now - timeSpent),
        endTime: new Date(now),
        duration: timeSpent
      })
      console.log('Reading session saved:', { page, duration: timeSpent })
    } catch (error) {
      console.error('Failed to save reading session:', error)
    } finally {
      sessionSaveInProgress.current = false
    }
  }, [pdfId])

  // Handle page change with improved debouncing
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > numPages) return

    // Save reading time for current page (debounced)
    if (isRunning && pdfId) {
      const timeSpent = stopTimer()
      if (timeSpent > 1000) { // Only save sessions longer than 1 second
        saveReadingSessionDebounced(currentPage, timeSpent)
      }
    }

    // Update page
    setCurrentPage(page)
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page })
    
    // Start timer for new page
    startTimer()

    // Update progress on backend (debounced)
    if (pdfId && !sessionSaveInProgress.current) {
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
  }, [currentPage, numPages, isRunning, pdfId, stopTimer, startTimer, dispatch, saveReadingSessionDebounced])

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

  // IMPROVED: Better retry logic
  const retryLoad = () => {
    console.log('Retrying PDF load...')
    setError(null)
    setLoading(true)
    setRetryCount(0)
    setWorkerRetryCount(0)
    // Reset to primary worker
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url,
    ).toString()
  }

  // Force refresh file URL (for backend file issues)
  const refreshFile = () => {
    if (pdfId) {
      const newUrl = `/api/pdfs/${pdfId}/file?t=${Date.now()}`
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
                <li>• Workers tried: {workerRetryCount}/{WORKER_FALLBACKS.length + 1}</li>
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
              // CRITICAL: Better PDF.js options
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
              standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
              withCredentials: false,
              disableAutoFetch: false,
              disableStream: false,
              useSystemFonts: true,
              // Add HTTP headers for authentication if needed
              httpHeaders: {
                'Accept': 'application/pdf',
              },
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
                      <p className="text-red-700 text-sm">Failed to load page {currentPage}</p>
                      <button 
                        onClick={retryLoad}
                        className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Retry
                      </button>
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