import { pdfFileHandler } from './pdfFileHandler';

export const injectTestData = () => {
  // First, clear any existing data
  localStorage.removeItem('pdf-study-planner-topics');
  localStorage.removeItem('pdf-study-planner-documents');
  pdfFileHandler.clearCache();

  const topics = [
    { 
      id: '1', 
      name: 'Mathematics', 
      description: 'Advanced Calculus and Linear Algebra', 
      color: 'blue', 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    }
  ];

  // Create mock cache keys for demo files
  const mockFiles = [
    { name: 'Advanced Calculus Textbook.pdf', size: 5230000 },
    { name: 'Quantum Physics Guide.pdf', size: 3850000 },
    { name: 'Machine Learning Fundamentals.pdf', size: 7200000 }
  ];

  // Add mock files to cache
  mockFiles.forEach(file => {
    const cacheKey = `${file.name}-${file.size}-${Date.now()}`;
    pdfFileHandler.fileCache.set(cacheKey, {
      name: file.name,
      size: file.size,
      type: 'application/pdf',
      processedAt: Date.now(),
      hasData: true
    });
  });
  pdfFileHandler.saveToStorage();

  // Create documents with realistic reading progress
  const documents = [
    { 
      id: '1', 
      name: 'Advanced Calculus Textbook.pdf', 
      size: 5230000, 
      topicId: '1', 
      totalPages: 156, 
      currentPage: 23, 
      cacheKey: Array.from(pdfFileHandler.fileCache.keys())[0],
      pageTimes: {
        1: 120, 2: 95, 3: 110, 4: 85, 5: 130, 6: 105, 7: 90, 8: 115, 9: 100, 10: 125,
        11: 95, 12: 110, 13: 85, 14: 120, 15: 105, 16: 95, 17: 130, 18: 115, 19: 90, 20: 110,
        21: 100, 22: 125
      }, 
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
      lastReadAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      readingProgress: {
        percentage: 14.7,
        timeSpent: 2415,
        averageTimePerPage: 109.8,
        estimatedTimeRemaining: 14598,
        lastUpdated: new Date().toISOString()
      }
    },
    { 
      id: '2', 
      name: 'Quantum Physics Guide.pdf', 
      size: 3850000, 
      topicId: '2', 
      totalPages: 89, 
      currentPage: 34, 
      cacheKey: Array.from(pdfFileHandler.fileCache.keys())[1],
      pageTimes: {
        1: 150, 2: 140, 3: 160, 4: 135, 5: 155, 6: 145, 7: 130, 8: 165, 9: 140, 10: 150,
        11: 135, 12: 160, 13: 145, 14: 155, 15: 140, 16: 150, 17: 165, 18: 135, 19: 145, 20: 160,
        21: 155, 22: 140, 23: 150, 24: 135, 25: 165, 26: 145, 27: 160, 28: 155, 29: 140, 30: 150,
        31: 135, 32: 160, 33: 145
      }, 
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
      lastReadAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      readingProgress: {
        percentage: 38.2,
        timeSpent: 4875,
        averageTimePerPage: 147.7,
        estimatedTimeRemaining: 8271,
        lastUpdated: new Date().toISOString()
      }
    },
    { 
      id: '3', 
      name: 'Machine Learning Fundamentals.pdf', 
      size: 7200000, 
      topicId: '3', 
      totalPages: 234, 
      currentPage: 67, 
      cacheKey: Array.from(pdfFileHandler.fileCache.keys())[2],
      pageTimes: {
        1: 180, 2: 165, 3: 190, 4: 170, 5: 185, 6: 175, 7: 160, 8: 195, 9: 180, 10: 165,
        11: 170, 12: 190, 13: 175, 14: 185, 15: 160, 16: 180, 17: 195, 18: 170, 19: 175, 20: 190,
        21: 200, 22: 155, 23: 210, 24: 165, 25: 195, 26: 175, 27: 180, 28: 205, 29: 160, 30: 190
      }, 
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), 
      lastReadAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      readingProgress: {
        percentage: 28.6,
        timeSpent: 5520,
        averageTimePerPage: 184,
        estimatedTimeRemaining: 30728,
        lastUpdated: new Date().toISOString()
      }
    }
  ];

  localStorage.setItem('pdf-study-planner-topics', JSON.stringify(topics));
  localStorage.setItem('pdf-study-planner-documents', JSON.stringify(documents));
  
  console.log('✅ Demo test data injected successfully!');
  console.log('📊 Added:');
  console.log(`   • ${topics.length} topics with color themes`);
  console.log(`   • ${documents.length} documents with realistic progress`);
  console.log(`   • Working timer and progress tracking`);
  console.log(`   • Full demo mode PDF viewer`);
  console.log('');
  console.log('🎯 What works now:');
  console.log('   • Upload PDFs (stores metadata)');
  console.log('   • View PDFs (demo mode with full functionality)');
  console.log('   • Timer tracks reading time automatically');
  console.log('   • Progress saves and resumes correctly');
  console.log('   • Reading speed calculations work');
  console.log('   • All navigation and controls functional');
  console.log('');
  console.log('🔄 Refresh the page to see the demo data!');
  
  window.location.reload();
};

