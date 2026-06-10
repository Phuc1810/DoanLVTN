import { Link, useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()

  function submitQuickSearch(event) {
    event.preventDefault()
    const keyword = new FormData(event.currentTarget).get('keyword')?.toString().trim()
    if (keyword) navigate(`/search?keyword=${encodeURIComponent(keyword)}`)
  }

  return (
    <header id="header">
      <div className="topbar position-fixed w-100 top-0 start-0 z-3 d-flex justify-content-start align-items-center gap-3">
        <span className="fw-bold phone-hotline">1900 2026</span>

        <div className="search-container d-flex align-items-center">
          <form onSubmit={submitQuickSearch} className="d-flex align-items-center">
            <input
              type="text"
              name="keyword"
              className="searchbox"
              placeholder="Nhập địa điểm..."
            />
          </form>
          <a href="#footer-site" className="btn btn-primary btn-sm ms-2 rounded-pill px-3">
            Liên hệ
          </a>
        </div>
      </div>

      <nav className="navbar navbar-expand-lg navbar-dark fixed-top thanh_dieu_huong">
        <div className="container d-flex justify-content-between align-items-center">
          <Link className="navbar-brand fw-bold text-white" to="/">
            <img src="/assets/img/logo_1.png" className="logo_img" alt="Logo" />
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#menu_chinh"
            aria-controls="menu_chinh"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="menu_chinh">
            <ul className="navbar-nav align-items-center gap-3">
              <li className="nav-item">
                <Link className="nav-link active" to="/">
                  TRANG CHỦ
                </Link>
              </li>

              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                  TOUR
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/tours/region/bac">
                      Tour Miền Bắc
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/tours/region/trung">
                      Tour Miền Trung
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/tours/region/nam">
                      Tour Miền Nam
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/promotions">
                      Chương trình khuyến mãi
                    </Link>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/business-tours">
                  ĐẶT TOUR DOANH NGHIỆP
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/pricing">
                  BẢNG GIÁ
                </Link>
              </li>

              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                  BLOG
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/news?loai=tintuc">
                      Tin tức du lịch
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/news?loai=kinhnghiem">
                      Kinh nghiệm du lịch
                    </Link>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#footer-site">
                  LIÊN HỆ
                </a>
              </li>

              <li className="nav-item login-item">
                <Link className="nav-link login-link" to="/login">
                  <i className="fa-regular fa-user me-1"></i> ĐĂNG NHẬP
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}
