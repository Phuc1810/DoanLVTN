import axiosClient from './axiosClient';

const adminReviewApi = {
  list(params) {
    return axiosClient.get('/admin/reviews', { params });
  },

  toggleStatus(id) {
    return axiosClient.patch(`/admin/reviews/${id}/toggle-status`);
  },

  reply(id, data) {
    return axiosClient.post(`/admin/reviews/${id}/reply`, data);
  }
};

export default adminReviewApi;
