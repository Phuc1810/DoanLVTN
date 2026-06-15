import { useState } from 'react'

export default function PasswordInput({ id, name, value, onChange, placeholder, className = '' }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="input-group">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={`form-control ${className}`}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <button
        className="btn btn-outline-secondary btn-pass"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label="Hiện/ẩn mật khẩu"
      >
        <i className={`fa-regular ${visible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
      </button>
    </div>
  )
}
