import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { orderApi } from '../../api/orderApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StatusBadge from '../../components/common/StatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl } from '../../utils/imageUrl'

export default function OrderDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', order: null })

  useEffect(() => {
    orderApi.getOrder(id)
      .then((order) => setState({ loading: false, error: '', order }))
      .catch((error) => setState({ loading: false, error: error.message, order: null }))
  }, [id])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const order = state.order || {}
  const tour = order.tour || {}
  const customer = order.khach_hang || {}

  return (
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5">
        <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start">
          <div>
            <div className="title"><i className="fa-solid fa-receipt me-2"></i>Chi tiết đơn #{order.MaDon || id}</div>
            <div className="muted mt-1"><StatusBadge status={order.TrangThai} /></div>
          </div>
          <Link className="btn btn-outline-secondary" to="/orders">Quay lại</Link>
        </div>
        <div className="divider"></div>
        <div className="row g-4">
          <div className="col-md-5">
            {(tour.image_url || tour.AnhChinh) && <img className="img-fluid rounded-4" src={buildImageUrl(tour.image_url || tour.AnhChinh)} alt="" />}
          </div>
          <div className="col-md-7">
            <h4 className="fw-bold">{tour.TenTour}</h4>
            <div className="meta mb-3">
              <span><i className="fa-solid fa-location-dot me-1"></i>{tour.DiaDiem}</span>
              <span><i className="fa-regular fa-calendar-days me-1"></i>{formatDate(tour.NgayKhoiHanh)}</span>
            </div>
            <div className="row g-2">
              <div className="col-md-6"><strong>Ngày đặt:</strong> {formatDate(order.NgayDat)}</div>
              <div className="col-md-6"><strong>Người lớn:</strong> {order.SoLuongNguoiLon}</div>
              <div className="col-md-6"><strong>Trẻ em:</strong> {order.SoLuongTreEm}</div>
              <div className="col-md-6"><strong>Trẻ nhỏ:</strong> {order.SoLuongTreNho}</div>
              <div className="col-md-6"><strong>Tổng gốc:</strong> {formatCurrency(order.TongTienGoc)}</div>
              <div className="col-md-6"><strong>Phải trả:</strong> <span className="money">{formatCurrency(order.TongTienPhaiTra)}</span></div>
            </div>
          </div>
        </div>
        <div className="divider"></div>
        <h5 className="fw-bold">Khách hàng</h5>
        <div className="row g-2">
          <div className="col-md-3">{customer.HoTen}</div>
          <div className="col-md-3">{customer.Email}</div>
          <div className="col-md-3">{customer.SoDienThoai}</div>
          <div className="col-md-3">{customer.DiaChi}</div>
        </div>
        {!!tour.lich_trinh?.length && (
          <>
            <div className="divider"></div>
            <h5 className="fw-bold">Lịch trình</h5>
            <div className="accordion" id="orderSchedule">
              {tour.lich_trinh.map((item, index) => (
                <div className="accordion-item" key={item.MaLT || index}>
                  <h2 className="accordion-header"><button className={`accordion-button ${index ? 'collapsed' : ''}`} type="button" data-bs-toggle="collapse" data-bs-target={`#schedule${index}`}>{item.TieuDe}</button></h2>
                  <div id={`schedule${index}`} className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`} data-bs-parent="#orderSchedule"><div className="accordion-body">{item.NoiDung}</div></div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="d-flex flex-wrap gap-2 mt-4">
          {order.TrangThai === 'Chờ thanh toán' && <Link className="btn btn-warning" to={`/payments/${id}`}>Thanh toán</Link>}
          {order.TrangThai === 'Đã thanh toán' && <Link className="btn btn-outline-danger" to={`/orders/${id}/cancel`}>Huỷ tour</Link>}
          {order.TrangThai === 'Đã hoàn tất' && <Link className="btn btn-outline-warning" to={`/orders/${id}/review`}>Đánh giá</Link>}
        </div>
      </div>
    </div>
  )
}
