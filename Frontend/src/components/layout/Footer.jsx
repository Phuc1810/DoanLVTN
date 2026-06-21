import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="footer-site" className="footer-section bg-white pt-5 pb-3 border-top">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-3 col-md-6 text-center">
            <img src="/assets/img/logo_2.png" alt="VietJourney" className="footer-logo" />
            <h6 className="footer-company-name">CÔNG TY TNHH DU LỊCH VIETJOURNEY</h6>
            <div className="social-icons">
              <a href="#facebook" className="social-btn" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="mailto:kinhdoanh.vietjourney@gmail.com" className="social-btn" aria-label="Email"><i className="fa-solid fa-envelope"></i></a>
              <a href="#location" className="social-btn" aria-label="Địa chỉ"><i className="fa-solid fa-location-dot"></i></a>
            </div>
          </div>

          <div className="col-lg-4 col-md-6">
            <h5 className="footer-title">THÔNG TIN LIÊN HỆ</h5>
            <ul className="list-unstyled footer-contact">
              <li><strong>Địa chỉ :</strong> 180 Cao Lỗ, P.Chánh Hưng, TP HCM</li>
              <li><strong>Điện thoại :</strong> 083 252 0843</li>
              <li><strong>Email :</strong> kinhdoanh.vietjourney@gmail.com</li>
            </ul>
            <h6 className="fw-bold mt-3">Chi nhánh:</h6>
            <ul className="list-unstyled">
              <li><i className="fa-solid fa-location-dot"></i> <strong>Chi Nhánh Hà Nội:</strong> 12 Hoàn Kiếm, Phường Hàng Trống, Hà Nội — 0243 888 999</li>
              <li><i className="fa-solid fa-location-dot"></i> <strong>Chi Nhánh Nha Trang:</strong> 98 Trần Phú, TP Nha Trang, Khánh Hòa — 0258 666 777</li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-6">
            <h5 className="footer-title">GIỚI THIỆU</h5>
            <ul className="list-unstyled footer-links">
              <li><a href="#payment-guide"><i className="fa-solid fa-angle-right"></i> Hướng dẫn thanh toán</a></li>
              <li><a href="#booking-guide"><i className="fa-solid fa-angle-right"></i> Hướng dẫn đặt tour</a></li>
              <li><Link to="/pricing"><i className="fa-solid fa-angle-right"></i> Bảng giá</Link></li>
              <li><Link to="/promotions"><i className="fa-solid fa-angle-right"></i> Chương trình khuyến mãi</Link></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5 className="footer-title">CHÍNH SÁCH</h5>
            <ul className="list-unstyled footer-links">
              <li><a href="#terms"><i className="fa-solid fa-angle-right"></i> Điều khoản chung</a></li>
            </ul>
            <div className="mt-3"><img src="/assets/img/bo-cong-thuong.png" alt="Bộ Công Thương" width="180" /></div>
          </div>
        </div>
      </div>
    </footer>
  )
}
