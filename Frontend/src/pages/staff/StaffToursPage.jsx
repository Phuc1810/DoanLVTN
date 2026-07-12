import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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

export default function StaffToursPage() {
  const location = useLocation()
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
      <div className="toolbar-card">
        <div className="search-form">
          <div className="search-group"><input className="search-input" name="q" value={filters.q} onChange={updateFilter} placeholder="Tìm tên tour, địa điểm..." /></div>
          <div className="search-group">
            <select className="search-select" name="loai" value={filters.loai} onChange={updateFilter}>
              <option value="">-- Tất cả loại --</option>
              {metadata.loaiList.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="search-group">
            <select className="search-select" name="tt" value={filters.tt} onChange={updateFilter}>
              <option value="">-- Tất cả trạng thái --</option>
              {metadata.ttList.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
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
                    <tr key={tour.MaTour}>
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
                        <StaffStatusBadge status={tour.TrangThai} />
                      </td>
                      <td className="text-end" style={{ padding: '16px 20px' }}>
                        <Link className="btn btn-sm btn-outline-primary rounded-pill me-1" to={`/staff/tours/${tour.MaTour}/edit`} title="Sửa">
                          <i className="fa-solid fa-pen"></i>
                        </Link>
                        <button type="button" onClick={() => setToggleModal({ isOpen: true, tourId: tour.MaTour, isActive })} className={`btn btn-sm rounded-pill ${isActive ? 'btn-outline-secondary' : 'btn-outline-success'}`} title={isActive ? 'Ngừng hoạt động' : 'Kích hoạt'}>
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
        <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>
      )}
      {toggleModal.isOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div className="modal-body text-center p-4">
                <div className="mb-3">
                  <i className="fa-solid fa-circle-question text-primary" style={{ fontSize: '50px', opacity: 0.8 }}></i>
                </div>
                <h5 className="mb-4 text-dark fw-bold" style={{ lineHeight: '1.5' }}>
                  {toggleModal.isActive 
                    ? 'Bạn có muốn ngừng hoạt động tour này không?' 
                    : 'Bạn có muốn kích hoạt tour này không?'}
                </h5>
                <div className="d-flex justify-content-center gap-3">
                  <button type="button" className="btn btn-outline-secondary px-4 rounded-pill" onClick={() => setToggleModal({ isOpen: false, tourId: null, isActive: false })}>Hủy</button>
                  <button type="button" className="btn btn-primary px-4 rounded-pill" onClick={confirmToggle}>Đồng ý</button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
