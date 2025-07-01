class PDFFileHandler {
  constructor() {
    this.fileCache = new Map();
    this.storageKey = 'pdf-study-planner-files';
    this.loadFromStorage();
  }

  // Save files to localStorage
  saveToStorage() {
    try {
      const cacheData = {};
      this.fileCache.forEach((value, key) => {
        cacheData[key] = {
          name: value.name,
          size: value.size,
          type: value.type,
          base64Data: value.base64Data,
          processedAt: value.processedAt
        };
      });
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
      console.log('💾 Files saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save files:', error);
    }
  }

  // Load files from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.fileCache.clear();
        
        Object.entries(cacheData).forEach(([key, value]) => {
          this.fileCache.set(key, value);
        });
        
        console.log(`📄 Loaded ${this.fileCache.size} files from storage`);
      }
    } catch (error) {
      console.error('❌ Failed to load files:', error);
    }
  }

  // Process and store a PDF file
  async processFile(file) {
    try {
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Invalid PDF file');
      }

      const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
      
      // Check if already cached
      if (this.fileCache.has(cacheKey)) {
        console.log('📄 File already cached:', cacheKey);
        return cacheKey;
      }

      console.log('📄 Processing PDF file:', file.name);
      
      // Convert to base64 for storage
      const base64Data = await this.fileToBase64(file);
      
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        base64Data: base64Data,
        processedAt: Date.now()
      };
      
      this.fileCache.set(cacheKey, fileData);
      this.saveToStorage();
      
      console.log('✅ File processed and cached:', cacheKey);
      return cacheKey;
      
    } catch (error) {
      console.error('❌ Error processing PDF file:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  // Convert file to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Get file data for viewing
  getFileForViewing(cacheKey) {
    const cached = this.fileCache.get(cacheKey);
    if (!cached) {
      console.log('📄 File not found in cache:', cacheKey);
      return null;
    }
    
    try {
      // Return the base64 data URL for viewing
      return cached.base64Data;
    } catch (error) {
      console.error('❌ Error retrieving file data:', error);
      return null;
    }
  }

  // Get file metadata
  getFileMetadata(cacheKey) {
    const cached = this.fileCache.get(cacheKey);
    return cached ? {
      name: cached.name,
      size: cached.size,
      type: cached.type,
      processedAt: cached.processedAt
    } : null;
  }

  // Check if file exists
  hasFile(cacheKey) {
    return this.fileCache.has(cacheKey);
  }

  // Remove file
  removeFile(cacheKey) {
    this.fileCache.delete(cacheKey);
    this.saveToStorage();
    console.log('🗑️ File removed:', cacheKey);
  }

  // Clear all files
  clearCache() {
    this.fileCache.clear();
    localStorage.removeItem(this.storageKey);
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

// Export singleton instance
export const pdfFileHandler = new PDFFileHandler();