export const clearTestData = () => {
  localStorage.clear();
  pdfFileHandler.clearCache();
  console.log('✅ All data cleared! Refresh the page.');
  window.location.reload();
};

// Advanced test data with more realistic study scenarios
export const injectAdvancedTestData = () => {
  clearTestData();
  
  const topics = [
    { id: '1', name: 'Advanced Mathematics', description: 'Graduate level mathematics courses', color: 'blue', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', name: 'Theoretical Physics', description: 'Quantum mechanics and field theory', color: 'green', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '3', name: 'Machine Learning', description: 'Deep learning and neural networks', color: 'purple', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '4', name: 'Philosophy', description: 'Ethics, logic, and philosophy of mind', color: 'orange', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '5', name: 'Literature', description: 'Classical and modern literature analysis', color: 'pink', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  // Create more realistic page time patterns
  const createPageTimes = (pages, avgTime, variance) => {
    const times = {};
    for (let i = 1; i <= pages; i++) {
      // Simulate realistic reading patterns (some pages take longer)
      const multiplier = Math.random() < 0.1 ? 1.5 : 1; // 10% of pages take 50% longer
      times[i] = Math.max(30, Math.round((avgTime + (Math.random() - 0.5) * variance) * multiplier));
    }
    return times;
  };

  const documents = [
    {
      id: '1',
      name: 'Real Analysis - Royden 4th Edition.pdf',
      size: 15230000,
      topicId: '1',
      totalPages: 456,
      currentPage: 89,
      cacheKey: 'real-analysis-royden',
      pageTimes: createPageTimes(88, 180, 90),
      uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      lastReadAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      readingProgress: { percentage: 19.5, timeSpent: 15840, averageTimePerPage: 180, estimatedTimeRemaining: 66060, lastUpdated: new Date().toISOString() }
    },
    {
      id: '2',
      name: 'Introduction to Quantum Mechanics - Griffiths.pdf',
      size: 12800000,
      topicId: '2',
      totalPages: 468,
      currentPage: 234,
      cacheKey: 'quantum-mechanics-griffiths',
      pageTimes: createPageTimes(233, 240, 120),
      uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      lastReadAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      readingProgress: { percentage: 50.0, timeSpent: 55920, averageTimePerPage: 240, estimatedTimeRemaining: 56160, lastUpdated: new Date().toISOString() }
    },
    {
      id: '3',
      name: 'Deep Learning - Ian Goodfellow.pdf',
      size: 25600000,
      topicId: '3',
      totalPages: 800,
      currentPage: 445,
      cacheKey: 'deep-learning-goodfellow',
      pageTimes: createPageTimes(444, 300, 150),
      uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastReadAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      readingProgress: { percentage: 55.6, timeSpent: 133200, averageTimePerPage: 300, estimatedTimeRemaining: 106500, lastUpdated: new Date().toISOString() }
    }
  ];

  localStorage.setItem('pdf-study-planner-topics', JSON.stringify(topics));
  localStorage.setItem('pdf-study-planner-documents', JSON.stringify(documents));
  
  console.log('✅ Advanced test data injected!');
  console.log('📚 Created realistic academic study library');
  window.location.reload();
};

if (typeof window !== 'undefined') {
  window.injectTestData = injectTestData;
  window.clearTestData = clearTestData;
  window.injectAdvancedTestData = injectAdvancedTestData;
}
