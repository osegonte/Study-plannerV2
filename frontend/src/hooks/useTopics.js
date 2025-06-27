import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pdf-study-planner-topics';

export const useTopics = () => {
  const [topics, setTopics] = useState([]);

  // Load topics from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTopics(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load topics from localStorage:', error);
    }
  }, []);

  // Save topics to localStorage whenever topics change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
    } catch (error) {
      console.error('Failed to save topics to localStorage:', error);
    }
  }, [topics]);

  const createTopic = (topicData) => {
    const newTopic = {
      id: Date.now().toString(),
      name: topicData.name.trim(),
      description: topicData.description?.trim() || '',
      color: topicData.color || 'blue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: []
    };

    setTopics(prev => [...prev, newTopic]);
    return newTopic;
  };

  const updateTopic = (topicId, updates) => {
    setTopics(prev => prev.map(topic => 
      topic.id === topicId 
        ? { ...topic, ...updates, updatedAt: new Date().toISOString() }
        : topic
    ));
  };

  const deleteTopic = (topicId) => {
    if (window.confirm('Are you sure you want to delete this topic? This will not delete the PDF files, but will remove their topic association.')) {
      setTopics(prev => prev.filter(topic => topic.id !== topicId));
    }
  };

  const getTopicById = (topicId) => {
    return topics.find(topic => topic.id === topicId);
  };

  const addDocumentToTopic = (topicId, documentData) => {
    setTopics(prev => prev.map(topic =>
      topic.id === topicId
        ? { 
            ...topic, 
            documents: [...(topic.documents || []), documentData],
            updatedAt: new Date().toISOString()
          }
        : topic
    ));
  };

  const removeDocumentFromTopic = (topicId, documentId) => {
    setTopics(prev => prev.map(topic =>
      topic.id === topicId
        ? { 
            ...topic, 
            documents: (topic.documents || []).filter(doc => doc.id !== documentId),
            updatedAt: new Date().toISOString()
          }
        : topic
    ));
  };

  return {
    topics,
    createTopic,
    updateTopic,
    deleteTopic,
    getTopicById,
    addDocumentToTopic,
    removeDocumentFromTopic
  };
};
