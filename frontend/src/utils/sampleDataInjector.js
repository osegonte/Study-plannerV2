// Sample Data Injector for Quick Testing
export class SampleDataInjector {
  constructor() {
    this.sampleTopics = [
      {
        id: 'topic-1',
        name: 'Mathematics',
        description: 'Calculus, Algebra, and Statistics',
        color: 'blue',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        documents: []
      },
      {
        id: 'topic-2',
        name: 'Computer Science',
        description: 'Programming, Algorithms, Data Structures',
        color: 'green',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        documents: []
      },
      {
        id: 'topic-3',
        name: 'Physics',
        description: 'Quantum Mechanics and Thermodynamics',
        color: 'purple',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        documents: []
      }
    ];

    this.sampleDocuments = [
      {
        id: 'doc-1',
        name: 'Calculus Textbook - Chapter 1-5.pdf',
        size: 5242880,
        topicId: 'topic-1',
        totalPages: 120,
        currentPage: 15,
        pageTimes: {
          '1': 180, '2': 165, '3': 200, '4': 155, '5': 190,
          '6': 175, '7': 145, '8': 205, '9': 160, '10': 185,
          '11': 170, '12': 195, '13': 150, '14': 175, '15': 165
        },
        cacheKey: null,
        uploadedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        lastReadAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'doc-2',
        name: 'Data Structures and Algorithms.pdf',
        size: 3145728,
        topicId: 'topic-2',
        totalPages: 85,
        currentPage: 8,
        pageTimes: {
          '1': 220, '2': 195, '3': 240, '4': 185, '5': 210,
          '6': 205, '7': 175, '8': 225
        },
        cacheKey: null,
        uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        lastReadAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'doc-3',
        name: 'Quantum Physics Introduction.pdf',
        size: 2097152,
        topicId: 'topic-3',
        totalPages: 50,
        currentPage: 3,
        pageTimes: {
          '1': 300, '2': 280, '3': 320
        },
        cacheKey: null,
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastReadAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // Inject sample data for testing
  injectSampleData() {
    console.log('📚 Injecting sample data for testing...');
    
    try {
      // Save topics
      localStorage.setItem('pdf-study-planner-topics', JSON.stringify(this.sampleTopics));
      console.log('✅ Sample topics injected:', this.sampleTopics.length);
      
      // Save documents
      localStorage.setItem('pdf-study-planner-documents', JSON.stringify(this.sampleDocuments));
      console.log('✅ Sample documents injected:', this.sampleDocuments.length);
      
      // Create sample user if doesn't exist
      const existingUser = localStorage.getItem('pdf-study-planner-user');
      if (!existingUser) {
        const sampleUser = {
          id: 'sample-user',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        
        const sampleProfile = {
          userId: 'sample-user',
          displayName: 'Test User',
          school: 'Test University',
          major: 'Computer Science',
          semester: 'Fall 2024',
          preferences: {
            defaultReadingSpeed: 60,
            sessionReminders: true,
            darkMode: false,
            autoSave: true
          }
        };
        
        localStorage.setItem('pdf-study-planner-user', JSON.stringify(sampleUser));
        localStorage.setItem('pdf-study-planner-profile', JSON.stringify(sampleProfile));
        console.log('✅ Sample user profile created');
      }
      
      console.log('🎉 Sample data injection complete!');
      return true;
    } catch (error) {
      console.error('❌ Failed to inject sample data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData() {
    console.log('🧹 Clearing all app data...');
    
    const keys = [
      'pdf-study-planner-topics',
      'pdf-study-planner-documents',
      'pdf-study-planner-goals',
      'pdf-study-planner-user',
      'pdf-study-planner-profile'
    ];
    
    keys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('✅ All data cleared');
  }

  // Get current data status
  getDataStatus() {
    return {
      topics: JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]').length,
      documents: JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]').length,
      hasUser: !!localStorage.getItem('pdf-study-planner-user'),
      hasProfile: !!localStorage.getItem('pdf-study-planner-profile')
    };
  }
}

export const sampleDataInjector = new SampleDataInjector();

// Add to window for console access
if (typeof window !== 'undefined') {
  window.sampleDataInjector = sampleDataInjector;
  window.injectSampleData = () => sampleDataInjector.injectSampleData();
  window.clearAllData = () => sampleDataInjector.clearAllData();
  
  console.log('📚 Sample data tools loaded:');
  console.log('  - window.injectSampleData()');
  console.log('  - window.clearAllData()');
}
