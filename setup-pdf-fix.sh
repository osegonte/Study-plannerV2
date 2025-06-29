#!/bin/bash

# 🚀 PDF Study Planner - Setup & Cleanup Script
# This script implements the enhanced PDF handling system and removes redundant files

set -e # Exit on any error

echo "🚀 PDF Study Planner - Enhanced File Handling Setup"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the pdf-study-planner root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected structure: pdf-study-planner/frontend/package.json"
    exit 1
fi

echo "✅ Found frontend directory"

# Navigate to frontend
cd frontend

# Create backup of important files
echo "💾 Creating backup of existing files..."
mkdir -p .backup/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".backup/$(date +%Y%m%d_%H%M%S)"

# Backup existing files that will be modified
if [ -f "src/hooks/useDocuments.js" ]; then
    cp "src/hooks/useDocuments.js" "$BACKUP_DIR/useDocuments.js.bak"
    echo "   📄 Backed up useDocuments.js"
fi

if [ -f "src/App.jsx" ]; then
    cp "src/App.jsx" "$BACKUP_DIR/App.jsx.bak"
    echo "   📄 Backed up App.jsx"
fi

if [ -f "src/components/pdf/PDFViewer.jsx" ]; then
    cp "src/components/pdf/PDFViewer.jsx" "$BACKUP_DIR/PDFViewer.jsx.bak"
    echo "   📄 Backed up PDFViewer.jsx"
fi

echo "✅ Backup completed in $BACKUP_DIR"

# Create the new core PDF file handler
echo "🔧 Creating core PDF file handler..."
cat > src/utils/pdfFileHandler.js << 'EOF'
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
EOF

echo "✅ Created src/utils/pdfFileHandler.js"

# Create the PDF files management hook
echo "🔧 Creating PDF files management hook..."
cat > src/hooks/usePDFFiles.js << 'EOF'
// hooks/usePDFFiles.js
import { useState, useEffect, useCallback } from 'react';
import { pdfFileHandler } from '../utils/pdfFileHandler';

