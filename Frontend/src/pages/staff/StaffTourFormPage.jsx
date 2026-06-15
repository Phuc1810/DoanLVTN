import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { staffTourApi } from '../../api/staffTourApi'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import { extractItem, imageSrc, makeMultipart, normalizeError, validateImage } from './staffPageUtils'

const EMPTY_TOUR = {
  TenTour: '', DiaDiem: '', GiaGoc: '', GiaGiam: '', ThoiLuong: '', NgayKhoiHanh: '', NgayKetThuc: '',
  SoCho: '', Mien: '', LoaiTour: '', PhanTramGiam: '', TrangThai: 'Hoạt động',
}

function scheduleRowsFrom(tour) {
  const rows = tour?.lich_trinh_tour || tour?.lichtrinhtour || tour?.lich_trinh || []
  if (!Array.isArray(rows) || rows.length === 0) return [{ NgayThu: 1, TieuDe: '', NoiDung: '' }]
  return rows.map((row) => ({ NgayThu: row.NgayThu || '', TieuDe: row.TieuDe || '', NoiDung: row.NoiDung || '' }))
}

export default function StaffTourFormPage({ mode }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_TOUR)
  const [schedules, setSchedules] = useState([{ NgayThu: 1, TieuDe: '', NoiDung: '' }])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    staffTourApi.show(id)
      .then((payload) => {
        const tour = extractItem(payload)
        setForm({ ...EMPTY_TOUR, ...tour })
        setSchedules(scheduleRowsFrom(tour))
        setPreview(imageSrc(tour?.AnhChinh || tour?.DuongDan))
      })
      .catch((err) => setError(normalizeError(err)))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const computedPrice = useMemo(() => {
    const original = Number(form.GiaGoc || 0)
    const percent = Number(form.PhanTramGiam || 0)
    if (!original || !percent) return form.GiaGiam
    return Math.round(original * (100 - percent) / 100)
  }, [form.GiaGoc, form.GiaGiam, form.PhanTramGiam])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => {
      const next = { ...current, [name]: value }
      const original = Number(next.GiaGoc || 0)
      const percent = Number(next.PhanTramGiam || 0)
      return { ...next, GiaGiam: original && percent ? Math.round(original * (100 - percent) / 100) : next.GiaGiam }
    })
  }

  function updateSchedule(index, field, value) {
    setSchedules((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row))
  }

  function chooseFile(event) {
    const selected = event.target.files?.[0] || null
    const validation = validateImage(selected)
    if (validation) {
      setError({ message: validation })
      return
    }
    setFile(selected)
    if (selected) setPreview(URL.createObjectURL(selected))
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload = makeMultipart({ ...form, GiaGiam: computedPrice, lich_trinh: schedules, ...(isEdit ? { _method: 'PUT' } : {}) }, [['AnhChinh', file]])
      if (isEdit) await staffTourApi.update(id, payload)
      else await staffTourApi.create(payload)
      navigate('/staff/tours')
    } catch (err) {
      setError(normalizeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Sửa tour' : 'Thêm tour'}</h1>
        <Link className="staff-link-btn secondary" to="/staff/tours">Quay lại</Link>
      </div>
      <form className="staff-form-card" onSubmit={submit}>
        <FormError message={error?.message} errors={error?.errors} />
        <div className="staff-form-grid">
          {['TenTour', 'DiaDiem', 'ThoiLuong', 'GiaGoc', 'PhanTramGiam', 'GiaGiam', 'SoCho', 'Mien', 'LoaiTour', 'TrangThai', 'NgayKhoiHanh', 'NgayKetThuc'].map((field) => (
            <div className="staff-field" key={field}>
              <label htmlFor={field}>{field}</label>
              <input id={field} name={field} type={field.includes('Ngay') ? 'date' : 'text'} value={field === 'GiaGiam' ? computedPrice : (form[field] || '')} onChange={updateField} readOnly={field === 'GiaGiam'} />
            </div>
          ))}
          <div className="staff-field full">
            <label htmlFor="AnhChinh">Ảnh chính</label>
            <input id="AnhChinh" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} />
            {preview && <img className="staff-image-preview mt-3" src={preview} alt="Preview" />}
          </div>
          <div className="staff-field full">
            <label>Lịch trình</label>
            {schedules.map((row, index) => (
              <div className="row g-2 mb-2" key={`${index}-${row.NgayThu}`}>
                <div className="col-md-2"><input value={row.NgayThu} onChange={(event) => updateSchedule(index, 'NgayThu', event.target.value)} placeholder="Ngày" /></div>
                <div className="col-md-4"><input value={row.TieuDe} onChange={(event) => updateSchedule(index, 'TieuDe', event.target.value)} placeholder="Tiêu đề" /></div>
                <div className="col-md-6"><input value={row.NoiDung} onChange={(event) => updateSchedule(index, 'NoiDung', event.target.value)} placeholder="Nội dung" /></div>
              </div>
            ))}
            <button type="button" className="staff-action-btn secondary" onClick={() => setSchedules((current) => [...current, { NgayThu: current.length + 1, TieuDe: '', NoiDung: '' }])}>+ Thêm dòng</button>
          </div>
        </div>
        <div className="staff-actions-row"><button className="staff-action-btn primary" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu tour'}</button></div>
      </form>
    </>
  )
}
