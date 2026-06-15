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

function chunk(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size))
}

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
  const featuredSlides = chunk(state.tours.slice(0, 8), 4)
  const blogSlides = chunk(state.news.slice(0, 6), 3)
  const firstNews = state.news.find((item) => item.LoaiTin === 'tintuc') || state.news[0]
  const firstExperience = state.news.find((item) => item.LoaiTin === 'kinhnghiem') || state.news[1] || state.news[0]

  return (
    <main className="page-home">
      <div id="anh_truot" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner">
          {heroTours.map((tour, index) => (
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

              <div id="tourSlider" className="carousel slide" data-bs-ride="carousel">
                <div className="carousel-inner">
                  {featuredSlides.map((group, index) => (
                    <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={`tour-slide-${index}`}>
                      <div className="row g-4">
                        {group.map((tour) => (
                          <div className="col-md-3" key={tour.MaTour}>
                            <HomeTourCard tour={tour} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {featuredSlides.length > 1 && (
                  <>
                    <button className="carousel-control-prev" type="button" data-bs-target="#tourSlider" data-bs-slide="prev">
                      <span className="carousel-control-prev-icon"></span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#tourSlider" data-bs-slide="next">
                      <span className="carousel-control-next-icon"></span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="py-5 bg-light" id="tour_khuyen_mai">
            <div className="container">
              <h2 className="fw-bold text-center mb-4">TOUR KHUYẾN MÃI NỔI BẬT</h2>

              <div className="row g-4">
                {state.promotions.slice(0, 9).map((tour) => {
                  const discount = Number(tour.discount_percent || tour.PhanTramGiam || 0)
                  return (
                    <div className="col-md-4" key={tour.MaTour}>
                      <div className="km-card">
                        <img src={buildImageUrl(tourImagePath(tour))} className="km-img" alt="" />
                        {discount > 0 && <span className="km-discount">-{discount}%</span>}
                        <div className="km-overlay">
                          <h5 className="km-title">{tour.TenTour}</h5>
                          <p className="km-old">{formatCurrency(tour.GiaGoc)}</p>
                          <p className="km-new">{formatCurrency(tour.GiaGiam)}</p>
                          <Link to={`/tours/${tour.MaTour}`} className="btn km-btn">ĐẶT TOUR</Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="py-5 bg-white" id="blog">
            <div className="container">
              <h2 className="fw-bold text-center mb-4">BLOG</h2>

              <div className="row g-4 mb-4">
                {firstNews && (
                  <div className="col-md-6">
                    <div className="blog-hero-card">
                      <img src={buildImageUrl(newsImagePath(firstNews))} className="blog-hero-img" alt="" />
                      <div className="blog-hero-overlay">
                        <h3 className="blog-hero-title">TIN TỨC DU LỊCH</h3>
                        <p className="blog-hero-desc">Cập nhật thông tin mới nhất về xu hướng du lịch.</p>
                        <Link to="/news?loai=tintuc" className="blog-hero-btn">Đọc thêm</Link>
                      </div>
                    </div>
                  </div>
                )}
                {firstExperience && (
                  <div className="col-md-6">
                    <div className="blog-hero-card">
                      <img src={buildImageUrl(newsImagePath(firstExperience))} className="blog-hero-img" alt="" />
                      <div className="blog-hero-overlay">
                        <h3 className="blog-hero-title">KINH NGHIỆM DU LỊCH</h3>
                        <p className="blog-hero-desc">Những bí quyết hữu ích cho chuyến đi hoàn hảo.</p>
                        <Link to="/news?loai=kinhnghiem" className="blog-hero-btn">Đọc thêm</Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div id="blogSlider" className="carousel slide" data-bs-ride="carousel">
                <div className="carousel-inner">
                  {blogSlides.map((group, index) => (
                    <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={`blog-slide-${index}`}>
                      <div className="row g-4">
                        {group.map((item) => (
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
                  ))}
                </div>
                {blogSlides.length > 1 && (
                  <>
                    <button className="carousel-control-prev" type="button" data-bs-target="#blogSlider" data-bs-slide="prev">
                      <span className="carousel-control-prev-icon"></span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#blogSlider" data-bs-slide="next">
                      <span className="carousel-control-next-icon"></span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
