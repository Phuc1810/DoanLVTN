import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { adminAccountApi } from '../../api/adminAccountApi'
import Pagination from '../../components/common/Pagination'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import { normalizeError } from './staffPageUtils'
import { buildImageUrl } from '../../utils/imageUrl'

function StaffAccountDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [account, setAccount] = useState(null)
  const [activeTab, setActiveTab] = useState('activities')
  const [pageState, setPageState] = useState({ bookings: 1, reviews: 1, managed_tours: 1, news: 1, business_requests: 1 })

  useEffect(() => {
    adminAccountApi.getAccountDetails(id)
      .then(payload => {
        setAccount(payload)
        setLoading(false)
        if (payload.role === 'KH') setActiveTab('bookings')
        else setActiveTab('managed_tours')
      })
      .catch(err => {
        setError(normalizeError(err).message)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="p-4 text-center text-muted"><div className="spinner-border spinner-border-sm me-2"></div>Đang tải thông tin...</div>
  if (error) return <div className="p-4"><div className="alert alert-danger">{error}</div></div>
  if (!account) return <div className="p-4"><div className="alert alert-warning">Không tìm thấy tài khoản.</div></div>

  const { profile, activities } = account

  const getPaginatedData = (dataArray, page) => {
    if (!dataArray) return { items: [], pagination: null }
    const perPage = 5
    const total = dataArray.length
    const lastPage = Math.ceil(total / perPage)
    const items = dataArray.slice((page - 1) * perPage, page * perPage)
    
    return {
      items,
      pagination: { current_page: page, per_page: perPage, total, last_page: lastPage }
    }
  }

  const { items: paginatedBookings, pagination: bookingsPagination } = getPaginatedData(activities?.bookings, pageState.bookings)
  const { items: paginatedReviews, pagination: reviewsPagination } = getPaginatedData(activities?.reviews, pageState.reviews)
  const { items: paginatedTours, pagination: toursPagination } = getPaginatedData(activities?.managed_tours, pageState.managed_tours)
  const { items: paginatedNews, pagination: newsPagination } = getPaginatedData(activities?.news, pageState.news)
  const { items: paginatedBusinessRequests, pagination: businessRequestsPagination } = getPaginatedData(activities?.business_requests, pageState.business_requests)

  const renderCustomerTabs = () => (
    <ul className="nav nav-tabs nav-tabs-custom mb-4">
      <li className="nav-item">
        <button className={`nav-link ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
          Lịch sử đặt tour ({activities?.bookings?.length || 0})
        </button>
      </li>
      <li className="nav-item">
        <button className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
          Đánh giá ({activities?.reviews?.length || 0})
        </button>
      </li>
    </ul>
  )

  const renderStaffTabs = () => (
    <ul className="nav nav-tabs nav-tabs-custom mb-4">
      <li className="nav-item">
        <button className={`nav-link ${activeTab === 'managed_tours' ? 'active' : ''}`} onClick={() => setActiveTab('managed_tours')}>
          Tours quản lý ({activities?.managed_tours?.length || 0})
        </button>
      </li>
      <li className="nav-item">
        <button className={`nav-link ${activeTab === 'news' ? 'active' : ''}`} onClick={() => setActiveTab('news')}>
          Tin tức đã đăng ({activities?.news?.length || 0})
        </button>
      </li>
      <li className="nav-item">
        <button className={`nav-link ${activeTab === 'business_requests' ? 'active' : ''}`} onClick={() => setActiveTab('business_requests')}>
          Yêu cầu doanh nghiệp ({activities?.business_requests?.length || 0})
        </button>
      </li>
    </ul>
  )

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-0 text-gray-800 fw-bold">Chi tiết tài khoản</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 bg-transparent p-0">
              <li className="breadcrumb-item"><Link to="/staff/accounts" className="text-decoration-none">Tài khoản</Link></li>
              <li className="breadcrumb-item active" aria-current="page">#{account.id}</li>
            </ol>
          </nav>
        </div>
        <div>
          <Link to="/staff/accounts" className="btn btn-light border shadow-sm px-3 fw-medium">
            <i className="fa-solid fa-arrow-left me-2"></i>Quay lại
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Profile Card */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <div className="bg-primary text-white p-4 text-center position-relative" style={{ height: '140px' }}>
              <div className="position-absolute" style={{ bottom: '-40px', left: '50%', transform: 'translateX(-50%)' }}>
                <div className="bg-white p-1 rounded-circle shadow">
                  <div className="rounded-circle d-flex align-items-center justify-content-center bg-light text-primary" style={{ width: '90px', height: '90px', fontSize: '32px' }}>
                    <i className="fa-solid fa-user"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body pt-5 text-center mt-3 pb-0">
              <h4 className="fw-bold mb-1">{profile?.fullname || account.username}</h4>
              <p className="text-muted mb-2">@{account.username}</p>
              <div className="d-flex justify-content-center gap-2 mb-4">
                <span className={`badge ${account.role === 'AD' ? 'bg-danger' : account.role === 'NV' ? 'bg-primary' : 'bg-secondary'}`}>
                  {account.role === 'AD' ? 'Admin' : account.role === 'NV' ? 'Nhân viên' : 'Khách hàng'}
                </span>
                <span className={`badge ${account.status === 'Hoạt động' ? 'bg-success' : 'bg-warning text-dark'}`}>
                  {account.status}
                </span>
              </div>
            </div>
            
            <div className="card-body border-top p-4 bg-light">
              <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: '13px', letterSpacing: '1px' }}>Thông tin hồ sơ</h6>
              
              <ul className="list-unstyled mb-0">
                <li className="d-flex mb-3 align-items-center">
                  <div className="text-muted text-center me-3" style={{ width: '24px' }}><i className="fa-solid fa-envelope"></i></div>
                  <div>
                    <div className="small text-muted" style={{ fontSize: '12px' }}>Email</div>
                    <div className="fw-medium">{profile?.email || <span className="text-muted fst-italic">Chưa cập nhật</span>}</div>
                  </div>
                </li>
                <li className="d-flex mb-3 align-items-center">
                  <div className="text-muted text-center me-3" style={{ width: '24px' }}><i className="fa-solid fa-phone"></i></div>
                  <div>
                    <div className="small text-muted" style={{ fontSize: '12px' }}>Số điện thoại</div>
                    <div className="fw-medium">{profile?.phone || <span className="text-muted fst-italic">Chưa cập nhật</span>}</div>
                  </div>
                </li>
                
                {account.role === 'KH' ? (
                  <>
                    <li className="d-flex mb-3 align-items-center">
                      <div className="text-muted text-center me-3" style={{ width: '24px' }}><i className="fa-solid fa-cake-candles"></i></div>
                      <div>
                        <div className="small text-muted" style={{ fontSize: '12px' }}>Ngày sinh</div>
                        <div className="fw-medium">{profile?.dob || <span className="text-muted fst-italic">Chưa cập nhật</span>}</div>
                      </div>
                    </li>
                    <li className="d-flex mb-3 align-items-center">
                      <div className="text-muted text-center me-3" style={{ width: '24px' }}><i className="fa-solid fa-venus-mars"></i></div>
                      <div>
                        <div className="small text-muted" style={{ fontSize: '12px' }}>Giới tính</div>
                        <div className="fw-medium">{profile?.gender || <span className="text-muted fst-italic">Chưa cập nhật</span>}</div>
                      </div>
                    </li>
                    <li className="d-flex mb-0 align-items-center">
                      <div className="text-muted text-center me-3" style={{ width: '24px' }}><i className="fa-solid fa-location-dot"></i></div>
                      <div>
                        <div className="small text-muted" style={{ fontSize: '12px' }}>Địa chỉ</div>
                        <div className="fw-medium">{profile?.address || <span className="text-muted fst-italic">Chưa cập nhật</span>}</div>
                      </div>
                    </li>
                  </>
                ) : (
                  <li className="d-flex mb-0 align-items-center">
                    <div className="text-muted text-center me-3" style={{ width: '24px' }}><i className="fa-solid fa-briefcase"></i></div>
                    <div>
                      <div className="small text-muted" style={{ fontSize: '12px' }}>Chức vụ</div>
                      <div className="fw-medium">{profile?.position || <span className="text-muted fst-italic">Chưa cập nhật</span>}</div>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Activities */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Lịch sử hoạt động</h5>
              
              {account.role === 'KH' ? renderCustomerTabs() : renderStaffTabs()}

              <div className="tab-content">
                {/* Customer: Bookings */}
                {activeTab === 'bookings' && (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Mã Đơn</th>
                          <th>Tour</th>
                          <th>Ngày đặt</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities?.bookings?.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-4 text-muted">Chưa có lịch sử đặt tour.</td></tr>
                        ) : (
                          paginatedBookings.map(booking => (
                            <tr 
                              key={booking.id}
                              onClick={() => navigate(`/staff/orders/${booking.id}`)}
                              style={{ cursor: 'pointer' }}
                              className="position-relative"
                            >
                              <td className="fw-bold text-secondary">#{booking.id}</td>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  {booking.tour?.image ? (
                                    <img src={buildImageUrl(booking.tour.image)} alt={booking.tour.name} className="rounded" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                                  ) : (
                                    <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ width: '48px', height: '48px' }}>
                                      <i className="fa-solid fa-image"></i>
                                    </div>
                                  )}
                                  <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '200px' }} title={booking.tour?.name}>{booking.tour?.name || 'Tour không tồn tại'}</div>
                                </div>
                              </td>
                              <td>{new Date(booking.booking_date).toLocaleDateString('vi-VN')}</td>
                              <td className="fw-bold text-danger">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.total_price)}</td>
                              <td>
                                <StaffStatusBadge status={booking.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {bookingsPagination && bookingsPagination.last_page > 1 && (
                      <div className="mt-3 pb-2 border-top pt-3">
                        <Pagination pagination={bookingsPagination} onPageChange={(p) => setPageState({ ...pageState, bookings: p })} itemName="đơn" />
                      </div>
                    )}
                  </div>
                )}

                {/* Customer: Reviews */}
                {activeTab === 'reviews' && (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Tour</th>
                          <th>Đánh giá</th>
                          <th>Bình luận</th>
                          <th>Ngày ĐG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities?.reviews?.length === 0 ? (
                          <tr><td colSpan="4" className="text-center py-4 text-muted">Chưa có đánh giá nào.</td></tr>
                        ) : (
                          paginatedReviews.map(review => (
                            <tr key={review.id}>
                              <td className="fw-medium text-truncate" style={{ maxWidth: '200px' }} title={review.tour?.name}>{review.tour?.name || 'Tour không tồn tại'}</td>
                              <td>
                                <div className="d-flex text-warning">
                                  {[...Array(5)].map((_, i) => (
                                    <i key={i} className={`fa-star ${i < review.rating ? 'fa-solid' : 'fa-regular'}`}></i>
                                  ))}
                                </div>
                              </td>
                              <td className="text-muted text-break">{review.comment || <span className="fst-italic">Không có bình luận</span>}</td>
                              <td>{new Date(review.date).toLocaleDateString('vi-VN')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {reviewsPagination && reviewsPagination.last_page > 1 && (
                      <div className="mt-3 pb-2 border-top pt-3">
                        <Pagination pagination={reviewsPagination} onPageChange={(p) => setPageState({ ...pageState, reviews: p })} itemName="đánh giá" />
                      </div>
                    )}
                  </div>
                )}

                {/* Staff: Managed Tours */}
                {activeTab === 'managed_tours' && (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Mã Tour</th>
                          <th>Tên Tour</th>
                          <th>Thời lượng</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities?.managed_tours?.length === 0 ? (
                          <tr><td colSpan="4" className="text-center py-4 text-muted">Chưa quản lý tour nào.</td></tr>
                        ) : (
                          paginatedTours.map(tour => (
                            <tr 
                              key={tour.id} 
                              onClick={() => navigate(`/staff/tours/${tour.id}`)}
                              style={{ cursor: 'pointer' }}
                              className="position-relative"
                            >
                              <td className="fw-bold text-secondary">#{tour.id}</td>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  {tour.image ? (
                                    <img src={buildImageUrl(tour.image)} alt={tour.name} className="rounded" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                                  ) : (
                                    <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ width: '48px', height: '48px' }}>
                                      <i className="fa-solid fa-image"></i>
                                    </div>
                                  )}
                                  <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '200px' }} title={tour.name}>{tour.name}</div>
                                </div>
                              </td>
                              <td>{tour.duration}</td>
                              <td>
                                <StaffStatusBadge status={tour.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {toursPagination && toursPagination.last_page > 1 && (
                      <div className="mt-3 pb-2 border-top pt-3">
                        <Pagination pagination={toursPagination} onPageChange={(p) => setPageState({ ...pageState, managed_tours: p })} itemName="tour" />
                      </div>
                    )}
                  </div>
                )}

                {/* Staff: News */}
                {activeTab === 'news' && (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Tiêu đề</th>
                          <th>Ngày đăng</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities?.news?.length === 0 ? (
                          <tr><td colSpan="4" className="text-center py-4 text-muted">Chưa đăng bài viết nào.</td></tr>
                        ) : (
                          paginatedNews.map(news => (
                            <tr 
                              key={news.id}
                              onClick={() => navigate(`/staff/news/${news.id}`)}
                              style={{ cursor: 'pointer' }}
                              className="position-relative"
                            >
                              <td className="fw-bold text-secondary">#{news.id}</td>
                              <td>
                                <div className="d-flex align-items-center gap-3">
                                  {news.image ? (
                                    <img src={buildImageUrl(news.image)} alt={news.title} className="rounded" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                                  ) : (
                                    <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ width: '48px', height: '48px' }}>
                                      <i className="fa-solid fa-image"></i>
                                    </div>
                                  )}
                                  <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '250px' }} title={news.title}>{news.title}</div>
                                </div>
                              </td>
                              <td>{new Date(news.date).toLocaleDateString('vi-VN')}</td>
                              <td>
                                <StaffStatusBadge status={news.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {newsPagination && newsPagination.last_page > 1 && (
                      <div className="mt-3 pb-2 border-top pt-3">
                        <Pagination pagination={newsPagination} onPageChange={(p) => setPageState({ ...pageState, news: p })} itemName="tin tức" />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'business_requests' && (
                  <div>
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="text-secondary small fw-bold">ID</th>
                          <th className="text-secondary small fw-bold">CÔNG TY</th>
                          <th className="text-secondary small fw-bold">NGƯỜI LIÊN HỆ</th>
                          <th className="text-secondary small fw-bold">NGÀY GỬI</th>
                          <th className="text-secondary small fw-bold">TRẠNG THÁI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities?.business_requests?.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-4 text-muted">Chưa xử lý yêu cầu nào.</td></tr>
                        ) : (
                          paginatedBusinessRequests.map(req => (
                            <tr 
                              key={req.id}
                              onClick={() => navigate(`/staff/business-requests/${req.id}`)}
                              style={{ cursor: 'pointer' }}
                              className="position-relative"
                            >
                              <td className="fw-bold text-secondary">#{req.id}</td>
                              <td className="fw-medium text-truncate" style={{ maxWidth: '200px' }} title={req.company}>{req.company}</td>
                              <td>{req.contact}</td>
                              <td>{new Date(req.date).toLocaleDateString('vi-VN')}</td>
                              <td>
                                <StaffStatusBadge status={req.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {businessRequestsPagination && businessRequestsPagination.last_page > 1 && (
                      <div className="mt-3 pb-2 border-top pt-3">
                        <Pagination pagination={businessRequestsPagination} onPageChange={(p) => setPageState({ ...pageState, business_requests: p })} itemName="yêu cầu" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .nav-tabs-custom { border-bottom: 2px solid #f0f2f5; }
        .nav-tabs-custom .nav-link { 
          color: #6c757d; font-weight: 500; padding: 12px 20px; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; background: transparent;
        }
        .nav-tabs-custom .nav-link:hover { color: #0d6efd; border-color: transparent; }
        .nav-tabs-custom .nav-link.active { color: #0d6efd; border-bottom: 2px solid #0d6efd; }
      `}</style>
    </div>
  )
}

export default StaffAccountDetailsPage
