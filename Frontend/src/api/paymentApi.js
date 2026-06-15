import axiosClient from './axiosClient'

export const paymentApi = {
  getPayment: (orderId) => axiosClient.get(`/payments/${orderId}`),
  checkPayment: (orderId) => axiosClient.get(`/payments/${orderId}/check`),
}
