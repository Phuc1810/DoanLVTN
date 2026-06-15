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
  return {
    token: data.token || data.access_token || data.plainTextToken,
    user: data.user || data.tai_khoan || data.account || data,
  }
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
        const currentUser = response?.data?.user || response?.data || response?.user || response
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
    const currentUser = response?.data?.user || response?.data || response?.user || response
    setUser(currentUser)
    setStoredUser(currentUser)
    return currentUser
  }

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    staffLogin,
    register: authApi.register,
    logout,
    refreshMe,
  }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
