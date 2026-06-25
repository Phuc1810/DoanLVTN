import axiosClient from './axiosClient'

export const bookingApi = {
  createBooking: (payload) => axiosClient.post('/bookings', payload),
}
