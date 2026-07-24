import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { staffTourApi } from '../../api/staffTourApi'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import { extractItem, imageSrc, makeMultipart, normalizeError, validateImage } from './staffPageUtils'

const EMPTY_TOUR = {
  TenTour: '', DiaDiem: '', GiaGoc: '', GiaGiam: '', ThoiLuong: '', NgayKhoiHanh: '', NgayKetThuc: '',
  SoCho: '', Mien: 'Bắc', LoaiTour: 'Cá nhân', PhanTramGiam: '', TrangThai: 'Hoạt động', LoaiAnh: '',
}

function scheduleRowsFrom(tour) {
  const rows = tour?.lich_trinh_tour || tour?.lichtrinhtour || tour?.lich_trinh || []
  if (!Array.isArray(rows) || rows.length === 0) return [{ NgayThu: 1, TieuDe: '', NoiDung: '' }]
  return rows.map((row) => ({ NgayThu: row.NgayThu || '', TieuDe: row.TieuDe || '', NoiDung: row.NoiDung || '' }))
}

export default function StaffTourFormPage({ mode }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_TOUR)
  const [schedules, setSchedules] = useState([{ NgayThu: 1, TieuDe: '', NoiDung: '' }])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Min date = tomorrow
  const minDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [])

  useEffect(() => {
    if (!isEdit) return
    staffTourApi.show(id)
      .then((payload) => {
        const tour = extractItem(payload)
        setForm({ ...EMPTY_TOUR, ...tour })
        setSchedules(scheduleRowsFrom(tour))
        setPreview(imageSrc(tour?.AnhChinh || tour?.DuongDan))
      })
      .catch((err) => setError(normalizeError(err)))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  // Auto calculate GiaGiam
  const computedPrice = useMemo(() => {
    const original = Number(form.GiaGoc || 0)
    const percent = Number(form.PhanTramGiam || 0)
    if (!original) return ''
    return Math.round(original * (100 - percent) / 100)
  }, [form.GiaGoc, form.PhanTramGiam])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function updateSchedule(index, field, value) {
    setSchedules((current) => current.map((row, i) => i === index ? { ...row, [field]: value } : row))
  }

  function addScheduleRow() {
    setSchedules((current) => {
      const lastDay = current.length > 0 ? (parseInt(current[current.length - 1].NgayThu) || 0) : 0
      return [...current, { NgayThu: lastDay + 1, TieuDe: '', NoiDung: '' }]
    })
  }

  function removeScheduleRow(index) {
    if (schedules.length <= 1) return alert('Phải có ít nhất 1 dòng lịch trình!')
    setSchedules((current) => current.filter((_, i) => i !== index))
  }

  function chooseFile(event) {
    const selected = event.target.files?.[0] || null
    const validation = validateImage(selected)
    if (validation) {
      setError({ message: validation })
      return
    }
    setFile(selected)
    if (selected) setPreview(URL.createObjectURL(selected))
  }

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  function handleFormSubmit(event) {
    event.preventDefault()
    setShowConfirmModal(true)
  }

  async function confirmSubmit() {
    setShowConfirmModal(false)
    setSubmitting(true)
    setError(null)
    try {
      const dataToSend = { ...form }
      delete dataToSend.AnhChinh // Backend handles via file upload

      const payload = makeMultipart(
        { ...dataToSend, GiaGiam: computedPrice, lich_trinh: schedules, ...(isEdit ? { _method: 'PUT' } : {}) },
        [['AnhChinh', file]]
      )
      
      if (isEdit) {
        await staffTourApi.update(id, payload)
        setToastMessage('Cập nhật tour thành công!')
        setTimeout(() => setToastMessage(''), 5000)
        
        // Refetch fresh data
        const res = await staffTourApi.show(id)
        const tour = extractItem(res)
        setForm({ ...EMPTY_TOUR, ...tour })
        setSchedules(scheduleRowsFrom(tour))
        setPreview(imageSrc(tour?.AnhChinh || tour?.DuongDan))
        setFile(null)
        
        // Scroll to top to see the toast clearly
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        await staffTourApi.create(payload)
        navigate('/staff/tours', { state: { toastMessage: 'Tạo tour mới thành công!' } })
      }
    } catch (err) {
      setError(normalizeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title">{isEdit ? 'Sửa Tour' : 'Thêm Tour Mới'}</h1>
          <div className="text-muted" style={{ fontSize: '14px' }}>
            {isEdit ? 'Cập nhật thông tin tour, ảnh và lịch trình' : 'Tạo tour + ảnh chính + lịch trình'}
          </div>
        </div>
        <Link className="btn btn-outline-secondary" to="/staff/tours">
          <i className="fa-solid fa-arrow-left me-1"></i> Quay lại danh sách
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger mb-4">
          <div className="fw-bold mb-1">
            <i className="fa-solid fa-circle-exclamation me-1"></i> Vui lòng kiểm tra lại:
          </div>
          <FormError 
            message={error?.message} 
            errors={error?.errors ? Object.fromEntries(Object.entries(error.errors).filter(([k]) => k !== 'NgayKhoiHanh')) : undefined} 
          />
        </div>
      )}

      {/* Main Form Card */}
      <div className="card p-4" style={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <form onSubmit={handleFormSubmit} className="row g-3">

          {/* ===== Section 1: Thông tin tour ===== */}
          <div className="col-12">
            <div className="fw-bold text-primary">1) Thông tin tour</div>
            <hr />
          </div>

          <div className="col-md-8">
            <label className="form-label fw-semibold">Tên Tour <span className="text-danger">*</span></label>
            <input type="text" className="form-control" name="TenTour" value={form.TenTour} onChange={updateField} required />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold">Loại tour <span className="text-danger">*</span></label>
            <select className="form-select" name="LoaiTour" value={form.LoaiTour} onChange={updateField}>
              <option value="Cá nhân">Cá nhân</option>
              <option value="Doanh nghiệp">Doanh nghiệp</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Địa điểm <span className="text-danger">*</span></label>
            <input type="text" className="form-control" name="DiaDiem" value={form.DiaDiem} onChange={updateField} required />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">Thời lượng <span className="text-danger">*</span></label>
            <input type="text" className="form-control" name="ThoiLuong" value={form.ThoiLuong} onChange={updateField} placeholder="VD: 3N2Đ" required />
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold">Số chỗ <span className="text-danger">*</span></label>
            <input type="number" className="form-control" name="SoCho" value={form.SoCho} onChange={updateField} onWheel={(e) => e.target.blur()} min="1" required />
          </div>

          <div className="col-md-8">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Miền <span className="text-danger">*</span></label>
                <select className="form-select" name="Mien" value={form.Mien} onChange={updateField}>
                  <option value="Bắc">Bắc</option>
                  <option value="Trung">Trung</option>
                  <option value="Nam">Nam</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Trạng thái <span className="text-danger">*</span></label>
                <select className="form-select" name="TrangThai" value={form.TrangThai} onChange={updateField}>
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                  <option value="Hết chỗ">Hết chỗ</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Loại ảnh</label>
                <select className="form-select" name="LoaiAnh" value={form.LoaiAnh} onChange={updateField}>
                  <option value="">(Rỗng / Không chọn)</option>
                  <option value="banner">banner</option>
                  <option value="noibat">noibat</option>
                </select>
                <div className="form-text">Không chọn sẽ lưu rỗng.</div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold">Ảnh chính (1 ảnh) <span className="text-danger">{!isEdit && '*'}</span></label>
            <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.webp" onChange={chooseFile} required={!isEdit} />
            <div className="form-text">{isEdit ? 'Để trống nếu giữ nguyên ảnh cũ' : 'Chọn ảnh để lưu'}</div>
            {preview && (
              <div className="mt-2">
                <img src={preview} alt="Preview" style={{ maxHeight: '180px', borderRadius: '8px', border: '1px solid #eee', objectFit: 'cover', maxWidth: '100%' }} />
              </div>
            )}
          </div>

          {/* ===== Section 2: Giá & Ngày ===== */}
          <div className="col-12">
            <div className="fw-bold text-primary mt-2">2) Giá & Ngày</div>
            <hr className="mt-2 mb-0" />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold">Giá gốc (VNĐ) <span className="text-danger">*</span></label>
            <input type="number" className="form-control" name="GiaGoc" value={form.GiaGoc} onChange={updateField} onWheel={(e) => e.target.blur()} min="0" required />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold">Phần trăm giảm (%) <span className="text-danger">*</span></label>
            <input type="number" className="form-control" name="PhanTramGiam" value={form.PhanTramGiam} onChange={updateField} onWheel={(e) => e.target.blur()} min="0" max="100" required />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold">Giá giảm (VNĐ) <span className="text-danger">*</span></label>
            <input type="text" className="form-control bg-light" value={computedPrice ? new Intl.NumberFormat('vi-VN').format(computedPrice) : ''} disabled />
            <div className="form-text text-primary small">Tự động tính khi nhập Giá gốc và %</div>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Ngày khởi hành <span className="text-danger">*</span></label>
            <input type="date" className={`form-control ${error?.errors?.NgayKhoiHanh ? 'is-invalid' : ''}`} name="NgayKhoiHanh" value={form.NgayKhoiHanh} onChange={updateField} min={isEdit ? undefined : minDate} required />
            {error?.errors?.NgayKhoiHanh ? (
              <div className="invalid-feedback d-block">{error.errors.NgayKhoiHanh[0]}</div>
            ) : (
              <div className="form-text">Không được chọn ngày ≤ hôm nay</div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Ngày kết thúc <span className="text-danger">*</span></label>
            <input type="date" className="form-control" name="NgayKetThuc" value={form.NgayKetThuc} onChange={updateField} min={form.NgayKhoiHanh || (isEdit ? undefined : minDate)} required />
            <div className="form-text">Không được chọn ngày ≤ hôm nay, và phải ≥ ngày khởi hành</div>
          </div>

          {/* ===== Section 3: Lịch trình tour ===== */}
          <div className="col-12">
            <div className="fw-bold text-primary mt-2">3) Lịch trình tour</div>
            <hr />
          </div>

          <div className="col-12 d-flex justify-content-between align-items-center">
            <div className="text-muted">Thêm các dòng lịch trình (Bắt buộc phải nhập)</div>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addScheduleRow}>
              <i className="fa-solid fa-plus me-1"></i> Thêm dòng
            </button>
          </div>

          <div className="col-12">
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '110px' }}>Ngày thứ</th>
                    <th style={{ width: '260px' }}>Tiêu đề</th>
                    <th>Nội dung</th>
                    <th style={{ width: '80px' }} className="text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          className="form-control"
                          type="number"
                          min="1"
                          value={row.NgayThu}
                          onChange={(e) => updateSchedule(index, 'NgayThu', e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          required
                        />
                      </td>
                      <td>
                        <input
                          className="form-control"
                          value={row.TieuDe}
                          onChange={(e) => updateSchedule(index, 'TieuDe', e.target.value)}
                          placeholder={`VD: Ngày ${row.NgayThu}: ...`}
                          required
                        />
                      </td>
                      <td>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={row.NoiDung}
                          onChange={(e) => updateSchedule(index, 'NoiDung', e.target.value)}
                          placeholder="Mô tả..."
                          required
                        />
                      </td>
                      <td className="text-center">
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeScheduleRow(index)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== Submit Buttons ===== */}
          <div className="col-12 d-flex justify-content-end gap-2 mt-2">
            <Link to="/staff/tours" className="btn btn-light border px-4">Hủy</Link>
            <button className="btn btn-primary px-4 fw-bold" type="submit" disabled={submitting}>
              {submitting ? (
                <><i className="fa-solid fa-spinner fa-spin me-1"></i> Đang lưu...</>
              ) : isEdit ? (
                <><i className="fa-solid fa-floppy-disk me-1"></i> Lưu thay đổi</>
              ) : (
                <><i className="fa-solid fa-plus me-1"></i> Tạo Tour</>
              )}
            </button>
          </div>

        </form>
      </div>

      {showConfirmModal && (
        <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>
      )}
      {showConfirmModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div className="modal-body text-center p-4">
                <div className="mb-3">
                  <i className="fa-solid fa-circle-question text-primary" style={{ fontSize: '50px', opacity: 0.8 }}></i>
                </div>
                <h5 className="mb-4 text-dark fw-bold" style={{ lineHeight: '1.5' }}>
                  {isEdit ? 'Bạn có muốn lưu thay đổi tour này không?' : 'Bạn có muốn tạo tour mới không?'}
                </h5>
                <div className="d-flex justify-content-center gap-3">
                  <button type="button" className="btn btn-outline-secondary px-4 rounded-pill" onClick={() => setShowConfirmModal(false)}>Hủy</button>
                  <button type="button" className="btn btn-primary px-4 rounded-pill" onClick={confirmSubmit}>Đồng ý</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div 
          className="toast align-items-center text-white bg-success border-0 show fade" 
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true"
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '250px' }}
        >
          <div className="d-flex">
            <div className="toast-body fw-semibold">
              <i className="fa-solid fa-circle-check me-2"></i>
              {toastMessage}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMessage('')} aria-label="Close"></button>
          </div>
        </div>
      )}
    </>
  )
}
