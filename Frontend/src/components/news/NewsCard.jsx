import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl, newsImagePath } from '../../utils/imageUrl'

export default function NewsCard({ news }) {
  return (
    <Link 
      to={`/news/${news.MaTin}`} 
      className="blog-card text-decoration-none text-dark d-block bg-white rounded-3 overflow-hidden" 
      style={{ 
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        border: '1px solid #f0f0f0',
        borderBottom: '4px solid #e0e0e0'
      }} 
      onMouseEnter={(e) => { 
        e.currentTarget.style.transform = 'translateY(-5px)'; 
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderBottomColor = '#0d6efd';
      }} 
      onMouseLeave={(e) => { 
        e.currentTarget.style.transform = 'translateY(0)'; 
        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
        e.currentTarget.style.borderBottomColor = '#e0e0e0';
      }}
    >
      <div className="blog-card-img-box">
        <img src={buildImageUrl(newsImagePath(news))} alt={news.TieuDe} className="blog-card-img" />
      </div>
      <div className="blog-card-body">
        <h5 className="blog-card-title">{news.TieuDe}</h5>
        <p className="blog-card-date text-muted">
          <i className="fa-regular fa-calendar-days me-1"></i>
          {formatDate(news.NgayDang)}
        </p>
        <p className="blog-card-desc text-secondary">{String(news.MoTa || '').slice(0, 150)}...</p>
      </div>
    </Link>
  )
}
