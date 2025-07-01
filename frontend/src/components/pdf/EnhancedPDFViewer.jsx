import React from 'react';
import { AlertTriangle } from 'lucide-react';

const EnhancedPDFViewer = ({ fileName, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Enhanced PDF Viewer</h2>
        <p className="text-gray-600 mb-4">
          Replace this file with the Enhanced PDF Viewer component from the artifacts.
        </p>
        <p className="text-sm text-gray-500 mb-4">File: {fileName}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;
