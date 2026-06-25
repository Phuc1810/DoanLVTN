import axiosClient from './axiosClient'

export const staffTourApi = {
  list: (params) => axiosClient.get('/staff/tours', { params }),
  show: (id) => axiosClient.get(`/staff/tours/${id}`),
  create: (payload) => axiosClient.post('/staff/tours', payload),
  update: (id, payload) => axiosClient.post(`/staff/tours/${id}`, payload),
  toggle: (id) => axiosClient.patch(`/staff/tours/${id}/toggle`),
}
