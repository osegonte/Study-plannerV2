import { useState } from 'react'
import { Worker, Viewer } from '@react-pdf-viewer/core'
import '@react-pdf-viewer/core/lib/styles/index.css'

const WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js'

interface MinimalPDFTestProps {
  pdfUrl: string
}

export default function MinimalPDFTest({ pdfUrl }: MinimalPDFTestProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const handleDocumentLoad = () => {
    console.log('✅ PDF loaded successfully!')
    setLoading(false)
    setError(null)
  }

  const handleLoadError = (error: any) => {
    console.error('❌ PDF load error:', error)
    setError(error.message || 'Unknown error')
    setLoading(false)
  }

  return (
    <div style={{ height: '600px', width: '100%', border: '1px solid #ccc' }}>
      <h3>Minimal PDF Test</h3>
      <p>Testing URL: {pdfUrl}</p>
      
      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#ffe6e6' }}>
          Error: {error}
        </div>
      )}
      
      {loading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading PDF...
        </div>
      )}
      
      <Worker workerUrl={WORKER_URL}>
        <Viewer
          fileUrl={pdfUrl}
          onDocumentLoad={handleDocumentLoad}
          onLoadError={handleLoadError}
        />
      </Worker>
    </div>
  )
}
