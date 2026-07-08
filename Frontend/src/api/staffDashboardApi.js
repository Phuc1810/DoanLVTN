import axiosClient from './axiosClient'

export const staffDashboardApi = {
  getStats: () => axiosClient.get('/staff/dashboard/stats'),
  getRevenueWeekly: () => axiosClient.get('/staff/dashboard/revenue-weekly'),
  getTourStatus: () => axiosClient.get('/staff/dashboard/tour-status'),
}
