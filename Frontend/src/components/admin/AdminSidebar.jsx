import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export default function AdminSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <aside className="admin-sidebar">
      <NavLink className="admin-brand" to="/admin">
        <span className="admin-brand-icon">▣</span>
        <span>VietJourney</span>
      </NavLink>
      <nav className="admin-nav">
        <NavLink className="admin-nav-link" end to="/admin"><span>▦</span> Dashboard</NavLink>
        <NavLink className="admin-nav-link" to="/admin/accounts"><span>⚙</span> Tài khoản</NavLink>
        <NavLink className="admin-nav-link" to="/staff"><span>⌖</span> Staff dashboard</NavLink>
        <div className="mt-4 pt-4 border-top">
          <button type="button" className="admin-nav-link danger" onClick={handleLogout}><span>↪</span> Đăng xuất</button>
        </div>
      </nav>
      <div className="mt-4 small text-muted px-2">
        <strong className="d-block text-dark">{user?.HoTen || user?.TenDangNhap || 'Admin'}</strong>
        {user?.VaiTro || 'AD'}
      </div>
    </aside>
  )
}
