import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Clock, Eye, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import PDFUploadZone from '@/components/pdf/PDFUploadZone'

interface PDFDocument {
  id: string
  original_name: string
  total_pages: number
  uploaded_at: string
  current_page?: number
  total_time_spent?: number
  pages_read?: number
  file_size?: number
}

export default function BasicHomePage() {
  const [recentPDFs, setRecentPDFs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'overview' | 'upload'>('overview')
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      // Test the connection first
      const healthResponse = await fetch('/api/health')
      if (healthResponse.ok) {
        setConnectionStatus('connected')
        loadRecentPDFs()
      } else {
        throw new Error(`Backend responded with ${healthResponse.status}`)
      }
    } catch (err) {
      console.error('Connection test failed:', err)
      setConnectionStatus('error')
      setError('Cannot connect to backend. Make sure the backend server is running.')
      setLoading(false)
    }
  }

  const loadRecentPDFs = async () => {
    try {
      setLoading(true)
      console.log('Loading PDFs from /api/pdfs...')
      
      const response = await fetch('/api/pdfs')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const pdfs = await response.json()
      console.log('PDFs loaded successfully:', pdfs)
      
      setRecentPDFs(Array.isArray(pdfs) ? pdfs.slice(0, 6) : [])
      setError(null)
    } catch (err) {
      console.error('Failed to load PDFs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    console.log('Upload successful, refreshing PDF list...')
    loadRecentPDFs()
    setView('overview')
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

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const calculateProgress = (pdf: PDFDocument) => {
    return pdf.total_pages > 0 ? Math.round(((pdf.current_page || 1) / pdf.total_pages) * 100) : 0
  }

  // Connection status banner
  const renderConnectionStatus = () => {
    if (connectionStatus === 'checking') {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Connecting to backend...</span>
          </div>
        </div>
      )
    }
    
    if (connectionStatus === 'connected') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-800">✅ Backend connected successfully</span>
          </div>
        </div>
      )
    }
    
    if (connectionStatus === 'error') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="flex-1">
              <span className="text-red-800">❌ Backend connection failed</span>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={checkConnection}
                className="mt-2 text-red-700 hover:text-red-900 text-sm underline"
              >
                Retry connection
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Study Planner</h1>
        <p className="text-xl text-gray-600 mb-6">
          Track your reading progress with basic time tracking
        </p>
        
        {/* Connection Status */}
        {renderConnectionStatus()}
        
        {connectionStatus === 'connected' && (
          <>
            {/* Stage 2 Notice */}
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm mb-6">
              <Clock className="h-4 w-4 mr-2" />
              <span><strong>Stage 2:</strong> Basic Reading Time Tracking</span>
            </div>
            
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
                <FileText className="h-4 w-4 inline mr-2" />
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
                <Upload className="h-4 w-4 inline mr-2" />
                Upload
              </button>
            </div>
          </>
        )}
      </div>

      {connectionStatus === 'connected' && view === 'overview' && (
        <>
          {/* Basic Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">PDF Viewing</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Upload and view PDF documents with smooth navigation and zoom controls
              </p>
              <div className="flex items-center text-sm text-blue-600">
                <span>✓ PDF upload • Navigation • Zoom controls</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Time Tracking</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Track time spent reading each page and monitor your progress
              </p>
              <div className="flex items-center text-sm text-green-600">
                <span>✓ Page-level timing • Progress tracking</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Basic Stats</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                View simple statistics like average time per page and completion percentage
              </p>
              <div className="flex items-center text-sm text-purple-600">
                <span>✓ Simple analytics • Progress percentage</span>
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

            {error && connectionStatus === 'connected' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                  <button
                    onClick={loadRecentPDFs}
                    className="ml-auto text-red-700 hover:text-red-900 text-sm underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

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
                              {pdf.file_size && (
                                <span>{formatFileSize(pdf.file_size)}</span>
                              )}
                            </div>
                            
                            {pdf.total_time_spent && pdf.total_time_spent > 0 && (
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Reading time</span>
                                <span>{formatTime(pdf.total_time_spent)}</span>
                              </div>
                            )}
                            
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
                  Upload your first PDF to start tracking your reading progress
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
      )}

      {connectionStatus === 'connected' && view === 'upload' && (
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

          {/* Stage 2 Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-3">📖 Stage 2: Basic Time Tracking</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Upload PDFs and view them with smooth navigation</li>
              <li>• Automatic time tracking for each page you read</li>
              <li>• Basic progress tracking and simple statistics</li>
              <li>• Foundation for advanced analytics in future stages</li>
            </ul>
            <p className="text-xs text-blue-700 mt-4">
              <strong>Next:</strong> Stage 3 will add estimated reading time and completion predictions
            </p>
          </div>
        </>
      )}
    </div>
  )
}