import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import pdfParse from 'pdf-parse'
import { DatabaseService } from '../services/DatabaseService'
import { createError } from '../middleware/errorHandler'

export class PDFController {
  private dbService: DatabaseService

  constructor() {
    // Get singleton instance - DO NOT call initialize here
    this.dbService = DatabaseService.getInstance()
  }

  async uploadPDF(req: Request, res: Response) {
    if (!req.file) {
      throw createError('No PDF file uploaded', 400)
    }

    const pdfId = uuidv4()
    const filePath = req.file.path
    
    try {
      // Parse PDF to get page count
      const pdfBuffer = fs.readFileSync(filePath)
      const pdfData = await pdfParse(pdfBuffer)
      const totalPages = pdfData.numpages

      console.log('📄 PDF uploaded:', {
        id: pdfId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        totalPages,
        path: filePath
      })

      // Get database instance (should already be initialized)
      if (!this.dbService.isInitialized()) {
        throw createError('Database not initialized', 500)
      }
      
      const db = this.dbService.getDatabase()
      
      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT INTO pdfs (id, filename, original_name, file_path, file_size, total_pages)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [pdfId, req.file!.filename, req.file!.originalname, filePath, req.file!.size, totalPages],
          function(err) {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Initialize reading progress
      await new Promise<void>((resolve, reject) => {
        db.run(
          `INSERT INTO reading_progress (pdf_id, current_page, total_time_spent, pages_read)
           VALUES (?, 1, 0, 0)`,
          [pdfId],
          function(err) {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      res.status(201).json({
        id: pdfId,
        filename: req.file.originalname,
        totalPages,
        fileSize: req.file.size,
        message: 'PDF uploaded successfully'
      })
    } catch (error) {
      console.error('❌ PDF upload error:', error)
      // Clean up file if database save fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      throw createError('Failed to process PDF file', 500)
    }
  }

  async getAllPDFs(req: Request, res: Response) {
    if (!this.dbService.isInitialized()) {
      throw createError('Database not initialized', 500)
    }
    
    const db = this.dbService.getDatabase()
    
    const pdfs = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT p.*, rp.current_page, rp.total_time_spent, rp.pages_read, rp.last_read_at
         FROM pdfs p
         LEFT JOIN reading_progress rp ON p.id = rp.pdf_id
         ORDER BY p.uploaded_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })

    res.json(pdfs)
  }

  async getPDFById(req: Request, res: Response) {
    const { id } = req.params
    
    if (!this.dbService.isInitialized()) {
      throw createError('Database not initialized', 500)
    }
    
    const db = this.dbService.getDatabase()
    
    const pdf = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT p.*, rp.current_page, rp.total_time_spent, rp.pages_read, rp.last_read_at
         FROM pdfs p
         LEFT JOIN reading_progress rp ON p.id = rp.pdf_id
         WHERE p.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })

    if (!pdf) {
      throw createError('PDF not found', 404)
    }

    // Update last accessed time
    db.run(
      'UPDATE pdfs SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    )

    res.json(pdf)
  }

  // Helper method for file serving
  async getPDFInfo(id: string) {
    if (!this.dbService.isInitialized()) {
      throw new Error('Database not initialized')
    }
    
    const db = this.dbService.getDatabase()
    
    return new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM pdfs WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })
  }

  async deletePDF(req: Request, res: Response) {
    const { id } = req.params
    
    if (!this.dbService.isInitialized()) {
      throw createError('Database not initialized', 500)
    }
    
    const db = this.dbService.getDatabase()
    
    // Get PDF info first
    const pdf = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM pdfs WHERE id = ?', [id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })

    if (!pdf) {
      throw createError('PDF not found', 404)
    }

    // Delete file from filesystem
    if (fs.existsSync(pdf.file_path)) {
      fs.unlinkSync(pdf.file_path)
    }

    // Delete from database (cascades to related tables)
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM pdfs WHERE id = ?', [id], function(err) {
        if (err) reject(err)
        else resolve()
      })
    })

    res.json({ message: 'PDF deleted successfully' })
  }

  async updateProgress(req: Request, res: Response) {
    const { id } = req.params
    const { currentPage } = req.body
    
    if (!this.dbService.isInitialized()) {
      throw createError('Database not initialized', 500)
    }
    
    const db = this.dbService.getDatabase()

    await new Promise<void>((resolve, reject) => {
      db.run(
        `UPDATE reading_progress 
         SET current_page = ?, last_read_at = CURRENT_TIMESTAMP
         WHERE pdf_id = ?`,
        [currentPage, id],
        function(err) {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    res.json({ message: 'Progress updated successfully' })
  }
}