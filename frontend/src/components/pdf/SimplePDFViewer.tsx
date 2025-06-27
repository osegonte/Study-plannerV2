import { useState, useEffect } from 'react'
import { Worker, Viewer } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import { Loader2, AlertCircle } from 'lucide-react'

// Use stable PDF.js version
const WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js'

interface SimplePDFViewerProps {
  fileUrl: string
  onPageChange?: (page: number) => void
  onLoadSuccess?: (numPages: number) => void
  onLoadError?: (error: Error) => void
}

export default function SimplePDFViewer({ 
  fileUrl, 
  onPageChange, 
  onLoadSuccess, 
  onLoadError 
}: SimplePDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Create default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      // Keep only thumbnails tab
      defaultTabs[0]
    ],
  })

  // Handle document load
  const handleDocumentLoad = (e: any) => {
    console.log('PDF loaded successfully:', e)
    const pages = e.doc.numPages
    setNumPages(pages)
    setLoading(false)
    setError(null)
    
    if (onLoadSuccess) {
      onLoadSuccess(pages)
    }
  }

  // Handle page change
  const handlePageChange = (e: any) => {
    const page = e.currentPage + 1 // react-pdf-viewer uses 0-based indexing
    setCurrentPage(page)
    
    if (onPageChange) {
      onPageChange(page)
    }
  }

  // Handle load error
  const handleLoadError = (error: any) => {
    console.error('PDF load error:', error)
    setError(`Failed to load PDF: ${error.message || 'Unknown error'}`)
    setLoading(false)
    
    if (onLoadError) {
      onLoadError(new Error(error.message || 'PDF load failed'))
    }
  }

  // Test file accessibility
  useEffect(() => {
    if (fileUrl) {
      setLoading(true)
      setError(null)
      
      // Test if file is accessible
      fetch(fileUrl, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`File not accessible: ${response.status}`)
          }
          console.log('File accessibility test passed:', fileUrl)
        })
        .catch(err => {
          console.error('File accessibility test failed:', err)
          setError(`File not accessible: ${err.message}`)
          setLoading(false)
        })
    }
  }, [fileUrl])

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Loading Failed</h3>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <div className="bg-gray-100 p-3 rounded text-left">
            <h4 className="font-medium text-gray-900 mb-1">Debug Info:</h4>
            <p className="text-xs text-gray-600 font-mono">URL: {fileUrl}</p>
            <p className="text-xs text-gray-600 font-mono">Worker: {WORKER_URL}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading PDF...</p>
            <p className="text-xs text-gray-500 mt-1">Page {currentPage} of {numPages || '...'}</p>
          </div>
        </div>
      )}
      
      <div className="h-full">
        <Worker workerUrl={WORKER_URL}>
          <Viewer
            fileUrl={fileUrl}
            plugins={[defaultLayoutPluginInstance]}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            onLoadError={handleLoadError}
            defaultScale={1.0}
          />
        </Worker>
      </div>
    </div>
  )
}
