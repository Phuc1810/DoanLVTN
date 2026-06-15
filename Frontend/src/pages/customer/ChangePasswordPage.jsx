import { useState } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'
import PasswordInput from '../../components/common/PasswordInput'

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [error, setError] = useState({ message: '', errors: {} })
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(form.password) || form.password !== form.password_confirmation) {
      setError({ message: 'Mật khẩu mới phải mạnh và xác nhận phải khớp.', errors: {} })
      return
    }
    setSubmitting(true)
    setSuccess('')
    setError({ message: '', errors: {} })
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
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5">
        <div className="title"><i className="fa-solid fa-key me-2"></i>Đổi mật khẩu</div>
        <div className="muted mt-1">Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.</div>
        <div className="divider"></div>
        <FormError message={error.message} errors={error.errors} />
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={submit} className="row g-3" noValidate>
          <div className="col-md-12">
            <label className="form-label fw-semibold">Mật khẩu hiện tại</label>
            <PasswordInput id="current_password" name="current_password" value={form.current_password} onChange={update} />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Mật khẩu mới</label>
            <PasswordInput id="password" name="password" value={form.password} onChange={update} />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Nhập lại mật khẩu mới</label>
            <PasswordInput id="password_confirmation" name="password_confirmation" value={form.password_confirmation} onChange={update} />
          </div>
          <div className="col-12 d-flex justify-content-end">
            <button className="btn btn-primary btn-lg px-4" disabled={submitting}>Xác nhận đổi mật khẩu</button>
          </div>
        </form>
      </div>
    </div>
  )
}
