import { useEffect, useMemo, useState } from 'react'
import { authApi } from '../api/authApi'
import {
  clearAuthStorage,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '../utils/tokenStorage'
import { AuthContext } from './AuthContext'

function extractAuthPayload(response) {
  const data = response?.data || response || {}
  let user = data.user || data.tai_khoan || data.account || data
  if (data.tai_khoan && data.nhan_vien) {
    user = { ...user, nhan_vien: data.nhan_vien }
  }
  return {
    token: data.token || data.access_token || data.plainTextToken,
    user: user,
  }
}

function extractCurrentUser(response) {
  const data = response?.data || response || {}
  let currentUser = data.tai_khoan || data.user || data.account || data
  if (data.tai_khoan && data.nhan_vien) {
    currentUser = { ...currentUser, nhan_vien: data.nhan_vien }
  }
  return currentUser
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken())
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(Boolean(getToken()))

  useEffect(() => {
    if (!token) {
      return
    }

    authApi.me()
      .then((response) => {
        const currentUser = extractCurrentUser(response)
        setUser(currentUser)
        setStoredUser(currentUser)
      })
      .catch(() => {
        clearAuthStorage()
        setTokenState(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  async function login(payload) {
    const response = await authApi.login(payload)
    const auth = extractAuthPayload(response)
    if (auth.token) {
      setToken(auth.token)
      setTokenState(auth.token)
    }
    if (auth.user) {
      setUser(auth.user)
      setStoredUser(auth.user)
    }
    return auth
  }

  async function staffLogin(payload) {
    const response = await authApi.staffLogin(payload)
    const auth = extractAuthPayload(response)
    if (auth.token) {
      setToken(auth.token)
      setTokenState(auth.token)
    }
    if (auth.user) {
      setUser(auth.user)
      setStoredUser(auth.user)
    }
    return auth
  }

  async function googleLogin(payload) {
    const response = await authApi.googleLogin(payload)
    const auth = extractAuthPayload(response)
    if (auth.token) {
      setToken(auth.token)
      setTokenState(auth.token)
    }
    if (auth.user) {
      setUser(auth.user)
      setStoredUser(auth.user)
    }
    return auth
  }

  async function logout() {
    if (getToken()) {
      try {
        await authApi.logout()
      } catch {
        // Local logout still has to clear stale credentials.
      }
    }

    clearAuthStorage()
    setTokenState(null)
    setUser(null)
  }

  async function refreshMe() {
    const response = await authApi.me()
    const currentUser = extractCurrentUser(response)
    setUser(currentUser)
    setStoredUser(currentUser)
    return currentUser
  }

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    isCustomer: Boolean(token && user && user.VaiTro === 'KH'),
    isStaff: Boolean(token && user && ['NV', 'AD'].includes(user.VaiTro)),
    login,
    staffLogin,
    googleLogin,
    register: authApi.register,
    logout,
    refreshMe,
  }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
