import { useState } from 'react'
import FormError from '../common/FormError'
import { generatePassword } from '../../pages/staff/staffPageUtils'

export default function StaffResetPasswordModal({ account, error, submitting, onClose, onSubmit }) {
  const [password, setPassword] = useState('')

  if (!account) return null

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ password, new_password: password, password_confirmation: password })
  }

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-bottom-0 pb-0">
            <div>
              <h5 className="modal-title fw-bold text-danger">Cấp lại mật khẩu</h5>
              <p className="small text-muted mb-0">Tài khoản: <strong className="text-dark">{account.TenDangNhap}</strong></p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <FormError message={error?.message} errors={error?.errors} />
            <form onSubmit={handleSubmit} id="resetPasswordForm">
              <label className="form-label fw-bold small text-muted">Mật khẩu mới</label>
              <div className="input-group mb-2">
                <input className="form-control" type="text" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
                <button type="button" className="btn btn-outline-secondary" onClick={() => setPassword(generatePassword())}>Tạo ngẫu nhiên</button>
              </div>
              <div className="form-text text-danger fst-italic">Hãy copy mật khẩu này gửi cho nhân viên trước khi bấm lưu.</div>
            </form>
          </div>
          <div className="modal-footer border-top-0 pt-0">
            <button type="button" className="btn btn-light" onClick={onClose} disabled={submitting}>Hủy</button>
            <button type="submit" form="resetPasswordForm" className="dash-btn-danger" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
