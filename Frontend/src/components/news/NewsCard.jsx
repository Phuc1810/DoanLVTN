import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl, newsImagePath } from '../../utils/imageUrl'

export default function NewsCard({ news }) {
  return (
    <div className="blog-card">
      <div className="blog-card-img-box">
        <img src={buildImageUrl(newsImagePath(news))} alt="" className="blog-card-img" />
      </div>
      <div className="blog-card-body">
        <h5 className="blog-card-title">{news.TieuDe}</h5>
        <p className="blog-card-date">
          <i className="fa-regular fa-calendar-days me-1"></i>
          {formatDate(news.NgayDang)}
        </p>
        <p className="blog-card-desc">{String(news.MoTa || '').slice(0, 150)}...</p>
        <Link to={`/news/${news.MaTin}`} className="blog-card-btn">
          XEM CHI TIẾT
        </Link>
      </div>
    </div>
  )
}
