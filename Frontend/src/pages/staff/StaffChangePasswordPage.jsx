import { useState } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'

export default function StaffChangePasswordPage() {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess('')
    try {
      await authApi.changePassword(form)
      setSuccess('Đổi mật khẩu thành công.')
      setForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-header"><h1 className="page-title">Đổi mật khẩu</h1></div>
      <form className="staff-form-card" onSubmit={submit}>
        <FormError message={error?.message} errors={error?.errors} />
        {success && <div className="alert alert-success">{success}</div>}
        <div className="staff-form-grid">
          <div className="staff-field full"><label>Mật khẩu hiện tại</label><input type="password" name="current_password" value={form.current_password} onChange={updateField} required /></div>
          <div className="staff-field"><label>Mật khẩu mới</label><input type="password" name="password" value={form.password} onChange={updateField} required /></div>
          <div className="staff-field"><label>Xác nhận mật khẩu mới</label><input type="password" name="password_confirmation" value={form.password_confirmation} onChange={updateField} required /></div>
        </div>
        <div className="staff-actions-row"><button className="staff-action-btn primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Đổi mật khẩu'}</button></div>
      </form>
    </>
  )
}
