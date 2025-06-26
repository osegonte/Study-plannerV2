import { useState, useEffect } from 'react'
import { 
  Clock, BookOpen, Target, TrendingUp, Brain, Zap, 
  BarChart3, Calendar, Award, AlertCircle, CheckCircle
} from 'lucide-react'
import { apiClient } from '@/utils/api'

interface ReadingAnalyticsDashboardProps {
  pdfId: string
  pdfData: any
}

interface AnalyticsData {
  total_pages: number
  pages_read: number
  total_time_spent: number
  current_page: number
  completionPercentage: number
  averageTimePerPage: number
  medianReadingSpeed: number
  readingSpeedVariability: number
  estimatedTimeRemaining: number
  optimisticTimeRemaining: number
  pessimisticTimeRemaining: number
  focusScore: number
  readingConsistency: number
  timeDistribution: {
    fast: number
    moderate: number
    slow: number
  }
  recommendations: string[]
  dailyReadingTime: Array<{
    date: string
    totalTime: number
    sessionCount: number
    avgSessionTime: number
  }>
}

export default function ReadingAnalyticsDashboard({ pdfId, pdfData }: ReadingAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'insights'>('overview')

  useEffect(() => {
    if (pdfId) {
      loadAnalytics()
      loadHeatmap()
    }
  }, [pdfId])

  const loadAnalytics = async () => {
    try {
      const data = await apiClient.request(`/reading/stats/advanced/${pdfId}`)
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHeatmap = async () => {
    try {
      const data = await apiClient.request(`/reading/heatmap/${pdfId}`)
      setHeatmapData(data)
    } catch (error) {
      console.error('Failed to load heatmap:', error)
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  if (loading) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900">Reading Analytics</h3>
        
        {/* Tab Navigation */}
        <div className="flex mt-3 space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'patterns', label: 'Patterns', icon: TrendingUp },
            { id: 'insights', label: 'Insights', icon: Brain }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                activeTab === id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-4 space-y-6">
            {/* Progress Overview */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Progress Overview</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-medium">{analytics.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analytics.completionPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Page {analytics.current_page}</span>
                    <span>{analytics.total_pages} pages</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Metrics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Avg/Page</span>
                  </div>
                  <div className="text-sm font-semibold">{formatTime(analytics.averageTimePerPage)}</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Remaining</span>
                  </div>
                  <div className="text-sm font-semibold">{formatDuration(analytics.estimatedTimeRemaining)}</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Total Time</span>
                  </div>
                  <div className="text-sm font-semibold">{formatDuration(analytics.total_time_spent)}</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Zap className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Median Speed</span>
                  </div>
                  <div className="text-sm font-semibold">{formatTime(analytics.medianReadingSpeed)}</div>
                </div>
              </div>
            </div>

            {/* Performance Scores */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Performance Scores</h4>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${getScoreBgColor(analytics.focusScore)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Focus Score</span>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(analytics.focusScore)}`}>
                      {Math.round(analytics.focusScore)}%
                    </span>
                  </div>
                  <div className="w-full bg-white bg-opacity-50 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        analytics.focusScore >= 80 ? 'bg-green-500' :
                        analytics.focusScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analytics.focusScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${getScoreBgColor(analytics.readingConsistency)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">Consistency</span>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(analytics.readingConsistency)}`}>
                      {Math.round(analytics.readingConsistency)}%
                    </span>
                  </div>
                  <div className="w-full bg-white bg-opacity-50 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        analytics.readingConsistency >= 80 ? 'bg-green-500' :
                        analytics.readingConsistency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analytics.readingConsistency}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Estimates */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Time Estimates</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Optimistic</span>
                  <span className="font-semibold">{formatDuration(analytics.optimisticTimeRemaining)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Expected</span>
                  <span className="font-semibold">{formatDuration(analytics.estimatedTimeRemaining)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600 font-medium">Conservative</span>
                  <span className="font-semibold">{formatDuration(analytics.pessimisticTimeRemaining)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="p-4 space-y-6">
            {/* Reading Speed Distribution */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Reading Speed Distribution</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Fast Pages</span>
                  <span className="font-medium">{analytics.timeDistribution.fast}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${analytics.timeDistribution.fast}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">Moderate Pages</span>
                  <span className="font-medium">{analytics.timeDistribution.moderate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${analytics.timeDistribution.moderate}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">Slow Pages</span>
                  <span className="font-medium">{analytics.timeDistribution.slow}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${analytics.timeDistribution.slow}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Reading Heatmap */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Page Intensity Heatmap</h4>
              <div className="grid grid-cols-10 gap-1 max-h-40 overflow-y-auto">
                {heatmapData.map((page) => (
                  <div
                    key={page.page}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
                      page.intensity === 0 
                        ? 'bg-gray-100 text-gray-400'
                        : page.intensity <= 25
                        ? 'bg-green-100 text-green-700'
                        : page.intensity <= 50
                        ? 'bg-yellow-100 text-yellow-700'
                        : page.intensity <= 75
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                    title={`Page ${page.page}: ${page.visitCount} visits, ${formatTime(page.totalTime)} total`}
                  >
                    {page.page}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>Less time</span>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-gray-100 rounded"></div>
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                  <div className="w-3 h-3 bg-orange-100 rounded"></div>
                  <div className="w-3 h-3 bg-red-100 rounded"></div>
                </div>
                <span>More time</span>
              </div>
            </div>

            {/* Daily Reading Pattern */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Reading Activity</h4>
              <div className="space-y-2">
                {analytics.dailyReadingTime.slice(0, 7).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-gray-500">{day.sessionCount} sessions</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatDuration(day.totalTime)}</div>
                      <div className="text-xs text-gray-500">{formatTime(day.avgSessionTime)} avg</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reading Speed Variability */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Speed Consistency</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Variability</span>
                  <span className="text-sm font-semibold">{formatTime(analytics.readingSpeedVariability)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {analytics.readingSpeedVariability < analytics.averageTimePerPage * 0.3 
                    ? "Very consistent reading speed"
                    : analytics.readingSpeedVariability < analytics.averageTimePerPage * 0.5
                    ? "Moderately consistent reading speed"
                    : "Variable reading speed - consider maintaining steady pace"
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="p-4 space-y-6">
            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Personalized Recommendations</h4>
              <div className="space-y-3">
                {analytics.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievement Badges */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Achievements</h4>
              <div className="grid grid-cols-2 gap-3">
                {analytics.focusScore >= 80 && (
                  <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <Award className="h-6 w-6 text-green-600 mb-1" />
                    <span className="text-xs font-medium text-green-800">Focus Master</span>
                  </div>
                )}
                
                {analytics.readingConsistency >= 80 && (
                  <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Calendar className="h-6 w-6 text-blue-600 mb-1" />
                    <span className="text-xs font-medium text-blue-800">Consistent Reader</span>
                  </div>
                )}
                
                {analytics.completionPercentage >= 50 && (
                  <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Target className="h-6 w-6 text-purple-600 mb-1" />
                    <span className="text-xs font-medium text-purple-800">Halfway Hero</span>
                  </div>
                )}
                
                {analytics.pages_read >= 20 && (
                  <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <BookOpen className="h-6 w-6 text-yellow-600 mb-1" />
                    <span className="text-xs font-medium text-yellow-800">Dedicated Reader</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reading Goals */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Suggested Goals</h4>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Daily Reading Target</span>
                    <span className="text-xs text-gray-500">
                      {Math.ceil(analytics.estimatedTimeRemaining / (1000 * 60 * 60 * 24 * 7))} hrs/day
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    To finish in 1 week at current pace
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Focus Improvement</span>
                    <span className="text-xs text-gray-500">+{Math.max(0, 85 - analytics.focusScore)}%</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Target focus score improvement
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Speed Consistency</span>
                    <span className="text-xs text-gray-500">±30s</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Target reading speed variance
                  </div>
                </div>
              </div>
            </div>

            {/* Study Session Insights */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Session Insights</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Optimal session length</span>
                  <span className="font-medium">
                    {analytics.dailyReadingTime.length > 0 
                      ? formatDuration(Math.max(...analytics.dailyReadingTime.map(d => d.avgSessionTime)))
                      : "N/A"
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Best reading time</span>
                  <span className="font-medium">
                    {analytics.dailyReadingTime.length > 0 
                      ? analytics.dailyReadingTime.reduce((best, day) => 
                          day.totalTime > best.totalTime ? day : best
                        ).date
                      : "N/A"
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pages per session</span>
                  <span className="font-medium">
                    {analytics.dailyReadingTime.length > 0
                      ? Math.round(analytics.pages_read / analytics.dailyReadingTime.reduce((sum, day) => sum + day.sessionCount, 0))
                      : "N/A"
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}