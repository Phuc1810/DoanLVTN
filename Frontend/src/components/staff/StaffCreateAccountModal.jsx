import { useState } from 'react'
import { adminAccountApi } from '../../api/adminAccountApi'
import FormError from '../common/FormError'
import { generatePassword, normalizeError } from '../../pages/staff/staffPageUtils'

export default function StaffCreateAccountModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ fullname: '', username: '', password: '', email: '', sdt: '', chucvu: '' })
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })

  function showToastMessage(msg) {
    setToast({ show: true, message: msg })
    setTimeout(() => setToast({ show: false, message: '' }), 5000)
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setValidationErrors({})
    setError(null)

    // Check if completely empty
    const isAllEmpty = !form.fullname && !form.username && !form.password && !form.email && !form.sdt && !form.chucvu
    if (isAllEmpty) {
      showToastMessage('Bạn chưa nhập bất cứ thông tin gì. Vui lòng điền thông tin nhân viên.')
      return
    }

    // Check required fields dynamically
    const missingFields = []
    if (!form.fullname) missingFields.push('Họ tên')
    if (!form.email) missingFields.push('Email')
    if (!form.sdt) missingFields.push('Số điện thoại')
    if (!form.chucvu) missingFields.push('Chức vụ')
    if (!form.username) missingFields.push('Tên đăng nhập')
    if (!form.password) missingFields.push('Mật khẩu')

    if (missingFields.length > 0) {
      showToastMessage(`Vui lòng điền các thông tin bắt buộc còn thiếu: ${missingFields.join(', ')}.`)
      return
    }

    // Format validation
    const errors = {}
    if (form.email && !/^[a-zA-Z0-9]+@gmail\.com$/.test(form.email)) {
      errors.email = 'Email chỉ chứa chữ cái không dấu, số và phải có đuôi @gmail.com'
    }
    if (form.sdt && !/^\d{10}$/.test(form.sdt)) {
      errors.sdt = 'Số điện thoại phải bao gồm đúng 10 chữ số.'
    }
    if (form.username && form.username.length < 6) {
      errors.username = 'Tên đăng nhập phải chứa ít nhất 6 ký tự.'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    // Trigger confirmation modal instead of immediate submit
    setShowConfirmModal(true)
  }

  async function confirmSubmit() {
    setShowConfirmModal(false)
    setSubmitting(true)
    try {
      await adminAccountApi.createStaff(form)
      onSuccess()
    } catch (err) {
      setError(normalizeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold">Tạo tài khoản nhân viên</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <FormError message={error?.message} errors={error?.errors} />
            <form onSubmit={submit} id="createStaffForm">
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">Họ tên nhân viên <span className="text-danger">*</span></label>
                <input className="form-control" name="fullname" placeholder="VD: Nguyễn Văn A" value={form.fullname} onChange={updateField} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">Email <span className="text-danger">*</span></label>
                <input className="form-control" type="email" name="email" placeholder="VD: nguyenvana123@gmail.com" value={form.email} onChange={updateField} />
                {validationErrors.email && <div className="text-danger small mt-1">{validationErrors.email}</div>}
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">Số điện thoại <span className="text-danger">*</span></label>
                  <input className="form-control" name="sdt" placeholder="VD: 0912345678" value={form.sdt} onChange={updateField} />
                  {validationErrors.sdt && <div className="text-danger small mt-1">{validationErrors.sdt}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-muted">Chức vụ <span className="text-danger">*</span></label>
                  <input className="form-control" name="chucvu" placeholder="VD: Quản lý, CSKH..." value={form.chucvu} onChange={updateField} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">Tên đăng nhập (Username) <span className="text-danger">*</span></label>
                <input className="form-control" name="username" placeholder="VD: nguyenvana" value={form.username} onChange={updateField} />
                {validationErrors.username && <div className="text-danger small mt-1">{validationErrors.username}</div>}
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold small text-muted">Mật khẩu (Password) <span className="text-danger">*</span></label>
                <div className="input-group">
                  <input className="form-control" type="text" name="password" value={form.password} onChange={updateField} />
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setForm((current) => ({ ...current, password: generatePassword() }))}>Tạo ngẫu nhiên</button>
                </div>
              </div>
            </form>
          </div>
          <div className="modal-footer border-top-0 pt-0">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>Hủy</button>
            <button type="submit" form="createStaffForm" className="dash-btn-primary" disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}></div>
      )}
      {showConfirmModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div className="modal-body text-center p-4">
                <div className="mb-3">
                  <i className="fa-solid fa-circle-question text-primary" style={{ fontSize: '50px', opacity: 0.8 }}></i>
                </div>
                <h5 className="mb-4 text-dark fw-bold" style={{ lineHeight: '1.5' }}>
                  Bạn có muốn tạo tài khoản nhân viên mới không?
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

      {/* Validation Warning Toast */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-4" style={{ zIndex: 1100, marginTop: '60px' }}>
          <div className="toast show align-items-center text-white bg-danger border-0 shadow-lg" role="alert" style={{ borderRadius: '8px', minWidth: '300px' }}>
            <div className="d-flex">
              <div className="toast-body fw-medium fs-6 d-flex align-items-center">
                <i className="fa-solid fa-circle-exclamation fs-5 me-2"></i>
                {toast.message}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ show: false, message: '' })}></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
