import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, BarChart3, BookOpen, Settings } from 'lucide-react'
import PDFViewer from '@/components/pdf/PDFViewer'
import ReadingAnalyticsDashboard from '@/components/pdf/ReadingAnalyticsDashboard'
import { apiClient } from '@/utils/api'

export default function EnhancedPDFViewerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pdfData, setPdfData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(true)
  const [viewMode, setViewMode] = useState<'reader' | 'analytics'>('reader')

  useEffect(() => {
    if (id) {
      loadPDF(id)
    }
  }, [id])

  const loadPDF = async (pdfId: string) => {
    try {
      setLoading(true)
      console.log('Loading PDF with ID:', pdfId)
      
      const pdf = await apiClient.getPDF(pdfId)
      console.log('PDF data received:', pdf)
      
      setPdfData(pdf)
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
    } finally {
      setLoading(false)
    }
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

  if (error || !pdfData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load PDF</h2>
          <p className="text-gray-600 mb-4">{error || 'PDF not found'}</p>
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

  const pdfUrl = `http://localhost:8000/api/pdfs/${id}/file`

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
              {pdfData.original_name}
            </h1>
            <p className="text-sm text-gray-600">
              {pdfData.total_pages} pages • {(pdfData.file_size / 1024 / 1024).toFixed(1)} MB
              {pdfData.total_time_spent > 0 && (
                <span> • {Math.floor(pdfData.total_time_spent / 1000 / 60)}m read</span>
              )}
            </p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          {/* Desktop View Toggle */}
          <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('reader')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'reader'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Reader</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'analytics'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Mobile Analytics Toggle */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle analytics"
          >
            <BarChart3 className="h-5 w-5" />
          </button>

          {/* Settings */}
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile View - Single Panel */}
        <div className="md:hidden flex-1">
          {viewMode === 'reader' ? (
            <PDFViewer file={pdfUrl} pdfId={id} />
          ) : (
            <div className="h-full overflow-y-auto">
              <ReadingAnalyticsDashboard pdfId={id!} pdfData={pdfData} />
            </div>
          )}
        </div>

        {/* Desktop View - Side by Side */}
        <div className="hidden md:flex flex-1">
          {/* Main PDF Viewer */}
          <div className="flex-1">
            <PDFViewer file={pdfUrl} pdfId={id} />
          </div>

          {/* Analytics Sidebar */}
          {showAnalytics && (
            <ReadingAnalyticsDashboard pdfId={id!} pdfData={pdfData} />
          )}
        </div>
      </div>

      {/* Mobile Analytics Overlay */}
      {showAnalytics && viewMode === 'reader' && (
        <div className="md:hidden fixed inset-x-0 bottom-0 top-16 bg-white z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">Reading Analytics</h3>
            <button
              onClick={() => setShowAnalytics(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ReadingAnalyticsDashboard pdfId={id!} pdfData={pdfData} />
          </div>
        </div>
      )}
    </div>
  )
}