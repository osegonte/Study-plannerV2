// Enhanced PDF File Handler with Buffer Detachment Fix
export class PDFFileHandler {
  constructor() {
    this.fileCache = new Map();
    this.bufferPool = new Map(); // Pool to keep references
  }

  /**
   * Convert File to stable ArrayBuffer without detachment
   * @param {File} file - The PDF file
   * @returns {Promise<string>} - Returns cache key for the file
   */
  async processFile(file) {
    try {
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Invalid PDF file');
      }

      const cacheKey = `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;
      
      if (this.fileCache.has(cacheKey)) {
        console.log('📄 File already cached:', cacheKey);
        return cacheKey;
      }

      console.log('📄 Processing PDF file:', file.name);
      
      // Create stable ArrayBuffer that won't get detached
      const stableBuffer = await this.createStableArrayBuffer(file);
      
      // Store multiple references to prevent garbage collection
      const fileData = {
        arrayBuffer: stableBuffer,
        backupBuffer: stableBuffer.slice(0), // Create backup copy
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        },
        processedAt: Date.now()
      };
      
      this.fileCache.set(cacheKey, fileData);
      this.bufferPool.set(cacheKey, stableBuffer); // Keep extra reference
      
      console.log('✅ File processed and cached with stable buffer:', cacheKey);
      return cacheKey;
      
    } catch (error) {
      console.error('❌ Error processing PDF file:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  /**
   * Create stable ArrayBuffer that resists detachment
   * @param {File} file - The file to convert
   * @returns {Promise<ArrayBuffer>} - Stable ArrayBuffer
   */
  async createStableArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const originalBuffer = event.target.result;
          
          if (!(originalBuffer instanceof ArrayBuffer)) {
            reject(new Error('Failed to create ArrayBuffer'));
            return;
          }
          
          // Create a stable copy that won't be detached
          const stableBuffer = new ArrayBuffer(originalBuffer.byteLength);
          const stableView = new Uint8Array(stableBuffer);
          const originalView = new Uint8Array(originalBuffer);
          
          // Copy data to stable buffer
          stableView.set(originalView);
          
          // Verify the copy
          if (stableBuffer.byteLength !== originalBuffer.byteLength) {
            reject(new Error('Buffer copy verification failed'));
            return;
          }
          
          resolve(stableBuffer);
          
        } catch (error) {
          reject(new Error(`ArrayBuffer creation failed: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error: ' + reader.error?.message));
      };
      
      reader.onabort = () => {
        reject(new Error('FileReader aborted'));
      };
      
      // Read as ArrayBuffer
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Get file data for react-pdf with detachment protection
   * @param {string} cacheKey - The cache key for the file
   * @returns {ArrayBuffer|null} - Safe ArrayBuffer for react-pdf
   */
  getFileForPDF(cacheKey) {
    const cached = this.fileCache.get(cacheKey);
    if (!cached) {
      console.error('❌ File not found in cache:', cacheKey);
      return null;
    }
    
    try {
      // Check if original buffer is still valid
      if (cached.arrayBuffer.byteLength === 0) {
        console.warn('⚠️ Original buffer detached, using backup');
        // Use backup buffer
        if (cached.backupBuffer && cached.backupBuffer.byteLength > 0) {
          return cached.backupBuffer.slice(0);
        } else {
          console.error('❌ Backup buffer also invalid');
          return null;
        }
      }
      
      // Return a fresh copy to prevent detachment
      return cached.arrayBuffer.slice(0);
      
    } catch (error) {
      console.error('❌ Error retrieving file data:', error);
      
      // Try backup buffer
      try {
        if (cached.backupBuffer) {
          console.log('🔄 Attempting backup buffer recovery');
          return cached.backupBuffer.slice(0);
        }
      } catch (backupError) {
        console.error('❌ Backup buffer also failed:', backupError);
      }
      
      return null;
    }
  }

