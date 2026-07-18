import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { staffPromotionApi } from '../../api/staffPromotionApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import { extractItem, imageSrc, normalizeError } from './staffPageUtils'
import { Calendar, ArrowLeft, Edit, Percent, Map as MapIcon, Image as ImageIcon } from 'lucide-react'
import '../../assets/css/nhanvien.css'

export default function StaffPromotionDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', promotion: null })

  useEffect(() => {
    staffPromotionApi.show(id)
      .then((payload) => setState({ loading: false, error: '', promotion: extractItem(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, promotion: null }))
  }, [id])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const promotion = state.promotion || {}
  const tours = promotion.tours || promotion.tour_khuyenmai || []

  return (
    <div className="staff-promotion-detail-container">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/staff/promotions" className="text-muted text-decoration-none d-flex align-items-center mb-2">
            <ArrowLeft size={16} className="me-1" /> Quay lại danh sách Khuyến mãi
          </Link>
          <h1 className="page-title mb-0 fs-3 fw-bold">Chi tiết Chương trình Khuyến mãi</h1>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn-primary d-flex align-items-center" to={`/staff/promotions/${id}/edit`}>
            <Edit size={16} className="me-2" /> Sửa Khuyến mãi
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Cover & Meta */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 sticky-top" style={{ top: '100px' }}>
            <div style={{ height: '240px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {promotion.image_url || promotion.AnhDaiDien ? (
                <img 
                  src={imageSrc(promotion.image_url || promotion.AnhDaiDien)} 
                  alt={promotion.TenKM} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <ImageIcon size={48} className="text-muted opacity-25" />
              )}
            </div>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 border-bottom pb-2">Thông tin chương trình</h5>
              
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start">
                  <div className="bg-light p-2 rounded me-3 text-primary"><Percent size={18} /></div>
                  <div>
                    <div className="text-muted small">Phần trăm giảm mặc định</div>
                    <div className="fw-semibold text-danger">{promotion.PhanTramGiam}%</div>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <div className="bg-light p-2 rounded me-3 text-primary"><Calendar size={18} /></div>
                  <div>
                    <div className="text-muted small">Thời gian áp dụng</div>
                    <div className="fw-semibold">{formatDate(promotion.NgayBatDau)} - {formatDate(promotion.NgayKetThuc)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top text-center d-flex align-items-center justify-content-between">
                <span className="text-muted">Trạng thái:</span>
                <StaffStatusBadge status={promotion.TrangThai} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Content & Tours */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body p-4">
              <h2 className="fw-bold text-dark mb-3 lh-base">{promotion.TenKM}</h2>
              
              <div 
                className="promotion-content-wrapper text-muted" 
                dangerouslySetInnerHTML={{ __html: promotion.NoiDung || 'Chưa có nội dung mô tả.' }}
                style={{ lineHeight: '1.6', fontSize: '15px' }}
              />
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 border-bottom pb-2 d-flex align-items-center">
                <MapIcon className="me-2 text-primary" size={20} /> 
                Danh sách Tour được áp dụng ({tours.length})
              </h5>

              {tours.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="py-3 ps-3 text-muted" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Mã</th>
                        <th className="py-3 text-muted" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Tour</th>
                        <th className="py-3 text-muted text-end" style={{ fontSize: '12px', textTransform: 'uppercase' }}>Giá gốc</th>
                        <th className="py-3 text-muted text-end pe-3" style={{ fontSize: '12px', textTransform: 'uppercase' }}>% Giảm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tours.map((tour) => (
                        <tr key={tour.MaTour}>
                          <td className="ps-3 fw-bold text-dark">#{tour.MaTour}</td>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              {tour.AnhChinh || tour.image_url ? (
                                <img src={imageSrc(tour.AnhChinh || tour.image_url)} alt={tour.TenTour} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ImageIcon size={16} className="text-muted" />
                                </div>
                              )}
                              <div>
                                <div className="fw-semibold text-truncate" style={{ maxWidth: '250px' }}>{tour.TenTour}</div>
                                <div className="small text-muted">{tour.DiaDiem}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-end fw-semibold">{formatCurrency(tour.GiaGoc)}</td>
                          <td className="text-end pe-3">
                            <span className="badge bg-danger">
                              -{tour.PhanTramGiamKM || promotion.PhanTramGiam}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-5 text-muted">
                  <MapIcon size={48} className="opacity-25 mb-3 mx-auto" />
                  <p>Chưa có tour nào được áp dụng cho chương trình này.</p>
                  <Link to={`/staff/promotions/${id}/edit`} className="btn btn-outline-primary btn-sm mt-2">
                    Thêm Tour ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
