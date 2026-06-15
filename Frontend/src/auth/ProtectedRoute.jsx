import { Navigate, useLocation } from 'react-router-dom'
import Loading from '../components/common/Loading'
import { roleRedirect } from '../utils/roleRedirect'
import { useAuth } from './useAuth'

export default function ProtectedRoute({ roles, children, loginPath = '/auth/login' }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loading />

  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  if (roles?.length && !roles.includes(user?.VaiTro)) {
    return <Navigate to={roleRedirect(user)} replace />
  }

  return children
}
