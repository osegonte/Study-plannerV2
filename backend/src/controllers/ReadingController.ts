import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { DatabaseService } from '../services/DatabaseService'
import { createError } from '../middleware/errorHandler'

export class ReadingController {
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

    // Update reading progress
    await new Promise<void>((resolve, reject) => {
      db.run(
        `UPDATE reading_progress 
         SET total_time_spent = total_time_spent + ?,
             pages_read = (
               SELECT COUNT(DISTINCT page_number) 
               FROM reading_sessions 
               WHERE pdf_id = ?
             ),
             last_read_at = CURRENT_TIMESTAMP
         WHERE pdf_id = ?`,
        [duration, pdfId, pdfId],
        function(err) {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    res.status(201).json({ 
      id: sessionId,
      message: 'Reading session saved successfully' 
    })
  }

  async getReadingStats(req: Request, res: Response) {
    const { pdfId } = req.params
    const db = this.dbService.getDatabase()

    const stats = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT 
           p.total_pages,
           rp.total_time_spent,
           rp.pages_read,
           rp.current_page,
           CASE 
             WHEN rp.pages_read > 0 
             THEN CAST(rp.total_time_spent AS FLOAT) / rp.pages_read 
             ELSE 0 
           END as average_time_per_page,
           CASE 
             WHEN rp.pages_read > 0 
             THEN CAST((p.total_pages - rp.current_page + 1) * (rp.total_time_spent / rp.pages_read) AS INTEGER)
             ELSE 0 
           END as estimated_time_remaining
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

    if (!stats) {
      throw createError('PDF not found', 404)
    }

    const completionPercentage = stats.total_pages > 0 
      ? Math.round((stats.current_page / stats.total_pages) * 100) 
      : 0

    res.json({
      ...stats,
      completionPercentage,
      averageTimePerPage: Math.round(stats.average_time_per_page || 0),
      estimatedTimeRemaining: stats.estimated_time_remaining || 0
    })
  }

  async getReadingProgress(req: Request, res: Response) {
    const { pdfId } = req.params
    const db = this.dbService.getDatabase()

    const progress = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT p.total_pages, rp.current_page, rp.total_time_spent, rp.pages_read, rp.last_read_at
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

    if (!progress) {
      throw createError('PDF not found', 404)
    }

    const progressPercentage = progress.total_pages > 0 
      ? Math.round((progress.current_page / progress.total_pages) * 100) 
      : 0

    res.json({
      ...progress,
      progressPercentage
    })
  }

  async getReadingSessions(req: Request, res: Response) {
    const { pdfId } = req.params
    const db = this.dbService.getDatabase()

    const sessions = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT * FROM reading_sessions 
         WHERE pdf_id = ? 
         ORDER BY start_time DESC`,
        [pdfId],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })

    res.json(sessions)
  }

  async createTopic(req: Request, res: Response) {
    const { name, color, description } = req.body
    const topicId = uuidv4()
    const db = this.dbService.getDatabase()

    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO topics (id, name, color, description)
         VALUES (?, ?, ?, ?)`,
        [topicId, name, color, description],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              reject(createError('Topic name already exists', 409))
            } else {
              reject(err)
            }
          } else {
            resolve()
          }
        }
      )
    })

    res.status(201).json({
      id: topicId,
      name,
      color,
      description,
      message: 'Topic created successfully'
    })
  }

  async getAllTopics(req: Request, res: Response) {
    const db = this.dbService.getDatabase()

    const topics = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT t.*, 
                COUNT(pt.pdf_id) as pdf_count,
                COALESCE(SUM(p.total_pages), 0) as total_pages,
                COALESCE(SUM(rp.total_time_spent), 0) as total_time_spent
         FROM topics t
         LEFT JOIN pdf_topics pt ON t.id = pt.topic_id
         LEFT JOIN pdfs p ON pt.pdf_id = p.id
         LEFT JOIN reading_progress rp ON p.id = rp.pdf_id
         GROUP BY t.id
         ORDER BY t.created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })

    res.json(topics)
  }

  async updateTopic(req: Request, res: Response) {
    const { id } = req.params
    const { name, color, description } = req.body
    const db = this.dbService.getDatabase()

    await new Promise<void>((resolve, reject) => {
      db.run(
        `UPDATE topics 
         SET name = ?, color = ?, description = ?
         WHERE id = ?`,
        [name, color, description, id],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              reject(createError('Topic name already exists', 409))
            } else {
              reject(err)
            }
          } else if (this.changes === 0) {
            reject(createError('Topic not found', 404))
          } else {
            resolve()
          }
        }
      )
    })

    res.json({ message: 'Topic updated successfully' })
  }

  async deleteTopic(req: Request, res: Response) {
    const { id } = req.params
    const db = this.dbService.getDatabase()

    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM topics WHERE id = ?', [id], function(err) {
        if (err) reject(err)
        else if (this.changes === 0) {
          reject(createError('Topic not found', 404))
        } else {
          resolve()
        }
      })
    })

    res.json({ message: 'Topic deleted successfully' })
  }

  async assignPDFToTopic(req: Request, res: Response) {
    const { topicId, pdfId } = req.params
    const db = this.dbService.getDatabase()

    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO pdf_topics (pdf_id, topic_id)
         VALUES (?, ?)`,
        [pdfId, topicId],
        function(err) {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    res.json({ message: 'PDF assigned to topic successfully' })
  }

  async removePDFFromTopic(req: Request, res: Response) {
    const { topicId, pdfId } = req.params
    const db = this.dbService.getDatabase()

    await new Promise<void>((resolve, reject) => {
      db.run(
        'DELETE FROM pdf_topics WHERE pdf_id = ? AND topic_id = ?',
        [pdfId, topicId],
        function(err) {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    res.json({ message: 'PDF removed from topic successfully' })
  }
}
