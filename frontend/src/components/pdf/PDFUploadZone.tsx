import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
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
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadedFiles(prev => 
            prev.map((f, idx) => 
              idx === fileIndex && f.status === 'uploading'
                ? { ...f, progress: Math.min(f.progress + 15, 90) }
                : f
            )
          )
        }, 200)

        const result = await apiClient.uploadPDF(newFiles[i].file)
        
        clearInterval(progressInterval)
        
        setUploadedFiles(prev => 
          prev.map((f, idx) => 
            idx === fileIndex 
              ? { ...f, progress: 100, status: 'success', id: result.id }
              : f
          )
        )
      } catch (error) {
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
    if (onUploadSuccess) {
      const successfulUploads = uploadedFiles.filter(f => f.status === 'success')
      if (successfulUploads.length > 0) {
        onUploadSuccess(successfulUploads)
      }
    }
  }, [uploadedFiles, onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setUploadedFiles([])
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${
          isDragActive ? 'text-primary-500' : 'text-gray-400'
        }`} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop PDF files here...' : 'Upload PDF files'}
        </h3>
        <p className="text-gray-500 mb-4">
          Drag and drop your PDF files here, or click to browse
        </p>
        <button className="btn-primary">
          Choose Files
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Maximum file size: 50MB • Supported format: PDF only
        </p>
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
                {uploadedFile.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : uploadedFile.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-400" />
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
                  <p className="text-xs text-green-600 mt-1">✓ Upload complete</p>
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
