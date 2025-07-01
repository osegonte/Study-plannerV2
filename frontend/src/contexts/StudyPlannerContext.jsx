import React, { createContext, useContext, useState, useEffect } from 'react';
import { productionPDFHandler } from '../utils/productionPDFHandler';

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
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced loading with error recovery
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load topics
        const savedTopics = localStorage.getItem('pdf-study-planner-topics');
        if (savedTopics) {
          const parsedTopics = JSON.parse(savedTopics);
          setTopics(Array.isArray(parsedTopics) ? parsedTopics : []);
        }
        
        // Load documents
        const savedDocuments = localStorage.getItem('pdf-study-planner-documents');
        if (savedDocuments) {
          const parsedDocs = JSON.parse(savedDocuments);
          setDocuments(Array.isArray(parsedDocs) ? parsedDocs : []);
        }
        
        console.log('📚 Loaded study data successfully');
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        // Reset to empty state on corruption
        setTopics([]);
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-save with debouncing
  useEffect(() => {
    if (!isLoading && topics.length >= 0) {
      const saveTimer = setTimeout(() => {
        try {
          localStorage.setItem('pdf-study-planner-topics', JSON.stringify(topics));
          console.log('💾 Auto-saved topics:', topics.length);
        } catch (error) {
          console.error('❌ Failed to save topics:', error);
        }
      }, 500);
      return () => clearTimeout(saveTimer);
    }
  }, [topics, isLoading]);

  useEffect(() => {
    if (!isLoading && documents.length >= 0) {
      const saveTimer = setTimeout(() => {
        try {
          localStorage.setItem('pdf-study-planner-documents', JSON.stringify(documents));
          console.log('💾 Auto-saved documents:', documents.length);
        } catch (error) {
          console.error('❌ Failed to save documents:', error);
        }
      }, 500);
      return () => clearTimeout(saveTimer);
    }
  }, [documents, isLoading]);

  const createTopic = (topicData) => {
    const newTopic = {
      id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...topicData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentCount: 0,
      totalPages: 0,
      readingTime: 0
    };
    
    setTopics(prev => [...prev, newTopic]);
    console.log('✅ Created topic:', newTopic.name);
    return newTopic;
  };

  const updateTopic = (id, updates) => {
    setTopics(prev => prev.map(topic => 
      topic.id === id ? { ...topic, ...updates, updatedAt: new Date().toISOString() } : topic
    ));
    console.log('✅ Updated topic:', id);
  };

  const deleteTopic = (id) => {
    // Clean up associated documents and files
    const topicDocuments = documents.filter(doc => doc.topicId === id);
    topicDocuments.forEach(doc => {
      if (doc.cacheKey) {
        productionPDFHandler.removeFile(doc.cacheKey);
      }
    });
    
    setTopics(prev => prev.filter(topic => topic.id !== id));
    setDocuments(prev => prev.filter(doc => doc.topicId !== id));
    console.log('🗑️ Deleted topic and', topicDocuments.length, 'documents');
  };

  const addDocumentToTopic = async (topicId, file) => {
    try {
      console.log('📄 Processing document:', file.name);
      const cacheKey = await productionPDFHandler.processFile(file);
      
      const newDoc = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        topicId,
        name: file.name,
        size: file.size,
        cacheKey: cacheKey,
        currentPage: 1,
        totalPages: 0,
        pageTimes: {},
        uploadedAt: new Date().toISOString(),
        lastReadAt: new Date().toISOString(),
        readingProgress: {
          percentage: 0,
          timeSpent: 0,
          averageTimePerPage: 0,
          estimatedTimeRemaining: 0,
          lastUpdated: new Date().toISOString()
        },
        studyNotes: [],
        bookmarks: [],
        version: 1
      };
      
      setDocuments(prev => [...prev, newDoc]);
      
      // Update topic stats
      setTopics(prev => prev.map(topic => 
        topic.id === topicId 
          ? { 
              ...topic, 
              documentCount: (topic.documentCount || 0) + 1,
              updatedAt: new Date().toISOString()
            }
          : topic
      ));
      
      console.log('✅ Added document:', newDoc.name);
      return newDoc;
    } catch (error) {
      console.error('❌ Failed to add document:', error);
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
  const getDocumentsByTopic = (topicId) => documents.filter(doc => doc.topicId === topicId);
  
  const getDocumentFile = (docId) => {
    const doc = getDocumentById(docId);
    if (!doc || !doc.cacheKey) return null;
    return productionPDFHandler.getFileForViewing(doc.cacheKey);
  };

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
    const readingSpeed = averageTimePerPage > 0 ? 3600 / averageTimePerPage : 0;

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

  // Bulk operations for production use
  const exportData = () => {
    const exportData = {
      topics,
      documents: documents.map(doc => ({
        ...doc,
        cacheKey: null // Don't export file cache keys
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📤 Exported study data');
  };

  const importData = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.topics && Array.isArray(data.topics)) {
        setTopics(data.topics);
      }
      if (data.documents && Array.isArray(data.documents)) {
        setDocuments(data.documents);
      }
      
      console.log('📥 Imported study data:', data.topics?.length, 'topics,', data.documents?.length, 'documents');
    } catch (error) {
      console.error('❌ Failed to import data:', error);
      throw error;
    }
  };

  const getStatistics = () => {
    const totalReadingTime = documents.reduce((sum, doc) => 
      sum + Object.values(doc.pageTimes || {}).reduce((docSum, time) => docSum + time, 0), 0
    );
    
    const totalPages = documents.reduce((sum, doc) => sum + (doc.totalPages || 0), 0);
    const pagesRead = documents.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0);
    
    const completedDocuments = documents.filter(doc => {
      const progress = doc.totalPages > 0 ? (doc.currentPage / doc.totalPages) * 100 : 0;
      return progress >= 95; // Consider 95%+ as completed
    }).length;

    return {
      totalTopics: topics.length,
      totalDocuments: documents.length,
      completedDocuments,
      totalPages,
      pagesRead,
      totalReadingTime,
      averageReadingSpeed: pagesRead > 0 && totalReadingTime > 0 ? (pagesRead * 3600) / totalReadingTime : 0,
      completionRate: totalPages > 0 ? (pagesRead / totalPages) * 100 : 0
    };
  };

  return (
    <StudyPlannerContext.Provider value={{
      topics,
      documents,
      isLoading,
      createTopic,
      updateTopic,
      deleteTopic,
      addDocumentToTopic,
      updateDocumentProgress,
      updateDocumentPageTimes,
      getDocumentById,
      getDocumentsByTopic,
      getDocumentFile,
      getDocumentEstimates,
      exportData,
      importData,
      getStatistics
    }}>
      {children}
    </StudyPlannerContext.Provider>
  );
};
