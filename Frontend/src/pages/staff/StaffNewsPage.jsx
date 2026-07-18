import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { staffNewsApi } from '../../api/staffNewsApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import StaffTable from '../../components/staff/StaffTable'
import { formatDate } from '../../utils/formatDate'
import { extractList, extractPagination, imageSrc, normalizeError } from './staffPageUtils'

const STATUS_COLORS = {
  'Hiển thị': '#22c55e',
  'Ẩn': '#ef4444'
}

export default function StaffNewsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [toastMessage, setToastMessage] = useState('')
  const [filters, setFilters] = useState({ q: '', loai: '', tt: '', page: 1, per_page: 5 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })
  const [stats, setStats] = useState({ data: null, loading: true })
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, isVisible: false })

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage('')
    }, 5000)
  }

  useEffect(() => {
    if (location.state?.toastMessage) {
      showToast(location.state.toastMessage)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  useEffect(() => {
    staffNewsApi.list(filters)
      .then((payload) => setState({ loading: false, error: '', rows: extractList(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }, [filters])

  useEffect(() => {
    staffNewsApi.stats()
      .then(res => setStats({ data: res, loading: false }))
      .catch(err => setStats({ data: null, loading: false }))
  }, [])

  function requestToggle(item) {
    setConfirmModal({ isOpen: true, id: item.MaTin, isVisible: item.TrangThai === 'Hiển thị' })
  }

  async function confirmToggle() {
    try {
      await staffNewsApi.toggle(confirmModal.id)
      setFilters((current) => ({ ...current }))
      setConfirmModal({ isOpen: false, id: null, isVisible: false })
      showToast('Cập nhật trạng thái thành công')
    } catch (err) {
      setConfirmModal({ isOpen: false, id: null, isVisible: false })
      alert('Lỗi cập nhật trạng thái')
    }
  }

  return (
    <>
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontWeight: '500',
          animation: 'fadeIn 0.3s'
        }}>
          <i className="fa-solid fa-circle-check me-2"></i>
          {toastMessage}
        </div>
      )}

      {/* Custom Confirm Modal */}
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
                    {confirmModal.isVisible ? 'Bạn có muốn ẩn bài viết không?' : 'Bạn có muốn hiển thị bài viết không?'}
                  </h5>
                  <div className="d-flex justify-content-center gap-3 mt-2">
                    <button 
                      type="button" 
                      className="btn fw-medium modal-btn-cancel" 
                      onClick={() => setConfirmModal({ isOpen: false, id: null, isVisible: false })}
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

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title mb-1" style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>Quản lý tin tức</h1>
          <div className="text-muted" style={{ fontSize: '14px' }}>Xem, chỉnh sửa và quản lý các bài đăng tin tức hệ thống</div>
        </div>
        <Link className="btn shadow-sm" to="/staff/news/create" style={{ borderRadius: '10px', padding: '10px 24px', fontWeight: '700', backgroundColor: '#6366f1', color: '#fff', border: 'none', fontSize: '15px', letterSpacing: '0.3px' }}>
          Thêm tin mới
        </Link>
      </div>

      {/* Charts */}
      {stats.data && stats.data.trendChart && (
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1f2937' }}>Xu hướng tương tác</h5>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.data.trendChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dy={10} />
                    <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dx={-10} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dx={10} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar yAxisId="left" dataKey="views" name="Lượt xem" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                    <Line yAxisId="right" type="monotone" dataKey="engagementRate" name="Tỉ lệ tương tác (%)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
              <h5 className="fw-bold mb-4" style={{ color: '#1f2937' }}>Tỉ lệ trạng thái</h5>
              <div style={{ height: '200px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>100%</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Tổng cộng</div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.data.statusChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.data.statusChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2">
                {stats.data.statusChart.map((entry, index) => {
                  const totalStatusValue = stats.data.statusChart.reduce((sum, item) => sum + item.value, 0);
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
      )}

      {/* Filters Toolbar */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 p-2" style={{ backgroundColor: '#fff' }}>
        <div className="row g-2">
          {/* Search */}
          <div className="col-md-6">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0" style={{ color: '#6b7280', paddingRight: '4px', paddingLeft: '16px' }}>
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input type="text" className="form-control bg-transparent border-0 shadow-none text-dark fw-medium" placeholder="Nhập mã tin hoặc tiêu đề..." value={filters.q} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value, page: 1 }))} style={{ fontSize: '14.5px', padding: '10px 12px' }} />
            </div>
          </div>
          
          {/* Loại tin */}
          <div className="col-md-3">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0" style={{ color: '#6b7280', paddingRight: '4px', paddingLeft: '16px' }}>
                <i className="fa-solid fa-layer-group"></i>
              </span>
              <select className="form-select bg-transparent border-0 shadow-none text-dark fw-medium" value={filters.loai} onChange={(e) => setFilters((c) => ({ ...c, loai: e.target.value, page: 1 }))} style={{ fontSize: '14.5px', padding: '10px 12px', cursor: 'pointer' }}>
                <option value="">Tất cả loại</option>
                <option value="tintuc">Tin tức</option>
                <option value="kinhnghiem">Kinh nghiệm</option>
              </select>
            </div>
          </div>

          {/* Trạng thái */}
          <div className="col-md-3">
            <div className="input-group" style={{ backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
              <span className="input-group-text bg-transparent border-0" style={{ color: '#6b7280', paddingRight: '4px', paddingLeft: '16px' }}>
                <i className="fa-solid fa-toggle-on"></i>
              </span>
              <select className="form-select bg-transparent border-0 shadow-none text-dark fw-medium" value={filters.tt} onChange={(e) => setFilters((c) => ({ ...c, tt: e.target.value, page: 1 }))} style={{ fontSize: '14.5px', padding: '10px 12px', cursor: 'pointer' }}>
                <option value="">Tất cả trạng thái</option>
                <option value="Hiển thị">Hiển thị</option>
                <option value="Ẩn">Ẩn</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <StaffTable>
          {state.rows.length === 0 ? <EmptyState /> : (
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead style={{ textTransform: 'uppercase', fontSize: '12px', color: '#6b7280', letterSpacing: '0.5px' }}>
                  <tr>
                    <th className="border-0 ps-4 py-3">Mã</th>
                    <th className="border-0 py-3">Hình ảnh</th>
                    <th className="border-0 py-3">Tiêu đề</th>
                    <th className="border-0 py-3">Loại</th>
                    <th className="border-0 py-3">Ngày đăng</th>
                    <th className="border-0 py-3">Trạng thái</th>
                    <th className="border-0 pe-4 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {state.rows.map((item) => {
                    const isVisible = item.TrangThai === 'Hiển thị'
                    return (
                      <tr 
                        key={item.MaTin} 
                        onClick={() => navigate(`/staff/news/${item.MaTin}`)}
                        style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', cursor: 'pointer' }}
                        className="hover-bg-light"
                      >
                        <td className="ps-4 py-3 border-0 rounded-start" style={{ width: '60px', textAlign: 'center', fontWeight: 700, color: '#111827', padding: '16px 20px' }}>
                          #{item.MaTin}
                        </td>
                        <td className="py-3 border-0">
                          <img src={imageSrc(item.AnhDaiDien)} alt={item.TieuDe} style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #f3f4f6' }} />
                        </td>
                        <td className="py-3 border-0 fw-semibold text-dark" style={{ maxWidth: '300px' }}>
                          <span className="d-inline-block text-truncate w-100" title={item.TieuDe}>
                            {item.TieuDe}
                          </span>
                        </td>
                        <td className="py-3 border-0">
                          {item.LoaiTin === 'kinhnghiem' ? (
                            <span className="badge" style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '6px 12px', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Kinh nghiệm</span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Tin tức</span>
                          )}
                        </td>
                        <td className="py-3 border-0 text-muted" style={{ fontSize: '14px' }}>
                          {formatDate(item.NgayDang)}
                        </td>
                        <td className="py-3 border-0">
                          <StaffStatusBadge status={item.TrangThai} />
                        </td>
                        <td className="pe-4 py-3 border-0 rounded-end text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <Link 
                              to={`/staff/news/${item.MaTin}/edit`} 
                              className="btn btn-sm btn-outline-primary rounded-pill me-1" 
                              title="Sửa"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <i className="fa-solid fa-pen"></i>
                            </Link>
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); requestToggle(item); }} 
                              className={`btn btn-sm rounded-pill ${isVisible ? 'btn-outline-secondary' : 'btn-outline-success'}`} 
                              title={isVisible ? 'Ẩn' : 'Hiện'}
                            >
                              {isVisible ? <i className="fa-regular fa-eye-slash"></i> : <i className="fa-regular fa-eye"></i>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </StaffTable>
      )}
      <Pagination pagination={state.pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
    </>
  )
}
