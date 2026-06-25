import { Link, useSearchParams } from 'react-router-dom'
import AuthShell from '../../components/layout/AuthShell'

export default function ResetSuccessPage() {
  const [searchParams] = useSearchParams()
  const prefill = searchParams.get('prefill') || ''

  return (
    <AuthShell narrow>
      <div className="card auth-card p-4 text-center">
        <div className="auth-success-icon mb-3" style={{ fontSize: 48, color: '#198754' }}>
          <i className="fa-solid fa-circle-check"></i>
        </div>
        <h4 className="fw-bold mb-2">Đổi mật khẩu thành công!</h4>
        <p className="text-muted mb-4">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
        <Link className="btn btn-primary btn-pill w-100" to={`/auth/login?prefill=${encodeURIComponent(prefill)}`}>
          Về trang đăng nhập
        </Link>
      </div>
    </AuthShell>
  )
}
