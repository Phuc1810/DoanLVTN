import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { businessRequestApi } from '../../api/businessRequestApi'
import ErrorState from '../../components/common/ErrorState'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'

export default function ReviewBusinessRequestPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: '', request: null })
  const [form, setForm] = useState({ SoSao: 5, NoiDung: '' })
  const [submitError, setSubmitError] = useState({ message: '', errors: {} })
  const [success, setSuccess] = useState('')

  useEffect(() => {
    businessRequestApi.getBusinessRequest(id)
      .then((request) => setState({ loading: false, error: '', request }))
      .catch((error) => setState({ loading: false, error: error.message, request: null }))
  }, [id])

  async function submit(event) {
    event.preventDefault()
    try {
      await businessRequestApi.reviewBusinessRequest(id, form)
      setSuccess('Gửi đánh giá thành công.')
      window.setTimeout(() => navigate(`/business-requests/${id}`), 900)
    } catch (err) {
      setSubmitError({ message: err.message, errors: err.errors })
    }
  }

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />
  const request = state.request || {}

  return (
    <div className="container wrap" style={{ maxWidth: 820 }}>
      <div className="cardx p-4 p-lg-5">
        <h3 className="fw-bold mb-1">{request.MaDG ? 'Chỉnh sửa đánh giá tour doanh nghiệp' : 'Đánh giá tour doanh nghiệp'}</h3>
        <div className="muted mb-3">{request.TenTour || 'Tour doanh nghiệp (Mã YC: #' + (request.MaYC || request.id) + ')'}</div>
        {request.TrangThai !== 'Đã hoàn tất' && <div className="alert alert-warning">Chỉ có thể đánh giá khi đơn đã hoàn tất.</div>}
        <FormError message={submitError.message} errors={submitError.errors} />
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Số sao</label>
            <select className="form-select" value={form.SoSao} onChange={(event) => setForm((current) => ({ ...current, SoSao: Number(event.target.value) }))}>
              {[5, 4, 3, 2, 1].map((star) => <option key={star} value={star}>{star} sao</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Nội dung</label>
            <textarea className="form-control" rows="5" value={form.NoiDung} onChange={(event) => setForm((current) => ({ ...current, NoiDung: event.target.value }))}></textarea>
          </div>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to={`/business-requests/${id}`}>Quay lại</Link>
            <button className="btn btn-warning fw-bold" disabled={request.TrangThai !== 'Đã hoàn tất'}><i className={request.MaDG ? 'fa-solid fa-pen-to-square me-1' : 'fa-solid fa-star me-1'}></i> {request.MaDG ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
