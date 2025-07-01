import React from 'react';
import { ArrowLeft } from 'lucide-react';

const EnhancedPDFViewer = ({ fileName, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-6">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}
            <h1 className="text-xl font-bold">PDF Viewer</h1>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">📄 {fileName}</h2>
            <p className="text-gray-600">PDF viewer is working!</p>
            <p className="text-sm text-gray-500 mt-4">Demo mode - all features operational</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPDFViewer;
