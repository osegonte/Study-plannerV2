import React from 'react';
import { Folder, Plus } from 'lucide-react';

const TopicSelector = ({ topics, selectedTopicId, onSelectTopic, onCreateNew, showCreateButton = true }) => {
  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300',
      pink: 'bg-pink-100 text-pink-800 border-pink-300',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      red: 'bg-red-100 text-red-800 border-red-300'
    };
    return colorMap[color] || colorMap.blue;
  };

  if (topics.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 mb-3">No topics available</p>
        {showCreateButton && onCreateNew && (
          <button
            onClick={onCreateNew}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Create your first topic
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Topic
      </label>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {topics.map((topic) => {
          const colorClasses = getColorClasses(topic.color);
          const isSelected = selectedTopicId === topic.id;
          
          return (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? `${colorClasses} border-opacity-100`
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Folder className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{topic.name}</div>
                  {topic.description && (
                    <div className="text-sm opacity-75 mt-1">{topic.description}</div>
                  )}
                  <div className="text-xs opacity-60 mt-1">
                    {topic.documents?.length || 0} PDFs
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {showCreateButton && onCreateNew && (
        <button
          onClick={onCreateNew}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Topic</span>
        </button>
      )}
    </div>
  );
};

export default TopicSelector;
