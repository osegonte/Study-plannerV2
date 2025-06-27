import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Clock, BarChart3, Settings } from 'lucide-react'
import WorkingPDFViewer from '@/components/pdf/WorkingPDFViewer'
import ReactPDFViewer from '@/components/pdf/ReactPDFViewer'
import { useReadingTimer } from '@/hooks/useReadingTimer'
import { apiClient } from '@/utils/api'

export default function UpdatedPDFViewerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pdfData, setPdfData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [viewerType, setViewerType] = useState<'react-pdf-viewer' | 'react-pdf'>('react-pdf-viewer')
  
  const { startTimer, stopTimer, isRunning, formattedTime } = useReadingTimer()

  useEffect(() => {
    if (id) {
      loadPDF(id)
    }
  }, [id])

  const loadPDF = async (pdfId: string) => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading PDF with ID:', pdfId)
      
      const pdf = await apiClient.getPDF(pdfId)
      console.log('PDF data received:', pdf)
      
      setPdfData(pdf)
      setCurrentPage(pdf.current_page || 1)
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = async (page: number) => {
    console.log('Page changed to:', page)
    
    // Save reading time for previous page
    if (isRunning && id && currentPage !== page) {
      const timeSpent = stopTimer()
      
      if (timeSpent > 2000) { // Only save if spent more than 2 seconds
        try {
          await apiClient.saveReadingSession({
            pdfId: id,
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
    }
    
    setCurrentPage(page)
    startTimer() // Start timer for new page
    
    // Update progress on backend
    if (id) {
      try {
        await apiClient.request(`/pdfs/${id}/progress`, {
          method: 'PUT',
          body: JSON.stringify({ currentPage: page })
        })
      } catch (error) {
        console.error('Failed to update progress:', error)
      }
    }
  }

  const handleLoadSuccess = (numPages: number) => {
    console.log('PDF loaded successfully with', numPages, 'pages')
    setTotalPages(numPages)
    startTimer() // Start timer for first page
  }

  const handleLoadError = (error: Error) => {
    console.error('PDF load error:', error)
    setError(error.message)
  }

  const switchViewer = () => {
    setViewerType(prev => prev === 'react-pdf-viewer' ? 'react-pdf' : 'react-pdf-viewer')
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error && !pdfData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load PDF</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  const progressPercentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">
              {pdfData?.original_name || 'Loading...'}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{totalPages || pdfData?.total_pages || 0} pages</span>
              {pdfData?.file_size && (
                <span>{(pdfData.file_size / 1024 / 1024).toFixed(1)} MB</span>
              )}
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Stage 2: Time Tracking
              </span>
            </div>
          </div>
        </div>

        {/* Controls and Stats */}
        <div className="flex items-center space-x-6">
          {/* Viewer Switcher */}
          <div className="flex items-center space-x-2">
            <button
              onClick={switchViewer}
              className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Switch PDF viewer"
            >
              <Settings className="h-3 w-3" />
              <span>{viewerType === 'react-pdf-viewer' ? 'react-pdf-viewer' : 'react-pdf'}</span>
            </button>
          </div>

          {/* Reading Stats */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{progressPercentage}% complete</span>
            </div>
            
            {isRunning && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Clock className="h-4 w-4" />
                <span>Reading: {formattedTime}</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 relative">
        {error ? (
          <div className="h-full flex items-center justify-center bg-gray-50 p-6">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Viewer Error</h3>
              <p className="text-gray-600 mb-4 text-sm">{error}</p>
              <div className="space-x-2">
                <button
                  onClick={switchViewer}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Try {viewerType === 'react-pdf-viewer' ? 'React-PDF' : 'React-PDF-Viewer'}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Reload
                </button>
              </div>
            </div>
          </div>
        ) : viewerType === 'react-pdf-viewer' ? (
          <WorkingPDFViewer
            pdfId={id!}
            onPageChange={handlePageChange}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
          />
        ) : (
          <ReactPDFViewer
            pdfId={id!}
            onPageChange={handlePageChange}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
          />
        )}
      </div>

      {/* Footer with Stage Info */}
      <div className="bg-blue-50 border-t border-blue-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-blue-800">
          <span>
            <strong>Stage 2:</strong> Time tracking active • 
            Current session: {formattedTime} • 
            Progress automatically saved • 
            Viewer: {viewerType}
          </span>
          <span>
            {viewerType === 'react-pdf-viewer' ? '@react-pdf-viewer' : 'react-pdf'} • 
            PDF.js {viewerType === 'react-pdf-viewer' ? '3.4.120' : '3.11.174'}
          </span>
        </div>
      </div>
    </div>
  )
}