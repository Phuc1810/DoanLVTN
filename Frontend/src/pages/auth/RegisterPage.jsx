import { Link, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../../api/authApi'
import PasswordInput from '../../components/common/PasswordInput'

const MAX_DOB = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10)

function validate(form) {
  const errors = {}
  if (!form.hoten.trim()) errors.hoten = ['Vui lòng nhập họ tên.']
  else if (form.hoten.trim().split(/\s+/).filter(Boolean).length < 2) errors.hoten = ['Họ tên phải có ít nhất 2 từ.']
  if (!form.contact) errors.contact = ['Vui lòng nhập Email hoặc SĐT.']
  else if (!/^\d{10}$/.test(form.contact) && !/^[^\s@]+@gmail\.com$/i.test(form.contact)) errors.contact = ['Email phải là @gmail.com hoặc SĐT 10 số.']
  if (!form.diachi) errors.diachi = ['Vui lòng nhập địa chỉ.']
  if (!form.ngaysinh) errors.ngaysinh = ['Vui lòng chọn ngày sinh.']
  if (!form.gioitinh) errors.gioitinh = ['Vui lòng chọn giới tính.']
  if (!form.password) errors.password = ['Vui lòng nhập mật khẩu.']
  else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(form.password)) errors.password = ['Mật khẩu phải >= 8 ký tự, có hoa/thường/số/ký tự đặc biệt.']
  if (!form.confirm_password) errors.confirm_password = ['Vui lòng nhập lại mật khẩu.']
  else if (form.confirm_password !== form.password) errors.confirm_password = ['Nhập lại mật khẩu chưa khớp.']
  return errors
}

function FieldWrapper({ label, name, error, children }) {
  const hasError = error?.errors?.[name]
  return (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      {children}
      {hasError && <div className="field-error">{hasError[0]}</div>}
    </div>
  )
}

function InputField({ label, name, type = 'text', value, onChange, placeholder, error, max }) {
  const hasError = error?.errors?.[name]
  return (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <div className="auth-input-wrapper">
        <input
          type={type}
          className={`auth-input ${hasError ? 'is-invalid' : ''}`}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          max={max}
        />
        {hasError && <i className="fa-solid fa-circle-exclamation auth-error-icon"></i>}
      </div>
      {hasError && <div className="field-error">{hasError[0]}</div>}
    </div>
  )
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const redirectParam = searchParams.get('redirect') ? `&redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''
  
  const [form, setForm] = useState({ hoten: '', contact: '', diachi: '', ngaysinh: '', gioitinh: '', password: '', confirm_password: '' })
  const [error, setError] = useState({ message: '', errors: {} })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    const clientErrors = validate(form)
    if (Object.keys(clientErrors).length) {
      setError({ message: '', errors: clientErrors })
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
      setSuccess(true)
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* === KHUNG TRÁI === */}
        <div className="auth-left">
          <div className="brand">
            <i className="fa-solid fa-plane-departure"></i> TourDuLich
          </div>
          <div className="slogan">
            Tạo tài khoản để đặt tour, nhận ưu đãi và quản lý đơn đặt tour.
          </div>
          <div className="auth-bullets">
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Đặt tour &amp; quản lý đơn</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Nhận khuyến mãi theo tài khoản</span></div>
            <div className="bullet"><i className="fa-solid fa-check"></i><span>Đăng nhập Google 1 chạm</span></div>
          </div>
        </div>

        {/* === KHUNG PHẢI === */}
        <div className="auth-right">
          <ul className="seg-tabs">
            <li className="seg-tab-item">
              <Link className="seg-tab-link" to={`/auth/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(searchParams.get('redirect'))}` : ''}`}>Đăng nhập</Link>
            </li>
            <li className="seg-tab-item">
              <button className="seg-tab-link active" type="button">Đăng ký</button>
            </li>
          </ul>

          {error.message && <div className="auth-alert-error">{error.message}</div>}

          {success ? (
            <div className="auth-success text-center py-4">
              <div className="auth-success-icon">
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 className="fw-bold mb-2">Đăng ký thành công!</h3>
              <p className="text-muted mb-4">Tài khoản của bạn đã được tạo thành công. Bạn có thể đăng nhập ngay bây giờ.</p>
              <Link to={`/auth/login?prefill=${encodeURIComponent(form.contact)}${redirectParam}`} className="auth-submit-btn text-center text-decoration-none" style={{ background: '#1a5cb0', display: 'block' }}>
                Quay về trang đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <InputField label="Họ tên" name="hoten" value={form.hoten} onChange={update} placeholder="VD: Nguyễn Văn A" error={error} />
              <InputField label="Email hoặc Số điện thoại" name="contact" value={form.contact} onChange={update} placeholder="VD: ten@gmail.com hoặc 0123456789" error={error} />
              <InputField label="Địa chỉ" name="diachi" value={form.diachi} onChange={update} placeholder="VD: 123 Lê Lợi, Q1, TP.HCM" error={error} />
              <InputField label="Ngày sinh" name="ngaysinh" type="date" value={form.ngaysinh} onChange={update} error={error} max={MAX_DOB} />

              <FieldWrapper label="Giới tính" name="gioitinh" error={error}>
                <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                  {['Nam', 'Nữ'].map((item) => (
                    <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" name="gioitinh" value={item} checked={form.gioitinh === item} onChange={update} />
                      {item}
                    </label>
                  ))}
                </div>
              </FieldWrapper>

              <div className="auth-field">
                <label className="auth-label">Mật khẩu</label>
                <PasswordInput id="register_password" name="password" value={form.password} onChange={update} placeholder="Ít nhất 8 ký tự, đủ hoa/thường/số/ký tự đặc biệt" invalid={!!error.errors?.password} />
                {error.errors?.password && <div className="field-error">{error.errors.password[0]}</div>}
                <div className="hint" style={{ marginTop: '4px' }}>Gợi ý: Abc@1234</div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Nhập lại mật khẩu</label>
                <PasswordInput id="confirm_register_password" name="confirm_password" value={form.confirm_password} onChange={update} placeholder="Nhập lại mật khẩu" invalid={!!error.errors?.confirm_password} />
                {error.errors?.confirm_password && <div className="field-error">{error.errors.confirm_password[0]}</div>}
              </div>

              <button className="auth-submit-btn" style={{ background: '#198754' }} type="submit" disabled={submitting}>
                {submitting ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