export const usePDFFiles = () => {
  const [fileCache, setFileCache] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize hook
  useEffect(() => {
    console.log('📚 PDF Files hook initialized');
    return () => {
      console.log('🧹 PDF Files hook cleanup');
    };
  }, []);

  /**
   * Process and cache a PDF file
   * @param {File} file - The PDF file to process
   * @returns {Promise<string>} - Cache key for the processed file
   */
  const processFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate file first
      if (!file || file.type !== 'application/pdf') {
        throw new Error('Invalid PDF file');
      }
      
      console.log('🔄 Processing PDF file:', file.name);
      
      // Process file using our enhanced handler
      const cacheKey = await pdfFileHandler.processFile(file);
      
      // Update local cache map
      setFileCache(prev => new Map(prev).set(cacheKey, {
        name: file.name,
        size: file.size,
        cacheKey,
        processedAt: Date.now()
      }));
      
      console.log('✅ File processed successfully:', cacheKey);
      return cacheKey;
      
    } catch (error) {
      console.error('❌ Error processing file:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get ArrayBuffer for react-pdf
   * @param {string} cacheKey - The cache key
   * @returns {ArrayBuffer|null} - ArrayBuffer for PDF viewing
   */
  const getFileData = useCallback((cacheKey) => {
    if (!cacheKey) return null;
    
    try {
      const arrayBuffer = pdfFileHandler.getFileForPDF(cacheKey);
      if (!arrayBuffer) {
        console.error('❌ File not found in cache:', cacheKey);
        setError('File not found in cache. Please re-upload the file.');
        return null;
      }
      
      return arrayBuffer;
    } catch (error) {
      console.error('❌ Error retrieving file data:', error);
      setError('Error retrieving file data');
      return null;
    }
  }, []);

  /**
   * Get file metadata
   * @param {string} cacheKey - The cache key
   * @returns {Object|null} - File metadata
   */
  const getFileMetadata = useCallback((cacheKey) => {
    if (!cacheKey) return null;
    
    const localData = fileCache.get(cacheKey);
    const handlerData = pdfFileHandler.getFileMetadata(cacheKey);
    
    return {
      ...handlerData,
      ...localData
    };
  }, [fileCache]);

  /**
   * Check if file exists in cache
   * @param {string} cacheKey - The cache key to check
   * @returns {boolean} - Whether file exists
   */
  const hasFile = useCallback((cacheKey) => {
    return pdfFileHandler.hasFile(cacheKey);
  }, []);

  /**
   * Remove file from cache
   * @param {string} cacheKey - The cache key to remove
   */
  const removeFile = useCallback((cacheKey) => {
    pdfFileHandler.removeFile(cacheKey);
    setFileCache(prev => {
      const newMap = new Map(prev);
      newMap.delete(cacheKey);
      return newMap;
    });
    console.log('🗑️ File removed:', cacheKey);
  }, []);

  /**
   * Clear all cached files
   */
  const clearAllFiles = useCallback(() => {
    pdfFileHandler.clearCache();
    setFileCache(new Map());
    setError(null);
    console.log('🧹 All files cleared');
  }, []);

  /**
   * Validate if a cache key is still valid
   * @param {string} cacheKey - The cache key to validate
   * @returns {boolean} - Whether the cache key is valid
   */
  const validateCacheKey = useCallback((cacheKey) => {
    if (!cacheKey) return false;
    
    try {
      const data = pdfFileHandler.getFileForPDF(cacheKey);
      return data instanceof ArrayBuffer && data.byteLength > 0;
    } catch (error) {
      console.warn('⚠️ Invalid cache key:', cacheKey, error.message);
      return false;
    }
  }, []);

  return {
    // State
    loading,
    error,
    fileCache,
    
    // Actions
    processFile,
    getFileData,
    getFileMetadata,
    hasFile,
    removeFile,
    clearAllFiles,
    validateCacheKey,
    
    // Utilities
    setError
  };
};
EOF

echo "✅ Created src/hooks/usePDFFiles.js"

# Update useDocuments.js to support cache keys
echo "🔧 Updating useDocuments.js to support cache keys..."
if [ -f "src/hooks/useDocuments.js" ]; then
    # Create updated version
    cat > src/hooks/useDocuments.js << 'EOF'
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pdf-study-planner-documents';

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);

  // Load documents from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setDocuments(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load documents from localStorage:', error);
    }
  }, []);

  // Save documents to localStorage whenever documents change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch (error) {
      console.error('Failed to save documents to localStorage:', error);
    }
  }, [documents]);

  const addDocument = (documentData) => {
    const newDocument = {
      id: Date.now().toString(),
      name: documentData.name,
      size: documentData.size,
      topicId: documentData.topicId,
      totalPages: documentData.totalPages || 0,
      currentPage: 1,
      pageTimes: {},
      cacheKey: documentData.cacheKey || null, // 🆕 ADD cache key support
      uploadedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString()
    };

    setDocuments(prev => [...prev, newDocument]);
    return newDocument;
  };

  const updateDocument = (documentId, updates) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId
        ? { ...doc, ...updates, lastReadAt: new Date().toISOString() }
        : doc
    ));
  };

  const deleteDocument = (documentId) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const getDocumentById = (documentId) => {
    return documents.find(doc => doc.id === documentId);
  };

  const getDocumentsByTopic = (topicId) => {
    return documents.filter(doc => doc.topicId === topicId);
  };

  const updateDocumentPageTimes = (documentId, pageTimes) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId
        ? { ...doc, pageTimes, lastReadAt: new Date().toISOString() }
        : doc
    ));
  };

  const updateDocumentProgress = (documentId, currentPage, totalPages) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId
        ? { 
            ...doc, 
            currentPage, 
            totalPages,
            lastReadAt: new Date().toISOString()
          }
        : doc
    ));
  };

  // 🆕 ADD method to update cache key
  const updateDocumentCacheKey = (documentId, cacheKey) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === documentId
        ? { ...doc, cacheKey, lastReadAt: new Date().toISOString() }
        : doc
    ));
  };

  return {
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocumentById,
    getDocumentsByTopic,
    updateDocumentPageTimes,
    updateDocumentProgress,
    updateDocumentCacheKey // 🆕 ADD this
  };
};
EOF
    echo "✅ Updated src/hooks/useDocuments.js with cache key support"
