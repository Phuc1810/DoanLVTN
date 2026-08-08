import React, { useEffect, useState } from 'react'
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
  'Sắp khởi hành': '#64748b', // secondary
  'Đang diễn ra': '#3b82f6', // primary
  'Đã hoàn tất': '#10b981', // success
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
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [clonesData, setClonesData] = useState({})
  const [loadingClones, setLoadingClones] = useState({})

  const toggleRow = async (tourId, e) => {
    e.stopPropagation()
    const newSet = new Set(expandedRows)
    if (newSet.has(tourId)) {
      newSet.delete(tourId)
      setExpandedRows(newSet)
    } else {
      newSet.add(tourId)
      setExpandedRows(newSet)
      
      if (!clonesData[tourId]) {
        setLoadingClones(prev => ({ ...prev, [tourId]: true }))
        try {
          const res = await staffTourApi.list({ parent_id: tourId, per_page: 100 })
          const data = res?.data || res
          setClonesData(prev => ({ ...prev, [tourId]: data.items || [] }))
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingClones(prev => ({ ...prev, [tourId]: false }))
        }
      }
    }
  }

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
    try {
      const res = await staffTourApi.toggle(toggleModal.tourId)
      setFilters((current) => ({ ...current }))
      setToastMessage(res.message || 'Cập nhật trạng thái thành công!')
      setTimeout(() => setToastMessage(''), 5000)
      setToggleModal({ isOpen: false, tourId: null, isActive: false })
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    }
  }

  const [cloneModal, setCloneModal] = useState({ isOpen: false, tourId: null, thoiLuong: null })
  const [cloneData, setCloneData] = useState({ NgayKhoiHanh: '', NgayKetThuc: '' })
  const [cloneLoading, setCloneLoading] = useState(false)

  function handleStartDateChange(e) {
    const newStartDate = e.target.value;
    let newEndDate = cloneData.NgayKetThuc;

    if (cloneModal.thoiLuong && newStartDate) {
      const match = String(cloneModal.thoiLuong).match(/\d+/);
      if (match) {
        const days = parseInt(match[0], 10);
        if (days > 0) {
          const start = new Date(newStartDate);
          start.setDate(start.getDate() + (days - 1));
          newEndDate = start.toISOString().split('T')[0];
        }
      }
    }

    setCloneData({ ...cloneData, NgayKhoiHanh: newStartDate, NgayKetThuc: newEndDate });
  }

  async function submitClone(e) {
    e.preventDefault()
    if (!cloneModal.tourId || !cloneData.NgayKhoiHanh) return
    setCloneLoading(true)
    try {
      const res = await staffTourApi.clone(cloneModal.tourId, cloneData)
      setToastMessage(res.data?.message || res.message || 'Gia hạn thành công!')
      setCloneModal({ isOpen: false, tourId: null })
      setCloneData({ NgayKhoiHanh: '', NgayKetThuc: '' })
      setFilters((current) => ({ ...current }))
    } catch (err) {
      alert(normalizeError(err).message)
    } finally {
      setCloneLoading(false)
    }
  }
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
        <div className="col-12">
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

        {/* Progress Ratio Chart */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4" style={{ backgroundColor: '#fff' }}>
            <h5 className="fw-bold mb-4" style={{ fontSize: '18px', color: '#1e293b' }}>Tỷ lệ Tiến độ</h5>
            
            <div style={{ height: '200px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>100%</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Tổng cộng</div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.tien_do_ratio || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {(stats?.tien_do_ratio || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2">
              {(stats?.tien_do_ratio || []).map((entry, index) => {
                const totalProgressValue = (stats?.tien_do_ratio || []).reduce((sum, item) => sum + item.value, 0);
                const percent = totalProgressValue > 0 ? (entry.value / totalProgressValue * 100) : 0;
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

        {/* Quick Stats Cards */}
        <div className="col-md-4">
          <div className="row g-3 h-100">
            {(() => {
              const totalTours = state.pagination?.total || 0;
              const ongoing = (stats?.tien_do_ratio || []).find(x => x.name === 'Đang diễn ra')?.value || 0;
              const upcoming = (stats?.tien_do_ratio || []).find(x => x.name === 'Sắp khởi hành')?.value || 0;
              const inactive = (stats?.status_ratio || []).find(x => x.name === 'Ngừng hoạt động')?.value || 0;

              return (
                <>
                  <div className="col-6">
                    <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-column justify-content-center align-items-center h-100 text-center" style={{ backgroundColor: '#fff' }}>
                      <div className="rounded-circle d-flex justify-content-center align-items-center mb-2" style={{ width: '40px', height: '40px', backgroundColor: '#e0e7ff', color: '#4f46e5', fontSize: '18px' }}>
                        <i className="fa-solid fa-map-location-dot"></i>
                      </div>
                      <h4 className="mb-0 fw-bold" style={{ color: '#1e293b', fontSize: '20px' }}>{totalTours}</h4>
                      <p className="text-muted mb-0 mt-1" style={{ fontSize: '12px', fontWeight: '500' }}>Tổng Tour</p>
                    </div>
                  </div>
                  
                  <div className="col-6">
                    <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-column justify-content-center align-items-center h-100 text-center" style={{ backgroundColor: '#fff' }}>
                      <div className="rounded-circle d-flex justify-content-center align-items-center mb-2" style={{ width: '40px', height: '40px', backgroundColor: '#dbeafe', color: '#3b82f6', fontSize: '18px' }}>
                        <i className="fa-solid fa-compass"></i>
                      </div>
                      <h4 className="mb-0 fw-bold" style={{ color: '#1e293b', fontSize: '20px' }}>{ongoing}</h4>
                      <p className="text-muted mb-0 mt-1" style={{ fontSize: '12px', fontWeight: '500' }}>Đang diễn ra</p>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-column justify-content-center align-items-center h-100 text-center" style={{ backgroundColor: '#fff' }}>
                      <div className="rounded-circle d-flex justify-content-center align-items-center mb-2" style={{ width: '40px', height: '40px', backgroundColor: '#fef08a', color: '#ca8a04', fontSize: '18px' }}>
                        <i className="fa-regular fa-clock"></i>
                      </div>
                      <h4 className="mb-0 fw-bold" style={{ color: '#1e293b', fontSize: '20px' }}>{upcoming}</h4>
                      <p className="text-muted mb-0 mt-1" style={{ fontSize: '12px', fontWeight: '500' }}>Sắp tới</p>
                    </div>
                  </div>

                  <div className="col-6">
                    <div className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-column justify-content-center align-items-center h-100 text-center" style={{ backgroundColor: '#fff' }}>
                      <div className="rounded-circle d-flex justify-content-center align-items-center mb-2" style={{ width: '40px', height: '40px', backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '18px' }}>
                        <i className="fa-solid fa-box-archive"></i>
                      </div>
                      <h4 className="mb-0 fw-bold" style={{ color: '#1e293b', fontSize: '20px' }}>{inactive}</h4>
                      <p className="text-muted mb-0 mt-1" style={{ fontSize: '12px', fontWeight: '500' }}>Ngừng HĐ</p>
                    </div>
                  </div>
                </>
              )
            })()}
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
                <option value="Cần gia hạn">Cần gia hạn</option>
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
                  <th style={{ width: '40px', textAlign: 'center' }}></th>
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
                  const isExpired = tour.NgayKetThuc && new Date(tour.NgayKetThuc).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)

                  return (
                    <React.Fragment key={tour.MaTour}>
                    <tr onClick={() => navigate(`/staff/tours/${tour.MaTour}`)} style={{ cursor: 'pointer' }} className="hover-bg-light">
                      <td style={{ width: '40px', textAlign: 'center', padding: '16px 8px' }}>
                        {tour.TinhChatTour === 'Định kỳ' && (
                          <button 
                            className="btn btn-sm btn-light border p-0 d-flex align-items-center justify-content-center mx-auto"
                            style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: expandedRows.has(tour.MaTour) ? '#f8fafc' : '#fff' }}
                            onClick={(e) => toggleRow(tour.MaTour, e)}
                            title={expandedRows.has(tour.MaTour) ? "Thu gọn" : "Xem các lịch khởi hành"}
                          >
                            <i className={`fa-solid ${expandedRows.has(tour.MaTour) ? 'fa-chevron-up' : 'fa-chevron-down'} text-primary`} style={{ fontSize: '12px' }}></i>
                          </button>
                        )}
                      </td>
                      <td style={{ width: '60px', textAlign: 'center', fontWeight: 700, color: '#111827', padding: '16px 20px' }}>
                        #{tour.MaTour}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <img src={imageSrc(firstImageOfTour(tour))} alt={tour.TenTour} style={{ width: '80px', height: '55px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div className="fw-bold text-dark d-flex align-items-center gap-2" style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '15px' }} title={tour.TenTour}>
                          {tour.TinhChatTour === 'Định kỳ' && <span className="badge bg-light text-primary border border-primary-subtle" style={{ fontSize: '10px' }}>Tour Mẫu</span>}
                          {tour.IDTourGoc != null && <span className="badge bg-light text-dark border" style={{ fontSize: '10px' }}>Bản sao</span>}
                          <span className="text-truncate">{tour.TenTour}</span>
                        </div>
                        <div className="small text-muted mt-1">
                          <i className="fa-solid fa-location-dot me-1 text-danger"></i>{tour.DiaDiem || '-'}
                          <span className="mx-1 text-secondary">•</span>
                          <i className="fa-regular fa-clock me-1 text-primary"></i>{tour.ThoiLuong || '-'}
                        </div>
                        {tour.TienDo && (
                          <div className="mt-1">
                            <span className={`badge ${tour.TienDo === 'Đang diễn ra' ? 'bg-primary' : tour.TienDo === 'Đã hoàn tất' ? 'bg-success' : 'bg-secondary'} text-white border`} style={{ fontSize: '10px' }}>
                              {tour.TienDo}
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div className="fw-bold text-dark">{formatCurrency(price)}</div>
                        {gg > 0 && gg < g0 && (
                          <div className="text-muted small text-decoration-line-through">{formatCurrency(g0)}</div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {tour.LoaiTour === 'Doanh nghiệp' ? (
                          <span className="text-muted fw-bold ms-3">—</span>
                        ) : (
                          <>
                            <span className="fw-bold">{soChoDaDat}</span> <span className="text-muted">/ {soCho}</span>
                            <div className="progress mt-1" style={{ height: '4px', width: '60px' }}>
                              <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${percent}%` }}></div>
                            </div>
                          </>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className="small text-muted">{tour.LoaiTour || tour.Mien || ''}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div className="d-flex flex-column gap-1 align-items-start">
                          {tour.TienDo === 'Đã hoàn tất' && tour.TrangThai !== 'Ngừng hoạt động' ? (
                            <span className="text-muted fw-bold ms-3">—</span>
                          ) : (
                            <StaffStatusBadge status={tour.LoaiTour === 'Doanh nghiệp' && tour.TrangThai === 'Hết chỗ' ? 'Hoạt động' : tour.TrangThai} />
                          )}
                        </div>
                      </td>
                      <td className="text-end" style={{ padding: '16px 20px' }}>
                        <div className="d-flex flex-column align-items-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-sm btn-light text-primary border" onClick={() => navigate(`/staff/tours/${tour.MaTour}`)}>
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            {!isExpired && (
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setToggleModal({ isOpen: true, tourId: tour.MaTour, isActive }); }} 
                                className={`btn btn-sm rounded-pill ${isActive ? 'btn-outline-secondary' : 'btn-outline-success'}`} 
                                title={isActive ? 'Ngừng hoạt động' : 'Kích hoạt'}
                              >
                                {isActive ? <i className="fa-regular fa-eye-slash"></i> : <i className="fa-regular fa-eye"></i>}
                              </button>
                            )}
                            {tour.TienDo === 'Đã hoàn tất' && tour.LoaiTour !== 'Doanh nghiệp' && isExpired && (
                              <button 
                                type="button" 
                                className="btn btn-sm btn-warning rounded-pill text-dark" 
                                onClick={(e) => { e.stopPropagation(); setCloneModal({ isOpen: true, tourId: tour.MaTour, thoiLuong: tour.ThoiLuong }); }} 
                                title="Tạo đợt khởi hành mới"
                              >
                                <i className="fa-solid fa-calendar-plus"></i>
                              </button>
                            )}
                          </div>
                          {tour.TienDo === 'Đã hoàn tất' && tour.LoaiTour !== 'Doanh nghiệp' && !isExpired && (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-warning rounded-pill text-dark d-inline-flex align-items-center justify-content-center gap-1" 
                              style={{ whiteSpace: 'nowrap', padding: '4px 12px', fontWeight: '500', width: 'fit-content' }}
                              onClick={(e) => { e.stopPropagation(); setCloneModal({ isOpen: true, tourId: tour.MaTour, thoiLuong: tour.ThoiLuong }); }} 
                              title="Tạo đợt khởi hành mới"
                            >
                              <i className="fa-solid fa-calendar-plus" style={{ fontSize: '13px' }}></i> Tạo đợt mới
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRows.has(tour.MaTour) && (
                      <tr className="bg-light">
                        <td colSpan="9" className="p-0 border-0">
                          <div className="p-3 ps-4 border-start border-4 border-primary" style={{ backgroundColor: '#f8fafc', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                            {loadingClones[tour.MaTour] ? (
                              <div className="text-center py-3 text-muted"><i className="fa-solid fa-spinner fa-spin me-2"></i>Đang tải dữ liệu chuyến đi...</div>
                            ) : clonesData[tour.MaTour]?.length === 0 ? (
                              <div className="text-center py-3 text-muted">Chưa có lịch khởi hành nào được tạo cho Tour này.</div>
                            ) : (
                              <table className="table table-sm table-borderless align-middle mb-0">
                                <thead>
                                  <tr>
                                    <th style={{ width: '80px', color: '#64748b', fontSize: '11px' }}>MÃ CHUYẾN</th>
                                    <th style={{ color: '#64748b', fontSize: '11px' }}>NGÀY ĐI & VỀ</th>
                                    <th style={{ color: '#64748b', fontSize: '11px' }}>GIÁ BÁN</th>
                                    <th style={{ color: '#64748b', fontSize: '11px' }}>SỐ CHỖ</th>
                                    <th style={{ color: '#64748b', fontSize: '11px' }}>TIẾN ĐỘ</th>
                                    <th className="text-end" style={{ color: '#64748b', fontSize: '11px' }}>XEM CHI TIẾT</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {clonesData[tour.MaTour]?.map(clone => {
                                    const cG0 = Number(clone.GiaGoc || 0)
                                    const cGg = Number(clone.GiaGiam || 0)
                                    const cPrice = (cGg > 0 && cGg < cG0) ? cGg : cG0
                                    const cSoChoDaDat = Number(clone.SoChoDaDat || 0)
                                    const cSoCho = Number(clone.SoCho || 0)
                                    const cPercent = cSoCho > 0 ? Math.min(100, (cSoChoDaDat / cSoCho) * 100) : 0
                                    
                                    let cEndDate = clone.NgayKetThuc;
                                    if (!cEndDate && clone.NgayKhoiHanh && tour.ThoiLuong) {
                                      const match = String(tour.ThoiLuong).match(/\d+/);
                                      if (match) {
                                        const days = parseInt(match[0], 10);
                                        if (days > 0) {
                                          const start = new Date(clone.NgayKhoiHanh);
                                          start.setDate(start.getDate() + (days - 1));
                                          cEndDate = start.toISOString();
                                        }
                                      }
                                    }

                                    return (
                                      <tr key={clone.MaTour} onClick={() => navigate(`/staff/tours/${clone.MaTour}`)} className="hover-bg-white" style={{ cursor: 'pointer', borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}>
                                        <td style={{ fontWeight: 600, color: '#475569' }}>#{clone.MaTour}</td>
                                        <td>
                                          <div className="fw-bold text-dark">{clone.NgayKhoiHanh ? new Date(clone.NgayKhoiHanh).toLocaleDateString('vi-VN') : 'N/A'}</div>
                                          <div className="text-muted" style={{ fontSize: '11px' }}>Đến: {cEndDate ? new Date(cEndDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                                        </td>
                                        <td>
                                          <div className="fw-bold" style={{ color: '#059669' }}>{cPrice.toLocaleString('vi-VN')} đ</div>
                                        </td>
                                        <td>
                                          <div className="fw-bold text-dark">{cSoChoDaDat} <span className="text-muted fw-normal">/ {cSoCho}</span></div>
                                          <div className="progress mt-1" style={{ height: '4px', width: '60px' }}>
                                            <div className="progress-bar" style={{ width: `${cPercent}%`, backgroundColor: cPercent >= 100 ? '#ef4444' : '#3b82f6' }}></div>
                                          </div>
                                        </td>
                                        <td>
                                          <span className={`badge ${clone.TienDo === 'Đang diễn ra' ? 'bg-primary' : clone.TienDo === 'Đã hoàn tất' ? 'bg-success' : 'bg-secondary'} text-white fw-medium px-2 py-1`}>
                                            {clone.TienDo || 'Sắp khởi hành'}
                                          </span>
                                        </td>
                                        <td className="text-end">
                                          <button className="btn btn-sm btn-light text-primary border rounded-circle" style={{ width: '28px', height: '28px', padding: 0 }}><i className="fa-solid fa-arrow-right" style={{ fontSize: '12px' }}></i></button>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
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

      {cloneModal.isOpen && (
        <>
          <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <form onSubmit={submitClone}>
                  <div className="modal-body p-4">
                    <h5 className="mb-4 fw-bold text-center" style={{ color: '#1f2937', fontSize: '20px' }}>
                      Gia hạn Tour (Tạo bản sao)
                    </h5>
                    <p className="text-muted small text-center mb-4">
                      Hệ thống sẽ tạo ra một Tour mới copy 100% lịch trình và ảnh từ tour cũ, số chỗ đặt sẽ được reset về 0.
                    </p>
                    <div className="mb-3 text-start">
                      <label className="form-label fw-semibold text-dark small">Ngày khởi hành mới <span className="text-danger">*</span></label>
                      <input 
                        type="date" 
                        className="form-control" 
                        required 
                        min={new Date().toISOString().split('T')[0]}
                        value={cloneData.NgayKhoiHanh}
                        onChange={handleStartDateChange}
                      />
                    </div>
                    <div className="mb-4 text-start">
                      <label className="form-label fw-semibold text-dark small">Ngày kết thúc dự kiến (Tự động tính)</label>
                      <input 
                        type="date" 
                        className="form-control bg-light text-muted" 
                        value={cloneData.NgayKetThuc || ''}
                        disabled
                      />
                    </div>
                    <div className="d-flex justify-content-center gap-3">
                      <button 
                        type="button" 
                        className="btn fw-medium modal-btn-cancel" 
                        onClick={() => { setCloneModal({ isOpen: false, tourId: null }); setCloneData({ NgayKhoiHanh: '', NgayKetThuc: '' }); }}
                        disabled={cloneLoading}
                      >
                        Hủy
                      </button>
                      <button 
                        type="submit" 
                        className="btn fw-medium modal-btn-confirm bg-warning text-dark border-0" 
                        disabled={cloneLoading || !cloneData.NgayKhoiHanh}
                      >
                        {cloneLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fa-solid fa-copy me-2"></i>}
                        Tạo Tour mới
                      </button>
                    </div>
                  </div>
                </form>
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
