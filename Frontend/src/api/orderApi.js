import axiosClient from './axiosClient'

export const orderApi = {
  getOrders: (params = {}) => axiosClient.get('/orders', { params }),
  getOrder: (id) => axiosClient.get(`/orders/${id}`),
  reviewOrder: (id, payload) => axiosClient.post(`/orders/${id}/review`, payload),
  cancelOrder: (id, payload) => axiosClient.post(`/orders/${id}/cancel`, payload),
}
