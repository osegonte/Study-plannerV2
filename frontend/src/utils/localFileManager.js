// Enhanced Local File Manager with ArrayBuffer fix
export class LocalFileManager {
  constructor() {
    this.baseDir = this.getStudyMaterialsPath();
    this.fileCache = new Map(); // Cache for file data
  }

  getStudyMaterialsPath() {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
    return `${homeDir}/StudyMaterials`;
  }

  // Fixed: Create a stable copy of ArrayBuffer that won't get detached
  async createStableArrayBuffer(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Create a copy to prevent detachment
      const stableCopy = new ArrayBuffer(arrayBuffer.byteLength);
      const stableView = new Uint8Array(stableCopy);
      const originalView = new Uint8Array(arrayBuffer);
      stableView.set(originalView);
      
      return stableCopy;
    } catch (error) {
      console.error('Failed to create stable ArrayBuffer:', error);
      throw error;
    }
  }

  // Enhanced file processing with proper ArrayBuffer handling
  async processFileForViewing(file) {
    try {
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file provided');
      }

      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are supported');
      }

      const cacheKey = `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;
      
      // Check if already cached
      if (this.fileCache.has(cacheKey)) {
        return this.fileCache.get(cacheKey);
      }

      console.log('📄 Processing PDF file for viewing:', file.name);
      
      // Create stable ArrayBuffer copy
      const stableArrayBuffer = await this.createStableArrayBuffer(file);
      
      // Store in cache with metadata
      const fileData = {
        arrayBuffer: stableArrayBuffer,
        name: file.name,
        size: file.size,
        type: file.type,
        processedAt: Date.now(),
        cacheKey
      };
      
      this.fileCache.set(cacheKey, fileData);
      
      console.log('✅ PDF processed successfully for viewing');
      return fileData;
      
    } catch (error) {
      console.error('❌ Error processing PDF file:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  // Get file data for react-pdf (returns a copy to prevent detachment)
  getFileDataForPDF(cacheKey) {
    const cached = this.fileCache.get(cacheKey);
    if (!cached) {
      console.error('❌ File not found in cache:', cacheKey);
      return null;
    }
    
    try {
      // Return a fresh copy of the ArrayBuffer to prevent detachment
      const originalBuffer = cached.arrayBuffer;
      const copyBuffer = new ArrayBuffer(originalBuffer.byteLength);
      const copyView = new Uint8Array(copyBuffer);
      const originalView = new Uint8Array(originalBuffer);
      copyView.set(originalView);
      
      return copyBuffer;
    } catch (error) {
      console.error('❌ Error creating ArrayBuffer copy:', error);
      return null;
    }
  }

  // Original folder management methods (unchanged)
  async createTopicFolder(topic) {
    const folderName = this.sanitizeFolderName(topic.name);
    const folderPath = `${this.baseDir}/${folderName}`;

    try {
      this.storePathForManualCreation(folderPath);
      this.updateTopicWithFolderPath(topic.id, folderPath);
      
      console.log(`📁 Topic folder planned: ${folderPath}`);
      return folderPath;
    } catch (error) {
      console.error('Failed to create topic folder:', error);
      throw new Error(`Failed to create folder for topic "${topic.name}"`);
    }
  }

  sanitizeFolderName(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^\w\-_.]/g, '')
      .substring(0, 100)
      .replace(/^\.+|\.+$/g, '');
  }

  storePathForManualCreation(folderPath) {
    const pendingFolders = JSON.parse(localStorage.getItem('pendingFolderCreation') || '[]');
    if (!pendingFolders.includes(folderPath)) {
      pendingFolders.push(folderPath);
      localStorage.setItem('pendingFolderCreation', JSON.stringify(pendingFolders));
    }
  }

  updateTopicWithFolderPath(topicId, folderPath) {
    const topics = JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]');
    const updatedTopics = topics.map(topic => 
      topic.id === topicId 
        ? { ...topic, folderPath, folderCreatedAt: new Date().toISOString() }
        : topic
    );
    localStorage.setItem('pdf-study-planner-topics', JSON.stringify(updatedTopics));
  }

  getPendingFolders() {
    return JSON.parse(localStorage.getItem('pendingFolderCreation') || '[]');
  }

  generateBashScript() {
    const topics = JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]');
    
    let script = '#!/bin/bash\n\n';
    script += '# PDF Study Planner - Folder Creation Script\n\n';
    script += `BASE_DIR="${this.baseDir}"\n\n`;
    script += 'echo "Creating study material folders..."\n\n';
    script += 'mkdir -p "$BASE_DIR"\n\n';
    
    topics.forEach(topic => {
      const folderName = this.sanitizeFolderName(topic.name);
      script += `echo "Creating folder: ${topic.name}"\n`;
      script += `mkdir -p "$BASE_DIR/${folderName}"\n\n`;
    });
    
    script += 'echo "✅ All folders created successfully!"\n';
    return script;
  }

  downloadFolderCreationScript() {
    const script = this.generateBashScript();
    const blob = new Blob([script], { type: 'application/x-sh' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'create_study_folders.sh';
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // Clear cache when needed
  clearCache() {
    this.fileCache.clear();
    console.log('🧹 File cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    const files = Array.from(this.fileCache.values());
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    return {
      fileCount: this.fileCache.size,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  }
}

export const localFileManager = new LocalFileManager();
