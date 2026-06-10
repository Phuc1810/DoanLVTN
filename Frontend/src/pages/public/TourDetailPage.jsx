import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl } from '../../utils/imageUrl'

export default function TourDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', tour: null, schedules: [], reviews: [] })

  useEffect(() => {
    Promise.all([tourApi.detail(id), tourApi.schedules(id), tourApi.reviews(id)])
      .then(([tour, schedules, reviews]) => {
        setState({
          loading: false,
          error: '',
          tour,
          schedules: Array.isArray(schedules) ? schedules : schedules.items || schedules.data || tour.lichTrinhs || [],
          reviews: Array.isArray(reviews) ? reviews : reviews.items || reviews.data || tour.danhGias || [],
        })
      })
      .catch((error) => setState({ loading: false, error: error.message, tour: null, schedules: [], reviews: [] }))
  }, [id])

  if (state.loading) return <div className="tour-detail-wrapper"><Loading /></div>
  if (state.error) return <ErrorState message={state.error} />
  if (!state.tour) return <ErrorState message="Không tìm thấy tour." />

  const tour = state.tour
  const images = Array.isArray(tour.hinhAnhs) ? tour.hinhAnhs : []
  const discount = Number(tour.discount_percent || tour.PhanTramGiam || 0)
  const stats = tour.review_stats || {}

  return (
    <div className="container tour-detail-wrapper">
      <h2 className="fw-bold mb-3 tour-detail-title">{tour.TenTour}</h2>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="tour-main-img position-relative mb-3">
            <img src={buildImageUrl(tour.image_url || tour.AnhChinh)} className="img-fluid w-100 rounded-4" alt="" />
            {discount > 0 && <div className="tour-detail-discount">-{discount}%</div>}
          </div>

          {images.length > 1 && (
            <div className="tour-gallery d-flex gap-3 flex-wrap">
              {images.filter((image) => image.DuongDan !== tour.AnhChinh).map((image) => (
                <div className="tour-gallery-item" key={image.MaAnh || image.DuongDan}>
                  <img src={buildImageUrl(image.image_url || image.DuongDan)} className="img-fluid rounded-3" alt="" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="tour-info-card shadow-sm rounded-4 p-3">
            <p className="mb-2"><i className="fa-solid fa-location-dot text-danger me-1"></i><strong>Địa điểm:</strong> {tour.DiaDiem}</p>
            <p className="mb-2"><i className="fa-regular fa-clock text-primary me-1"></i><strong>Thời lượng:</strong> {tour.ThoiLuong}</p>
            <p className="mb-2"><i className="fa-regular fa-calendar-days text-primary me-1"></i><strong>Khởi hành:</strong> {formatDate(tour.NgayKhoiHanh)}</p>
            <p className="mb-2"><i className="fa-solid fa-users me-1"></i><strong>Số chỗ:</strong> {tour.SoCho} (Đã đặt: {tour.SoChoDaDat || 0})</p>
            <hr />
            <p className="mb-1">
              <span className="text-muted">Giá gốc:</span>
              <span className="text-decoration-line-through ms-1">{formatCurrency(tour.GiaGoc)}</span>
            </p>
            <p className="tour-detail-price mb-3">
              <span>Giá chỉ còn:</span>
              <span className="ms-2">{formatCurrency(tour.GiaGiam)}</span>
            </p>
            <Link to={`/bookings/create/${tour.MaTour}`} className="btn btn-book-detail w-100">ĐẶT TOUR</Link>
            {tour.LoaiTour === 'Doanh nghiệp' && (
              <Link to={`/business-requests/create?tourId=${tour.MaTour}`} className="btn btn-outline-primary w-100 mt-2">
                YÊU CẦU DOANH NGHIỆP
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <h4 className="fw-bold mb-3">LỊCH TRÌNH CHI TIẾT</h4>
        {state.schedules.length ? (
          <div className="accordion" id="lichTrinhAccordion">
            {state.schedules.map((schedule, index) => (
              <div className="accordion-item" key={schedule.MaLT || index}>
                <h2 className="accordion-header">
                  <button className={`accordion-button ${index > 0 ? 'collapsed' : ''}`} type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${index}`}>
                    {schedule.TieuDe || `Ngày ${schedule.NgayThu}`}
                  </button>
                </h2>
                <div id={`collapse${index}`} className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`} data-bs-parent="#lichTrinhAccordion">
                  <div className="accordion-body">{schedule.NoiDung}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">Lịch trình đang được cập nhật.</p>
        )}
      </div>

      <div className="mt-5" id="danhgia">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">ĐÁNH GIÁ KHÁCH HÀNG</h4>
            <div className="text-muted">{stats.average_rating || 0}/5 • {stats.total_reviews || state.reviews.length} đánh giá</div>
          </div>
          <span className="badge bg-secondary p-2">Đăng nhập để đánh giá</span>
        </div>
        <hr />
        {!state.reviews.length ? (
          <div className="text-muted">Chưa có đánh giá nào cho tour này.</div>
        ) : (
          <div className="d-grid gap-3">
            {state.reviews.map((review, index) => (
              <div className="p-3 rounded-4 border bg-white" key={review.MaDG || index}>
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <div className="fw-bold">{review.khach_hang?.HoTen || review.HoTen || 'Khách'}</div>
                  <div className="text-muted small">{formatDate(review.NgayDG)}</div>
                </div>
                <div className="mt-1">{Array.from({ length: 5 }, (_, i) => <i key={i} className={`${i < Number(review.SoSao) ? 'fa-solid' : 'fa-regular'} fa-star text-warning`}></i>)}</div>
                {review.NoiDung && <div className="mt-2">{review.NoiDung}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
