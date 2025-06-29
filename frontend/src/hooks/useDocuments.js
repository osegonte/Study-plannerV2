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
