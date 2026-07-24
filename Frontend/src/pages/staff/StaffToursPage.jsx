import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { staffTourApi } from '../../api/staffTourApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import StaffTable from '../../components/staff/StaffTable'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { extractList, extractPagination, firstImageOfTour, imageSrc, normalizeError } from './staffPageUtils'

const STATUS_COLORS = {
  'Hoạt động': '#15803d', // success
  'Ngừng hoạt động': '#64748b', // secondary
  'Hết chỗ': '#b91c1c', // danger
}

export default function StaffToursPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (location.state?.toastMessage) {
      setToastMessage(location.state.toastMessage)
      window.history.replaceState({}, document.title)
      const timer = setTimeout(() => setToastMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [location.state])

  const [filters, setFilters] = useState({ q: '', loai: '', tt: '', page: 1, per_page: 5 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })
  const [metadata, setMetadata] = useState({ loaiList: [], ttList: [] })
  const [stats, setStats] = useState(null)

  const fetchStats = () => {
    staffTourApi.stats()
      .then((payload) => setStats(payload?.data || payload))
      .catch(console.error)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    staffTourApi.metadata().then(res => {
      const data = res?.data || res
      setMetadata({
        loaiList: data.loaiList || [],
        ttList: data.ttList || []
      })
    }).catch(console.error)
  }, [])

  useEffect(() => {
    staffTourApi.list(filters)
      .then((payload) => setState({ loading: false, error: '', rows: extractList(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }, [filters])

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value, page: 1 }))
  }

  const [toggleModal, setToggleModal] = useState({ isOpen: false, tourId: null, isActive: false })

  async function confirmToggle() {
    if (!toggleModal.tourId) return
    await staffTourApi.toggle(toggleModal.tourId)
    setFilters((current) => ({ ...current }))
    setToggleModal({ isOpen: false, tourId: null, isActive: false })
  }

  // Replaced toggleTour with confirmToggle and state


  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Tour</h1>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: '14px' }}>Quản lý danh sách, trạng thái và thông tin các tour</p>
        </div>
        <Link className="staff-link-btn btn-indigo" to="/staff/tours/create">Thêm Tour mới</Link>
      </div>

      <div className="row g-4 mb-4">
        {/* Trend Chart */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: '#fff' }}>
            <h5 className="fw-bold mb-1" style={{ fontSize: '18px', color: '#1e293b' }}>Xu hướng Khởi hành</h5>
            <p className="text-muted mb-4" style={{ fontSize: '14px' }}>Thống kê số lượng tour khởi hành trong 7 ngày tới</p>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.departure_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value) => [value, 'Tour khởi hành']} />
                  <Area type="monotone" dataKey="tours" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTours)" activeDot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} dot={{ r: 4, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} />
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
                const totalStatusValue = (stats?.status_ratio || []).reduce((sum, item) => sum + item.value, 0);
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
          <div className="col-md-6">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0" style={{ color: '#6b7280', paddingRight: '4px', paddingLeft: '16px' }}>
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input type="text" className="form-control bg-transparent border-0 shadow-none text-dark fw-medium" name="q" value={filters.q} onChange={updateFilter} placeholder="Tìm tên tour, địa điểm..." style={{ fontSize: '14.5px', padding: '10px 12px' }} />
            </div>
          </div>
          
          {/* Loại */}
          <div className="col-md-3">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0" style={{ color: '#6b7280', paddingRight: '4px', paddingLeft: '16px' }}>
                <i className="fa-solid fa-filter"></i>
              </span>
              <select className="form-select bg-transparent border-0 shadow-none text-dark fw-medium" name="loai" value={filters.loai} onChange={updateFilter} style={{ fontSize: '14.5px', padding: '10px 12px', cursor: 'pointer' }}>
                <option value="">-- Tất cả loại --</option>
                {metadata.loaiList.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </div>

          {/* Trạng thái */}
          <div className="col-md-3">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0" style={{ color: '#6b7280', paddingRight: '4px', paddingLeft: '16px' }}>
                <i className="fa-solid fa-toggle-on"></i>
              </span>
              <select className="form-select bg-transparent border-0 shadow-none text-dark fw-medium" name="tt" value={filters.tt} onChange={updateFilter} style={{ fontSize: '14.5px', padding: '10px 12px', cursor: 'pointer' }}>
                <option value="">-- Tất cả trạng thái --</option>
                {metadata.ttList.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <StaffTable
          footer={<Pagination pagination={state.pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} itemName="tour" />}
        >
          {state.rows.length === 0 ? <EmptyState /> : (
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center', fontWeight: 600, color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MÃ</th>
                  <th style={{ width: '100px', fontWeight: 600, color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ẢNH</th>
                  <th style={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>THÔNG TIN TOUR</th>
                  <th style={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GIÁ BÁN</th>
                  <th style={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CHỖ</th>
                  <th style={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LOẠI HÌNH</th>
                  <th style={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TRẠNG THÁI</th>
                  <th className="text-end" style={{ fontWeight: 600, color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {state.rows.map((tour) => {
                  const isActive = tour.TrangThai !== 'Ngừng hoạt động'
                  const g0 = Number(tour.GiaGoc || 0)
                  const gg = Number(tour.GiaGiam || 0)
                  const price = (gg > 0 && gg < g0) ? gg : g0
                  const soChoDaDat = Number(tour.SoChoDaDat || 0)
                  const soCho = Number(tour.SoCho || 0)
                  const percent = soCho > 0 ? Math.min(100, (soChoDaDat / soCho) * 100) : 0

                  return (
                    <tr key={tour.MaTour} onClick={() => navigate(`/staff/tours/${tour.MaTour}`)} style={{ cursor: 'pointer' }} className="hover-bg-light">
                      <td style={{ width: '60px', textAlign: 'center', fontWeight: 700, color: '#111827', padding: '16px 20px' }}>
                        #{tour.MaTour}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <img src={imageSrc(firstImageOfTour(tour))} alt={tour.TenTour} style={{ width: '80px', height: '55px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div className="fw-bold text-dark" style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '15px' }} title={tour.TenTour}>
                          {tour.TenTour}
                        </div>
                        <div className="small text-muted mt-1">
                          <i className="fa-solid fa-location-dot me-1 text-danger"></i>{tour.DiaDiem || '-'}
                          <span className="mx-1 text-secondary">•</span>
                          <i className="fa-regular fa-clock me-1 text-primary"></i>{tour.ThoiLuong || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div className="fw-bold text-dark">{formatCurrency(price)}</div>
                        {gg > 0 && gg < g0 && (
                          <div className="text-muted small text-decoration-line-through">{formatCurrency(g0)}</div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className="fw-bold">{soChoDaDat}</span> <span className="text-muted">/ {soCho}</span>
                        <div className="progress mt-1" style={{ height: '4px', width: '60px' }}>
                          <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${percent}%` }}></div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className="small text-muted">{tour.LoaiTour || tour.Mien || ''}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div className="d-flex flex-column gap-1 align-items-start">
                          <StaffStatusBadge status={tour.TrangThai} />
                          {tour.TienDo && <StaffStatusBadge status={tour.TienDo} />}
                        </div>
                      </td>
                      <td className="text-end" style={{ padding: '16px 20px' }}>
                        <Link 
                          className="btn btn-sm btn-outline-primary rounded-pill me-1" 
                          to={`/staff/tours/${tour.MaTour}/edit`} 
                          title="Sửa"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </Link>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setToggleModal({ isOpen: true, tourId: tour.MaTour, isActive }); }} 
                          className={`btn btn-sm rounded-pill ${isActive ? 'btn-outline-secondary' : 'btn-outline-success'}`} 
                          title={isActive ? 'Ngừng hoạt động' : 'Kích hoạt'}
                        >
                          {isActive ? <i className="fa-regular fa-eye-slash"></i> : <i className="fa-regular fa-eye"></i>}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </StaffTable>
      )}

      {toggleModal.isOpen && (
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
                    {toggleModal.isActive 
                      ? 'Bạn có muốn ngừng hoạt động tour này không?' 
                      : 'Bạn có muốn kích hoạt tour này không?'}
                  </h5>
                  <div className="d-flex justify-content-center gap-3 mt-2">
                    <button 
                      type="button" 
                      className="btn fw-medium modal-btn-cancel" 
                      onClick={() => setToggleModal({ isOpen: false, tourId: null, isActive: false })}
                    >
                      Hủy
                    </button>
                    <button 
                      type="button" 
                      className="btn fw-medium modal-btn-confirm" 
                      onClick={confirmToggle}
                    >
                      Đồng ý
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {toastMessage && (
        <div 
          className="toast align-items-center text-white bg-success border-0 show fade" 
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true"
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '250px' }}
        >
          <div className="d-flex">
            <div className="toast-body fw-semibold">
              <i className="fa-solid fa-circle-check me-2"></i>
              {toastMessage}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMessage('')} aria-label="Close"></button>
          </div>
        </div>
      )}
    </>
  )
}
