import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { staffPromotionApi } from '../../api/staffPromotionApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import { formatDate } from '../../utils/formatDate'
import { extractList, extractPagination, imageSrc, normalizeError } from './staffPageUtils'

export default function StaffPromotionsPage() {
  const [filters, setFilters] = useState({ q: '', tt: '', page: 1, per_page: 5 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })
  const [stats, setStats] = useState({ total: 0, active: 0, upcoming: 0, ending_soon: 0 })
  const [chartData, setChartData] = useState([])
  const [toggleModal, setToggleModal] = useState({ isOpen: false, id: null, isActive: false })
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const fetchPromotions = () => {
    setState(c => ({ ...c, loading: true }))
    Promise.all([
      staffPromotionApi.list(filters),
      staffPromotionApi.stats(),
      staffPromotionApi.chartData(new Date().getFullYear())
    ]).then(([listRes, statsRes, chartRes]) => {
      setState({ loading: false, error: '', rows: extractList(listRes), pagination: extractPagination(listRes) })
      if (statsRes) setStats(statsRes)
      if (chartRes) setChartData(chartRes)
    }).catch((error) => {
      setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null })
    })
  }

  useEffect(() => {
    fetchPromotions()
  }, [filters])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000)
  }

  const confirmToggle = async () => {
    try {
      await staffPromotionApi.toggle(toggleModal.id)
      showToast('Cập nhật trạng thái thành công')
      fetchPromotions()
    } catch (err) {
      showToast('Có lỗi xảy ra: ' + normalizeError(err).message, 'danger')
    } finally {
      setToggleModal({ isOpen: false, id: null, isActive: false })
    }
  }

  function getProgress(start, end) {
    const now = new Date().getTime()
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    if (now < s) return 0
    if (now > e) return 100
    return ((now - s) / (e - s)) * 100
  }

  const handleSearch = (e) => {
    e.preventDefault()
  }

  return (
    <>
      <style>
        {`
          .table-header-cell { background-color: #f9fafb; color: #4b5563; font-weight: 600; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
          .table-row-cell { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
          .pill-badge { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; }
          .pill-badge.active { background-color: #dcfce7; color: #16a34a; }
          .pill-badge.upcoming { background-color: #ffedd5; color: #ea580c; }
          .pill-badge.expired { background-color: #f3f4f6; color: #6b7280; }
          .pill-badge.disabled { background-color: #fee2e2; color: #dc2626; }
          .action-btn-pill {
            width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
            border: 1px solid transparent; background: transparent; transition: all 0.2s;
          }
          .action-btn-pill.edit { border-color: #0d6efd; color: #0d6efd; }
          .action-btn-pill.edit:hover { background-color: #0d6efd; color: white; }
          .action-btn-pill.toggle-active { border-color: #6c757d; color: #6c757d; }
          .action-btn-pill.toggle-active:hover { background-color: #6c757d; color: white; }
          .action-btn-pill.toggle-inactive { border-color: #198754; color: #198754; }
          .action-btn-pill.toggle-inactive:hover { background-color: #198754; color: white; }
          
          .custom-tab-btn {
            border-radius: 8px; padding: 8px 16px; font-size: 14px; font-weight: 600; border: none; background: transparent; transition: all 0.2s;
          }
          .custom-tab-btn.active {
            background-color: #f3f4f6; color: #111827;
          }
          .custom-tab-btn.inactive {
            color: #6b7280;
          }
          .custom-tab-btn.inactive:hover {
            background-color: #f9fafb; color: #374151;
          }
        `}
      </style>

      {toast.show && (
        <div className={`toast align-items-center text-white bg-${toast.type} border-0 show fade`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '250px' }}>
          <div className="d-flex">
            <div className="toast-body fw-semibold">
              <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'} me-2`}></i>
              {toast.message}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: '28px', color: '#111827' }}>Quản lý Khuyến mãi</h1>
          <div style={{ color: '#6b7280', fontSize: '15px' }}>Quản lý các chiến dịch ưu đãi và giảm giá hệ thống</div>
        </div>
        <div>
          <Link to="/staff/promotions/create" className="btn text-white" style={{ backgroundColor: '#4f46e5', fontWeight: 600, fontSize: '14px', padding: '10px 24px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)' }}>
            Thêm khuyến mãi mới
          </Link>
        </div>
      </div>

      {/* Top Section: Chart & Stats */}
      <div className="row g-4 mb-4">
        {/* Chart Column */}
        <div className="col-md-7">
          <div className="card border-0 p-4 h-100" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0" style={{ fontSize: '16px', color: '#111827' }}>Tần suất khuyến mãi năm {new Date().getFullYear()}</h5>
              <Link to="#" className="text-primary text-decoration-none" style={{ fontSize: '13px', fontWeight: 500 }}>Chi tiết &rarr;</Link>
            </div>
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" name="Chiến dịch" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="col-md-5">
          <div className="card border-0 p-4 h-100" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
            <h5 className="fw-bold mb-4" style={{ fontSize: '16px', color: '#111827' }}>Trạng thái hiện tại</h5>
            
            <div className="d-flex flex-column gap-3 mb-4">
              <div className="p-3 d-flex align-items-center gap-3" style={{ backgroundColor: '#ecfdf5', borderRadius: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <i className="fa-solid fa-play"></i>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Đang chạy</div>
                  <div className="fw-bold d-flex align-items-baseline gap-2" style={{ color: '#111827', marginTop: '2px' }}>
                    <span style={{ fontSize: '24px', lineHeight: 1 }}>{stats.active}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>Chương trình</span>
                  </div>
                </div>
              </div>

              <div className="p-3 d-flex align-items-center gap-3" style={{ backgroundColor: '#fff7ed', borderRadius: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                  <i className="fa-solid fa-clock"></i>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Sắp diễn ra</div>
                  <div className="fw-bold d-flex align-items-baseline gap-2" style={{ color: '#111827', marginTop: '2px' }}>
                    <span style={{ fontSize: '24px', lineHeight: 1 }}>{stats.upcoming}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>Chương trình</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 mt-auto" style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <i className="fa-solid fa-circle-info mt-1" style={{ color: '#dc2626' }}></i>
              <div style={{ color: '#991b1b', fontSize: '13px', lineHeight: '1.5' }}>
                Bạn có <strong>{stats.ending_soon}</strong> chương trình khuyến mãi sẽ kết thúc trong tuần này.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
        <div className="card-body p-0">
          
          {/* Toolbar Tabs & Search */}
          <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
            <form className="d-flex gap-3 w-100" onSubmit={handleSearch}>
              <div className="position-relative flex-grow-1">
                <i className="fa-solid fa-magnifying-glass position-absolute text-muted" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}></i>
                <input 
                  type="text" 
                  className="form-control shadow-none" 
                  placeholder="Nhập mã CTKM hoặc tên..." 
                  value={filters.q} 
                  onChange={(e) => setFilters(c => ({ ...c, q: e.target.value, page: 1 }))}
                  style={{ borderRadius: '8px', padding: '10px 16px 10px 44px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '14px', color: '#4b5563' }}
                />
              </div>
              <div className="position-relative" style={{ width: '220px' }}>
                <i className="fa-solid fa-toggle-on position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#6b7280' }}></i>
                <select 
                  className="form-select shadow-none" 
                  value={filters.tt} 
                  onChange={(e) => setFilters(c => ({ ...c, tt: e.target.value, page: 1 }))}
                  style={{ borderRadius: '8px', padding: '10px 40px 10px 44px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '14px', color: '#4b5563' }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Sắp diễn ra">Sắp diễn ra</option>
                  <option value="Hết hạn">Hết hạn</option>
                  <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                </select>
              </div>
            </form>
          </div>

          {/* Table */}
          {state.loading && <Loading />}
          {state.error && <ErrorState message={state.error} />}
          {!state.loading && !state.error && (
            <>
              {state.rows.length === 0 ? <EmptyState /> : (
                <div className="table-responsive">
                  <table className="table mb-0 align-middle" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th className="table-header-cell">Thông tin chiến dịch</th>
                        <th className="table-header-cell text-center" style={{ width: '120px' }}>Mức giảm</th>
                        <th className="table-header-cell" style={{ width: '250px' }}>Thời hạn</th>
                        <th className="table-header-cell text-center" style={{ width: '180px' }}>Trạng thái</th>
                        <th className="table-header-cell text-end" style={{ width: '120px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.rows.map((item) => {
                        const isActive = item.TrangThai === 'Hoạt động' || item.TrangThai === 'Sắp diễn ra'
                        
                        let badgeClass = 'expired'
                        if (item.TrangThai === 'Hoạt động') badgeClass = 'active'
                        else if (item.TrangThai === 'Sắp diễn ra') badgeClass = 'upcoming'
                        else if (item.TrangThai === 'Ngừng hoạt động') badgeClass = 'disabled'

                        const progress = getProgress(item.NgayBatDau, item.NgayKetThuc)
                        let progressColor = '#16a34a' // Green progress bar for old design
                        if (item.TrangThai === 'Hết hạn') progressColor = '#6b7280'
                        else if (item.TrangThai === 'Sắp diễn ra') progressColor = '#d1d5db'

                        return (
                          <tr key={item.MaCTKM}>
                            <td className="table-row-cell">
                              <div className="d-flex align-items-center gap-3">
                                <img src={imageSrc(item.AnhDaiDien)} alt={item.TenKM} style={{ width: '70px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                <div>
                                  <div className="fw-bold" style={{ color: '#111827', fontSize: '15px' }}>{item.TenKM}</div>
                                  <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>#{item.MaCTKM}</div>
                                </div>
                              </div>
                            </td>
                            <td className="table-row-cell text-center">
                              <span className="fw-bold" style={{ color: '#2563eb', fontSize: '16px' }}>{item.PhanTramGiam}%</span>
                            </td>
                            <td className="table-row-cell">
                              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 500 }}>
                                {formatDate(item.NgayBatDau)} - {formatDate(item.NgayKetThuc)}
                              </div>
                              <div className="progress" style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
                                <div className="progress-bar" role="progressbar" style={{ width: progress + '%', backgroundColor: progressColor }}></div>
                              </div>
                            </td>
                            <td className="table-row-cell text-center">
                              <span className={"pill-badge " + badgeClass}>{item.TrangThai}</span>
                            </td>
                            <td className="table-row-cell text-end">
                              <div className="d-flex gap-2 justify-content-end">
                                <Link to={'/staff/promotions/' + item.MaCTKM + '/edit'} className="action-btn-pill edit" title="Sửa">
                                  <i className="fa-solid fa-pen"></i>
                                </Link>
                                <button type="button" className={"action-btn-pill " + (isActive ? 'toggle-active' : 'toggle-inactive')} onClick={() => setToggleModal({ isOpen: true, id: item.MaCTKM, isActive })} title={isActive ? 'Ngừng hoạt động' : 'Kích hoạt'}>
                                  <i className={"fa-regular " + (isActive ? 'fa-eye-slash' : 'fa-eye')}></i>
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
            </>
          )}
          
          <div className="p-3 border-top">
            <Pagination pagination={state.pagination} onPageChange={(page) => setFilters(c => ({ ...c, page }))} />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {toggleModal.isOpen && (
        <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>
      )}
      {toggleModal.isOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div className="modal-body text-center p-4">
                <div className="mb-4 d-flex justify-content-center">
                  <div style={{ width: '64px', height: '64px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '36px', fontWeight: 'bold' }}>
                    ?
                  </div>
                </div>
                <h5 className="mb-4 fw-bold" style={{ color: '#1f2937', fontSize: '20px', lineHeight: '1.5' }}>
                  {toggleModal.isActive ? 'Bạn có muốn ngừng hoạt động khuyến mãi này không?' : 'Bạn có muốn kích hoạt khuyến mãi này không?'}
                </h5>
                <div className="d-flex justify-content-center gap-3 mt-2">
                  <button type="button" className="btn bg-white border" style={{ borderRadius: '24px', padding: '8px 32px', color: '#6b7280', fontSize: '16px', fontWeight: 500 }} onClick={() => setToggleModal({ isOpen: false, id: null, isActive: false })}>Hủy</button>
                  <button type="button" className="btn text-white" style={{ borderRadius: '24px', padding: '8px 32px', backgroundColor: '#0265d2', fontSize: '16px', fontWeight: 500 }} onClick={confirmToggle}>Đồng ý</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
