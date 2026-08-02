import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import adminReviewApi from '../../api/adminReviewApi'
import Loading from '../../components/common/Loading'
import ErrorState from '../../components/common/ErrorState'
import Pagination from '../../components/common/Pagination'
import { Star, MessageSquare, EyeOff, Eye, Search, Filter, Reply, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function AdminReviewsPage() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    rows: [],
    pagination: null,
  })

  const [filters, setFilters] = useState({
    q: '',
    sosao: '',
    trangthai: '',
    page: 1,
  })

  const [replyModal, setReplyModal] = useState({ isOpen: false, reviewId: null, reviewText: '', customerName: '', phanHoiCu: '' })
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, reviewId: null, isHidden: false })
  const [replyContent, setReplyContent] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [filters])

  const fetchReviews = () => {
    setState(prev => ({ ...prev, loading: true, error: '' }))
    adminReviewApi.list(filters)
      .then(res => {
        // res is body.data from axiosClient
        const dataArray = res.data ? res.data : res;
        const pagination = res.current_page ? res : null;

        setState({
          loading: false,
          error: '',
          rows: Array.isArray(dataArray) ? dataArray : [],
          pagination: pagination
        })
      })
      .catch(err => {
        setState(prev => ({ ...prev, loading: false, error: err.message || 'Lỗi tải dữ liệu' }))
      })
  }

  const updateFilter = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const executeToggleStatus = async () => {
    if (!confirmModal.reviewId) return
    
    setActionLoading(true)
    try {
      const res = await adminReviewApi.toggleStatus(confirmModal.reviewId)
      showToast(res.message || 'Đã cập nhật trạng thái')
      fetchReviews()
      setConfirmModal({ isOpen: false, reviewId: null, isHidden: false })
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const openReplyModal = (review) => {
    setReplyContent(review.PhanHoi || '')
    setReplyModal({
      isOpen: true,
      reviewId: review.MaDG,
      reviewText: review.NoiDung,
      customerName: review.khach_hang?.HoTen || 'Khách hàng',
      phanHoiCu: review.PhanHoi
    })
  }

  const closeReplyModal = () => {
    setReplyModal({ isOpen: false, reviewId: null, reviewText: '', customerName: '', phanHoiCu: '' })
    setReplyContent('')
  }

  const submitReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setActionLoading(true)
    try {
      const res = await adminReviewApi.reply(replyModal.reviewId, { PhanHoi: replyContent.trim() })
      showToast(res.message || 'Đã gửi phản hồi thành công')
      closeReplyModal()
      fetchReviews()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const renderStars = (rating) => {
    return (
      <div className="d-flex text-warning">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={16} fill={star <= rating ? "currentColor" : "none"} className={star <= rating ? "text-warning" : "text-muted opacity-25"} />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title fw-bold text-dark mb-1" style={{ fontSize: '24px' }}>Quản lý Đánh giá</h1>
          <p className="text-muted mb-0" style={{ fontSize: '14.5px' }}>Kiểm duyệt và phản hồi đánh giá từ khách hàng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 p-3" style={{ backgroundColor: '#fff' }}>
        <div className="row g-3">
          <div className="col-md-5">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0 text-muted" style={{ paddingRight: '4px', paddingLeft: '16px' }}>
                <Search size={18} />
              </span>
              <input 
                type="text" 
                className="form-control bg-transparent border-0 shadow-none text-dark fw-medium" 
                name="q" 
                value={filters.q} 
                onChange={updateFilter} 
                placeholder="Tìm tên khách hàng, nội dung đánh giá..." 
                style={{ fontSize: '14.5px', padding: '10px 12px' }} 
              />
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0 text-muted" style={{ paddingRight: '4px', paddingLeft: '16px' }}>
                <Star size={18} />
              </span>
              <select className="form-select bg-transparent border-0 shadow-none text-dark fw-medium" name="sosao" value={filters.sosao} onChange={updateFilter} style={{ fontSize: '14.5px', padding: '10px 12px', cursor: 'pointer' }}>
                <option value="">-- Tất cả số sao --</option>
                <option value="5">5 Sao</option>
                <option value="4">4 Sao</option>
                <option value="3">3 Sao</option>
                <option value="2">2 Sao</option>
                <option value="1">1 Sao</option>
              </select>
            </div>
          </div>

          <div className="col-md-3">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0 text-muted" style={{ paddingRight: '4px', paddingLeft: '16px' }}>
                <Filter size={18} />
              </span>
              <select className="form-select bg-transparent border-0 shadow-none text-dark fw-medium" name="trangthai" value={filters.trangthai} onChange={updateFilter} style={{ fontSize: '14.5px', padding: '10px 12px', cursor: 'pointer' }}>
                <option value="">-- Tất cả trạng thái --</option>
                <option value="Hiển thị">Hiển thị</option>
                <option value="Đã ẩn">Đã ẩn</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && state.rows.length === 0 && (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm">
          <MessageSquare size={48} className="text-muted mb-3 opacity-50" />
          <h5 className="text-muted">Không tìm thấy đánh giá nào</h5>
        </div>
      )}

      {!state.loading && !state.error && state.rows.length > 0 && (
        <div className="row g-4">
          {state.rows.map(review => {
            const isHidden = review.TrangThai === 'Đã ẩn'
            const hasReply = !!review.PhanHoi
            
            return (
              <div key={review.MaDG} className="col-12">
                <div className={`card border-0 shadow-sm rounded-4 ${isHidden ? 'opacity-75' : ''}`} style={{ backgroundColor: isHidden ? '#f8fafc' : '#fff', transition: 'all 0.3s ease' }}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <img 
                          src={'https://ui-avatars.com/api/?name=' + (review.khach_hang?.HoTen || 'U')} 
                          alt="Avatar" 
                          className="rounded-circle object-fit-cover shadow-sm"
                          style={{ width: '48px', height: '48px', border: '2px solid #e2e8f0' }}
                        />
                        <div>
                          <h6 className="mb-1 fw-bold text-dark">{review.khach_hang?.HoTen || 'Khách hàng ẩn danh'}</h6>
                          <div className="d-flex align-items-center gap-2">
                            {renderStars(review.SoSao)}
                            <span className="text-muted" style={{ fontSize: '13px' }}>• {new Date(review.NgayDG).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <span className={`badge ${isHidden ? 'bg-danger text-white' : 'bg-success text-white'} rounded-pill px-3 py-2 fw-medium`} style={{ fontSize: '12px' }}>
                          {isHidden ? 'Đã ẩn' : 'Hiển thị'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3 px-3 py-2 bg-light rounded-3 d-inline-block">
                      <Link to={`/tours/${review.MaTour}`} target="_blank" className="text-decoration-none fw-medium" style={{ color: '#0265d2', fontSize: '14px' }}>
                        Tour: {review.tour?.TenTour || 'Tour không tồn tại'}
                      </Link>
                    </div>

                    <p className="text-dark mb-4" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                      {review.NoiDung}
                    </p>

                    {hasReply && (
                      <div className="mb-4 ms-4 p-3 rounded-4" style={{ backgroundColor: '#f1f5f9', borderLeft: '4px solid #3b82f6' }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <CheckCircle2 size={16} className="text-primary" />
                          <span className="fw-bold text-primary" style={{ fontSize: '14px' }}>Phản hồi từ Quản trị viên</span>
                        </div>
                        <p className="mb-0 text-dark" style={{ fontSize: '14.5px', lineHeight: '1.5' }}>{review.PhanHoi}</p>
                      </div>
                    )}

                    <div className="d-flex gap-2 pt-3 border-top">
                      <button 
                        className={`btn btn-sm px-3 py-2 fw-medium d-flex align-items-center gap-2 ${isHidden ? 'btn-outline-success' : 'btn-outline-danger'}`}
                        style={{ borderRadius: '8px' }}
                        onClick={() => setConfirmModal({ isOpen: true, reviewId: review.MaDG, isHidden })}
                        disabled={actionLoading}
                      >
                        {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                        {isHidden ? 'Hiển thị lại' : 'Ẩn đánh giá'}
                      </button>
                      <button 
                        className="btn btn-sm px-3 py-2 fw-medium d-flex align-items-center gap-2 btn-primary"
                        style={{ borderRadius: '8px' }}
                        onClick={() => openReplyModal(review)}
                        disabled={actionLoading}
                      >
                        <Reply size={16} />
                        {hasReply ? 'Sửa phản hồi' : 'Phản hồi'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!state.loading && state.pagination && state.pagination.last_page > 1 && (
        <div className="mt-4 d-flex justify-content-center">
          <Pagination
            currentPage={state.pagination.current_page}
            totalPages={state.pagination.last_page}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <>
          <style>
            {`
              .modal-btn-cancel {
                border-radius: 24px; padding: 8px 32px; border: 1px solid #d1d5db; color: #6b7280; background-color: #ffffff; font-size: 16px; transition: all 0.2s ease;
              }
              .modal-btn-cancel:hover {
                background-color: #f3f4f6 !important; color: #374151 !important; border-color: #9ca3af;
              }
              .modal-btn-confirm {
                border-radius: 24px; padding: 8px 32px; background-color: #0265d2; border: none; color: #ffffff; font-size: 16px; transition: all 0.2s ease;
              }
              .modal-btn-confirm:hover {
                background-color: #004a99 !important; color: #ffffff !important; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              }
            `}
          </style>
          <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <div className="modal-body text-center p-4">
                  <div className="mb-4 d-flex justify-content-center">
                    <div style={{
                      width: '64px', height: '64px', backgroundColor: '#3b82f6',
                      borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'white', fontSize: '36px',
                      fontWeight: 'bold', fontFamily: 'Arial, sans-serif'
                    }}>
                      ?
                    </div>
                  </div>
                  <h5 className="mb-4 fw-bold" style={{ color: '#1f2937', fontSize: '20px', lineHeight: '1.5' }}>
                    {confirmModal.isHidden ? 'Bạn có muốn hiển thị lại đánh giá này không?' : 'Bạn có muốn ẩn đánh giá này không?'}
                  </h5>
                  <div className="d-flex justify-content-center gap-3 mt-2">
                    <button 
                      type="button" 
                      className="btn fw-medium modal-btn-cancel" 
                      onClick={() => setConfirmModal({ isOpen: false, reviewId: null, isHidden: false })}
                      disabled={actionLoading}
                    >
                      Hủy
                    </button>
                    <button 
                      type="button" 
                      className="btn fw-medium modal-btn-confirm" 
                      onClick={executeToggleStatus}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Đồng ý'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reply Modal */}
      {replyModal.isOpen && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                <form onSubmit={submitReply}>
                  <div className="modal-header border-bottom-0 bg-light p-4">
                    <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                      <Reply size={20} className="text-primary" />
                      Phản hồi Đánh giá
                    </h5>
                    <button type="button" className="btn-close shadow-none" onClick={closeReplyModal}></button>
                  </div>
                  <div className="modal-body p-4">
                    <div className="p-3 mb-4 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <span className="fw-semibold text-dark d-block mb-1" style={{ fontSize: '13px' }}>{replyModal.customerName} đã viết:</span>
                      <span className="text-muted fst-italic" style={{ fontSize: '14px' }}>"{replyModal.reviewText}"</span>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark small">Nội dung phản hồi <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control shadow-none"
                        rows="4"
                        placeholder="Nhập nội dung trả lời khách hàng..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        style={{ borderRadius: '10px', padding: '12px', fontSize: '14.5px', resize: 'none', border: '1px solid #cbd5e1' }}
                        autoFocus
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 bg-light p-4 pt-0 d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-light fw-medium px-4 py-2" onClick={closeReplyModal} style={{ borderRadius: '10px', border: '1px solid #cbd5e1' }} disabled={actionLoading}>
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary fw-medium px-4 py-2 d-flex align-items-center gap-2" style={{ borderRadius: '10px' }} disabled={!replyContent.trim() || actionLoading}>
                      {actionLoading ? <span className="spinner-border spinner-border-sm"></span> : <Reply size={18} />}
                      Gửi phản hồi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className="toast align-items-center text-white bg-success border-0 show fade shadow-lg" 
          style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, minWidth: '300px', borderRadius: '12px' }}
        >
          <div className="d-flex p-2">
            <div className="toast-body fw-medium d-flex align-items-center gap-2" style={{ fontSize: '15px' }}>
              <CheckCircle2 size={20} />
              {toastMessage}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMessage('')}></button>
          </div>
        </div>
      )}
    </>
  )
}
