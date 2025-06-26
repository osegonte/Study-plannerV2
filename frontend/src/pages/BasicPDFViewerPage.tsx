import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, BarChart3, Settings } from 'lucide-react'
import PDFViewer from '@/components/pdf/PDFViewer'
import SimpleProgressSidebar from '@/components/pdf/SimpleProgressSidebar'
import { apiClient } from '@/utils/api'

export default function BasicPDFViewerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pdfData, setPdfData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

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
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{pdfData.total_pages} pages</span>
              <span>{(pdfData.file_size / 1024 / 1024).toFixed(1)} MB</span>
              {pdfData.total_time_spent > 0 && (
                <span>{Math.floor(pdfData.total_time_spent / 1000 / 60)}m read</span>
              )}
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                Stage 2: Basic Tracking
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded-lg transition-colors ${
              showSidebar 
                ? 'bg-primary-100 text-primary-600' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Toggle progress sidebar"
          >
            <BarChart3 className="h-5 w-5" />
          </button>

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
        {/* Main PDF Viewer */}
        <div className="flex-1">
          <PDFViewer file={pdfUrl} pdfId={id} />
        </div>

        {/* Simple Progress Sidebar */}
        {showSidebar && (
          <SimpleProgressSidebar pdfId={id!} pdfData={pdfData} />
        )}
      </div>

      {/* Stage Info Footer */}
      <div className="bg-blue-50 border-t border-blue-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-blue-800">
          <span>
            <strong>Stage 2:</strong> Basic time tracking active • 
            Page-level timing • Simple progress calculation
          </span>
          <span>
            Next: Stage 3 (Estimated Reading Time)
          </span>
        </div>
      </div>
    </div>
  )
}