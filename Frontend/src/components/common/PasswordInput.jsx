import { useState } from 'react'

export default function PasswordInput({ id, name, value, onChange, placeholder, className = '', invalid = false }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={`password-wrapper ${invalid ? 'is-invalid' : ''}`}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={`auth-input ${className} ${invalid ? 'is-invalid' : ''}`}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {invalid && <i className="fa-solid fa-circle-exclamation auth-error-icon"></i>}
      <button
        className="btn-eye"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label="Hiện/ẩn mật khẩu"
      >
        <i className={`fa-regular ${visible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
      </button>
    </div>
  )
}
