import { Outlet } from 'react-router-dom'
import StaffSidebar from './StaffSidebar'

export default function StaffLayout() {
  return (
    <div className="dashboard-wrapper staff-page">
      <StaffSidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
