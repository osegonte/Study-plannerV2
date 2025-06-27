// Storage utilities for PDF Study Planner
// Currently using localStorage, can be easily migrated to backend API

const STORAGE_KEYS = {
  TOPICS: 'pdf-study-planner-topics',
  DOCUMENTS: 'pdf-study-planner-documents',
  SETTINGS: 'pdf-study-planner-settings'
};

export const storage = {
  // Topics
  getTopics: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TOPICS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load topics:', error);
      return [];
    }
  },

  saveTopics: (topics) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
    } catch (error) {
      console.error('Failed to save topics:', error);
    }
  },

  // Documents
  getDocuments: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load documents:', error);
      return [];
    }
  },

  saveDocuments: (documents) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    } catch (error) {
      console.error('Failed to save documents:', error);
    }
  },

  // Settings
  getSettings: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  },

  saveSettings: (settings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  // Clear all data
  clearAll: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
};

// Data validation utilities
export const validateTopic = (topic) => {
  return (
    topic &&
    typeof topic.id === 'string' &&
    typeof topic.name === 'string' &&
    topic.name.trim().length > 0
  );
};

export const validateDocument = (document) => {
  return (
    document &&
    typeof document.id === 'string' &&
    typeof document.name === 'string' &&
    typeof document.topicId === 'string' &&
    document.name.trim().length > 0
  );
};

// Migration utility for future backend integration
export const exportData = () => {
  return {
    topics: storage.getTopics(),
    documents: storage.getDocuments(),
    settings: storage.getSettings(),
    exportedAt: new Date().toISOString()
  };
};

export const importData = (data) => {
  try {
    if (data.topics) storage.saveTopics(data.topics);
    if (data.documents) storage.saveDocuments(data.documents);
    if (data.settings) storage.saveSettings(data.settings);
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};
