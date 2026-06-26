import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'
import PasswordInput from '../../components/common/PasswordInput'

function getVerified() {
  try {
    return JSON.parse(sessionStorage.getItem('auth_reset_verified') || '{}')
  } catch {
    return {}
  }
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [verified] = useState(getVerified)
  const [form, setForm] = useState({ password: '', password_confirmation: '' })
  const [error, setError] = useState({ message: '', errors: {} })
  const [submitting, setSubmitting] = useState(false)

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    
    const newErrors = {};
    if (!form.password) {
      newErrors.password = ['Vui lòng nhập mật khẩu mới.'];
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(form.password)) {
      newErrors.password = ['Mật khẩu phải từ 8 ký tự, gồm hoa, thường, số và ký tự đặc biệt.'];
    }

    if (!form.password_confirmation) {
      newErrors.password_confirmation = ['Vui lòng nhập lại mật khẩu xác nhận.'];
    } else if (form.password !== form.password_confirmation) {
      newErrors.password_confirmation = ['Mật khẩu xác nhận không khớp.'];
    }

    if (Object.keys(newErrors).length > 0) {
      setError({ message: '', errors: newErrors });
      return;
    }

    setSubmitting(true)
    setError({ message: '', errors: {} })
    try {
      await authApi.resetPassword({
        id: verified.id,
        otp_id: verified.otp_id,
        reset_token: verified.reset_token,
        password: form.password,
        password_confirmation: form.password_confirmation,
        new_password: form.password,
        confirm_password: form.password_confirmation,
      })
      sessionStorage.removeItem('auth_reset_flow')
      sessionStorage.removeItem('auth_reset_verified')
      navigate(`/auth/reset-success?prefill=${encodeURIComponent(verified.contact || '')}`, { replace: true })
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ marginTop: '40px' }}>
        {/* === KHUNG TRÁI: Xanh dương === */}
        <div className="auth-left">
          <div className="brand">
            <i className="fa-solid fa-plane-departure"></i> TourDuLich
          </div>
          <div className="slogan">
            Hoàn tất thiết lập lại mật khẩu để truy cập vào tài khoản của bạn.
          </div>
          <div className="auth-bullets">
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Bảo mật dữ liệu cá nhân</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Khôi phục quyền truy cập</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Trải nghiệm dịch vụ nhanh chóng</span></div>
          </div>
        </div>

        {/* === KHUNG PHẢI: Form === */}
        <div className="auth-right">
          <h3 className="fw-bold mb-2" style={{ color: '#0f172a', fontSize: '26px' }}>Đặt mật khẩu mới</h3>
          <p className="mb-4" style={{ color: '#64748b', fontSize: '15px' }}>OTP hợp lệ. Vui lòng thiết lập mật khẩu mới.</p>
          
          <FormError message={error.message} />

          <form onSubmit={submit} noValidate>
            <div className="auth-field">
              <label className="auth-label">Mật khẩu mới</label>
              <PasswordInput 
                id="new_password" 
                name="password" 
                value={form.password} 
                onChange={update} 
                placeholder="≥ 8 ký tự, có hoa/thường/số/ký tự đặc biệt" 
                invalid={!!error.errors?.password}
              />
              {error.errors?.password && <div className="field-error">{error.errors.password[0]}</div>}
            </div>

            <div className="auth-field">
              <label className="auth-label">Nhập lại mật khẩu mới</label>
              <PasswordInput 
                id="confirm_password" 
                name="password_confirmation" 
                value={form.password_confirmation} 
                onChange={update} 
                placeholder="Nhập lại mật khẩu vừa tạo" 
                invalid={!!error.errors?.password_confirmation}
              />
              {error.errors?.password_confirmation && <div className="field-error">{error.errors.password_confirmation[0]}</div>}
            </div>

            <button className="auth-submit-btn mt-3" type="submit" disabled={submitting}>
              {submitting ? 'ĐANG ĐỔI...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
