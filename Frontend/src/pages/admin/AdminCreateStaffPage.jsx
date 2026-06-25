import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminAccountApi } from '../../api/adminAccountApi'
import FormError from '../../components/common/FormError'
import { generatePassword, normalizeError } from './adminPageUtils'

export default function AdminCreateStaffPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullname: '', username: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await adminAccountApi.createStaff(form)
      navigate('/admin/accounts')
    } catch (err) {
      setError(normalizeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="admin-page-title">Tạo tài khoản nhân viên</h3>
          <p className="admin-subtitle">Tạo tài khoản VaiTro NV giống modal admin cũ.</p>
        </div>
        <Link className="admin-btn light" to="/admin/accounts">Quay lại</Link>
      </div>
      <div className="admin-card p-4">
        <FormError message={error?.message} errors={error?.errors} />
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted">Họ tên</label>
            <input className="admin-input" name="fullname" value={form.fullname} onChange={updateField} required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted">Username</label>
            <input className="admin-input" name="username" value={form.username} onChange={updateField} required />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold small text-muted">Password</label>
            <div className="input-group">
              <input className="form-control bg-light" type="text" name="password" value={form.password} onChange={updateField} required />
              <button className="btn btn-outline-secondary" type="button" onClick={() => setForm((current) => ({ ...current, password: generatePassword() }))}>Random</button>
            </div>
          </div>
          <button type="submit" className="admin-btn primary" disabled={submitting}>{submitting ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
        </form>
      </div>
    </>
  )
}
