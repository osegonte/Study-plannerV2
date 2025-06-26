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

// Direct file serving endpoint
router.get('/:id/file', asyncHandler(async (req, res) => {
  const { id } = req.params
  const pdfController = new PDFController()
  
  // Get PDF info from database
  const pdf = await pdfController.getPDFInfo(id)
  
  if (!pdf || !fs.existsSync(pdf.file_path)) {
    return res.status(404).json({ error: 'PDF file not found' })
  }
  
  // Set proper headers
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${pdf.original_name}"`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  // Stream the file
  const stream = fs.createReadStream(pdf.file_path)
  stream.pipe(res)
}))

export { router as pdfRoutes }
