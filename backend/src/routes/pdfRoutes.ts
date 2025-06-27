import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { PDFController } from '../controllers/PDFController'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

// Enhanced multer configuration for reliability
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
      fs.chmodSync(uploadDir, 0o755)
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const extension = path.extname(file.originalname)
    cb(null, `pdf-${uniqueSuffix}${extension}`)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' && 
        file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'), false)
    }
  }
})

const pdfController = new PDFController()

// Enhanced error handling middleware
const handleUploadError = (error: any, req: any, res: any, next: any) => {
  console.error('Upload error:', error)
  
  if (req.file?.path && fs.existsSync(req.file.path)) {
    try {
      fs.unlinkSync(req.file.path)
    } catch (cleanupError) {
      console.error('Failed to cleanup file:', cleanupError)
    }
  }
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 50MB)' })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field' })
    }
  }
  
  res.status(400).json({ 
    error: error.message || 'Upload failed',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  })
}

// Standard routes
router.post('/upload', 
  upload.single('pdf'), 
  handleUploadError,
  asyncHandler(pdfController.uploadPDF.bind(pdfController))
)

router.get('/', asyncHandler(pdfController.getAllPDFs.bind(pdfController)))
router.get('/:id', asyncHandler(pdfController.getPDFById.bind(pdfController)))
router.delete('/:id', asyncHandler(pdfController.deletePDF.bind(pdfController)))
router.put('/:id/progress', asyncHandler(pdfController.updateProgress.bind(pdfController)))

// CRITICAL: Enhanced PDF file serving endpoint
router.get('/:id/file', asyncHandler(async (req, res) => {
  const { id } = req.params
  console.log('📄 PDF file request for ID:', id)
  
  try {
    // Get PDF info from database
    const pdf = await pdfController.getPDFInfo(id)
    
    if (!pdf) {
      console.error('❌ PDF not found in database:', id)
      return res.status(404).json({ error: 'PDF not found' })
    }
    
    // Convert to absolute path and verify existence
    const absoluteFilePath = path.resolve(pdf.file_path)
    console.log('📄 Checking file path:', absoluteFilePath)
    
    if (!fs.existsSync(absoluteFilePath)) {
      console.error('❌ PDF file not found on filesystem:', absoluteFilePath)
      return res.status(404).json({ error: 'PDF file not found on filesystem' })
    }
    
    // Get file stats
    let stats
    try {
      stats = fs.statSync(absoluteFilePath)
    } catch (error) {
      console.error('❌ Cannot access file:', error)
      return res.status(500).json({ error: 'Cannot access PDF file' })
    }
    
    console.log('✅ Serving PDF file:', absoluteFilePath, 'Size:', stats.size)
    
    // Set comprehensive headers for PDF serving
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(pdf.original_name)}"`)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Content-Type')
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length')
    res.setHeader('Content-Length', stats.size.toString())
    
    // Handle range requests for streaming
    const range = req.headers.range
    if (range) {
      console.log('📄 Range request:', range)
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1
      
      if (start >= stats.size || end >= stats.size || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${stats.size}`)
        return res.end()
      }
      
      const chunkSize = (end - start) + 1
      res.status(206)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`)
      res.setHeader('Content-Length', chunkSize.toString())
      
      const stream = fs.createReadStream(absoluteFilePath, { start, end })
      
      stream.on('error', (err) => {
        console.error('❌ Stream error:', err)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error' })
        }
      })
      
      stream.pipe(res)
    } else {
      // Stream the entire file
      const stream = fs.createReadStream(absoluteFilePath)
      
      stream.on('error', (err) => {
        console.error('❌ Stream error:', err)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error' })
        }
      })
      
      stream.on('open', () => {
        console.log('✅ Started streaming PDF file')
      })
      
      stream.on('end', () => {
        console.log('✅ Finished streaming PDF file')
      })
      
      stream.pipe(res)
    }
    
  } catch (error) {
    console.error('❌ PDF file serving error:', error)
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
}))

export { router as pdfRoutes }
