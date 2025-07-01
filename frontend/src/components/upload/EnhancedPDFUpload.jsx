import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Folder } from 'lucide-react';

const EnhancedPDFUpload = ({ topics, onUpload, onCreateTopic }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(topics[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef(null);

  // Enhanced file validation
  const validateFile = (file) => {
    const errors = [];
    
    if (file.type !== 'application/pdf') {
      errors.push('Only PDF files are allowed');
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      errors.push('File size must be less than 100MB');
    }
    
    if (file.size < 1024) { // Minimum 1KB
      errors.push('File appears to be empty or corrupted');
    }
    
    return { isValid: errors.length === 0, errors };
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file input change
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(Array.from(files));
    }
    e.target.value = ''; // Reset input
  };

  // Process files for upload
  const processFiles = async (files) => {
    setError(null);
    setIsProcessing(true);
    
    try {
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          setError(`${file.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        const processedFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          status: 'ready',
          processedAt: Date.now()
        };

        setSelectedFiles(prev => [...prev, processedFile]);
      }
    } catch (error) {
      console.error('Error in processFiles:', error);
      setError(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle drag and drop
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
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  // Remove file from selection
  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Upload to topic
  const handleUploadToTopic = async () => {
    if (!selectedTopic) {
      setError('Please select a topic first');
      return;
    }
    
    const filesToUpload = selectedFiles.filter(f => f.status === 'ready');
    if (filesToUpload.length === 0) {
      setError('No files ready to upload');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      for (const fileData of filesToUpload) {
        try {
          await onUpload(fileData.file, {
            topicId: selectedTopic
          });
        } catch (fileUploadError) {
          console.error(`Upload failed for ${fileData.name}:`, fileUploadError);
          setError(`Upload failed for ${fileData.name}: ${fileUploadError.message}`);
        }
      }
      
      // Clear files after successful upload
      setSelectedFiles([]);
      setError(null);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get topic information
  const getTopicInfo = (topicId) => {
    const topic = topics.find(t => t.id === topicId);
    return topic || null;
  };

  const selectedTopicInfo = getTopicInfo(selectedTopic);

  return (
    <div className="space-y-6">
      {/* Topic Selection */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Topic</h3>
        
        {topics.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">No topics available</p>
            <button
              onClick={onCreateTopic}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Create your first topic
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            >
              <option value="">Select a topic...</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>

            {/* Topic Info */}
            {selectedTopicInfo && (
              <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {selectedTopicInfo.name}
                  </span>
                </div>
                {selectedTopicInfo.description && (
                  <div className="text-xs text-blue-700 mt-1">
                    {selectedTopicInfo.description}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload PDF Files</h3>
        
        {/* Drag and Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${
            dragActive ? 'text-blue-600' : 'text-gray-400'
          }`} />
          
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {isProcessing ? 'Processing files...' : dragActive ? 'Drop files here' : 'Upload PDF files'}
          </h4>
          
          <p className="text-gray-600 mb-4">
            {isProcessing 
              ? 'Please wait while we process your PDFs...'
              : 'Drag and drop PDF files here, or click to select files'
            }
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-5 w-5 mr-2" />
            {isProcessing ? 'Processing...' : 'Select PDF Files'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Upload Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* File List */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Selected Files ({selectedFiles.length})
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedFiles.map((fileData) => (
                <div
                  key={fileData.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-red-600 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileData.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileData.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {fileData.status === 'ready' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    
                    <button
                      onClick={() => removeFile(fileData.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove file"
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Upload Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUploadToTopic}
                disabled={!selectedTopic || selectedFiles.length === 0 || isProcessing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPDFUpload;
