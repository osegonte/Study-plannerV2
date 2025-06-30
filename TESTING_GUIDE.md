# PDF Study Planner - Testing Guide

## Quick Start
1. Run `./setup-testing-environment.sh` (this script)
2. Run `./start-dev.sh` to start both servers
3. Open http://localhost:3000 in your browser

## Testing Checklist

### Core Features
- [ ] User onboarding flow
- [ ] Topic creation and management
- [ ] PDF file upload (try different sizes)
- [ ] PDF viewing with navigation
- [ ] Page timing and tracking
- [ ] Reading speed calculations
- [ ] Time estimates and predictions
- [ ] Analytics dashboard

### Edge Cases
- [ ] Large PDF files (>10MB)
- [ ] Very small PDF files (<1MB)
- [ ] PDF files with many pages (>100)
- [ ] Switching between PDFs quickly
- [ ] Browser tab switching (timer pause)
- [ ] Page refresh during reading
- [ ] Network interruption simulation

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on macOS)
- [ ] Edge

## Common Issues

### PDF Not Loading
- Check browser console for worker errors
- Verify pdf.worker.min.js is downloaded
- Try a different PDF file
- Check file size (must be <100MB)

### Timer Issues
- Check if timer pauses on tab switch
- Verify localStorage is working
- Test timer across page navigation

### Upload Problems
- Check file type (must be PDF)
- Verify file size limits
- Test with different PDF sources

## Debug Tools
- Open browser DevTools (F12)
- Check Console tab for errors
- Monitor Network tab for failed requests
- Use `window.devTools` in console for debug functions

## Test Data
- Use `window.injectTestData()` in console for sample data
- Use `window.clearTestData()` to reset
- Sample PDFs are in `frontend/sample_pdfs/`
