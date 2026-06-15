import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'
import { buildImageUrl, tourImagePath } from '../../utils/imageUrl'

export default function TourCard({ tour }) {
  const discount = Number(tour.discount_percent || tour.PhanTramGiam || 0)

  return (
    <div className="tour-card shadow-sm">
      <div className="tour-img">
        <img src={buildImageUrl(tourImagePath(tour))} alt={tour.TenTour || ''} />
      </div>

      {discount > 0 && <div className="tour-discount-badge">-{discount}%</div>}

      <div className="tour-body p-3">
        <h5 className="fw-bold mb-1">{tour.TenTour}</h5>
        <p className="text-muted mb-1">
          <i className="fa-solid fa-location-dot text-danger"></i> {tour.DiaDiem}
        </p>
        <p className="fw-bold text-danger mb-2 mb-0">
          {formatCurrency(tour.GiaGiam)}
          {Number(tour.GiaGoc) > Number(tour.GiaGiam) && (
            <span className="text-muted text-decoration-line-through ms-1" style={{ fontSize: 14 }}>
              {formatCurrency(tour.GiaGoc)}
            </span>
          )}
        </p>
        <Link to={`/tours/${tour.MaTour}`} className="btn btn-book w-100 mt-3">
          ĐẶT TOUR
        </Link>
      </div>
    </div>
  )
}
