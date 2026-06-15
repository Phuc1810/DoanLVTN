import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'
import PasswordInput from '../../components/common/PasswordInput'
import AuthShell from '../../components/layout/AuthShell'

const MAX_DOB = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10)

function validate(form) {
  const errors = {}
  if (form.hoten.trim().split(/\s+/).filter(Boolean).length < 2) errors.hoten = ['Họ tên phải có ít nhất 2 từ.']
  if (!form.contact) errors.contact = ['Vui lòng nhập Email hoặc SĐT.']
  else if (!/^\d{10}$/.test(form.contact) && !/^[^\s@]+@gmail\.com$/i.test(form.contact)) errors.contact = ['Email phải là @gmail.com hoặc SĐT 10 số.']
  if (!form.diachi) errors.diachi = ['Địa chỉ không được để trống.']
  if (!form.ngaysinh) errors.ngaysinh = ['Vui lòng chọn ngày sinh.']
  if (!form.gioitinh) errors.gioitinh = ['Vui lòng chọn giới tính.']
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(form.password)) errors.password = ['Mật khẩu phải >= 8 ký tự, có hoa/thường/số/ký tự đặc biệt.']
  if (form.confirm_password && form.confirm_password !== form.password) errors.confirm_password = ['Nhập lại mật khẩu chưa khớp.']
  return errors
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ hoten: '', contact: '', diachi: '', ngaysinh: '', gioitinh: '', password: '', confirm_password: '' })
  const [error, setError] = useState({ message: '', errors: {} })
  const [submitting, setSubmitting] = useState(false)

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    const clientErrors = validate(form)
    if (Object.keys(clientErrors).length) {
      setError({ message: 'Vui lòng kiểm tra lại thông tin đăng ký.', errors: clientErrors })
      return
    }

    setSubmitting(true)
    setError({ message: '', errors: {} })
    try {
      await authApi.register({
        hoten: form.hoten,
        contact: form.contact,
        diachi: form.diachi,
        ngaysinh: form.ngaysinh,
        gioitinh: form.gioitinh,
        password: form.password,
      })
      navigate(`/auth/login?prefill=${encodeURIComponent(form.contact)}`, { replace: true })
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <div className="card auth-card">
        <div className="row g-0">
          <div className="col-md-5 d-none d-md-block">
            <div className="auth-left h-100">
              <div className="brand"><i className="fa-solid fa-plane-departure"></i> TourDuLich</div>
              <div className="slogan">Tạo tài khoản để đặt tour, nhận ưu đãi và quản lý đơn đặt tour.</div>
            </div>
          </div>
          <div className="col-md-7">
            <div className="auth-right">
              <ul className="nav nav-pills seg-tabs mb-3">
                <li className="nav-item"><Link className="nav-link" to="/auth/login">Đăng nhập</Link></li>
                <li className="nav-item"><button className="nav-link active" type="button">Đăng ký</button></li>
              </ul>
              <FormError message={error.message} errors={error.errors} />
              <form onSubmit={submit} noValidate>
                <div className="mb-3"><label className="form-label">Họ tên</label><input className="form-control" name="hoten" value={form.hoten} onChange={update} placeholder="VD: Nguyễn Văn A" /></div>
                <div className="mb-3"><label className="form-label">Email hoặc Số điện thoại</label><input className="form-control" name="contact" value={form.contact} onChange={update} placeholder="VD: ten@gmail.com hoặc 0123456789" /></div>
                <div className="mb-3"><label className="form-label">Địa chỉ</label><input className="form-control" name="diachi" value={form.diachi} onChange={update} placeholder="VD: 123 Lê Lợi, Q1, TP.HCM" /></div>
                <div className="mb-3"><label className="form-label">Ngày sinh</label><input type="date" className="form-control" name="ngaysinh" value={form.ngaysinh} onChange={update} max={MAX_DOB} /></div>
                <div className="mb-3">
                  <label className="form-label d-block">Giới tính</label>
                  {['Nam', 'Nữ'].map((item) => (
                    <div className="form-check form-check-inline" key={item}>
                      <input className="form-check-input" type="radio" name="gioitinh" value={item} checked={form.gioitinh === item} onChange={update} />
                      <label className="form-check-label">{item}</label>
                    </div>
                  ))}
                </div>
                <div className="mb-2"><label className="form-label">Mật khẩu</label><PasswordInput id="register_password" name="password" value={form.password} onChange={update} placeholder="Ít nhất 8 ký tự, đủ hoa/thường/số/ký tự đặc biệt" /><div className="hint mt-1">Gợi ý: Abc@1234</div></div>
                <div className="mb-2"><label className="form-label">Nhập lại mật khẩu</label><PasswordInput id="confirm_register_password" name="confirm_password" value={form.confirm_password} onChange={update} /></div>
                <button className="btn btn-success w-100 btn-pill mt-3" disabled={submitting}>{submitting ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthShell>
  )
}
