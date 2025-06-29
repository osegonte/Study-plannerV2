import React, { useState, useEffect } from 'react';
import { Folder, Download, HardDrive, RefreshCw } from 'lucide-react';
import { useStudyPlanner } from '../../contexts/StudyPlannerContext';
import { localFileManager } from '../../utils/localFileManager';

const FolderManager = () => {
  const { topics } = useStudyPlanner();
  const [pendingFolders, setPendingFolders] = useState([]);

  useEffect(() => {
    setPendingFolders(localFileManager.getPendingFolders());
  }, [topics]);

  const handleDownloadScript = () => {
    localFileManager.downloadFolderCreationScript();
  };

  const getFolderStructure = () => {
    return topics.map(topic => ({
      ...topic,
      folderName: localFileManager.sanitizeFolderName(topic.name),
      hasFolder: !!topic.folderPath
    }));
  };

  const folderStructure = getFolderStructure();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HardDrive className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Folder Management</h2>
        </div>
        
        <button
          onClick={handleDownloadScript}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Download Creation Script</span>
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Folder Structure</h3>
        
        <div className="text-sm text-gray-600 mb-4">
          📁 {localFileManager.getStudyMaterialsPath()}
        </div>
        
        {folderStructure.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No topics created yet.</p>
        ) : (
          <div className="space-y-2">
            {folderStructure.map((topic) => (
              <div
                key={topic.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  topic.hasFolder ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Folder className={`h-5 w-5 ${
                    topic.hasFolder ? 'text-green-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <div className="font-medium">📁 {topic.folderName}</div>
                    <div className="text-sm text-gray-600">{topic.name}</div>
                  </div>
                </div>
                
                <div className="text-sm">
                  {topic.hasFolder ? (
                    <span className="text-green-600">✅ Planned</span>
                  ) : (
                    <span className="text-yellow-600">⏳ Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">How to Create Folders</h3>
        
        <div className="space-y-3 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <span className="font-semibold">1.</span>
            <span>Download the folder creation script using the button above.</span>
          </div>
          
          <div className="flex items-start space-x-2">
            <span className="font-semibold">2.</span>
            <span>Open Terminal/Command Prompt and navigate to your Downloads folder.</span>
          </div>
          
          <div className="flex items-start space-x-2">
            <span className="font-semibold">3.</span>
            <span>Run: <code className="bg-blue-100 px-1 rounded">chmod +x create_study_folders.sh && ./create_study_folders.sh</code></span>
          </div>
          
          <div className="flex items-start space-x-2">
            <span className="font-semibold">4.</span>
            <span>All your topic folders will be created automatically!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderManager;
