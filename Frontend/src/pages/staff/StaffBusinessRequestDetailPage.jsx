import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { staffBusinessRequestApi } from '../../api/staffBusinessRequestApi'
import ErrorState from '../../components/common/ErrorState'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { normalizeError } from './staffPageUtils'
import { buildImageUrl } from '../../utils/imageUrl'
import { ArrowLeft, Briefcase, Building2, UserCircle, Settings, HandHeart, Save, Lock, Bell } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'

const STATUSES = ['Chờ xử lý', 'Đã liên hệ', 'Hủy tour', 'Hoàn thành']

// Style constants (matching StaffOrderDetailPage)
const infoRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb', gap: '12px' }
const infoRowLastStyle = { ...infoRowStyle, borderBottom: 'none' }
const labelStyle = { fontSize: '14px', fontWeight: 500 }
const valueStyle = { fontSize: '14px', fontWeight: 600, textAlign: 'right' }
const sectionTitleStyle = { fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }

export default function StaffBusinessRequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, error: '', request: null })
  const [form, setForm] = useState({ TrangThai: '', GiaTriHopDong: '', NgayThanhToan: '' })
  const [formError, setFormError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    loadData()
  }, [id])

  function loadData() {
    setState({ loading: true, error: '', request: null })
    staffBusinessRequestApi.show(id)
      .then((request) => {
        setState({ loading: false, error: '', request })
        setForm({
          TrangThai: request?.TrangThai || '',
          GiaTriHopDong: request?.GiaTriHopDong || '',
          NgayThanhToan: request?.NgayThanhToan || '',
        })
      })
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, request: null }))
  }

  // Nhận xử lý đơn
  async function handleClaim() {
    setFormError(null)
    setSuccessMsg('')
    try {
      await staffBusinessRequestApi.update(id, { action: 'claim' })
      setSuccessMsg('Bạn đã nhận xử lý đơn hàng này thành công!')
      loadData()
    } catch (error) {
      setFormError(normalizeError(error))
    }
  }

  // Cập nhật trạng thái + giá trị hợp đồng + ngày thanh toán
  async function handleUpdate(e) {
    e.preventDefault()
    setFormError(null)
    setSuccessMsg('')
    try {
      const payload = {
        action: 'update_status',
        TrangThai: form.TrangThai,
      }
      if (form.GiaTriHopDong !== '') payload.GiaTriHopDong = Number(String(form.GiaTriHopDong).replace(/[,.\s]/g, '')) || null
      if (form.NgayThanhToan !== '') payload.NgayThanhToan = form.NgayThanhToan

      await staffBusinessRequestApi.update(id, payload)
      setSuccessMsg('Cập nhật thành công!')
      loadData()
    } catch (error) {
      setFormError(normalizeError(error))
    }
  }

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const d = state.request || {}
  const tour = d.tour || {}
  const customer = d.khach_hang || d.KhachHang || {}
  const staff = d.nhan_vien || d.NhanVien || null
  const currentStatus = d.TrangThai || ''
  const isUnassigned = !d.MaNV || d.MaNV === 0
  
  // Xác định xem đơn này có phải do tài khoản nhân viên đang đăng nhập (user) phụ trách hay không
  const isMyTask = staff && user && (
    Number(staff.MaNV) === Number(user.nhan_vien?.MaNV) || 
    Number(staff.MaNV) === Number(user.MaNV) || 
    Number(staff.MaTK) === Number(user.MaTK)
  )

  // Tính giá tour
  const giaGoc = Number(tour.GiaGoc || d.GiaGoc || 0)
  const giaGiam = Number(tour.GiaGiam || d.GiaGiam || 0)
  let phanTram = Number(tour.PhanTramGiam || d.PhanTramGiam || 0)
  const hasSale = (giaGoc > 0 && giaGiam > 0 && giaGiam < giaGoc) || phanTram > 0
  if (phanTram <= 0 && hasSale && giaGoc > 0) phanTram = Math.round(100 - (giaGiam / giaGoc * 100))
  const displayPrice = hasSale ? giaGiam : giaGoc

  // Ảnh tour
  const tourImage = d.image_url || d.AnhChinh || tour.image_url || tour.AnhChinh

  return (
    <>
      <Link to="/staff/business-requests" className="staff-link-btn text-muted mb-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontWeight: 600 }}>
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      <header className="page-header mb-3">
        <div>
          <h1 className="page-title">Chi tiết yêu cầu #{d.MaYC || d.MaYCDN || id}</h1>
          <div className="current-date text-muted mt-1">Dự kiến khởi hành: {formatDate(d.ThoiGianKhoiHanh || d.NgayKhoiHanh) || '—'}</div>
        </div>
      </header>

      {/* Thông báo thành công */}
      {successMsg && (
        <div className="alert alert-success fw-bold d-flex align-items-center gap-2 mb-4">
          <i className="fa-solid fa-check-circle"></i> {successMsg}
        </div>
      )}

      {/* Thông báo lỗi */}
      {formError && <FormError message={formError.message} errors={formError.errors} />}

      <div className="row g-4">
        {/* ========= CỘT TRÁI (8/12) ========= */}
        <div className="col-lg-8">

          {/* Card 1: Tour / Dịch vụ quan tâm */}
          <div className="staff-detail-card" style={{ marginBottom: '24px' }}>
            <div style={sectionTitleStyle}>
              <Briefcase size={20} className="text-primary" /> Tour / Dịch vụ quan tâm
            </div>

            {tourImage && (
              <img
                src={buildImageUrl(tourImage)}
                alt="Ảnh tour"
                style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px', border: '1px solid #eee' }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}

            <h5 className="fw-bold mb-3">{tour.TenTour || d.TenTour || 'Khách yêu cầu tour riêng / chưa chọn tour cụ thể'}</h5>

            <div style={infoRowStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Địa điểm:</span>
              <span className="fw-semibold" style={valueStyle}>{tour.DiaDiem || d.DiaDiem || '—'}</span>
            </div>
            <div style={infoRowStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Thời lượng:</span>
              <span className="fw-semibold" style={valueStyle}>{tour.ThoiLuong || '—'}</span>
            </div>
            <div style={infoRowLastStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Giá:</span>
              <span style={valueStyle}>
                <span style={{ color: '#e11d48', fontWeight: 800 }}>
                  {displayPrice > 0 ? formatCurrency(displayPrice) : '—'}
                </span>
                {hasSale && giaGoc > 0 && (
                  <span className="text-muted text-decoration-line-through ms-2">
                    {formatCurrency(giaGoc)}
                  </span>
                )}
                {hasSale && phanTram > 0 && (
                  <span className="badge bg-warning text-dark ms-2">-{phanTram}%</span>
                )}
              </span>
            </div>
          </div>

          {/* Card 2: Thông tin Doanh nghiệp */}
          <div className="staff-detail-card">
            <div style={sectionTitleStyle}>
              <Building2 size={20} className="text-primary" /> Thông tin Doanh nghiệp
            </div>

            <div style={infoRowStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Tên công ty:</span>
              <span className="fw-semibold" style={valueStyle}>{d.TenCongTy || d.cong_ty?.TenCongTy || '—'}</span>
            </div>
            <div style={infoRowStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Người liên hệ:</span>
              <span className="fw-semibold" style={valueStyle}>{d.NguoiLienHe || '—'}</span>
            </div>
            <div style={infoRowStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Số điện thoại:</span>
              <span className="fw-semibold" style={valueStyle}>{d.SDT || d.SoDienThoai || '—'}</span>
            </div>
            <div style={infoRowStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Số lượng khách:</span>
              <span className="fw-semibold" style={valueStyle}>{d.SoNguoi || 0} người</span>
            </div>
            <div style={infoRowStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Ngày khởi hành dự kiến:</span>
              <span className="fw-semibold" style={valueStyle}>{formatDate(d.ThoiGianKhoiHanh || d.NgayKhoiHanh) || '—'}</span>
            </div>
            <div style={infoRowStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Giá trị hợp đồng:</span>
              <span className="fw-semibold text-danger" style={valueStyle}>{d.GiaTriHopDong ? formatCurrency(d.GiaTriHopDong) : '—'}</span>
            </div>
            <div style={infoRowLastStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Ngày thanh toán:</span>
              <span className="fw-semibold" style={valueStyle}>{formatDate(d.NgayThanhToan) || '—'}</span>
            </div>
          </div>
        </div>

        {/* ========= CỘT PHẢI (4/12) ========= */}
        <div className="col-lg-4">

          {/* Card 3: Tài khoản đặt */}
          <div className="staff-detail-card" style={{ marginBottom: '24px' }}>
            <div style={sectionTitleStyle}>
              <UserCircle size={20} className="text-primary" /> Tài khoản đặt
            </div>
            <div style={infoRowStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Họ tên:</span>
              <span className="fw-semibold" style={valueStyle}>{customer.HoTen || 'Khách vãng lai'}</span>
            </div>
            <div style={infoRowStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>Email:</span>
              <span className="fw-semibold" style={valueStyle}>{customer.Email || '—'}</span>
            </div>
            <div style={infoRowLastStyle}>
              <span className="text-muted fw-medium" style={labelStyle}>SĐT:</span>
              <span className="fw-semibold" style={valueStyle}>{customer.SoDienThoai || '—'}</span>
            </div>
          </div>

          {/* Card 4: Xử lý yêu cầu */}
          <div className="staff-detail-card" style={{ backgroundColor: '#f8f9fa', border: 'none' }}>
            <div style={sectionTitleStyle}>
              <Settings size={20} className="text-primary" /> Xử lý yêu cầu
            </div>

            {/* Trạng thái hiện tại */}
            <div className="mb-3">
              <div className="small text-muted mb-1">Trạng thái hiện tại:</div>
              <StaffStatusBadge status={currentStatus || '—'} />
            </div>

            {/* NV phụ trách */}
            <div className="mb-3">
              <div className="small text-muted mb-1">NV phụ trách:</div>
              <div className="fw-bold text-dark">
                {isUnassigned ? (
                  <span className="badge bg-secondary">Chưa gán</span>
                ) : (
                  <>
                    {staff?.HoTen || '—'}
                    {isMyTask && <span className="badge bg-primary ms-1">Là tôi</span>}
                  </>
                )}
              </div>
            </div>

            <hr className="my-3" />

            {/* CASE A: Chưa gán → Nhận xử lý */}
            {isUnassigned && (
              <>
                <div className="alert alert-warning small border-0">
                  <Bell size={14} className="me-1" /> Đơn này chưa có người xử lý. Bạn có muốn nhận không?
                </div>
                <button type="button" className="btn btn-primary w-100 fw-bold py-2" onClick={handleClaim}>
                  <HandHeart size={16} className="me-1" /> Nhận xử lý đơn này
                </button>
              </>
            )}

            {/* CASE B: Đã gán (là tôi) → Form cập nhật */}
            {!isUnassigned && isMyTask && (
              <form onSubmit={handleUpdate}>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">Trạng thái xử lý</label>
                  <select className="form-select" value={form.TrangThai} onChange={(e) => setForm(f => ({ ...f, TrangThai: e.target.value }))} required>
                    {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">Giá trị hợp đồng (VNĐ)</label>
                  <input type="text" className="form-control" value={form.GiaTriHopDong} onChange={(e) => setForm(f => ({ ...f, GiaTriHopDong: e.target.value }))} placeholder="VD: 20000000" />
                  <div className="form-text">Bắt buộc khi chọn <b>Hoàn thành</b>.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">Ngày thanh toán</label>
                  <input type="date" className="form-control" value={form.NgayThanhToan || ''} onChange={(e) => setForm(f => ({ ...f, NgayThanhToan: e.target.value }))} max={new Date().toISOString().split('T')[0]} />
                  <div className="form-text">Bắt buộc khi chọn <b>Hoàn thành</b>.</div>
                </div>

                <button type="submit" className="btn btn-success w-100 fw-bold py-2">
                  <Save size={16} className="me-1" /> Lưu cập nhật
                </button>
              </form>
            )}

            {/* CASE C: Đã gán cho người khác → Chỉ xem */}
            {!isUnassigned && !isMyTask && (
              <>
                <div className="alert alert-secondary small border-0">
                  <Lock size={14} className="me-1" /> Đơn này đang được xử lý bởi nhân viên <b>{staff?.HoTen || '—'}</b>. Bạn chỉ có quyền xem chi tiết.
                </div>
                <button className="btn btn-secondary w-100 fw-bold py-2" disabled>
                  Không thể thao tác
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
