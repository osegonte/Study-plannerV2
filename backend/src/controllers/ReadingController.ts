import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { DatabaseService } from '../services/DatabaseService'
import { createError } from '../middleware/errorHandler'

export class EnhancedReadingController {
  private dbService: DatabaseService

  constructor() {
    this.dbService = new DatabaseService()
    this.dbService.initialize()
  }

  async saveReadingSession(req: Request, res: Response) {
    const { pdfId, page, startTime, endTime, duration } = req.body
    const sessionId = uuidv4()
    const db = this.dbService.getDatabase()

    // Save reading session
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO reading_sessions (id, pdf_id, page_number, start_time, end_time, duration)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sessionId, pdfId, page, startTime, endTime, duration],
        function(err) {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    // Update reading progress with advanced calculations
    await this.updateAdvancedProgress(pdfId)

    res.status(201).json({ 
      id: sessionId,
      message: 'Reading session saved successfully' 
    })
  }

  private async updateAdvancedProgress(pdfId: string) {
    const db = this.dbService.getDatabase()

    await new Promise<void>((resolve, reject) => {
      db.run(
        `UPDATE reading_progress 
         SET total_time_spent = (
           SELECT COALESCE(SUM(duration), 0) 
           FROM reading_sessions 
           WHERE pdf_id = ?
         ),
         pages_read = (
           SELECT COUNT(DISTINCT page_number) 
           FROM reading_sessions 
           WHERE pdf_id = ?
         ),
         last_read_at = CURRENT_TIMESTAMP
         WHERE pdf_id = ?`,
        [pdfId, pdfId, pdfId],
        function(err) {
          if (err) reject(err)
          else resolve()
        }
      )
    })
  }

  async getAdvancedReadingStats(req: Request, res: Response) {
    const { pdfId } = req.params
    const db = this.dbService.getDatabase()

    // Get basic stats
    const basicStats = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT 
           p.total_pages,
           p.original_name,
           rp.total_time_spent,
           rp.pages_read,
           rp.current_page,
           rp.last_read_at
         FROM pdfs p
         LEFT JOIN reading_progress rp ON p.id = rp.pdf_id
         WHERE p.id = ?`,
        [pdfId],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })

    if (!basicStats) {
      throw createError('PDF not found', 404)
    }

    // Get page-level analytics
    const pageAnalytics = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT 
           page_number,
           COUNT(*) as visit_count,
           SUM(duration) as total_time,
           AVG(duration) as avg_time,
           MIN(duration) as min_time,
           MAX(duration) as max_time,
           MAX(start_time) as last_visit
         FROM reading_sessions 
         WHERE pdf_id = ?
         GROUP BY page_number
         ORDER BY page_number`,
        [pdfId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })

    // Get reading pattern data (last 30 sessions)
    const recentSessions = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT 
           page_number,
           duration,
           start_time,
           DATE(start_time) as date
         FROM reading_sessions 
         WHERE pdf_id = ?
         ORDER BY start_time DESC
         LIMIT 30`,
        [pdfId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })

    // Calculate advanced metrics
    const calculations = this.calculateAdvancedMetrics(basicStats, pageAnalytics, recentSessions)

    res.json({
      ...basicStats,
      ...calculations,
      pageAnalytics,
      recentSessions: recentSessions.slice(0, 10) // Return last 10 sessions
    })
  }

  private calculateAdvancedMetrics(basicStats: any, pageAnalytics: any[], recentSessions: any[]) {
    const { total_pages, pages_read, total_time_spent, current_page } = basicStats

    // Basic calculations
    const completionPercentage = total_pages > 0 ? Math.round((current_page / total_pages) * 100) : 0
    const averageTimePerPage = pages_read > 0 ? total_time_spent / pages_read : 0

    // Reading speed analysis
    const readingSpeeds = pageAnalytics.map(p => p.avg_time).filter(time => time > 0)
    const medianReadingSpeed = this.calculateMedian(readingSpeeds)
    const readingSpeedVariability = this.calculateStandardDeviation(readingSpeeds)

    // Time estimates
    const estimatedTimeRemaining = (total_pages - current_page + 1) * averageTimePerPage
    const optimisticTimeRemaining = (total_pages - current_page + 1) * Math.min(...readingSpeeds.slice(-5)) // Last 5 pages
    const pessimisticTimeRemaining = (total_pages - current_page + 1) * Math.max(...readingSpeeds.slice(-5))

    // Reading pattern insights
    const dailyReadingTime = this.calculateDailyReadingPattern(recentSessions)
    const readingConsistency = this.calculateReadingConsistency(recentSessions)
    
    // Focus analysis
    const focusScore = this.calculateFocusScore(pageAnalytics)
    const timeDistribution = this.analyzeTimeDistribution(pageAnalytics)

    // Recommendations
    const recommendations = this.generateRecommendations({
      averageTimePerPage,
      readingSpeedVariability,
      focusScore,
      readingConsistency,
      completionPercentage
    })

    return {
      completionPercentage,
      averageTimePerPage: Math.round(averageTimePerPage),
      medianReadingSpeed: Math.round(medianReadingSpeed),
      readingSpeedVariability: Math.round(readingSpeedVariability),
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
      optimisticTimeRemaining: Math.round(optimisticTimeRemaining),
      pessimisticTimeRemaining: Math.round(pessimisticTimeRemaining),
      dailyReadingTime,
      readingConsistency,
      focusScore,
      timeDistribution,
      recommendations
    }
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle]
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    return Math.sqrt(variance)
  }

  private calculateDailyReadingPattern(sessions: any[]) {
    const dailyData = sessions.reduce((acc, session) => {
      const date = session.date
      if (!acc[date]) {
        acc[date] = { totalTime: 0, sessionCount: 0 }
      }
      acc[date].totalTime += session.duration
      acc[date].sessionCount += 1
      return acc
    }, {})

    return Object.entries(dailyData).map(([date, data]: [string, any]) => ({
      date,
      totalTime: data.totalTime,
      sessionCount: data.sessionCount,
      avgSessionTime: Math.round(data.totalTime / data.sessionCount)
    }))
  }

  private calculateReadingConsistency(sessions: any[]): number {
    if (sessions.length < 3) return 0
    
    const dailyTimes = sessions.reduce((acc, session) => {
      const date = session.date
      acc[date] = (acc[date] || 0) + session.duration
      return acc
    }, {})

    const times = Object.values(dailyTimes) as number[]
    const mean = times.reduce((sum, time) => sum + time, 0) / times.length
    const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length
    
    // Return consistency score (0-100, where 100 is perfectly consistent)
    return Math.max(0, 100 - (Math.sqrt(variance) / mean * 100))
  }

  private calculateFocusScore(pageAnalytics: any[]): number {
    if (pageAnalytics.length === 0) return 0

    // Focus score based on:
    // 1. Low re-reading (fewer revisits to same page)
    // 2. Consistent reading times
    // 3. Minimal extremely short sessions (< 30 seconds)

    const avgVisitsPerPage = pageAnalytics.reduce((sum, page) => sum + page.visit_count, 0) / pageAnalytics.length
    const shortSessions = pageAnalytics.filter(page => page.min_time < 30000).length
    const inconsistentPages = pageAnalytics.filter(page => 
      page.visit_count > 1 && (page.max_time / page.min_time) > 3
    ).length

    const focusDeductions = (avgVisitsPerPage - 1) * 20 + 
                           (shortSessions / pageAnalytics.length) * 30 +
                           (inconsistentPages / pageAnalytics.length) * 25

    return Math.max(0, Math.min(100, 100 - focusDeductions))
  }

  private analyzeTimeDistribution(pageAnalytics: any[]) {
    if (pageAnalytics.length === 0) return { fast: 0, moderate: 0, slow: 0 }

    const times = pageAnalytics.map(p => p.avg_time)
    const q1 = this.calculatePercentile(times, 25)
    const q3 = this.calculatePercentile(times, 75)

    const fast = pageAnalytics.filter(p => p.avg_time <= q1).length
    const slow = pageAnalytics.filter(p => p.avg_time >= q3).length
    const moderate = pageAnalytics.length - fast - slow

    return {
      fast: Math.round((fast / pageAnalytics.length) * 100),
      moderate: Math.round((moderate / pageAnalytics.length) * 100),
      slow: Math.round((slow / pageAnalytics.length) * 100)
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    const index = (percentile / 100) * (sorted.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index % 1

    return sorted[lower] * (1 - weight) + sorted[upper] * weight
  }

  private generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = []

    // Reading speed recommendations
    if (metrics.readingSpeedVariability > metrics.averageTimePerPage * 0.5) {
      recommendations.push("Your reading speed varies significantly. Try to maintain a consistent pace for better comprehension.")
    }

    // Focus recommendations
    if (metrics.focusScore < 70) {
      recommendations.push("Consider reducing distractions to improve focus. Try reading in shorter, concentrated sessions.")
    }

    // Consistency recommendations
    if (metrics.readingConsistency < 60) {
      recommendations.push("Establish a regular reading schedule to build better study habits.")
    }

    // Progress recommendations
    if (metrics.completionPercentage < 20 && metrics.averageTimePerPage > 180000) { // > 3 minutes per page
      recommendations.push("Pages are taking longer than usual. Consider skimming difficult sections first, then returning for detailed reading.")
    }

    // Default positive reinforcement
    if (recommendations.length === 0) {
      recommendations.push("Great reading habits! Keep up the consistent progress.")
    }

    return recommendations
  }

  async getReadingHeatmap(req: Request, res: Response) {
    const { pdfId } = req.params
    const db = this.dbService.getDatabase()

    const heatmapData = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT 
           page_number,
           COUNT(*) as visit_count,
           SUM(duration) as total_time,
           AVG(duration) as avg_time
         FROM reading_sessions 
         WHERE pdf_id = ?
         GROUP BY page_number
         ORDER BY page_number`,
        [pdfId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })

    // Get PDF total pages for complete heatmap
    const pdfInfo = await new Promise<any>((resolve, reject) => {
      db.get('SELECT total_pages FROM pdfs WHERE id = ?', [pdfId], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })

    // Create complete heatmap with all pages
    const completeHeatmap = Array.from({ length: pdfInfo.total_pages }, (_, i) => {
      const pageNumber = i + 1
      const pageData = heatmapData.find(p => p.page_number === pageNumber)
      return {
        page: pageNumber,
        visitCount: pageData?.visit_count || 0,
        totalTime: pageData?.total_time || 0,
        avgTime: pageData?.avg_time || 0,
        intensity: pageData ? Math.min(100, (pageData.visit_count - 1) * 25 + (pageData.avg_time / 120000) * 50) : 0
      }
    })

    res.json(completeHeatmap)
  }

  async getReadingTrends(req: Request, res: Response) {
    const { pdfId } = req.params
    const { days = 30 } = req.query
    const db = this.dbService.getDatabase()

    const trendsData = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT 
           DATE(start_time) as date,
           COUNT(*) as session_count,
           SUM(duration) as total_time,
           AVG(duration) as avg_session_time,
           COUNT(DISTINCT page_number) as pages_covered
         FROM reading_sessions 
         WHERE pdf_id = ? 
         AND start_time >= datetime('now', '-${days} days')
         GROUP BY DATE(start_time)
         ORDER BY date DESC`,
        [pdfId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })

    res.json(trendsData)
  }
}