import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { staffTourApi } from '../../api/staffTourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { extractItem, firstImageOfTour, imageSrc, normalizeError } from './staffPageUtils'
import { Map, Clock, MapPin, Tag, Users, Calendar, ArrowLeft, Edit } from 'lucide-react'
import '../../assets/css/nhanvien.css'

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
  const lichTrinh = tour.lich_trinh || []

  return (
    <div className="staff-tour-detail-container">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/staff/tours" className="text-muted text-decoration-none d-flex align-items-center mb-2">
            <ArrowLeft size={16} className="me-1" /> Quay lại danh sách Tour
          </Link>
          <h1 className="page-title mb-0 fs-3 fw-bold">{tour.TenTour}</h1>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn-primary d-flex align-items-center" to={`/staff/tours/${id}/edit`}>
            <Edit size={16} className="me-2" /> Sửa Tour
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Overview & Details */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div style={{ height: '300px', backgroundColor: '#f3f4f6' }}>
              <img 
                src={imageSrc(firstImageOfTour(tour))} 
                alt={tour.TenTour} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 border-bottom pb-2">Thông tin chung</h5>
              
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start">
                  <div className="bg-light p-2 rounded me-3 text-primary"><Tag size={20} /></div>
                  <div>
                    <div className="text-muted small">Mã tour / Trạng thái</div>
                    <div className="fw-semibold">#{tour.MaTour} <span className="mx-2">•</span> <StaffStatusBadge status={tour.TrangThai} /></div>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <div className="bg-light p-2 rounded me-3 text-primary"><MapPin size={20} /></div>
                  <div>
                    <div className="text-muted small">Địa điểm</div>
                    <div className="fw-semibold">{tour.DiaDiem}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <div className="bg-light p-2 rounded me-3 text-primary"><Clock size={20} /></div>
                  <div>
                    <div className="text-muted small">Thời lượng / Miền</div>
                    <div className="fw-semibold">{tour.ThoiLuong} <span className="mx-2">•</span> {tour.Mien}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <div className="bg-light p-2 rounded me-3 text-primary"><Calendar size={20} /></div>
                  <div>
                    <div className="text-muted small">Khởi hành - Kết thúc</div>
                    <div className="fw-semibold">{formatDate(tour.NgayKhoiHanh)} <span className="mx-2">→</span> {formatDate(tour.NgayKetThuc)}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <div className="bg-light p-2 rounded me-3 text-primary"><Users size={20} /></div>
                  <div>
                    <div className="text-muted small">Số chỗ đã đặt / Tổng số chỗ</div>
                    <div className="fw-semibold">
                      <span className={tour.SoChoDaDat >= tour.SoCho ? 'text-danger' : 'text-success'}>
                        {tour.SoChoDaDat || 0}
                      </span> / {tour.SoCho || 0} chỗ
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Giá vé:</span>
                  <span className="fs-4 fw-bold text-danger">{formatCurrency(tour.GiaGiam || tour.GiaGoc)}</span>
                </div>
                {tour.GiaGiam > 0 && tour.GiaGiam < tour.GiaGoc && (
                  <div className="text-end">
                    <span className="text-muted text-decoration-line-through small">{formatCurrency(tour.GiaGoc)}</span>
                    <span className="badge bg-danger ms-2">-{tour.PhanTramGiam}%</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Itinerary */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 border-bottom pb-2 d-flex align-items-center">
                <Map className="me-2 text-primary" /> Lịch trình chi tiết
              </h5>
              
              {lichTrinh.length > 0 ? (
                <div className="timeline-container">
                  {lichTrinh.map((day, index) => (
                    <div key={day.MaLT || index} className="timeline-item">
                      <div className="timeline-marker bg-primary"></div>
                      <div className="timeline-content pb-4">
                        <h6 className="fw-bold text-primary mb-1">Ngày {day.NgayThu}: {day.TieuDe}</h6>
                        <div 
                          className="text-muted small" 
                          dangerouslySetInnerHTML={{ __html: day.NoiDung }} 
                          style={{ lineHeight: '1.6' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-5 text-muted">
                  <Map size={48} className="opacity-25 mb-3 mx-auto" />
                  <p>Tour này chưa có lịch trình chi tiết.</p>
                  <Link to={`/staff/tours/${id}/edit`} className="btn btn-outline-primary btn-sm mt-2">
                    Cập nhật lịch trình
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
