const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // PDF endpoints
  async uploadPDF(file: File) {
    const formData = new FormData()
    formData.append('pdf', file)
    
    const response = await fetch(`${this.baseURL}/pdfs/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return await response.json()
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
}

export const apiClient = new ApiClient(API_BASE_URL)
