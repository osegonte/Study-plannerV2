import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, X } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';

const SimplePDFUpload = ({ selectedTopic, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const { addDocumentToTopic } = useStudyPlanner();

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      for (const file of files) {
        if (file.type !== 'application/pdf') {
          throw new Error(`${file.name} is not a PDF file`);
        }

        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 50MB)`);
        }

        console.log('📄 Uploading real PDF:', file.name);
        await addDocumentToTopic(selectedTopic, file);
      }

      console.log('✅ All PDFs uploaded successfully');
      if (onSuccess) onSuccess();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!selectedTopic) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Upload className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Select a topic first to upload PDFs</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Real PDFs</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <X className="h-4 w-4 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
      />

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-blue-700 font-medium">Uploading PDFs...</p>
            <p className="text-blue-600 text-sm">Processing files for viewing</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-blue-600 mb-3" />
            <p className="text-lg font-medium text-gray-900 mb-2">Upload PDF Files</p>
            <p className="text-gray-600 mb-3">Drag & drop or click to select</p>
            <div className="text-sm text-gray-500">
              <p>• Maximum 50MB per file</p>
              <p>• Multiple files supported</p>
              <p>• Real PDF content will display</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-blue-800">
            <p className="font-medium">Real PDF Support</p>
            <p className="text-sm text-blue-700">
              Upload your actual PDF files and they will display properly with the working timer system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePDFUpload;
