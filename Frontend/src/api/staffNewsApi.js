import axiosClient from './axiosClient'

export const staffNewsApi = {
  list: (params) => axiosClient.get('/staff/news', { params }),
  show: (id) => axiosClient.get(`/staff/news/${id}`),
  create: (payload) => axiosClient.post('/staff/news', payload),
  update: (id, payload) => axiosClient.post(`/staff/news/${id}`, payload),
  toggle: (id) => axiosClient.patch(`/staff/news/${id}/toggle`),
}
