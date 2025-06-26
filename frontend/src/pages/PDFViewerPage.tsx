import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import SimplePDFViewer from '@/components/pdf/SimplePDFViewer'
import { apiClient } from '@/utils/api'

export default function PDFViewerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pdfData, setPdfData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const pdfUrl = `http://localhost:8000/uploads/${pdfData.filename}`

  return (
    <div className="min-h-screen bg-gray-50">
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
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <SimplePDFViewer fileUrl={pdfUrl} />
        </div>
      </div>
    </div>
  )
}
