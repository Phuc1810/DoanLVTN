import { Banknote, CheckCircle2, ClipboardList, MapPin, RefreshCw, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
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

const STATUS_COLORS = {
  'Chờ thanh toán': '#b45309', // warning
  'Đã thanh toán': '#1d4ed8', // info
  'Yêu cầu huỷ': '#b45309', // warning
  'Đang diễn ra': '#7e22ce', // purple
  'Đã hoàn tất': '#15803d', // success
  'Hết chỗ': '#b91c1c', // danger
  'Đã huỷ': '#b91c1c', // danger
  'Đã hoàn tiền': '#be185d', // pink
}

export default function StaffOrdersPage() {
  const navigate = useNavigate()
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

  const totalStatusValue = (stats?.status_ratio || []).reduce((acc, curr) => acc + curr.value, 0);

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
        {/* Revenue Trend Chart */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: '#fff' }}>
            <h5 className="fw-bold mb-1" style={{ fontSize: '18px', color: '#1e293b' }}>Xu hướng doanh thu</h5>
            <p className="text-muted mb-4" style={{ fontSize: '14px' }}>Thống kê 7 ngày gần nhất</p>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.revenue_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} tickFormatter={(value) => value >= 1000000 ? (value / 1000000) + 'M' : value >= 1000 ? (value / 1000) + 'k' : value} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} dot={{ r: 4, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Status Ratio Chart */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4" style={{ backgroundColor: '#fff' }}>
            <h5 className="fw-bold mb-4" style={{ fontSize: '18px', color: '#1e293b' }}>Tỷ lệ Trạng thái</h5>
            
            <div style={{ height: '200px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>100%</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Tổng cộng</div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.status_ratio || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {(stats?.status_ratio || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2">
              {(stats?.status_ratio || []).map((entry, index) => {
                const percent = totalStatusValue > 0 ? (entry.value / totalStatusValue * 100) : 0;
                return (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: STATUS_COLORS[entry.name] || '#94a3b8', marginRight: '8px', display: 'inline-block' }}></span>
                      <span style={{ fontSize: '14px', color: '#475569' }}>{entry.name}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                      {percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>

          </div>
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
                <option value="Yêu cầu huỷ">Yêu cầu huỷ</option>
                <option value="Đã huỷ">Đã huỷ</option>
                <option value="Đã hoàn tiền">Đã hoàn tiền</option>
                <option value="Đang diễn ra">Đang diễn ra</option>
                <option value="Đã hoàn tất">Đã hoàn tất</option>
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
            <table className="table table-hover">
              <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Tour</th><th>Ngày đặt</th><th>Số người</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thanh toán</th></tr></thead>
              <tbody>
                {state.rows.map((order) => (
                  <tr 
                    key={order.MaDon}
                    onClick={() => navigate('/staff/orders/' + order.MaDon)}
                    style={{ cursor: 'pointer' }}
                    className="hover-bg-light"
                  >
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
