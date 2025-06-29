import { useState, useEffect } from 'react';
import { localFileManager } from '../utils/localFileManager';

const STORAGE_KEY = 'pdf-study-planner-topics';

export const useTopics = () => {
  const [topics, setTopics] = useState([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
    } catch (error) {
      console.error('Failed to save topics to localStorage:', error);
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

      setTopics(prev => [...prev, newTopic]);

      try {
        const folderPath = await localFileManager.createTopicFolder(newTopic);
        
        setTopics(prev => prev.map(topic => 
          topic.id === newTopic.id 
            ? { ...topic, folderPath, folderCreatedAt: new Date().toISOString() }
            : topic
        ));

        if (window.showNotification) {
          window.showNotification(`✅ Topic "${newTopic.name}" created! Folder planned for creation.`, 'success');
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

  return {
    topics,
    isCreatingFolder,
    createTopic,
    updateTopic,
    deleteTopic,
    getTopicById
  };
};
