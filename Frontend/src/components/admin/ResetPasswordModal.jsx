import { useState } from 'react'
import FormError from '../common/FormError'
import { generatePassword } from '../../pages/admin/adminPageUtils'

export default function ResetPasswordModal({ account, error, submitting, onClose, onSubmit }) {
  const [password, setPassword] = useState('')

  if (!account) return null

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ password, new_password: password, password_confirmation: password })
  }

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div className="admin-modal">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="fw-bold text-warning mb-1">Cấp lại mật khẩu</h5>
            <p className="small text-muted mb-0">Tài khoản: <strong className="text-dark">{account.TenDangNhap}</strong></p>
          </div>
          <button type="button" className="btn-close" aria-label="Đóng" onClick={onClose} />
        </div>
        <FormError message={error?.message} errors={error?.errors} />
        <form onSubmit={handleSubmit}>
          <label className="form-label fw-bold small text-muted">Mật khẩu mới</label>
          <div className="input-group mb-2">
            <input className="form-control bg-light" type="text" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setPassword(generatePassword())}>Random</button>
          </div>
          <div className="form-text text-danger fst-italic mb-4">Copy mật khẩu này gửi cho nhân viên trước khi bấm lưu.</div>
          <div className="d-grid">
            <button type="submit" className="admin-btn warning" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
