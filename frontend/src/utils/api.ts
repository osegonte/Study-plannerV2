const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
    console.log('API Client initialized with baseURL:', baseURL)
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    console.log('API Request:', url, options)
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Remove Content-Type for FormData uploads
    if (options.body instanceof FormData) {
      delete config.headers!['Content-Type']
    }

    try {
      const response = await fetch(url, config)
      console.log('API Response:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }
      
      const data = await response.json()
      console.log('API Response Data:', data)
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // PDF endpoints with better error handling
  async uploadPDF(file: File) {
    console.log('Uploading PDF:', file.name, file.size, 'bytes')
    
    const formData = new FormData()
    formData.append('pdf', file)
    
    try {
      const response = await fetch(`${this.baseURL}/pdfs/upload`, {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload error:', errorText)
        throw new Error(`Upload failed (${response.status}): ${errorText}`)
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      return result
    } catch (error) {
      console.error('PDF upload error:', error)
      throw error
    }
  }

  async getPDFs() {
    try {
      return await this.request('/pdfs')
    } catch (error) {
      console.error('Failed to get PDFs:', error)
      throw new Error('Failed to load documents. Please check if the backend is running.')
    }
  }

  async getPDF(id: string) {
    try {
      return await this.request(`/pdfs/${id}`)
    } catch (error) {
      console.error('Failed to get PDF:', error)
      throw new Error(`Failed to load PDF ${id}. Please check if the file exists.`)
    }
  }

  async deletePDF(id: string) {
    return this.request(`/pdfs/${id}`, { method: 'DELETE' })
  }

  // Reading session endpoints
  async saveReadingSession(session: {
    pdfId: string
    page: number
    startTime: Date
    endTime: Date
    duration: number
  }) {
    return this.request('/reading/session', {
      method: 'POST',
      body: JSON.stringify(session),
    })
  }

  async getReadingStats(pdfId: string) {
    return this.request(`/reading/stats/${pdfId}`)
  }

  async getReadingProgress(pdfId: string) {
    return this.request(`/reading/progress/${pdfId}`)
  }

  // Utility method to check backend connectivity
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`)
      if (response.ok) {
        const health = await response.json()
        console.log('Backend health check:', health)
        return health
      }
      throw new Error(`Health check failed: ${response.status}`)
    } catch (error) {
      console.error('Backend health check failed:', error)
      throw error
    }
  }

  // Helper to get PDF file URL
  getPDFFileUrl(pdfId: string): string {
    return `${this.baseURL}/pdfs/${pdfId}/file`
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Test connectivity on startup (development only)
if (import.meta.env.DEV) {
  apiClient.checkHealth().catch(error => {
    console.warn('Backend connection failed during startup:', error)
  })
}