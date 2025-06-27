// Enhanced PDF Upload Component with Academic Organization
// frontend/src/components/upload/EnhancedPDFUpload.jsx

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Plus, Tag, Calendar, User, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { FileManager } from '../../utils/fileManager';

const EnhancedPDFUpload = ({ topics, onUpload, onCreateTopic }) => {
  const { currentUser } = useUser();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMode, setUploadMode] = useState('single'); // single, batch
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [fileMetadata, setFileMetadata] = useState({
    topicId: '',
    customName: '',
    course: '',
    professor: '',
    semester: '',
    chapter: '',
    assignment: '',
    tags: [],
    difficulty: 'medium',
    priority: 'normal'
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const fileManager = new FileManager(currentUser?.id);

  // Drag and drop handlers
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

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      setErrors({ files: 'Please select valid PDF files only' });
      return;
    }

    if (pdfFiles.length > 10) {
      setErrors({ files: 'Maximum 10 files can be uploaded at once' });
      return;
    }

    // Validate each file
    const validatedFiles = pdfFiles.map(file => {
      const validation = fileManager.validatePDFFile(file);
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        validation,
        metadata: { ...fileMetadata }
      };
    });

    setSelectedFiles(validatedFiles);
    setErrors({});
    
    if (validatedFiles.length > 1) {
      setUploadMode('batch');
    }
  };

  const removeFile = (fileId) => {
    setSelectedFiles(files => files.filter(f => f.id !== fileId));
  };

  const updateFileMetadata = (fileId, field, value) => {
    setSelectedFiles(files => 
      files.map(f => 
        f.id === fileId 
          ? { ...f, metadata: { ...f.metadata, [field]: value } }
          : f
      )
    );
  };

  const addTag = () => {
    if (newTag.trim() && !fileMetadata.tags.includes(newTag.trim())) {
      setFileMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFileMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!fileMetadata.topicId) {
      setErrors({ topic: 'Please select a topic' });
      return;
    }

    setUploading(true);
    setErrors({});

    try {
      for (const fileData of selectedFiles) {
        if (!fileData.validation.isValid) continue;

        const metadata = fileManager.createFileMetadata(
          fileData.file,
          fileData.metadata.topicId || fileMetadata.topicId,
          fileData.metadata
        );

        await onUpload(fileData.file, metadata);
      }

      // Reset form
      setSelectedFiles([]);
      setFileMetadata({
        topicId: '',
        customName: '',
        course: '',
        professor: '',
        semester: '',
        chapter: '',
        assignment: '',
        tags: [],
        difficulty: 'medium',
        priority: 'normal'
      });
      setUploadMode('single');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      setErrors({ upload: 'Failed to upload files. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const renderFileList = () => (
    <div className="space-y-3">
      {selectedFiles.map((fileData) => (
        <div key={fileData.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-red-600" />
              <div>
                <h4 className="font-medium text-gray-900">{fileData.file.name}</h4>
                <p className="text-sm text-gray-500">
                  {fileManager.formatFileSize(fileData.file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeFile(fileData.id)}
              className="text-gray-400 hover:text-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!fileData.validation.isValid && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Invalid File</span>
              </div>
              <ul className="mt-1 text-sm text-red-700">
                {fileData.validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {uploadMode === 'batch' && fileData.validation.isValid && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Custom Name
                </label>
                <input
                  type="text"
                  value={fileData.metadata.customName}
                  onChange={(e) => updateFileMetadata(fileData.id, 'customName', e.target.value)}
                  placeholder={fileData.file.name.replace(/\.[^/.]+$/, "")}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chapter/Section
                </label>
                <input
                  type="text"
                  value={fileData.metadata.chapter}
                  onChange={(e) => updateFileMetadata(fileData.id, 'chapter', e.target.value)}
                  placeholder="Chapter 5, Section 2.1, etc."
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderMetadataForm = () => (
    <div className="space-y-4">
      {/* Topic Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Topic/Course *
        </label>
        <div className="flex space-x-2">
          <select
            value={fileMetadata.topicId}
            onChange={(e) => setFileMetadata(prev => ({ ...prev, topicId: e.target.value }))}
            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.topic ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a topic...</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name} {topic.courseCode && `(${topic.courseCode})`}
              </option>
            ))}
          </select>
          <button
            onClick={onCreateTopic}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Create new topic"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {errors.topic && <p className="mt-1 text-sm text-red-600">{errors.topic}</p>}
      </div>

      {/* Basic Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Name
          </label>
          <input
            type="text"
            value={fileMetadata.customName}
            onChange={(e) => setFileMetadata(prev => ({ ...prev, customName: e.target.value }))}
            placeholder="Override default filename"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Code
          </label>
          <input
            type="text"
            value={fileMetadata.course}
            onChange={(e) => setFileMetadata(prev => ({ ...prev, course: e.target.value }))}
            placeholder="CS 101, HIST 201, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Advanced Metadata (Collapsible) */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
          <ChevronDown className={`h-4 w-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professor/Instructor
                </label>
                <input
                  type="text"
                  value={fileMetadata.professor}
                  onChange={(e) => setFileMetadata(prev => ({ ...prev, professor: e.target.value }))}
                  placeholder="Dr. Smith, Prof. Johnson"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <input
                  type="text"
                  value={fileMetadata.semester}
                  onChange={(e) => setFileMetadata(prev => ({ ...prev, semester: e.target.value }))}
                  placeholder="Fall 2024, Spring 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter/Section
                </label>
                <input
                  type="text"
                  value={fileMetadata.chapter}
                  onChange={(e) => setFileMetadata(prev => ({ ...prev, chapter: e.target.value }))}
                  placeholder="Chapter 5, Section 2.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Type
                </label>
                <select
                  value={fileMetadata.assignment}
                  onChange={(e) => setFileMetadata(prev => ({ ...prev, assignment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  <option value="textbook">Textbook</option>
                  <option value="lecture-notes">Lecture Notes</option>
                  <option value="research-paper">Research Paper</option>
                  <option value="assignment">Assignment</option>
                  <option value="study-guide">Study Guide</option>
                  <option value="reference">Reference Material</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={fileMetadata.difficulty}
                  onChange={(e) => setFileMetadata(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={fileMetadata.priority}
                  onChange={(e) => setFileMetadata(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {fileMetadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag (e.g., important, exam, review)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <Upload className="h-6 w-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Upload Study Materials</h3>
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          Drop PDF files here or click to browse
        </h4>
        <p className="text-gray-600 mb-4">
          Upload textbooks, lecture notes, research papers, and other study materials
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Select PDF Files
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Maximum file size: 100MB • Supported format: PDF only
        </p>
      </div>

      {errors.files && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{errors.files}</p>
        </div>
      )}

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Selected Files ({selectedFiles.length})
          </h4>
          {renderFileList()}
        </div>
      )}

      {/* Metadata Form */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {uploadMode === 'batch' ? 'Default Metadata' : 'File Information'}
          </h4>
          {renderMetadataForm()}
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setSelectedFiles([]);
              setUploadMode('single');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            disabled={uploading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.every(f => !f.validation.isValid)}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      )}

      {errors.upload && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{errors.upload}</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedPDFUpload;