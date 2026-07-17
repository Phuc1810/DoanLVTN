import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { staffBusinessRequestApi } from '../../api/staffBusinessRequestApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import StaffTable from '../../components/staff/StaffTable'
import { formatDate } from '../../utils/formatDate'
import { extractList, extractPagination, getId, normalizeError } from './staffPageUtils'
import { RefreshCw, User, Phone, Calendar, Users } from 'lucide-react'

const STATUS_COLORS = {
  'Chờ xử lý': '#b45309', // warning
  'Đã liên hệ': '#1d4ed8', // info
  'Hủy tour': '#b91c1c', // danger
  'Hoàn thành': '#15803d', // success
}

export default function StaffBusinessRequestsPage() {
  const [filters, setFilters] = useState({ q: '', TrangThai: '', page: 1, per_page: 5 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })
  const [stats, setStats] = useState(null)

  const fetchRequests = () => {
    setState((prev) => ({ ...prev, loading: true }))
    staffBusinessRequestApi.list(filters)
      .then((payload) => setState({ loading: false, error: '', rows: extractList(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }

  const fetchStats = () => {
    staffBusinessRequestApi.stats()
      .then((payload) => setStats(payload))
      .catch(console.error)
  }

  useEffect(() => {
    fetchRequests()
  }, [filters])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleRefresh = () => {
    fetchRequests()
    fetchStats()
  }

  const totalStatusValue = (stats?.status_ratio || []).reduce((sum, item) => sum + item.value, 0)

  return (
    <>
      <div className="page-header align-items-start">
        <div>
          <h1 className="page-title">Yêu cầu doanh nghiệp</h1>
          <p className="text-muted mt-1 mb-0">Quản lý và theo dõi các yêu cầu hợp tác từ doanh nghiệp</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center" onClick={handleRefresh}>
          <RefreshCw size={16} className="me-2" /> Làm mới
        </button>
      </div>

      <div className="row g-4 mb-4">
        {/* Trend Chart */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: '#fff' }}>
            <h5 className="fw-bold mb-1" style={{ fontSize: '18px', color: '#1e293b' }}>Xu hướng yêu cầu</h5>
            <p className="text-muted mb-4" style={{ fontSize: '14px' }}>Thống kê 7 ngày gần nhất</p>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.request_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value) => [value, 'Yêu cầu']} />
                  <Area type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" activeDot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} dot={{ r: 4, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} />
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
              <input type="text" className="form-control bg-transparent border-0 shadow-none text-dark fw-medium" value={filters.q} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value, page: 1 }))} placeholder="Tìm tên công ty, người liên hệ, SĐT..." style={{ fontSize: '14.5px', padding: '10px 12px' }} />
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
                <option value="Chờ xử lý">Chờ xử lý</option>
                <option value="Đã liên hệ">Đã liên hệ</option>
                <option value="Hủy tour">Hủy tour</option>
                <option value="Hoàn thành">Hoàn thành</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <StaffTable
          footer={<Pagination pagination={state.pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} itemName="yêu cầu" />}
        >
          {state.rows.length === 0 ? <EmptyState /> : (
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Mã YC</th>
                  <th>Thông tin Công ty / Liên hệ</th>
                  <th>Thông tin Tour / Đoàn</th>
                  <th>Trạng thái</th>
                  <th>NV Phụ trách</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((request) => {
                  const requestId = getId(request, ['MaYC', 'MaYCDN', 'id'])
                  const staffName = request.nhan_vien?.HoTen || request.NhanVien?.HoTen
                  return (
                    <tr key={requestId}>
                      <td><span className="fw-bold">#{requestId}</span></td>

                      <td>
                        <div className="fw-bold text-primary">{request.cong_ty?.TenCongTy || request.TenCongTy || request.TenDoanhNghiep || '—'}</div>
                        <div className="small text-muted mt-1">
                          <User size={13} className="me-1" />{request.NguoiLienHe || request.HoTen || '—'}
                          <span className="mx-1">•</span>
                          <Phone size={13} className="me-1" />{request.SoDienThoai || request.SDT || '—'}
                        </div>
                      </td>

                      <td>
                        <div className="fw-bold">{request.TenTour || request.tour?.TenTour || 'Tour theo yêu cầu riêng'}</div>
                        <div className="small text-muted mt-1">
                          <Calendar size={13} className="me-1" />{formatDate(request.ThoiGianKhoiHanh || request.NgayKhoiHanh) || '—'}
                          <span className="mx-1">•</span>
                          <Users size={13} className="me-1" />{request.SoNguoi || 0} khách
                        </div>
                      </td>

                      <td><StaffStatusBadge status={request.TrangThai} /></td>

                      <td>
                        {staffName ? (
                          <div className="d-flex align-items-center">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2 flex-shrink-0" 
                              style={{ width: '24px', height: '24px', backgroundColor: '#f97316', fontSize: '12px' }}
                            >
                              {staffName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-primary fw-medium">{staffName}</span>
                          </div>
                        ) : (
                          'Chưa gán'
                        )}
                      </td>

                      <td className="text-center">
                        <Link className="btn btn-outline-primary btn-sm rounded-pill px-3" to={`/staff/business-requests/${requestId}`}>Chi tiết</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </StaffTable>
      )}
    </>
  )
}
