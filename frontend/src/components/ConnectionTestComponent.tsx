import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: string
}

export default function ConnectionTestComponent() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Frontend', status: 'pending', message: 'Checking frontend...' },
    { name: 'Backend Health', status: 'pending', message: 'Checking backend health...' },
    { name: 'Backend API', status: 'pending', message: 'Checking backend API...' },
    { name: 'Proxy Connection', status: 'pending', message: 'Testing proxy...' },
    { name: 'CORS Headers', status: 'pending', message: 'Checking CORS...' },
  ])

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, details } : test
    ))
  }

  const runTests = async () => {
    console.log('🔍 Starting connection tests...')

    // Test 1: Frontend (this should always pass)
    updateTest('Frontend', 'success', 'Frontend is running', `Location: ${window.location.origin}`)

    // Test 2: Backend Health (direct connection)
    try {
      console.log('Testing direct backend connection...')
      const healthResponse = await fetch('http://localhost:8000/api/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        updateTest('Backend Health', 'success', 'Backend is healthy', `Version: ${healthData.version || 'Unknown'}`)
      } else {
        updateTest('Backend Health', 'error', `Backend responded with ${healthResponse.status}`, await healthResponse.text())
      }
    } catch (error) {
      console.error('Direct backend health check failed:', error)
      updateTest('Backend Health', 'error', 'Cannot reach backend directly', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 3: Backend API (direct connection)
    try {
      console.log('Testing direct backend API...')
      const apiResponse = await fetch('http://localhost:8000/api/pdfs', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json()
        updateTest('Backend API', 'success', 'API is responding', `Found ${Array.isArray(apiData) ? apiData.length : 0} PDFs`)
      } else {
        updateTest('Backend API', 'error', `API responded with ${apiResponse.status}`, await apiResponse.text())
      }
    } catch (error) {
      console.error('Direct backend API check failed:', error)
      updateTest('Backend API', 'error', 'Cannot reach API directly', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 4: Proxy Connection (through Vite proxy)
    try {
      console.log('Testing proxy connection...')
      const proxyResponse = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json()
        updateTest('Proxy Connection', 'success', 'Proxy is working', `Stage: ${proxyData.stage || 'Unknown'}`)
      } else {
        updateTest('Proxy Connection', 'error', `Proxy responded with ${proxyResponse.status}`, await proxyResponse.text())
      }
    } catch (error) {
      console.error('Proxy connection check failed:', error)
      updateTest('Proxy Connection', 'error', 'Proxy connection failed', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 5: CORS Headers
    try {
      console.log('Testing CORS headers...')
      const corsResponse = await fetch('http://localhost:8000/api/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
        },
      })
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers'),
      }
      
      if (corsHeaders['Access-Control-Allow-Origin']) {
        updateTest('CORS Headers', 'success', 'CORS is configured', `Origin: ${corsHeaders['Access-Control-Allow-Origin']}`)
      } else {
        updateTest('CORS Headers', 'error', 'CORS headers missing', 'Backend may not have CORS enabled')
      }
    } catch (error) {
      console.error('CORS check failed:', error)
      updateTest('CORS Headers', 'error', 'CORS check failed', error instanceof Error ? error.message : 'Unknown error')
    }

    console.log('✅ Connection tests completed')
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-50 border-blue-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
    }
  }

  const hasErrors = tests.some(test => test.status === 'error')
  const allComplete = tests.every(test => test.status !== 'pending')

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Connection Diagnostic</h2>
            <p className="text-gray-600">Testing backend connectivity and configuration</p>
          </div>
        </div>

        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.name} className={`p-4 border rounded-lg ${getStatusColor(test.status)}`}>
              <div className="flex items-start space-x-3">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{test.name}</h3>
                    <span className={`text-sm font-medium ${
                      test.status === 'success' ? 'text-green-700' :
                      test.status === 'error' ? 'text-red-700' : 'text-blue-700'
                    }`}>
                      {test.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mt-1">{test.message}</p>
                  {test.details && (
                    <p className="text-gray-600 text-xs mt-1 font-mono">{test.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {allComplete && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-2">Diagnosis Summary</h3>
            {hasErrors ? (
              <div className="space-y-2 text-sm">
                <p className="text-red-700">❌ Issues detected with backend connectivity</p>
                <p className="text-gray-600">Common solutions:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Make sure backend is running: <code className="bg-gray-200 px-1 rounded">cd backend && npm run dev</code></li>
                  <li>Check if port 8000 is available: <code className="bg-gray-200 px-1 rounded">lsof -i :8000</code></li>
                  <li>Verify backend .env configuration</li>
                  <li>Check firewall or antivirus blocking localhost connections</li>
                </ul>
              </div>
            ) : (
              <p className="text-green-700">✅ All systems operational! Backend connectivity is working properly.</p>
            )}
          </div>
        )}

        <div className="mt-6 flex space-x-3">
          <button
            onClick={runTests}
            className="btn-primary"
            disabled={!allComplete}
          >
            Re-run Tests
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Refresh Page
          </button>
        </div>

        {/* Environment Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Environment Info</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Frontend URL:</span> {window.location.origin}
            </div>
            <div>
              <span className="font-medium">Expected Backend:</span> http://localhost:8000
            </div>
            <div>
              <span className="font-medium">User Agent:</span> {navigator.userAgent.split(' ')[0]}
            </div>
            <div>
              <span className="font-medium">Protocol:</span> {window.location.protocol}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}