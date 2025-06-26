import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { createError } from './errorHandler'

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body)
    if (error) {
      const message = error.details[0]?.message || 'Validation error'
      return next(createError(message, 400))
    }
    next()
  }
}

// Validation schemas
export const schemas = {
  readingSession: Joi.object({
    pdfId: Joi.string().required(),
    page: Joi.number().integer().min(1).required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required(),
    duration: Joi.number().integer().min(0).required(),
  }),

  topic: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required(),
    description: Joi.string().max(500).optional(),
  }),
}
