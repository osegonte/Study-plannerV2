import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, FolderPlus } from 'lucide-react';

const EnhancedPDFUpload = ({ topics, onUpload, onCreateTopic }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file) => {
    const errors = [];
    if (!file) {
      errors.push('No file selected');
      return { isValid: false, errors };
    }
    if (file.type !== 'application/pdf') {
      errors.push('Only PDF files are supported');
    }
    if (file.size > 100 * 1024 * 1024) {
      errors.push('File size must be less than 100MB');
    }
    if (file.size === 0) {
      errors.push('File appears to be empty');
    }
    return { isValid: errors.length === 0, errors };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file) => {
    setUploadError(null);
    const validation = validateFile(file);
    if (!validation.isValid) {
      setUploadError(validation.errors.join(', '));
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedTopicId) {
      setUploadError('Please select a file and topic');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const metadata = {
        topicId: selectedTopicId,
        uploadedAt: new Date().toISOString()
      };

      await onUpload(selectedFile, metadata);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError(error.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="space-y-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : uploadError
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          {selectedFile ? (
            <div className="space-y-3">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">File Selected</h3>
                <p className="text-green-700">{selectedFile.name}</p>
                <p className="text-sm text-green-600">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={clearSelection}
                className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-800"
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
                <span>Choose Different File</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className={`h-12 w-12 mx-auto ${
                dragActive ? 'text-blue-600' : uploadError ? 'text-red-600' : 'text-gray-400'
              }`} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {dragActive ? 'Drop PDF here' : 'Upload PDF File'}
                </h3>
                <p className="text-gray-600">
                  Drag and drop your PDF here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports PDF files up to 100MB
                </p>
              </div>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Upload Error</h3>
                <p className="text-red-700 text-sm">{uploadError}</p>
              </div>
            </div>
          </div>
        )}

        {selectedFile && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Topic *
              </label>
              {topics.length === 0 ? (
                <div className="text-center py-4 border border-gray-200 rounded-lg">
                  <FolderPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-3">No topics available</p>
                  <button
                    onClick={onCreateTopic}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    disabled={isUploading}
                  >
                    Create your first topic
                  </button>
                </div>
              ) : (
                <select
                  value={selectedTopicId || ''}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isUploading}
                  required
                >
                  <option value="">Select a topic...</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedTopicId || isUploading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload and Start Reading</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">📚 Upload Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure your PDF is not password protected</li>
            <li>• Smaller files load faster and perform better</li>
            <li>• Files are only available during your current session</li>
            <li>• You'll need to re-upload files after refreshing the page</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFUpload;
