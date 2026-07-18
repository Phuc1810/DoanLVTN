import { CheckCircle2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAccountApi } from '../../api/adminAccountApi'
import { useAuth } from '../../auth/useAuth'
import AccountRoleSelect from '../../components/admin/AccountRoleSelect'
import AccountStatusBadge, { AccountRoleBadge } from '../../components/admin/AccountStatusBadge'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import StaffCreateAccountModal from '../../components/staff/StaffCreateAccountModal'
import StaffResetPasswordModal from '../../components/staff/StaffResetPasswordModal'
import StaffAccountStats from '../../components/staff/StaffAccountStats'
import { extractList, extractPagination, normalizeError, profileText } from './staffPageUtils'

const SolidKey = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor">
    <path d="M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17v80c0 13.3 10.7 24 24 24h80c13.3 0 24-10.7 24-24V448h40c13.3 0 24-10.7 24-24V384h40c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z"/>
  </svg>
)

const SolidLock = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 448 512" fill="currentColor">
    <path d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z"/>
  </svg>
)

const SolidUnlock = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 448 512" fill="currentColor">
    <path d="M144 144c0-44.2 35.8-80 80-80c31.9 0 59.4 18.6 72.3 45.7c7.6 16 26.7 22.8 42.6 15.2s22.8-26.7 15.2-42.6C331 43.1 282.8 12.8 224 12.8C153.1 12.8 96 69.9 96 140.8V192H64c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V256c0-35.3-28.7-64-64-64H144V144z"/>
  </svg>
)

