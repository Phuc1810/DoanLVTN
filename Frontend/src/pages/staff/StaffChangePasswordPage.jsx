import { useState } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'

export default function StaffChangePasswordPage() {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false })
  const [toastMessage, setToastMessage] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage('')
    }, 5000)
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const togglePass = (field) => {
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }))
  }

  function handleFormSubmit(event) {
    event.preventDefault()
    
    // Custom Validation
    if (!form.current_password && !form.password && !form.password_confirmation) {
      showToast('Vui lòng nhập đầy đủ thông tin')
      return
    }
    if (!form.current_password) {
      showToast('Vui lòng nhập Mật khẩu hiện tại')
      return
    }
    if (!form.password) {
      showToast('Vui lòng nhập Mật khẩu mới')
      return
    }
    if (form.password.length < 6) {
      showToast('Mật khẩu mới tối thiểu 6 ký tự')
      return
    }
    if (!form.password_confirmation) {
      showToast('Vui lòng nhập lại Mật khẩu mới')
      return
    }
    if (form.password !== form.password_confirmation) {
      showToast('Mật khẩu xác nhận không khớp')
      return
    }

    // Pass validation, show confirm modal
    setShowConfirmModal(true)
  }

  async function confirmSubmit() {
    setShowConfirmModal(false)
    setSubmitting(true)
    setError(null)
    try {
      await authApi.changePassword(form)
      showToast('Lưu thay đổi thành công')
      setForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      if (err.errors && err.errors.password) {
        showToast(err.errors.password[0])
      } else {
        showToast(err.message || 'Có lỗi xảy ra')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Determine if toast is error or success based on message content
  const isErrorToast = toastMessage.includes('Vui lòng') || toastMessage.includes('không') || toastMessage.includes('tối thiểu')

  return (
    <>
      {toastMessage && (
        <div 
          className={`toast align-items-center text-white border-0 show fade ${isErrorToast ? 'bg-danger' : 'bg-success'}`} 
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true"
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '250px' }}
        >
          <div className="d-flex">
            <div className="toast-body fw-semibold">
              <i className={`fa-solid ${isErrorToast ? 'fa-circle-exclamation' : 'fa-circle-check'} me-2`}></i>
              {toastMessage}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMessage('')} aria-label="Close"></button>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title mb-1" style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>Đổi mật khẩu</h1>
          <div className="text-muted" style={{ fontSize: '14px' }}>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-6">

          {error && (
            <div className="alert alert-danger d-flex align-items-center rounded-3 shadow-sm border-0 mb-3">
              <i className="fa-solid fa-circle-exclamation me-2 fs-5"></i> 
              <div>
                <div>{error.message}</div>
                {error.errors && Object.values(error.errors).map((errs, i) => (
                  <div key={i}>{errs.join(', ')}</div>
                ))}
              </div>
            </div>
          )}

          <div className="card border-0 shadow-sm rounded-4 p-4">
            <form onSubmit={handleFormSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label fw-bold">Mật khẩu hiện tại</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPass.current ? "text" : "password"} 
                    className="form-control py-2 rounded-3" 
                    name="current_password" 
                    value={form.current_password} 
                    onChange={updateField} 
                    required 
                    placeholder="Nhập mật khẩu đang dùng..." 
                  />
                  <button 
                    type="button" 
                    onClick={() => togglePass('current')} 
                    style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: showPass.current ? '#0d6efd' : '#6c757d', cursor: 'pointer' }}
                  >
                    <i className={showPass.current ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                  </button>
                </div>
              </div>

              <hr className="my-4 text-muted opacity-25" />

              <div className="mb-3">
                <label className="form-label fw-bold">Mật khẩu mới</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPass.new ? "text" : "password"} 
                    className="form-control py-2 rounded-3" 
                    name="password" 
                    value={form.password} 
                    onChange={updateField} 
                    required 
                    placeholder="Tối thiểu 6 ký tự" 
                  />
                  <button 
                    type="button" 
                    onClick={() => togglePass('new')} 
                    style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: showPass.new ? '#0d6efd' : '#6c757d', cursor: 'pointer' }}
                  >
                    <i className={showPass.new ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">Nhập lại mật khẩu mới</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPass.confirm ? "text" : "password"} 
                    className="form-control py-2 rounded-3" 
                    name="password_confirmation" 
                    value={form.password_confirmation} 
                    onChange={updateField} 
                    required 
                    placeholder="Nhập lại chính xác mật khẩu mới" 
                  />
                  <button 
                    type="button" 
                    onClick={() => togglePass('confirm')} 
                    style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: showPass.confirm ? '#0d6efd' : '#6c757d', cursor: 'pointer' }}
                  >
                    <i className={showPass.confirm ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                  </button>
                </div>
              </div>

              <div className="d-grid">
                <button type="submit" className="btn btn-primary fw-bold py-2 rounded-3" disabled={submitting}>
                  <i className="fa-solid fa-floppy-disk me-2"></i> {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>

          <div className="text-center mt-3 text-muted small">
            <i className="fa-solid fa-shield-halved me-1"></i> Mật khẩu của bạn được mã hóa an toàn.
          </div>
        </div>
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
                  Bạn có muốn thay đổi mật khẩu không?
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
