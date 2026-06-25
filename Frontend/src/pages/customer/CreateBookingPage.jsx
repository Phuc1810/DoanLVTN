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

const MAX_DOB = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10)

function validateBooking(form) {
  const errors = {}
  const adults = Number(form.SoLuongNguoiLon)
  const children = Number(form.SoLuongTreEm)
  const infants = Number(form.SoLuongTreNho)

  if (!Number.isInteger(adults) || adults < 1) errors.SoLuongNguoiLon = ['Phải có ít nhất 1 người lớn.']
  if (!Number.isInteger(children) || children < 0) errors.SoLuongTreEm = ['Số trẻ em không hợp lệ.']
  if (!Number.isInteger(infants) || infants < 0) errors.SoLuongTreNho = ['Số trẻ nhỏ không hợp lệ.']
  else if (infants > adults * 2) errors.SoLuongTreNho = [`Trẻ nhỏ tối đa là ${adults * 2}.`]

  if (!form.HoTen.trim()) errors.HoTen = ['Vui lòng nhập Họ tên.']
  if (!form.Email.trim()) errors.Email = ['Vui lòng nhập Email.']
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email)) errors.Email = ['Email không hợp lệ.']
  if (!form.SoDienThoai.trim()) errors.SoDienThoai = ['Vui lòng nhập Số điện thoại.']
  else if (!/^0\d{9}$/.test(form.SoDienThoai)) errors.SoDienThoai = ['Số điện thoại phải đủ 10 số và bắt đầu bằng 0.']
  if (!form.DiaChi.trim()) errors.DiaChi = ['Vui lòng nhập Địa chỉ.']
  if (!form.NgaySinh) errors.NgaySinh = ['Vui lòng chọn Ngày sinh.']
  else if (form.NgaySinh > MAX_DOB) errors.NgaySinh = ['Ngày sinh phải nhỏ hơn ngày hiện tại.']
  if (!['Nam', 'Nữ', 'Khác'].includes(form.GioiTinh)) errors.GioiTinh = ['Vui lòng chọn Giới tính.']

  return errors
}

function FieldError({ errors, name }) {
  return errors?.[name]?.[0] ? <div className="field-error">{errors[name][0]}</div> : null
}

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

  function adjustQuantity(name, delta, minimum) {
    setForm((current) => {
      const next = { ...current, [name]: Math.max(minimum, Number(current[name]) + delta) }
      const adults = Math.max(1, Number(next.SoLuongNguoiLon))
      next.SoLuongNguoiLon = adults
      next.SoLuongTreNho = Math.min(Number(next.SoLuongTreNho), adults * 2)
      return next
    })
  }

  async function submit(event) {
    event.preventDefault()
    setError({ message: '', errors: {} })

    const clientErrors = validateBooking(form)
    if (Object.keys(clientErrors).length > 0) {
      setError({ message: 'Vui lòng kiểm tra lại thông tin đặt tour.', errors: clientErrors })
      return
    }

    setSubmitting(true)
    try {
      const payload = await bookingApi.createBooking({ ...form, MaTour: Number(tourId) })
      const orderId = payload?.MaDon || payload?.order?.MaDon || payload?.booking?.MaDon || payload?.id
      if (!orderId) throw new Error('Không nhận được mã đơn đặt tour từ hệ thống.')
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
    <div className="container page-wrap booking-page">
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card p-4 mb-4">
            <div className="tour-hero d-flex gap-3 align-items-center">
              <img className="tour-thumb" src={buildImageUrl(tour.image_url || tour.AnhChinh)} alt="" />
              <div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <h4 className="mb-0 fw-bold">{tour.TenTour}</h4>
                  <span className="badge badge-soft">{tour.DiaDiem}</span>
                  <span className="badge text-bg-light">{tour.ThoiLuong}</span>
                </div>
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
                  <div className="qty">
                    <button className="btn btn-outline-secondary" type="button" aria-label={`Giảm ${label}`} onClick={() => adjustQuantity(name, -1, min)}>-</button>
                    <input className={`form-control ${error.errors?.[name] ? 'is-invalid' : ''}`} type="number" min={min} name={name} value={form[name]} onChange={update} />
                    <button className="btn btn-outline-secondary" type="button" aria-label={`Tăng ${label}`} onClick={() => adjustQuantity(name, 1, min)}>+</button>
                  </div>
                  <FieldError errors={error.errors} name={name} />
                  {name === 'SoLuongNguoiLon' && <div className="hint mt-1">Bắt buộc &gt;= 1</div>}
                  {name === 'SoLuongTreEm' && <div className="hint mt-1">Tính 70% giá gốc</div>}
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
                  <input
                    className={`form-control ${error.errors?.[name] ? 'is-invalid' : ''}`}
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={update}
                    max={name === 'NgaySinh' ? MAX_DOB : undefined}
                    inputMode={name === 'SoDienThoai' ? 'numeric' : undefined}
                    maxLength={name === 'SoDienThoai' ? 10 : undefined}
                  />
                  <FieldError errors={error.errors} name={name} />
                  {name === 'NgaySinh' && <div className="hint mt-1">Không được chọn hôm nay hoặc tương lai</div>}
                </div>
              ))}
              <div className="col-md-6">
                <label className="form-label">Giới tính</label>
                <select className={`form-select ${error.errors?.GioiTinh ? 'is-invalid' : ''}`} name="GioiTinh" value={form.GioiTinh} onChange={update}>
                  <option value="">-- Chọn --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
                <FieldError errors={error.errors} name="GioiTinh" />
              </div>
            </div>
            <div className="divider"></div>
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
              <div className="hint">Tổng tiền tại đây là ước tính theo giá gốc. Khuyến mãi tốt nhất sẽ được áp dụng ở bước thanh toán.</div>
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
            <div className="mt-3 alert alert-warning mb-0 small">Đây là tổng ước tính theo giá gốc. Qua bước thanh toán sẽ áp dụng khuyến mãi tốt nhất (nếu có).</div>
          </div>
        </div>
      </div>
    </div>
  )
}
