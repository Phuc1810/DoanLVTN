import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authApi } from '../../api/authApi'
import AuthShell from '../../components/layout/AuthShell'
import { roleRedirect } from '../../utils/roleRedirect'
import { setStoredUser, setToken } from '../../utils/tokenStorage'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState('Đang xử lý đăng nhập Google...')

  useEffect(() => {
    const credential = searchParams.get('credential')
    const code = searchParams.get('code')

    if (!credential && !code) {
      return
    }

    authApi.googleLogin({ credential, code })
      .then((response) => {
        const data = response?.data || response || {}
        const token = data.token || data.access_token
        const user = data.user || data.tai_khoan || data
        if (token) setToken(token)
        if (user) setStoredUser(user)
        navigate(roleRedirect(user), { replace: true })
      })
      .catch((error) => setMessage(error.message))
  }, [navigate, searchParams])

  return (
    <AuthShell narrow>
      <div className="card auth-card p-4 text-center">
        <h4 className="fw-bold mb-2">Google Login</h4>
        <p className="text-muted mb-4">
          {searchParams.get('credential') || searchParams.get('code')
            ? message
            : 'Google login chưa được cấu hình. Cần Google credential/code từ frontend hoặc redirect callback.'}
        </p>
        <Link to="/auth/login" className="btn btn-primary btn-pill w-100">Về trang đăng nhập</Link>
      </div>
    </AuthShell>
  )
}
