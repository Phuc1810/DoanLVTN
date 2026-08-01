import axiosClient from './axiosClient'

const notificationApi = {
  getNotifications() {
    return axiosClient.get('/staff/notifications')
  },
  markAsRead(id) {
    return axiosClient.post(`/staff/notifications/${id}/read`)
  },
  markAllAsRead() {
    return axiosClient.post('/staff/notifications/read-all')
  }
}

export default notificationApi
