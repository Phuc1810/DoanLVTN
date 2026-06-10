import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

axiosClient.interceptors.response.use(
  (response) => {
    const body = response.data
    return body && Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body
  },
  (error) => {
    const message =
      error.response?.data?.message || 'Không tải được dữ liệu. Vui lòng thử lại sau.'
    return Promise.reject(new Error(message))
  },
)

export default axiosClient
