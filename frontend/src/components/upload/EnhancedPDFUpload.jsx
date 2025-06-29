// components/upload/EnhancedPDFUpload.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Folder } from 'lucide-react';
import { pdfFileHandler } from '../../utils/pdfFileHandler';
import TopicSelector from '../topics/TopicSelector';

const EnhancedPDFUpload = ({ topics, onUpload, onCreateTopic, onStartReading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processingFiles, setProcessingFiles] = useState(new Set());
  const [processedFiles, setProcessedFiles] = useState(new Map());
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(topics[0]?.id || '');
  const [showTopicSelector, setShowTopicSelector] = useState(false);

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  // Validate PDF file
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

  // Process uploaded files
  const processFiles = useCallback(async (files) => {
    setError(null);
    const fileList = Array.from(files);
    
    // Validate all files first
    const validationResults = fileList.map(file => ({
      file,
      ...validateFile(file)
    }));
    
    const invalidFiles = validationResults.filter(result => !result.isValid);
    if (invalidFiles.length > 0) {
      const errorMessage = invalidFiles
        .map(result => `${result.file.name}: ${result.errors.join(', ')}`)
        .join('\n');
      setError(errorMessage);
      return;
    }
    
    // Add valid files to selected files
    const validFiles = validationResults
      .filter(result => result.isValid)
      .map(result => ({
        id: `${result.file.name}-${result.file.size}-${result.file.lastModified}`,
        file: result.file,
        name: result.file.name,
        size: result.file.size,
        status: 'pending'
      }));
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Process each file
    for (const fileData of validFiles) {
      try {
        setProcessingFiles(prev => new Set(prev).add(fileData.id));
        
        console.log('🔄 Processing file:', fileData.name);
        const cacheKey = await pdfFileHandler.processFile(fileData.file);
        
        setProcessedFiles(prev => new Map(prev).set(fileData.id, cacheKey));
        setSelectedFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'processed', cacheKey }
            : f
        ));
        
        console.log('✅ File processed:', fileData.name);
        
      } catch (error) {
        console.error('❌ Error processing file:', fileData.name, error);
        setSelectedFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));
      } finally {
        setProcessingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileData.id);
          return newSet;
        });
      }
    }
  }, []);

  // Handle file input change
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
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
      processFiles(files);
    }
  };

  // Remove file from selection
  const removeFile = (fileId) => {
    const fileData = selectedFiles.find(f => f.id === fileId);
    if (fileData?.cacheKey) {
      pdfFileHandler.removeFile(fileData.cacheKey);
    }
    
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    setProcessedFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  };

  // Upload files to topic
  const handleUploadToTopic = async () => {
    if (!selectedTopic) {
      setError('Please select a topic first');
      return;
    }
    
    const processedFilesList = selectedFiles.filter(f => f.status === 'processed');
    if (processedFilesList.length === 0) {
      setError('No processed files to upload');
      return;
    }
    
    try {
      for (const fileData of processedFilesList) {
        // Create document metadata
        const documentData = await onUpload(fileData.file, {
          topicId: selectedTopic,
          cacheKey: fileData.cacheKey,
          processedAt: Date.now()
        });
        
        console.log('📚 Document created:', documentData);
      }
      
      // Clear selected files after successful upload
      setSelectedFiles([]);
      setProcessedFiles(new Map());
      setError(null);
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      setError(`Failed to upload files: ${error.message}`);
    }
  };

  // Start reading a specific file
  const handleStartReading = (fileData) => {
    if (fileData.status !== 'processed' || !fileData.cacheKey) {
      setError('File is not ready for reading');
      return;
    }
    
    if (onStartReading) {
      onStartReading(fileData.cacheKey, fileData.file, selectedTopic);
    }
  };

  return (
    <div className="space-y-6">
      {/* Topic Selection */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Topic</h3>
          <button
            onClick={() => setShowTopicSelector(!showTopicSelector)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showTopicSelector ? 'Hide Topics' : 'Show All Topics'}
          </button>
        </div>
        
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
        ) : showTopicSelector ? (
          <TopicSelector
            topics={topics}
            selectedTopicId={selectedTopic}
            onSelectTopic={setSelectedTopic}
            onCreateNew={onCreateTopic}
          />
        ) : (
          <div className="flex items-center space-x-3">
            <Folder className="h-5 w-5 text-blue-600" />
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a topic...</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload PDF Files</h3>
        
        {/* Drag and Drop Area */}
        <div
          ref={dropRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${
            dragActive ? 'text-blue-600' : 'text-gray-400'
          }`} />
          
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            {dragActive ? 'Drop files here' : 'Upload PDF files'}
          </h4>
          
          <p className="text-gray-600 mb-4">
            Drag and drop PDF files here, or click to select files
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-5 w-5 mr-2" />
            Select PDF Files
          </button>
          
          <p className="text-xs text-gray-500 mt-3">
            Maximum file size: 100MB per file
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Upload Error</h4>
                <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{error}</pre>
              </div>
            </div>
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
                      {fileData.status === 'error' && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {fileData.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Status Indicator */}
                    {processingFiles.has(fileData.id) && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    
                    {fileData.status === 'processed' && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <button
                          onClick={() => handleStartReading(fileData)}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          Read
                        </button>
                      </>
                    )}
                    
                    {fileData.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    
                    <button
                      onClick={() => removeFile(fileData.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove file"
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
                disabled={
                  !selectedTopic || 
                  selectedFiles.filter(f => f.status === 'processed').length === 0
                }
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Upload to Topic ({selectedFiles.filter(f => f.status === 'processed').length} files)
              </button>
            </div>
          </div>
        )}

        {/* Cache Statistics */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Cache Stats (Development)</h4>
            <div className="text-xs text-gray-600">
              Files in cache: {pdfFileHandler.getCacheStats().fileCount} |
              Total size: {pdfFileHandler.getCacheStats().totalSizeMB} MB
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPDFUpload;