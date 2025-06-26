import { useState, useEffect } from 'react'
import { Clock, BookOpen, Target, TrendingUp } from 'lucide-react'
import { usePDF } from '@/contexts/PDFContext'
import { apiClient } from '@/utils/api'

interface ReadingProgressSidebarProps {
  pdfId: string
  pdfData: any
}

export default function ReadingProgressSidebar({ pdfId, pdfData }: ReadingProgressSidebarProps) {
  const { state } = usePDF()
  const [stats, setStats] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    if (pdfId) {
      loadStats()
      loadSessions()
    }
  }, [pdfId])

  const loadStats = async () => {
    try {
      const statsData = await apiClient.getReadingStats(pdfId)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const sessionsData = await apiClient.request(`/reading/sessions/${pdfId}`)
      setSessions(sessionsData.slice(0, 5)) // Show last 5 sessions
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${remainingMinutes}m`
  }

  const currentPage = state.currentPage
  const totalPages = pdfData.total_pages
  const progressPercentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900">Reading Progress</h3>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Current Progress */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Current Progress</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Completion</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Page {currentPage}</span>
                <span>{totalPages} pages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Statistics */}
        {stats && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Reading Statistics</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Avg. per page</span>
                </div>
                <span className="text-sm font-medium">{formatTime(stats.averageTimePerPage)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total time</span>
                </div>
                <span className="text-sm font-medium">{formatDuration(stats.total_time_spent)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Est. remaining</span>
                </div>
                <span className="text-sm font-medium">{formatDuration(stats.estimatedTimeRemaining)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Pages read</span>
                </div>
                <span className="text-sm font-medium">{stats.pages_read} / {totalPages}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Quick Navigation</h4>
          <div className="grid grid-cols-5 gap-1 max-h-40 overflow-y-auto">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  // This would need to be connected to the PDF viewer
                  console.log(`Navigate to page ${page}`)
                }}
                className={`
                  w-8 h-8 text-xs rounded border transition-colors
                  ${page === currentPage 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : page <= (stats?.pages_read || 0)
                    ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }
                `}
                title={`Go to page ${page}`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Sessions</h4>
            <div className="space-y-2">
              {sessions.map((session, index) => (
                <div key={session.id || index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Page {session.page_number}</span>
                  <span className="font-medium">{formatTime(session.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
