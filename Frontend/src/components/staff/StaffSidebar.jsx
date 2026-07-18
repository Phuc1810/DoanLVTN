import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardCheck,
  Compass,
  Newspaper,
  Tag,
  KeyRound,
  LogOut,
  Users,
} from 'lucide-react'

const MAIN_MENU = [
  { to: '/staff', icon: <LayoutDashboard size={18} />, label: 'Tổng quan', end: true },
  { to: '/staff/orders', icon: <ShoppingCart size={18} />, label: 'Đơn đặt tour' },
  { to: '/staff/business-requests', icon: <ClipboardCheck size={18} />, label: 'Xử lý yêu cầu' },
  { to: '/staff/tours', icon: <Compass size={18} />, label: 'Quản lý tour' },
  { to: '/staff/news', icon: <Newspaper size={18} />, label: 'Quản lý tin tức' },
  { to: '/staff/promotions', icon: <Tag size={18} />, label: 'Quản lý khuyến mãi' },
]

const SETTINGS_MENU = [
  { to: '/staff/change-password', icon: <KeyRound size={18} />, label: 'Đổi mật khẩu' },
]

export default function StaffSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/staff/login', { replace: true })
  }

  return (
    <aside className="sidebar new-sidebar">
      <div className="brand-section">
        <NavLink className="brand-logo" to="/staff">
          <div className="brand-text">
            <span className="brand-title">Hệ thống Tour</span>
            <span className="brand-subtitle">Quản lý vận hành</span>
          </div>
        </NavLink>
      </div>
      
      <nav className="nav-section">
        <div className="nav-menu-group">
          {MAIN_MENU.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label-text">{item.label}</span>
            </NavLink>
          ))}
          {user?.VaiTro === 'AD' && (
            <NavLink to="/staff/accounts" className="nav-link">
              <span className="nav-icon"><Users size={18} /></span>
              <span className="nav-label-text">Quản lý Tài khoản</span>
            </NavLink>
          )}
        </div>

        <div className="nav-divider" />
        <div className="nav-label-group">CÀI ĐẶT</div>

        <div className="nav-menu-group">
          {SETTINGS_MENU.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav-link">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label-text">{item.label}</span>
            </NavLink>
          ))}
          <button type="button" className="nav-link w-100 text-start border-0 bg-transparent" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={18} /></span>
            <span className="nav-label-text">Đăng xuất</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}

