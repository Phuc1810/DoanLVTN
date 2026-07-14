import axiosClient from './axiosClient'

export const staffPromotionApi = {
  list: (params) => axiosClient.get('/staff/promotions', { params }),
  stats: () => axiosClient.get('/staff/promotions/stats'),
  chartData: (year) => axiosClient.get('/staff/promotions/chart-data', { params: { year } }),
  show: (id) => axiosClient.get(`/staff/promotions/${id}`),
  create: (payload) => axiosClient.post('/staff/promotions', payload),
  update: (id, payload) => axiosClient.post(`/staff/promotions/${id}`, payload),
  toggle: (id) => axiosClient.patch(`/staff/promotions/${id}/toggle`),
  attachTours: (id, payload) => axiosClient.post(`/staff/promotions/${id}/tours`, payload),
  detachTour: (id, tourId) => axiosClient.delete(`/staff/promotions/${id}/tours/${tourId}`),
}
