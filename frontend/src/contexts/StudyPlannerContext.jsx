import React, { createContext, useContext, useState } from 'react';

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

  const createTopic = (topicData) => {
    const newTopic = {
      id: Date.now().toString(),
      ...topicData,
      createdAt: new Date().toISOString()
    };
    setTopics(prev => [...prev, newTopic]);
    return newTopic;
  };

  const updateTopic = (id, updates) => {
    setTopics(prev => prev.map(topic => 
      topic.id === id ? { ...topic, ...updates } : topic
    ));
  };

  const deleteTopic = (id) => {
    setTopics(prev => prev.filter(topic => topic.id !== id));
    setDocuments(prev => prev.filter(doc => doc.topicId !== id));
  };

  const addDocumentToTopic = (topicId, fileData) => {
    const newDoc = {
      id: Date.now().toString(),
      topicId,
      name: fileData.name,
      size: fileData.size,
      currentPage: 1,
      totalPages: 0,
      pageTimes: {},
      uploadedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString()
    };
    setDocuments(prev => [...prev, newDoc]);
    return newDoc;
  };

  const updateDocumentProgress = (docId, currentPage, totalPages) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId 
        ? { ...doc, currentPage, totalPages, lastReadAt: new Date().toISOString() }
        : doc
    ));
  };

  const updateDocumentPageTimes = (docId, pageTimes) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId 
        ? { ...doc, pageTimes, lastReadAt: new Date().toISOString() }
        : doc
    ));
  };

  const getDocumentById = (id) => documents.find(doc => doc.id === id);

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
      getDocumentById
    }}>
      {children}
    </StudyPlannerContext.Provider>
  );
};
