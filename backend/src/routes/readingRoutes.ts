import { Router } from 'express'
import { ReadingController } from '../controllers/ReadingController'
import { EnhancedReadingController } from '../controllers/EnhancedReadingController'
import { asyncHandler } from '../middleware/errorHandler'
import { validate, schemas } from '../middleware/validation'

const router = Router()
const readingController = new ReadingController()
const enhancedReadingController = new EnhancedReadingController()

// Enhanced reading session routes
router.post('/session', 
  validate(schemas.readingSession),
  asyncHandler(enhancedReadingController.saveReadingSession.bind(enhancedReadingController))
)

// Basic analytics (keeping for backward compatibility)
router.get('/stats/:pdfId', asyncHandler(readingController.getReadingStats.bind(readingController)))
router.get('/progress/:pdfId', asyncHandler(readingController.getReadingProgress.bind(readingController)))
router.get('/sessions/:pdfId', asyncHandler(readingController.getReadingSessions.bind(readingController)))

// Enhanced analytics endpoints
router.get('/stats/advanced/:pdfId', 
  asyncHandler(enhancedReadingController.getAdvancedReadingStats.bind(enhancedReadingController))
)

router.get('/heatmap/:pdfId', 
  asyncHandler(enhancedReadingController.getReadingHeatmap.bind(enhancedReadingController))
)

router.get('/trends/:pdfId', 
  asyncHandler(enhancedReadingController.getReadingTrends.bind(enhancedReadingController))
)

// Topic routes (existing)
router.post('/topics', 
  validate(schemas.topic),
  asyncHandler(readingController.createTopic.bind(readingController))
)

router.get('/topics', asyncHandler(readingController.getAllTopics.bind(readingController)))
router.put('/topics/:id', 
  validate(schemas.topic),
  asyncHandler(readingController.updateTopic.bind(readingController))
)

router.delete('/topics/:id', asyncHandler(readingController.deleteTopic.bind(readingController)))
router.post('/topics/:topicId/pdfs/:pdfId', asyncHandler(readingController.assignPDFToTopic.bind(readingController)))
router.delete('/topics/:topicId/pdfs/:pdfId', asyncHandler(readingController.removePDFFromTopic.bind(readingController)))

export { router as enhancedReadingRoutes }