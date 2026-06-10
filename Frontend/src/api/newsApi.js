import axiosClient from './axiosClient'

export const newsApi = {
  list: (params = {}) => axiosClient.get('/news', { params }),
  detail: (id) => axiosClient.get(`/news/${id}`),
}
