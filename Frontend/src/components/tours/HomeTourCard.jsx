import { Link } from 'react-router-dom'
import { formatCurrency } from '../../utils/formatCurrency'
import { buildImageUrl } from '../../utils/imageUrl'

export default function HomeTourCard({ tour }) {
  return (
    <div className="tour-card">
      <div className="tour-img">
        <img src={buildImageUrl(tour.image_url || tour.AnhChinh)} alt={tour.TenTour || ''} />
        <div className="tour-overlay">
          <h5 className="tour-title">{tour.TenTour}</h5>
          <p className="tour-price">Giá: {formatCurrency(tour.GiaGiam)}</p>
          <Link to={`/tours/${tour.MaTour}`} className="btn datngay-btn">
            ĐẶT NGAY
          </Link>
        </div>
      </div>
    </div>
  )
}
