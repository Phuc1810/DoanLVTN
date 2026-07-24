import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl, tourImagePath } from '../../utils/imageUrl'
import { useAuth } from '../../auth/useAuth'

export default function TourDetailPage({ bookingMode = 'personal' }) {
  const { id } = useParams()
  const { user } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [state, setState] = useState({ loading: true, error: '', tour: null, schedules: [], reviews: [] })

  useEffect(() => {
    Promise.allSettled([tourApi.detail(id), tourApi.schedules(id), tourApi.reviews(id)])
      .then(([tour, schedules, reviews]) => {
        if (tour.status === 'rejected') throw tour.reason
        const tourData = tour.value
        setState({
          loading: false,
          error: '',
          tour: tourData,
          schedules: schedules.status === 'fulfilled'
            ? (Array.isArray(schedules.value) ? schedules.value : schedules.value.items || schedules.value.data || tourData.lich_trinhs || tourData.lichTrinhs || [])
            : (tourData.lich_trinhs || tourData.lichTrinhs || []),
          reviews: reviews.status === 'fulfilled'
            ? (Array.isArray(reviews.value) ? reviews.value : reviews.value.items || reviews.value.data || tourData.danh_gias || tourData.danhGias || [])
            : (tourData.danh_gias || tourData.danhGias || []),
        })
      })
      .catch((error) => setState({ loading: false, error: error.message, tour: null, schedules: [], reviews: [] }))
  }, [id])

  if (state.loading) return <div className="tour-detail-wrapper"><Loading /></div>
  if (state.error) return <ErrorState message={state.error} />
  if (!state.tour) return <ErrorState message="Không tìm thấy tour." />

  const tour = state.tour
  const images = Array.isArray(tour.hinh_anhs) ? tour.hinh_anhs : Array.isArray(tour.hinhAnhs) ? tour.hinhAnhs : []
  const discount = Number(tour.discount_percent || tour.PhanTramGiam || 0)
  const stats = tour.review_stats || {}
  const isBusinessMode = bookingMode === 'business' || tour.LoaiTour === 'Doanh nghiệp'
  const bookingPath = isBusinessMode
    ? `/business-requests/create?tour=${tour.MaTour}`
    : `/bookings/create/${tour.MaTour}`

  let bookingLabel = ''
  let isBookingDisabled = false

  if (isBusinessMode) {
    if (tour.TrangThai === 'Ngừng hoạt động') {
      bookingLabel = 'TOUR ĐÃ NGỪNG KHAI THÁC'
      isBookingDisabled = true
    } else {
      bookingLabel = 'GỬI YÊU CẦU DOANH NGHIỆP'
    }
  } else {
    if (tour.TrangThai === 'Ngừng hoạt động') {
      bookingLabel = 'TOUR ĐÃ NGỪNG KHAI THÁC'
      isBookingDisabled = true
    } else if (tour.TrangThai === 'Hết chỗ') {
      bookingLabel = 'TOUR ĐÃ HẾT CHỖ'
      isBookingDisabled = true
    } else if (tour.TienDo === 'Đang diễn ra') {
      bookingLabel = 'TOUR ĐÃ KHỞI HÀNH'
      isBookingDisabled = true
    } else if (tour.TienDo === 'Đã hoàn tất') {
      bookingLabel = 'TOUR ĐÃ KẾT THÚC'
      isBookingDisabled = true
    } else {
      bookingLabel = 'ĐẶT TOUR'
    }
  }
  const loginMessage = isBusinessMode
    ? 'Bạn cần đăng nhập hoặc đăng ký để gửi yêu cầu tour doanh nghiệp.'
    : 'Bạn cần đăng nhập hoặc đăng ký để tiến hành đặt tour.'

  const totalSeats = Number(tour.SoCho) || 0
  const bookedSeats = Number(tour.SoChoDaDat) || 0
  const availableSeats = Math.max(0, totalSeats - bookedSeats)
  const bookedPercent = totalSeats > 0 ? Math.min(100, (bookedSeats / totalSeats) * 100) : 0
  
  let progressColor = 'bg-success'
  if (bookedPercent >= 90) progressColor = 'bg-danger'
  else if (bookedPercent >= 60) progressColor = 'bg-warning'

  return (
    <div className="container tour-detail-wrapper">
      <h2 className="fw-bold mb-3 tour-detail-title">{tour.TenTour}</h2>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="tour-main-img position-relative mb-3">
            <img src={buildImageUrl(tourImagePath(tour))} className="img-fluid w-100 rounded-4" alt="" />
            {discount > 0 && <div className="tour-detail-discount">-{discount}%</div>}
          </div>

          {images.length > 1 && (
            <div className="tour-gallery d-flex gap-3 flex-wrap">
              {images.filter((image) => image.DuongDan !== tourImagePath(tour)).map((image) => (
                <div className="tour-gallery-item" key={image.MaAnh || image.DuongDan}>
                  <img src={buildImageUrl(image.image_url || image.DuongDan)} className="img-fluid rounded-3" alt="" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="tour-info-card shadow-sm rounded-4 p-3">
            <p className="mb-2"><i className="fa-solid fa-location-dot text-danger me-2"></i><strong>Địa điểm:</strong> {tour.DiaDiem}</p>
            <p className="mb-2"><i className="fa-regular fa-clock text-primary me-2"></i><strong>Thời lượng:</strong> {tour.ThoiLuong}</p>
            {!isBusinessMode && (
              <p className="mb-3"><i className="fa-regular fa-calendar-days text-primary me-2"></i><strong>Khởi hành:</strong> {formatDate(tour.NgayKhoiHanh)}</p>
            )}
            
            {!isBusinessMode && (
              <div className="mb-3 p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-end mb-2">
                  <span className="fw-bold text-dark"><i className="fa-solid fa-users me-2 text-secondary"></i>Tình trạng chỗ</span>
                  <span className="badge bg-white text-dark border shadow-sm">Còn {availableSeats} chỗ</span>
                </div>
                <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                  <div 
                    className={`progress-bar ${progressColor}`} 
                    role="progressbar" 
                    style={{ width: `${bookedPercent}%` }} 
                    aria-valuenow={bookedPercent} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <div className="d-flex justify-content-between mt-2" style={{ fontSize: '0.8rem' }}>
                  <span className="text-muted">Đã đặt: <strong>{bookedSeats}</strong></span>
                  <span className="text-muted">Tổng: <strong>{totalSeats}</strong></span>
                </div>
              </div>
            )}
            <hr />
            <p className="mb-1">
              <span className="text-muted">Giá gốc:</span>
              <span className="text-decoration-line-through ms-1">{formatCurrency(tour.GiaGoc)}</span>
            </p>
            <p className="tour-detail-price mb-3">
              <span>Giá chỉ còn:</span>
              <span className="ms-2">{formatCurrency(tour.GiaGiam)}</span>
            </p>
            {isBookingDisabled ? (
              <button className="btn btn-secondary w-100 fw-bold py-2" disabled style={{ cursor: 'not-allowed', opacity: 0.8 }}>
                {bookingLabel}
              </button>
            ) : (
              <Link
                to={bookingPath}
                className="btn btn-book-detail w-100"
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault()
                    setShowLoginModal(true)
                  }
                }}
              >
                {bookingLabel}
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
            <div className="text-muted">
              <i className="fa-solid fa-star text-warning me-1"></i>
              {stats.average_rating || (state.reviews.length ? (state.reviews.reduce((acc, curr) => acc + Number(curr.SoSao || 0), 0) / state.reviews.length).toFixed(1) : 0)}/5 • {stats.total_reviews || state.reviews.length} đánh giá
            </div>
          </div>
          {!user && <span className="badge bg-secondary p-2">Đăng nhập để đánh giá</span>}
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
                <div className="mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <i key={i} className={`${i < Number(review.SoSao) ? 'fa-solid' : 'fa-regular'} fa-star text-warning`}></i>
                  ))}
                </div>
                {review.NoiDung && <div className="mt-2">{review.NoiDung}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showLoginModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 pb-0">
                <button type="button" className="btn-close" onClick={() => setShowLoginModal(false)}></button>
              </div>
              <div className="modal-body text-center pt-2 pb-4">
                <div className="mb-3">
                  <div style={{ width: '80px', height: '80px', background: '#fff2f2', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fa-solid fa-lock text-danger" style={{ fontSize: '2rem' }}></i>
                  </div>
                </div>
                <h4 className="fw-bold mb-2">Yêu cầu đăng nhập</h4>
                <p className="text-muted mb-4 px-3">{loginMessage}</p>
                <div className="d-flex justify-content-center gap-2 px-3">
                  <button type="button" className="btn btn-light px-4 fw-bold rounded-pill" onClick={() => setShowLoginModal(false)}>Hủy</button>
                  <Link to={`/auth/login?redirect=${encodeURIComponent(bookingPath)}`} className="btn btn-primary px-4 fw-bold rounded-pill" style={{ background: '#1a5cb0', border: 'none' }}>Đăng nhập / Đăng ký</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
