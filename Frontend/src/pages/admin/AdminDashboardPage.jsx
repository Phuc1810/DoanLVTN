import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAccountApi } from '../../api/adminAccountApi'
import AccountStatusBadge, { AccountRoleBadge } from '../../components/admin/AccountStatusBadge'
import AdminStatCard from '../../components/admin/AdminStatCard'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import { ADMIN_API_TODO, extractAccounts, normalizeError } from './adminPageUtils'

export default function AdminDashboardPage() {
  const [state, setState] = useState({ loading: true, error: '', accounts: [] })

  useEffect(() => {
    adminAccountApi.getAccounts({ per_page: 10 })
      .then((payload) => setState({ loading: false, error: '', accounts: extractAccounts(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message || ADMIN_API_TODO, accounts: [] }))
  }, [])

  const stats = useMemo(() => {
    const accounts = state.accounts
    return {
      total: accounts.length,
      active: accounts.filter((item) => item.TrangThai === 'Hoạt động' || item.TrangThai === 'Hoáº¡t Ä‘á»™ng').length,
      locked: accounts.filter((item) => item.TrangThai === 'Khóa' || item.TrangThai === 'KhÃ³a').length,
      kh: accounts.filter((item) => item.VaiTro === 'KH').length,
      nv: accounts.filter((item) => item.VaiTro === 'NV').length,
      ad: accounts.filter((item) => item.VaiTro === 'AD').length,
    }
  }, [state.accounts])

  if (state.loading) return <Loading />

  return (
    <>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h3 className="admin-page-title">Tổng quan hệ thống</h3>
          <p className="admin-subtitle">Thống kê dữ liệu tài khoản và phân quyền</p>
        </div>
      </div>
      {state.error && <ErrorState message={state.error} />}
      <div className="row g-4 mb-4">
        <div className="col-md-3"><AdminStatCard label="Tổng tài khoản" value={stats.total} icon="TK" tone="primary" /></div>
        <div className="col-md-3"><AdminStatCard label="Đang hoạt động" value={stats.active} icon="OK" tone="success" /></div>
        <div className="col-md-3"><AdminStatCard label="Đang khóa" value={stats.locked} icon="LK" tone="danger" /></div>
        <div className="col-md-3"><AdminStatCard label="Khách hàng" value={stats.kh} icon="KH" tone="warning" /></div>
      </div>
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="admin-card h-100">
            <div className="admin-card-header"><h6 className="admin-card-title">Thống kê vai trò</h6></div>
            <div className="p-4">
              {[['Admin', stats.ad, '#dc3545'], ['Nhân viên', stats.nv, '#0d6efd'], ['Khách hàng', stats.kh, '#198754']].map(([label, value, color]) => (
                <div className="mb-3" key={label}>
                  <div className="d-flex justify-content-between fw-bold small mb-1"><span>{label}</span><span>{value}</span></div>
                  <div className="progress" style={{ height: 12 }}><div className="progress-bar" style={{ width: `${stats.total ? (value / stats.total) * 100 : 0}%`, backgroundColor: color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="admin-card h-100">
            <div className="admin-card-header"><h6 className="admin-card-title">Tài khoản mới nhất</h6><Link className="admin-btn light" to="/admin/accounts">Xem tất cả</Link></div>
            <div className="table-responsive">
              <table className="table admin-table mb-0">
                <thead><tr><th>ID</th><th>Username</th><th>Vai trò</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {state.accounts.slice(0, 5).map((item) => (
                    <tr key={item.MaTK}><td className="fw-bold text-secondary">#{item.MaTK}</td><td className="fw-bold text-dark small">{item.TenDangNhap}</td><td><AccountRoleBadge role={item.VaiTro} /></td><td><AccountStatusBadge status={item.TrangThai} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
