import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { promotionApi } from '../../api/promotionApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import TourGrid from '../../components/tours/TourGrid'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl, promotionImagePath } from '../../utils/imageUrl'

export default function PromotionDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', promotion: null })

  useEffect(() => {
    promotionApi.detail(id)
      .then((promotion) => setState({ loading: false, error: '', promotion }))
      .catch((error) => setState({ loading: false, error: error.message, promotion: null }))
  }, [id])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />
  const promotion = state.promotion

  return (
    <div className="container km-detail-wrapper">
      <h2 className="fw-bold text-center mb-4 km-detail-title">{promotion.TenKM}</h2>
      <div className="row g-4 mb-5">
        <div className="col-lg-5">
          <img src={buildImageUrl(promotionImagePath(promotion))} className="img-fluid rounded-4 shadow-sm" alt="" />
        </div>
        <div className="col-lg-7">
          <div className="km-detail-card">
            <h4 className="fw-bold">{promotion.TenKM}</h4>
            <p><i className="fa-regular fa-calendar-days me-1"></i>{formatDate(promotion.NgayBatDau)} - {formatDate(promotion.NgayKetThuc)}</p>
            <p className="fw-bold text-danger">Giảm {promotion.PhanTramGiam}%</p>
            <p>{promotion.NoiDung}</p>
          </div>
        </div>
      </div>
      <h3 className="fw-bold text-center mb-4">TOUR ÁP DỤNG</h3>
      <div className="search-results-area">
        <TourGrid tours={promotion.tours || []} />
      </div>
    </div>
  )
}
