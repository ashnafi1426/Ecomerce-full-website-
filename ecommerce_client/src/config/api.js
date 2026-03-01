import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Return just the data for cleaner API calls
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    // Extract error message from various possible locations
    let errorMessage = 'An error occurred'
    
    if (error.response) {
      // Server responded with error
      errorMessage = error.response.data?.message 
        || error.response.data?.error 
        || error.response.statusText 
        || `Server error: ${error.response.status}`
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'No response from server. Please check your connection.'
    } else {
      // Error in request setup
      errorMessage = error.message || 'Request failed'
    }
    
    // Return a clean error object
    const enhancedError = new Error(errorMessage)
    enhancedError.status = error.response?.status
    enhancedError.data = error.response?.data
    
    return Promise.reject(enhancedError)
  }
)

export default api
