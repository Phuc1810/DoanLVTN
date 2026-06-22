import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'
import { buildImageUrl, tourImagePath } from '../../utils/imageUrl'

export default function BusinessTourCard({ tour }) {
  const discount = Number(tour.PhanTramGiam || tour.discount_percent || 0)
  const hasSale = Number(tour.GiaGiam) > 0 && Number(tour.GiaGiam) < Number(tour.GiaGoc)
  const displayPrice = hasSale ? tour.GiaGiam : tour.GiaGoc

  return (
    <div className="tour-card">
      <div className="thumb-wrap">
        {tourImagePath(tour) ? (
          <img className="thumb" src={buildImageUrl(tourImagePath(tour))} alt={tour.TenTour || ''} />
        ) : (
          <div className="thumb thumb-placeholder"></div>
        )}
        {discount > 0 && <div className="badge-sale">-{discount}%</div>}
      </div>

      <div className="card-bodyx">
        <div className="tour-name">{tour.TenTour}</div>
        <div className="tour-loc">
          <i className="fa-solid fa-location-dot loc-ic"></i>
          <span>{tour.DiaDiem}</span>
        </div>
        <div className="price-row">
          <div className="price-new">{formatCurrency(displayPrice)}</div>
          {hasSale && <div className="price-old">{formatCurrency(tour.GiaGoc)}</div>}
        </div>
        <Link className="btn btn-view" to={`/business-tours/${tour.MaTour}`} style={{ color: 'black' }}>
          XEM TOUR
        </Link>
      </div>
    </div>
  )
}
