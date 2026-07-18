import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Clock, Zap, Map, FileText, Gift, Box } from 'lucide-react';
import { staffOmniSearchApi } from '../../api/staffOmniSearchApi';
import { buildImageUrl, tourImagePath, newsImagePath } from '../../utils/imageUrl';
import StaffStatusBadge from './StaffStatusBadge';
import '../../assets/css/timkiem.css'; // Let's use a specific css or nhanvien.css. I will just use inline and generic classes if needed, or put in nhanvien.css later.

export default function StaffGlobalSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({ tours: [], orders: [], news: [], promotions: [] });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce API call
  useEffect(() => {
    if (!query.trim()) {
      setResults({ tours: [], orders: [], news: [], promotions: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const responseData = await staffOmniSearchApi.search(query);
        // axiosClient tự động bóc tách response.data qua interceptor
        // Nên responseData lúc này chính là object chứa tours, orders, news, promotions
        if (responseData && responseData.tours) {
          setResults(responseData);
        }
      } catch (error) {
        console.error('Omni Search Error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleNavigate = (path) => {
    setIsFocused(false);
    setQuery('');
    navigate(path);
  };

  const hasResults = results.tours.length > 0 || results.orders.length > 0 || results.news.length > 0 || results.promotions.length > 0;

  return (
    <div className="top-search omni-search-container" ref={dropdownRef} style={{ position: 'relative', width: '400px' }}>
      <Search size={18} className="search-icon text-muted" style={{ marginRight: '12px', flexShrink: 0 }} />
      <input 
        type="text" 
        placeholder="Tìm tour, đơn hàng, tin tức..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '15px', color: '#334155', outline: 'none' }}
      />
      {isLoading && (
        <div style={{ flexShrink: 0, marginLeft: '12px' }}>
          <Loader2 size={18} className="text-primary" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {isFocused && (
        <div className="omni-search-dropdown shadow-lg rounded-3 bg-white p-2" style={{ position: 'absolute', top: '50px', left: 0, width: '450px', zIndex: 9999, maxHeight: '500px', overflowY: 'auto' }}>
          
          {!query.trim() ? (
            <div className="omni-quick-actions p-2">
              <div className="text-muted fw-bold mb-2 small text-uppercase"><Zap size={14} className="me-1"/> Lệnh thao tác nhanh</div>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-light text-dark p-2 border cursor-pointer hover-bg-primary hover-text-white transition" onClick={() => handleNavigate('/staff/tours')}>+ Thêm Tour mới</span>
                <span className="badge bg-light text-dark p-2 border cursor-pointer hover-bg-primary hover-text-white transition" onClick={() => handleNavigate('/staff/orders')}>+ Quản lý Đơn hàng</span>
                <span className="badge bg-light text-dark p-2 border cursor-pointer hover-bg-primary hover-text-white transition" onClick={() => handleNavigate('/staff/news')}>+ Đăng Tin tức</span>
                <span className="badge bg-light text-dark p-2 border cursor-pointer hover-bg-primary hover-text-white transition" onClick={() => handleNavigate('/staff/promotions')}>+ Tạo Khuyến mãi</span>
              </div>
              <hr className="my-3 text-muted opacity-25" />
              <div className="text-muted fw-bold mb-2 small text-uppercase"><Clock size={14} className="me-1"/> Lịch sử tìm kiếm</div>
              <div className="text-muted small fst-italic ms-2">Chưa có lịch sử tìm kiếm gần đây.</div>
            </div>
          ) : (
            <div className="omni-results p-1">
              {!isLoading && !hasResults && (
                <div className="text-center p-4 text-muted">
                  <div className="mb-2"><Search size={32} className="opacity-25" /></div>
                  Không tìm thấy kết quả nào cho "{query}"
                </div>
              )}

              {/* Section: Tours */}
              {results.tours.length > 0 && (
                <div className="mb-3">
                  <div className="text-primary fw-bold mb-2 small text-uppercase px-2 d-flex align-items-center"><Map size={14} className="me-2"/> Tour Du Lịch</div>
                  {results.tours.map(tour => (
                    <div key={tour.MaTour} className="search-result-item d-flex align-items-center p-2 rounded hover-bg-light cursor-pointer" onClick={() => handleNavigate(`/staff/tours/${tour.MaTour}`)}>
                      <div className="me-3" style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                         {tourImagePath(tour) ? <img src={buildImageUrl(tourImagePath(tour))} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Map size={20} className="text-muted m-2" />}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-semibold text-truncate text-dark" style={{ fontSize: '14px' }}>{tour.TenTour}</div>
                        <div className="text-muted small">Mã: {tour.MaTour}</div>
                      </div>
                      <div>
                        <StaffStatusBadge status={tour.TrangThai} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section: Orders */}
              {results.orders.length > 0 && (
                <div className="mb-3">
                  <div className="text-primary fw-bold mb-2 small text-uppercase px-2 d-flex align-items-center"><Box size={14} className="me-2"/> Đơn Đặt Tour</div>
                  {results.orders.map(order => (
                    <div key={order.MaDon} className="search-result-item d-flex justify-content-between align-items-center p-2 rounded hover-bg-light cursor-pointer" onClick={() => handleNavigate(`/staff/orders/${order.MaDon}`)}>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-semibold text-truncate text-dark" style={{ fontSize: '14px' }}>{order.khach_hang?.HoTen || 'Khách vãng lai'}</div>
                        <div className="text-muted small d-flex gap-2">
                          <span>Mã đơn: {order.MaDon}</span>
                          <span>•</span>
                          <span>SĐT: {order.khach_hang?.SoDienThoai || order.khach_hang?.SDT || order.khach_hang?.so_dien_thoai || order.KhachHang?.SoDienThoai || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-danger small">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.TongTienPhaiTra)}</div>
                        <StaffStatusBadge status={order.TrangThai} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section: News */}
              {results.news.length > 0 && (
                <div className="mb-3">
                  <div className="text-primary fw-bold mb-2 small text-uppercase px-2 d-flex align-items-center"><FileText size={14} className="me-2"/> Bài Viết / Tin Tức</div>
                  {results.news.map(n => (
                    <div key={n.MaTin} className="search-result-item d-flex align-items-center p-2 rounded hover-bg-light cursor-pointer" onClick={() => handleNavigate(`/staff/news/${n.MaTin}`)}>
                       <div className="me-3" style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                         {newsImagePath(n) ? <img src={buildImageUrl(newsImagePath(n))} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FileText size={20} className="text-muted m-2" />}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-semibold text-truncate text-dark" style={{ fontSize: '14px' }}>{n.TieuDe}</div>
                        <div className="text-muted small">Mã: {n.MaTin}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section: Promotions */}
              {results.promotions.length > 0 && (
                <div className="mb-1">
                  <div className="text-primary fw-bold mb-2 small text-uppercase px-2 d-flex align-items-center"><Gift size={14} className="me-2"/> Chương Trình Khuyến Mãi</div>
                  {results.promotions.map(p => (
                    <div key={p.MaCTKM} className="search-result-item d-flex align-items-center p-2 rounded hover-bg-light cursor-pointer" onClick={() => handleNavigate(`/staff/promotions/${p.MaCTKM}`)}>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-semibold text-truncate text-dark" style={{ fontSize: '14px' }}>{p.TenKM}</div>
                        <div className="text-muted small">Mã: {p.MaCTKM} • Tới: {new Date(p.NgayKetThuc).toLocaleDateString('vi-VN')}</div>
                      </div>
                      <div>
                         <StaffStatusBadge status={p.TrangThai} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
