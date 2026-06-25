import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAccountApi } from '../../api/adminAccountApi'
import { useAuth } from '../../auth/useAuth'
import AccountRoleSelect from '../../components/admin/AccountRoleSelect'
import AccountStatusBadge, { AccountRoleBadge } from '../../components/admin/AccountStatusBadge'
import ResetPasswordModal from '../../components/admin/ResetPasswordModal'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import { extractAccounts, extractPagination, normalizeError, profileText } from './adminPageUtils'

export default function AdminAccountsPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({ q: '', role: '', st: '', page: 1 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })
  const [actionError, setActionError] = useState(null)
  const [success, setSuccess] = useState('')
  const [resetAccount, setResetAccount] = useState(null)
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const loadAccounts = useCallback((params = filters) => {
    return adminAccountApi.getAccounts(params)
      .then((payload) => setState({ loading: false, error: '', rows: extractAccounts(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }, [filters])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value, page: 1 }))
  }

  async function changeRole(account, role) {
    if (account.MaTK === user?.MaTK) return
    if (!window.confirm('Đổi quyền tài khoản này?')) return
    setActionError(null)
    setSuccess('')
    try {
      await adminAccountApi.updateRole(account.MaTK, role)
      setSuccess(`Đã cập nhật vai trò tài khoản #${account.MaTK}.`)
      await loadAccounts()
    } catch (error) {
      setActionError(normalizeError(error))
    }
  }

  async function toggleStatus(account) {
    if (account.MaTK === user?.MaTK) return
    if (!window.confirm('Bạn có chắc muốn khóa/mở tài khoản này?')) return
    setActionError(null)
    setSuccess('')
    try {
      await adminAccountApi.toggleStatus(account.MaTK)
      setSuccess(`Đã thay đổi trạng thái tài khoản #${account.MaTK}.`)
      await loadAccounts()
    } catch (error) {
      setActionError(normalizeError(error))
    }
  }

  async function resetPassword(payload) {
    if (!resetAccount) return
    setResetSubmitting(true)
    setActionError(null)
    setSuccess('')
    try {
      await adminAccountApi.resetPassword(resetAccount.MaTK, payload)
      setSuccess(`Đã cấp lại mật khẩu cho tài khoản #${resetAccount.MaTK}.`)
      setResetAccount(null)
    } catch (error) {
      setActionError(normalizeError(error))
    } finally {
      setResetSubmitting(false)
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="admin-page-title">Quản lý tài khoản</h3>
          <p className="admin-subtitle">Danh sách và phân quyền người dùng hệ thống</p>
        </div>
        <Link className="admin-btn primary" to="/admin/accounts/create-staff">+ Tạo nhân viên</Link>
      </div>
      <FormError message={actionError?.message} errors={actionError?.errors} />
      {success && <div className="alert alert-success">{success}</div>}
      <div className="admin-filter-card mb-4">
        <div className="row g-2">
          <div className="col-md-5"><input className="admin-input" name="q" value={filters.q} onChange={updateFilter} placeholder="Tìm theo ID, username, email, SĐT..." /></div>
          <div className="col-md-3"><select className="admin-select" name="role" value={filters.role} onChange={updateFilter}><option value="">Tất cả vai trò</option><option value="AD">Admin</option><option value="NV">Nhân viên</option><option value="KH">Khách hàng</option></select></div>
          <div className="col-md-3"><select className="admin-select" name="st" value={filters.st} onChange={updateFilter}><option value="">Tất cả trạng thái</option><option value="Hoạt động">Hoạt động</option><option value="Khóa">Đang khóa</option></select></div>
          <div className="col-md-1"><button className="admin-btn primary w-100" type="button" onClick={() => loadAccounts()}>Lọc</button></div>
        </div>
      </div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="table admin-table mb-0 table-hover">
              <thead><tr><th>ID</th><th>Tên đăng nhập</th><th>Hồ sơ</th><th>Vai trò</th><th>Trạng thái</th><th className="text-end">Hành động</th></tr></thead>
              <tbody>
                {state.rows.length === 0 && <tr><td colSpan="6"><EmptyState message="Không tìm thấy dữ liệu" /></td></tr>}
                {state.rows.map((account) => {
                  const isMe = account.MaTK === user?.MaTK
                  const profile = profileText(account)
                  return (
                    <tr key={account.MaTK}>
                      <td className="fw-bold text-secondary">#{account.MaTK}</td>
                      <td><Link className="fw-bold text-dark" to={`/admin/accounts/${account.MaTK}`}>{account.TenDangNhap}</Link>{isMe && <span className="badge bg-light text-secondary border ms-2">Của bạn</span>}</td>
                      <td><div className="small fw-bold">{profile.name}</div><div className="small text-muted">{profile.email || profile.phone}</div></td>
                      <td><AccountRoleBadge role={account.VaiTro} /></td>
                      <td><AccountStatusBadge status={account.TrangThai} /></td>
                      <td className="text-end">
                        {isMe ? <span className="badge bg-light text-secondary border">Không thao tác</span> : (
                          <div className="d-flex justify-content-end align-items-center gap-2">
                            <div style={{ width: 84 }}><AccountRoleSelect value={account.VaiTro} disabled={isMe} onChange={(role) => changeRole(account, role)} /></div>
                            <button className="admin-action reset" type="button" title="Cấp lại mật khẩu" onClick={() => setResetAccount(account)}>K</button>
                            <button className={`admin-action ${account.TrangThai === 'Khóa' ? 'unlock' : 'lock'}`} type="button" title="Khóa/mở" onClick={() => toggleStatus(account)}>{account.TrangThai === 'Khóa' ? 'U' : 'L'}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination pagination={state.pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
      <ResetPasswordModal account={resetAccount} error={actionError} submitting={resetSubmitting} onClose={() => setResetAccount(null)} onSubmit={resetPassword} />
    </>
  )
}
