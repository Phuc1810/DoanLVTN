import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import FormError from '../../components/common/FormError'
import PasswordInput from '../../components/common/PasswordInput'
import AuthShell from '../../components/layout/AuthShell'
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
    <AuthShell>
      <div className="card auth-card">
        <div className="row g-0">
          <div className="col-md-5 d-none d-md-block">
            <div className="auth-left h-100">
              <div className="brand"><i className="fa-solid fa-plane-departure"></i> TourDuLich</div>
              <div className="slogan">Đăng nhập để đặt tour nhanh hơn, theo dõi đơn đặt tour và nhận ưu đãi.</div>
              <div className="mt-4">
                <div className="bullet"><i className="fa-solid fa-check"></i><div>Đặt tour & quản lý đơn</div></div>
                <div className="bullet"><i className="fa-solid fa-check"></i><div>Nhận khuyến mãi theo tài khoản</div></div>
                <div className="bullet"><i className="fa-solid fa-check"></i><div>Đăng nhập Google 1 chạm</div></div>
              </div>
            </div>
          </div>

          <div className="col-md-7">
            <div className="auth-right">
              <ul className="nav nav-pills seg-tabs mb-3" role="tablist">
                <li className="nav-item">
                  <button className="nav-link active" type="button">Đăng nhập</button>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/auth/register">Đăng ký</Link>
                </li>
              </ul>

              <div className="d-flex gap-2 mb-3">
                <button type="button" className={`btn btn-sm ${mode === 'customer' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMode('customer')}>Khách hàng</button>
                <button type="button" className={`btn btn-sm ${mode === 'staff' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMode('staff')}>Nhân viên/Admin</button>
              </div>

              <FormError message={error.message} errors={error.errors} />

              <form onSubmit={submit} noValidate>
                <div className="mb-3">
                  <label className="form-label">Email hoặc SĐT</label>
                  <input className="form-control" name="login_key" value={form.login_key} onChange={update} placeholder="vd: ten@gmail.com hoặc 0123456789" />
                </div>

                <div className="mb-2">
                  <label className="form-label">Mật khẩu</label>
                  <PasswordInput id="login_password" name="password" value={form.password} onChange={update} placeholder="Nhập mật khẩu" />
                  <div className="text-end mt-2">
                    <Link to="/auth/forgot-password" className="text-decoration-none">Quên mật khẩu?</Link>
                  </div>
                </div>

                <button className="btn btn-primary w-100 btn-pill mt-3" disabled={submitting}>
                  {submitting ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
                </button>

                <div className="divider my-4">hoặc</div>
                <Link to="/auth/google-callback" className="btn btn-outline-secondary w-100 btn-pill">
                  <i className="fa-brands fa-google me-2"></i>Đăng nhập Google
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthShell>
  )
}
