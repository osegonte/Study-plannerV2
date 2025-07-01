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

const TopicManager = ({ 
  topics, 
  documents = [], 
  onCreateTopic, 
  onUpdateTopic, 
  onDeleteTopic, 
  onUploadPDF,
  onStartReading 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: 'blue' });
  const [uploadingToTopic, setUploadingToTopic] = useState(null);

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
          await onUploadPDF(file, { topicId });
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
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

  const estimateTimeRemaining = (doc) => {
    const pageTimes = doc.pageTimes || {};
    const pagesRead = Object.keys(pageTimes).length;
    
    if (pagesRead === 0) return 'No data';
    
    const avgTimePerPage = Object.values(pageTimes).reduce((sum, time) => sum + time, 0) / pagesRead;
    const pagesRemaining = Math.max(doc.totalPages - doc.currentPage, 0);
    const timeRemainingSeconds = avgTimePerPage * pagesRemaining;
    
    const hours = Math.floor(timeRemainingSeconds / 3600);
    const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `~${hours}h ${minutes}m remaining`;
    }
    return `~${minutes}m remaining`;
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
                    className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg border-2 transition-all hover:scale-105 ${
                      formData.color === color.value
                        ? 'border-gray-400 bg-gray-100'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    title={color.name}
                  >
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color.color }}
                    ></div>
                    <span>{color.name}</span>
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
      <div className="space-y-4">
        {topics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No topics yet. Create your first topic to organize your PDFs!</p>
          </div>
        ) : (
          topics.map((topic) => {
            const colorInfo = getColorInfo(topic.color);
            const topicDocs = getTopicDocuments(topic.id);
            
            return (
              <div
                key={topic.id}
                className="border-2 rounded-lg p-6 bg-white hover:shadow-md transition-all"
                style={{ borderColor: colorInfo.color + '30' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: colorInfo.color }}
                    ></div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{topic.name}</h3>
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
                      onClick={() => onDeleteTopic(topic.id)}
                      className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete topic"
                    >
                      <Trash2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Topic Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold" style={{ color: colorInfo.color }}>
                      {topicDocs.length}
                    </div>
                    <div className="text-gray-600">PDFs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold" style={{ color: colorInfo.color }}>
                      {topicDocs.reduce((sum, doc) => sum + (doc.totalPages || 0), 0)}
                    </div>
                    <div className="text-gray-600">Total Pages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold" style={{ color: colorInfo.color }}>
                      {topicDocs.reduce((sum, doc) => sum + Object.keys(doc.pageTimes || {}).length, 0)}
                    </div>
                    <div className="text-gray-600">Pages Read</div>
                  </div>
                </div>

                {/* Upload PDFs */}
                <div className="mb-4">
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
                    className={`flex items-center justify-center space-x-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      uploadingToTopic === topic.id
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                    style={{ 
                      borderColor: uploadingToTopic !== topic.id ? colorInfo.color + '50' : undefined,
                      backgroundColor: uploadingToTopic !== topic.id ? colorInfo.color + '10' : undefined
                    }}
                  >
                    {uploadingToTopic === topic.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span className="text-gray-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" style={{ color: colorInfo.color }} />
                        <span style={{ color: colorInfo.color }}>Upload PDFs to this topic</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Document List */}
                {topicDocs.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 mb-2">Documents:</h4>
                    {topicDocs.map((doc) => {
                      const progress = calculateProgress(doc);
                      const hasReadingData = Object.keys(doc.pageTimes || {}).length > 0;
                      
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                                  {formatReadingTime(doc.pageTimes)} read • {estimateTimeRemaining(doc)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Progress Circle */}
                            <div className="relative w-8 h-8">
                              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                                <circle
                                  cx="16"
                                  cy="16"
                                  r="14"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="2"
                                />
                                <circle
                                  cx="16"
                                  cy="16"
                                  r="14"
                                  fill="none"
                                  stroke={colorInfo.color}
                                  strokeWidth="2"
                                  strokeDasharray={`${2 * Math.PI * 14}`}
                                  strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
                                  className="transition-all duration-300"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-medium">{progress}%</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => onStartReading && onStartReading(doc)}
                              className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors"
                              style={{ 
                                backgroundColor: colorInfo.color + '20',
                                color: colorInfo.color
                              }}
                            >
                              <Play className="h-3 w-3" />
                              <span>{progress > 0 ? 'Continue' : 'Start'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {topicDocs.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No PDFs uploaded yet. Upload your first PDF to get started!
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

export default TopicManager;
