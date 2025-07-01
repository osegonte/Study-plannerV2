import React, { useState } from 'react';
import { Upload, AlertTriangle } from 'lucide-react';

const EnhancedPDFUpload = ({ topics = [], onUpload, onCreateTopic }) => {
  const [selectedTopic, setSelectedTopic] = useState('');

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || !selectedTopic) return;

    for (const file of files) {
      if (file.type === 'application/pdf') {
        try {
          await onUpload(file, { topicId: selectedTopic });
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic PDF Upload</h3>
          <p className="text-gray-600 mb-4">
            Replace with Enhanced PDF Upload component for full functionality
          </p>
          
          {topics.length > 0 && (
            <div className="space-y-4 max-w-md mx-auto">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select a topic...</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
              
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
          
          {topics.length === 0 && (
            <button
              onClick={onCreateTopic}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create a topic first
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFUpload;
