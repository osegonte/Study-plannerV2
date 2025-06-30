import React from 'react';
import ReactDOM from 'react-dom/client';
import { pdfjs } from 'react-pdf';
import App from './App';

// 🔧 CRITICAL: Set worker BEFORE any PDF operations
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
console.log('🔧 Worker configured to:', pdfjs.GlobalWorkerOptions.workerSrc);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
