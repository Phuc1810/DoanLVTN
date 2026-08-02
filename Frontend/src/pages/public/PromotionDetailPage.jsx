import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { promotionApi } from '../../api/promotionApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import TourGrid from '../../components/tours/TourGrid'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl, promotionImagePath } from '../../utils/imageUrl'
import '../../styles/promotion-detail.css'

export default function PromotionDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', promotion: null })
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    promotionApi.detail(id)
      .then((promotion) => setState({ loading: false, error: '', promotion }))
      .catch((error) => setState({ loading: false, error: error.message, promotion: null }))
  }, [id])

  useEffect(() => {
    if (!state.promotion) return

    const endDate = new Date(state.promotion.NgayKetThuc).getTime()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = endDate - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [state.promotion])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />
  const promotion = state.promotion

  const isExpired = new Date(promotion.NgayKetThuc).getTime() < new Date().getTime()

  return (
    <div className="promotion-detail-page bg-light" style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Hero Banner */}
      <div 
        className="promo-hero-section" 
        style={{ backgroundImage: `url(${buildImageUrl(promotionImagePath(promotion))})` }}
      >
        <div className="promo-hero-overlay"></div>
        <div className="promo-hero-content">
          <div className="glass-badge">
            <i className="fa-regular fa-calendar-days"></i>
            {formatDate(promotion.NgayBatDau)} - {formatDate(promotion.NgayKetThuc)}
          </div>
          
          <h1 className="promo-title">{promotion.TenKM}</h1>
          
          <div className="glass-badge discount-pulse">
            <i className="fa-solid fa-tags"></i> GIẢM ĐẾN {promotion.PhanTramGiam}%
          </div>

          {!isExpired ? (
            <div className="countdown-wrapper">
              <div className="countdown-box">
                <div className="countdown-number">{String(timeLeft.days).padStart(2, '0')}</div>
                <div className="countdown-label">Ngày</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="countdown-label">Giờ</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="countdown-label">Phút</div>
              </div>
              <div className="countdown-box">
                <div className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="countdown-label">Giây</div>
              </div>
            </div>
          ) : (
            <div className="countdown-wrapper">
              <div className="glass-badge" style={{ background: 'rgba(0,0,0,0.7)', color: '#ffc107', border: '1px solid #ffc107' }}>
                <i className="fa-solid fa-clock-rotate-left"></i> CHƯƠNG TRÌNH ĐÃ KẾT THÚC
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        {/* Nội dung chi tiết */}
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="promo-details-card">
              <h4 className="fw-bold mb-4" style={{ color: '#2b6cb0' }}>
                <i className="fa-solid fa-circle-info me-2"></i>Chi tiết chương trình
              </h4>
              <div className="promo-details-content">
                {promotion.NoiDung.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách Tour áp dụng */}
        <div className="section-divider">
          <h2 className="section-title">
            <i className="fa-solid fa-plane-departure text-primary me-3"></i>
            TOUR ÁP DỤNG KHUYẾN MÃI
          </h2>
        </div>
        
        <div className="search-results-area mt-4">
          {promotion.tours && promotion.tours.length > 0 ? (
            <TourGrid tours={promotion.tours} />
          ) : (
            <div className="text-center py-5">
              <img src="/images/empty-state.svg" alt="Empty" style={{ width: '150px', opacity: 0.5 }} className="mb-3" />
              <h5 className="text-muted">Chưa có tour nào được áp dụng cho khuyến mãi này.</h5>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
