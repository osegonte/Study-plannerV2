import React, { useState, useRef } from 'react';
import { Upload, FolderPlus, X, FileText, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

const EnhancedPDFUpload = ({ topics = [], onCreateTopic }) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'uploading', 'success', 'error'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [newTopicData, setNewTopicData] = useState({ name: '', description: '', color: 'blue' });
  const fileInputRef = useRef(null);
  
  const { addDocumentToTopic, createTopic } = useStudyPlanner();

  const TOPIC_COLORS = [
    { name: 'Blue', value: 'blue', color: '#3B82F6' },
    { name: 'Green', value: 'green', color: '#10B981' },
    { name: 'Purple', value: 'purple', color: '#8B5CF6' },
    { name: 'Orange', value: 'orange', color: '#F59E0B' },
    { name: 'Pink', value: 'pink', color: '#EC4899' },
    { name: 'Red', value: 'red', color: '#EF4444' }
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    if (!selectedTopic) {
      setErrorMessage('Please select a topic first');
      setUploadStatus('error');
      return;
    }

    // Filter only PDF files
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      setErrorMessage('Please select only PDF files');
      setUploadStatus('error');
      return;
    }

    if (pdfFiles.length !== files.length) {
      setErrorMessage(`${files.length - pdfFiles.length} non-PDF files were skipped`);
    }

    setUploadStatus('uploading');
    const uploadedFilesList = [];

    try {
      for (const file of pdfFiles) {
        // Validate file size (50MB limit for better performance)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 50MB)`);
        }

        // Add document to the selected topic
        const newDoc = await addDocumentToTopic(selectedTopic, file);
        uploadedFilesList.push(newDoc);
      }

      setUploadedFiles(uploadedFilesList);
      setUploadStatus('success');
      setErrorMessage('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      setErrorMessage(error.message);
      setUploadStatus('error');
    }
  };

  const clearStatus = () => {
    setUploadStatus(null);
    setUploadedFiles([]);
    setErrorMessage('');
  };

  const handleCreateTopic = (e) => {
    e.preventDefault();
    if (!newTopicData.name.trim()) return;

    const newTopic = createTopic(newTopicData);
    setSelectedTopic(newTopic.id);
    setShowTopicForm(false);
    setNewTopicData({ name: '', description: '', color: 'blue' });
  };

  if (topics.length === 0 && !showTopicForm) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <FolderPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Topics Available</h3>
        <p className="text-gray-600 mb-4">Create a topic first to upload PDFs.</p>
        <button
          onClick={() => setShowTopicForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Topic
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topic Selection */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Select Topic</h3>
          <button
            onClick={() => setShowTopicForm(!showTopicForm)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Topic</span>
          </button>
        </div>

        {showTopicForm && (
          <form onSubmit={handleCreateTopic} className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Topic name"
                value={newTopicData.name}
                onChange={(e) => setNewTopicData({...newTopicData, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newTopicData.description}
                onChange={(e) => setNewTopicData({...newTopicData, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap gap-2">
                {TOPIC_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewTopicData({...newTopicData, color: color.value})}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newTopicData.color === color.value ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                  Create
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowTopicForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

                  <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a topic...</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>{topic.name}</option>
          ))}
        </select>
        
        {selectedTopic && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Selected: <strong>{topics.find(t => t.id === selectedTopic)?.name}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Upload Area */}
      {selectedTopic && (
        <div className="bg-white border rounded-lg p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              isDragOver
                ? 'border-blue-400 bg-blue-50'
                : uploadStatus === 'success'
                ? 'border-green-400 bg-green-50'
                : uploadStatus === 'error'
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadStatus === 'uploading' && (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h4 className="text-lg font-medium text-blue-800">Processing PDFs...</h4>
                <p className="text-blue-600">Please wait while we upload and process your files</p>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="flex flex-col items-center">
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <h4 className="text-lg font-medium text-green-800">Upload Successful!</h4>
                <p className="text-green-600 mb-4">
                  {uploadedFiles.length} PDF{uploadedFiles.length !== 1 ? 's' : ''} uploaded successfully
                </p>
                <div className="space-y-2 mb-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-green-700">
                      <FileText className="h-4 w-4" />
                      <span>{file.name}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={clearStatus}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Upload More Files
                </button>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex flex-col items-center">
                <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                <h4 className="text-lg font-medium text-red-800">Upload Failed</h4>
                <p className="text-red-600 mb-4">{errorMessage}</p>
                <button
                  onClick={clearStatus}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {!uploadStatus && (
              <>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">Upload PDF Files</h4>
                <p className="text-gray-600 mb-4">
                  Drag & drop PDF files here, or click to select files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Choose Files</span>
                </label>
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>• Maximum file size: 50MB per file</p>
                  <p>• Supported format: PDF only</p>
                  <p>• Multiple files can be uploaded at once</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recent Uploads */}
      {uploadedFiles.length > 0 && uploadStatus === 'success' && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recently Uploaded</h3>
          <div className="space-y-2">
            {uploadedFiles.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-sm text-gray-500">
                      {(doc.size / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  </div>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  ✓ Uploaded
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📚 Upload Tips</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>• <strong>Organize by topics:</strong> Create topics like "Mathematics", "History", etc.</p>
          <p>• <strong>File names matter:</strong> Use descriptive names for easy identification</p>
          <p>• <strong>Batch upload:</strong> Select multiple PDFs at once to save time</p>
          <p>• <strong>Start reading:</strong> After upload, start reading to track your progress</p>
          <p>• <strong>File limit:</strong> Keep files under 50MB for best performance</p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFUpload;
