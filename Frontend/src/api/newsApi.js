import axiosClient from './axiosClient'

export const newsApi = {
  list: (params = {}) => axiosClient.get('/tin-tuc', { params }),
  detail: (id) => axiosClient.get(`/tin-tuc/${id}`),
}
