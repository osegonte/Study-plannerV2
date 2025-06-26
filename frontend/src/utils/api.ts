const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiClient {
  private baseURL: string
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map()
  private pendingRequests: Map<string, Promise<any>> = new Map()
  private readonly CACHE_DURATION = 30000 // 30 seconds
  private readonly DEBOUNCE_DELAY = 1000 // 1 second

  constructor(baseURL: string) {
    this.baseURL = baseURL
    console.log('API Client initialized with baseURL:', baseURL)
  }

  // Generate cache key for requests
  private getCacheKey(endpoint: string, options: RequestInit = {}): string {
    const method = options.method || 'GET'
    const body = options.body || ''
    return `${method}:${endpoint}:${typeof body === 'string' ? body : ''}`
  }

  // Check if cache is valid
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  // Debounced request wrapper to prevent spam
  private async debouncedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, options)
    
    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log('Request already pending, reusing:', cacheKey)
      return this.pendingRequests.get(cacheKey)!
    }

    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = this.requestCache.get(cacheKey)
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log('Returning cached response:', cacheKey)
        return cached.data
      }
    }

    // Create new request
    const requestPromise = this.performRequest<T>(endpoint, options)
    this.pendingRequests.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise
      
      // Cache GET responses
      if (!options.method || options.method === 'GET') {
        this.requestCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })
      }
      
      return result
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey)
    }
  }

  private async performRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    console.log('API Request:', url, options.method || 'GET')
    
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
      console.log('API Response Data received')
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.debouncedRequest<T>(endpoint, options)
  }

  // PDF endpoints with better error handling and caching
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
      
      // Invalidate PDFs cache after upload
      this.invalidateCache('/pdfs')
      
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
    const result = await this.request(`/pdfs/${id}`, { method: 'DELETE' })
    // Invalidate cache after deletion
    this.invalidateCache('/pdfs')
    this.invalidateCache(`/pdfs/${id}`)
    return result
  }

  // Reading session endpoints with debouncing
  private lastSessionSave: number = 0
  private sessionSaveQueue: Map<string, any> = new Map()

  async saveReadingSession(session: {
    pdfId: string
    page: number
    startTime: Date
    endTime: Date
    duration: number
  }) {
    const now = Date.now()
    const key = `${session.pdfId}-${session.page}`
    
    // Debounce session saves (minimum 2 seconds between saves for same page)
    if (now - this.lastSessionSave < 2000 && this.sessionSaveQueue.has(key)) {
      console.log('Debouncing session save for:', key)
      return this.sessionSaveQueue.get(key)
    }

    this.lastSessionSave = now
    const savePromise = this.request('/reading/session', {
      method: 'POST',
      body: JSON.stringify(session),
    })

    this.sessionSaveQueue.set(key, savePromise)
    
    try {
      const result = await savePromise
      // Invalidate related caches
      this.invalidateCache(`/reading/stats/${session.pdfId}`)
      this.invalidateCache(`/reading/progress/${session.pdfId}`)
      return result
    } finally {
      // Clean up after a delay
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

  // Utility method to check backend connectivity (cached)
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`)
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

  // Helper to get PDF file URL with caching headers
  getPDFFileUrl(pdfId: string): string {
    return `${this.baseURL}/pdfs/${pdfId}/file`
  }

  // Cache management methods
  private invalidateCache(pattern: string) {
    const keysToDelete: string[] = []
    for (const [key] of this.requestCache) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.requestCache.delete(key))
    console.log(`Invalidated ${keysToDelete.length} cache entries for pattern:`, pattern)
  }

  clearCache() {
    this.requestCache.clear()
    this.pendingRequests.clear()
    console.log('API cache cleared')
  }

  getCacheStats() {
    return {
      cacheSize: this.requestCache.size,
      pendingRequests: this.pendingRequests.size,
      cacheEntries: Array.from(this.requestCache.keys())
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Development cache monitoring
if (import.meta.env.DEV) {
  // Test connectivity on startup
  apiClient.checkHealth().catch(error => {
    console.warn('Backend connection failed during startup:', error)
  })

  // Expose cache stats to window for debugging
  ;(window as any).apiCacheStats = () => apiClient.getCacheStats()
  ;(window as any).clearApiCache = () => apiClient.clearCache()
  
  console.log('Development mode: API cache debugging available')
  console.log('Use window.apiCacheStats() and window.clearApiCache() in console')
}