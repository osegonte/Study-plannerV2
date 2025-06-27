import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { PDFController } from '../controllers/PDFController'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

const pdfController = new PDFController()

// PDF routes
router.post('/upload', upload.single('pdf'), asyncHandler(pdfController.uploadPDF.bind(pdfController)))
router.get('/', asyncHandler(pdfController.getAllPDFs.bind(pdfController)))
router.get('/:id', asyncHandler(pdfController.getPDFById.bind(pdfController)))
router.delete('/:id', asyncHandler(pdfController.deletePDF.bind(pdfController)))
router.put('/:id/progress', asyncHandler(pdfController.updateProgress.bind(pdfController)))

// FIXED: Direct file serving endpoint with proper error handling
router.get('/:id/file', asyncHandler(async (req, res) => {
  const { id } = req.params
  console.log('📄 PDF file request for ID:', id)
  
  try {
    // Get PDF info from database
    const pdf = await pdfController.getPDFInfo(id)
    console.log('📄 PDF info found:', pdf ? pdf.original_name : 'NOT FOUND')
    
    if (!pdf) {
      console.error('❌ PDF not found in database:', id)
      return res.status(404).json({ error: 'PDF not found in database' })
    }
    
    // CRITICAL FIX: Convert relative path to absolute path
    const absoluteFilePath = path.resolve(pdf.file_path)
    console.log('📄 Checking file path:', absoluteFilePath)
    
    // Check if file exists on filesystem
    if (!fs.existsSync(absoluteFilePath)) {
      console.error('❌ PDF file not found on filesystem:', absoluteFilePath)
      return res.status(404).json({ error: 'PDF file not found on filesystem' })
    }
    
    console.log('✅ Serving PDF file:', absoluteFilePath)
    
    // Set proper headers for PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${pdf.original_name}"`)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Range')
    res.setHeader('Accept-Ranges', 'bytes')
    
    // Get file stats for Content-Length
    const stats = fs.statSync(absoluteFilePath)
    res.setHeader('Content-Length', stats.size.toString())
    
    // Handle range requests for PDF streaming
    const range = req.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1
      const chunkSize = (end - start) + 1
      
      res.status(206)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`)
      res.setHeader('Content-Length', chunkSize.toString())
      
      const stream = fs.createReadStream(absoluteFilePath, { start, end })
      stream.pipe(res)
    } else {
      // Stream the entire file
      const stream = fs.createReadStream(absoluteFilePath)
      
      stream.on('error', (err) => {
        console.error('❌ Stream error:', err)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to read PDF file' })
        }
      })
      
      stream.pipe(res)
    }
    
  } catch (error) {
    console.error('❌ PDF file serving error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}))

export { router as pdfRoutes }