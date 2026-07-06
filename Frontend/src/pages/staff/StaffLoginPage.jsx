import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import FormError from '../../components/common/FormError'
export default function StaffLoginPage() {
  const { staffLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ login_key: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }
  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const auth = await staffLogin(form)
      const role = auth.user?.VaiTro
      if (role !== 'NV' && role !== 'AD') {
        setError({ message: 'Tài khoản này không có quyền truy cập khu vực nhân viên.' })
        return
      }
      navigate(location.state?.from?.pathname || '/staff', { replace: true })
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className="staff-login-page">
      <div className="staff-login-card">
        <section className="staff-login-left">
          <div className="staff-login-logo">Tour Staff</div>
          <div>
            <h1>Đăng nhập nhân viên</h1>
            <p>Quản lý tour, đơn đặt tour, tin tức, khuyến mãi và yêu cầu doanh nghiệp theo giao diện nhân viên cũ.</p>
          </div>
          <Link className="text-white" to="/">Về trang khách hàng</Link>
        </section>
        <section className="staff-login-right">
          <div className="staff-login-title">Chào mừng trở lại</div>
          <div className="staff-login-subtitle">Dùng tài khoản nhân viên hoặc quản trị viên để tiếp tục.</div>
          <FormError message={error?.message} errors={error?.errors} />
          <form onSubmit={handleSubmit}>
            <div className="staff-field mb-3">
              <label htmlFor="login_key">Tên đăng nhập hoặc email</label>
              <input id="login_key" name="login_key" value={form.login_key} onChange={updateField} required autoComplete="username" />
            </div>
            <div className="staff-field mb-3">
              <label htmlFor="password">Mật khẩu</label>
              <input id="password" name="password" type="password" value={form.password} onChange={updateField} required autoComplete="current-password" />
            </div>
            <button type="submit" className="staff-action-btn primary w-100" disabled={submitting}>
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}