import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { newsApi } from '../../api/newsApi'
import { tourApi } from '../../api/tourApi'
import Loading from '../../components/common/Loading'
import AdvancedSearchBox from '../../components/tours/AdvancedSearchBox'
import HomeTourCard from '../../components/tours/HomeTourCard'
import { listFrom } from '../../utils/data'
import { formatCurrency } from '../../utils/formatCurrency'
import { buildImageUrl, newsImagePath, tourImagePath } from '../../utils/imageUrl'

export default function HomePage() {
  const [state, setState] = useState({ loading: true, tours: [], promotions: [], news: [] })

  useEffect(() => {
    Promise.allSettled([
      tourApi.list({ per_page: 8 }),
      tourApi.promotions({ per_page: 9 }),
      newsApi.list({ per_page: 6 }),
    ])
      .then(([tours, promotions, news]) => {
        const tourRows = tours.status === 'fulfilled' ? listFrom(tours.value) : []
        const promotionRows = promotions.status === 'fulfilled'
          ? listFrom(promotions.value).filter((tour) => Number(tour.PhanTramGiam || tour.discount_percent || 0) > 0)
          : []
        setState({
          loading: false,
          tours: tourRows,
          promotions: promotionRows.length ? promotionRows : tourRows.filter((tour) => Number(tour.PhanTramGiam || 0) > 0),
          news: news.status === 'fulfilled' ? listFrom(news.value) : [],
        })
      })
      .catch(() => setState((current) => ({ ...current, loading: false })))
  }, [])

  const heroTours = state.tours.slice(0, 4)

  return (
    <main className="page-home">
      <div id="anh_truot" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner">
          {(heroTours.length ? heroTours : state.promotions.slice(0, 1)).map((tour, index) => (
            <div
              key={tour.MaTour}
              className={`carousel-item ${index === 0 ? 'active' : ''}`}
              style={{
                backgroundImage: `url('${buildImageUrl(tourImagePath(tour))}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '100vh',
              }}
            >
              <div className="lop_mo">
                <div className="noi_dung_banner text-white">
                  <h1 className="fw-bold">{tour.TenTour}</h1>
                  <h4 className="fw-bold">{formatCurrency(tour.GiaGiam)}</h4>
                  <Link to={`/tours/${tour.MaTour}`} className="btn btn-outline-light mt-3">
                    ĐẶT NGAY
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdvancedSearchBox />

      {state.loading ? (
        <Loading />
      ) : (
        <>
          <section className="py-5 bg-light" id="tour_noi_bat">
            <div className="container-fluid custom-padding">
              <h2 className="fw-bold text-center mb-4">TOUR NỔI BẬT TRONG THÁNG</h2>
              <div className="row g-4">
                {state.tours.slice(0, 8).map((tour) => (
                  <div className="col-md-3" key={tour.MaTour}>
                    <HomeTourCard tour={tour} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-5 bg-light" id="tour_khuyen_mai">
            <div className="container">
              <h2 className="fw-bold text-center mb-4">TOUR KHUYẾN MÃI NỔI BẬT</h2>
              <div className="row g-4">
                {state.promotions.slice(0, 9).map((tour) => (
                  <div className="col-md-4" key={tour.MaTour}>
                    <div className="km-card">
                      <img src={buildImageUrl(tourImagePath(tour))} className="km-img" alt="" />
                      {Number(tour.discount_percent || tour.PhanTramGiam) > 0 && (
                        <span className="km-discount">-{Number(tour.discount_percent || tour.PhanTramGiam)}%</span>
                      )}
                      <div className="km-overlay">
                        <h5 className="km-title">{tour.TenTour}</h5>
                        <p className="km-old">{formatCurrency(tour.GiaGoc)}</p>
                        <p className="km-new">{formatCurrency(tour.GiaGiam)}</p>
                        <Link to={`/tours/${tour.MaTour}`} className="btn km-btn">ĐẶT TOUR</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-5 bg-white" id="blog">
            <div className="container">
              <h2 className="fw-bold text-center mb-4">BLOG</h2>
              <div className="row g-4">
                {state.news.slice(0, 6).map((item) => (
                  <div className="col-md-4" key={item.MaTin}>
                    <div className="blog-mini-card">
                      <div className="blog-mini-img-box">
                        <img src={buildImageUrl(newsImagePath(item))} className="blog-mini-img" alt="" />
                      </div>
                      <div className="blog-mini-body">
                        <h5 className="blog-mini-title">{item.TieuDe}</h5>
                        <p className="blog-mini-desc">{String(item.MoTa || '').slice(0, 120)}...</p>
                        <Link to={`/news/${item.MaTin}`} className="btn-xemthem"> Xem thêm </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
