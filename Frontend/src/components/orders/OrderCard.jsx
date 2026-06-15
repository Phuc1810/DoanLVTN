import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl, tourImagePath } from '../../utils/imageUrl'
import OrderStatusBadge from './OrderStatusBadge'

export default function OrderCard({ order }) {
  const tour = order.tour || {}
  const qty = Number(order.SoLuongNguoiLon || 0) + Number(order.SoLuongTreEm || 0) + Number(order.SoLuongTreNho || 0)
  const canPay = order.TrangThai === 'Chờ thanh toán'
  const canReview = order.TrangThai === 'Đã hoàn tất'
  const canCancel = order.TrangThai === 'Đã thanh toán'

  return (
    <div className="order-item">
      {tourImagePath(tour) ? (
        <img className="thumb" src={buildImageUrl(tourImagePath(tour))} alt="" />
      ) : (
        <div className="thumb"></div>
      )}

      <div className="flex-grow-1">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="name">{tour.TenTour || `Đơn #${order.MaDon}`}</div>
          <OrderStatusBadge status={order.TrangThai} />
          <span className="badge text-bg-light">Đơn #{order.MaDon}</span>
        </div>
        <div className="meta mt-1">
          <span><i className="fa-solid fa-location-dot me-1"></i>{tour.DiaDiem || '-'}</span>
          <span><i className="fa-regular fa-calendar-days me-1"></i>Khởi hành: {formatDate(tour.NgayKhoiHanh)}</span>
          <span><i className="fa-regular fa-clock me-1"></i>Ngày đặt: {formatDate(order.NgayDat)}</span>
          <span><i className="fa-solid fa-users me-1"></i>Số lượng: {qty}</span>
        </div>
      </div>

      <div className="right">
        <div className="money">{formatCurrency(order.TongTienPhaiTra)}</div>
        {canPay && <Link className="btn btn-warning btn-detail" to={`/payments/${order.MaDon}`}><i className="fa-solid fa-qrcode me-1"></i> Thanh toán</Link>}
        {canReview && <Link className="btn btn-outline-warning btn-detail" to={`/orders/${order.MaDon}/review`}><i className="fa-solid fa-star me-1"></i> Đánh giá</Link>}
        {canCancel && <Link className="btn btn-outline-danger btn-detail" to={`/orders/${order.MaDon}/cancel`}><i className="fa-solid fa-ban me-1"></i> Huỷ tour</Link>}
        <Link className="btn btn-outline-secondary btn-detail" to={`/orders/${order.MaDon}`}><i className="fa-solid fa-eye me-1"></i> Xem chi tiết</Link>
      </div>
    </div>
  )
}
