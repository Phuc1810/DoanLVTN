import axiosClient from './axiosClient'

export const newsApi = {
  list: (params = {}) => axiosClient.get('/tin-tuc', { params }),
  detail: (id) => axiosClient.get(`/tin-tuc/${id}`),
  getComments: (id) => axiosClient.get(`/tin-tuc/${id}/comments`),
  postComment: (id, content) => axiosClient.post(`/tin-tuc/${id}/comments`, { NoiDung: content }),
}
