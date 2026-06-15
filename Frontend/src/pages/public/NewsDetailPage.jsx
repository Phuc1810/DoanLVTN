import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { newsApi } from '../../api/newsApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl, newsImagePath } from '../../utils/imageUrl'
import { sanitizeHtml } from '../../utils/sanitizeHtml'

export default function NewsDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', news: null })

  useEffect(() => {
    newsApi.detail(id)
      .then((news) => setState({ loading: false, error: '', news }))
      .catch((error) => setState({ loading: false, error: error.message, news: null }))
  }, [id])

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
    </div>
  )
}
