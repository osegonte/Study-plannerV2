import React, { createContext, useContext, useState, useEffect } from 'react';
import { pdfFileHandler } from '../utils/pdfFileHandler';

const StudyPlannerContext = createContext();

export const useStudyPlanner = () => {
  const context = useContext(StudyPlannerContext);
  if (!context) {
    throw new Error('useStudyPlanner must be used within a StudyPlannerProvider');
  }
  return context;
};

export const StudyPlannerProvider = ({ children }) => {
  const [topics, setTopics] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedTopics = localStorage.getItem('pdf-study-planner-topics');
      const savedDocuments = localStorage.getItem('pdf-study-planner-documents');
      
      if (savedTopics) {
        setTopics(JSON.parse(savedTopics));
      }
      
      if (savedDocuments) {
        setDocuments(JSON.parse(savedDocuments));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  // Save topics to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pdf-study-planner-topics', JSON.stringify(topics));
    } catch (error) {
      console.error('Failed to save topics:', error);
    }
  }, [topics]);

  // Save documents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pdf-study-planner-documents', JSON.stringify(documents));
    } catch (error) {
      console.error('Failed to save documents:', error);
    }
  }, [documents]);

  const createTopic = (topicData) => {
    const newTopic = {
      id: Date.now().toString(),
      ...topicData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTopics(prev => [...prev, newTopic]);
    return newTopic;
  };

  const updateTopic = (id, updates) => {
    setTopics(prev => prev.map(topic => 
      topic.id === id ? { ...topic, ...updates, updatedAt: new Date().toISOString() } : topic
    ));
  };

  const deleteTopic = (id) => {
    // Also delete associated documents and their files
    const topicDocuments = documents.filter(doc => doc.topicId === id);
    topicDocuments.forEach(doc => {
      if (doc.cacheKey) {
        pdfFileHandler.removeFile(doc.cacheKey);
      }
    });
    
    setTopics(prev => prev.filter(topic => topic.id !== id));
    setDocuments(prev => prev.filter(doc => doc.topicId !== id));
  };

  const addDocumentToTopic = async (topicId, file) => {
    try {
      // Process the PDF file
      const cacheKey = await pdfFileHandler.processFile(file);
      
      const newDoc = {
        id: Date.now().toString(),
        topicId,
        name: file.name,
        size: file.size,
        cacheKey: cacheKey,
        currentPage: 1,
        totalPages: 0, // Will be updated when PDF is loaded
        pageTimes: {},
        uploadedAt: new Date().toISOString(),
        lastReadAt: new Date().toISOString(),
        readingProgress: {
          percentage: 0,
          timeSpent: 0,
          averageTimePerPage: 0,
          estimatedTimeRemaining: 0,
          lastUpdated: new Date().toISOString()
        }
      };
      
      setDocuments(prev => [...prev, newDoc]);
      return newDoc;
    } catch (error) {
      console.error('Failed to add document:', error);
      throw error;
    }
  };

  const updateDocumentProgress = (docId, currentPage, totalPages) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        const percentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
        const pagesRead = Object.keys(doc.pageTimes || {}).length;
        const timeSpent = Object.values(doc.pageTimes || {}).reduce((sum, time) => sum + time, 0);
        const averageTimePerPage = pagesRead > 0 ? timeSpent / pagesRead : 0;
        const pagesRemaining = Math.max(totalPages - currentPage, 0);
        const estimatedTimeRemaining = averageTimePerPage * pagesRemaining;
        
        return { 
          ...doc, 
          currentPage, 
          totalPages,
          lastReadAt: new Date().toISOString(),
          readingProgress: {
            percentage: Math.min(percentage, 100),
            timeSpent,
            averageTimePerPage,
            estimatedTimeRemaining,
            lastUpdated: new Date().toISOString()
          }
        };
      }
      return doc;
    }));
  };

  const updateDocumentPageTimes = (docId, pageTimes) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        const pagesRead = Object.keys(pageTimes).length;
        const timeSpent = Object.values(pageTimes).reduce((sum, time) => sum + time, 0);
        const averageTimePerPage = pagesRead > 0 ? timeSpent / pagesRead : 0;
        const totalPages = doc.totalPages || 1;
        const percentage = (pagesRead / totalPages) * 100;
        const pagesRemaining = Math.max(totalPages - pagesRead, 0);
        const estimatedTimeRemaining = averageTimePerPage * pagesRemaining;
        
        return {
          ...doc, 
          pageTimes, 
          lastReadAt: new Date().toISOString(),
          readingProgress: {
            percentage: Math.min(percentage, 100),
            timeSpent,
            averageTimePerPage,
            estimatedTimeRemaining,
            lastUpdated: new Date().toISOString()
          }
        };
      }
      return doc;
    }));
  };

  const getDocumentById = (id) => documents.find(doc => doc.id === id);

  const getDocumentsByTopic = (topicId) => {
    return documents.filter(doc => doc.topicId === topicId);
  };

  // Get document file data for viewing
  const getDocumentFile = (docId) => {
    const doc = getDocumentById(docId);
    if (!doc || !doc.cacheKey) return null;
    
    return pdfFileHandler.getFileForViewing(doc.cacheKey);
  };

  // Calculate reading estimates for a document
  const getDocumentEstimates = (docId) => {
    const doc = getDocumentById(docId);
    if (!doc) return null;

    const pageTimes = doc.pageTimes || {};
    const pagesRead = Object.keys(pageTimes).length;
    const timeSpent = Object.values(pageTimes).reduce((sum, time) => sum + time, 0);
    const averageTimePerPage = pagesRead > 0 ? timeSpent / pagesRead : 0;
    const totalPages = doc.totalPages || 0;
    const pagesRemaining = Math.max(totalPages - doc.currentPage, 0);
    const estimatedTimeRemaining = averageTimePerPage * pagesRemaining;
    const readingSpeed = averageTimePerPage > 0 ? 3600 / averageTimePerPage : 0; // pages per hour

    return {
      pagesRead,
      timeSpent,
      averageTimePerPage,
      estimatedTimeRemaining,
      readingSpeed,
      totalPages,
      currentPage: doc.currentPage,
      percentage: totalPages > 0 ? (doc.currentPage / totalPages) * 100 : 0
    };
  };

  return (
    <StudyPlannerContext.Provider value={{
      topics,
      documents,
      createTopic,
      updateTopic,
      deleteTopic,
      addDocumentToTopic,
      updateDocumentProgress,
      updateDocumentPageTimes,
      getDocumentById,
      getDocumentsByTopic,
      getDocumentFile,
      getDocumentEstimates
    }}>
      {children}
    </StudyPlannerContext.Provider>
  );
};
