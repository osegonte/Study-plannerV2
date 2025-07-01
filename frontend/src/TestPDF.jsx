import React from 'react';
import { BulletproofPDFViewer } from './components/pdf';

function TestPDF() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">PDF Viewer Test</h1>
      <BulletproofPDFViewer 
        currentTopic="Test Document"
        onTimeTrack={(event, data) => console.log('PDF Event:', event, data)}
      />
    </div>
  );
}

export default TestPDF;
