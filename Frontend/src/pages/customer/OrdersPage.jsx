import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { orderApi } from '../../api/orderApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import OrderTable from '../../components/orders/OrderTable'
import { listFrom, paginationFrom } from '../../utils/data'

const statuses = ['', 'Chờ thanh toán', 'Đã thanh toán', 'Đang diễn ra', 'Đã hoàn tất', 'Hết chỗ', 'Đã huỷ', 'Đã hoàn tiền']

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState({ loading: true, error: '', orders: [], pagination: null })

  useEffect(() => {
    orderApi.getOrders({ status: searchParams.get('status') || '', page: searchParams.get('page') || 1 })
      .then((payload) => setState({ loading: false, error: '', orders: listFrom(payload), pagination: paginationFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, orders: [], pagination: null }))
  }, [searchParams])

  function filter(event) {
    const value = event.target.value
    setSearchParams(value ? { status: value } : {})
  }

  return (
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5">
        <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start">
          <div>
            <div className="title"><i className="fa-solid fa-receipt me-2"></i>Đơn hàng của tôi</div>
            <div className="muted mt-1">Danh sách các đơn đặt tour của bạn.</div>
          </div>
        </div>
        <div className="divider"></div>
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label fw-semibold mb-1">Lọc theo trạng thái</label>
            <select className="form-select" value={searchParams.get('status') || ''} onChange={filter}>
              {statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'Tất cả'}</option>)}
            </select>
          </div>
        </div>
        <div className="divider"></div>
        {state.loading && <Loading />}
        {state.error && <ErrorState message={state.error} />}
        {!state.loading && !state.error && (state.orders.length ? <OrderTable orders={state.orders} /> : <EmptyState message="Bạn chưa có đơn hàng nào." />)}
      </div>
    </div>
  )
}
