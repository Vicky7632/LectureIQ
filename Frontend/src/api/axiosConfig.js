import axios from 'axios'
import { resolveApiUrl } from '../contexts/socketClientConfig'

const API_URL = resolveApiUrl({
  configuredApiUrl: import.meta.env.VITE_API_URL,
  isDevelopment: import.meta.env.DEV,
  frontendOrigin: window.location.origin,
})

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important – sends cookies with every request
})

// Response interceptor – handle 401 (unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any local user data and redirect to login
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance