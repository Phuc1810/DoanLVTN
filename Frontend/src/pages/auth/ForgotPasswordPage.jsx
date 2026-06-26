import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [contact, setContact] = useState('')
  const [error, setError] = useState({ message: '', errors: {} })
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    
    if (!contact.trim()) {
      setError({ message: '', errors: { contact: ['Vui lòng nhập Email hoặc SĐT.'] } })
      return
    }

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
    <div className="auth-shell">
      <div className="auth-card" style={{ marginTop: '40px' }}>
        {/* === KHUNG TRÁI: Xanh dương === */}
        <div className="auth-left">
          <div className="brand">
            <i className="fa-solid fa-plane-departure"></i> TourDuLich
          </div>
          <div className="slogan">
            Khôi phục mật khẩu để không bỏ lỡ các chuyến đi tuyệt vời cùng chúng tôi.
          </div>
          <div className="auth-bullets">
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Lấy lại quyền truy cập</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Tiếp tục đặt tour nhanh chóng</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Bảo mật tài khoản an toàn</span></div>
          </div>
        </div>

        {/* === KHUNG PHẢI: Form === */}
        <div className="auth-right">
          <h3 className="fw-bold mb-2" style={{ color: '#0f172a', fontSize: '26px' }}>Quên mật khẩu</h3>
          <p className="mb-4" style={{ color: '#64748b', fontSize: '15px' }}>Nhập Email (@gmail.com) hoặc SĐT (10 số) để nhận mã OTP.</p>
          
          <FormError message={error.message} />

          <form onSubmit={submit} noValidate>
            <div className="auth-field">
              <label className="auth-label">Email hoặc SĐT</label>
              <div className="auth-input-wrapper">
                <input 
                  className={`auth-input ${error.errors?.contact ? 'is-invalid' : ''}`} 
                  name="contact" 
                  value={contact} 
                  onChange={(event) => setContact(event.target.value)} 
                  placeholder="vd: ten@gmail.com hoặc 0123456789" 
                  required
                />
                {error.errors?.contact && <i className="fa-solid fa-circle-exclamation auth-error-icon"></i>}
              </div>
              {error.errors?.contact && <div className="field-error">{error.errors.contact[0]}</div>}
            </div>

            <button className="auth-submit-btn mt-2" type="submit" disabled={submitting}>
              {submitting ? 'ĐANG GỬI...' : 'Gửi OTP'}
            </button>

            <div className="text-center mt-4">
              <Link className="auth-link" to="/auth/login" style={{ fontSize: '15px', fontWeight: '500' }}>Quay về đăng nhập</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
