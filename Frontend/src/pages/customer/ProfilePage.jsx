import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import FormError from '../../components/common/FormError'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import { useAuth } from '../../auth/useAuth'

const MAX_DOB = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10)

function profileFromMe(payload) {
  const data = payload?.data || payload || {}
  return data.khach_hang || data.khachHang || data.customer || data.user?.khach_hang || data.user || data
}

function profileFromUpdate(payload) {
  const data = payload?.data || payload || {}
  return data.khach_hang || data.khachHang || data.customer || data
}

function buildInitialForm(profile = {}) {
  return {
    HoTen: profile.HoTen || '',
    Email: profile.Email || '',
    SoDienThoai: profile.SoDienThoai || '',
    DiaChi: profile.DiaChi || '',
    NgaySinh: profile.NgaySinh || '',
    GioiTinh: profile.GioiTinh || '',
  }
}

export default function ProfilePage() {
  const { refreshMe } = useAuth()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(buildInitialForm())
  const [error, setError] = useState({ message: '', errors: {} })
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    authApi.me()
      .then((payload) => {
        const nextProfile = profileFromMe(payload)
        setProfile(nextProfile)
        setForm(buildInitialForm(nextProfile))
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const hasChanges = useMemo(() => {
    const current = buildInitialForm(profile || {})
    return ['HoTen', 'Email', 'SoDienThoai', 'DiaChi', 'NgaySinh', 'GioiTinh']
      .some((key) => String(form[key] || '') !== String(current[key] || ''))
  }, [form, profile])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setSuccess(false)
  }

  function submit(event) {
    event.preventDefault()
    setError({ message: '', errors: {} })
    setSuccess(false)

    if (!hasChanges) {
      setSuccess(true)
      return
    }

    setShowConfirm(true)
  }

  async function executeSubmit() {
    setShowConfirm(false)
    setSubmitting(true)
    try {
      const payload = {
        HoTen: form.HoTen.trim(),
        Email: form.Email.trim(),
        SoDienThoai: form.SoDienThoai.trim(),
        DiaChi: form.DiaChi.trim(),
        NgaySinh: form.NgaySinh,
        GioiTinh: form.GioiTinh,
      }

      const response = await authApi.updateProfile(payload)
      const nextProfile = profileFromUpdate(response)
      setProfile(nextProfile)
      setForm(buildInitialForm(nextProfile))
      setSuccess(true)
      await refreshMe()
    } catch (err) {
      setError({ message: err.message, errors: err.errors || {} })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  if (loadError) return <ErrorState message={loadError} />

  return (
    <div className="container wrap profile-page" style={{ maxWidth: '1000px', paddingTop: '145px', paddingBottom: '22px' }}>
      <div className="cardx profile-card p-4">
        <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start profile-header">
          <div>
            <div className="title profile-title">
              <i className="fa-regular fa-id-card me-2"></i>
              Thông tin cá nhân
            </div>
          </div>
          <Link className="btn btn-outline-secondary profile-home-btn" to="/">
            <i className="fa-solid fa-house me-1"></i> Trang chủ
          </Link>
        </div>



        <div className="mt-3">
          <FormError message={error.message} errors={error.errors} />
        </div>

        <form method="POST" className="mt-3" noValidate onSubmit={submit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Họ tên</label>
              <input
                className={`form-control profile-input ${error.errors?.HoTen ? 'is-invalid' : ''}`}
                name="HoTen"
                value={form.HoTen}
                onChange={updateField}
                placeholder="Nhập họ tên"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Email</label>
              <input
                className={`form-control profile-input ${error.errors?.Email ? 'is-invalid' : ''}`}
                name="Email"
                value={form.Email}
                onChange={updateField}
                placeholder="vd: abc@gmail.com"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Số điện thoại</label>
              <input
                className={`form-control profile-input ${error.errors?.SoDienThoai ? 'is-invalid' : ''}`}
                name="SoDienThoai"
                value={form.SoDienThoai}
                onChange={updateField}
                placeholder="vd: 0xxxxxxxxx"
                inputMode="numeric"
                maxLength={10}
              />
              <div className="form-text profile-help">Nếu bạn nhập/đổi SĐT thì phải đủ 10 số.</div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Giới tính</label>
              <select
                className={`form-select profile-input ${error.errors?.GioiTinh ? 'is-invalid' : ''}`}
                name="GioiTinh"
                value={form.GioiTinh}
                onChange={updateField}
              >
                <option value="">-- Chọn --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Ngày sinh</label>
              <input
                className={`form-control profile-input ${error.errors?.NgaySinh ? 'is-invalid' : ''}`}
                type="date"
                name="NgaySinh"
                max={MAX_DOB}
                value={form.NgaySinh}
                onChange={updateField}
              />
              <div className="form-text profile-help">Nếu bạn chọn/đổi ngày sinh thì không được là hôm nay hoặc tương lai.</div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Địa chỉ</label>
              <input
                className={`form-control profile-input ${error.errors?.DiaChi ? 'is-invalid' : ''}`}
                name="DiaChi"
                value={form.DiaChi}
                onChange={updateField}
                placeholder="Nhập địa chỉ"
              />
            </div>

            <div className="col-12 d-flex justify-content-end profile-actions">
              <button className="btn btn-primary btn-lg px-4 profile-save-btn" type="submit" disabled={submitting}>
                <i className="fa-solid fa-floppy-disk me-2"></i>
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </form>

        <div className="divider"></div>
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="cardx p-4 text-center mx-3" style={{ minWidth: '320px', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 14px 40px rgba(16,24,40,.10)' }}>
            <i className="fa-regular fa-circle-question text-primary mb-3" style={{ fontSize: '3rem' }}></i>
            <h5 className="mb-4">Bạn có muốn sửa thông tin không?</h5>
            <div className="d-flex gap-2 justify-content-center">
              <button type="button" className="btn btn-outline-secondary px-4" onClick={() => {
                setShowConfirm(false)
                setForm(buildInitialForm(profile || {}))
              }}>Không</button>
              <button type="button" className="btn btn-primary px-4" onClick={executeSubmit} disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Có'}
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div style={{ position: 'fixed', top: '90px', right: '20px', zIndex: 9999, transition: 'all 0.3s ease' }}>
          <div className="cardx p-3 d-flex align-items-center gap-3" style={{ minWidth: '280px', backgroundColor: '#fff', borderLeft: '5px solid #198754', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <i className="fa-solid fa-circle-check text-success" style={{ fontSize: '1.8rem' }}></i>
            <div className="text-start">
              <h6 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>Thành công</h6>
              <small className="text-muted">Cập nhật thông tin thành công!</small>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
