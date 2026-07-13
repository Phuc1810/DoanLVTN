import { Banknote, CheckCircle2, ClipboardList, MapPin, RefreshCw, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { staffOrderApi } from '../../api/staffOrderApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import StaffTable from '../../components/staff/StaffTable'
import StaffStatCard from '../../components/staff/StaffStatCard'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { countPeople, extractList, extractPagination, normalizeError } from './staffPageUtils'

export default function StaffOrdersPage() {
  const [filters, setFilters] = useState({ q: '', TrangThai: '', page: 1, per_page: 5 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })
  const [stats, setStats] = useState(null)

  const fetchOrders = () => {
    setState((prev) => ({ ...prev, loading: true }))
    staffOrderApi.list(filters)
      .then((payload) => setState({ loading: false, error: '', rows: extractList(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }

  const fetchStats = () => {
    staffOrderApi.stats()
      .then((payload) => setStats(payload))
      .catch(console.error)
  }

  useEffect(() => {
    fetchOrders()
  }, [filters])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleRefresh = () => {
    fetchOrders()
    fetchStats()
  }

  return (
    <>
      <div className="page-header align-items-start">
        <div>
          <h1 className="page-title">Quản lý Đơn đặt tour</h1>
          <p className="text-muted mt-1 mb-0">Theo dõi và xử lý các đơn hàng từ khách hàng</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center" onClick={handleRefresh}>
          <RefreshCw size={16} className="me-2" /> Làm mới
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<ClipboardList size={22} />}
            label="Chờ thanh toán"
            value={stats ? stats.pending_orders : 0}
            tone="orange"
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<CheckCircle2 size={22} />}
            label="Đã thanh toán"
            value={stats ? stats.paid_orders : 0}
            tone="green"
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<XCircle size={22} />}
            label="Đã hủy"
            value={stats ? stats.cancelled_orders : 0}
            tone="red"
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<Banknote size={22} />}
            label="Doanh thu ngày"
            value={stats ? formatCurrency(stats.daily_revenue) : '0 đ'}
            tone="blue"
          />
        </div>
      </div>
      {/* Filters Toolbar */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 p-2" style={{ backgroundColor: '#fff' }}>
        <div className="row g-2">
          {/* Search */}
          <div className="col-md-9">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0" style={{ color: '#6b7280', paddingRight: '4px', paddingLeft: '16px' }}>
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input type="text" className="form-control bg-transparent border-0 shadow-none text-dark fw-medium" value={filters.q} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value, page: 1 }))} placeholder="Nhập mã đơn, tên tour..." style={{ fontSize: '14.5px', padding: '10px 12px' }} />
            </div>
          </div>

          {/* Trạng thái */}
          <div className="col-md-3">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0" style={{ color: '#6b7280', paddingRight: '4px', paddingLeft: '16px' }}>
                <i className="fa-solid fa-filter"></i>
              </span>
              <select className="form-select bg-transparent border-0 shadow-none text-dark fw-medium" value={filters.TrangThai} onChange={(e) => setFilters((c) => ({ ...c, TrangThai: e.target.value, page: 1 }))} style={{ fontSize: '14.5px', padding: '10px 12px', cursor: 'pointer' }}>
                <option value="">Tất cả trạng thái</option>
                <option value="Chờ thanh toán">Chờ thanh toán</option>
                <option value="Đã thanh toán">Đã thanh toán</option>
                <option value="Đang diễn ra">Đang diễn ra</option>
                <option value="Đã hoàn tất">Đã hoàn tất</option>
                <option value="Hết chỗ">Hết chỗ</option>
                <option value="Đã huỷ">Đã huỷ</option>
                <option value="Đã hoàn tiền">Đã hoàn tiền</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <StaffTable
          footer={<Pagination pagination={state.pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} itemName="đơn hàng" />}
        >
          {state.rows.length === 0 ? <EmptyState /> : (
            <table className="table">
              <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tour</th><th>Ngày đặt</th><th>Số người</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thanh toán</th><th></th></tr></thead>
              <tbody>
                {state.rows.map((order) => (
                  <tr key={order.MaDon}>
                    <td className="col-id">#{order.MaDon}</td>
                    <td>{order.khach_hang?.HoTen || order.KhachHang?.HoTen || order.HoTen}</td>
                    <td>
                      <div className="fw-medium cell-truncate" title={order.tour?.TenTour || order.Tour?.TenTour || order.TenTour}>
                        {order.tour?.TenTour || order.Tour?.TenTour || order.TenTour}
                      </div>
                      <div className="text-muted d-flex align-items-center mt-1" style={{ fontSize: '0.85rem' }}>
                        <MapPin size={14} className="me-1" />
                        <span className="cell-truncate" title={order.tour?.DiaDiem || order.DiaDiem || ''}>
                          {order.tour?.DiaDiem || order.DiaDiem || '—'}
                        </span>
                      </div>
                    </td>
                    <td>{formatDate(order.NgayDat)}</td>
                    <td>{countPeople(order)}</td>
                    <td>{formatCurrency(order.TongTienPhaiTra || order.TongTienGoc)}</td>
                    <td><StaffStatusBadge status={order.TrangThai} /></td>
                    <td><StaffStatusBadge status={order.payment?.TrangThaiTT || order.TrangThaiTT} /></td>
                    <td className="text-center">
                      <Link className="btn btn-outline-primary btn-sm rounded-pill px-3" to={`/staff/orders/${order.MaDon}`}>Chi tiết</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </StaffTable>
      )}
    </>
  )
}
