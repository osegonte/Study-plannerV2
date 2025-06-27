import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { PDFController } from '../controllers/PDFController'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
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
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'), false)
    }
  }
})

const pdfController = new PDFController()

const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (req.file?.path && fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path)
  }
  res.status(400).json({ error: error.message || 'Upload failed' })
}

// Routes
router.post('/upload', upload.single('pdf'), handleUploadError, asyncHandler(pdfController.uploadPDF.bind(pdfController)))
router.get('/', asyncHandler(pdfController.getAllPDFs.bind(pdfController)))
router.get('/:id', asyncHandler(pdfController.getPDFById.bind(pdfController)))
router.delete('/:id', asyncHandler(pdfController.deletePDF.bind(pdfController)))
router.put('/:id/progress', asyncHandler(pdfController.updateProgress.bind(pdfController)))

// SIMPLE file serving
router.get('/:id/file', asyncHandler(async (req, res) => {
  const { id } = req.params
  
  try {
    const pdf = await pdfController.getPDFInfo(id)
    if (!pdf || !fs.existsSync(pdf.file_path)) {
      return res.status(404).json({ error: 'PDF not found' })
    }
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(pdf.original_name)}"`)
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    
    res.sendFile(path.resolve(pdf.file_path))
  } catch (error) {
    console.error('Error serving PDF:', error)
    res.status(500).json({ error: 'Failed to serve PDF' })
  }
}))

export { router as pdfRoutes }
