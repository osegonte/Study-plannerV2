import React, { useState } from 'react';
import { Plus, FolderPlus } from 'lucide-react';

const EnhancedTopicManager = ({ topics = [], onCreateTopic }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: 'blue' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreateTopic(formData);
      setFormData({ name: '', description: '', color: 'blue' });
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Study Topics</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Topic</span>
        </button>
      </div>

      {isCreating && (
        <div className="bg-white border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Topic name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex space-x-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Create
              </button>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {topics.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FolderPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No topics yet. Create your first topic!</p>
          </div>
        ) : (
          topics.map((topic) => (
            <div key={topic.id} className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold">{topic.name}</h3>
              {topic.description && <p className="text-sm text-gray-600">{topic.description}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EnhancedTopicManager;
