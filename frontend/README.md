# PDF Study Planner

A React-based application for tracking reading time and managing study sessions with PDF documents.

## Project Stages

- [x] **Stage 1**: PDF Viewer Core ✅
- [x] **Stage 2**: Reading Time Tracking ✅  
- [x] **Stage 3**: Estimated Reading Time ✅
- [ ] **Stage 4**: Topic Organization  
- [ ] **Stage 5**: Dashboard & Analytics

## Stage 3 Features ✅

### 📈 Reading Speed Analysis
- **Personal Reading Speed**: Calculate pages per hour based on your actual reading
- **Average vs Median**: Smart calculation using median for better accuracy with outliers
- **Confidence Levels**: Low/Medium/High/Very High confidence based on data quality
- **Adaptive Estimates**: More accurate predictions as you read more pages

### ⏰ Completion Estimates
- **Total Document Time**: Estimate how long the entire PDF will take
- **Remaining Time**: Time needed to finish from current page
- **Finish By Time**: Predicted completion time (e.g., "Finish by 3:45 PM")
- **Progress Visualization**: Visual progress bar with percentage complete

### 🎯 Smart Predictions
- **Data-Driven**: Uses your actual reading patterns, not generic estimates
- **Outlier Detection**: Handles unusually fast/slow pages intelligently
- **Confidence Scoring**: Tells you how reliable the estimates are
- **Real-Time Updates**: Estimates improve as you read more pages

### 📊 Advanced Analytics
- **Reading Speed Indicator**: Live speed display in toolbar
- **Fastest/Slowest Pages**: Identify which pages took longest/shortest time
- **Data Coverage**: Shows how much of the document contributes to estimates
- **Detailed Breakdowns**: Multiple time formats for different contexts

## Complete Feature Set (Stages 1-3) ✅

### PDF Viewing
- Real PDF rendering with react-pdf
- Page navigation (previous/next/jump to page)
- Zoom controls (50% to 300%)  
- Progress tracking with visual indicators
- File upload with validation
- Comprehensive error handling

### Time Tracking
- Automatic page-by-page timing
- Real-time timer display with pause/resume
- Session statistics and analytics
- Smart pause when switching browser tabs
- Historical data for all pages visited

### Reading Estimates
- Personalized reading speed calculation
- Document completion time estimates
- Real-time remaining time predictions
- Confidence-based estimate reliability
- Smart outlier handling for accuracy

## Usage

1. **Upload a PDF**: Click "Upload PDF" and select your study material
2. **Start Reading**: Timer automatically starts, estimates begin after page 2
3. **Watch Estimates Improve**: Reading speed and completion predictions get more accurate
4. **Check Your Pace**: View reading speed in toolbar and detailed estimates in sidebar
5. **Plan Your Time**: See estimated finish time and remaining time to plan study sessions

## Technical Features

- **Smart Calculations**: Uses both average and median for robust estimates
- **Confidence Scoring**: Estimates improve from "Low" to "Very High" confidence
- **Real-time Updates**: All estimates update live as you read
- **Data Persistence**: Timing data maintained throughout session
- **Responsive Design**: Works on desktop and tablet devices

## Next Steps

Ready for **Stage 4: Topic Organization** which will add:
- PDF categorization by subject/topic
- Topic-based reading time estimates  
- Study session organization
- Multi-document progress tracking
