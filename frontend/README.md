# PDF Study Planner

A React-based application for tracking reading time and managing study sessions with PDF documents.

## Features

### 📚 PDF Document Management
- Upload and organize PDF study materials
- Topic-based organization system
- Progress tracking with visual indicators
- File validation and error handling

### ⏱️ Reading Time Tracking
- Automatic page-by-page timing
- Real-time timer display with pause/resume
- Session statistics and analytics
- Smart pause when switching browser tabs
- Historical data for all pages visited

### 📈 Reading Analytics
- Personal reading speed calculation
- Document completion time estimates
- Real-time remaining time predictions
- Confidence-based estimate reliability
- Progress visualization with detailed breakdowns

### 🎯 Study Organization
- Create and manage study topics
- Color-coded topic system
- Document categorization
- Progress tracking across multiple PDFs

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-study-planner
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Start the development servers**
   ```bash
   # From the project root
   ./start-dev.sh
   ```
   
   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

4. **Open the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Usage

### Getting Started
1. **Create Account**: Set up your user profile when first launching the app
2. **Create Topics**: Organize your study materials by creating topics (e.g., Mathematics, Physics)
3. **Upload PDFs**: Upload your study materials to the appropriate topics
4. **Start Reading**: Open PDFs and let the app track your reading time automatically
5. **View Analytics**: Check your progress, reading speed, and completion estimates

### Key Features

#### PDF Reading
- **Timer**: Automatically tracks time spent on each page
- **Navigation**: Easy page navigation with progress tracking
- **Zoom**: Adjust zoom level for comfortable reading
- **Progress**: Visual progress bar showing completion percentage

#### Analytics
- **Reading Speed**: Personal reading speed in pages per hour
- **Estimates**: Completion time predictions based on your reading patterns
- **Confidence Levels**: Estimate reliability improves with more data
- **Progress Tracking**: Visual representation of study progress

#### Organization
- **Topics**: Group related documents together
- **Search**: Find documents quickly
- **Progress Overview**: See completion status across all materials

## Technical Features

- **PDF Rendering**: Uses react-pdf for high-quality document display
- **Responsive Design**: Works on desktop and tablet devices
- **Data Persistence**: Local storage with automatic backups
- **Error Handling**: Comprehensive error handling and recovery
- **Performance**: Optimized for large PDF files

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please create an issue in the repository.
