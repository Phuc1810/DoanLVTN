import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { staffPromotionApi } from '../../api/staffPromotionApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import StaffTable from '../../components/staff/StaffTable'
import { formatDate } from '../../utils/formatDate'
import { extractList, extractPagination, imageSrc, normalizeError } from './staffPageUtils'

export default function StaffPromotionsPage() {
  const [filters, setFilters] = useState({ q: '', TrangThai: '', page: 1 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })

  useEffect(() => {
    staffPromotionApi.list(filters)
      .then((payload) => setState({ loading: false, error: '', rows: extractList(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }, [filters])

  async function toggle(id) {
    if (!window.confirm('Bạn muốn đổi trạng thái khuyến mãi này?')) return
    await staffPromotionApi.toggle(id)
    setFilters((current) => ({ ...current }))
  }

  return (
    <>
      <div className="page-header"><h1 className="page-title">Quản lý khuyến mãi</h1><Link className="staff-link-btn primary" to="/staff/promotions/create">+ Thêm khuyến mãi</Link></div>
      <div className="toolbar-card"><div className="search-form"><div className="search-group"><input className="search-input" value={filters.q} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value, page: 1 }))} placeholder="Tìm tên khuyến mãi..." /></div><div className="search-group"><select className="search-select" value={filters.TrangThai} onChange={(e) => setFilters((c) => ({ ...c, TrangThai: e.target.value, page: 1 }))}><option value="">Trạng thái</option><option>Hoạt động</option><option>Tạm ngưng</option></select></div></div></div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <StaffTable>
          {state.rows.length === 0 ? <EmptyState /> : (
            <table className="table">
              <thead><tr><th>Mã</th><th>Ảnh</th><th>Tên KM</th><th>Giảm</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {state.rows.map((item) => (
                  <tr key={item.MaCTKM}>
                    <td className="col-id">#{item.MaCTKM}</td>
                    <td><img className="thumb" src={imageSrc(item.AnhDaiDien)} alt={item.TenKM} /></td>
                    <td><span className="cell-truncate">{item.TenKM}</span></td>
                    <td>{item.PhanTramGiam}%</td>
                    <td>{formatDate(item.NgayBatDau)}</td>
                    <td>{formatDate(item.NgayKetThuc)}</td>
                    <td><StaffStatusBadge status={item.TrangThai} /></td>
                    <td><div className="staff-mini-actions"><Link to={`/staff/promotions/${item.MaCTKM}`}>Xem</Link><Link to={`/staff/promotions/${item.MaCTKM}/edit`}>Sửa</Link><button type="button" onClick={() => toggle(item.MaCTKM)}>Ẩn/hiện</button></div></td>
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
