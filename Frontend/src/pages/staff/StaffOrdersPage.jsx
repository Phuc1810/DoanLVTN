import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { staffOrderApi } from '../../api/staffOrderApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import StaffTable from '../../components/staff/StaffTable'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { countPeople, extractList, extractPagination, normalizeError } from './staffPageUtils'

export default function StaffOrdersPage() {
  const [filters, setFilters] = useState({ q: '', TrangThai: '', page: 1 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })

  useEffect(() => {
    staffOrderApi.list(filters)
      .then((payload) => setState({ loading: false, error: '', rows: extractList(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }, [filters])

  return (
    <>
      <div className="page-header"><h1 className="page-title">Đơn đặt tour</h1></div>
      <div className="toolbar-card">
        <div className="search-form">
          <div className="search-group"><input className="search-input" value={filters.q} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value, page: 1 }))} placeholder="Tìm mã đơn, khách hàng, tour..." /></div>
          <div className="search-group"><select className="search-select" value={filters.TrangThai} onChange={(e) => setFilters((c) => ({ ...c, TrangThai: e.target.value, page: 1 }))}><option value="">Trạng thái</option><option>Chờ xử lý</option><option>Đã thanh toán</option><option>Đã hủy</option></select></div>
        </div>
      </div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <StaffTable>
          {state.rows.length === 0 ? <EmptyState /> : (
            <table className="table">
              <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tour</th><th>Ngày đặt</th><th>Số người</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thanh toán</th><th></th></tr></thead>
              <tbody>
                {state.rows.map((order) => (
                  <tr key={order.MaDon}>
                    <td className="col-id">#{order.MaDon}</td>
                    <td>{order.khach_hang?.HoTen || order.KhachHang?.HoTen || order.HoTen}</td>
                    <td><span className="cell-truncate">{order.tour?.TenTour || order.Tour?.TenTour || order.TenTour}</span></td>
                    <td>{formatDate(order.NgayDat)}</td>
                    <td>{countPeople(order)}</td>
                    <td>{formatCurrency(order.TongTienPhaiTra || order.TongTienGoc)}</td>
                    <td><StaffStatusBadge status={order.TrangThai} /></td>
                    <td><StaffStatusBadge status={order.thanh_toan?.TrangThaiTT || order.TrangThaiTT} /></td>
                    <td><Link className="view-all" to={`/staff/orders/${order.MaDon}`}>Chi tiết</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </StaffTable>
      )}
      <Pagination pagination={state.pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
    </>
  )
}
