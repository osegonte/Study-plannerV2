// Use proxy for API calls in development
const API_BASE_URL = '/api'

class ApiClient {
  private baseURL: string
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY = 1000

  constructor(baseURL: string) {
    this.baseURL = baseURL
    console.log('API Client initialized with baseURL:', baseURL)
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    let lastError: Error = new Error('Unknown error')
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`API Request (attempt ${attempt}):`, url, options.method || 'GET')
        
        const config: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        }

        if (options.body instanceof FormData) {
          delete config.headers!['Content-Type']
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        console.log('API Response:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
        }
        
        const data = await response.json()
        console.log('API Response Data received successfully')
        return data
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Request failed')
        console.error(`API request attempt ${attempt} failed:`, lastError)
        
        if (lastError.message.includes('404') || 
            lastError.message.includes('400') ||
            lastError.message.includes('401') ||
            lastError.message.includes('403')) {
          break
        }
        
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt))
        }
      }
    }
    
    throw lastError
  }

  async uploadPDF(file: File): Promise<any> {
    console.log('Uploading PDF:', file.name, file.size, 'bytes')
    
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Only PDF files are allowed')
    }
    
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('File too large (max 50MB)')
    }
    
    const formData = new FormData()
    formData.append('pdf', file)
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          console.log(`Upload progress: ${progress}%`)
        }
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            console.log('Upload successful:', response)
            resolve(response)
          } catch (error) {
            reject(new Error('Invalid response format'))
          }
        } else {
          reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`))
        }
      }
      
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.ontimeout = () => reject(new Error('Upload timeout'))
      
      xhr.open('POST', `${this.baseURL}/pdfs/upload`)
      xhr.timeout = 120000
      xhr.send(formData)
    })
  }

  async getPDFs() {
    return this.request('/pdfs')
  }

  async getPDF(id: string) {
    return this.request(`/pdfs/${id}`)
  }

  async deletePDF(id: string) {
    return this.request(`/pdfs/${id}`, { method: 'DELETE' })
  }

  private sessionSaveQueue = new Map<string, Promise<any>>()
  
  async saveReadingSession(session: {
    pdfId: string
    page: number
    startTime: Date
    endTime: Date
    duration: number
  }) {
    const key = `${session.pdfId}-${session.page}`
    
    if (this.sessionSaveQueue.has(key)) {
      return this.sessionSaveQueue.get(key)
    }
    
    const savePromise = this.request('/reading/session', {
      method: 'POST',
      body: JSON.stringify(session),
    })
    
    this.sessionSaveQueue.set(key, savePromise)
    
    try {
      const result = await savePromise
      return result
    } finally {
      setTimeout(() => {
        this.sessionSaveQueue.delete(key)
      }, 5000)
    }
  }

  async getReadingStats(pdfId: string) {
    return this.request(`/reading/stats/${pdfId}`)
  }

  async getReadingProgress(pdfId: string) {
    return this.request(`/reading/progress/${pdfId}`)
  }

  async checkHealth() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('/api/health', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const health = await response.json()
        console.log('Backend health check passed')
        return health
      }
      throw new Error(`Health check failed: ${response.status}`)
    } catch (error) {
      console.error('Backend health check failed:', error)
      throw error
    }
  }

  getPDFFileUrl(pdfId: string, bustCache = false): string {
    const baseUrl = `/api/pdfs/${pdfId}/file`
    return bustCache ? `${baseUrl}?t=${Date.now()}` : baseUrl
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

if (import.meta.env.DEV) {
  ;(window as any).apiClient = apiClient
  console.log('Development mode: apiClient available on window object')
}
