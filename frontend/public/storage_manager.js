// Persistent Storage Manager for PDF Study Planner (Browser-compatible)
class PersistentStorageManager {
  constructor() {
    // Use browser-compatible path detection
    this.storageDir = this.getStorageDir();
    this.backupDir = this.storageDir + '/backups';
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
  }

  getStorageDir() {
    // Browser-compatible storage directory
    if (typeof window !== 'undefined') {
      return 'PDFStudyPlanner/storage';
    }
    return 'PDFStudyPlanner/storage';
  }

  // Save data to persistent file storage
  async saveToFile(filename, data) {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      const timestamp = new Date().toISOString();
      
      if (this.isElectron) {
        return await window.electronAPI.saveFile(filename, dataStr);
      } else {
        localStorage.setItem(filename, dataStr);
        console.log(`📝 Saved ${filename} to localStorage`);
        return true;
      }
    } catch (error) {
      console.error('Failed to save to persistent storage:', error);
      return false;
    }
  }

  // Load data from persistent storage
  async loadFromFile(filename) {
    try {
      if (this.isElectron) {
        return await window.electronAPI.loadFile(filename);
      } else {
        const data = localStorage.getItem(filename);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error('Failed to load from persistent storage:', error);
      return null;
    }
  }

  // Auto-backup all app data
  async backupAllData() {
    const timestamp = new Date().toISOString();
    const backupData = {
      topics: JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]'),
      documents: JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]'),
      goals: JSON.parse(localStorage.getItem('pdf-study-planner-goals') || '[]'),
      user: JSON.parse(localStorage.getItem('pdf-study-planner-user') || 'null'),
      profile: JSON.parse(localStorage.getItem('pdf-study-planner-profile') || 'null'),
      settings: JSON.parse(localStorage.getItem('pdf-study-planner-settings') || '{}'),
      backupTimestamp: timestamp
    };

    await this.saveToFile('full-backup', backupData);
    console.log('📦 Full backup created:', timestamp);
    return backupData;
  }

  // Initialize persistent storage
  async initialize() {
    console.log('🗄️ Initializing persistent storage...');
    console.log('✅ Persistent storage initialized');
    return true;
  }

  // Auto-save current data
  async autoSave() {
    try {
      const topics = JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]');
      const documents = JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]');
      
      await this.saveToFile('pdf-study-planner-topics', topics);
      await this.saveToFile('pdf-study-planner-documents', documents);
      
      console.log('💾 Auto-save completed:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }
}

// Export for use in the app
if (typeof window !== 'undefined') {
  window.persistentStorage = new PersistentStorageManager();
  window.persistentStorage.initialize();
  
  // Add global functions for easy access
  window.savePersistentData = () => window.persistentStorage.autoSave();
  window.backupAllData = () => window.persistentStorage.backupAllData();
  window.createBackup = () => window.persistentStorage.backupAllData();
}
