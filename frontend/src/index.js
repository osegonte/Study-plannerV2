import "./styles/globals.css";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { pdfjs } from 'react-pdf';
import App from './App';

// 🔧 CRITICAL: Multiple worker configuration strategies
try {
  // Strategy 1: Use local worker file
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  console.log('✅ Using local PDF worker');
} catch (error) {
  console.warn('⚠️ Local worker failed, trying CDN...');
  // Strategy 2: Use CDN worker
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
}

console.log('🔧 PDF Worker configured:', pdfjs.GlobalWorkerOptions.workerSrc);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
