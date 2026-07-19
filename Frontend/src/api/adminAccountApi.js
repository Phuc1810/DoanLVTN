import axiosClient from './axiosClient'

export const adminAccountApi = {
  getAccounts: (params) => axiosClient.get('/admin/accounts', { params }),
  getAccountDetails: (id) => axiosClient.get(`/admin/accounts/${id}`),
  getStats: () => axiosClient.get('/admin/accounts/stats'),
  createStaff: (payload) => axiosClient.post('/admin/accounts/staff', payload),
  updateRole: (id, role) => axiosClient.patch(`/admin/accounts/${id}/role`, { role, VaiTro: role }),
  toggleStatus: (id) => axiosClient.patch(`/admin/accounts/${id}/status`),
  resetPassword: (id, payload) => axiosClient.patch(`/admin/accounts/${id}/reset-password`, payload),
}
