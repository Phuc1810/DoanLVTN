import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'
import AuthShell from '../../components/layout/AuthShell'

function getFlow() {
  try {
    return JSON.parse(sessionStorage.getItem('auth_reset_flow') || '{}')
  } catch {
    return {}
  }
}

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const [flow] = useState(getFlow)
  const [otp, setOtp] = useState('')
  const [remain, setRemain] = useState(20)
  const [message, setMessage] = useState('')
  const [error, setError] = useState({ message: '', errors: {} })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (remain <= 0) return undefined
    const timer = window.setInterval(() => setRemain((current) => current - 1), 1000)
    return () => window.clearInterval(timer)
  }, [remain])

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError({ message: '', errors: {} })

    try {
      const response = await authApi.verifyOtp({ id: flow.id, otp_id: flow.otp_id, otp })
      const data = response?.data || response || {}
      sessionStorage.setItem('auth_reset_verified', JSON.stringify({
        ...flow,
        reset_token: data.reset_token || data.token,
      }))
      navigate('/auth/reset-password')
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    } finally {
      setSubmitting(false)
    }
  }

  async function resend() {
    setMessage('')
    setError({ message: '', errors: {} })
    try {
      const response = await authApi.resendOtp({ id: flow.id, otp_id: flow.otp_id, contact: flow.contact })
      const data = response?.data || response || {}
      sessionStorage.setItem('auth_reset_flow', JSON.stringify({ ...flow, id: data.id || flow.id, otp_id: data.otp_id || flow.otp_id }))
      setMessage(response.message || 'Đã gửi lại OTP.')
      setRemain(20)
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    }
  }

  return (
    <AuthShell narrow>
      <div className="card auth-card p-4">
        <h4 className="fw-bold mb-2">Xác minh OTP</h4>
        <p className="text-muted mb-3">OTP đã gửi tới: <b>{flow.masked || flow.contact || 'thông tin của bạn'}</b></p>
        <FormError message={error.message} errors={error.errors} />
        {message && <div className="alert alert-success">{message}</div>}
        <form onSubmit={submit} noValidate>
          <div className="mb-3">
            <label className="form-label">Mã OTP (6 số)</label>
            <input className="form-control" name="otp" inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="VD: 123456" required />
          </div>
          <button className="btn btn-primary w-100 btn-pill" disabled={submitting}>{submitting ? 'ĐANG XÁC NHẬN...' : 'Xác nhận OTP'}</button>
        </form>

        <div className="mt-3 text-center">
          {remain > 0 ? (
            <div className="text-muted">Bạn có thể gửi lại OTP sau <b>{remain}s</b></div>
          ) : (
            <button className="btn btn-link text-decoration-none" type="button" onClick={resend}>Gửi lại OTP</button>
          )}
          <div className="mt-2"><Link className="text-decoration-none" to="/auth/login">Quay về đăng nhập</Link></div>
        </div>
      </div>
    </AuthShell>
  )
}
