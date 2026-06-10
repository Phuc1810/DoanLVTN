import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="footer-site" className="footer-section bg-white pt-5 pb-3 border-top">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-3 col-md-6 text-center">
            <img src="/assets/img/logo_2.png" alt="Logo" className="footer-logo" />
            <h6 className="footer-company-name">CÔNG TY DU LỊCH TOURDULICH</h6>
            <div className="social-icons">
              <a href="#" className="social-btn"><i className="fa-brands fa-facebook-f"></i></a>
              <a href="mailto:info@tourdulich.vn" className="social-btn"><i className="fa-solid fa-envelope"></i></a>
              <a href="#" className="social-btn"><i className="fa-solid fa-location-dot"></i></a>
            </div>
          </div>

          <div className="col-lg-4 col-md-6">
            <h5 className="footer-title">THÔNG TIN LIÊN HỆ</h5>
            <ul className="list-unstyled footer-contact">
              <li><strong>Địa chỉ :</strong> TP. Hồ Chí Minh</li>
              <li><strong>Điện thoại :</strong> 1900 2026</li>
              <li><strong>Email :</strong> info@tourdulich.vn</li>
            </ul>
            <h6 className="fw-bold mt-3">Chi nhánh:</h6>
            <ul className="list-unstyled">
              <li><i className="fa-solid fa-location-dot"></i> <strong>Hồ Chí Minh:</strong> Trung tâm du lịch</li>
              <li><i className="fa-solid fa-location-dot"></i> <strong>Hà Nội:</strong> Văn phòng miền Bắc</li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-6">
            <h5 className="footer-title">GIỚI THIỆU</h5>
            <ul className="list-unstyled footer-links">
              <li><a href="#"><i className="fa-solid fa-angle-right"></i> Hướng dẫn thanh toán</a></li>
              <li><a href="#"><i className="fa-solid fa-angle-right"></i> Hướng dẫn đặt tour</a></li>
              <li><Link to="/pricing"><i className="fa-solid fa-angle-right"></i> Bảng giá</Link></li>
              <li><Link to="/promotions"><i className="fa-solid fa-angle-right"></i> Chương trình khuyến mãi</Link></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5 className="footer-title">CHÍNH SÁCH</h5>
            <ul className="list-unstyled footer-links">
              <li><a href="#"><i className="fa-solid fa-angle-right"></i> Điều khoản chung</a></li>
            </ul>
            <div className="mt-3">
              <img src="/assets/img/bo-cong-thuong.png" alt="Bộ công thương" width="180" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