  /**
   * Create a new stable reference for react-pdf
   * @param {string} cacheKey - The cache key
   * @returns {ArrayBuffer|Uint8Array|null} - Stable data for PDF.js
   */
  getStableFileData(cacheKey) {
    const cached = this.fileCache.get(cacheKey);
    if (!cached) {
      return null;
    }
    
    try {
      // Create Uint8Array which is more stable for PDF.js
      const buffer = this.getFileForPDF(cacheKey);
      if (buffer) {
        return new Uint8Array(buffer);
      }
      return null;
    } catch (error) {
      console.error('❌ Error creating stable file data:', error);
      return null;
    }
  }

  /**
   * Get file metadata
   * @param {string} cacheKey - The cache key for the file
   * @returns {Object|null} - File metadata
   */
  getFileMetadata(cacheKey) {
    const cached = this.fileCache.get(cacheKey);
    return cached ? cached.metadata : null;
  }

  /**
   * Check if file is cached and valid
   * @param {string} cacheKey - The cache key to check
   * @returns {boolean} - Whether file exists and is valid
   */
  hasFile(cacheKey) {
    const cached = this.fileCache.get(cacheKey);
    if (!cached) return false;
    
    try {
      // Verify buffer is still valid
      return cached.arrayBuffer.byteLength > 0 || 
             (cached.backupBuffer && cached.backupBuffer.byteLength > 0);
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove file from cache
   * @param {string} cacheKey - The cache key to remove
   */
  removeFile(cacheKey) {
    this.fileCache.delete(cacheKey);
    this.bufferPool.delete(cacheKey);
    console.log('🗑️ File removed from cache:', cacheKey);
  }

  /**
   * Clear all cached files
   */
  clearCache() {
    this.fileCache.clear();
    this.bufferPool.clear();
    console.log('🧹 File cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    const files = Array.from(this.fileCache.values());
    const totalSize = files.reduce((sum, file) => sum + file.metadata.size, 0);
    
    return {
      fileCount: this.fileCache.size,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      validFiles: files.filter(f => f.arrayBuffer.byteLength > 0).length
    };
  }

  /**
   * Create a data URL for download purposes
   * @param {string} cacheKey - The cache key for the file
   * @returns {string|null} - Data URL
   */
  createDataURL(cacheKey) {
    try {
      const arrayBuffer = this.getFileForPDF(cacheKey);
      if (!arrayBuffer) return null;
      
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('❌ Error creating data URL:', error);
      return null;
    }
  }

  /**
   * Refresh a file's buffer to prevent detachment
   * @param {string} cacheKey - The cache key
   * @param {File} originalFile - The original file (if available)
   */
  async refreshBuffer(cacheKey, originalFile = null) {
    try {
      if (originalFile) {
        console.log('🔄 Refreshing buffer from original file');
        await this.processFile(originalFile);
      } else {
        const cached = this.fileCache.get(cacheKey);
        if (cached && cached.backupBuffer) {
          console.log('🔄 Refreshing buffer from backup');
          cached.arrayBuffer = cached.backupBuffer.slice(0);
        }
      }
    } catch (error) {
      console.error('❌ Failed to refresh buffer:', error);
    }
  }
}

// Create singleton instance
export const pdfFileHandler = new PDFFileHandler();

// Enhanced error handling for PDF loading
export const PDFErrorHandler = {
  getErrorMessage(error) {
    if (error?.message?.includes('Buffer is already detached') || 
        error?.message?.includes('detached ArrayBuffer')) {
      return 'File data was corrupted during upload. Please try uploading the PDF again.';
    }
    if (error?.message?.includes('ArrayBuffer')) {
      return 'File processing error. Please re-upload the PDF file.';
    }
    if (error?.message?.includes('Invalid PDF')) {
      return 'This file is not a valid PDF document.';
    }
    if (error?.message?.includes('encrypted')) {
      return 'This PDF is password protected and cannot be opened.';
    }
    if (error?.message?.includes('corrupted')) {
      return 'This PDF file appears to be corrupted.';
    }
    return 'Failed to load PDF. Please try again or use a different file.';
  },

  shouldRetry(error) {
    // Retry for buffer detachment errors
    return error?.message?.includes('Buffer is already detached') ||
           error?.message?.includes('detached ArrayBuffer') ||
           error?.message?.includes('ArrayBuffer');
  }
};
