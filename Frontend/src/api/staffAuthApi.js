import { authApi } from './authApi'

export const staffAuthApi = {
  login: authApi.staffLogin,
  logout: authApi.logout,
  me: authApi.me,
  changePassword: authApi.changePassword,
}
