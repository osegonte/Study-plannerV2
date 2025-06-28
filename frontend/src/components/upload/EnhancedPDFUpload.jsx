import React, { useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

const EnhancedPDFUpload = ({ topics, onUpload, onCreateTopic }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      // Create simple metadata
      const metadata = {
        id: Date.now().toString(),
        topicId: topics[0]?.id || 'default'
      };
      onUpload(file, metadata);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="text-center">
        <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload PDFs</h3>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Select PDF File
        </button>
      </div>
    </div>
  );
};

export default EnhancedPDFUpload;
