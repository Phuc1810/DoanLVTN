import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { staffOrderApi } from '../../api/staffOrderApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { extractItem, normalizeError } from './staffPageUtils'
import { buildImageUrl, tourImagePath } from '../../utils/imageUrl'
import { ArrowLeft, Briefcase, UserCircle, Receipt, Landmark } from 'lucide-react'

export default function StaffOrderDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', order: null })
  const [approving, setApproving] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const prevStatusRef = useRef()

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000)
  }

  const handleApproveCancel = async () => {
    if (!window.confirm('Bạn xác nhận ĐÃ CHUYỂN TIỀN HOÀN cho khách và muốn đóng đơn này?')) return
    setApproving(true)
    try {
      const payload = await staffOrderApi.approveCancel(id)
      setState(prev => ({ ...prev, order: payload }))
      showToast('Duyệt huỷ và hoàn tiền thành công!')
    } catch (err) {
      showToast('Lỗi: ' + (err.response?.data?.message || err.message), 'danger')
    } finally {
      setApproving(false)
    }
  }

  useEffect(() => {
    const fetchOrder = () => {
      staffOrderApi.show(id)
        .then((payload) => setState(prev => ({ ...prev, loading: false, error: '', order: payload })))
        .catch((error) => setState(prev => ({ ...prev, loading: false, error: normalizeError(error).message, order: null })))
    }

    fetchOrder()

    let intervalId = null;
    if (state.order?.TrangThai === 'Yêu cầu huỷ') {
      intervalId = setInterval(fetchOrder, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [id, state.order?.TrangThai])

  useEffect(() => {
    if (prevStatusRef.current === 'Yêu cầu huỷ' && state.order?.TrangThai === 'Đã hoàn tiền') {
      showToast('Tuyệt vời! Hệ thống đã tự động nhận diện giao dịch chuyển khoản và duyệt Hoàn Tiền thành công!')
    }
    prevStatusRef.current = state.order?.TrangThai
  }, [state.order?.TrangThai])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const order = state.order || {}
  const customer = order.khach_hang || order.KhachHang || {}
  const tour = order.tour || order.Tour || {}
  const payment = order.payment || order.thanh_toan || {}
  const refund = order.refund || order.hoan_tien || {}

  let projectedRefund = refund.SoTienHoan || 0
  if (order.TrangThai === 'Yêu cầu huỷ' && !projectedRefund && tour.NgayKhoiHanh) {
    const start = new Date(tour.NgayKhoiHanh)
    start.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = start.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    let rate = 0
    if (diffDays >= 10) rate = 0.7
    else if (diffDays >= 5) rate = 0.5
    else if (diffDays >= 3) rate = 0.25
    
    projectedRefund = (order.TongTienPhaiTra || 0) * rate
  }

  let qrUrl = null
  if (order.TrangThai === 'Yêu cầu huỷ' && refund.NganHang && refund.SoTaiKhoan) {
    const bankName = refund.NganHang.toLowerCase()
    let binOrName = refund.NganHang
    if (bankName.includes('tpbank')) binOrName = 'tpbank'
    else if (bankName.includes('vietcombank') || bankName === 'vcb') binOrName = 'vcb'
    else if (bankName.includes('mbbank') || bankName === 'mb') binOrName = 'mbbank'
    else if (bankName.includes('techcombank') || bankName === 'tcb') binOrName = 'tcb'
    else if (bankName.includes('vietinbank')) binOrName = 'vietinbank'
    else if (bankName.includes('bidv')) binOrName = 'bidv'
    else if (bankName.includes('agribank')) binOrName = 'agribank'
    else if (bankName.includes('sacombank')) binOrName = 'sacombank'
    else if (bankName.includes('acb')) binOrName = 'acb'
    else if (bankName.includes('vpbank')) binOrName = 'vpbank'
    else if (bankName.includes('vib')) binOrName = 'vib'
    
    qrUrl = `https://img.vietqr.io/image/${binOrName}-${refund.SoTaiKhoan}-compact2.png?amount=${projectedRefund}&addInfo=Hoan tien don ${order.MaDon}&accountName=${refund.TenTaiKhoan || ''}`
  }

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

          {(order.TrangThai === 'Yêu cầu huỷ' && !approving) && (
            <div className="staff-detail-card mt-4" style={{ border: '1px solid #ffc107', backgroundColor: '#fffdf6' }}>
              <div className="section-title mb-3" style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#b98d00' }}>
                <Landmark size={20} /> Yêu cầu Hoàn tiền
              </div>
              <p className="text-muted" style={{ fontSize: '14px', marginBottom: '16px' }}>
                Khách hàng đã yêu cầu huỷ tour. Số tiền cần hoàn là:
              </p>
              
              <div className="p-3 mb-4" style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ffecb3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #e5e7eb', marginBottom: '8px' }}>
                  <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Ngân hàng:</span>
                  <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{refund.NganHang || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #e5e7eb', marginBottom: '8px' }}>
                  <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Chủ tài khoản:</span>
                  <span className="fw-semibold text-end" style={{ fontSize: '14px' }}>{refund.TenTaiKhoan || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #e5e7eb', marginBottom: '12px' }}>
                  <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Số tài khoản:</span>
                  <span className="fw-bold text-primary text-end" style={{ fontSize: '15px' }}>{refund.SoTaiKhoan || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="fw-bold text-dark">SỐ TIỀN HOÀN:</span>
                  <span className="fw-bold text-end" style={{ fontSize: '16px', color: '#198754' }}>{formatCurrency(projectedRefund)}</span>
                </div>
              </div>

              {qrUrl && (
                <div className="text-center mb-4">
                  <div className="text-muted mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>Quét mã QR để chuyển khoản nhanh</div>
                  <img src={qrUrl} alt="VietQR" style={{ width: '100%', maxWidth: '220px', borderRadius: '8px', border: '1px solid #ddd', padding: '4px', backgroundColor: '#fff' }} />
                </div>
              )}

              <button 
                className="btn btn-warning w-100 fw-bold" 
                style={{ padding: '12px', fontSize: '14px' }}
                onClick={handleApproveCancel}
                disabled={approving}
              >
                Duyệt hoàn tiền (Thủ công)
              </button>
            </div>
          )}
        </div>
      </div>

      {toast.show && (
        <div className={`toast align-items-center text-white bg-${toast.type} border-0 show fade`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div className="d-flex">
            <div className="toast-body fw-semibold" style={{ fontSize: '14px', padding: '12px 16px' }}>
              <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'} me-2`}></i>
              {toast.message}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      )}
    </>
  )
}
