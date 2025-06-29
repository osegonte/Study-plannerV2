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
