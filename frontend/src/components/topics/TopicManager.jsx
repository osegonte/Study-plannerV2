import React, { useState } from 'react';
import { Plus, Edit3, Trash2, FolderPlus, Check, X } from 'lucide-react';

const TOPIC_COLORS = [
  { name: 'Blue', value: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800' },
  { name: 'Green', value: 'green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800' },
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800' },
  { name: 'Red', value: 'red', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' }
];

const TopicManager = ({ topics, onCreateTopic, onUpdateTopic, onDeleteTopic }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: 'blue' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) {
      onUpdateTopic(editingId, formData);
      setEditingId(null);
    } else {
      onCreateTopic(formData);
      setIsCreating(false);
    }
    
    setFormData({ name: '', description: '', color: 'blue' });
  };

  const startEdit = (topic) => {
    setFormData({ name: topic.name, description: topic.description, color: topic.color });
    setEditingId(topic.id);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '', description: '', color: 'blue' });
  };

  const getColorClasses = (colorName) => {
    return TOPIC_COLORS.find(c => c.value === colorName) || TOPIC_COLORS[0];
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FolderPlus className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Topic Management</h2>
        </div>
        
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Topic</span>
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mathematics, History, Science"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional description for this topic"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Theme
              </label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                      formData.color === color.value
                        ? `${color.bg} ${color.border} ${color.text} border-opacity-100`
                        : `${color.bg} ${color.text} border-transparent hover:${color.border}`
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="h-4 w-4 inline mr-1" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>{editingId ? 'Update Topic' : 'Create Topic'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Topics List */}
      <div className="space-y-3">
        {topics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No topics yet. Create your first topic to organize your PDFs!</p>
          </div>
        ) : (
          topics.map((topic) => {
            const colorClasses = getColorClasses(topic.color);
            return (
              <div
                key={topic.id}
                className={`p-4 rounded-lg border-2 ${colorClasses.bg} ${colorClasses.border} ${colorClasses.text}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{topic.name}</h3>
                    {topic.description && (
                      <p className="text-sm mt-1 opacity-80">{topic.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span>{topic.documents?.length || 0} PDFs</span>
                      <span>Created {new Date(topic.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEdit(topic)}
                      className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                      title="Edit topic"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTopic(topic.id)}
                      className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete topic"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TopicManager;
