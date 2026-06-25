import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { adminAccountApi } from '../../api/adminAccountApi'
import AccountStatusBadge, { AccountRoleBadge } from '../../components/admin/AccountStatusBadge'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import { extractAccounts, normalizeError, profileText } from './adminPageUtils'

export default function AdminAccountDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', account: null })

  useEffect(() => {
    adminAccountApi.getAccounts({ q: id })
      .then((payload) => {
        const account = extractAccounts(payload).find((item) => String(item.MaTK) === String(id)) || null
        setState({ loading: false, error: account ? '' : 'Chưa có API detail account hoặc không tìm thấy tài khoản trong list.', account })
      })
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, account: null }))
  }, [id])

  if (state.loading) return <Loading />
  if (state.error && !state.account) return <ErrorState message={state.error} />

  const account = state.account || {}
  const profile = profileText(account)

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="admin-page-title">Chi tiết tài khoản #{account.MaTK}</h3>
          <p className="admin-subtitle">Trang đọc-only, fallback từ API list nếu backend chưa có detail endpoint.</p>
        </div>
        <Link className="admin-btn light" to="/admin/accounts">Quay lại</Link>
      </div>
      <div className="admin-card p-4">
        <div className="row g-4">
          <div className="col-md-6"><div className="text-muted small fw-bold">Tên đăng nhập</div><div className="fs-5 fw-bold">{account.TenDangNhap}</div></div>
          <div className="col-md-3"><div className="text-muted small fw-bold">Vai trò</div><AccountRoleBadge role={account.VaiTro} /></div>
          <div className="col-md-3"><div className="text-muted small fw-bold">Trạng thái</div><AccountStatusBadge status={account.TrangThai} /></div>
          <div className="col-md-6"><div className="text-muted small fw-bold">Họ tên</div><div>{profile.name}</div></div>
          <div className="col-md-6"><div className="text-muted small fw-bold">Email</div><div>{profile.email || 'Chưa cập nhật'}</div></div>
          <div className="col-md-6"><div className="text-muted small fw-bold">Số điện thoại</div><div>{profile.phone || 'Chưa cập nhật'}</div></div>
        </div>
      </div>
    </>
  )
}
