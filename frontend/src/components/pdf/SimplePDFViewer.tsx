import { useState, useEffect, useRef } from 'react'
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import type { DocumentLoadEvent, PageChangeEvent } from '@react-pdf-viewer/core'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import { Loader2, AlertCircle, FileText } from 'lucide-react'

// Use the exact PDF.js version that works reliably
const WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js'

interface WorkingPDFViewerProps {
  pdfId: string
  onPageChange?: (page: number) => void
  onLoadSuccess?: (numPages: number) => void
  onLoadError?: (error: Error) => void
  className?: string
}

export default function WorkingPDFViewer({ 
  pdfId, 
  onPageChange, 
  onLoadSuccess, 
  onLoadError,
  className = "h-full"
}: WorkingPDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [fileUrl, setFileUrl] = useState<string>('')
  const workerRef = useRef<Worker | null>(null)

  // Create plugins
  const pageNavigationPluginInstance = pageNavigationPlugin()
  const { jumpToPage } = pageNavigationPluginInstance
  
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      // Keep only thumbnails and bookmarks
      defaultTabs[0], // Thumbnails
      // defaultTabs[1], // Bookmarks (if you want them)
    ],
    toolbarPlugin: {
      fullScreenPlugin: {
        // Enable full screen
        onEnterFullScreen: (zoom) => {
          console.log('Entered full screen')
        },
        onExitFullScreen: (zoom) => {
          console.log('Exited full screen')
        },
      },
    },
  })

  // Set up file URL with cache busting and error handling
  useEffect(() => {
    if (!pdfId) {
      setError('No PDF ID provided')
      setLoading(false)
      return
    }

    const testFileAccess = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Test file accessibility first
        const testUrl = `/api/pdfs/${pdfId}/file`
        console.log('Testing PDF file accessibility:', testUrl)
        
        const response = await fetch(testUrl, { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        
        if (!response.ok) {
          throw new Error(`File not accessible: ${response.status} ${response.statusText}`)
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType?.includes('application/pdf')) {
          console.warn('Content-Type is not PDF:', contentType)
        }
        
        console.log('✅ File accessibility test passed')
        
        // Add cache busting to ensure fresh file
        const urlWithCacheBust = `${testUrl}?t=${Date.now()}`
        setFileUrl(urlWithCacheBust)
        
      } catch (err) {
        console.error('File accessibility test failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to access PDF file')
        setLoading(false)
      }
    }

    testFileAccess()
  }, [pdfId])

  // Handle document load success
  const handleDocumentLoad = (e: DocumentLoadEvent) => {
    console.log('📄 PDF document loaded successfully:', e)
    
    const pages = e.doc.numPages
    setNumPages(pages)
    setLoading(false)
    setError(null)
    
    console.log(`PDF has ${pages} pages`)
    
    if (onLoadSuccess) {
      onLoadSuccess(pages)
    }
  }

  // Handle page change
  const handlePageChange = (e: PageChangeEvent) => {
    const newPage = e.currentPage + 1 // Convert from 0-based to 1-based
    console.log('📖 Page changed to:', newPage)
    
    setCurrentPage(newPage)
    
    if (onPageChange) {
      onPageChange(newPage)
    }
  }

  // Handle load errors
  const handleLoadError = (error: any) => {
    console.error('❌ PDF load error:', error)
    
    let errorMessage = 'Failed to load PDF'
    
    if (error?.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    // Common error handling
    if (errorMessage.includes('Loading task cancelled')) {
      errorMessage = 'PDF loading was cancelled. Please try again.'
    } else if (errorMessage.includes('Invalid PDF structure')) {
      errorMessage = 'The PDF file appears to be corrupted.'
    } else if (errorMessage.includes('NetworkError')) {
      errorMessage = 'Network error: Please check your connection and try again.'
    }
    
    setError(errorMessage)
    setLoading(false)
    
    if (onLoadError) {
      onLoadError(new Error(errorMessage))
    }
  }

  // Render error state
  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            PDF Loading Failed
          </h3>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          
          <div className="bg-gray-100 p-4 rounded-lg text-left mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Debug Information:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>PDF ID:</strong> {pdfId}</p>
              <p><strong>File URL:</strong> {fileUrl}</p>
              <p><strong>Worker URL:</strong> {WORKER_URL}</p>
              <p><strong>Browser:</strong> {navigator.userAgent.split(' ')[0]}</p>
            </div>
          </div>
          
          <div className="space-x-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render loading state
  if (loading || !fileUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading PDF...
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            {!fileUrl ? 'Preparing file...' : 'Rendering document...'}
          </p>
          <div className="text-xs text-gray-500">
            <p>PDF ID: {pdfId}</p>
            {numPages > 0 && <p>Pages: {numPages}</p>}
          </div>
        </div>
      </div>
    )
  }

  // Main PDF viewer render
  return (
    <div className={className}>
      {/* Status bar */}
      {numPages > 0 && (
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">
                Page {currentPage} of {numPages}
              </span>
            </div>
            <div className="text-gray-500">
              {Math.round((currentPage / numPages) * 100)}% complete
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            react-pdf-viewer • PDF.js {WORKER_URL.includes('3.4.120') ? '3.4.120' : 'Unknown'}
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-1 bg-gray-100">
        <Worker workerUrl={WORKER_URL}>
          <Viewer
            fileUrl={fileUrl}
            plugins={[
              defaultLayoutPluginInstance,
              pageNavigationPluginInstance,
            ]}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            onLoadError={handleLoadError}
            defaultScale={SpecialZoomLevel.PageFit}
            theme={{
              theme: 'light',
            }}
            localization={{
              // You can add custom localization here if needed
            }}
          />
        </Worker>
      </div>
    </div>
  )
}