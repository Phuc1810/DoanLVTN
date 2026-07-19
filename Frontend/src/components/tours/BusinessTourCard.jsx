import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'
import { buildImageUrl, tourImagePath } from '../../utils/imageUrl'

export default function BusinessTourCard({ tour }) {
  const navigate = useNavigate()
  const discount = Number(tour.discount_percent || tour.PhanTramGiam || 0)

  const reviews = tour.danh_gias || tour.danhGias || []
  let averageRating = tour.review_stats?.average_rating
  if (!averageRating && reviews.length > 0) {
    const sum = reviews.reduce((acc, curr) => acc + Number(curr.SoSao || 0), 0)
    averageRating = (sum / reviews.length).toFixed(1)
  }

  return (
    <div 
      className="tour-card shadow-sm"
      onClick={() => navigate(`/business-tours/${tour.MaTour}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="tour-img">
        <img src={buildImageUrl(tourImagePath(tour))} alt={tour.TenTour || ''} />
      </div>

      {discount > 0 ? (
        <div className="tour-discount-badge">-{discount}%</div>
      ) : null}

      <div className="tour-body p-3">
        <h5 className="fw-bold mb-1">{tour.TenTour}</h5>
        <p className="text-muted mb-2">
          <i className="fa-solid fa-location-dot text-danger"></i> {tour.DiaDiem}
        </p>
        <hr className="my-2" style={{ opacity: 0.15 }} />
        <div className="d-flex justify-content-between align-items-end pt-1">
          <div className="d-flex flex-column">
            {Number(tour.GiaGoc) > Number(tour.GiaGiam) && (
              <span className="text-muted text-decoration-line-through mb-1" style={{ fontSize: 13, lineHeight: 1 }}>
                {formatCurrency(tour.GiaGoc)}
              </span>
            )}
            <span className="fw-bold text-danger mb-0" style={{ fontSize: 18, lineHeight: 1 }}>
              {formatCurrency(tour.GiaGiam)}
            </span>
          </div>
          <div className="text-muted d-flex align-items-center pb-1" style={{ fontSize: 15, lineHeight: 1 }}>
            <i className="fa-solid fa-star text-warning me-1"></i>
            <span className="fw-medium">{averageRating ? Number(averageRating).toFixed(1) : '0'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
