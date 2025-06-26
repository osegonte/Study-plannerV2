import { Router } from 'express'
import { ReadingController } from '../controllers/ReadingController'
import { asyncHandler } from '../middleware/errorHandler'
import { validate, schemas } from '../middleware/validation'

const router = Router()
const readingController = new ReadingController()

// Reading session routes
router.post('/session', 
  validate(schemas.readingSession),
  asyncHandler(readingController.saveReadingSession.bind(readingController))
)

router.get('/stats/:pdfId', asyncHandler(readingController.getReadingStats.bind(readingController)))
router.get('/progress/:pdfId', asyncHandler(readingController.getReadingProgress.bind(readingController)))
router.get('/sessions/:pdfId', asyncHandler(readingController.getReadingSessions.bind(readingController)))

// Topic routes
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

export { router as readingRoutes }
