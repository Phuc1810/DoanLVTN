import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  const [filters, setFilters] = useState({ q: '', LoaiTour: '', TrangThai: '', page: 1 })
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

  async function toggleTour(id) {
    if (!window.confirm('Bạn muốn đổi trạng thái tour này?')) return
    await staffTourApi.toggle(id)
    setFilters((current) => ({ ...current }))
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Quản lý Tour</h1>
        <Link className="staff-link-btn primary" to="/staff/tours/create">+ Thêm tour</Link>
      </div>
      <div className="toolbar-card">
        <div className="search-form">
          <div className="search-group"><input className="search-input" name="q" value={filters.q} onChange={updateFilter} placeholder="Tìm tên tour, địa điểm..." /></div>
          <div className="search-group">
            <select className="search-select" name="LoaiTour" value={filters.LoaiTour} onChange={updateFilter}>
              <option value="">-- Tất cả loại --</option>
              {metadata.loaiList.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="search-group">
            <select className="search-select" name="TrangThai" value={filters.TrangThai} onChange={updateFilter}>
              <option value="">-- Tất cả trạng thái --</option>
              {metadata.ttList.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
        </div>
      </div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <StaffTable>
          {state.rows.length === 0 ? <EmptyState /> : (
            <table className="table">
              <thead><tr><th>Mã</th><th>Ảnh</th><th>Tour</th><th>Giá</th><th>Ngày đi</th><th>Chỗ</th><th>Loại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {state.rows.map((tour) => (
                  <tr key={tour.MaTour}>
                    <td className="col-id">#{tour.MaTour}</td>
                    <td><img className="thumb" src={imageSrc(firstImageOfTour(tour))} alt={tour.TenTour} /></td>
                    <td><div className="tour-name">{tour.TenTour}</div><small className="text-muted">{tour.DiaDiem}</small></td>
                    <td>{formatCurrency(tour.GiaGiam || tour.GiaGoc)}</td>
                    <td>{formatDate(tour.NgayKhoiHanh)}</td>
                    <td>{tour.SoChoDaDat || 0}/{tour.SoCho || 0}</td>
                    <td>{tour.LoaiTour || tour.Mien}</td>
                    <td><StaffStatusBadge status={tour.TrangThai} /></td>
                    <td><div className="staff-mini-actions"><Link to={`/staff/tours/${tour.MaTour}`}>Xem</Link><Link to={`/staff/tours/${tour.MaTour}/edit`}>Sửa</Link><button type="button" onClick={() => toggleTour(tour.MaTour)}>Ẩn/hiện</button></div></td>
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
