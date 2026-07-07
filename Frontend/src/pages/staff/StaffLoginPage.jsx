import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Eye, EyeOff, Lock, User, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'

export default function StaffLoginPage() {
  const { staffLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ login_key: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function updateField(event) {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [event.target.name]: value }))
    // Clear error for the field being typed in
    if (error?.errors?.[event.target.name]) {
      setError(curr => ({
        ...curr,
        errors: { ...curr.errors, [event.target.name]: null }
      }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    
    // Validate empty fields
    const validationErrors = {}
    if (!form.login_key.trim()) {
      validationErrors.login_key = ['Vui lòng nhập tên đăng nhập.']
    }
    if (!form.password) {
      validationErrors.password = ['Vui lòng nhập mật khẩu.']
    }

    if (Object.keys(validationErrors).length > 0) {
      setError({ errors: validationErrors })
      return
    }

    setSubmitting(true)
    setError(null)
    
    try {
      const auth = await staffLogin({ login_key: form.login_key, password: form.password })
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
    <div className="staff-login-wrapper">
      <div className="staff-login-container">
        {/* Cột trái */}
        <section className="staff-login-sidebar">
          <div className="sidebar-top">
            <div className="brand-logo">
              <div className="brand-icon">
                <ShieldCheck size={20} />
              </div>
              <span className="brand-name">Tour Admin</span>
            </div>
            <div className="brand-intro">
              <h1>Hệ quản trị nhân sự</h1>
              <p>Dành riêng cho nhân viên và quản trị viên quản lý tour, đơn đặt và dữ liệu hệ thống.</p>
            </div>
          </div>
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            <span>Về trang khách hàng</span>
          </Link>
        </section>

        {/* Cột phải */}
        <section className="staff-login-main">
          <div className="login-header">
            <h2>Chào mừng trở lại</h2>
            <p>Vui lòng nhập thông tin để tiếp tục</p>
          </div>

          {error?.message && (!error?.errors || Object.keys(error.errors).length === 0) && (
            <div className="alert alert-danger mb-4 py-2 px-3 fs-6 rounded-3">
              {error.message}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="login_key">Tên đăng nhập</label>
              <div className={`input-wrapper ${error?.errors?.login_key ? 'has-error' : ''}`}>
                <User className="input-icon" size={16} />
                <input
                  id="login_key"
                  name="login_key"
                  type="text"
                  placeholder="nhanvien12..."
                  value={form.login_key}
                  onChange={updateField}
                  required
                  autoComplete="username"
                />
                {error?.errors?.login_key && (
                  <div className="input-actions-right">
                    <div className="error-icon-container">
                      <AlertCircle fill="#dc3545" stroke="#fff" size={20} />
                    </div>
                  </div>
                )}
              </div>
              {error?.errors?.login_key && (
                <div className="field-error-text">
                  {error.errors.login_key[0] || error.errors.login_key}
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Mật khẩu</label>
              </div>
              <div className={`input-wrapper ${error?.errors?.password ? 'has-error' : ''}`}>
                <Lock className="input-icon" size={16} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={updateField}
                  required
                  autoComplete="current-password"
                />
                
                <div className="input-actions-right">
                  {error?.errors?.password && (
                    <div className="error-icon-container me-1">
                      <AlertCircle fill="#dc3545" stroke="#fff" size={20} />
                    </div>
                  )}
                  <button
                    type="button"
                    className="password-toggle position-relative"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error?.errors?.password && (
                <div className="field-error-text">
                  {error.errors.password[0] || error.errors.password}
                </div>
              )}
            </div>

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="login-footer">
            <p>© 2026 Hệ thống quản trị Tour.</p>
            <p>Bảo mật dữ liệu là ưu tiên hàng đầu.</p>
          </div>
        </section>
      </div>
    </div>
  )
}