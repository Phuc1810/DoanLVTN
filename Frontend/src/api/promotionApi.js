import axiosClient from './axiosClient'

export const promotionApi = {
  list: (params = {}) => axiosClient.get('/khuyen-mai', { params }),
  detail: (id) => axiosClient.get(`/khuyen-mai/${id}`),
}
