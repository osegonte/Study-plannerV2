import React, { useState } from 'react';
import { Plus, Edit3, Trash2, FolderPlus, Check, X, Upload, FileText, Play } from 'lucide-react';

const TOPIC_COLORS = [
  { name: 'Blue', value: 'blue', color: '#3B82F6' },
  { name: 'Green', value: 'green', color: '#10B981' },
  { name: 'Purple', value: 'purple', color: '#8B5CF6' },
  { name: 'Orange', value: 'orange', color: '#F59E0B' },
  { name: 'Pink', value: 'pink', color: '#EC4899' },
  { name: 'Indigo', value: 'indigo', color: '#6366F1' },
  { name: 'Yellow', value: 'yellow', color: '#EAB308' },
  { name: 'Red', value: 'red', color: '#EF4444' }
];

const EnhancedTopicManager = ({ 
  topics = [], 
  documents = [], 
  onCreateTopic, 
  onUpdateTopic, 
  onDeleteTopic,
  onStartReading
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: 'blue' });
  const [uploadingToTopic, setUploadingToTopic] = useState(null);

  const { addDocumentToTopic } = require('../../contexts/StudyPlannerContext').useStudyPlanner();

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
    setFormData({ name: topic.name, description: topic.description || '', color: topic.color });
    setEditingId(topic.id);
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '', description: '', color: 'blue' });
  };

  const getColorInfo = (colorName) => {
    return TOPIC_COLORS.find(c => c.value === colorName) || TOPIC_COLORS[0];
  };

  const getTopicDocuments = (topicId) => {
    return documents.filter(doc => doc.topicId === topicId);
  };

  const handleFileUpload = async (event, topicId) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingToTopic(topicId);
    
    try {
      for (const file of files) {
        if (file.type === 'application/pdf') {
          await addDocumentToTopic(topicId, file);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploadingToTopic(null);
      event.target.value = ''; // Reset input
    }
  };

  const calculateProgress = (doc) => {
    if (!doc.totalPages || doc.totalPages === 0) return 0;
    return Math.round((doc.currentPage / doc.totalPages) * 100);
  };

  const formatReadingTime = (pageTimes) => {
    const totalSeconds = Object.values(pageTimes || {}).reduce((sum, time) => sum + time, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FolderPlus className="h-5 w-5 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Study Topics</h1>
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
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-white rounded-lg border shadow-sm">
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
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Color Theme
              </label>
              <div className="flex flex-wrap gap-3">
                {TOPIC_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all hover:scale-110 ${
                      formData.color === color.value
                        ? 'border-gray-400 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                  >
                    {formData.color === color.value && (
                      <Check className="h-6 w-6 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>{editingId ? 'Update Topic' : 'Create Topic'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Topics List */}
      <div className="space-y-4">
        {topics.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <FolderPlus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Topics Yet</h3>
            <p className="text-gray-500 mb-4">Create your first topic to organize your PDFs!</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create First Topic</span>
            </button>
          </div>
        ) : (
          topics.map((topic) => {
            const colorInfo = getColorInfo(topic.color);
            const topicDocs = getTopicDocuments(topic.id);
            
            return (
              <div
                key={topic.id}
                className="border rounded-lg p-6 bg-white hover:shadow-lg transition-all"
                style={{ borderLeftWidth: '4px', borderLeftColor: colorInfo.color }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex-shrink-0"
                      style={{ backgroundColor: colorInfo.color }}
                    ></div>
                    <div>
                      <h3 className="font-semibold text-xl text-gray-900">{topic.name}</h3>
                      {topic.description && (
                        <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEdit(topic)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit topic"
                    >
                      <Edit3 className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${topic.name}" and all its documents?`)) {
                          onDeleteTopic(topic.id);
                        }
                      }}
                      className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete topic"
                    >
                      <Trash2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Topic Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{topicDocs.length}</div>
                    <div className="text-gray-600">PDFs</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {topicDocs.reduce((sum, doc) => sum + (doc.totalPages || 0), 0)}
                    </div>
                    <div className="text-gray-600">Total Pages</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {topicDocs.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0)}
                    </div>
                    <div className="text-gray-600">Pages Read</div>
                  </div>
                </div>

                {/* Upload PDFs */}
                <div className="mb-6">
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => handleFileUpload(e, topic.id)}
                    className="hidden"
                    id={`upload-${topic.id}`}
                    disabled={uploadingToTopic === topic.id}
                  />
                  <label
                    htmlFor={`upload-${topic.id}`}
                    className={`flex items-center justify-center space-x-3 w-full px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      uploadingToTopic === topic.id
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {uploadingToTopic === topic.id ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                        <span className="text-gray-600 font-medium">Uploading PDFs...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-blue-600" />
                        <span className="text-blue-600 font-medium">Upload PDFs to this topic</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Document List */}
                {topicDocs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents ({topicDocs.length})
                    </h4>
                    {topicDocs.map((doc) => {
                      const progress = calculateProgress(doc);
                      const hasReadingData = Object.keys(doc.pageTimes || {}).length > 0;
                      
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-red-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{doc.name}</div>
                              <div className="text-sm text-gray-500">
                                Page {doc.currentPage || 1} of {doc.totalPages || '?'} • {progress}% complete
                              </div>
                              {hasReadingData && (
                                <div className="text-xs text-gray-500">
                                  {formatReadingTime(doc.pageTimes)} read
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {/* Progress Circle */}
                            <div className="relative w-10 h-10">
                              <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="16"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="3"
                                />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="16"
                                  fill="none"
                                  stroke={colorInfo.color}
                                  strokeWidth="3"
                                  strokeDasharray={`${2 * Math.PI * 16}`}
                                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress / 100)}`}
                                  className="transition-all duration-300"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-semibold">{progress}%</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => onStartReading && onStartReading(doc)}
                              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              style={{ 
                                backgroundColor: colorInfo.color + '20',
                                color: colorInfo.color
                              }}
                            >
                              <Play className="h-4 w-4" />
                              <span>{progress > 0 ? 'Continue' : 'Start'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {topicDocs.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No PDFs uploaded yet.</p>
                    <p>Upload your first PDF to get started!</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EnhancedTopicManager;
