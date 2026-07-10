import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { staffOrderApi } from '../../api/staffOrderApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { extractItem, normalizeError } from './staffPageUtils'
import { buildImageUrl, tourImagePath } from '../../utils/imageUrl'
import { ArrowLeft, Briefcase, UserCircle, Receipt } from 'lucide-react'

export default function StaffOrderDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', order: null })

  useEffect(() => {
    staffOrderApi.show(id)
      .then((payload) => setState({ loading: false, error: '', order: payload }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, order: null }))
  }, [id])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const order = state.order || {}
  const customer = order.khach_hang || order.KhachHang || {}
  const tour = order.tour || order.Tour || {}
  const payment = order.payment || order.thanh_toan || {}

  return (
    <>
      <Link to="/staff/orders" className="staff-link-btn text-muted mb-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontWeight: 600 }}>
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      <header className="page-header mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="page-title">Chi tiết đơn hàng #{order.MaDon}</h1>
          <div className="current-date text-muted mt-1">Ngày đặt: {formatDate(order.NgayDat) || '—'}</div>
        </div>
        <div>
          <StaffStatusBadge status={order.TrangThai} />
        </div>
      </header>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="staff-detail-card" style={{ marginBottom: '24px' }}>
            <div className="section-title mb-3" style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} className="text-primary" /> Thông tin Tour
            </div>

            {tourImagePath(tour) && (
              <img src={buildImageUrl(tourImagePath(tour))} alt="Ảnh tour" style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px', border: '1px solid #eee' }} />
            )}

            <h5 className="fw-bold mb-3">{tour.TenTour || order.TenTour || '—'}</h5>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
              <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Địa điểm:</span>
              <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{tour.DiaDiem || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
              <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Thời lượng:</span>
              <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{tour.ThoiLuong || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Ngày khởi hành:</span>
              <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{formatDate(tour.NgayKhoiHanh) || '—'}</span>
            </div>
          </div>

          <div className="staff-detail-card">
            <div className="section-title mb-3" style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCircle size={20} className="text-primary" /> Thông tin Khách hàng
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
              <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Họ tên:</span>
              <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{customer.HoTen || order.HoTen || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
              <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Email:</span>
              <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{customer.Email || order.Email || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
              <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Số điện thoại:</span>
              <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{customer.SoDienThoai || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Địa chỉ:</span>
              <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{customer.DiaChi || '—'}</span>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="staff-detail-card">
            <div className="section-title mb-3" style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={20} className="text-primary" /> Chi tiết thanh toán
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
              <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Trạng thái:</span>
              <span className="text-end"><StaffStatusBadge status={payment.TrangThaiTT || order.TrangThaiTT} /></span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
              <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Người lớn (x{order.SoLuongNguoiLon || 0}):</span>
              <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{formatCurrency((order.GiaNguoiLonApDung || 0) * (order.SoLuongNguoiLon || 0))}</span>
            </div>

            {order.SoLuongTreEm > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
                <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Trẻ em (x{order.SoLuongTreEm}):</span>
                <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{formatCurrency((order.GiaTreEmApDung || 0) * order.SoLuongTreEm)}</span>
              </div>
            )}
            
            {order.SoLuongTreNho > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
                <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Em bé (x{order.SoLuongTreNho}):</span>
                <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>Miễn phí</span>
              </div>
            )}

            <div className="mt-3 pt-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #e5e7eb' }}>
              <span className="fw-bold text-dark">TỔNG TIỀN:</span>
              <span className="fw-bold fs-5 text-primary">{formatCurrency(order.TongTienPhaiTra || order.TongTienGoc || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
