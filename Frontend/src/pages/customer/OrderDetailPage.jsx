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
  const payments = order.payments || []
  const promotion = order.promotion || null

  // Tính toán
  const tongGoc = Number(order.TongTienGoc) || 0
  const tongTra = Number(order.TongTienPhaiTra) || 0
  const giamTien = Math.max(0, tongGoc - tongTra)
  const giamPt = tongGoc > 0 && giamTien > 0 ? Math.round(giamTien / tongGoc * 100) : 0

  const soCho = Number(tour.SoCho) || 0
  const soChoDaDat = Number(tour.SoChoDaDat) || 0
  const conLai = Math.max(0, soCho - soChoDaDat)
  const tourFullNow = soCho > 0 && soChoDaDat >= soCho

  const isPaid = order.TrangThai === 'Đã thanh toán'
  const isPending = order.TrangThai === 'Chờ thanh toán'
  const isSoldout = order.TrangThai === 'Hết chỗ'

  return (
    <div className="container wrap">
      <div className="cardx">

        {/* Header tour – topGrad */}
        <div className="topGrad">
          <div className="d-flex gap-3 align-items-center">
            {(tour.image_url || tour.AnhChinh)
              ? <img className="tourThumb" src={buildImageUrl(tour.image_url || tour.AnhChinh)} alt="" />
              : <div className="tourThumb" />}

            <div className="flex-grow-1">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <div className="tourTitle">{tour.TenTour}</div>
                <StatusBadge status={order.TrangThai} />
              </div>
              <div className="muted mt-1">
                <i className="fa-solid fa-receipt me-1" /> Đơn #{order.MaDon || id}
                &nbsp; • &nbsp;
                <i className="fa-regular fa-calendar-days me-1" />
                {tour.NgayKhoiHanh ? formatDate(tour.NgayKhoiHanh) : 'Đang cập nhật'}
                &nbsp; • &nbsp;
                <i className="fa-solid fa-location-dot me-1" />{tour.DiaDiem}
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            <div className="chip"><i className="fa-solid fa-user-group" /> Người lớn: <strong>{order.SoLuongNguoiLon ?? 0}</strong></div>
            <div className="chip"><i className="fa-solid fa-child" /> Trẻ em: <strong>{order.SoLuongTreEm ?? 0}</strong></div>
            <div className="chip"><i className="fa-solid fa-baby" /> Trẻ nhỏ: <strong>{order.SoLuongTreNho ?? 0}</strong></div>

            {soCho > 0 && (
              <div className="chip">
                <i className="fa-solid fa-chair" />
                Chỗ còn lại: <strong>{conLai}</strong> / {soCho}
              </div>
            )}
          </div>
        </div>

        {/* Alerts + Body */}
        <div className="p-3 p-md-4">

          {/* Alert hết chỗ */}
          {isSoldout && (
            <div className="alert alert-danger mb-3" style={{ borderRadius: 18 }}>
              <div className="fw-bold" style={{ fontSize: 18 }}>
                <i className="fa-solid fa-triangle-exclamation me-2" />Tour đã hết chỗ
              </div>
              <div className="mt-1">
                Hệ thống ghi nhận đơn ở trạng thái <strong>Hết chỗ</strong>. Nếu bạn đã chuyển khoản, vui lòng liên hệ để được hỗ trợ xử lý.
              </div>
            </div>
          )}

          {/* Alert tour đủ chỗ */}
          {isPaid && tourFullNow && (
            <div className="alert alert-warning mb-3" style={{ borderRadius: 18 }}>
              <strong>Lưu ý:</strong> Tour hiện đã <strong>đủ chỗ</strong>. Bạn vẫn giữ chỗ thành công theo đơn này.
            </div>
          )}

          <div className="row g-3">

            {/* Box chi phí */}
            <div className="col-lg-6">
              <div className="box">
                <div className="boxHead"><i className="fa-solid fa-coins me-2" />Chi phí đơn hàng</div>
                <div className="boxBody">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="small2">Tổng tiền gốc</div>
                    <div className="fw-bold">{formatCurrency(tongGoc)} VNĐ</div>
                  </div>

                  {giamTien > 0 && (
                    <>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="small2">Giảm giá ({giamPt}%)</div>
                        <div className="fw-bold text-danger">-{formatCurrency(giamTien)} VNĐ</div>
                      </div>
                      {promotion?.TenKM && (
                        <div className="small2 mt-1">CTKM áp dụng: <strong>{promotion.TenKM}</strong></div>
                      )}
                    </>
                  )}

                  <hr style={{ opacity: .12 }} />

                  <div className="moneyLabel">Tổng phải trả</div>
                  <div className="moneyValue">{formatCurrency(tongTra)}</div>
                  <div className="moneyVnd">VNĐ</div>

                  {isPending && (
                    <div className="mt-3">
                      <Link className="btn btn-warning btn-lg w-100" to={`/payments/${id}`}>
                        <i className="fa-solid fa-qrcode me-2" /> Thanh toán ngay
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Box lịch sử thanh toán */}
            <div className="col-lg-6">
              <div className="box">
                <div className="boxHead"><i className="fa-solid fa-clock-rotate-left me-2" />Lịch sử thanh toán</div>
                <div className="boxBody">
                  {payments.length === 0 ? (
                    <div className="text-muted">Chưa có bản ghi thanh toán.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm tbl mb-0">
                        <thead>
                          <tr>
                            <th>Ngày</th>
                            <th>Số tiền</th>
                            <th>Phương thức</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr key={p.MaTT}>
                              <td>{p.NgayTT ? formatDate(p.NgayTT) : '-'}</td>
                              <td className="fw-bold">{formatCurrency(p.SoTien)} VNĐ</td>
                              <td>{p.PhuongThuc || '-'}</td>
                              <td>{p.TrangThaiTT || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Box thông tin đơn */}
            <div className="col-12">
              <div className="box">
                <div className="boxHead"><i className="fa-solid fa-file-lines me-2" />Thông tin đơn</div>
                <div className="boxBody">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="small2">Mã đơn</div>
                      <div className="fw-bold">#{order.MaDon}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="small2">Ngày đặt</div>
                      <div className="fw-bold">{formatDate(order.NgayDat)}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="small2">Trạng thái</div>
                      <div className="fw-bold">{order.TrangThai}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="small2">Giá người lớn áp dụng</div>
                      <div className="fw-bold">{formatCurrency(order.GiaNguoiLonApDung)} VNĐ</div>
                    </div>
                    <div className="col-md-4">
                      <div className="small2">Giá trẻ em áp dụng</div>
                      <div className="fw-bold">{formatCurrency(order.GiaTreEmApDung)} VNĐ</div>
                    </div>
                    <div className="col-md-4">
                      <div className="small2">Tour</div>
                      <div className="fw-bold">{tour.TenTour}</div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-4">
                    <Link className="btn btn-primary" to="/">
                      <i className="fa-solid fa-house me-1" /> Về trang chủ
                    </Link>



                    {isPending && (
                      <Link className="btn btn-outline-warning" to={`/payments/${id}`}>
                        <i className="fa-solid fa-qrcode me-1" /> Quay lại thanh toán
                      </Link>
                    )}

                    {(order.TrangThai === 'Đã thanh toán' || order.TrangThai === 'Chờ thanh toán') && (
                      <Link className="btn btn-outline-danger" to={`/orders/${id}/cancel`}>
                        <i className="fa-solid fa-ban me-1" /> Huỷ tour
                      </Link>
                    )}

                    {order.TrangThai === 'Đã hoàn tất' && (
                      <Link className="btn btn-outline-warning" to={`/orders/${id}/review`}>
                        <i className="fa-solid fa-star me-1" /> Đánh giá
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Khách hàng */}
          {customer.HoTen && (
            <>
              <div className="divider mt-4 mb-3" />
              <h5 className="fw-bold"><i className="fa-solid fa-user me-2" />Khách hàng</h5>
              <div className="row g-2">
                <div className="col-md-3"><strong>Họ tên:</strong> {customer.HoTen}</div>
                <div className="col-md-3"><strong>Email:</strong> {customer.Email}</div>
                <div className="col-md-3"><strong>SĐT:</strong> {customer.SoDienThoai}</div>
                <div className="col-md-3"><strong>Địa chỉ:</strong> {customer.DiaChi}</div>
              </div>
            </>
          )}

          {/* Lịch trình accordion */}
          {!!tour.lich_trinh?.length && (
            <>
              <div className="divider mt-4 mb-3" />
              <h5 className="fw-bold"><i className="fa-solid fa-route me-2" />Lịch trình</h5>
              <div className="accordion" id="orderSchedule">
                {tour.lich_trinh.map((item, index) => (
                  <div className="accordion-item" key={item.MaLT || index}>
                    <h2 className="accordion-header">
                      <button className={`accordion-button ${index ? 'collapsed' : ''}`} type="button" data-bs-toggle="collapse" data-bs-target={`#schedule${index}`}>
                        {item.TieuDe}
                      </button>
                    </h2>
                    <div id={`schedule${index}`} className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`} data-bs-parent="#orderSchedule">
                      <div className="accordion-body">{item.NoiDung}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
