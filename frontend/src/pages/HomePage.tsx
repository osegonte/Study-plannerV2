import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Clock, TrendingUp, Eye, BarChart3, Target, Brain } from 'lucide-react'
import PDFUploadZone from '@/components/pdf/PDFUploadZone'
import ReadingInsightsWidget from '@/components/pdf/ReadingInsightsWidget'
import { apiClient } from '@/utils/api'

interface PDFDocument {
  id: string
  original_name: string
  total_pages: number
  uploaded_at: string
  current_page?: number
  total_time_spent?: number
  pages_read?: number
}

export default function EnhancedHomePage() {
  const [recentPDFs, setRecentPDFs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'overview' | 'upload'>('overview')

  useEffect(() => {
    loadRecentPDFs()
  }, [])

  const loadRecentPDFs = async () => {
    try {
      const pdfs = await apiClient.getPDFs()
      setRecentPDFs(pdfs.slice(0, 6)) // Show 6 most recent
    } catch (error) {
      console.error('Failed to load PDFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    loadRecentPDFs() // Refresh the list
    setView('overview') // Return to overview
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

  const calculateProgress = (pdf: PDFDocument) => {
    return pdf.total_pages > 0 ? Math.round(((pdf.current_page || 1) / pdf.total_pages) * 100) : 0
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Study Planner</h1>
        <p className="text-xl text-gray-600 mb-6">
          Track your reading progress with advanced analytics and insights
        </p>
        
        {/* Navigation Tabs */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1 mb-8">
          <button
            onClick={() => setView('overview')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'overview'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setView('upload')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'upload'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Upload
          </button>
        </div>
      </div>

      {view === 'overview' ? (
        <>
          {/* Reading Insights Widget */}
          <ReadingInsightsWidget />

          {/* Enhanced Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Advanced Analytics</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Deep insights into your reading patterns, focus scores, and speed analysis
              </p>
              <div className="flex items-center text-sm text-blue-600">
                <Brain className="h-4 w-4 mr-1" />
                <span>Focus tracking • Speed analysis • Heatmaps</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Smart Time Tracking</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Automatic page-level time tracking with predictive completion estimates
              </p>
              <div className="flex items-center text-sm text-green-600">
                <Target className="h-4 w-4 mr-1" />
                <span>Per-page timing • Estimates • Recommendations</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Progress Insights</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Personalized recommendations and achievement tracking for better study habits
              </p>
              <div className="flex items-center text-sm text-purple-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>Goals • Achievements • Daily streaks</span>
              </div>
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Documents</h2>
              <div className="flex items-center space-x-3">
                {recentPDFs.length > 0 && (
                  <button
                    onClick={() => setView('upload')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Upload more →
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Loading documents...</span>
              </div>
            ) : recentPDFs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentPDFs.map((pdf) => {
                  const progress = calculateProgress(pdf)
                  return (
                    <Link
                      key={pdf.id}
                      to={`/pdf/${pdf.id}`}
                      className="group block p-4 border rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start space-x-3">
                        <FileText className="h-8 w-8 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0 mt-1" />
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                            {pdf.original_name}
                          </h3>
                          
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{pdf.total_pages} pages</span>
                              {pdf.total_time_spent > 0 && (
                                <span>{formatTime(pdf.total_time_spent)}</span>
                              )}
                            </div>
                            
                            {progress > 0 && (
                              <div>
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                  <span>Progress</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {new Date(pdf.uploaded_at).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-1 text-xs text-gray-500 group-hover:text-primary-600 transition-colors">
                              <Eye className="h-3 w-3" />
                              <span>Open</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-500 mb-6">
                  Upload your first PDF to start tracking your reading progress with advanced analytics
                </p>
                <button
                  onClick={() => setView('upload')}
                  className="btn-primary"
                >
                  Upload Document
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
              <button
                onClick={() => setView('overview')}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Back to Overview
              </button>
            </div>
            <PDFUploadZone onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Upload Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-3">💡 Tips for Better Analytics</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Upload clear, readable PDFs for accurate page timing</li>
              <li>• Start reading immediately after upload to begin tracking</li>
              <li>• Read consistently to build meaningful analytics patterns</li>
              <li>• Use the analytics sidebar to monitor your progress in real-time</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}