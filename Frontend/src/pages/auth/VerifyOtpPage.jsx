import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'

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
  const [otp, setOtp] = useState(new Array(6).fill(''))
  const otpRefs = useRef([])
  const [remain, setRemain] = useState(20)
  const [message, setMessage] = useState('')
  const [error, setError] = useState({ message: '', errors: {} })
  const [submitting, setSubmitting] = useState(false)

  const handleOtpChange = (e, index) => {
    const val = e.target.value
    if (!/^[0-9]*$/.test(val)) return // Chỉ cho phép số

    const newOtp = [...otp]
    // Nếu copy-paste hoặc gõ nhiều số
    if (val.length > 1) {
      const pasted = val.slice(0, 6).split('')
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i]
      }
      setOtp(newOtp)
      const nextIndex = pasted.length < 6 ? pasted.length : 5
      otpRefs.current[nextIndex]?.focus()
      return
    }

    newOtp[index] = val
    setOtp(newOtp)

    if (val !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  useEffect(() => {
    if (remain <= 0) return undefined
    const timer = window.setInterval(() => setRemain((current) => current - 1), 1000)
    return () => window.clearInterval(timer)
  }, [remain])

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
      sessionStorage.setItem('auth_reset_verified', JSON.stringify({
        ...flow,
        reset_token: data.reset_token || data.token,
      }))
      navigate('/auth/reset-password')
    } catch (err) {
      let topMsg = err.message;
      if (topMsg === 'Dữ liệu không hợp lệ' || topMsg === 'Dữ liệu không hợp lệ.') {
        topMsg = '';
      }
      setError({ message: topMsg, errors: err.errors || {} })
      setOtp(new Array(6).fill(''))
      if (otpRefs.current[0]) {
        otpRefs.current[0].focus()
      }
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
    <div className="auth-shell">
      <div className="auth-card" style={{ marginTop: '40px' }}>
        {/* === KHUNG TRÁI: Xanh dương === */}
        <div className="auth-left">
          <div className="brand">
            <i className="fa-solid fa-plane-departure"></i> TourDuLich
          </div>
          <div className="slogan">
            Xác thực tài khoản để bảo mật thông tin và quyền lợi của bạn.
          </div>
          <div className="auth-bullets">
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Bảo mật 2 lớp an toàn</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Xác thực danh tính chính xác</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Bảo vệ dữ liệu cá nhân</span></div>
          </div>
        </div>

        {/* === KHUNG PHẢI: Form === */}
        <div className="auth-right">
          <h3 className="fw-bold mb-2" style={{ color: '#0f172a', fontSize: '26px' }}>Xác minh OTP</h3>
          <p className="mb-4" style={{ color: '#64748b', fontSize: '15px' }}>OTP đã gửi tới: <b>{flow.masked || flow.contact || 'thông tin của bạn'}</b></p>
          
          <FormError message={error.message} />
          {message && <div className="alert alert-success" style={{ borderRadius: '12px', fontSize: '15px' }}>{message}</div>}

          <form onSubmit={submit} noValidate>
            <div className="auth-field">
              <label className="auth-label text-center d-block mb-3">Mã OTP (6 số)</label>
              <div className="d-flex justify-content-between gap-2 mb-2">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    className={`form-control text-center fw-bold ${error.errors?.otp ? 'border-danger text-danger' : ''}`}
                    style={{ width: '48px', height: '54px', fontSize: '22px', borderRadius: '12px', border: '1px solid #cbd5e1' }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={data}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
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
                <div style={{ color: '#64748b', fontSize: '15px' }}>Bạn có thể gửi lại OTP sau <b>{remain}s</b></div>
              ) : (
                <button 
                  className="btn btn-link text-decoration-none" 
                  type="button" 
                  onClick={resend}
                  style={{ color: '#0056b3', fontSize: '15px', fontWeight: '500', padding: 0 }}
                >
                  Gửi lại OTP
                </button>
              )}
              <div className="mt-3">
                <Link className="auth-link" to="/auth/login" style={{ fontSize: '15px', fontWeight: '500' }}>Quay về đăng nhập</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
