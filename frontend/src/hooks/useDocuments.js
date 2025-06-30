import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pdf-study-planner-documents';

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);

  // Enhanced load function with persistent storage
  const loadDocuments = async () => {
    try {
      // Try to load from persistent storage first
      if (window.persistentStorage) {
        const persistentData = await window.persistentStorage.loadFromFile('documents');
        if (persistentData && Array.isArray(persistentData)) {
          setDocuments(persistentData);
          // Also save to localStorage for backup
          localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentData));
          console.log('📄 Loaded documents from persistent storage');
          return;
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setDocuments(data);
        console.log('📄 Loaded documents from localStorage');
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  // Enhanced save function with persistent storage
  const saveDocuments = async (documentsData) => {
    try {
      // Save to localStorage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documentsData));
      
      // Save to persistent storage if available
      if (window.persistentStorage) {
        await window.persistentStorage.saveToFile('documents', documentsData);
        console.log('💾 Saved documents to persistent storage');
      }
    } catch (error) {
      console.error('Failed to save documents:', error);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (documents.length >= 0) { // Save even empty arrays
      saveDocuments(documents);
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
      cacheKey: documentData.cacheKey || null,
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
    updateDocumentCacheKey
  };
};
