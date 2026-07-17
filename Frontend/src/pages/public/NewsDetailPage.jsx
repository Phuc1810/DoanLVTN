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
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, error: '', news: null })
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
    newsApi.detail(id)
      .then((news) => {
        setState({ loading: false, error: '', news: news.data || news })
        fetchComments()
      })
      .catch((error) => setState({ loading: false, error: error.message, news: null }))
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
    <div className="container news-detail-wrapper">
      <h2 className="fw-bold news-detail-title">{news.TieuDe}</h2>
      <div className="news-detail-meta mb-3">
        <i className="fa-regular fa-calendar-days me-1"></i>{formatDate(news.NgayDang)}
      </div>
      <img src={buildImageUrl(newsImagePath(news))} className="img-fluid rounded-4 shadow-sm mb-4 w-100" alt="" />
      <p className="lead">{news.MoTa}</p>
      <div className="news-detail-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(news.NoiDung || '') }} />

      <hr className="my-5" />

      <div className="news-comments-section mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold mb-0">Bình luận ({comments.length})</h4>
          {!user && (
            <Link to="/auth/login" className="btn btn-outline-primary rounded-pill px-4">Đăng nhập để bình luận</Link>
          )}
        </div>
        
        {user && (
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <div className="mb-3">
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Viết bình luận của bạn..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
              ></textarea>
            </div>
            {commentError && <div className="text-danger mb-2 small">{commentError}</div>}
            <button type="submit" className="btn btn-primary px-4 rounded-pill" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
            </button>
          </form>
        )}

        <div className="comments-list">
          {comments.map((comment, idx) => (
            <div key={idx} className="d-flex mb-4">
              <div className="me-3">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                  {(comment.khach_hang?.HoTen || 'K')[0]}
                </div>
              </div>
              <div className="flex-grow-1 bg-light p-3 rounded-4 border-0 shadow-sm" style={{ backgroundColor: '#f8fafc' }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <h6 className="fw-bold mb-0 text-dark">{comment.khach_hang?.HoTen || 'Khách hàng'}</h6>
                  <small className="text-muted" style={{ fontSize: '12px' }}>{formatDate(comment.NgayBinhLuan)}</small>
                </div>
                <p className="mb-0 text-secondary" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>{comment.NoiDung}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center text-muted p-4 bg-light rounded-3">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
