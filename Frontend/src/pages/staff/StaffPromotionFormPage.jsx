import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { staffPromotionApi } from '../../api/staffPromotionApi'
import { staffTourApi } from '../../api/staffTourApi'
import { extractItem, imageSrc, makeMultipart, normalizeError, validateImage } from './staffPageUtils'

const todayStr = new Date().toISOString().split('T')[0]
const EMPTY = { TenKM: '', NoiDung: '', PhanTramGiam: '', NgayBatDau: todayStr, NgayKetThuc: '', TrangThai: 'Hoạt động' }

export default function StaffPromotionFormPage({ mode }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [form, setForm] = useState(EMPTY)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [toursList, setToursList] = useState([])
  const [selectedTours, setSelectedTours] = useState([])
  const [tourPercents, setTourPercents] = useState({})
  const [tourSearch, setTourSearch] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000)
  }

  useEffect(() => {
    Promise.all([
      isEdit ? staffPromotionApi.show(id) : Promise.resolve(null),
      staffTourApi.selection()
    ])
    .then(([promoRes, toursRes]) => {
      setToursList(toursRes || [])
      
      if (isEdit && promoRes) {
        const item = extractItem(promoRes)
        setForm({ ...EMPTY, ...item })
        setPreview(imageSrc(item?.AnhDaiDien))
        
        // Populate tours
        if (item.tours && Array.isArray(item.tours)) {
          const selected = []
          const percents = {}
          item.tours.forEach(t => {
            const tId = t.MaTour || t.pivot?.MaTour
            if (tId) {
              selected.push(tId)
              percents[tId] = t.PhanTramGiamKM || t.pivot?.PhanTramGiamKM || ''
            }
          })
          setSelectedTours(selected)
          setTourPercents(percents)
        }
      }
    })
    .catch((err) => setError(normalizeError(err)))
    .finally(() => setLoading(false))
  }, [id, isEdit])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function chooseFile(event) {
    const selected = event.target.files?.[0] || null
    const validation = validateImage(selected)
    if (validation) return showToast(validation, 'danger')
    setFile(selected)
    if (selected) setPreview(URL.createObjectURL(selected))
  }

  function toggleTour(tourId) {
    setSelectedTours(prev => 
      prev.includes(tourId) ? prev.filter(id => id !== tourId) : [...prev, tourId]
    )
  }

  function updateTourPercent(tourId, percent) {
    setTourPercents(prev => ({ ...prev, [tourId]: percent }))
  }

  function submit(event) {
    event.preventDefault()

    const missingFields = []
    if (!form.TenKM?.trim()) missingFields.push('Tên khuyến mãi')
    if (form.PhanTramGiam === '' || form.PhanTramGiam === null || form.PhanTramGiam === undefined) missingFields.push('% Giảm chung')
    if (!form.NgayBatDau) missingFields.push('Ngày bắt đầu')
    if (!form.NgayKetThuc) missingFields.push('Ngày kết thúc')

    if (missingFields.length > 0) {
      if (missingFields.length === 4) {
        showToast('Vui lòng nhập thông tin đầy đủ', 'danger')
      } else {
        showToast(`Vui lòng nhập thông tin ô: ${missingFields[0]}`, 'danger')
      }
      return
    }

    setShowConfirmModal(true)
  }

  async function confirmSubmit() {
    setShowConfirmModal(false)
    setSubmitting(true)
    setError(null)
    try {
      const toursPayload = selectedTours.map(tId => ({
        MaTour: tId,
        PhanTramGiamKM: tourPercents[tId] !== undefined && tourPercents[tId] !== '' ? tourPercents[tId] : form.PhanTramGiam
      }))

      const { AnhDaiDien, ...restForm } = form
      const payload = makeMultipart({ 
        ...restForm, 
        tours: toursPayload,
        ...(isEdit ? { _method: 'PUT' } : {}) 
      }, [['AnhDaiDien', file]])
      
      if (isEdit) {
        await staffPromotionApi.update(id, payload)
        showToast('Lưu chương trình khuyến mãi thành công', 'success')
        
        const promoRes = await staffPromotionApi.show(id)
        if (promoRes) {
          const item = extractItem(promoRes)
          setForm({ ...EMPTY, ...item })
          setPreview(imageSrc(item?.AnhDaiDien))
          setFile(null)
          
          if (item.tours && Array.isArray(item.tours)) {
            const selected = []
            const percents = {}
            item.tours.forEach(t => {
              const tId = t.MaTour || t.pivot?.MaTour
              if (tId) {
                selected.push(tId)
                percents[tId] = t.PhanTramGiamKM || t.pivot?.PhanTramGiamKM || ''
              }
            })
            setSelectedTours(selected)
            setTourPercents(percents)
          }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        await staffPromotionApi.create(payload)
        showToast('Lưu chương trình khuyến mãi thành công', 'success')
        setTimeout(() => {
          navigate('/staff/promotions')
        }, 1000)
      }
    } catch (err) {
      const normErr = normalizeError(err)
      setError(normErr)
      showToast(normErr.message || 'Có lỗi xảy ra', 'danger')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTours = toursList.filter(t => {
    const searchString = `${t.MaTour} ${t.TenTour} ${t.DiaDiem}`.toLowerCase()
    return searchString.includes(tourSearch.toLowerCase().trim())
  })

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>

  return (
    <>
      <style>
        {`
          .cardx { background: #fff; border-radius: 16px; padding: 22px; border: 1px solid rgba(0, 0, 0, 0.04); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02); }
          .tour-item { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; gap: 12px; align-items: center; transition: all 0.2s; }
          .tour-item:hover { background-color: #f8f9fa; border-color: #d1d5db; }
          .tour-item.selected { border-color: #0d6efd; background-color: #f0f7ff; }
          .tour-name { font-weight: 700; color: #111827; cursor: pointer; }
          .tour-meta { color: #64748b; font-size: 12px; }
          .pt-input { width: 120px; text-align: center; font-weight: 600; }
          .pt-input::-webkit-outer-spin-button, .pt-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          .pt-input[type=number] { -moz-appearance: textfield; }
          .search-tour-box { position: relative; margin-bottom: 15px; }
          .search-tour-box input { padding-left: 35px; border-radius: 8px; }
          .search-tour-box i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
        `}
      </style>

      {toast.show && (
        <div className={`toast align-items-center text-white bg-${toast.type} border-0 show fade`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '250px' }}>
          <div className="d-flex">
            <div className="toast-body fw-semibold">
              <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'} me-2`}></i>
              {toast.message}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: '28px', color: '#111827' }}>
            {isEdit ? 'Sửa chương trình khuyến mãi' : 'Thêm chương trình khuyến mãi'}
          </h1>
          <div className="text-muted">Tạo CTKM mới và chọn các tour được áp dụng</div>
        </div>
        <Link className="btn btn-outline-secondary" to="/staff/promotions">
          <i className="fa-solid fa-arrow-left me-1"></i> Quay lại
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <div className="fw-bold"><i className="fa-solid fa-circle-exclamation me-1"></i> Vui lòng kiểm tra lại:</div>
          <ul className="mb-0 ps-3">
            {error.errors && Object.keys(error.errors).length > 0 ? (
              Object.values(error.errors).map((errs, i) => <li key={i}>{errs[0]}</li>)
            ) : (
              <li>{error.message}</li>
            )}
          </ul>
        </div>
      )}

      <form onSubmit={submit} noValidate className="row g-4">
        <div className="col-lg-5">
          <div className="cardx h-100">
            <div className="fw-bold mb-3 text-uppercase small text-secondary">
              <i className="fa-solid fa-tags me-2"></i>Thông tin chương trình
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Tên khuyến mãi <span className="text-danger">*</span></label>
              <input className="form-control" name="TenKM" value={form.TenKM} onChange={updateField} required placeholder="VD: Khuyến mãi Hè 2025..." />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Nội dung chi tiết</label>
              <textarea className="form-control" name="NoiDung" rows="4" value={form.NoiDung} onChange={updateField} placeholder="Mô tả chi tiết chương trình..."></textarea>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">% Giảm chung <span className="text-danger">*</span></label>
                <div className="input-group">
                  <input type="number" min="0" max="100" className="form-control fw-bold text-primary" name="PhanTramGiam" value={form.PhanTramGiam} onChange={updateField} onWheel={(e) => e.target.blur()} required />
                  <span className="input-group-text">%</span>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Trạng thái</label>
                <select className="form-select" name="TrangThai" value={form.TrangThai} onChange={updateField}>
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                </select>
              </div>
            </div>

            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <label className="form-label fw-bold">Ngày bắt đầu <span className="text-danger">*</span></label>
                <input type="date" className="form-control" name="NgayBatDau" value={form.NgayBatDau} min={todayStr} onChange={updateField} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Ngày kết thúc <span className="text-danger">*</span></label>
                <input type="date" className="form-control" name="NgayKetThuc" value={form.NgayKetThuc} min={form.NgayBatDau || ''} onChange={updateField} required />
              </div>
            </div>

            <div className="mt-3">
              <label className="form-label fw-bold">Ảnh đại diện (Banner)</label>
              <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.webp" onChange={chooseFile} />
              <div className="form-text small">Để trống nếu giữ nguyên ảnh cũ</div>
              {preview && (
                <div className="mt-2 text-center border rounded p-2 bg-light">
                  <img src={preview} alt="Preview" style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="cardx h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="fw-bold text-uppercase small text-secondary">
                <i className="fa-solid fa-list-check me-2"></i>Gán tour áp dụng
              </div>
              <div className="badge bg-light text-dark border">
                Đã chọn: <span className="text-primary fw-bold">{selectedTours.length}</span> / {toursList.length} tour
              </div>
            </div>

            {toursList.length === 0 ? (
              <div className="alert alert-warning mb-0 text-center">Chưa có tour nào trong hệ thống.</div>
            ) : (
              <>
                <div className="search-tour-box">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input type="text" className="form-control form-control-sm py-2" placeholder="Gõ mã tour, tên tour hoặc địa điểm để tìm nhanh..." value={tourSearch} onChange={(e) => setTourSearch(e.target.value)} />
                </div>

                <div className="alert alert-info py-2 small mb-3">
                  <i className="fa-solid fa-circle-info me-1"></i> Tick chọn tour để áp dụng. Nếu để trống ô <b>% riêng</b>, hệ thống sẽ dùng <b>% Giảm chung</b>.
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
                  <div className="d-grid gap-2">
                    {filteredTours.map(t => {
                      const isSelected = selectedTours.includes(t.MaTour)
                      return (
                        <div key={t.MaTour} className={`tour-item ${isSelected ? 'selected' : ''}`}>
                          <div className="d-flex gap-3 align-items-center flex-grow-1">
                            <div className="form-check" style={{ transform: 'scale(1.2)' }}>
                              <input className="form-check-input" type="checkbox" checked={isSelected} onChange={() => toggleTour(t.MaTour)} id={`t${t.MaTour}`} />
                            </div>
                            <div className="flex-grow-1" onClick={() => toggleTour(t.MaTour)}>
                              <label className="tour-name d-block mb-0" style={{ cursor: 'pointer' }}>
                                {t.TenTour}
                              </label>
                              <div className="tour-meta mt-1">
                                <span className="badge bg-light text-dark border me-1">#{t.MaTour}</span>
                                <span className="text-primary fw-semibold me-1" style={{ fontSize: '11px' }}>{t.LoaiTour}</span>
                                <span className="mx-1">•</span>
                                <i className="fa-solid fa-location-dot me-1"></i>{t.DiaDiem || '—'}
                              </div>
                            </div>
                          </div>

                          <div className="text-end ps-2 border-start" onClick={(e) => e.stopPropagation()}>
                            <div className="text-muted small mb-1" style={{ fontSize: '11px' }}>% Riêng</div>
                            <input className="form-control form-control-sm pt-input" type="number" min="0" max="100" placeholder="Mặc định" value={tourPercents[t.MaTour] !== undefined ? tourPercents[t.MaTour] : ''} onChange={(e) => updateTourPercent(t.MaTour, e.target.value)} onWheel={(e) => e.target.blur()} disabled={!isSelected} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {filteredTours.length === 0 && (
                    <div className="text-center text-muted py-3">
                      <i className="fa-regular fa-face-frown mb-1 fs-4"></i><br />Không tìm thấy tour phù hợp
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-12 text-end mt-2 pb-5">
          <Link className="btn btn-light border px-4 py-2 me-2" to="/staff/promotions">Hủy bỏ</Link>
          <button className="btn btn-primary px-4 py-2 fw-bold shadow-sm" type="submit" disabled={submitting}>
            <i className="fa-solid fa-floppy-disk me-1"></i> {submitting ? 'Đang lưu...' : 'Lưu chương trình'}
          </button>
        </div>
      </form>

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
                  Bạn có muốn lưu khuyến mãi này không?
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
    </>
  )
}
