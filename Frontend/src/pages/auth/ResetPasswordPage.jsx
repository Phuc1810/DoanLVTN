import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'
import PasswordInput from '../../components/common/PasswordInput'
import AuthShell from '../../components/layout/AuthShell'

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
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(form.password) || form.password !== form.password_confirmation) {
      setError({ message: 'Vui lòng nhập mật khẩu mạnh và xác nhận khớp.', errors: {} })
      return
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
    <AuthShell narrow>
      <div className="card auth-card p-4">
        <h4 className="fw-bold mb-2">Đặt mật khẩu mới</h4>
        <p className="text-muted mb-3">OTP hợp lệ. Vui lòng đặt mật khẩu mới.</p>
        <FormError message={error.message} errors={error.errors} />
        <form onSubmit={submit} noValidate>
          <div className="mb-3">
            <label className="form-label">Mật khẩu mới</label>
            <PasswordInput id="new_password" name="password" value={form.password} onChange={update} placeholder=">=8 ký tự, hoa/thường/số/ký tự đặc biệt" />
          </div>
          <div className="mb-3">
            <label className="form-label">Nhập lại mật khẩu mới</label>
            <PasswordInput id="confirm_password" name="password_confirmation" value={form.password_confirmation} onChange={update} />
          </div>
          <button className="btn btn-success w-100 btn-pill" disabled={submitting}>{submitting ? 'ĐANG ĐỔI...' : 'Xác nhận đổi mật khẩu'}</button>
        </form>
      </div>
    </AuthShell>
  )
}