else
    echo "⚠️ Warning: useDocuments.js not found, skipping update"
fi

# Update PDFViewer.jsx to use the new file handler
echo "🔧 Updating PDFViewer.jsx to use enhanced file handling..."
if [ -f "src/components/pdf/PDFViewer.jsx" ]; then
    # Create a simple fix for the existing PDF viewer
    cat > src/components/pdf/PDFViewer.jsx << 'EOF'
import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, FileText, ZoomIn, ZoomOut, Save, Play, Pause } from 'lucide-react';
import { useTimeTracking } from '../../hooks/useTimeTracking';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import { pdfFileHandler, PDFErrorHandler } from '../../utils/pdfFileHandler'; // 🆕 ADD this import
import ReadingTimer from '../timer/ReadingTimer';
import TimeTrackingStats from '../timer/TimeTrackingStats';
import ReadingEstimates from '../timer/ReadingEstimates';
import ReadingSpeedIndicator from '../timer/ReadingSpeedIndicator';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer = ({ file, documentId, topicId, fileName, onBack }) => {
  const [pdfData, setPdfData] = useState(null); // 🔄 Use pdfData instead of file
  const [fileKey, setFileKey] = useState(null); // 🆕 ADD file key state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPageChanging, setIsPageChanging] = useState(false);

  const { updateDocumentProgress, updateDocumentPageTimes, getDocumentById, updateDocumentCacheKey } = useStudyPlanner();

  // Get existing document data
  const existingDocument = documentId ? getDocumentById(documentId) : null;
  const initialPageTimes = existingDocument?.pageTimes || {};

  // Time tracking with existing data
  const {
    isTracking,
    currentSessionTime,
    pageTimes,
    sessionData,
    startPageTimer,
    stopPageTimer,
    resetTimingData,
    getPageTime
  } = useTimeTracking(initialPageTimes);

  // 🆕 Process file when component mounts or file changes
  useEffect(() => {
    const processFileForViewing = async () => {
      if (!file) return;

      // Check if document already has a cache key
      if (existingDocument?.cacheKey && pdfFileHandler.hasFile(existingDocument.cacheKey)) {
        console.log('📄 Using existing cache key:', existingDocument.cacheKey);
        setFileKey(existingDocument.cacheKey);
        const arrayBuffer = pdfFileHandler.getFileForPDF(existingDocument.cacheKey);
        setPdfData(arrayBuffer);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Processing file for viewing:', file.name || 'uploaded-file.pdf');
        
        // Process the file
        const cacheKey = await pdfFileHandler.processFile(file);
        setFileKey(cacheKey);
        
        // Get ArrayBuffer for PDF viewing
        const arrayBuffer = pdfFileHandler.getFileForPDF(cacheKey);
        setPdfData(arrayBuffer);
        
        // Save cache key to document if we have a document ID
        if (documentId && updateDocumentCacheKey) {
          updateDocumentCacheKey(documentId, cacheKey);
        }
        
        console.log('✅ File ready for viewing');
        
      } catch (error) {
        console.error('❌ Error processing file:', error);
        setError(PDFErrorHandler.getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    processFileForViewing();
  }, [file, existingDocument?.cacheKey, documentId, updateDocumentCacheKey]);

  // Initialize page number from existing document
  useEffect(() => {
    if (existingDocument && existingDocument.currentPage) {
      setPageNumber(existingDocument.currentPage);
      console.log(`📖 Loaded document at page ${existingDocument.currentPage}`);
    }
  }, [existingDocument]);

  // PDF document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log(`📄 PDF loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    
    // Update document with page count
    if (documentId) {
      updateDocumentProgress(documentId, pageNumber, numPages);
    }
    
    // Start timing for current page after a brief delay
    setTimeout(() => {
      startPageTimer(pageNumber, fileName);
    }, 100);
  }, [documentId, pageNumber, updateDocumentProgress, startPageTimer, fileName]);

  // PDF document load error
  const onDocumentLoadError = useCallback((error) => {
    console.error('📄 PDF load error:', error);
    setError(PDFErrorHandler.getErrorMessage(error));
    setLoading(false);
    stopPageTimer();
  }, [stopPageTimer]);

  // Handle page navigation with proper timer management
  const navigateToPage = useCallback((newPage) => {
    if (newPage === pageNumber || isPageChanging) return;
    
    console.log(`🔄 Navigating from page ${pageNumber} to page ${newPage}`);
    setIsPageChanging(true);
    
    // Stop current timer and save time
    stopPageTimer();
    
    // Update page number
    setPageNumber(newPage);
    
    // Update document progress
    if (documentId) {
      updateDocumentProgress(documentId, newPage, numPages);
    }
    
    // Start timer for new page after a brief delay
    setTimeout(() => {
      startPageTimer(newPage, fileName);
      setIsPageChanging(false);
    }, 100);
  }, [pageNumber, isPageChanging, stopPageTimer, documentId, numPages, updateDocumentProgress, startPageTimer, fileName]);

  const goToPrevPage = useCallback(() => {
    const newPage = Math.max(pageNumber - 1, 1);
    navigateToPage(newPage);
  }, [pageNumber, navigateToPage]);

  const goToNextPage = useCallback(() => {
    const newPage = Math.min(pageNumber + 1, numPages || 1);
    navigateToPage(newPage);
  }, [pageNumber, numPages, navigateToPage]);

  const goToPage = useCallback((page) => {
    const pageNum = parseInt(page);
    if (pageNum >= 1 && pageNum <= numPages) {
      navigateToPage(pageNum);
    }
  }, [numPages, navigateToPage]);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  // Save reading progress
  const saveProgress = useCallback(() => {
    if (documentId && Object.keys(pageTimes).length > 0) {
      updateDocumentPageTimes(documentId, pageTimes);
      console.log(`💾 Progress saved for ${fileName}: ${Object.keys(pageTimes).length} pages`);
    }
  }, [documentId, pageTimes, updateDocumentPageTimes, fileName]);

  // Manual timer control
  const toggleTimer = () => {
    if (isTracking) {
      stopPageTimer();
    } else {
      startPageTimer(pageNumber, fileName);
    }
  };

  // Auto-save progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(pageTimes).length > 0) {
        saveProgress();
      }
    }, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [saveProgress, pageTimes]);

  // Handle browser tab visibility for accurate timing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Tab hidden - stopping timer');
        stopPageTimer();
        saveProgress();
      } else if (pdfData && numPages && !isPageChanging) {
        console.log('👁️ Tab visible - starting timer');
        startPageTimer(pageNumber, fileName);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pdfData, numPages, pageNumber, startPageTimer, stopPageTimer, saveProgress, fileName, isPageChanging]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 PDF Viewer cleanup');
      stopPageTimer();
      saveProgress();
    };
  }, [stopPageTimer, saveProgress]);

  if (!pdfData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {loading ? 'Processing PDF...' : 'No PDF File'}
          </h2>
          <p className="text-gray-500">
            {loading ? 'Please wait while we prepare your PDF for viewing' : 'Please select a PDF file to start reading.'}
          </p>
          {loading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main PDF Area */}
          <div className="flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
                <p className="text-red-600 text-sm mt-1">
                  Try refreshing the page or uploading a different PDF file.
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading PDF...</p>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm">
              {/* Enhanced Toolbar */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    {/* Navigation Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1 || isPageChanging}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={numPages || 1}
                          value={pageNumber}
                          onChange={(e) => goToPage(e.target.value)}
                          disabled={isPageChanging}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          title="Go to page"
                        />
                        <span className="text-gray-600">of {numPages || '?'}</span>
                        {isPageChanging && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= (numPages || 1) || isPageChanging}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Timer Control */}
                    <div className="flex items-center space-x-2 border-l pl-4">
                      <button
                        onClick={toggleTimer}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm ${
                          isTracking 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={isTracking ? "Stop timer" : "Start timer"}
                      >
                        {isTracking ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        <span>Timer</span>
                      </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center space-x-2 border-l pl-4">
                      <button
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Zoom out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      
                      <span className="text-sm text-gray-600 min-w-12 text-center">
                        {Math.round(scale * 100)}%
                      </span>
                      
                      <button
                        onClick={zoomIn}
                        disabled={scale >= 3.0}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Zoom in"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Page Time Display */}
                    {getPageTime(pageNumber) > 0 && (
                      <div className="border-l pl-4">
                        <span className="text-sm text-gray-600">
                          This page: {Math.floor(getPageTime(pageNumber) / 60)}m {getPageTime(pageNumber) % 60}s
                        </span>
                      </div>
                    )}
                  </div>

                  {/* File Actions */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={saveProgress}
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      title="Save progress"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{fileName}</span>
                    </div>

                    {onBack && (
                      <button
                        onClick={onBack}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        ← Back
                      </button>
                    )}
                  </div>
                </div>

                {/* Reading Speed Indicator */}
                <ReadingSpeedIndicator 
                  pageTimes={pageTimes}
                  totalPages={numPages || 0}
                  currentPage={pageNumber}
                />
              </div>

              {/* PDF Display Area */}
              <div className="p-6">
                <div className="bg-gray-100 rounded-lg min-h-96 flex items-center justify-center overflow-auto">
                  <Document
                    file={pdfData}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    options={{
                      disableTextLayer: true,
                      disableAnnotationLayer: true,
                    }}
                    loading={
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 mt-2">Loading PDF document...</p>
                      </div>
                    }
                    error={
                      <div className="text-center py-12">
                        <div className="text-red-600 mb-2">❌ Failed to load PDF</div>
                        <p className="text-gray-600 text-sm">Please try refreshing or uploading a different file</p>
                      </div>
                    }
                    className="react-pdf__Document"
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={
                        <div className="bg-white shadow-lg rounded border p-8 animate-pulse">
                          <div className="h-96 bg-gray-200 rounded"></div>
                        </div>
                      }
                      className="react-pdf__Page shadow-lg rounded"
                      canvasBackground="white"
                    />
                  </Document>
                </div>
              </div>

              {/* Progress Bar */}
              {numPages && (
                <div className="border-t px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Reading Progress</span>
                    <span className="text-sm font-medium text-gray-800">
                      {Math.round((pageNumber / numPages) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(pageNumber / numPages) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Page 1</span>
                    <span>Page {numPages}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar with Timer and Stats */}
          <div className="w-80 space-y-4">
            <ReadingTimer
              isTracking={isTracking}
              currentSessionTime={currentSessionTime}
              sessionData={sessionData}
              onReset={resetTimingData}
              currentPage={pageNumber}
            />
            
            <ReadingEstimates
              pageTimes={pageTimes}
              currentPage={pageNumber}
              totalPages={numPages || 0}
              sessionData={sessionData}
            />
            
            <TimeTrackingStats
              pageTimes={pageTimes}
              sessionData={sessionData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
EOF
    echo "✅ Updated src/components/pdf/PDFViewer.jsx with enhanced file handling"
else
    echo "⚠️ Warning: PDFViewer.jsx not found, skipping update"
fi

# Remove redundant/obsolete files
echo "🧹 Removing redundant and obsolete files..."

# List of files to potentially remove (check if they exist first)
REDUNDANT_FILES=(
    "src/components/pdf/EnhancedPDFViewer.jsx" # We're keeping the simple updated version
    "src/components/upload/PDFUpload.jsx" # Old simple upload component
    "src/context/UserContext.jsx" # Duplicate in wrong location
    "src/hooks/usePDFReader.js" # Basic hook that's not used
)

for file in "${REDUNDANT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   🗑️ Removing redundant file: $file"
        rm "$file"
    fi
done

# Remove empty directories
find src -type d -empty -delete 2>/dev/null || true

echo "✅ Cleanup completed"

# Update EnhancedPDFUpload to be simpler and integrate better
echo "🔧 Creating simplified enhanced upload component..."
cat > src/components/upload/EnhancedPDFUpload.jsx << 'EOF'
import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { usePDFFiles } from '../../hooks/usePDFFiles';

const EnhancedPDFUpload = ({ topics, onUpload, onCreateTopic }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(topics[0]?.id || '');

  const { processFile, loading } = usePDFFiles();
  const fileInputRef = useRef(null);

  // Validate PDF file
  const validateFile = (file) => {
    const errors = [];
    
    if (file.type !== 'application/pdf') {
      errors.push('Only PDF files are allowed');
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      errors.push('File size must be less than 100MB');
    }
    
    if (file.size < 1024) { // Minimum 1KB
      errors.push('File appears to be empty or corrupted');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file input change
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(Array.from(files));
    }
    e.target.value = ''; // Reset input
  };

  // Process uploaded files
  const processFiles = async (files) => {
    setError(null);
    
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(`${file.name}: ${validation.errors.join(', ')}`);
        continue;
      }

      try {
        // Process file and get cache key
        const cacheKey = await processFile(file);
        
        // Add to selected files
        const fileData = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          cacheKey,
          status: 'processed'
        };

        setSelectedFiles(prev => [...prev, fileData]);
        
      } catch (error) {
        console.error('Error processing file:', error);
        setError(`Failed to process ${file.name}: ${error.message}`);
      }
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  // Remove file from selection
  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Upload files to topic
  const handleUploadToTopic = async () => {
    if (!selectedTopic) {
      setError('Please select a topic first');
      return;
    }
    
    const processedFiles = selectedFiles.filter(f => f.status === 'processed');
    if (processedFiles.length === 0) {
      setError('No files to upload');
      return;
    }
    
    try {
      for (const fileData of processedFiles) {
        await onUpload(fileData.file, {
          topicId: selectedTopic,
          cacheKey: fileData.cacheKey
        });
      }
      
      // Clear files after successful upload
      setSelectedFiles([]);
      setError(null);
      
    } catch (error) {
      setError(`Upload failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Topic Selection */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Topic</h3>
        
        {topics.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">No topics available</p>
            <button
              onClick={onCreateTopic}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Create your first topic
            </button>
          </div>
        ) : (
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a topic...</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* File Upload Area */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload PDF Files</h3>
        
        {/* Drag and Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${
            dragActive ? 'text-blue-600' : 'text-gray-400'
          }`} />
          
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {dragActive ? 'Drop files here' : 'Upload PDF files'}
          </h4>
          
          <p className="text-gray-600 mb-4">
            Drag and drop PDF files here, or click to select files
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-5 w-5 mr-2" />
            {loading ? 'Processing...' : 'Select PDF Files'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Upload Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* File List */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Selected Files ({selectedFiles.length})
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedFiles.map((fileData) => (
                <div
                  key={fileData.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-red-600 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileData.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileData.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {fileData.status === 'processed' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    
                    <button
                      onClick={() => removeFile(fileData.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Upload Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUploadToTopic}
                disabled={!selectedTopic || selectedFiles.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Upload to Topic ({selectedFiles.length} files)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPDFUpload;
EOF

echo "✅ Created src/components/upload/EnhancedPDFUpload.jsx"

# Create a simple integration example for App.jsx
echo "🔧 Creating App.jsx integration example..."
cat > src/App.integration.example.jsx << 'EOF'
// App.jsx Integration Example - Replace your handlePDFUpload method with this

import React, { useState } from 'react';
import { usePDFFiles } from './hooks/usePDFFiles'; // 🆕 ADD this import
// ... your other existing imports

function App() {
  // ... your existing state and hooks

  // 🆕 ADD this hook
  const { processFile, validateCacheKey, error: fileError } = usePDFFiles();

  // 🔄 REPLACE your existing handlePDFUpload with this:
  const handlePDFUpload = async (file, metadata) => {
    try {
      // Process file to get cache key
      const cacheKey = await processFile(file);
      
      // Create document with cache key
      const documentData = addDocumentToTopic(metadata.topicId, file, 0);
      
      // Update document with cache key
      updateDocumentCacheKey(documentData.id, cacheKey);
      
      console.log('✅ PDF uploaded successfully with cache key:', cacheKey);
      return documentData;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  };

  // 🔄 UPDATE your handleStartReading method:
  const handleStartReading = (file, documentId, topicId) => {
    const document = getDocumentById(documentId);
    
    // Validate cache key if document has one
    if (document?.cacheKey && validateCacheKey(document.cacheKey)) {
      console.log('✅ Using existing cache key for document');
    } else {
      console.log('⚠️ No valid cache key found, file will be reprocessed');
    }
    
    setSelectedFile({
      file: file,
      documentId: documentId,
      topicId: topicId,
      name: file.name,
      size: file.size
    });
    setCurrentView('viewer');
  };

  // ... rest of your existing App component code

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Your existing JSX */}
      
      {/* 🔄 ADD error display for file errors */}
      {fileError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-sm">
          <strong>File Error:</strong> {fileError}
        </div>
      )}
    </div>
  );
}

export default App;
EOF

echo "📄 Created integration example: src/App.integration.example.jsx"

# Generate summary report
echo ""
echo "🎉 Setup Complete! Summary of Changes:"
echo "======================================"
echo ""
echo "✅ Created Files:"
echo "   📄 src/utils/pdfFileHandler.js           (Core fix for ArrayBuffer error)"
echo "   📄 src/hooks/usePDFFiles.js              (PDF file management hook)"
echo "   📄 src/components/upload/EnhancedPDFUpload.jsx (Enhanced upload component)"
echo "   📄 src/App.integration.example.jsx       (Integration example)"
echo ""
echo "🔄 Updated Files:"
echo "   📄 src/hooks/useDocuments.js             (Added cache key support)"
echo "   📄 src/components/pdf/PDFViewer.jsx      (Fixed ArrayBuffer handling)"
echo ""
echo "🧹 Cleaned Up:"
echo "   🗑️ Removed redundant files and empty directories"
echo ""
echo "💾 Backup Created:"
echo "   📁 $BACKUP_DIR/"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review the integration example: src/App.integration.example.jsx"
echo "   2. Update your App.jsx with the new handlePDFUpload method"
echo "   3. Test PDF upload and viewing - ArrayBuffer errors should be fixed!"
echo "   4. Consider using EnhancedPDFUpload for better user experience"
echo ""
echo "🧪 Test Your Fix:"
echo "   cd frontend && npm start"
echo "   Upload a PDF - should work without 'detached ArrayBuffer' errors!"
echo ""
echo "📋 Files you may want to review/integrate:"
echo "   - src/App.integration.example.jsx (integration guide)"
echo "   - $BACKUP_DIR/ (your original files)"
echo ""
echo "🎯 The core ArrayBuffer error should now be FIXED! 🎉"