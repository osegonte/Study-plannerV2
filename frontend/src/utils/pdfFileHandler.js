// utils/pdfFileHandler.js
export class PDFFileHandler {
  constructor() {
    this.fileCache = new Map(); // In-memory cache for current session
  }

  /**
   * Convert File to ArrayBuffer and store it properly
   * @param {File} file - The PDF file
   * @returns {Promise<string>} - Returns cache key for the file
   */
  async processFile(file) {
    try {
      // Validate file
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Invalid PDF file');
      }

      // Generate unique cache key
      const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
      
      // Check if already processed
      if (this.fileCache.has(cacheKey)) {
        console.log('📄 File already cached:', cacheKey);
        return cacheKey;
      }

      console.log('📄 Processing PDF file:', file.name);
      
      // Convert File to ArrayBuffer
      const arrayBuffer = await this.fileToArrayBuffer(file);
      
      // Store in cache with metadata
      this.fileCache.set(cacheKey, {
        arrayBuffer: arrayBuffer,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        },
        processedAt: Date.now()
      });

      console.log('✅ File processed and cached:', cacheKey);
      return cacheKey;
      
    } catch (error) {
      console.error('❌ Error processing PDF file:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  /**
   * Convert File to ArrayBuffer using FileReader
   * @param {File} file - The file to convert
   * @returns {Promise<ArrayBuffer>} - Promise that resolves to ArrayBuffer
   */
  fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        if (arrayBuffer instanceof ArrayBuffer) {
          resolve(arrayBuffer);
        } else {
          reject(new Error('Failed to convert file to ArrayBuffer'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error: ' + reader.error?.message));
      };
      
      reader.onabort = () => {
        reject(new Error('FileReader aborted'));
      };
      
      // Read as ArrayBuffer (most reliable for PDF.js)
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Get file data for react-pdf
   * @param {string} cacheKey - The cache key for the file
   * @returns {ArrayBuffer|null} - ArrayBuffer for react-pdf
   */
  getFileForPDF(cacheKey) {
    const cached = this.fileCache.get(cacheKey);
    if (!cached) {
      console.error('❌ File not found in cache:', cacheKey);
      return null;
    }
    
    // Return a copy of the ArrayBuffer to prevent detachment
    return cached.arrayBuffer.slice();
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
   * Check if file is cached
   * @param {string} cacheKey - The cache key to check
   * @returns {boolean} - Whether file is cached
   */
  hasFile(cacheKey) {
    return this.fileCache.has(cacheKey);
  }

  /**
   * Remove file from cache
   * @param {string} cacheKey - The cache key to remove
   */
  removeFile(cacheKey) {
    this.fileCache.delete(cacheKey);
    console.log('🗑️ File removed from cache:', cacheKey);
  }

  /**
   * Clear all cached files
   */
  clearCache() {
    this.fileCache.clear();
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
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Create a data URL for download purposes
   * @param {string} cacheKey - The cache key for the file
   * @returns {string|null} - Data URL
   */
  createDataURL(cacheKey) {
    const cached = this.fileCache.get(cacheKey);
    if (!cached) return null;
    
    const blob = new Blob([cached.arrayBuffer], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }
}

// Create singleton instance
export const pdfFileHandler = new PDFFileHandler();

// Enhanced error handling for PDF loading
export const PDFErrorHandler = {
  getErrorMessage(error) {
    if (error?.message?.includes('ArrayBuffer')) {
      return 'File data was corrupted. Please re-upload the PDF file.';
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
    // Retry for network or temporary errors, not for file format errors
    return !error?.message?.includes('Invalid PDF') && 
           !error?.message?.includes('encrypted') &&
           !error?.message?.includes('corrupted');
  }
};