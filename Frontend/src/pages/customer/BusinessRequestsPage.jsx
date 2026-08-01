import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { businessRequestApi } from '../../api/businessRequestApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StatusBadge from '../../components/common/StatusBadge'
import { listFrom, paginationFrom } from '../../utils/data'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl } from '../../utils/imageUrl'

const statuses = ['', 'Chờ xử lý', 'Đã liên hệ', 'Hoàn thành', 'Hủy tour']

function reviewLink(request) {
  if (!request?.MaTour) return null
  return `/review-business-request/${request.MaYC || request.id}`
}

export default function BusinessRequestsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('st') || '')
  const [state, setState] = useState({ loading: true, error: '', requests: [], pagination: null })

  const handleCardClick = (e, id) => {
    if (e.target.closest('.business-request-right')) return
    navigate(`/business-requests/${id}`)
  }

  useEffect(() => {
    const st = searchParams.get('st') || ''
    const page = Number(searchParams.get('page') || 1)

    setSelectedStatus(st)

    businessRequestApi.getBusinessRequests({ st, page })
      .then((payload) => setState({
        loading: false,
        error: '',
        requests: listFrom(payload),
        pagination: paginationFrom(payload),
      }))
      .catch((error) => setState({ loading: false, error: error.message, requests: [], pagination: null }))
  }, [searchParams])

  const pagination = state.pagination || {}
  const currentPage = Number(pagination.current_page || 1)
  const totalPages = Number(pagination.last_page || 1)
  const total = Number(pagination.total || 0)

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)
    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }, [currentPage, totalPages])

  function applyFilter(event) {
    event.preventDefault()
    setSearchParams(selectedStatus ? { st: selectedStatus } : {})
  }

  function goToPage(page) {
    const safePage = Math.min(Math.max(page, 1), totalPages)
    const next = {}
    if (selectedStatus) next.st = selectedStatus
    if (safePage > 1) next.page = String(safePage)
    setSearchParams(next)
  }

  return (
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5">
        <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start">
          <div>
            <div className="title"><i className="fa-solid fa-building me-2"></i>Yêu cầu doanh nghiệp của tôi</div>
            <div className="muted mt-1">Danh sách các yêu cầu đặt tour doanh nghiệp bạn đã gửi.</div>
          </div>

          <Link className="btn btn-outline-secondary" to="/">
            <i className="fa-solid fa-house me-1"></i> Trang chủ
          </Link>
        </div>

        <div className="divider"></div>

        <form className="row g-2 align-items-end" onSubmit={applyFilter}>
          <div className="col-md-4">
            <label className="form-label fw-semibold mb-1">Lọc theo trạng thái</label>
            <select className="form-select" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="Chờ xử lý">Chờ xử lý</option>
            <option value="Đã liên hệ">Đã liên hệ</option>
            <option value="Đã thanh toán">Đã thanh toán</option>
            <option value="Đang diễn ra">Đang diễn ra</option>
            <option value="Đã hoàn tất">Đã hoàn tất</option>
            <option value="Hủy tour">Hủy tour</option>
          </select>
          </div>

          <div className="col-md-2">
            <button className="btn btn-primary w-100" type="submit">
              <i className="fa-solid fa-filter me-1"></i> Lọc
            </button>
          </div>
        </form>

        <div className="divider"></div>

        {state.loading && <Loading />}
        {state.error && <ErrorState message={state.error} />}

        {!state.loading && !state.error && !state.requests.length && (
          <EmptyState
            message={`Bạn chưa có yêu cầu nào${selectedStatus ? ' với trạng thái đã chọn' : ''}.`}
          />
        )}

        {!state.loading && !state.error && state.requests.length > 0 && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="muted small">Tổng: <b>{total}</b> yêu cầu</div>
              <div className="muted small">Trang {currentPage} / {totalPages}</div>
            </div>

            <div className="d-grid gap-3">
              {state.requests.map((item) => (
                <div 
                  className="business-request-item" 
                  key={item.MaYC || item.id}
                  onClick={(e) => handleCardClick(e, item.MaYC || item.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {item.image_url || item.AnhChinh ? (
                    <img className="business-request-thumb" src={buildImageUrl(item.image_url || item.AnhChinh)} alt={item.TenTour || ''} />
                  ) : (
                    <div className="business-request-thumb"></div>
                  )}

                  <div className="flex-grow-1">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <div className="business-request-name">{item.TenTour || 'Tour doanh nghiệp'}</div>
                      <StatusBadge status={item.TrangThai} />
                      <span className="badge text-bg-light">YC #{item.MaYC || item.id}</span>
                    </div>

                    <div className="business-request-meta mt-1">
                      <span><i className="fa-solid fa-building me-1"></i>{item.TenCongTy || '—'}</span>
                      <span><i className="fa-solid fa-user me-1"></i>{item.NguoiLienHe || '—'}</span>
                      <span><i className="fa-solid fa-phone me-1"></i>{item.SDT || '—'}</span>
                      <span><i className="fa-solid fa-users me-1"></i>Số người: {Number(item.SoNguoi || 0)}</span>
                      <span><i className="fa-regular fa-calendar-days me-1"></i>Khởi hành: {formatDate(item.ThoiGianKhoiHanh) || '—'}</span>
                      {item.DiaDiem && <span><i className="fa-solid fa-location-dot me-1"></i>{item.DiaDiem}</span>}
                    </div>
                  </div>

                  <div className="business-request-right">
                    {item.TrangThai === 'Đã hoàn tất' && reviewLink(item) && (
                      <Link className={`btn btn-detail ${item.MaDG ? 'btn-outline-primary' : 'btn-outline-warning'}`} to={reviewLink(item)}>
                        <i className={item.MaDG ? 'fa-solid fa-pen-to-square me-1' : 'fa-solid fa-star me-1'}></i>
                        {item.MaDG ? 'Chỉnh sửa đánh giá' : 'Đánh giá'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-4">
                <ul className="pagination justify-content-center mb-0">
                  <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" type="button" onClick={() => goToPage(currentPage - 1)}>«</button>
                  </li>

                  {pageNumbers.map((page) => (
                    <li className={`page-item ${page === currentPage ? 'active' : ''}`} key={page}>
                      <button className="page-link" type="button" onClick={() => goToPage(page)}>{page}</button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" type="button" onClick={() => goToPage(currentPage + 1)}>»</button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}
