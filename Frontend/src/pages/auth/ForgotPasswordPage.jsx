import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'
import AuthShell from '../../components/layout/AuthShell'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [contact, setContact] = useState('')
  const [error, setError] = useState({ message: '', errors: {} })
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError({ message: '', errors: {} })

    try {
      const response = await authApi.forgotPassword({ contact })
      const data = response?.data || response || {}
      sessionStorage.setItem('auth_reset_flow', JSON.stringify({
        contact,
        id: data.id || data.otp_id,
        otp_id: data.otp_id || data.id,
        masked: data.masked || data.masked_destination || data.destination || contact,
      }))
      navigate('/auth/verify-otp')
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell narrow>
      <div className="card auth-card p-4">
        <h4 className="fw-bold mb-2">Quên mật khẩu</h4>
        <p className="text-muted mb-3">Nhập Email (@gmail.com) hoặc SĐT (10 số) để nhận mã OTP.</p>
        <FormError message={error.message} errors={error.errors} />
        <form onSubmit={submit} noValidate>
          <div className="mb-3">
            <label className="form-label">Email hoặc SĐT</label>
            <input className="form-control" name="contact" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="vd: ten@gmail.com hoặc 0123456789" required />
          </div>
          <button className="btn btn-primary w-100 btn-pill" disabled={submitting}>{submitting ? 'ĐANG GỬI...' : 'Gửi OTP'}</button>
          <div className="text-center mt-3">
            <Link className="text-decoration-none" to="/auth/login">Quay về đăng nhập</Link>
          </div>
        </form>
      </div>
    </AuthShell>
  )
}
