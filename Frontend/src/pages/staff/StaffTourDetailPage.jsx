import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { staffTourApi } from '../../api/staffTourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { extractItem, firstImageOfTour, imageSrc, normalizeError } from './staffPageUtils'

export default function StaffTourDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', tour: null })

  useEffect(() => {
    staffTourApi.show(id)
      .then((payload) => setState({ loading: false, error: '', tour: extractItem(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, tour: null }))
  }, [id])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const tour = state.tour || {}
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{tour.TenTour}</h1>
        <div className="page-header-actions"><Link className="staff-link-btn secondary" to="/staff/tours">Quay lại</Link><Link className="staff-link-btn primary" to={`/staff/tours/${id}/edit`}>Sửa</Link></div>
      </div>
      <div className="staff-detail-card">
        <img className="staff-image-preview mb-4" src={imageSrc(firstImageOfTour(tour))} alt={tour.TenTour} />
        <div className="staff-detail-grid">
          <div className="staff-detail-item"><span>Mã tour</span><strong>#{tour.MaTour}</strong></div>
          <div className="staff-detail-item"><span>Trạng thái</span><StaffStatusBadge status={tour.TrangThai} /></div>
          <div className="staff-detail-item"><span>Địa điểm</span><div>{tour.DiaDiem}</div></div>
          <div className="staff-detail-item"><span>Giá</span><div>{formatCurrency(tour.GiaGiam || tour.GiaGoc)}</div></div>
          <div className="staff-detail-item"><span>Ngày khởi hành</span><div>{formatDate(tour.NgayKhoiHanh)}</div></div>
          <div className="staff-detail-item"><span>Ngày kết thúc</span><div>{formatDate(tour.NgayKetThuc)}</div></div>
          <div className="staff-detail-item"><span>Số chỗ</span><div>{tour.SoChoDaDat || 0}/{tour.SoCho || 0}</div></div>
          <div className="staff-detail-item"><span>Loại tour</span><div>{tour.LoaiTour || tour.Mien}</div></div>
        </div>
      </div>
    </>
  )
}
