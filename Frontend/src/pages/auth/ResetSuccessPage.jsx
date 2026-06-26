import { Link, useSearchParams } from 'react-router-dom'

export default function ResetSuccessPage() {
  const [searchParams] = useSearchParams()
  const prefill = searchParams.get('prefill') || ''

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ marginTop: '40px' }}>
        {/* === KHUNG TRÁI: Xanh dương === */}
        <div className="auth-left">
          <div className="brand">
            <i className="fa-solid fa-plane-departure"></i> TourDuLich
          </div>
          <div className="slogan">
            Tuyệt vời! Mật khẩu của bạn đã được thay đổi thành công.
          </div>
          <div className="auth-bullets">
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Tài khoản đã được bảo mật</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Tiếp tục trải nghiệm dịch vụ</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Đăng nhập ngay để đặt tour</span></div>
          </div>
        </div>

        {/* === KHUNG PHẢI: Form === */}
        <div className="auth-right d-flex flex-column justify-content-center align-items-center text-center">
          <div className="auth-success-icon mb-4" style={{ fontSize: 64, color: '#10b981' }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <h3 className="fw-bold mb-3" style={{ color: '#0f172a', fontSize: '28px' }}>Đổi mật khẩu thành công!</h3>
          <p className="mb-5" style={{ color: '#64748b', fontSize: '16px' }}>Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
          
          <Link className="auth-submit-btn text-decoration-none d-inline-flex justify-content-center align-items-center w-100" to={`/auth/login?prefill=${encodeURIComponent(prefill)}`}>
            Về trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
