import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import FormError from '../../components/common/FormError'
import PasswordInput from '../../components/common/PasswordInput'
import { roleRedirect } from '../../utils/roleRedirect'
import { useAuth } from '../../auth/useAuth'

export default function LoginPage() {
  const { login, staffLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState('customer')
  const [form, setForm] = useState({
    login_key: searchParams.get('prefill') || '',
    password: '',
  })
  const [error, setError] = useState({ message: '', errors: {} })
  const [submitting, setSubmitting] = useState(false)

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    
    // Front-end validation for empty fields
    const newErrors = {};
    if (!form.login_key.trim()) {
      newErrors.login_key = ['Vui lòng nhập Email hoặc SĐT.'];
    }
    if (!form.password) {
      newErrors.password = ['Vui lòng nhập mật khẩu.'];
    }
    
    if (Object.keys(newErrors).length > 0) {
      setError({ message: '', errors: newErrors });
      return;
    }

    setError({ message: '', errors: {} })
    setSubmitting(true)

    try {
      const auth = mode === 'staff'
        ? await staffLogin(form)
        : await login(form)
      const fallback = location.state?.from?.pathname || searchParams.get('redirect') || '/'
      navigate(roleRedirect(auth.user, fallback), { replace: true })
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* === KHUNG TRÁI: Xanh dương === */}
        <div className="auth-left">
          <div className="brand">
            <i className="fa-solid fa-plane-departure"></i> TourDuLich
          </div>
          <div className="slogan">
            Đăng nhập để đặt tour nhanh hơn, theo dõi đơn đặt tour và nhận ưu đãi.
          </div>
          <div className="auth-bullets">
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Đặt tour &amp; quản lý đơn</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Nhận khuyến mãi theo tài khoản</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Đăng nhập Google 1 chạm</span></div>
          </div>
        </div>

        {/* === KHUNG PHẢI: Form đăng nhập === */}
        <div className="auth-right">
          <ul className="seg-tabs">
            <li className="seg-tab-item">
              <button className="seg-tab-link active" type="button">Đăng nhập</button>
            </li>
            <li className="seg-tab-item">
              <Link className="seg-tab-link" to={`/auth/register${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''}`}>Đăng ký</Link>
            </li>
          </ul>

          <FormError message={error.message} />

          <form onSubmit={submit} noValidate>
            <div className="auth-field">
              <label className="auth-label">Email hoặc SĐT</label>
              <div className="auth-input-wrapper">
                <input 
                  className={`auth-input ${error.errors?.login_key ? 'is-invalid' : ''}`} 
                  name="login_key" 
                  value={form.login_key} 
                  onChange={update} 
                  placeholder="vd: ten@gmail.com hoặc 0123456789" 
                />
                {error.errors?.login_key && <i className="fa-solid fa-circle-exclamation auth-error-icon"></i>}
              </div>
              {error.errors?.login_key && <div className="field-error">{error.errors.login_key[0]}</div>}
            </div>

            <div className="auth-field">
              <label className="auth-label">Mật khẩu</label>
              <PasswordInput 
                id="login_password" 
                name="password" 
                value={form.password} 
                onChange={update} 
                placeholder="Nhập mật khẩu" 
                invalid={!!error.errors?.password}
              />
              {error.errors?.password && <div className="field-error">{error.errors.password[0]}</div>}
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <Link to="/auth/forgot-password" className="auth-link">Quên mật khẩu?</Link>
              </div>
            </div>

            <button className="auth-submit-btn" type="submit" disabled={submitting}>
              {submitting ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
            </button>

            <div className="auth-divider"><span>hoặc</span></div>

            <Link to={`/auth/google-callback${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''}`} className="auth-google-btn">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="20" height="20" />
              Đăng nhập bằng Google
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}
