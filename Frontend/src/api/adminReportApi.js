import axiosClient from './axiosClient';

const adminReportApi = {
  /**
   * Lấy báo cáo doanh thu
   * @param {Object} params - { start_date, end_date }
   */
  getRevenue(params) {
    return axiosClient.get('/admin/reports/revenue', { params });
  },

  /**
   * Tải file báo cáo doanh thu (CSV)
   * @param {Object} params - { start_date, end_date }
   */
  exportRevenue(params) {
    return axiosClient.get('/admin/reports/revenue/export', {
      params,
      responseType: 'blob', // Quan trọng để nhận file
    });
  }
};

export default adminReportApi;
