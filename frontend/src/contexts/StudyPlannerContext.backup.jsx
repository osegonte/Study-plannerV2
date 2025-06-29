import React, { createContext, useContext } from 'react';
import { useTopics } from '../hooks/useTopics';
import { useDocuments } from '../hooks/useDocuments';

const StudyPlannerContext = createContext();

export const useStudyPlanner = () => {
  const context = useContext(StudyPlannerContext);
  if (!context) {
    throw new Error('useStudyPlanner must be used within a StudyPlannerProvider');
  }
  return context;
};

export const StudyPlannerProvider = ({ children }) => {
  const topicsHook = useTopics();
  const documentsHook = useDocuments();

  const value = {
    // Topics
    topics: topicsHook.topics,
    createTopic: topicsHook.createTopic,
    updateTopic: topicsHook.updateTopic,
    deleteTopic: topicsHook.deleteTopic,
    getTopicById: topicsHook.getTopicById,

    // Documents
    documents: documentsHook.documents,
    addDocument: documentsHook.addDocument,
    updateDocument: documentsHook.updateDocument,
    deleteDocument: documentsHook.deleteDocument,
    getDocumentById: documentsHook.getDocumentById,
    getDocumentsByTopic: documentsHook.getDocumentsByTopic,
    updateDocumentPageTimes: documentsHook.updateDocumentPageTimes,
    updateDocumentProgress: documentsHook.updateDocumentProgress,

    // Helper methods
    addDocumentToTopic: (topicId, fileData, totalPages = 0) => {
      const documentData = {
        name: fileData.name,
        size: fileData.size,
        topicId,
        totalPages
      };
      return documentsHook.addDocument(documentData);
    },

    getTopicDocuments: (topicId) => {
      return documentsHook.getDocumentsByTopic(topicId);
    }
  };

  return (
    <StudyPlannerContext.Provider value={value}>
      {children}
    </StudyPlannerContext.Provider>
  );
};
