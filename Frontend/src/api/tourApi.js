import axiosClient from './axiosClient'

export const tourApi = {
  list: (params = {}) => axiosClient.get('/tours', { params }),
  detail: (id) => axiosClient.get(`/tours/${id}`),
  search: (params = {}) => axiosClient.get('/tours', { params }),
  region: (mien, params = {}) => axiosClient.get('/tours', { params: { ...params, mien } }),
  promotions: (params = {}) => axiosClient.get('/tours', { params }),
  reviews: (id) => axiosClient.get(`/tours/${id}/reviews`),
  schedules: (id) => axiosClient.get(`/tours/${id}/schedules`),
}
