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

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log('📁 Created uploads directory:', uploadsDir)
}

// RELAXED rate limiting for development
const limiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 1000, // Very high limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip?.includes('localhost'))
  }
})

// FIXED: Enhanced CORS configuration for PDF.js
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Range',
    'Accept',
    'Accept-Encoding',
    'Accept-Language',
    'Cache-Control',
    'Connection',
    'Host',
    'User-Agent'
  ],
  exposedHeaders: [
    'Content-Range', 
    'Accept-Ranges', 
    'Content-Length',
    'Content-Type',
    'Cache-Control'
  ]
}

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Disable CSP for PDF viewing
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(compression())
app.use(limiter)
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(logger)

// IMPORTANT: Add global CORS headers for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept, Accept-Encoding')
  res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length')
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Serve uploaded files with proper headers
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
  }
}))

// API Routes
app.use('/api/pdfs', pdfRoutes)
app.use('/api/reading', basicReadingRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbService = DatabaseService.getInstance()
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.2.0',
    stage: 2,
    database: {
      initialized: dbService.isInitialized(),
      singleton: true
    },
    cors: {
      enabled: true,
      origins: corsOptions.origin
    },
    uploadsDir: uploadsDir,
    uploadsExists: fs.existsSync(uploadsDir)
  })
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

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Initializing Study Planner Backend...')
    
    const dbService = DatabaseService.getInstance()
    await dbService.initialize()
    
    console.log('✅ Database singleton initialized successfully')
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV}`)
      console.log(`🔗 CORS origins: ${corsOptions.origin.join(', ')}`)
      console.log(`📁 Uploads directory: ${uploadsDir}`)
      console.log(`📄 Static files served at: http://localhost:${PORT}/uploads/`)
      console.log(`📚 Stage 2: Basic Reading Time Tracking - ACTIVE`)
      console.log(`✅ CORS: Enhanced configuration for PDF.js`)
    })
    
    server.timeout = 120000 // 2 minutes timeout
    
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  const dbService = DatabaseService.getInstance()
  await dbService.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  const dbService = DatabaseService.getInstance()
  await dbService.close()
  process.exit(0)
})

startServer()

export default app
