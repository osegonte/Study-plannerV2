import { Router } from 'express'
import { BasicReadingController } from '../controllers/BasicReadingController'
import { asyncHandler } from '../middleware/errorHandler'
import { validate, schemas } from '../middleware/validation'

const router = Router()
const readingController = new BasicReadingController()

// Stage 2: Basic reading session routes
router.post('/session', 
  validate(schemas.readingSession),
  asyncHandler(readingController.saveReadingSession.bind(readingController))
)

// Stage 2: Basic statistics (no complex analytics)
router.get('/stats/:pdfId', 
  asyncHandler(readingController.getBasicReadingStats.bind(readingController))
)

router.get('/progress/:pdfId', 
  asyncHandler(readingController.getReadingProgress.bind(readingController))
)

router.get('/sessions/:pdfId', 
  asyncHandler(readingController.getReadingSessions.bind(readingController))
)

// Note: Advanced analytics routes removed for Stage 2
// These will be added back in Stage 5:
// - /stats/advanced/:pdfId (focus scores, heatmaps, etc.)
// - /heatmap/:pdfId  
// - /trends/:pdfId
// - Complex analytics endpoints

export { router as basicReadingRoutes }