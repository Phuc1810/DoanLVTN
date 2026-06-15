import axiosClient from './axiosClient'

export const staffBusinessRequestApi = {
  list: (params) => axiosClient.get('/staff/business-requests', { params }),
  show: (id) => axiosClient.get(`/staff/business-requests/${id}`),
  update: (id, payload) => axiosClient.patch(`/staff/business-requests/${id}`, payload),
}
