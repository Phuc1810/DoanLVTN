import axios from 'axios'
import { clearAuthStorage, getToken } from '../utils/tokenStorage'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosClient.interceptors.response.use(
  (response) => {
    const body = response.data
    return body && Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body
  },
  (error) => {
    if (error.response?.status === 401) clearAuthStorage()

    const message =
      error.response?.data?.message || 'Không tải được dữ liệu. Vui lòng thử lại sau.'
    return Promise.reject(new Error(message))
  },
)

export default axiosClient
