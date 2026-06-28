import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl, tourImagePath } from '../../utils/imageUrl'
import OrderStatusBadge from './OrderStatusBadge'

function canCancelOrder(order, tour) {
  if (order.TrangThai !== 'Đã thanh toán' || !tour.NgayKhoiHanh) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const departure = new Date(tour.NgayKhoiHanh)
  if (Number.isNaN(departure.getTime())) {
    return false
  }

  departure.setHours(0, 0, 0, 0)
  const daysDiff = Math.floor((departure.getTime() - today.getTime()) / 86400000)

  return daysDiff >= 1
}

export default function OrderCard({ order }) {
  const tour = order.tour || {}
  const qty = Number(order.SoLuongNguoiLon || 0) + Number(order.SoLuongTreEm || 0) + Number(order.SoLuongTreNho || 0)
  const canPay = order.TrangThai === 'Chờ thanh toán'
  const canReview = order.TrangThai === 'Đã hoàn tất'
  const canCancel = canCancelOrder(order, tour)
  const hasReview = Number(order.MaDG || 0) > 0

  return (
    <div className="order-item">
      {tourImagePath(tour) ? (
        <img className="order-thumb" src={buildImageUrl(tourImagePath(tour))} alt="" />
      ) : (
        <div className="order-thumb"></div>
      )}

      <div className="order-main flex-grow-1">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="order-name">{tour.TenTour || `Đơn #${order.MaDon}`}</div>
          <OrderStatusBadge status={order.TrangThai} />
          <span className="badge text-bg-light">Đơn #{order.MaDon}</span>
        </div>

        <div className="order-meta mt-1">
          <span><i className="fa-solid fa-location-dot me-1"></i>{tour.DiaDiem || '—'}</span>
          <span><i className="fa-regular fa-calendar-days me-1"></i>Khởi hành: {formatDate(tour.NgayKhoiHanh) || '—'}</span>
          <span><i className="fa-regular fa-calendar-check me-1"></i>Kết thúc: {formatDate(tour.NgayKetThuc) || '—'}</span>
          <span><i className="fa-regular fa-clock me-1"></i>Ngày đặt: {formatDate(order.NgayDat) || '—'}</span>
          <span><i className="fa-solid fa-users me-1"></i>Số lượng: {qty}</span>
        </div>
      </div>

      <div className="order-right">
        <div className="order-money">{formatCurrency(order.TongTienPhaiTra)}</div>

        {canPay && (
          <Link className="btn btn-warning btn-detail" to={`/payments/${order.MaDon}`}>
            <i className="fa-solid fa-qrcode me-1"></i> Thanh toán
          </Link>
        )}

        {canReview && (
          <Link className={`btn btn-detail ${hasReview ? 'btn-outline-primary' : 'btn-outline-warning'}`} to={`/orders/${order.MaDon}/review`}>
            <i className={`fa-solid ${hasReview ? 'fa-pen-to-square' : 'fa-star'} me-1`}></i>
            {hasReview ? 'Chỉnh sửa đánh giá' : 'Đánh giá'}
          </Link>
        )}

        {canCancel && (
          <Link className="btn btn-outline-danger btn-detail" to={`/orders/${order.MaDon}/cancel`}>
            <i className="fa-solid fa-ban me-1"></i> Huỷ tour
          </Link>
        )}

        <Link className="btn btn-outline-secondary btn-detail" to={`/orders/${order.MaDon}`}>
          <i className="fa-solid fa-eye me-1"></i> Xem chi tiết
        </Link>
      </div>
    </div>
  )
}
