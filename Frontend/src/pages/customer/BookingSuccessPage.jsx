import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { orderApi } from '../../api/orderApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StatusBadge from '../../components/common/StatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

export default function BookingSuccessPage() {
  const { orderId } = useParams()
  const [state, setState] = useState({ loading: true, error: '', order: null })

  useEffect(() => {
    orderApi.getOrder(orderId)
      .then((order) => setState({ loading: false, error: '', order }))
      .catch((error) => setState({ loading: false, error: error.message, order: null }))
  }, [orderId])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const order = state.order || {}
  const tour = order.tour || {}

  return (
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5 text-center">
        <div className="auth-success-icon mb-3" style={{ fontSize: 54, color: '#198754' }}>
          <i className="fa-solid fa-circle-check"></i>
        </div>
        <h3 className="fw-bold mb-2">Thông tin đơn đặt tour</h3>
        <p className="text-muted">Mã đơn #{order.MaDon || orderId}</p>
        <div className="divider"></div>
        <div className="row text-start g-3">
          <div className="col-md-6"><strong>Tour:</strong> {tour.TenTour}</div>
          <div className="col-md-6"><strong>Khởi hành:</strong> {formatDate(tour.NgayKhoiHanh)}</div>
          <div className="col-md-6"><strong>Tổng tiền:</strong> <span className="money">{formatCurrency(order.TongTienPhaiTra)}</span></div>
          <div className="col-md-6"><strong>Trạng thái:</strong> <StatusBadge status={order.TrangThai} /></div>
        </div>
        <div className="d-flex justify-content-center gap-2 mt-4">
          <Link className="btn btn-primary btn-pill px-4" to={`/orders/${orderId}`}>Xem đơn hàng</Link>
          <Link className="btn btn-outline-secondary btn-pill px-4" to="/">Về trang chủ</Link>
        </div>
      </div>
    </div>
  )
}
