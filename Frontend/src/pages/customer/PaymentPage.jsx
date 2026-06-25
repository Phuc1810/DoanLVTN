import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { paymentApi } from '../../api/paymentApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import PaymentQrBox from '../../components/payments/PaymentQrBox'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl } from '../../utils/imageUrl'

export default function PaymentPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: '', payment: null, status: 'pending' })

  useEffect(() => {
    paymentApi.getPayment(orderId)
      .then((payload) => setState({ loading: false, error: '', payment: payload, status: 'pending' }))
      .catch((error) => setState({ loading: false, error: error.message, payment: null, status: 'error' }))
  }, [orderId])

  useEffect(() => {
    const timer = window.setInterval(() => {
      paymentApi.checkPayment(orderId)
        .then((payload) => {
          const status = payload?.status || payload?.payment_status || payload?.TrangThai
          if (status === 'paid' || status === 'soldout') {
            window.clearInterval(timer)
            navigate(`/booking-success/${orderId}`)
          }
        })
        .catch(() => {})
    }, 2000)

    return () => window.clearInterval(timer)
  }, [navigate, orderId])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const data = state.payment || {}
  const order = data.order || data.don_hang || data
  const tour = data.tour || order.tour || {}
  const amount = data.payment?.amount || data.amount || data.SoTien || order.TongTienPhaiTra
  const qrUrl = data.payment?.qr_url || data.qr_url || data.qrUrl

  return (
    <div className="container page shell">
      <div className="cardx p-4 mb-4">
        <div className="d-flex gap-3 align-items-center">
          {(tour.image_url || tour.AnhChinh) && <img className="thumb" src={buildImageUrl(tour.image_url || tour.AnhChinh)} alt="" />}
          <div className="flex-grow-1">
            <div className="title">{tour.TenTour || `Thanh toán đơn #${orderId}`}</div>
            <div className="meta mt-2">
              <i className="fa-solid fa-receipt me-1"></i>Đơn hàng: <span className="text-dark fw-bold">#{orderId}</span>
              &nbsp; • &nbsp;<i className="fa-regular fa-calendar-days me-1"></i>{formatDate(tour.NgayKhoiHanh)}
            </div>
          </div>
          <span className="badge text-bg-warning">Đang chờ thanh toán</span>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-lg-6">
          <PaymentQrBox amount={amount} orderId={orderId} qrUrl={qrUrl} />
        </div>
        <div className="col-lg-6">
          <div className="cardx h-100 p-4">
            <h5 className="fw-bold mb-3">Tóm tắt chi phí</h5>
            <div className="d-flex justify-content-between"><span>Mã đơn</span><strong>DH{orderId}</strong></div>
            <div className="divider"></div>
            <div className="d-flex justify-content-between"><span>Tổng thanh toán</span><strong className="money">{formatCurrency(amount)}</strong></div>
            {data.discount && (
              <div className="alert alert-success mt-3 mb-0">
                Ưu đãi áp dụng: {data.discount.name || data.discount.type || 'Khuyến mãi'}
              </div>
            )}
            <div className="alert alert-warning mt-4 mb-0">
              Hệ thống sẽ tự động chuyển trang sau khi nhận thanh toán thành công.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
