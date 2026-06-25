import axiosClient from './axiosClient'

export const tourApi = {
  list: (params = {}) => axiosClient.get('/tours', { params }),
  featured: (params = {}) => axiosClient.get('/tours/featured', { params }),
  locations: () => axiosClient.get('/tours/locations'),
  detail: (id) => axiosClient.get(`/tours/${id}`),
  search: (params = {}) => axiosClient.get('/tours/search', { params }),
  region: (mien, params = {}) => axiosClient.get('/tours', { params: { ...params, mien } }),
  promotions: (params = {}) => axiosClient.get('/tours/promotions', { params }),
  reviews: (id) => axiosClient.get(`/tours/${id}/reviews`),
  schedules: (id) => axiosClient.get(`/tours/${id}/schedules`),
}
