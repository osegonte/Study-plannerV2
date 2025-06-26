# 📚 Study Planner App - Project Structure

## Overview
A comprehensive study planner application for tracking PDF reading progress and optimizing study time.

## Directory Structure

```
study-planner-app/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── layout/     # Layout components (Header, Layout)
│   │   │   ├── pdf/        # PDF-related components
│   │   │   └── ui/         # Generic UI components
│   │   ├── pages/          # Page components
│   │   │   ├── HomePage.tsx
│   │   │   └── PDFViewerPage.tsx
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts (PDFContext)
│   │   ├── utils/          # Utility functions (API client)
│   │   ├── types/          # TypeScript type definitions
│   │   └── styles/         # Global styles (Tailwind CSS)
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Backend utility functions
│   │   └── types/          # TypeScript type definitions
│   ├── uploads/            # PDF file storage
│   ├── database/           # SQLite database files
│   └── package.json        # Backend dependencies
├── docs/                   # Documentation
├── package.json            # Root project configuration
└── README.md              # Project documentation
```

## Key Features Implemented

### Stage 1: PDF Viewer Core ✅
- PDF file upload with drag & drop support
- PDF viewing with navigation controls
- Page counter and jump-to-page functionality
- Reading time tracking per page
- Zoom controls and keyboard navigation

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- React PDF for PDF rendering
- React Router for navigation

**Backend:**
- Node.js with Express and TypeScript
- SQLite database for data persistence
- Multer for file upload handling
- PDF parsing for metadata extraction

## Development Commands

```bash
# Start development servers
npm run dev

# Build for production
npm run build

# Install all dependencies
npm run install:all

# Clean build artifacts
npm run clean
```

## API Endpoints

### PDF Management
- `POST /api/pdfs/upload` - Upload PDF file
- `GET /api/pdfs` - Get all PDFs
- `GET /api/pdfs/:id` - Get specific PDF details
- `DELETE /api/pdfs/:id` - Delete PDF

### Reading Tracking
- `POST /api/reading/session` - Save reading session
- `GET /api/reading/stats/:pdfId` - Get reading statistics
- `GET /api/reading/progress/:pdfId` - Get reading progress

## Next Development Phases

### Stage 2: Enhanced Reading Analytics
- Advanced time tracking analytics
- Reading speed calculations
- Progress insights and recommendations

### Stage 3: Estimated Reading Time
- Predictive reading time calculations
- Completion time estimates
- Reading goal setting

### Stage 4: Topic Organization
- PDF categorization by topics
- Topic-based progress tracking
- Study schedule organization

### Stage 5: Advanced Features
- User dashboard with comprehensive analytics
- Study habit insights
- Progress reports and recommendations
