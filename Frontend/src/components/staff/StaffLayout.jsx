import { Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import StaffSidebar from './StaffSidebar'
import StaffGlobalSearch from './StaffGlobalSearch'
import { Search, HelpCircle } from 'lucide-react'
import NotificationDropdown from '../layout/NotificationDropdown'

export default function StaffLayout() {
  const { user } = useAuth()
  const name = user?.HoTen || user?.TenDangNhap || 'Admin Nhân Viên'
  const role = user?.VaiTro === 'AD' ? 'Quản trị viên' : 'Nhân viên'

  return (
    <div className="dashboard-wrapper staff-page">
      <StaffSidebar />
      <header className="top-header">
        <StaffGlobalSearch />
        <div className="top-actions">
          <NotificationDropdown />
          <button className="action-btn">
            <HelpCircle size={20} />
          </button>
          <div className="user-profile-header">
            <div className="user-info-text">
              <span className="user-name">{name}</span>
              <span className="user-role">{role}</span>
            </div>
            <img 
              src="https://ui-avatars.com/api/?name=Admin+Nhan+Vien&background=0D8ABC&color=fff&rounded=true&size=100" 
              alt="Avatar" 
              className="user-avatar-img" 
            />
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