export default function StaffAccountsPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({ q: '', role: '', st: '', page: 1, per_page: 5 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })
  const [actionError, setActionError] = useState(null)
  const [success, setSuccess] = useState('')
  const [resetAccount, setResetAccount] = useState(null)
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [stats, setStats] = useState({ data: null, loading: true })
  const [roleConfirm, setRoleConfirm] = useState({ isOpen: false, account: null, targetRole: '' })
  const [statusConfirm, setStatusConfirm] = useState({ isOpen: false, account: null })
  const [toast, setToast] = useState({ show: false, message: '' })

  const loadAccounts = useCallback((params = filters) => {
    return adminAccountApi.getAccounts(params)
      .then((payload) => setState({ loading: false, error: '', rows: extractList(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }, [filters])

  const loadStats = useCallback(() => {
    return adminAccountApi.getStats()
      .then((payload) => setStats({ loading: false, data: payload }))
      .catch(() => setStats({ loading: false, data: null }))
  }, [])

  useEffect(() => {
    loadAccounts()
    loadStats()
  }, [loadAccounts, loadStats])

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value, page: 1 }))
  }

  function promptChangeRole(account, role) {
    if (account.MaTK === user?.MaTK) return
    setRoleConfirm({ isOpen: true, account, targetRole: role })
  }

  async function confirmChangeRole() {
    const { account, targetRole } = roleConfirm
    if (!account) return
    
    setRoleConfirm({ isOpen: false, account: null, targetRole: '' })
    setActionError(null)
    setSuccess('')
    try {
      await adminAccountApi.updateRole(account.MaTK, targetRole)
      setToast({ show: true, message: `Đã cập nhật vai trò tài khoản #${account.MaTK}.` })
      setTimeout(() => setToast({ show: false, message: '' }), 5000)
      await Promise.all([loadAccounts(), loadStats()])
    } catch (error) {
      setActionError(normalizeError(error))
    }
  }

  function promptToggleStatus(account) {
    if (account.MaTK === user?.MaTK) return
    setStatusConfirm({ isOpen: true, account })
  }

  async function confirmToggleStatus() {
    const { account } = statusConfirm
    if (!account) return

    setStatusConfirm({ isOpen: false, account: null })
    setActionError(null)
    setSuccess('')
    try {
      await adminAccountApi.toggleStatus(account.MaTK)
      setToast({ show: true, message: `Đã cập nhật trạng thái tài khoản #${account.MaTK}.` })
      setTimeout(() => setToast({ show: false, message: '' }), 5000)
      await Promise.all([loadAccounts(), loadStats()])
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý tài khoản</h1>
          <p className="text-muted">Danh sách và phân quyền người dùng hệ thống</p>
        </div>
        <div className="dash-header-actions">
          <button className="dash-btn-primary" onClick={() => setShowCreateModal(true)}>
            Thêm nhân viên mới
          </button>
        </div>
      </div>
      <FormError message={actionError?.message} errors={actionError?.errors} />
      {success && <div className="alert alert-success">{success}</div>}
      
      <StaffAccountStats data={stats.data} loading={stats.loading} />

      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-6"><input className="form-control" name="q" value={filters.q} onChange={updateFilter} placeholder="Tìm theo ID, username, email, SĐT..." /></div>
            <div className="col-md-3"><select className="form-select" name="role" value={filters.role} onChange={updateFilter}><option value="">Tất cả vai trò</option><option value="AD">Admin</option><option value="NV">Nhân viên</option><option value="KH">Khách hàng</option></select></div>
            <div className="col-md-3"><select className="form-select" name="st" value={filters.st} onChange={updateFilter}><option value="">Tất cả trạng thái</option><option value="Hoạt động">Hoạt động</option><option value="Khóa">Đang khóa</option></select></div>
          </div>
        </div>
      </div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table mb-0 table-hover align-middle">
              <thead><tr><th>ID</th><th>Tên đăng nhập</th><th>Hồ sơ</th><th>Vai trò</th><th>Trạng thái</th><th className="text-end">Hành động</th></tr></thead>
              <tbody>
                {state.rows.length === 0 && <tr><td colSpan="6"><EmptyState message="Không tìm thấy dữ liệu" /></td></tr>}
                {state.rows.map((account) => {
                  const isMe = account.MaTK === user?.MaTK
                  const profile = profileText(account)
                  return (
                    <tr key={account.MaTK}>
                      <td className="fw-bold text-secondary">#{account.MaTK}</td>
                      <td><span className="fw-bold text-dark">{account.TenDangNhap}</span>{isMe && <span className="badge bg-light text-secondary border ms-2">Của bạn</span>}</td>
                      <td><div className="fw-bold text-primary" style={{ fontSize: '1rem' }}>{profile.name}</div><div className="small text-muted">{profile.email || profile.phone}</div></td>
                      <td><AccountRoleBadge role={account.VaiTro} /></td>
                      <td><AccountStatusBadge status={account.TrangThai} /></td>
                      <td className="text-end">
                        {isMe ? <span className="badge bg-light text-secondary border">Không thao tác</span> : (
                          <div className="d-flex justify-content-end align-items-center">
                            <div style={{ width: 84 }}><AccountRoleSelect value={account.VaiTro} disabled={isMe} onChange={(role) => promptChangeRole(account, role)} /></div>
                            <div className="account-action-divider"></div>
                            <div className="d-flex gap-2">
                              {account.VaiTro !== 'KH' && (
                                <button 
                                  className="account-action-btn account-action-key" 
                                  type="button" 
                                  data-tooltip="Cấp lại mật khẩu" 
                                  onClick={() => setResetAccount(account)}
                                >
                                  <SolidKey size={16} />
                                </button>
                              )}
                              <button 
                                className={`account-action-btn ${account.TrangThai === 'Khóa' ? 'account-action-unlock' : 'account-action-lock'}`} 
                                type="button" 
                                data-tooltip={account.TrangThai === 'Khóa' ? 'Mở khóa' : 'Khóa'} 
                                onClick={() => promptToggleStatus(account)}
                              >
                                {account.TrangThai === 'Khóa' ? <SolidUnlock size={16} /> : <SolidLock size={16} />}
                              </button>
                            </div>
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
      <StaffResetPasswordModal account={resetAccount} error={actionError} submitting={resetSubmitting} onClose={() => setResetAccount(null)} onSubmit={resetPassword} />
      {showCreateModal && (
        <StaffCreateAccountModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false)
            setSuccess('')
            setToast({ show: true, message: 'Tạo tài khoản nhân viên thành công.' })
            setTimeout(() => setToast({ show: false, message: '' }), 5000)
            loadAccounts()
            loadStats()
          }} 
        />
      )}

      {/* Role Change Confirmation Modal */}
      {roleConfirm.isOpen && (
        <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>
      )}
      {roleConfirm.isOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div className="modal-body text-center p-4">
                <div className="mb-3">
                  <i className="fa-solid fa-circle-question text-primary" style={{ fontSize: '50px', opacity: 0.8 }}></i>
                </div>
                <h5 className="mb-4 text-dark fw-bold" style={{ lineHeight: '1.5' }}>
                  Bạn muốn đổi vai trò thành {roleConfirm.targetRole === 'AD' ? 'Admin' : roleConfirm.targetRole === 'NV' ? 'Nhân viên' : 'Khách hàng'} không?
                </h5>
                <div className="d-flex justify-content-center gap-3">
                  <button type="button" className="btn btn-outline-secondary px-4 rounded-pill" onClick={() => setRoleConfirm({ isOpen: false, account: null, targetRole: '' })}>Hủy</button>
                  <button type="button" className="btn btn-primary px-4 rounded-pill" onClick={confirmChangeRole}>Đồng ý</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {statusConfirm.isOpen && (
        <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>
      )}
      {statusConfirm.isOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div className="modal-body text-center p-4">
                <div className="mb-3">
                  <i className="fa-solid fa-circle-question text-primary" style={{ fontSize: '50px', opacity: 0.8 }}></i>
                </div>
                <h5 className="mb-4 text-dark fw-bold" style={{ lineHeight: '1.5' }}>
                  Bạn có muốn {statusConfirm.account?.TrangThai === 'Khóa' ? 'mở khóa' : 'khóa'} tài khoản này không?
                </h5>
                <div className="d-flex justify-content-center gap-3">
                  <button type="button" className="btn btn-outline-secondary px-4 rounded-pill" onClick={() => setStatusConfirm({ isOpen: false, account: null })}>Hủy</button>
                  <button type="button" className="btn btn-primary px-4 rounded-pill" onClick={confirmToggleStatus}>Đồng ý</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-4" style={{ zIndex: 1100, marginTop: '60px' }}>
          <div className="toast show align-items-center text-white bg-success border-0 shadow-lg" role="alert" style={{ borderRadius: '8px', minWidth: '300px' }}>
            <div className="d-flex">
              <div className="toast-body fw-medium px-4 py-3 d-flex align-items-center gap-2 fs-6">
                <CheckCircle2 size={20} /> {toast.message}
              </div>
              <button type="button" className="btn-close btn-close-white me-3 m-auto" onClick={() => setToast({ show: false, message: '' })}></button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
