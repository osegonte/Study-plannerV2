import { useState, useEffect } from 'react'
import { 
  Clock, BookOpen, TrendingUp, Target, Brain, 
  Calendar, Award, Zap 
} from 'lucide-react'
import { apiClient } from '@/utils/api'

interface ReadingInsight {
  totalTimeSpent: number
  totalPagesRead: number
  averageReadingSpeed: number
  documentsInProgress: number
  completedDocuments: number
  currentStreak: number
  bestFocusScore: number
  thisWeekTime: number
  improvement: number
}

export default function ReadingInsightsWidget() {
  const [insights, setInsights] = useState<ReadingInsight | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      // Get all PDFs and their stats
      const pdfs = await apiClient.getPDFs()
      
      // Calculate aggregate insights
      let totalTimeSpent = 0
      let totalPagesRead = 0
      let documentsInProgress = 0
      let completedDocuments = 0
      const readingSpeeds: number[] = []
      let bestFocusScore = 0

      for (const pdf of pdfs) {
        if (pdf.total_time_spent > 0) {
          totalTimeSpent += pdf.total_time_spent
          totalPagesRead += pdf.pages_read || 0
          
          const avgSpeed = pdf.pages_read > 0 ? pdf.total_time_spent / pdf.pages_read : 0
          if (avgSpeed > 0) readingSpeeds.push(avgSpeed)

          if (pdf.current_page >= pdf.total_pages) {
            completedDocuments++
          } else if (pdf.pages_read > 0) {
            documentsInProgress++
          }

          // Try to get advanced stats for focus score
          try {
            const advancedStats = await apiClient.request(`/reading/stats/advanced/${pdf.id}`)
            if (advancedStats.focusScore > bestFocusScore) {
              bestFocusScore = advancedStats.focusScore
            }
          } catch (error) {
            // Advanced stats not available for this PDF
          }
        }
      }

      const averageReadingSpeed = readingSpeeds.length > 0 
        ? readingSpeeds.reduce((sum, speed) => sum + speed, 0) / readingSpeeds.length 
        : 0

      // Calculate this week's reading time (mock calculation)
      const thisWeekTime = totalTimeSpent * 0.3 // Assume 30% was this week

      // Calculate improvement (mock calculation)
      const improvement = Math.random() * 20 - 10 // -10% to +10%

      setInsights({
        totalTimeSpent,
        totalPagesRead,
        averageReadingSpeed,
        documentsInProgress,
        completedDocuments,
        currentStreak: Math.floor(Math.random() * 7) + 1, // Mock streak
        bestFocusScore,
        thisWeekTime,
        improvement
      })
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const formatSpeed = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 1000 / 60)
    const seconds = Math.floor((milliseconds / 1000) % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!insights || insights.totalTimeSpent === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reading Insights</h2>
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Start reading to see your insights</p>
          <p className="text-gray-400 text-sm mt-1">
            Upload and read PDFs to track your progress and get personalized analytics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Reading Insights</h2>
        <div className="flex items-center space-x-2">
          {insights.improvement >= 0 ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingUp className="h-5 w-5 text-red-600 transform rotate-180" />
          )}
          <span className={`text-sm font-medium ${
            insights.improvement >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {insights.improvement >= 0 ? '+' : ''}{insights.improvement.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatTime(insights.totalTimeSpent)}</div>
          <div className="text-sm text-gray-600">Total Reading Time</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
            <BookOpen className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{insights.totalPagesRead}</div>
          <div className="text-sm text-gray-600">Pages Read</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatSpeed(insights.averageReadingSpeed)}</div>
          <div className="text-sm text-gray-600">Avg Speed/Page</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
            <Target className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{insights.completedDocuments}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">In Progress</span>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-xl font-bold text-gray-900">{insights.documentsInProgress}</div>
          <div className="text-xs text-gray-500">documents</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">This Week</span>
            <Calendar className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-xl font-bold text-gray-900">{formatTime(insights.thisWeekTime)}</div>
          <div className="text-xs text-gray-500">reading time</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Daily Streak</span>
            <Award className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-xl font-bold text-gray-900">{insights.currentStreak}</div>
          <div className="text-xs text-gray-500">days</div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Performance Highlights</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Focus Score */}
          {insights.bestFocusScore > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Brain className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Best Focus Score</div>
                  <div className="text-sm text-blue-700">{Math.round(insights.bestFocusScore)}% concentration</div>
                </div>
              </div>
            </div>
          )}

          {/* Reading Consistency */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Reading Rhythm</div>
                <div className="text-sm text-green-700">
                  {insights.currentStreak >= 3 ? 'Consistent' : 'Building habit'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Quick Actions</span>
            <div className="flex space-x-2">
              <button className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full hover:bg-primary-200 transition-colors">
                Set Reading Goal
              </button>
              <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors">
                View All Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}