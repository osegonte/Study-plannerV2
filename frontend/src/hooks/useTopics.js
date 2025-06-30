import { useState, useEffect } from 'react';
import { localFileManager } from '../utils/localFileManager';

const STORAGE_KEY = 'pdf-study-planner-topics';

export const useTopics = () => {
  const [topics, setTopics] = useState([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Enhanced load function with persistent storage
  const loadTopics = async () => {
    try {
      // Try to load from persistent storage first
      if (window.persistentStorage) {
        const persistentData = await window.persistentStorage.loadFromFile('topics');
        if (persistentData && Array.isArray(persistentData)) {
          setTopics(persistentData);
          // Also save to localStorage for backup
          localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentData));
          console.log('📁 Loaded topics from persistent storage');
          return;
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setTopics(data);
        console.log('📁 Loaded topics from localStorage');
      }
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  };

  // Enhanced save function with persistent storage
  const saveTopics = async (topicsData) => {
    try {
      // Save to localStorage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(topicsData));
      
      // Save to persistent storage if available
      if (window.persistentStorage) {
        await window.persistentStorage.saveToFile('topics', topicsData);
        console.log('💾 Saved topics to persistent storage');
      }
    } catch (error) {
      console.error('Failed to save topics:', error);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    if (topics.length > 0) {
      saveTopics(topics);
    }
  }, [topics]);

  const createTopic = async (topicData) => {
    setIsCreatingFolder(true);
    
    try {
      const newTopic = {
        id: Date.now().toString(),
        name: topicData.name.trim(),
        description: topicData.description?.trim() || '',
        color: topicData.color || 'blue',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documents: [],
        folderPath: null,
        folderCreatedAt: null
      };

      const updatedTopics = [...topics, newTopic];
      setTopics(updatedTopics);

      try {
        const folderPath = await localFileManager.createTopicFolder(newTopic);
        
        const topicsWithFolder = updatedTopics.map(topic => 
          topic.id === newTopic.id 
            ? { ...topic, folderPath, folderCreatedAt: new Date().toISOString() }
            : topic
        );
        setTopics(topicsWithFolder);

        if (window.showNotification) {
          window.showNotification(`✅ Topic "${newTopic.name}" created! Folder planned for creation.`, 'success');
        } else {
          console.log(`✅ Topic "${newTopic.name}" created! Folder planned for creation.`);
        }
        
      } catch (folderError) {
        console.warn('Failed to plan folder creation:', folderError);
        
        if (window.showNotification) {
          window.showNotification(
            `⚠️ Topic "${newTopic.name}" created, but folder planning failed.`, 
            'warning'
          );
        }
      }

      return newTopic;
      
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const updateTopic = (topicId, updates) => {
    setTopics(prev => prev.map(topic => 
      topic.id === topicId 
        ? { ...topic, ...updates, updatedAt: new Date().toISOString() }
        : topic
    ));
  };

  const deleteTopic = (topicId) => {
    const topicToDelete = topics.find(topic => topic.id === topicId);
    
    if (topicToDelete && window.confirm(`Delete "${topicToDelete.name}"?`)) {
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
    isCreatingFolder,
    createTopic,
    updateTopic,
    deleteTopic,
    getTopicById,
    addDocumentToTopic,
    removeDocumentFromTopic
  };
};
