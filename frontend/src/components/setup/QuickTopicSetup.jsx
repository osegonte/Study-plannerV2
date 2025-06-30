import React, { useState } from 'react';
import { FolderPlus, BookOpen, Zap, Plus, Check } from 'lucide-react';

const QuickTopicSetup = ({ onCreateTopics, onSkip }) => {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const sampleTopics = [
    { name: 'Mathematics', color: 'blue', description: 'Algebra, Calculus, Statistics' },
    { name: 'Computer Science', color: 'green', description: 'Programming, Algorithms, Data Structures' },
    { name: 'Physics', color: 'purple', description: 'Mechanics, Thermodynamics, Quantum' },
    { name: 'Chemistry', color: 'orange', description: 'Organic, Inorganic, Physical Chemistry' },
    { name: 'Biology', color: 'pink', description: 'Cell Biology, Genetics, Ecology' },
    { name: 'History', color: 'indigo', description: 'World History, Modern History' },
    { name: 'Literature', color: 'red', description: 'Classical and Modern Literature' },
    { name: 'Economics', color: 'yellow', description: 'Micro and Macroeconomics' }
  ];

  const toggleTopic = (topic) => {
    setSelectedTopics(prev => {
      const exists = prev.find(t => t.name === topic.name);
      if (exists) {
        return prev.filter(t => t.name !== topic.name);
      } else {
        return [...prev, topic];
      }
    });
  };

  const addCustomTopic = () => {
    if (customTopic.trim()) {
      const newTopic = {
        name: customTopic.trim(),
        color: 'blue',
        description: 'Custom study topic'
      };
      setSelectedTopics(prev => [...prev, newTopic]);
      setCustomTopic('');
    }
  };

  const handleCreateTopics = async () => {
    if (selectedTopics.length === 0) return;
    
    setIsCreating(true);
    try {
      await onCreateTopics(selectedTopics);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <FolderPlus className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Set Up Your Study Topics</h2>
        <p className="text-gray-600">Choose topics to organize your study materials</p>
      </div>

      {/* Quick Setup Option */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-green-800">Quick Setup</h3>
        </div>
        <p className="text-green-700 text-sm mb-3">
          Create common study topics instantly, or customize below.
        </p>
        <button
          onClick={() => {
            const commonTopics = sampleTopics.slice(0, 4); // First 4 topics
            setSelectedTopics(commonTopics);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
        >
          ⚡ Add Common Topics
        </button>
      </div>

      {/* Sample Topics Grid */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Select Topics:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sampleTopics.map((topic) => {
            const isSelected = selectedTopics.find(t => t.name === topic.name);
            const colorClasses = {
              blue: 'border-blue-300 bg-blue-50 text-blue-800',
              green: 'border-green-300 bg-green-50 text-green-800',
              purple: 'border-purple-300 bg-purple-50 text-purple-800',
              orange: 'border-orange-300 bg-orange-50 text-orange-800',
              pink: 'border-pink-300 bg-pink-50 text-pink-800',
              indigo: 'border-indigo-300 bg-indigo-50 text-indigo-800',
              red: 'border-red-300 bg-red-50 text-red-800',
              yellow: 'border-yellow-300 bg-yellow-50 text-yellow-800'
            };

            return (
              <button
                key={topic.name}
                onClick={() => toggleTopic(topic)}
                className={`p-3 border-2 rounded-lg text-left transition-all ${
                  isSelected 
                    ? `${colorClasses[topic.color]} border-opacity-100` 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{topic.name}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </div>
                <div className="text-xs opacity-75">{topic.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Topic Input */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Add Custom Topic:</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Enter custom topic name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && addCustomTopic()}
          />
          <button
            onClick={addCustomTopic}
            disabled={!customTopic.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Selected Topics Summary */}
      {selectedTopics.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            Selected Topics ({selectedTopics.length}):
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedTopics.map((topic) => (
              <span
                key={topic.name}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {topic.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onSkip}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Skip for now
        </button>
        
        <button
          onClick={handleCreateTopics}
          disabled={selectedTopics.length === 0 || isCreating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isCreating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating...</span>
            </>
          ) : (
            <>
              <FolderPlus className="h-4 w-4" />
              <span>Create {selectedTopics.length} Topic{selectedTopics.length !== 1 ? 's' : ''}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuickTopicSetup;
