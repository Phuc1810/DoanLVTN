import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import FormError from '../../components/common/FormError'

export default function AdminLoginPage() {
  const { staffLogin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ login_key: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (error?.message) {
      const timer = setTimeout(() => {
        setError(curr => curr ? { ...curr, message: null } : null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error?.message]);

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const auth = await staffLogin(form)
      if (auth.user?.VaiTro !== 'AD') {
        await logout()
        setError({ message: 'Tài khoản này không có quyền quản trị Admin.' })
        return
      }
      navigate(location.state?.from?.pathname || '/admin', { replace: true })
    } catch (err) {
      let topMsg = err.message;
      if (topMsg === 'Dữ liệu không hợp lệ' || topMsg === 'Dữ liệu không hợp lệ.') {
        topMsg = err.errors?.account?.[0] || '';
      }
      setError({ message: topMsg, errors: err.errors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <section className="admin-login-left">
          <div className="fw-bold fs-3">VietJourney</div>
          <div>
            <h1 className="fw-bold mb-3">Admin Portal</h1>
            <p className="mb-0">Quản lý tài khoản, phân quyền và trạng thái người dùng hệ thống.</p>
          </div>
          <Link className="text-white" to="/">Về trang khách hàng</Link>
        </section>
        <section className="admin-login-right">
          <h3 className="fw-bold mb-2">Đăng nhập Admin</h3>
          <p className="text-muted mb-4">Dùng tài khoản có vai trò AD.</p>
          {error?.message && (
            <div className="toast align-items-center text-white bg-danger border-0 show fade" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '250px' }}>
              <div className="d-flex">
                <div className="toast-body fw-semibold">
                  <i className="fa-solid fa-triangle-exclamation me-2"></i>
                  {error.message}
                </div>
                <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setError(curr => curr ? { ...curr, message: null } : null)}></button>
              </div>
            </div>
          )}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-bold small text-muted">Tên đăng nhập hoặc email</label>
              <input className="admin-input" name="login_key" value={form.login_key} onChange={(event) => setForm((current) => ({ ...current, login_key: event.target.value }))} required autoComplete="username" />
            </div>
            <div className="mb-4">
              <label className="form-label fw-bold small text-muted">Mật khẩu</label>
              <input className="admin-input" name="password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required autoComplete="current-password" />
            </div>
            <button type="submit" className="admin-btn primary w-100" disabled={submitting}>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
          </form>
        </section>
      </div>
    </div>
  )
}
