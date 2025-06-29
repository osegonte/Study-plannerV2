# Test Data and Development Tools

This directory contains tools and sample data to help you develop and test the PDF Study Planner.

## Quick Start

### 1. Inject Test Data
Open your browser console when the app is running and use:
```javascript
// Add full test data (topics, documents, goals, user)
window.injectTestData()

// Add minimal test data (just one of each)
window.injectMinimalData()

// Clear all data
window.clearTestData()
```

### 2. Development Tools
```javascript
// View current app state
window.devTools.logAppState()

// Simulate reading session
window.devTools.simulateStudySession('1', 5) // document ID, pages

// Set exam dates for all topics
window.devTools.setExamSchedule([7, 14, 21, 30]) // days from now

// Export all data
window.devTools.exportAppData()
```

### 3. Create Sample Folders
```bash
./create_sample_folders.sh
```

## Test Data Includes

### Topics (5)
- Mathematics (exam in 2 weeks, high priority)
- Physics (exam in 3 weeks, medium priority)  
- History (exam in 4 weeks, low priority)
- Computer Science (exam in 5 weeks, high priority)
- Literature (no exam set)

### Documents (5)
- Calculus Textbook (25/120 pages read)
- Quantum Mechanics Guide (15/85 pages read)
- World War 2 Timeline (8/50 pages read)
- Algorithms Theory (45/200 pages read)
- Shakespeare Works (1/150 pages read)

### Goals (3)
- Read 30 minutes daily
- Complete Mathematics before exam
- Read 20 pages per day

### User Profile
- Name: Study Master
- School: University of Learning
- Major: Computer Science

## Development Workflow

1. **Start with test data**: `window.injectTestData()`
2. **Test features**: Navigate through the app, try all features
3. **Modify and experiment**: Change the code, see results immediately
4. **Clear data when needed**: `window.clearTestData()`
5. **Export progress**: `window.devTools.exportAppData()`

## File Structure Created

```
StudyMaterials/
├── Mathematics/
├── Physics/
├── History/
├── Computer_Science/
├── Literature/
├── Chemistry/
├── Biology/
└── Psychology/
```

Each folder contains sample placeholder files.

## Tips for Development

- Use browser dev tools console for quick testing
- The test data is realistic with proper timing data
- Exam dates are set to reasonable future dates
- Page reading times are randomized but realistic
- User can test folder creation workflows
- All features have sample data to work with

Happy coding! 🚀
