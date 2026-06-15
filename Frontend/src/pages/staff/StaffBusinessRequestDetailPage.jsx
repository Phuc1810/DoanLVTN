import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { staffBusinessRequestApi } from '../../api/staffBusinessRequestApi'
import FormError from '../../components/common/FormError'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { formatDate } from '../../utils/formatDate'
import { extractItem, normalizeError } from './staffPageUtils'

const STATUSES = ['Chờ liên hệ', 'Đã liên hệ', 'Đã ký hợp đồng', 'Đã thanh toán', 'Hủy']

export default function StaffBusinessRequestDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', request: null })
  const [status, setStatus] = useState('')
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    staffBusinessRequestApi.show(id)
      .then((payload) => {
        const request = extractItem(payload)
        setState({ loading: false, error: '', request })
        setStatus(request?.TrangThai || '')
      })
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, request: null }))
  }, [id])

  async function updateStatus() {
    setFormError(null)
    try {
      const payload = await staffBusinessRequestApi.update(id, { TrangThai: status })
      setState((current) => ({ ...current, request: extractItem(payload) || { ...current.request, TrangThai: status } }))
    } catch (error) {
      setFormError(normalizeError(error))
    }
  }

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const request = state.request || {}
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Chi tiết yêu cầu #{request.MaYC || request.MaYCDN || id}</h1>
        <Link className="staff-link-btn secondary" to="/staff/business-requests">Quay lại</Link>
      </div>
      <div className="staff-detail-card">
        <FormError message={formError?.message} errors={formError?.errors} />
        <div className="staff-detail-grid mb-4">
          <div className="staff-detail-item"><span>Công ty</span><strong>{request.cong_ty?.TenCongTy || request.TenCongTy || request.TenDoanhNghiep}</strong></div>
          <div className="staff-detail-item"><span>Người liên hệ</span><div>{request.NguoiLienHe || request.HoTen}</div></div>
          <div className="staff-detail-item"><span>SĐT</span><div>{request.SoDienThoai || request.SDT}</div></div>
          <div className="staff-detail-item"><span>Email</span><div>{request.Email}</div></div>
          <div className="staff-detail-item"><span>Số người</span><div>{request.SoNguoi || request.SoLuongNguoi}</div></div>
          <div className="staff-detail-item"><span>Thời gian khởi hành</span><div>{formatDate(request.ThoiGianKhoiHanh || request.NgayKhoiHanh)}</div></div>
          <div className="staff-detail-item"><span>Trạng thái</span><StaffStatusBadge status={request.TrangThai} /></div>
          <div className="staff-detail-item"><span>Ghi chú</span><div>{request.GhiChu || request.NoiDung || 'Không có'}</div></div>
        </div>
        <div className="search-form">
          <div className="search-group"><select className="search-select" value={status} onChange={(event) => setStatus(event.target.value)}>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select></div>
          <button type="button" className="staff-action-btn primary" onClick={updateStatus}>Cập nhật trạng thái</button>
        </div>
      </div>
    </>
  )
}
