import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Clock, TrendingUp, Eye } from 'lucide-react'
import PDFUploadZone from '@/components/pdf/PDFUploadZone'
import { apiClient } from '@/utils/api'

interface PDFDocument {
  id: string
  original_name: string
  total_pages: number
  uploaded_at: string
  current_page?: number
  total_time_spent?: number
}

export default function HomePage() {
  const [recentPDFs, setRecentPDFs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentPDFs()
  }, [])

  const loadRecentPDFs = async () => {
    try {
      const pdfs = await apiClient.getPDFs()
      setRecentPDFs(pdfs.slice(0, 5)) // Show only 5 most recent
    } catch (error) {
      console.error('Failed to load PDFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    loadRecentPDFs() // Refresh the list
  }

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${remainingMinutes}m`
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Study Planner</h1>
        <p className="text-xl text-gray-600">
          Track your reading progress and optimize your study time
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <FileText className="h-8 w-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">PDF Reading</h3>
          <p className="text-gray-600 text-sm">
            Load and navigate through PDF documents with intuitive controls
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Clock className="h-8 w-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Time Tracking</h3>
          <p className="text-gray-600 text-sm">
            Automatically track reading time per page and get detailed analytics
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <TrendingUp className="h-8 w-8 text-primary-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Progress Insights</h3>
          <p className="text-gray-600 text-sm">
            Get estimated completion times and reading performance metrics
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
        <PDFUploadZone onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
          {recentPDFs.length > 0 && (
            <Link to="/library" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all →
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading documents...</span>
          </div>
        ) : recentPDFs.length > 0 ? (
          <div className="grid gap-4">
            {recentPDFs.map((pdf) => (
              <Link
                key={pdf.id}
                to={`/pdf/${pdf.id}`}
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <FileText className="h-10 w-10 text-gray-400 mr-4 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600">
                    {pdf.original_name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span>{pdf.total_pages} pages</span>
                    {pdf.total_time_spent > 0 && (
                      <span>• {formatTime(pdf.total_time_spent)} read</span>
                    )}
                    {pdf.current_page && pdf.current_page > 1 && (
                      <span>• Page {pdf.current_page}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Open</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No documents uploaded yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Upload your first PDF to get started with tracking your reading progress
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
