import axiosClient from './axiosClient'

export const businessRequestApi = {
  createBusinessRequest: (payload) => axiosClient.post('/business-requests', payload),
  getBusinessRequests: (params = {}) => axiosClient.get('/business-requests', { params }),
  getBusinessRequest: (id) => axiosClient.get(`/business-requests/${id}`),
  reviewBusinessRequest: (id, payload) => axiosClient.post(`/business-requests/${id}/review`, payload),
}
