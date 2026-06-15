import axios from 'axios'
import { clearAuthStorage, getToken } from '../utils/tokenStorage'

const authClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

authClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

authClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) clearAuthStorage()

    const payload = error.response?.data || {}
    const normalized = new Error(payload.message || 'Yêu cầu thất bại. Vui lòng thử lại.')
    normalized.errors = payload.errors || {}
    normalized.status = error.response?.status
    throw normalized
  },
)

export const authApi = {
  register: (payload) => authClient.post('/auth/register', payload),
  login: (payload) => authClient.post('/auth/login', payload),
  staffLogin: (payload) => authClient.post('/auth/staff-login', payload),
  logout: () => authClient.post('/auth/logout'),
  me: () => authClient.get('/auth/me'),
  forgotPassword: (payload) => authClient.post('/auth/forgot-password', payload),
  verifyOtp: (payload) => authClient.post('/auth/verify-otp', payload),
  resendOtp: (payload) => authClient.post('/auth/resend-otp', payload),
  resetPassword: (payload) => authClient.post('/auth/reset-password', payload),
  googleLogin: (payload) => authClient.post('/auth/google', payload),
  changePassword: (payload) => authClient.post('/auth/change-password', payload),
}
