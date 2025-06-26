import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { DatabaseService } from '../services/DatabaseService'
import { createError } from '../middleware/errorHandler'

export class BasicReadingController {
  private dbService: DatabaseService

  constructor() {
    // Get singleton instance - DO NOT call initialize here
    this.dbService = DatabaseService.getInstance()
  }

  // Stage 2: Basic reading session tracking
  async saveReadingSession(req: Request, res: Response) {
    const { pdfId, page, startTime, endTime, duration } = req.body
    const sessionId = uuidv4()
    
    if (!this.dbService.isInitialized()) {
      throw createError('Database not initialized', 500)
    }
    
    const db = this.dbService.getDatabase()

    // Save basic reading session
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

    // Update basic reading progress
    await this.updateBasicProgress(pdfId)

    res.status(201).json({ 
      id: sessionId,
      message: 'Reading session saved successfully' 
    })
  }

  // Stage 2: Simple progress calculation
  private async updateBasicProgress(pdfId: string) {
    if (!this.dbService.isInitialized()) {
      throw new Error('Database not initialized')
    }
    
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

  // Stage 2: Basic reading statistics (no complex analytics)
  async getBasicReadingStats(req: Request, res: Response) {
    const { pdfId } = req.params
    
    if (!this.dbService.isInitialized()) {
      throw createError('Database not initialized', 500)
    }
    
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

    // Simple calculations only
    const { total_pages, pages_read, total_time_spent, current_page } = basicStats
    
    // Basic average time per page
    const averageTimePerPage = pages_read > 0 ? total_time_spent / pages_read : 0
    
    // Simple completion percentage
    const completionPercentage = total_pages > 0 ? Math.round((current_page / total_pages) * 100) : 0

    res.json({
      ...basicStats,
      averageTimePerPage: Math.round(averageTimePerPage),
      completionPercentage
    })
  }

  // Stage 2: Get reading sessions (simple list)
  async getReadingSessions(req: Request, res: Response) {
    const { pdfId } = req.params
    
    if (!this.dbService.isInitialized()) {
      throw createError('Database not initialized', 500)
    }
    
    const db = this.dbService.getDatabase()

    const sessions = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT 
           page_number,
           duration,
           start_time,
           end_time
         FROM reading_sessions 
         WHERE pdf_id = ?
         ORDER BY start_time DESC
         LIMIT 20`,
        [pdfId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })

    res.json(sessions)
  }

  // Stage 2: Get reading progress (simple data)
  async getReadingProgress(req: Request, res: Response) {
    const { pdfId } = req.params
    
    if (!this.dbService.isInitialized()) {
      throw createError('Database not initialized', 500)
    }
    
    const db = this.dbService.getDatabase()

    const progress = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT 
           current_page,
           total_time_spent,
           pages_read,
           last_read_at
         FROM reading_progress
         WHERE pdf_id = ?`,
        [pdfId],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })

    if (!progress) {
      throw createError('Progress not found', 404)
    }

    res.json(progress)
  }
}