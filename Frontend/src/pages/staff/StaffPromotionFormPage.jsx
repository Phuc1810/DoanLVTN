import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { staffPromotionApi } from '../../api/staffPromotionApi'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import { extractItem, imageSrc, makeMultipart, normalizeError, validateImage } from './staffPageUtils'

const EMPTY = { TenKM: '', NoiDung: '', PhanTramGiam: '', NgayBatDau: '', NgayKetThuc: '', TrangThai: 'Hoạt động' }

export default function StaffPromotionFormPage({ mode }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    staffPromotionApi.show(id)
      .then((payload) => {
        const item = extractItem(payload)
        setForm({ ...EMPTY, ...item })
        setPreview(imageSrc(item?.AnhDaiDien))
      })
      .catch((err) => setError(normalizeError(err)))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function chooseFile(event) {
    const selected = event.target.files?.[0] || null
    const validation = validateImage(selected)
    if (validation) return setError({ message: validation })
    setFile(selected)
    if (selected) setPreview(URL.createObjectURL(selected))
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = makeMultipart({ ...form, ...(isEdit ? { _method: 'PUT' } : {}) }, [['AnhDaiDien', file]])
      if (isEdit) await staffPromotionApi.update(id, payload)
      else await staffPromotionApi.create(payload)
      navigate(isEdit ? `/staff/promotions/${id}` : '/staff/promotions')
    } catch (err) {
      setError(normalizeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  return (
    <>
      <div className="page-header"><h1 className="page-title">{isEdit ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}</h1><Link className="staff-link-btn secondary" to="/staff/promotions">Quay lại</Link></div>
      <form className="staff-form-card" onSubmit={submit}>
        <FormError message={error?.message} errors={error?.errors} />
        <div className="staff-form-grid">
          <div className="staff-field"><label>TenKM</label><input name="TenKM" value={form.TenKM || ''} onChange={updateField} required /></div>
          <div className="staff-field"><label>PhanTramGiam</label><input name="PhanTramGiam" type="number" value={form.PhanTramGiam || ''} onChange={updateField} /></div>
          <div className="staff-field"><label>NgayBatDau</label><input name="NgayBatDau" type="date" value={form.NgayBatDau || ''} onChange={updateField} /></div>
          <div className="staff-field"><label>NgayKetThuc</label><input name="NgayKetThuc" type="date" value={form.NgayKetThuc || ''} onChange={updateField} /></div>
          <div className="staff-field"><label>TrangThai</label><select name="TrangThai" value={form.TrangThai || ''} onChange={updateField}><option>Hoạt động</option><option>Tạm ngưng</option></select></div>
          <div className="staff-field"><label>AnhDaiDien</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} /></div>
          <div className="staff-field full"><label>NoiDung</label><textarea name="NoiDung" value={form.NoiDung || ''} onChange={updateField} /></div>
          {preview && <div className="staff-field full"><img className="staff-image-preview" src={preview} alt="Preview" /></div>}
        </div>
        <div className="staff-actions-row"><button className="staff-action-btn primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu khuyến mãi'}</button></div>
      </form>
    </>
  )
}
