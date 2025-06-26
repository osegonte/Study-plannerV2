import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

import { pdfRoutes } from './routes/pdfRoutes'
import { readingRoutes } from './routes/readingRoutes'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './middleware/logger'
import { DatabaseService } from './services/DatabaseService'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Initialize database
const dbService = new DatabaseService()
dbService.initialize()

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log('📁 Created uploads directory:', uploadsDir)
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
})

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Disable CSP for PDF viewing
}))
app.use(compression())
app.use(limiter)
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(logger)

// Serve uploaded files with proper headers for PDFs
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for file requests
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Range')
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  
  next()
}, express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Cache-Control', 'public, max-age=86400')
    }
  }
}))

// API Routes
app.use('/api/pdfs', pdfRoutes)
app.use('/api/reading', readingRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    uploadsDir: uploadsDir,
    uploadsExists: fs.existsSync(uploadsDir)
  })
})

// Test endpoint to list uploaded files
app.get('/api/debug/uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
    res.json({
      uploadsDir,
      files: files.map(file => ({
        name: file,
        path: path.join(uploadsDir, file),
        exists: fs.existsSync(path.join(uploadsDir, file)),
        url: `http://localhost:${PORT}/uploads/${file}`,
        stats: fs.statSync(path.join(uploadsDir, file))
      }))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Error handling middleware (must be last)
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔗 CORS origin: ${process.env.CORS_ORIGIN}`)
  console.log(`📁 Uploads directory: ${uploadsDir}`)
  console.log(`📄 Static files served at: http://localhost:${PORT}/uploads/`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})
