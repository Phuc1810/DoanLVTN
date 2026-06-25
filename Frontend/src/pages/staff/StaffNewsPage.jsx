import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { staffNewsApi } from '../../api/staffNewsApi'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import StaffTable from '../../components/staff/StaffTable'
import { formatDate } from '../../utils/formatDate'
import { extractList, extractPagination, imageSrc, normalizeError } from './staffPageUtils'

export default function StaffNewsPage() {
  const [filters, setFilters] = useState({ q: '', LoaiTin: '', TrangThai: '', page: 1 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })

  useEffect(() => {
    staffNewsApi.list(filters)
      .then((payload) => setState({ loading: false, error: '', rows: extractList(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }, [filters])

  async function toggle(id) {
    if (!window.confirm('Bạn muốn đổi trạng thái tin này?')) return
    await staffNewsApi.toggle(id)
    setFilters((current) => ({ ...current }))
  }

  return (
    <>
      <div className="page-header"><h1 className="page-title">Quản lý tin tức</h1><Link className="staff-link-btn primary" to="/staff/news/create">+ Thêm tin</Link></div>
      <div className="toolbar-card"><div className="search-form"><div className="search-group"><input className="search-input" value={filters.q} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value, page: 1 }))} placeholder="Tìm tiêu đề..." /></div><div className="search-group"><input className="search-input" value={filters.LoaiTin} onChange={(e) => setFilters((c) => ({ ...c, LoaiTin: e.target.value, page: 1 }))} placeholder="Loại tin" /></div><div className="search-group"><select className="search-select" value={filters.TrangThai} onChange={(e) => setFilters((c) => ({ ...c, TrangThai: e.target.value, page: 1 }))}><option value="">Trạng thái</option><option>Hoạt động</option><option>Tạm ngưng</option></select></div></div></div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <StaffTable>
          {state.rows.length === 0 ? <EmptyState /> : (
            <table className="table">
              <thead><tr><th>Mã</th><th>Ảnh</th><th>Tiêu đề</th><th>Loại tin</th><th>Ngày đăng</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {state.rows.map((item) => (
                  <tr key={item.MaTin}>
                    <td className="col-id">#{item.MaTin}</td>
                    <td><img className="thumb" src={imageSrc(item.AnhDaiDien)} alt={item.TieuDe} /></td>
                    <td><span className="cell-truncate">{item.TieuDe}</span></td>
                    <td>{item.LoaiTin}</td>
                    <td>{formatDate(item.NgayDang)}</td>
                    <td><StaffStatusBadge status={item.TrangThai} /></td>
                    <td><div className="staff-mini-actions"><Link to={`/staff/news/${item.MaTin}/edit`}>Sửa</Link><button type="button" onClick={() => toggle(item.MaTin)}>Ẩn/hiện</button></div></td>
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
