import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export default function Header() {
  const navigate = useNavigate()
  const { user, isCustomer, logout } = useAuth()

  function submitQuickSearch(event) {
    event.preventDefault()
    const keyword = new FormData(event.currentTarget).get('keyword')?.toString().trim()
    if (keyword) navigate(`/search?keyword=${encodeURIComponent(keyword)}`)
  }

  return (
    <header id="header">
      <div className="topbar position-fixed w-100 top-0 start-0 z-3 d-flex justify-content-start align-items-center gap-3">
        <span className="fw-bold phone-hotline">083 252 0843</span>
        <div className="search-container d-flex align-items-center">
          <form onSubmit={submitQuickSearch} className="d-flex align-items-center">
            <input type="text" name="keyword" className="searchbox" placeholder="Nhập địa điểm..." />
          </form>
          <a href="#footer-site" className="btn btn-primary btn-sm ms-2 rounded-pill px-3">Liên hệ</a>
        </div>
      </div>

      <nav className="navbar navbar-expand-lg navbar-dark fixed-top thanh_dieu_huong">
        <div className="container-fluid ps-4 ps-xl-5 pe-0 d-flex justify-content-between align-items-center">
          <Link className="navbar-brand fw-bold text-white" to="/" style={{ marginLeft: '-0.5cm' }}>
            <img src="/assets/img/logo_1.png" className="logo_img" alt="VietJourney" />
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu_chinh" aria-controls="menu_chinh" aria-expanded="false" aria-label="Mở menu">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="menu_chinh">
            <ul className="navbar-nav align-items-center me-auto ms-5" style={{ fontSize: '0.95rem', paddingLeft: '2cm', gap: '0.5cm' }}>
              <li className="nav-item"><Link className="nav-link active" to="/">TRANG CHỦ</Link></li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#tour_noi_bat" data-bs-toggle="dropdown">TOUR</a>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" to="/tours/region/bac">Tour Miền Bắc</Link></li>
                  <li><Link className="dropdown-item" to="/tours/region/trung">Tour Miền Trung</Link></li>
                  <li><Link className="dropdown-item" to="/tours/region/nam">Tour Miền Nam</Link></li>
                  <li><Link className="dropdown-item" to="/promotions">Chương trình khuyến mãi</Link></li>
                </ul>
              </li>
              <li className="nav-item"><Link className="nav-link" to="/business-tours">ĐẶT TOUR DOANH NGHIỆP</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/pricing">BẢNG GIÁ</Link></li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#blog" data-bs-toggle="dropdown">BLOG</a>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" to="/news?loai=tintuc">Tin tức du lịch</Link></li>
                  <li><Link className="dropdown-item" to="/news?loai=kinhnghiem">Kinh nghiệm du lịch</Link></li>
                </ul>
              </li>
              <li className="nav-item"><a className="nav-link" href="#footer-site">LIÊN HỆ</a></li>
            </ul>

            <ul className="navbar-nav align-items-center">
              {!isCustomer ? (
                <li className="nav-item login-item">
                  <Link className="nav-link login-link" to="/auth/login"><i className="fa-regular fa-user"></i> ĐĂNG NHẬP</Link>
                </li>
              ) : (
                <li className="nav-item dropdown" style={{ minWidth: '240px' }}>
                  <a className="nav-link dropdown-toggle d-flex align-items-center" href="#account-menu" data-bs-toggle="dropdown" style={{ width: 'max-content' }}>
                    <span className="d-flex align-items-center text-truncate">
                      <i className="fa-regular fa-user me-2"></i>
                      <span className="text-truncate" style={{ maxWidth: '180px' }}>
                        CHÀO {user?.HoTen || user?.khach_hang?.HoTen || user?.TenDangNhap || 'BẠN'}
                      </span>
                    </span>
                  </a>
                  <ul className="dropdown-menu" style={{ width: 'max-content', minWidth: '240px' }}>
                    <li><Link className="dropdown-item" to="/profile"><i className="fa-regular fa-id-card me-2"></i> Thông tin cá nhân</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><Link className="dropdown-item" to="/orders"><i className="fa-solid fa-receipt me-2"></i> Đơn hàng (đặt tour)</Link></li>
                    <li><Link className="dropdown-item" to="/business-requests"><i className="fa-solid fa-briefcase me-2"></i> Yêu cầu doanh nghiệp</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button type="button" className="dropdown-item text-danger" onClick={async () => { await logout(); navigate('/auth/login') }}>
                        <i className="fa-solid fa-right-from-bracket me-2"></i> Đăng xuất
                      </button>
                    </li>
                  </ul>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}
