import React, { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { apiClient } from '@/utils/api'

interface UploadedFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  id?: string
  error?: string
}

interface PDFUploadZoneProps {
  onUploadSuccess?: (files: any[]) => void
  maxFiles?: number
}

export default function PDFUploadZone({ onUploadSuccess, maxFiles = 10 }: PDFUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [connectionTest, setConnectionTest] = useState<'pending' | 'success' | 'error'>('pending')

  // Test backend connection when component mounts
  useEffect(() => {
    apiClient.checkHealth()
      .then(() => setConnectionTest('success'))
      .catch(() => setConnectionTest('error'))
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles)

    // Test backend connection first
    try {
      await apiClient.checkHealth()
      setConnectionTest('success')
    } catch (error) {
      setConnectionTest('error')
      console.error('Backend not available:', error)
      return
    }

    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Upload files one by one
    for (let i = 0; i < newFiles.length; i++) {
      const fileIndex = uploadedFiles.length + i
      
      try {
        console.log(`Starting upload ${i + 1}/${newFiles.length}:`, newFiles[i].file.name)
        
        // Simulate progress updates during upload
        const progressInterval = setInterval(() => {
          setUploadedFiles(prev => 
            prev.map((f, idx) => 
              idx === fileIndex && f.status === 'uploading'
                ? { ...f, progress: Math.min(f.progress + 15, 90) }
                : f
            )
          )
        }, 300)

        const result = await apiClient.uploadPDF(newFiles[i].file)
        
        clearInterval(progressInterval)
        
        console.log('Upload completed:', result)
        
        setUploadedFiles(prev => 
          prev.map((f, idx) => 
            idx === fileIndex 
              ? { ...f, progress: 100, status: 'success', id: result.id }
              : f
          )
        )
      } catch (error) {
        console.error('Upload failed:', error)
        
        setUploadedFiles(prev => 
          prev.map((f, idx) => 
            idx === fileIndex 
              ? { 
                  ...f, 
                  progress: 0, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : f
          )
        )
      }
    }

    // Notify parent component of successful uploads
    setTimeout(() => {
      const successfulUploads = uploadedFiles.filter(f => f.status === 'success')
      if (successfulUploads.length > 0 && onUploadSuccess) {
        onUploadSuccess(successfulUploads)
      }
    }, 1000)
  }, [uploadedFiles, onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: connectionTest === 'error'
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setUploadedFiles([])
  }

  const retryConnection = async () => {
    setConnectionTest('pending')
    try {
      await apiClient.checkHealth()
      setConnectionTest('success')
    } catch (error) {
      setConnectionTest('error')
    }
  }

  // Backend connection error
  if (connectionTest === 'error') {
    return (
      <div className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center bg-red-50">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">Backend Not Available</h3>
        <p className="text-red-700 mb-4 text-sm">
          Cannot connect to the backend server. Make sure it's running on port 8000.
        </p>
        <div className="space-y-2">
          <button 
            onClick={retryConnection}
            className="btn-secondary mr-2"
          >
            Retry Connection
          </button>
          <div className="text-xs text-red-600">
            <p>To start the backend:</p>
            <code className="bg-red-100 px-2 py-1 rounded mt-1 inline-block">
              cd backend && npm run dev
            </code>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      {connectionTest === 'success' && (
        <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-2 rounded">
          <CheckCircle className="h-4 w-4" />
          <span>Backend connected successfully</span>
        </div>
      )}

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50 scale-105' 
            : connectionTest === 'success'
            ? 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
            : 'border-gray-200 bg-gray-50 cursor-not-allowed'
          }
        `}
      >
        <input {...getInputProps()} />
        
        {connectionTest === 'pending' ? (
          <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
        ) : (
          <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${
            isDragActive ? 'text-primary-500' : 'text-gray-400'
          }`} />
        )}
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {connectionTest === 'pending' 
            ? 'Connecting to backend...'
            : isDragActive 
            ? 'Drop PDF files here...' 
            : 'Upload PDF files'
          }
        </h3>
        
        {connectionTest === 'success' && (
          <>
            <p className="text-gray-500 mb-4">
              Drag and drop your PDF files here, or click to browse
            </p>
            <button className="btn-primary">
              Choose Files
            </button>
            <p className="text-xs text-gray-400 mt-2">
              Maximum file size: 50MB • Supported format: PDF only
            </p>
          </>
        )}
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-red-800 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium text-sm">Upload Issues</span>
          </div>
          {fileRejections.map(({ file, errors }, index) => (
            <div key={index} className="text-sm text-red-700">
              <span className="font-medium">{file.name}</span>
              <ul className="list-disc list-inside ml-2">
                {errors.map((error, errorIndex) => (
                  <li key={errorIndex}>{error.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Upload Progress</h4>
            {uploadedFiles.some(f => f.status === 'success' || f.status === 'error') && (
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>
          
          {uploadedFiles.map((uploadedFile, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
              <div className="flex-shrink-0">
                {uploadedFile.status === 'uploading' ? (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                ) : uploadedFile.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                
                {uploadedFile.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadedFile.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploading... {uploadedFile.progress}%
                    </p>
                  </div>
                )}
                
                {uploadedFile.status === 'success' && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Upload complete • ID: {uploadedFile.id}
                  </p>
                )}
                
                {uploadedFile.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{uploadedFile.error}</p>
                )}
              </div>

              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                title="Remove file"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}