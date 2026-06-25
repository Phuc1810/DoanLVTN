import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { businessRequestApi } from '../../api/businessRequestApi'
import { tourApi } from '../../api/tourApi'
import FormError from '../../components/common/FormError'
import { buildImageUrl } from '../../utils/imageUrl'

export default function CreateBusinessRequestPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tourId = searchParams.get('tourId') || searchParams.get('tour')
  const [tour, setTour] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState({ message: '', errors: {} })
  const [form, setForm] = useState({ TenCongTy: '', NguoiLienHe: '', SDT: '', SoNguoi: '', ThoiGianKhoiHanh: '', GhiChu: '', MaTour: tourId || '' })

  useEffect(() => {
    if (tourId) {
      tourApi.detail(tourId).then(setTour).catch(() => {})
    }
    authApi.me().then((payload) => {
      const me = payload?.data?.khach_hang || payload?.data?.user || payload?.data || payload || {}
      setForm((current) => ({ ...current, NguoiLienHe: me.HoTen || current.NguoiLienHe, SDT: me.SoDienThoai || current.SDT }))
    }).catch(() => {})
  }, [tourId])

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError({ message: '', errors: {} })
    setMessage('')
    try {
      const payload = await businessRequestApi.createBusinessRequest({ ...form, MaTour: form.MaTour ? Number(form.MaTour) : undefined, SoNguoi: Number(form.SoNguoi) })
      const id = payload?.MaYC || payload?.id
      setMessage('Gửi yêu cầu thành công.')
      if (id) navigate(`/business-requests/${id}`)
    } catch (err) {
      setError({ message: err.message, errors: err.errors })
    }
  }

  return (
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5">
        <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start">
          <div>
            <div className="title"><i className="fa-solid fa-paper-plane me-2"></i>Gửi yêu cầu tour doanh nghiệp</div>
            <div className="muted mt-1">Tối thiểu <b>20 người</b>. Nhân viên sẽ liên hệ để xác nhận.</div>
          </div>
          <Link className="btn btn-outline-secondary" to="/business-tours">Quay lại danh sách</Link>
        </div>
        {tour && (
          <div className="tour-mini mt-3 d-flex gap-3 align-items-center border rounded-4 p-3">
            <img className="thumb" src={buildImageUrl(tour.image_url || tour.AnhChinh)} alt="" />
            <div><div className="name">{tour.TenTour}</div><div className="meta"><i className="fa-solid fa-location-dot"></i>{tour.DiaDiem}</div></div>
          </div>
        )}
        <FormError message={error.message} errors={error.errors} />
        {message && <div className="alert alert-success mt-3">{message}</div>}
        <form onSubmit={submit} className="mt-3 row g-3" noValidate>
          <div className="col-md-6"><label className="form-label fw-semibold">Tên công ty</label><input className="form-control" name="TenCongTy" value={form.TenCongTy} onChange={update} /></div>
          <div className="col-md-6"><label className="form-label fw-semibold">Người liên hệ</label><input className="form-control" name="NguoiLienHe" value={form.NguoiLienHe} onChange={update} /></div>
          <div className="col-md-6"><label className="form-label fw-semibold">Số điện thoại</label><input className="form-control" name="SDT" value={form.SDT} onChange={update} /></div>
          <div className="col-md-6"><label className="form-label fw-semibold">Số người</label><input className="form-control" type="number" min="20" name="SoNguoi" value={form.SoNguoi} onChange={update} /></div>
          <div className="col-md-6"><label className="form-label fw-semibold">Thời gian khởi hành</label><input className="form-control" type="date" name="ThoiGianKhoiHanh" value={form.ThoiGianKhoiHanh} onChange={update} /></div>
          <div className="col-md-6"><label className="form-label fw-semibold">Mã tour</label><input className="form-control" name="MaTour" value={form.MaTour} onChange={update} /></div>
          <div className="col-12"><label className="form-label fw-semibold">Ghi chú</label><textarea className="form-control" rows="4" name="GhiChu" value={form.GhiChu} onChange={update}></textarea></div>
          <div className="col-12 d-flex justify-content-end"><button className="btn btn-primary btn-lg px-4"><i className="fa-solid fa-paper-plane me-2"></i> Gửi yêu cầu</button></div>
        </form>
      </div>
    </div>
  )
}
