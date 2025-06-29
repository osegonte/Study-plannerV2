// Test Data Injector for PDF Study Planner
// Use this to populate the app with sample data for testing

export const TestDataInjector = {
  // Sample topics data
  sampleTopics: [
    {
      id: '1',
      name: 'Mathematics',
      description: 'Calculus, Algebra, and Statistics',
      color: 'blue',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updatedAt: new Date().toISOString(),
      documents: [],
      folderPath: '/Users/osegonte/StudyMaterials/Mathematics',
      folderCreatedAt: new Date().toISOString(),
      examDate: {
        examDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        studyHoursPerDay: 3,
        priority: 'high',
        setAt: new Date().toISOString()
      }
    },
    {
      id: '2',
      name: 'Physics',
      description: 'Quantum Mechanics and Thermodynamics',
      color: 'green',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      updatedAt: new Date().toISOString(),
      documents: [],
      folderPath: '/Users/osegonte/StudyMaterials/Physics',
      folderCreatedAt: new Date().toISOString(),
      examDate: {
        examDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        studyHoursPerDay: 2.5,
        priority: 'medium',
        setAt: new Date().toISOString()
      }
    },
    {
      id: '3',
      name: 'History',
      description: 'World War 2 and Modern History',
      color: 'purple',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      updatedAt: new Date().toISOString(),
      documents: [],
      folderPath: '/Users/osegonte/StudyMaterials/History',
      folderCreatedAt: new Date().toISOString(),
      examDate: {
        examDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 4 weeks from now
        studyHoursPerDay: 2,
        priority: 'low',
        setAt: new Date().toISOString()
      }
    },
    {
      id: '4',
      name: 'Computer Science',
      description: 'Algorithms and Data Structures',
      color: 'orange',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date().toISOString(),
      documents: [],
      folderPath: '/Users/osegonte/StudyMaterials/Computer_Science',
      folderCreatedAt: new Date().toISOString(),
      examDate: {
        examDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 5 weeks from now
        studyHoursPerDay: 4,
        priority: 'high',
        setAt: new Date().toISOString()
      }
    },
    {
      id: '5',
      name: 'Literature',
      description: 'Classical and Modern Literature',
      color: 'pink',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date().toISOString(),
      documents: [],
      folderPath: null, // No folder created yet
      folderCreatedAt: null
    }
  ],

  // Sample documents data
  sampleDocuments: [
    {
      id: '1',
      name: 'Calculus Textbook - Chapter 1-5.pdf',
      size: 5242880, // 5MB
      topicId: '1', // Mathematics
      totalPages: 120,
      currentPage: 25,
      pageTimes: {
        '1': 180, '2': 165, '3': 200, '4': 155, '5': 190,
        '6': 175, '7': 145, '8': 205, '9': 160, '10': 185,
        '11': 170, '12': 195, '13': 150, '14': 175, '15': 165,
        '16': 180, '17': 155, '18': 200, '19': 145, '20': 190,
        '21': 175, '22': 160, '23': 185, '24': 170, '25': 195
      },
      cacheKey: null,
      uploadedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      lastReadAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
    },
    {
      id: '2',
      name: 'Quantum Mechanics Study Guide.pdf',
      size: 3145728, // 3MB
      topicId: '2', // Physics
      totalPages: 85,
      currentPage: 15,
      pageTimes: {
        '1': 220, '2': 195, '3': 240, '4': 185, '5': 210,
        '6': 205, '7': 175, '8': 225, '9': 190, '10': 215,
        '11': 200, '12': 235, '13': 180, '14': 195, '15': 220
      },
      cacheKey: null,
      uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      lastReadAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
    },
    {
      id: '3',
      name: 'World War 2 Timeline and Events.pdf',
      size: 2097152, // 2MB
      topicId: '3', // History
      totalPages: 50,
      currentPage: 8,
      pageTimes: {
        '1': 300, '2': 280, '3': 320, '4': 265, '5': 290,
        '6': 275, '7': 310, '8': 285
      },
      cacheKey: null,
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastReadAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
    },
    {
      id: '4',
      name: 'Algorithms and Complexity Theory.pdf',
      size: 7340032, // 7MB
      topicId: '4', // Computer Science
      totalPages: 200,
      currentPage: 45,
      pageTimes: {
        '1': 240, '2': 220, '3': 260, '4': 205, '5': 235,
        // Add more realistic page times...
        '6': 215, '7': 255, '8': 195, '9': 225, '10': 245,
        '11': 210, '12': 250, '13': 200, '14': 230, '15': 240,
        '16': 220, '17': 265, '18': 185, '19': 215, '20': 235,
        '21': 225, '22': 255, '23': 190, '24': 205, '25': 245,
        '26': 210, '27': 230, '28': 195, '29': 220, '30': 250,
        '31': 215, '32': 240, '33': 205, '34': 225, '35': 235,
        '36': 200, '37': 260, '38': 180, '39': 210, '40': 245,
        '41': 225, '42': 255, '43': 195, '44': 215, '45': 230
      },
      cacheKey: null,
      uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastReadAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
    },
    {
      id: '5',
      name: 'Shakespeare Complete Works.pdf',
      size: 4194304, // 4MB
      topicId: '5', // Literature
      totalPages: 150,
      currentPage: 1,
      pageTimes: {},
      cacheKey: null,
      uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      lastReadAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    }
  ],

  // Sample goals data
  sampleGoals: [
    {
      id: '1',
      title: 'Read 30 minutes daily',
      type: 'daily_time',
      target: 30,
      description: 'Consistent daily reading habit',
      deadline: null,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false
    },
    {
      id: '2',
      title: 'Complete Mathematics before exam',
      type: 'complete_document',
      target: 1,
      description: 'Finish calculus textbook',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false
    },
    {
      id: '3',
      title: 'Read 20 pages per day',
      type: 'pages_per_day',
      target: 20,
      description: 'Maintain steady reading pace',
      deadline: null,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false
    }
  ],

  // Inject all test data
  injectAllTestData() {
    console.log('🧪 Injecting test data...');

    // Inject topics
    localStorage.setItem('pdf-study-planner-topics', JSON.stringify(this.sampleTopics));
    console.log('✅ Injected sample topics');

    // Inject documents
    localStorage.setItem('pdf-study-planner-documents', JSON.stringify(this.sampleDocuments));
    console.log('✅ Injected sample documents');

    // Inject goals
    localStorage.setItem('pdf-study-planner-goals', JSON.stringify(this.sampleGoals));
    console.log('✅ Injected sample goals');

    // Create sample user
    const sampleUser = {
      id: 'sample-user-1',
      username: 'studymaster',
      email: 'study@example.com',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const sampleProfile = {
      userId: 'sample-user-1',
      displayName: 'Study Master',
      school: 'University of Learning',
      major: 'Computer Science',
      semester: 'Fall 2024',
      studyGoals: 'Graduate with honors',
      preferences: {
        defaultReadingSpeed: 60,
        sessionReminders: true,
        darkMode: false,
        autoSave: true
      }
    };

    localStorage.setItem('pdf-study-planner-user', JSON.stringify(sampleUser));
    localStorage.setItem('pdf-study-planner-profile', JSON.stringify(sampleProfile));
    console.log('✅ Injected sample user and profile');

    // Add some pending folders for demonstration
    const pendingFolders = [
      '/Users/osegonte/StudyMaterials/Literature',
      '/Users/osegonte/StudyMaterials/Language_Learning'
    ];
    localStorage.setItem('pendingFolderCreation', JSON.stringify(pendingFolders));
    console.log('✅ Added pending folders for demonstration');

    console.log('🎉 All test data injected successfully!');
    
    return {
      topics: this.sampleTopics.length,
      documents: this.sampleDocuments.length,
      goals: this.sampleGoals.length,
      user: true
    };
  },

  // Clear all test data
  clearAllTestData() {
    console.log('🧹 Clearing all test data...');
    
    const keys = [
      'pdf-study-planner-topics',
      'pdf-study-planner-documents',
      'pdf-study-planner-goals',
      'pdf-study-planner-user',
      'pdf-study-planner-profile',
      'pendingFolderCreation',
      'pdf-study-planner-auto-backup',
      'pdf-study-planner-last-backup'
    ];

    keys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('✅ All test data cleared');
  },

  // Inject minimal test data (just a few items)
  injectMinimalTestData() {
    console.log('🧪 Injecting minimal test data...');

    // Just one topic and document
    const minimalTopics = [this.sampleTopics[0]];
    const minimalDocuments = [this.sampleDocuments[0]];
    const minimalGoals = [this.sampleGoals[0]];

    localStorage.setItem('pdf-study-planner-topics', JSON.stringify(minimalTopics));
    localStorage.setItem('pdf-study-planner-documents', JSON.stringify(minimalDocuments));
    localStorage.setItem('pdf-study-planner-goals', JSON.stringify(minimalGoals));

    console.log('✅ Minimal test data injected');
  }
};

// Auto-inject when imported (can be disabled)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🧪 Test data injector loaded for localhost');
  
  // Add global functions for easy access in browser console
  window.injectTestData = () => TestDataInjector.injectAllTestData();
  window.clearTestData = () => TestDataInjector.clearAllTestData();
  window.injectMinimalData = () => TestDataInjector.injectMinimalTestData();
  
  console.log('💡 Available commands:');
  console.log('  - window.injectTestData() - Add full test data');
  console.log('  - window.clearTestData() - Clear all data');
  console.log('  - window.injectMinimalData() - Add minimal test data');
}

export default TestDataInjector;
