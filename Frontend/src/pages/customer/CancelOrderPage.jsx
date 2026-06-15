import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { orderApi } from '../../api/orderApi'
import ErrorState from '../../components/common/ErrorState'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

function refundPolicy(order) {
  const start = order?.tour?.NgayKhoiHanh
  if (!start) return { canCancel: false, rate: 0, text: 'Tour chưa có ngày khởi hành.' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)
  const days = Math.floor((startDate - today) / 86400000)
  if (order.TrangThai !== 'Đã thanh toán' || days < 1) return { canCancel: false, rate: 0, text: 'Đơn này không đủ điều kiện huỷ.' }
  if (days >= 3) return { canCancel: true, rate: 0.9, text: `Huỷ trước ${days} ngày -> hoàn 90%` }
  if (days === 2) return { canCancel: true, rate: 0.8, text: 'Huỷ trước 2 ngày -> hoàn 80%' }
  return { canCancel: true, rate: 0.5, text: 'Huỷ trước 1 ngày -> hoàn 50%' }
}

export default function CancelOrderPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', order: null })
  const [lydo, setLydo] = useState('')
  const [agree, setAgree] = useState(false)
  const [submitError, setSubmitError] = useState({ message: '', errors: {} })
  const [message, setMessage] = useState('')

  useEffect(() => {
    orderApi.getOrder(id)
      .then((order) => setState({ loading: false, error: '', order }))
      .catch((error) => setState({ loading: false, error: error.message, order: null }))
  }, [id])

  const policy = useMemo(() => refundPolicy(state.order), [state.order])
  const refundAmount = Math.round(Number(state.order?.TongTienPhaiTra || 0) * policy.rate)

  async function submit(event) {
    event.preventDefault()
    if (!agree) {
      setSubmitError({ message: 'Bạn cần tích đồng ý để xác nhận huỷ tour.', errors: {} })
      return
    }
    try {
      await orderApi.cancelOrder(id, { LyDo: lydo, lydo })
      setMessage('Huỷ tour thành công.')
    } catch (err) {
      setSubmitError({
        message: err.status === 404 ? 'Chức năng huỷ tour chưa được backend hỗ trợ.' : err.message,
        errors: err.errors,
      })
    }
  }

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const order = state.order || {}
  const qty = Number(order.SoLuongNguoiLon || 0) + Number(order.SoLuongTreEm || 0) + Number(order.SoLuongTreNho || 0)

  return (
    <div className="container wrap" style={{ maxWidth: 920 }}>
      <div className="bg-white p-4 rounded-4 shadow-sm border">
        <h3 className="fw-bold mb-1">Xác nhận huỷ tour</h3>
        <div className="text-muted mb-3">Vui lòng kiểm tra thông tin và xác nhận trước khi huỷ.</div>
        <FormError message={submitError.message} errors={submitError.errors} />
        {message && <div className="alert alert-success">{message}</div>}
        <div className="row g-3">
          <div className="col-md-7">
            <div className="border rounded-4 p-3">
              <div className="fw-bold mb-2">Thông tin đơn</div>
              <div>Mã đơn: <b>#{order.MaDon}</b></div>
              <div>Tour: <b>{order.tour?.TenTour}</b></div>
              <div>Ngày khởi hành: <b>{formatDate(order.tour?.NgayKhoiHanh)}</b></div>
              <div>Số lượng khách: <b>{qty}</b></div>
              <div>Tổng tiền đã thanh toán: <b className="text-danger">{formatCurrency(order.TongTienPhaiTra)}</b></div>
              <div>Trạng thái hiện tại: <b>{order.TrangThai}</b></div>
            </div>
          </div>
          <div className="col-md-5">
            <div className="border rounded-4 p-3">
              <div className="fw-bold mb-2">Chính sách hoàn tiền</div>
              {policy.canCancel ? (
                <>
                  <div className="alert alert-info mb-2">Bạn đang ở trường hợp: <b>{policy.text}</b></div>
                  <div>Phần trăm hoàn: <b>{Math.round(policy.rate * 100)}%</b></div>
                  <div>Số tiền hoàn dự kiến: <b className="text-success">{formatCurrency(refundAmount)}</b></div>
                </>
              ) : <div className="alert alert-warning mb-0">{policy.text}</div>}
            </div>
          </div>
        </div>
        <hr className="my-4" />
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Lý do huỷ (không bắt buộc)</label>
            <input className="form-control" value={lydo} onChange={(event) => setLydo(event.target.value)} placeholder="VD: Thay đổi kế hoạch..." />
          </div>
          <div className="form-check mb-3">
            <input className="form-check-input" type="checkbox" id="agreeCancel" checked={agree} onChange={(event) => setAgree(event.target.checked)} />
            <label className="form-check-label" htmlFor="agreeCancel">Tôi đã đọc và đồng ý với chính sách huỷ/hoàn tiền ở trên.</label>
          </div>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to="/orders">Quay lại</Link>
            <button className="btn btn-danger" type="submit" disabled={!policy.canCancel}>Xác nhận huỷ tour</button>
          </div>
          <div className="text-muted small mt-2">Nếu backend chưa có POST /api/orders/{id}/cancel, nút sẽ báo chưa hỗ trợ.</div>
        </form>
      </div>
    </div>
  )
}
