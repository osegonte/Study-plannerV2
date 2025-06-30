// Persistent Storage Manager for PDF Study Planner
class PersistentStorageManager {
  constructor() {
    this.storageDir = process.env.HOME + '/PDFStudyPlanner/storage';
    this.backupDir = process.env.HOME + '/PDFStudyPlanner/backups';
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
  }

  // Save data to persistent file storage
  async saveToFile(filename, data) {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      const timestamp = new Date().toISOString();
      
      if (this.isElectron) {
        // Use Electron's file system API
        return await window.electronAPI.saveFile(filename, dataStr);
      } else {
        // Use Web File System API (if available) or fallback to localStorage + backup
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        // Save to localStorage as primary
        localStorage.setItem(filename, dataStr);
        
        // Create downloadable backup
        this.createBackupDownload(filename, dataStr);
        
        console.log(`📝 Saved ${filename} to localStorage and created backup`);
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
        // Load from localStorage
        const data = localStorage.getItem(filename);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      console.error('Failed to load from persistent storage:', error);
      return null;
    }
  }

  // Create downloadable backup
  createBackupDownload(filename, data) {
    try {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Auto-download backup file
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-backup-${timestamp}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`💾 Created backup: ${a.download}`);
    } catch (error) {
      console.error('Failed to create backup:', error);
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

    // Save to persistent storage
    await this.saveToFile('full-backup', backupData);
    
    // Also create downloadable backup
    this.createBackupDownload('full-app-backup', JSON.stringify(backupData, null, 2));
    
    console.log('📦 Full backup created:', timestamp);
    return backupData;
  }

  // Restore from backup
  async restoreFromBackup(backupData) {
    try {
      if (backupData.topics) {
        localStorage.setItem('pdf-study-planner-topics', JSON.stringify(backupData.topics));
        await this.saveToFile('pdf-study-planner-topics', backupData.topics);
      }
      
      if (backupData.documents) {
        localStorage.setItem('pdf-study-planner-documents', JSON.stringify(backupData.documents));
        await this.saveToFile('pdf-study-planner-documents', backupData.documents);
      }
      
      if (backupData.goals) {
        localStorage.setItem('pdf-study-planner-goals', JSON.stringify(backupData.goals));
        await this.saveToFile('pdf-study-planner-goals', backupData.goals);
      }
      
      if (backupData.user) {
        localStorage.setItem('pdf-study-planner-user', JSON.stringify(backupData.user));
        await this.saveToFile('pdf-study-planner-user', backupData.user);
      }
      
      if (backupData.profile) {
        localStorage.setItem('pdf-study-planner-profile', JSON.stringify(backupData.profile));
        await this.saveToFile('pdf-study-planner-profile', backupData.profile);
      }
      
      console.log('✅ Data restored from backup');
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }

  // Initialize persistent storage
  async initialize() {
    console.log('🗄️ Initializing persistent storage...');
    
    // Try to load existing data from persistent storage
    const topics = await this.loadFromFile('pdf-study-planner-topics');
    const documents = await this.loadFromFile('pdf-study-planner-documents');
    const goals = await this.loadFromFile('pdf-study-planner-goals');
    const user = await this.loadFromFile('pdf-study-planner-user');
    const profile = await this.loadFromFile('pdf-study-planner-profile');
    
    // Restore to localStorage if data exists
    if (topics) localStorage.setItem('pdf-study-planner-topics', JSON.stringify(topics));
    if (documents) localStorage.setItem('pdf-study-planner-documents', JSON.stringify(documents));
    if (goals) localStorage.setItem('pdf-study-planner-goals', JSON.stringify(goals));
    if (user) localStorage.setItem('pdf-study-planner-user', JSON.stringify(user));
    if (profile) localStorage.setItem('pdf-study-planner-profile', JSON.stringify(profile));
    
    console.log('✅ Persistent storage initialized');
    
    // Set up auto-backup every 5 minutes
    setInterval(() => {
      this.autoSave();
    }, 5 * 60 * 1000);
    
    return true;
  }

  // Auto-save current data
  async autoSave() {
    try {
      const topics = JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]');
      const documents = JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]');
      const goals = JSON.parse(localStorage.getItem('pdf-study-planner-goals') || '[]');
      const user = JSON.parse(localStorage.getItem('pdf-study-planner-user') || 'null');
      const profile = JSON.parse(localStorage.getItem('pdf-study-planner-profile') || 'null');
      
      await this.saveToFile('pdf-study-planner-topics', topics);
      await this.saveToFile('pdf-study-planner-documents', documents);
      await this.saveToFile('pdf-study-planner-goals', goals);
      if (user) await this.saveToFile('pdf-study-planner-user', user);
      if (profile) await this.saveToFile('pdf-study-planner-profile', profile);
      
      console.log('💾 Auto-save completed:', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }
}

// Export for use in the app
if (typeof window !== 'undefined') {
  window.persistentStorage = new PersistentStorageManager();
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.persistentStorage.initialize();
    });
  } else {
    window.persistentStorage.initialize();
  }
  
  // Add global functions for easy access
  window.savePersistentData = () => window.persistentStorage.autoSave();
  window.backupAllData = () => window.persistentStorage.backupAllData();
  window.createBackup = () => window.persistentStorage.backupAllData();
}
