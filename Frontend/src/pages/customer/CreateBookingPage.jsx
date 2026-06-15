import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { bookingApi } from '../../api/bookingApi'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl } from '../../utils/imageUrl'

export default function CreateBookingPage() {
  const { tourId } = useParams()
  const navigate = useNavigate()
  const [tour, setTour] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState({ message: '', errors: {} })
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    SoLuongNguoiLon: 1,
    SoLuongTreEm: 0,
    SoLuongTreNho: 0,
    HoTen: '',
    Email: '',
    SoDienThoai: '',
    DiaChi: '',
    NgaySinh: '',
    GioiTinh: '',
  })

  useEffect(() => {
    Promise.all([tourApi.detail(tourId), authApi.me()])
      .then(([tourPayload, mePayload]) => {
        const me = mePayload?.data?.khach_hang || mePayload?.data?.user || mePayload?.data || mePayload || {}
        setTour(tourPayload)
        setForm((current) => ({
          ...current,
          HoTen: me.HoTen || current.HoTen,
          Email: me.Email || current.Email,
          SoDienThoai: me.SoDienThoai || current.SoDienThoai,
          DiaChi: me.DiaChi || current.DiaChi,
          NgaySinh: me.NgaySinh || current.NgaySinh,
          GioiTinh: me.GioiTinh || current.GioiTinh,
        }))
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [tourId])

  const prices = useMemo(() => {
    const base = Number(tour?.GiaGoc || 0)
    const child = Math.round(base * 0.7)
    const total = Number(form.SoLuongNguoiLon) * base + Number(form.SoLuongTreEm) * child
    return { adult: base, child, infant: 0, total }
  }, [tour, form.SoLuongNguoiLon, form.SoLuongTreEm])

  function update(event) {
    const { name, value } = event.target
    setForm((current) => {
      const next = { ...current, [name]: value }
      const adult = Math.max(1, Number(next.SoLuongNguoiLon || 1))
      next.SoLuongNguoiLon = adult
      next.SoLuongTreEm = Math.max(0, Number(next.SoLuongTreEm || 0))
      next.SoLuongTreNho = Math.min(Math.max(0, Number(next.SoLuongTreNho || 0)), adult * 2)
      return next
    })
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError({ message: '', errors: {} })
    try {
      const payload = await bookingApi.createBooking({ ...form, MaTour: Number(tourId) })
      const orderId = payload?.MaDon || payload?.order?.MaDon || payload?.booking?.MaDon || payload?.id
      navigate(`/payments/${orderId}`)
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />
  if (loadError) return <ErrorState message={loadError} />

  return (
    <div className="container page-wrap">
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card p-4 mb-4">
            <div className="tour-hero d-flex gap-3 align-items-center">
              <img className="tour-thumb" src={buildImageUrl(tour.image_url || tour.AnhChinh)} alt="" />
              <div>
                <h4 className="mb-0 fw-bold">{tour.TenTour}</h4>
                <div className="hint mt-1">
                  <i className="fa-regular fa-calendar-days me-1"></i>Khởi hành: {formatDate(tour.NgayKhoiHanh)} • Giá gốc: <strong>{formatCurrency(tour.GiaGoc)}</strong>
                </div>
                <div className="hint mt-2">Trẻ em: <strong>70%</strong> giá vé • Trẻ nhỏ: <strong className="text-success">Miễn phí</strong></div>
              </div>
            </div>
          </div>

          <FormError message={error.message} errors={error.errors} />
          <form onSubmit={submit} className="card p-4" noValidate>
            <h5 className="fw-bold mb-3"><i className="fa-solid fa-users me-2"></i>Số lượng tham gia</h5>
            <div className="row g-3">
              {[
                ['SoLuongNguoiLon', 'Người lớn', 1],
                ['SoLuongTreEm', 'Trẻ em', 0],
                ['SoLuongTreNho', 'Trẻ nhỏ', 0],
              ].map(([name, label, min]) => (
                <div className="col-md-4" key={name}>
                  <label className="form-label fw-semibold">{label}</label>
                  <input className="form-control" type="number" min={min} name={name} value={form[name]} onChange={update} />
                  {name === 'SoLuongTreNho' && <div className="hint mt-1">Tối đa: {Number(form.SoLuongNguoiLon) * 2}</div>}
                </div>
              ))}
            </div>
            <div className="divider"></div>
            <h5 className="fw-bold mb-3"><i className="fa-regular fa-id-card me-2"></i>Thông tin khách hàng</h5>
            <div className="row g-3">
              {[
                ['HoTen', 'Họ tên', 'text'],
                ['Email', 'Email', 'email'],
                ['SoDienThoai', 'Số điện thoại', 'text'],
                ['DiaChi', 'Địa chỉ', 'text'],
                ['NgaySinh', 'Ngày sinh', 'date'],
              ].map(([name, label, type]) => (
                <div className="col-md-6" key={name}>
                  <label className="form-label">{label}</label>
                  <input className="form-control" type={type} name={name} value={form[name]} onChange={update} />
                </div>
              ))}
              <div className="col-md-6">
                <label className="form-label">Giới tính</label>
                <select className="form-select" name="GioiTinh" value={form.GioiTinh} onChange={update}>
                  <option value="">-- Chọn --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div className="divider"></div>
            <div className="d-flex justify-content-end">
              <button className="btn btn-primary btn-lg px-4" disabled={submitting}><i className="fa-solid fa-check me-2"></i> Đặt tour</button>
            </div>
          </form>
        </div>
        <div className="col-lg-4">
          <div className="card p-4 summary">
            <h5 className="fw-bold mb-2">Tóm tắt chi phí</h5>
            <div className="hint mb-3">Ước tính theo giá gốc, backend sẽ tính lại khi tạo đơn.</div>
            <div className="d-flex justify-content-between"><span>Người lớn</span><strong>{formatCurrency(Number(form.SoLuongNguoiLon) * prices.adult)}</strong></div>
            <div className="d-flex justify-content-between"><span>Trẻ em</span><strong>{formatCurrency(Number(form.SoLuongTreEm) * prices.child)}</strong></div>
            <div className="d-flex justify-content-between"><span>Trẻ nhỏ</span><strong>{formatCurrency(0)}</strong></div>
            <div className="divider"></div>
            <div className="d-flex justify-content-between align-items-end"><span className="fw-semibold">Tổng</span><div className="total">{formatCurrency(prices.total)}</div></div>
          </div>
        </div>
      </div>
    </div>
  )
}
