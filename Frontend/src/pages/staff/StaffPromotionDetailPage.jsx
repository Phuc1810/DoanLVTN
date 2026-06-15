import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { staffPromotionApi } from '../../api/staffPromotionApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { formatDate } from '../../utils/formatDate'
import { extractItem, imageSrc, normalizeError } from './staffPageUtils'

export default function StaffPromotionDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', item: null })

  useEffect(() => {
    staffPromotionApi.show(id)
      .then((payload) => setState({ loading: false, error: '', item: extractItem(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, item: null }))
  }, [id])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />
  const item = state.item || {}
  const tours = item.tours || item.tour_khuyenmai || []
  return (
    <>
      <div className="page-header"><h1 className="page-title">{item.TenKM}</h1><div className="page-header-actions"><Link className="staff-link-btn secondary" to="/staff/promotions">Quay lại</Link><Link className="staff-link-btn primary" to={`/staff/promotions/${id}/edit`}>Sửa</Link></div></div>
      <div className="staff-detail-card">
        <img className="staff-image-preview mb-4" src={imageSrc(item.AnhDaiDien)} alt={item.TenKM} />
        <div className="staff-detail-grid">
          <div className="staff-detail-item"><span>Mã</span><strong>#{item.MaCTKM}</strong></div>
          <div className="staff-detail-item"><span>Trạng thái</span><StaffStatusBadge status={item.TrangThai} /></div>
          <div className="staff-detail-item"><span>Phần trăm giảm</span><div>{item.PhanTramGiam}%</div></div>
          <div className="staff-detail-item"><span>Thời gian</span><div>{formatDate(item.NgayBatDau)} - {formatDate(item.NgayKetThuc)}</div></div>
          <div className="staff-detail-item"><span>Nội dung</span><div>{item.NoiDung}</div></div>
          <div className="staff-detail-item"><span>Tour áp dụng</span><div>{Array.isArray(tours) ? tours.length : 0} tour</div></div>
        </div>
      </div>
    </>
  )
}
