// Enhanced File Management System
// frontend/src/utils/fileManager.js

export class FileManager {
  constructor(userId) {
    this.userId = userId;
    this.baseKey = `pdf-study-planner-${userId}`;
  }

  // Generate organized file metadata
  createFileMetadata(file, topicId, additionalData = {}) {
    const fileSize = this.formatFileSize(file.size);
    const fileType = file.type;
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();

    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalName: fileName,
      displayName: additionalData.customName || fileName.replace(/\.[^/.]+$/, ""),
      size: file.size,
      formattedSize: fileSize,
      type: fileType,
      extension: fileExtension,
      topicId,
      uploadedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      
      // Academic organization
      course: additionalData.course || '',
      professor: additionalData.professor || '',
      semester: additionalData.semester || '',
      chapter: additionalData.chapter || '',
      assignment: additionalData.assignment || '',
      
      // Reading progress
      totalPages: 0,
      currentPage: 1,
      bookmarks: [],
      notes: [],
      highlights: [],
      
      // Time tracking
      pageTimes: {},
      totalReadingTime: 0,
      sessions: [],
      
      // File organization
      tags: additionalData.tags || [],
      difficulty: additionalData.difficulty || 'medium', // easy, medium, hard
      priority: additionalData.priority || 'normal', // low, normal, high, urgent
      
      // Study status
      status: 'not-started', // not-started, in-progress, completed, on-hold
      completionDate: null,
      
      // File integrity
      checksum: null,
      version: 1,
      isActive: true
    };
  }

  // Enhanced topic creation with academic structure
  createAcademicTopic(topicData) {
    return {
      id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: topicData.name.trim(),
      description: topicData.description?.trim() || '',
      color: topicData.color || 'blue',
      
      // Academic information
      courseCode: topicData.courseCode || '',
      courseName: topicData.courseName || '',
      professor: topicData.professor || '',
      semester: topicData.semester || '',
      credits: topicData.credits || 0,
      
      // Organization
      type: topicData.type || 'course', // course, research, personal, exam-prep
      difficulty: topicData.difficulty || 'medium',
      
      // Goals and deadlines
      studyGoals: {
        targetHours: topicData.targetHours || 0,
        weeklyHours: topicData.weeklyHours || 0,
        deadline: topicData.deadline || null,
        examDate: topicData.examDate || null
      },
      
      // Statistics
      statistics: {
        totalDocuments: 0,
        totalPages: 0,
        completedDocuments: 0,
        totalStudyTime: 0,
        averageSessionLength: 0,
        readingSpeed: 0
      },
      
      // Metadata
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: this.userId,
      isArchived: false
    };
  }

  // File validation for academic PDFs
  validatePDFFile(file) {
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    const allowedTypes = ['application/pdf'];
    
    const errors = [];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('Only PDF files are allowed');
    }
    
    if (file.size > maxSize) {
      errors.push('File size must be less than 100MB');
    }
    
    if (file.size === 0) {
      errors.push('File appears to be empty');
    }
    
    // Check for potentially problematic filenames
    const problematicChars = /[<>:"/\\|?*]/;
    if (problematicChars.test(file.name)) {
      errors.push('Filename contains invalid characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Create study session record
  createStudySession(documentId, sessionData) {
    return {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      userId: this.userId,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      duration: sessionData.duration,
      pagesRead: sessionData.pagesRead,
      startPage: sessionData.startPage,
      endPage: sessionData.endPage,
      notes: sessionData.notes || '',
      mood: sessionData.mood || 'neutral', // great, good, neutral, poor, terrible
      focus: sessionData.focus || 'medium', // high, medium, low
      comprehension: sessionData.comprehension || 'medium', // high, medium, low
      environment: sessionData.environment || 'home', // home, library, cafe, other
      createdAt: new Date().toISOString()
    };
  }

  // Enhanced storage with user isolation
  saveUserData(key, data) {
    try {
      const userKey = `${this.baseKey}-${key}`;
      localStorage.setItem(userKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      return false;
    }
  }

  loadUserData(key, defaultValue = null) {
    try {
      const userKey = `${this.baseKey}-${key}`;
      const data = localStorage.getItem(userKey);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }

  // Export user data for backup
  exportUserData() {
    const userData = {
      user: JSON.parse(localStorage.getItem('pdf-study-planner-user') || '{}'),
      profile: JSON.parse(localStorage.getItem('pdf-study-planner-profile') || '{}'),
      topics: this.loadUserData('topics', []),
      documents: this.loadUserData('documents', []),
      goals: this.loadUserData('goals', []),
      sessions: this.loadUserData('sessions', []),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return userData;
  }

  // Import user data
  importUserData(data) {
    try {
      if (data.topics) this.saveUserData('topics', data.topics);
      if (data.documents) this.saveUserData('documents', data.documents);
      if (data.goals) this.saveUserData('goals', data.goals);
      if (data.sessions) this.saveUserData('sessions', data.sessions);
      
      return { success: true, message: 'Data imported successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to import data', error };
    }
  }

  // Utility functions
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateFileHash(file) {
    // Simple hash based on file properties
    const str = `${file.name}-${file.size}-${file.lastModified}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Clean up old or unused data
  cleanupUserData() {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // Keep data for 6 months
    
    const sessions = this.loadUserData('sessions', []);
    const activeSessions = sessions.filter(session => 
      new Date(session.createdAt) > cutoffDate
    );
    
    this.saveUserData('sessions', activeSessions);
    
    return {
      sessionsRemoved: sessions.length - activeSessions.length,
      cutoffDate: cutoffDate.toISOString()
    };
  }
}