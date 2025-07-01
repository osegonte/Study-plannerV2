import React, { useState } from 'react';
import { Upload, FolderPlus } from 'lucide-react';

const EnhancedPDFUpload = ({ topics = [], onCreateTopic }) => {
  const [selectedTopic, setSelectedTopic] = useState('');

  if (topics.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <FolderPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Topics Available</h3>
        <p className="text-gray-600 mb-4">Create a topic first to upload PDFs.</p>
        <button
          onClick={onCreateTopic}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Topic
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Select Topic</h3>
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a topic...</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>{topic.name}</option>
          ))}
        </select>
      </div>

      {selectedTopic && (
        <div className="bg-white border rounded-lg p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">Upload PDF Files</h4>
            <p className="text-gray-600">Drag & drop or click to select PDF files</p>
            <input
              type="file"
              accept=".pdf"
              multiple
              className="mt-4"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPDFUpload;
