import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { orderApi } from '../../api/orderApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import OrderTable from '../../components/orders/OrderTable'
import { listFrom, paginationFrom } from '../../utils/data'

const statuses = ['', 'Chờ thanh toán', 'Đã thanh toán', 'Đang diễn ra', 'Đã hoàn tất', 'Yêu cầu huỷ', 'Đã huỷ', 'Đã hoàn tiền', 'Hết chỗ']

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '')
  const [state, setState] = useState({ loading: true, error: '', orders: [], pagination: null })

  useEffect(() => {
    const status = searchParams.get('status') || ''
    const page = Number(searchParams.get('page') || 1)

    setSelectedStatus(status)

    orderApi.getOrders({ status, page })
      .then((payload) => setState({
        loading: false,
        error: '',
        orders: listFrom(payload),
        pagination: paginationFrom(payload),
      }))
      .catch((error) => setState({ loading: false, error: error.message, orders: [], pagination: null }))
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
    setSearchParams(selectedStatus ? { status: selectedStatus } : {})
  }

  function goToPage(page) {
    const safePage = Math.min(Math.max(page, 1), totalPages)
    const next = {}
    if (selectedStatus) next.status = selectedStatus
    if (safePage > 1) next.page = String(safePage)
    setSearchParams(next)
  }

  return (
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5">
        <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start">
          <div>
            <div className="title"><i className="fa-solid fa-receipt me-2"></i>Đơn hàng của tôi</div>
            <div className="muted mt-1">Danh sách các đơn đặt tour của bạn.</div>
          </div>

          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to="/">
              <i className="fa-solid fa-house me-1"></i> Trang chủ
            </Link>
          </div>
        </div>

        <div className="divider"></div>

        <form className="row g-2 align-items-end" onSubmit={applyFilter}>
          <div className="col-md-4">
            <label className="form-label fw-semibold mb-1">Lọc theo trạng thái</label>
            <select className="form-select" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
              {statuses.map((status) => (
                <option key={status || 'all'} value={status}>
                  {status || 'Tất cả'}
                </option>
              ))}
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

        {!state.loading && !state.error && !state.orders.length && (
          <EmptyState
            message={`Bạn chưa có đơn hàng nào${selectedStatus ? ' với trạng thái đã chọn' : ''}.`}
          />
        )}

        {!state.loading && !state.error && state.orders.length > 0 && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="muted small">Tổng: <b>{total}</b> đơn</div>
              <div className="muted small">Trang {currentPage} / {totalPages}</div>
            </div>

            <OrderTable orders={state.orders} />

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
