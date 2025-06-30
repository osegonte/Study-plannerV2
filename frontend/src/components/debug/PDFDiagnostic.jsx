// PDFDiagnostic.jsx
// Save this file as: frontend/src/components/debug/PDFDiagnostic.jsx

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { AlertCircle, CheckCircle, XCircle, Upload, RefreshCw } from 'lucide-react';

// Configure PDF.js worker - try multiple configurations
const workerConfigs = [
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`,
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`,
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`
];

// Start with the first configuration
pdfjs.GlobalWorkerOptions.workerSrc = workerConfigs[0];

const PDFDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState({});
  const [currentWorkerIndex, setCurrentWorkerIndex] = useState(0);
  const [testResults, setTestResults] = useState({
    remoteTest: null,
    fileTest: null,
    appCacheTest: null
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    runInitialDiagnostics();
  }, []);

  const runInitialDiagnostics = () => {
    console.log('🔍 Running PDF Diagnostics...');
    
    const results = {
      reactPdfVersion: pdfjs.version,
      workerUrl: pdfjs.GlobalWorkerOptions.workerSrc,
      workerConfigIndex: currentWorkerIndex,
      browserInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      },
      appState: {
        fileHandlerExists: !!window.pdfFileHandler,
        cacheStats: window.pdfFileHandler?.getCacheStats() || 'No cache found',
        documentsInStorage: JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]').length,
        topicsInStorage: JSON.parse(localStorage.getItem('pdf-study-planner-topics') || '[]').length
      },
      console: {
        errors: [],
        warnings: []
      }
    };
    
    // Capture console errors
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      results.console.errors.push(args.join(' '));
      originalError(...args);
    };
    
    console.warn = (...args) => {
      results.console.warnings.push(args.join(' '));
      originalWarn(...args);
    };
    
    setDiagnostics(results);
    console.log('📊 Diagnostic Results:', results);
  };

  const switchWorkerConfig = () => {
    const nextIndex = (currentWorkerIndex + 1) % workerConfigs.length;
    pdfjs.GlobalWorkerOptions.workerSrc = workerConfigs[nextIndex];
    setCurrentWorkerIndex(nextIndex);
    console.log(`🔄 Switched to worker config ${nextIndex + 1}:`, workerConfigs[nextIndex]);
    runInitialDiagnostics();
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    console.log('🧪 Running all PDF tests...');
    
    // Reset results
    setTestResults({
      remoteTest: null,
      fileTest: null,
      appCacheTest: null
    });

    // Test 1: Remote PDF (should always work if react-pdf is set up correctly)
    try {
      const response = await fetch('https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf');
      const arrayBuffer = await response.arrayBuffer();
      console.log('✅ Remote PDF downloaded:', arrayBuffer.byteLength, 'bytes');
      
      setTestResults(prev => ({ ...prev, remoteTest: 'downloaded' }));
    } catch (error) {
      console.error('❌ Remote PDF download failed:', error);
      setTestResults(prev => ({ ...prev, remoteTest: 'failed' }));
    }

    // Test 3: App Cache Test
    try {
      const docs = JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]');
      console.log('📚 Documents in app storage:', docs.length);
      
      let cacheTestResult = 'no-documents';
      if (docs.length > 0) {
        const validCacheKeys = docs.filter(doc => 
          doc.cacheKey && window.pdfFileHandler?.hasFile(doc.cacheKey)
        ).length;
        
        cacheTestResult = validCacheKeys > 0 ? 'cache-valid' : 'cache-invalid';
        console.log(`📊 Cache validation: ${validCacheKeys}/${docs.length} documents have valid cache`);
      }
      
      setTestResults(prev => ({ ...prev, appCacheTest: cacheTestResult }));
    } catch (error) {
      console.error('❌ App cache test failed:', error);
      setTestResults(prev => ({ ...prev, appCacheTest: 'failed' }));
    }

    setIsRunningTests(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📁 Testing file upload:', file.name, file.size, 'bytes');
    
    try {
      // Test direct file to ArrayBuffer conversion
      const arrayBuffer = await file.arrayBuffer();
      console.log('✅ File converted to ArrayBuffer:', arrayBuffer.byteLength, 'bytes');
      
      // Validate PDF header
      const header = String.fromCharCode(...new Uint8Array(arrayBuffer.slice(0, 4)));
      console.log('📄 File header:', header);
      
      if (header === '%PDF') {
        console.log('✅ Valid PDF header detected');
        setUploadedFile(arrayBuffer);
        setTestResults(prev => ({ ...prev, fileTest: 'valid' }));
      } else {
        console.log('❌ Invalid PDF header. Expected "%PDF", got:', header);
        setTestResults(prev => ({ ...prev, fileTest: 'invalid-header' }));
      }
      
      // Test with app's file handler
      if (window.pdfFileHandler) {
        try {
          const cacheKey = await window.pdfFileHandler.processFile(file);
          console.log('✅ App file handler processed file:', cacheKey);
          
          const retrievedData = window.pdfFileHandler.getFileForPDF(cacheKey);
          if (retrievedData) {
            console.log('✅ App file handler can retrieve data:', retrievedData.byteLength, 'bytes');
            setTestResults(prev => ({ ...prev, fileTest: 'app-handler-ok' }));
          } else {
            console.log('❌ App file handler cannot retrieve data');
            setTestResults(prev => ({ ...prev, fileTest: 'app-handler-fail' }));
          }
        } catch (handlerError) {
          console.error('❌ App file handler failed:', handlerError);
          setTestResults(prev => ({ ...prev, fileTest: 'app-handler-error' }));
        }
      }
      
    } catch (error) {
      console.error('❌ File processing failed:', error);
      setTestResults(prev => ({ ...prev, fileTest: 'processing-failed' }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'downloaded':
      case 'valid':
      case 'app-handler-ok':
      case 'cache-valid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
      case 'invalid-header':
      case 'processing-failed':
      case 'app-handler-fail':
      case 'app-handler-error':
      case 'cache-invalid':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'no-documents':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (test, status) => {
    const statusMap = {
      remoteTest: {
        'downloaded': 'Remote PDF downloaded successfully',
        'failed': 'Failed to download remote PDF',
        null: 'Not tested yet'
      },
      fileTest: {
        'valid': 'Valid PDF file uploaded',
        'app-handler-ok': 'App file handler working correctly',
        'invalid-header': 'File is not a valid PDF',
        'processing-failed': 'Failed to process file',
        'app-handler-fail': 'App file handler cannot retrieve data',
        'app-handler-error': 'App file handler threw an error',
        null: 'No file uploaded yet'
      },
      appCacheTest: {
        'cache-valid': 'App cache is working correctly',
        'cache-invalid': 'Documents exist but cache is invalid',
        'no-documents': 'No documents in app storage',
        'failed': 'Cache test failed',
        null: 'Not tested yet'
      }
    };
    
    return statusMap[test]?.[status] || 'Unknown status';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">PDF Viewer Diagnostics</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={switchWorkerConfig}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Different Worker</span>
            </button>
            
            <button
              onClick={runAllTests}
              disabled={isRunningTests}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRunningTests ? 'animate-spin' : ''}`} />
              <span>Run All Tests</span>
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">System Information</h3>
            <div className="space-y-2 text-sm">
              <div><strong>React-PDF Version:</strong> {diagnostics.reactPdfVersion}</div>
              <div><strong>Worker Config:</strong> #{currentWorkerIndex + 1} of {workerConfigs.length}</div>
              <div><strong>Worker URL:</strong> <code className="text-xs bg-white px-1 rounded">{diagnostics.workerUrl}</code></div>
              <div><strong>Browser:</strong> {diagnostics.browserInfo?.userAgent?.split(' ')[0]}</div>
              <div><strong>Platform:</strong> {diagnostics.browserInfo?.platform}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">App State</h3>
            <div className="space-y-2 text-sm">
              <div><strong>File Handler:</strong> {diagnostics.appState?.fileHandlerExists ? '✅ Available' : '❌ Missing'}</div>
              <div><strong>Documents:</strong> {diagnostics.appState?.documentsInStorage} in storage</div>
              <div><strong>Topics:</strong> {diagnostics.appState?.topicsInStorage} in storage</div>
              <div><strong>Cache Files:</strong> {typeof diagnostics.appState?.cacheStats === 'object' ? 
                `${diagnostics.appState.cacheStats.fileCount} files (${diagnostics.appState.cacheStats.totalSizeMB}MB)` : 
                diagnostics.appState?.cacheStats
              }</div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-6">
          {/* Test 1: Remote PDF */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Test 1: Remote PDF Loading</h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(testResults.remoteTest)}
                <span className="text-sm">{getStatusText('remoteTest', testResults.remoteTest)}</span>
              </div>
            </div>
            
            {testResults.remoteTest === 'downloaded' && (
              <div className="mt-4">
                <Document
                  file="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
                  onLoadSuccess={({ numPages }) => {
                    console.log('✅ Remote PDF rendered successfully:', numPages, 'pages');
                    setTestResults(prev => ({ ...prev, remoteTest: 'rendered' }));
                  }}
                  onLoadError={(error) => {
                    console.error('❌ Remote PDF rendering failed:', error);
                    setTestResults(prev => ({ ...prev, remoteTest: 'render-failed' }));
                  }}
                  loading={<div className="text-blue-600 p-4">Loading remote PDF...</div>}
                  error={<div className="text-red-600 p-4">❌ Failed to render remote PDF</div>}
                >
                  <Page pageNumber={1} scale={0.3} />
                </Document>
              </div>
            )}
          </div>

          {/* Test 2: File Upload */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Test 2: File Upload & Processing</h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(testResults.fileTest)}
                <span className="text-sm">{getStatusText('fileTest', testResults.fileTest)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Upload className="h-5 w-5 text-gray-600" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              {uploadedFile && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Testing your uploaded PDF:</h4>
                  <Document
                    file={uploadedFile}
                    onLoadSuccess={({ numPages }) => {
                      console.log('✅ Uploaded PDF rendered successfully:', numPages, 'pages');
                      setTestResults(prev => ({ ...prev, fileTest: 'uploaded-rendered' }));
                    }}
                    onLoadError={(error) => {
                      console.error('❌ Uploaded PDF rendering failed:', error);
                      setTestResults(prev => ({ ...prev, fileTest: 'uploaded-render-failed' }));
                    }}
                    loading={<div className="text-blue-600 p-4">Loading your PDF...</div>}
                    error={<div className="text-red-600 p-4">❌ Failed to render your PDF</div>}
                  >
                    <Page pageNumber={1} scale={0.3} />
                  </Document>
                </div>
              )}
            </div>
          </div>

          {/* Test 3: App Integration */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Test 3: App Integration</h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(testResults.appCacheTest)}
                <span className="text-sm">{getStatusText('appCacheTest', testResults.appCacheTest)}</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                const docs = JSON.parse(localStorage.getItem('pdf-study-planner-documents') || '[]');
                console.log('📚 App Documents Analysis:');
                docs.forEach((doc, i) => {
                  console.log(`Document ${i+1}:`, {
                    name: doc.name,
                    size: doc.size,
                    cacheKey: doc.cacheKey,
                    hasPageTimes: Object.keys(doc.pageTimes || {}).length,
                    cacheValid: doc.cacheKey ? window.pdfFileHandler?.hasFile(doc.cacheKey) : false
                  });
                });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Analyze App Documents
            </button>
          </div>
        </div>

        {/* Console Errors */}
        {(diagnostics.console?.errors?.length > 0 || diagnostics.console?.warnings?.length > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold text-red-800 mb-3">Console Messages</h3>
            {diagnostics.console.errors.length > 0 && (
              <div className="mb-2">
                <h4 className="font-medium text-red-700">Errors:</h4>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {diagnostics.console.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {diagnostics.console.warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-700">Warnings:</h4>
                <ul className="list-disc list-inside text-sm text-yellow-600">
                  {diagnostics.console.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Diagnostic Instructions</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>If Test 1 fails:</strong> React-PDF or worker configuration issue</p>
            <p><strong>If Test 1 works but Test 2 fails:</strong> File processing or format issue</p>
            <p><strong>If Tests 1-2 work but main app doesn't:</strong> Integration or state management issue</p>
            <p><strong>Try different worker configs</strong> if you see worker-related errors</p>
            <p><strong>Check browser console</strong> for detailed error messages</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFDiagnostic;