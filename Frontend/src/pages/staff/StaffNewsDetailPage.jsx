import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { staffNewsApi } from '../../api/staffNewsApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { formatDate } from '../../utils/formatDate'
import { extractItem, imageSrc, normalizeError } from './staffPageUtils'
import { Eye, Calendar, ArrowLeft, Edit, User, Image as ImageIcon } from 'lucide-react'
import '../../assets/css/nhanvien.css'

export default function StaffNewsDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', news: null })

  useEffect(() => {
    staffNewsApi.show(id)
      .then((payload) => setState({ loading: false, error: '', news: extractItem(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, news: null }))
  }, [id])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const news = state.news || {}

  return (
    <div className="staff-news-detail-container">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/staff/news" className="text-muted text-decoration-none d-flex align-items-center mb-2">
            <ArrowLeft size={16} className="me-1" /> Quay lại danh sách Tin tức
          </Link>
          <h1 className="page-title mb-0 fs-3 fw-bold">Chi tiết Bài viết</h1>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn-primary d-flex align-items-center" to={`/staff/news/${id}/edit`}>
            <Edit size={16} className="me-2" /> Sửa Bài viết
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Cover & Meta */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 sticky-top" style={{ top: '100px' }}>
            <div style={{ height: '240px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {news.image_url || news.AnhDaiDien ? (
                <img 
                  src={imageSrc(news.image_url || news.AnhDaiDien)} 
                  alt={news.TieuDe} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <ImageIcon size={48} className="text-muted opacity-25" />
              )}
            </div>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 border-bottom pb-2">Thông tin bài viết</h5>
              
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start">
                  <div className="bg-light p-2 rounded me-3 text-primary"><User size={18} /></div>
                  <div>
                    <div className="text-muted small">Người đăng</div>
                    <div className="fw-semibold">{news.nguoi_dang || 'Admin'}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <div className="bg-light p-2 rounded me-3 text-primary"><Calendar size={18} /></div>
                  <div>
                    <div className="text-muted small">Ngày đăng</div>
                    <div className="fw-semibold">{formatDate(news.NgayDang)}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <div className="bg-light p-2 rounded me-3 text-primary"><Eye size={18} /></div>
                  <div>
                    <div className="text-muted small">Lượt xem</div>
                    <div className="fw-semibold">{news.LuotXem || 0} lượt</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top text-center">
                <StaffStatusBadge status={news.TrangThai} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 p-md-5">
              <h2 className="fw-bold text-dark mb-3 lh-base">{news.TieuDe}</h2>
              
              {news.TomTat && (
                <div className="alert alert-light border-start border-primary border-4 text-secondary fst-italic mb-4 lh-lg">
                  {news.TomTat}
                </div>
              )}

              <hr className="my-4 text-muted opacity-25" />

              <div 
                className="news-content-wrapper" 
                dangerouslySetInnerHTML={{ __html: news.NoiDung || '<p class="text-muted text-center py-5">Bài viết chưa có nội dung.</p>' }}
                style={{ lineHeight: '1.8', fontSize: '15px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
