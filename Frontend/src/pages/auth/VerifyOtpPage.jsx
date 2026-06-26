import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'

const RESEND_SECONDS = 20

function getFlow() {
  try {
    return JSON.parse(sessionStorage.getItem('auth_reset_flow') || '{}')
  } catch {
    return {}
  }
}

function getResendDeadline(flow) {
  return Number(flow?.resend_available_at) || Date.now() + RESEND_SECONDS * 1000
}

function getRemainingSeconds(deadline) {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
}

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const [flow, setFlow] = useState(() => {
    const storedFlow = getFlow()
    const resendAvailableAt = getResendDeadline(storedFlow)
    const nextFlow = { ...storedFlow, resend_available_at: resendAvailableAt }
    sessionStorage.setItem('auth_reset_flow', JSON.stringify(nextFlow))
    return nextFlow
  })
  const [otp, setOtp] = useState(new Array(6).fill(''))
  const [remain, setRemain] = useState(() => getRemainingSeconds(getResendDeadline(getFlow())))
  const [message, setMessage] = useState('')
  const [error, setError] = useState({ message: '', errors: {} })
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const otpRefs = useRef([])

  const handleOtpChange = (event, index) => {
    const value = event.target.value
    if (!/^[0-9]*$/.test(value)) return

    const nextOtp = [...otp]

    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('')
      for (let i = 0; i < pasted.length; i += 1) {
        nextOtp[i] = pasted[i]
      }
      setOtp(nextOtp)
      otpRefs.current[Math.min(pasted.length, 5)]?.focus()
      return
    }

    nextOtp[index] = value
    setOtp(nextOtp)

    if (value !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  useEffect(() => {
    const deadline = Number(flow?.resend_available_at)
    if (!deadline) return undefined

    const syncCountdown = () => {
      setRemain(getRemainingSeconds(deadline))
    }

    syncCountdown()
    const timer = window.setInterval(syncCountdown, 250)

    return () => window.clearInterval(timer)
  }, [flow?.resend_available_at])

  useEffect(() => {
    if (!message) return undefined

    const timer = window.setTimeout(() => setMessage(''), 5000)
    return () => window.clearTimeout(timer)
  }, [message])

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError({ message: '', errors: {} })

    const finalOtp = otp.join('')
    if (finalOtp.length < 6) {
      setError({ message: '', errors: { otp: ['Vui lòng nhập đủ 6 số.'] } })
      setSubmitting(false)
      return
    }

    try {
      const response = await authApi.verifyOtp({ id: flow.id, otp_id: flow.otp_id, otp: finalOtp })
      const data = response?.data || response || {}

      sessionStorage.setItem(
        'auth_reset_verified',
        JSON.stringify({
          ...flow,
          reset_token: data.reset_token || data.token,
        }),
      )

      navigate('/auth/reset-password')
    } catch (err) {
      let topMessage = err.message
      if (topMessage === 'Dữ liệu không hợp lệ' || topMessage === 'Dữ liệu không hợp lệ.') {
        topMessage = ''
      }

      setError({ message: topMessage, errors: err.errors || {} })
      setOtp(new Array(6).fill(''))
      otpRefs.current[0]?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  async function resend() {
    if (resending) return

    setMessage('')
    setError({ message: '', errors: {} })
    setResending(true)

    try {
      const response = await authApi.resendOtp({ id: flow.id, otp_id: flow.otp_id, contact: flow.contact })
      const data = response?.data || response || {}
      const nextFlow = {
        ...flow,
        id: data.id || flow.id,
        otp_id: data.otp_id || flow.otp_id,
        resend_available_at: Date.now() + RESEND_SECONDS * 1000,
      }

      sessionStorage.setItem('auth_reset_flow', JSON.stringify(nextFlow))
      setFlow(nextFlow)
      setRemain(RESEND_SECONDS)
      setMessage(response.message || 'Đã gửi lại OTP thành công.')
    } catch (err) {
      setError({ message: err.message, errors: err.errors || {} })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-shell">
      {message && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 1050,
            minWidth: '320px',
            maxWidth: '420px',
            padding: '14px 18px',
            borderRadius: '14px',
            background: '#dcfce7',
            border: '1px solid #86efac',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
            color: '#166534',
            fontSize: '15px',
            fontWeight: '600',
          }}
        >
          {message}
        </div>
      )}

      <div className="auth-card" style={{ marginTop: '40px' }}>
        <div className="auth-left">
          <div className="brand">
            <i className="fa-solid fa-plane-departure"></i> TourDuLich
          </div>
          <div className="slogan">
            Xác thực tài khoản để bảo mật thông tin và quyền lợi của bạn.
          </div>
          <div className="auth-bullets">
            <div className="bullet">
              <i className="fa-solid fa-check"></i>
              <span>Bảo mật 2 lớp an toàn</span>
            </div>
            <div className="bullet">
              <i className="fa-solid fa-check"></i>
              <span>Xác thực danh tính chính xác</span>
            </div>
            <div className="bullet">
              <i className="fa-solid fa-check"></i>
              <span>Bảo vệ dữ liệu cá nhân</span>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <h3 className="fw-bold mb-2" style={{ color: '#0f172a', fontSize: '26px' }}>
            Xác minh OTP
          </h3>
          <p className="mb-4" style={{ color: '#64748b', fontSize: '15px' }}>
            OTP đã gửi tới: <b>{flow.masked || flow.contact || 'thông tin của bạn'}</b>
          </p>

          <FormError message={error.message} />

          <form onSubmit={submit} noValidate>
            <div className="auth-field">
              <label className="auth-label text-center d-block mb-3">Mã OTP (6 số)</label>
              <div className="d-flex justify-content-between gap-2 mb-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      otpRefs.current[index] = element
                    }}
                    className={`form-control text-center fw-bold ${
                      error.errors?.otp ? 'border-danger text-danger' : ''
                    }`}
                    style={{
                      width: '48px',
                      height: '54px',
                      fontSize: '22px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(event) => handleOtpChange(event, index)}
                    onKeyDown={(event) => handleOtpKeyDown(event, index)}
                    onFocus={(event) => event.target.select()}
                    required
                  />
                ))}
              </div>
              {error.errors?.otp && <div className="field-error text-center mt-2">{error.errors.otp[0]}</div>}
            </div>

            <button className="auth-submit-btn mt-3" type="submit" disabled={submitting}>
              {submitting ? 'ĐANG XÁC NHẬN...' : 'Xác nhận OTP'}
            </button>

            <div className="mt-4 text-center">
              {remain > 0 ? (
                <div style={{ color: '#64748b', fontSize: '15px' }}>
                  Bạn có thể gửi lại OTP sau <b>{remain}s</b>
                </div>
              ) : (
                <button
                  className="btn btn-link text-decoration-none"
                  type="button"
                  onClick={resend}
                  disabled={resending}
                  style={{ color: '#0056b3', fontSize: '15px', fontWeight: '500', padding: 0 }}
                >
                  {resending ? 'Đang gửi lại OTP...' : 'Gửi lại OTP'}
                </button>
              )}

              <div className="mt-3">
                <Link className="auth-link" to="/auth/login" style={{ fontSize: '15px', fontWeight: '500' }}>
                  Quay về đăng nhập
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
