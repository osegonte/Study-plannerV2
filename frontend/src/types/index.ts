export interface PDFDocument {
  id: string
  name: string
  file: File
  totalPages: number
  uploadedAt: Date
  lastReadPage?: number
}

export interface ReadingSession {
  id: string
  pdfId: string
  page: number
  startTime: Date
  endTime: Date
  duration: number
}

export interface Topic {
  id: string
  name: string
  color: string
  pdfIds: string[]
  createdAt: Date
}

export interface ReadingStats {
  pdfId: string
  averageTimePerPage: number
  totalTimeSpent: number
  pagesRead: number
  estimatedTimeRemaining: number
  completionPercentage: number
}
