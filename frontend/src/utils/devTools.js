// Development Tools for PDF Study Planner
// Utilities to help with development and testing

export const DevTools = {
  // Log current app state
  logAppState() {
    console.log('📊 Current App State:');
    console.log('Topics:', JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]'));
    console.log('Documents:', JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]'));
    console.log('Goals:', JSON.parse(localStorage.getItem('pdf-study-planner-goals') || '[]'));
    console.log('User:', JSON.parse(localStorage.getItem('pdf-study-planner-user') || 'null'));
    console.log('Profile:', JSON.parse(localStorage.getItem('pdf-study-planner-profile') || 'null'));
  },

  // Generate random study session data
  simulateStudySession(documentId, pages = 5) {
    console.log(`🎯 Simulating study session for document ${documentId}`);
    
    const documents = JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]');
    const docIndex = documents.findIndex(doc => doc.id === documentId);
    
    if (docIndex === -1) {
      console.error('Document not found');
      return;
    }

    const doc = documents[docIndex];
    const startPage = doc.currentPage;
    
    // Generate random page times (120-300 seconds per page)
    for (let i = 0; i < pages; i++) {
      const pageNum = startPage + i;
      const readingTime = Math.floor(Math.random() * 180) + 120; // 2-5 minutes
      doc.pageTimes[pageNum] = readingTime;
    }
    
    doc.currentPage = startPage + pages;
    doc.lastReadAt = new Date().toISOString();
    
    documents[docIndex] = doc;
    localStorage.setItem('pdf-study-planner-documents', JSON.stringify(documents));
    
    console.log(`✅ Simulated reading ${pages} pages, now at page ${doc.currentPage}`);
  },

  // Create realistic exam schedule
  setExamSchedule(daysFromNow = [7, 14, 21, 30]) {
    console.log('📅 Setting up realistic exam schedule...');
    
    const topics = JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]');
    const priorities = ['high', 'medium', 'low'];
    const studyHours = [2, 2.5, 3, 3.5, 4];
    
    topics.forEach((topic, index) => {
      if (index < daysFromNow.length) {
        const examDate = new Date();
        examDate.setDate(examDate.getDate() + daysFromNow[index]);
        
        topic.examDate = {
          examDate: examDate,
          studyHoursPerDay: studyHours[index % studyHours.length],
          priority: priorities[index % priorities.length],
          setAt: new Date().toISOString()
        };
      }
    });
    
    localStorage.setItem('pdf-study-planner-topics', JSON.stringify(topics));
    console.log('✅ Exam schedule set for all topics');
  },

  // Export app data for backup
  exportAppData() {
    const data = {
      topics: JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]'),
      documents: JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]'),
      goals: JSON.parse(localStorage.getItem('pdf-study-planner-goals') || '[]'),
      user: JSON.parse(localStorage.getItem('pdf-study-planner-user') || 'null'),
      profile: JSON.parse(localStorage.getItem('pdf-study-planner-profile') || 'null'),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-planner-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📁 App data exported');
  },

  // Performance monitoring
  startPerformanceMonitoring() {
    console.log('⚡ Starting performance monitoring...');
    
    const originalLog = console.log;
    const performanceData = {
      componentRenders: 0,
      stateUpdates: 0,
      startTime: Date.now()
    };
    
    // Monitor React renders (basic)
    let renderCount = 0;
    const observer = new MutationObserver(() => {
      renderCount++;
      if (renderCount % 10 === 0) {
        console.log(`🔄 ${renderCount} DOM mutations detected`);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    return observer;
  }
};

// Auto-load in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  window.devTools = DevTools;
  console.log('🛠️ DevTools loaded. Available as window.devTools');
}

export default DevTools;
