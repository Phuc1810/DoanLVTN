import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { staffOrderApi } from '../../api/staffOrderApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { countPeople, extractItem, normalizeError } from './staffPageUtils'

export default function StaffOrderDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', order: null })

  useEffect(() => {
    staffOrderApi.show(id)
      .then((payload) => setState({ loading: false, error: '', order: extractItem(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, order: null }))
  }, [id])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const order = state.order || {}
  const customer = order.khach_hang || order.KhachHang || {}
  const tour = order.tour || order.Tour || {}
  const payment = order.thanh_toan || order.ThanhToan || {}

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Chi tiết đơn #{order.MaDon}</h1>
        <Link className="staff-link-btn secondary" to="/staff/orders">Quay lại</Link>
      </div>
      <div className="staff-detail-card">
        <div className="staff-detail-grid">
          <div className="staff-detail-item"><span>Khách hàng</span><strong>{customer.HoTen || order.HoTen}</strong></div>
          <div className="staff-detail-item"><span>Liên hệ</span><div>{customer.SoDienThoai || customer.Email || order.Email}</div></div>
          <div className="staff-detail-item"><span>Tour</span><strong>{tour.TenTour || order.TenTour}</strong></div>
          <div className="staff-detail-item"><span>Ngày đặt</span><div>{formatDate(order.NgayDat)}</div></div>
          <div className="staff-detail-item"><span>Số người</span><div>{countPeople(order)}</div></div>
          <div className="staff-detail-item"><span>Tổng tiền</span><div>{formatCurrency(order.TongTienPhaiTra || order.TongTienGoc)}</div></div>
          <div className="staff-detail-item"><span>Trạng thái đơn</span><StaffStatusBadge status={order.TrangThai} /></div>
          <div className="staff-detail-item"><span>Thanh toán</span><StaffStatusBadge status={payment.TrangThaiTT || order.TrangThaiTT} /></div>
          <div className="staff-detail-item"><span>Phương thức</span><div>{payment.PhuongThuc || order.PhuongThuc || 'Chưa cập nhật'}</div></div>
          <div className="staff-detail-item"><span>Số tiền đã thanh toán</span><div>{formatCurrency(payment.SoTien || 0)}</div></div>
        </div>
      </div>
    </>
  )
}
