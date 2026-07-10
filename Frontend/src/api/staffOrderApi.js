import axiosClient from './axiosClient'

export const staffOrderApi = {
  list: (params) => axiosClient.get('/staff/orders', { params }),
  show: (id) => axiosClient.get(`/staff/orders/${id}`),
  stats: () => axiosClient.get('/staff/orders/stats'),
}
