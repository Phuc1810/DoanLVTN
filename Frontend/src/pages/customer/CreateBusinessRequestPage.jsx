import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { businessRequestApi } from '../../api/businessRequestApi'
import { tourApi } from '../../api/tourApi'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import { buildImageUrl } from '../../utils/imageUrl'

const TODAY = new Date().toISOString().slice(0, 10)

export default function CreateBusinessRequestPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tourId = searchParams.get('tour')
  const [tour, setTour] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState({ message: '', errors: {} })
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    TenCongTy: '',
    NguoiLienHe: '',
    SDT: '',
    SoNguoi: '',
    ThoiGianKhoiHanh: '',
  })

  useEffect(() => {
    if (!tourId) {
      navigate('/business-tours', { replace: true })
      return
    }

    Promise.all([tourApi.detail(tourId), authApi.me()])
      .then(([tourPayload, mePayload]) => {
        if (tourPayload?.LoaiTour !== 'Doanh nghiệp') {
          navigate('/business-tours', { replace: true })
          return
        }

        setTour(tourPayload)

        const me = mePayload?.data?.khach_hang || mePayload?.data?.user || mePayload?.data || mePayload || {}
        setForm((current) => ({
          ...current,
          NguoiLienHe: me.HoTen || current.NguoiLienHe,
          SDT: me.SoDienThoai || current.SDT,
        }))
      })
      .catch(() => navigate('/business-tours', { replace: true }))
      .finally(() => setLoading(false))
  }, [navigate, tourId])

  const tourMeta = useMemo(() => {
    if (!tour) return ''
    return [tour.DiaDiem, tour.ThoiLuong].filter(Boolean).join(' • ')
  }, [tour])

  function update(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setSuccess('')
  }

  async function submit(event) {
    event.preventDefault()
    setError({ message: '', errors: {} })
    setSuccess('')
    setSubmitting(true)

    try {
      const payload = await businessRequestApi.createBusinessRequest({
        MaTour: Number(tourId),
        TenCongTy: form.TenCongTy.trim(),
        NguoiLienHe: form.NguoiLienHe.trim(),
        SDT: form.SDT.trim(),
        SoNguoi: Number(form.SoNguoi),
        ThoiGianKhoiHanh: form.ThoiGianKhoiHanh,
      })

      const id = payload?.MaYC || payload?.id
      setSuccess(`Gửi yêu cầu thành công${id ? `! Mã yêu cầu: #${id}` : '!'}`)
      if (id) {
        navigate(`/business-requests/${id}`)
      }
    } catch (err) {
      setError({ message: err.message, errors: err.errors || {} })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5">
        <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start">
          <div>
            <div className="title"><i className="fa-solid fa-paper-plane me-2"></i>Gửi yêu cầu tour doanh nghiệp</div>
            <div className="muted mt-1">Tối thiểu <b>20 người</b>. Nhân viên sẽ liên hệ để xác nhận.</div>
          </div>
          <Link className="btn btn-outline-secondary" to="/business-tours">
            <i className="fa-solid fa-arrow-left me-1"></i> Quay lại danh sách
          </Link>
        </div>

        {tour && (
          <div className="business-tour-mini mt-3">
            {tour.image_url || tour.AnhChinh ? (
              <img src={buildImageUrl(tour.image_url || tour.AnhChinh)} alt={tour.TenTour || ''} />
            ) : (
              <div className="business-tour-mini-placeholder"></div>
            )}

            <div className="flex-grow-1">
              <div className="business-tour-mini-name">{tour.TenTour}</div>
              <div className="business-tour-mini-meta">
                <i className="fa-solid fa-location-dot"></i>{tourMeta}
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success mt-3 mb-0">
            <div className="fw-bold"><i className="fa-solid fa-circle-check me-2"></i>{success}</div>
          </div>
        )}

        <div className="mt-3">
          <FormError message={error.message} errors={error.errors} />
        </div>

        <form onSubmit={submit} className="mt-3" noValidate>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Tên công ty</label>
              <input className={`form-control ${error.errors?.TenCongTy ? 'is-invalid' : ''}`} name="TenCongTy" value={form.TenCongTy} onChange={update} />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Người liên hệ</label>
              <input className={`form-control ${error.errors?.NguoiLienHe ? 'is-invalid' : ''}`} name="NguoiLienHe" value={form.NguoiLienHe} onChange={update} />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Số điện thoại (10 số)</label>
              <input className={`form-control ${error.errors?.SDT ? 'is-invalid' : ''}`} name="SDT" value={form.SDT} onChange={update} inputMode="numeric" maxLength={10} />
              <div className="form-text">Ví dụ: 0xxxxxxxxx</div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Số người (tối thiểu 20)</label>
              <input className={`form-control ${error.errors?.SoNguoi ? 'is-invalid' : ''}`} type="number" min="20" name="SoNguoi" value={form.SoNguoi} onChange={update} />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Thời gian khởi hành</label>
              <input className={`form-control ${error.errors?.ThoiGianKhoiHanh ? 'is-invalid' : ''}`} type="date" min={TODAY} name="ThoiGianKhoiHanh" value={form.ThoiGianKhoiHanh} onChange={update} />
            </div>

            <div className="col-md-6 d-flex align-items-end justify-content-end">
              <button className="btn btn-primary btn-lg px-4" type="submit" disabled={submitting}>
                <i className="fa-solid fa-paper-plane me-2"></i> {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </form>

        <div className="divider"></div>
        <div className="muted small">
          Sau khi gửi, hệ thống sẽ chuyển trạng thái <b>Chờ xử lý</b>. Nhân viên sẽ liên hệ lại để chốt chi tiết.
        </div>
      </div>
    </div>
  )
}
