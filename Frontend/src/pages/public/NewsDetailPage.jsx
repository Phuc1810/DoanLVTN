import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { newsApi } from '../../api/newsApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl, newsImagePath } from '../../utils/imageUrl'
import { sanitizeHtml } from '../../utils/sanitizeHtml'

export default function NewsDetailPage() {
  const { id } = useParams()
  const { user, isCustomer } = useAuth()
  const [state, setState] = useState({ loading: true, error: '', news: null })
  const [relatedNews, setRelatedNews] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentError, setCommentError] = useState('')

  const fetchComments = () => {
    newsApi.getComments(id)
      .then((res) => setComments(res.data || res))
      .catch(console.error)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    setState(prev => ({ ...prev, loading: true, error: '' }))
    
    // Fetch detail
    newsApi.detail(id)
      .then((news) => {
        setState({ loading: false, error: '', news: news.data || news })
        fetchComments()
      })
      .catch((error) => setState({ loading: false, error: error.message, news: null }))

    // Fetch related
    newsApi.list({ trang_thai: 'Hiển thị', per_page: 5 })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || [])
        // Filter out current news
        setRelatedNews(list.filter(item => item.MaTin !== parseInt(id)).slice(0, 5))
      })
      .catch(console.error)
  }, [id])

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    setCommentError('')
    newsApi.postComment(id, newComment)
      .then(() => {
        setNewComment('')
        fetchComments()
      })
      .catch((err) => {
        setCommentError(err?.response?.data?.message || 'Có lỗi xảy ra khi gửi bình luận')
      })
      .finally(() => setIsSubmitting(false))
  }

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const news = state.news

  return (
    <div className="container py-5" style={{ marginTop: '120px' }}>
      <style>{`
        .related-news-item {
          transition: all 0.3s ease;
          border-radius: 12px;
          padding: 8px;
          margin: -8px;
        }
        .related-news-item:hover {
          background-color: #f8f9fa;
          transform: translateY(-3px);
        }
        .related-news-item:hover .related-news-title {
          color: #0d6efd;
        }
        .related-news-img-wrapper {
          overflow: hidden;
          border-radius: 8px;
        }
        .related-news-img {
          transition: transform 0.5s ease;
        }
        .related-news-item:hover .related-news-img {
          transform: scale(1.08);
        }
      `}</style>
      <div className="row">
        {/* Left Column: Main Content */}
        <div className="col-lg-8 pe-lg-5">
          {/* Title */}
          <h1 className="fw-bold mb-4 text-dark" style={{ fontSize: '2.5rem', lineHeight: '1.3', letterSpacing: '-0.02em' }}>
            {news.TieuDe}
          </h1>

          {/* Meta Info */}
          <div className="d-flex flex-wrap align-items-center text-muted mb-4 pb-4 border-bottom gap-4">
            <div className="d-flex align-items-center">
              <i className="fa-regular fa-calendar-days me-2 text-primary"></i>
              <span className="fw-medium">{formatDate(news.NgayDang)}</span>
            </div>
            <div className="d-flex align-items-center">
              <i className="fa-regular fa-folder-open me-2 text-primary"></i>
              <span className="fw-medium">
                {news.LoaiTin === 'tintuc' ? 'Tin tức' : news.LoaiTin === 'kinhnghiem' ? 'Kinh nghiệm' : (news.LoaiTin || 'Tin tức')}
              </span>
            </div>
            {news.LuotXem > 0 && (
              <div className="d-flex align-items-center">
                <i className="fa-regular fa-eye me-2 text-primary"></i>
                <span className="fw-medium">{news.LuotXem} lượt xem</span>
              </div>
            )}
          </div>

          {/* Summary */}
          {news.MoTa && (
            <p className="lead fw-semibold text-secondary mb-5" style={{ fontSize: '1.25rem', lineHeight: '1.7' }}>
              {news.MoTa}
            </p>
          )}

          {/* Featured Image */}
          <div className="mb-5 position-relative">
            <img 
              src={buildImageUrl(newsImagePath(news))} 
              className="w-100 rounded-4 shadow-sm" 
              alt={news.TieuDe} 
              style={{ objectFit: 'cover', maxHeight: '500px' }} 
            />
          </div>

          {/* Main Content */}
          <div 
            className="news-detail-content mb-5" 
            style={{ fontSize: '1.1rem', lineHeight: '1.9', color: '#334155' }} 
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(news.NoiDung || '') }} 
          />

          <hr className="my-5 opacity-25" />

          {/* Comments Section */}
          <div className="news-comments-section mb-5">
            <div className="d-flex justify-content-between align-items-center mb-5">
              <h4 className="fw-bold mb-0 text-dark">Bình luận ({comments.length})</h4>
              {!isCustomer && (
                <Link to="/auth/login" className="btn btn-outline-primary rounded-pill px-4 fw-medium">
                  Đăng nhập để bình luận
                </Link>
              )}
            </div>
            
            {isCustomer && (
              <form onSubmit={handleCommentSubmit} className="mb-5 bg-white p-4 rounded-4 shadow-sm border border-light">
                <div className="d-flex mb-3">
                  <div className="me-3 d-none d-sm-block">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                      {(user?.HoTen || user?.Ho_Ten || 'U')[0]}
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <textarea 
                      className="form-control border-0 bg-light rounded-3 p-3" 
                      rows="3" 
                      placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..." 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={isSubmitting}
                      style={{ resize: 'none', boxShadow: 'none' }}
                    ></textarea>
                  </div>
                </div>
                {commentError && <div className="text-danger mb-3 small fw-medium"><i className="fa-solid fa-circle-exclamation me-1"></i>{commentError}</div>}
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary px-5 rounded-pill fw-medium shadow-sm" disabled={isSubmitting || !newComment.trim()}>
                    {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang gửi...</> : 'Gửi bình luận'}
                  </button>
                </div>
              </form>
            )}

            <div className="comments-list">
              {comments.map((comment, idx) => (
                <div key={idx} className="d-flex mb-4">
                  <div className="me-3 mt-1">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                      {(comment.khach_hang?.HoTen || 'K')[0]}
                    </div>
                  </div>
                  <div className="flex-grow-1 bg-white p-4 rounded-4 shadow-sm border border-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '1.05rem' }}>{comment.khach_hang?.HoTen || 'Khách hàng'}</h6>
                      <small className="text-muted fw-medium" style={{ fontSize: '0.85rem' }}>{formatDate(comment.NgayBinhLuan)}</small>
                    </div>
                    <p className="mb-0 text-secondary" style={{ fontSize: '1rem', lineHeight: '1.7' }}>{comment.NoiDung}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center text-muted p-5 bg-white rounded-4 shadow-sm border border-light">
                  <i className="fa-regular fa-comments fs-1 mb-3 text-light"></i>
                  <h6 className="fw-bold text-secondary">Chưa có bình luận nào</h6>
                  <p className="mb-0 small">Hãy là người đầu tiên chia sẻ cảm nghĩ của bạn về bài viết này!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Related News */}
        <div className="col-lg-4 mt-5 mt-lg-0">
          <div className="position-sticky" style={{ top: '150px' }}>
            <h5 className="fw-bold mb-4 border-start border-4 border-primary ps-3">Bài viết mới nhất</h5>
            <div className="d-flex flex-column gap-4">
              {relatedNews.map((item) => {
                const itemId = item.MaTin;
                return (
                  <Link 
                    key={itemId} 
                    to={`/news/${itemId}`} 
                    className="text-decoration-none text-dark d-flex flex-column gap-2 related-news-item"
                  >
                    <div className="related-news-img-wrapper bg-light shadow-sm" style={{ height: '180px' }}>
                      <img 
                        src={buildImageUrl(newsImagePath(item))} 
                        alt={item.TieuDe} 
                        className="w-100 h-100 object-fit-cover related-news-img"
                      />
                    </div>
                    <div className="pt-1">
                      <h6 className="fw-bold mb-2 line-clamp-2 related-news-title" style={{ lineHeight: '1.4', transition: 'color 0.2s ease' }}>{item.TieuDe}</h6>
                      <div className="text-muted small">
                        <i className="fa-regular fa-calendar-days me-1"></i>
                        {formatDate(item.NgayDang)}
                      </div>
                    </div>
                  </Link>
                )
              })}
              {relatedNews.length === 0 && (
                <div className="text-muted small">Chưa có bài viết nào khác.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
