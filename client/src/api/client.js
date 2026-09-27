import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: false,
})

// Bug Fix: Reading token once at module load means it's stale after login/logout.
// AuthContext already sets the header dynamically — this block caused a race
// condition where a freshly-logged-in user's token was never picked up.
// Removed the stale one-time read; AuthContext is the single source of truth.

// Attach token on every request so it always reflects the latest value
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient

