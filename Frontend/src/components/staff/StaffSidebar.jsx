import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

const MENU = [
  { to: '/staff', icon: '▦', label: 'Dashboard', end: true },
  { to: '/staff/orders', icon: '▣', label: 'Đơn đặt tour' },
  { to: '/staff/business-requests', icon: '☏', label: 'Yêu cầu doanh nghiệp' },
  { to: '/staff/tours', icon: '⌖', label: 'Quản lý Tour' },
  { to: '/staff/news', icon: '☰', label: 'Quản lý tin tức' },
  { to: '/staff/promotions', icon: '%', label: 'Quản lý khuyến mãi' },
  { to: '/staff/change-password', icon: '⚿', label: 'Đổi mật khẩu' },
]

export default function StaffSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const name = user?.HoTen || user?.TenDangNhap || 'Nhân viên'

  async function handleLogout() {
    await logout()
    navigate('/staff/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <NavLink className="brand-logo" to="/staff">
          <span>✈</span>
          <span>Tour Staff</span>
        </NavLink>
      </div>
      <nav className="nav-section">
        <div className="nav-label">Quản trị nhân viên</div>
        {MENU.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
            <i>{item.icon}</i>
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button type="button" className="nav-link w-100 text-start border-0 bg-transparent" onClick={handleLogout}>
          <i>↪</i>
          <span>Đăng xuất</span>
        </button>
      </nav>
      <div className="user-section">
        <div className="user-card">
          <div className="user-avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{name}</span>
            <span className="user-role">{user?.VaiTro || 'NV'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
