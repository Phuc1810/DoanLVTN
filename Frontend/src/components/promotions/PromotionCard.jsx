import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl } from '../../utils/imageUrl'

export default function PromotionCard({ promotion }) {
  return (
    <div className="km-card h-100">
      <div className="km-img-box position-relative">
        <img src={buildImageUrl(promotion.image_url || promotion.AnhDaiDien)} className="km-img" alt="" />
        {promotion.TrangThai === 'Sắp diễn ra' && (
          <span className="status-badge bg-sap-dien-ra">Sắp diễn ra</span>
        )}
        {Number(promotion.PhanTramGiam) > 0 && (
          <span className="km-badge">-{Number(promotion.PhanTramGiam)}%</span>
        )}
      </div>
      <div className="km-body">
        <h5 className="km-name text-truncate" title={promotion.TenKM}>
          {promotion.TenKM}
        </h5>
        <p className="km-time mb-1 text-muted small">
          <i className="fa-regular fa-calendar-days me-1"></i>
          {formatDate(promotion.NgayBatDau)} - {formatDate(promotion.NgayKetThuc)}
        </p>
        <p className="km-desc text-secondary">{String(promotion.NoiDung || '').slice(0, 120)}</p>
        <Link to={`/promotions/${promotion.MaCTKM}`} className="btn btn-km-view w-100 mt-2">
          XEM CÁC TOUR ÁP DỤNG
        </Link>
      </div>
    </div>
  )
}
