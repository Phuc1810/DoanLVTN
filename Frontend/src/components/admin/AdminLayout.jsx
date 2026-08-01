import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import NotificationDropdown from '../layout/NotificationDropdown'

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <NotificationDropdown />
        </div>
        <Outlet />
      </main>
    </div>
  )
}
