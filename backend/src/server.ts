import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

import { pdfRoutes } from './routes/pdfRoutes'
import { basicReadingRoutes } from './routes/basicReadingRoutes'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './middleware/logger'
import { DatabaseService } from './services/DatabaseService'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Initialize database ONCE at startup
const dbService = DatabaseService.getInstance()
dbService.initialize()

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log('📁 Created uploads directory:', uploadsDir)
}

// More relaxed rate limiting for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute instead of 15
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 instead of 100
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks in development
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.path === '/api/health'
  }
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
app.use('/api/reading', basicReadingRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.2.0', // Stage 2 version
    stage: 2,
    features: {
      pdfViewing: true,
      basicTimeTracking: true,
      readingProgress: true,
      // Stage 3+ features (not yet implemented)
      estimatedReadingTime: false,
      topicOrganization: false,
      enhancedAnalytics: false
    },
    uploadsDir: uploadsDir,
    uploadsExists: fs.existsSync(uploadsDir)
  })
})

// Basic analytics summary endpoint (simplified for Stage 2)
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const db = dbService.getDatabase()
    
    // Get basic statistics only (no complex analytics)
    const basicStats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
           COUNT(DISTINCT p.id) as total_pdfs,
           SUM(p.total_pages) as total_pages,
           COALESCE(SUM(rp.total_time_spent), 0) as total_time_spent,
           COALESCE(SUM(rp.pages_read), 0) as total_pages_read
         FROM pdfs p
         LEFT JOIN reading_progress rp ON p.id = rp.pdf_id`,
        [],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })

    res.json({
      ...basicStats,
      averageReadingSpeed: basicStats.total_pages_read > 0 
        ? basicStats.total_time_spent / basicStats.total_pages_read 
        : 0,
      message: "Stage 2: Basic analytics only"
    })
  } catch (error) {
    console.error('Analytics summary error:', error)
    res.status(500).json({ error: 'Failed to generate analytics summary' })
  }
})

// Test endpoint to list uploaded files (development only)
if (process.env.NODE_ENV === 'development') {
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
}

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
  console.log(`📚 Stage 2: Basic Reading Time Tracking - ACTIVE`)
  console.log(`⏳ Next: Stage 3 (Estimated Reading Time)`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  dbService.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  dbService.close()
  process.exit(0)
})

export default app