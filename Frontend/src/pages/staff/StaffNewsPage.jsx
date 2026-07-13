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
  const [filters, setFilters] = useState({ q: '', loai: '', tt: '', page: 1, per_page: 5 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })
  const [stats, setStats] = useState({ data: null, loading: true })

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

  async function toggle(id) {
    if (!window.confirm('Bạn muốn đổi trạng thái bài viết này?')) return
    await staffNewsApi.toggle(id)
    setFilters((current) => ({ ...current }))
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title mb-1" style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>Quản lý tin tức</h1>
          <div className="text-muted" style={{ fontSize: '14px' }}>Xem, chỉnh sửa và quản lý các bài đăng tin tức hệ thống</div>
        </div>
        <Link className="btn shadow-sm" to="/staff/news/create" style={{ borderRadius: '10px', padding: '10px 24px', fontWeight: '700', backgroundColor: '#6366f1', color: '#fff', border: 'none', fontSize: '15px', letterSpacing: '0.3px' }}>
          Thêm tin mới
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {/* Card 1: Tổng bài đăng */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100 p-4" style={{ borderRadius: '12px', border: 'none', borderLeft: '6px solid #f97316', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="text-muted fw-semibold mb-2" style={{ fontSize: '14px' }}>Tổng bài đăng</div>
              <div className="fs-3 fw-bold text-dark lh-1">
                {stats.loading ? '...' : (stats.data?.totalPosts || 0)}
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-file-invoice"></i>
            </div>
          </div>
        </div>

        {/* Card 2: Lượt xem tháng này */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100 p-4" style={{ borderRadius: '12px', border: 'none', borderLeft: '6px solid #22c55e', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="text-muted fw-semibold mb-2" style={{ fontSize: '14px' }}>Lượt xem tháng này</div>
              <div className="fs-3 fw-bold text-dark lh-1">
                {stats.loading ? '...' : (
                  stats.data?.monthlyViews >= 1000 
                    ? (stats.data.monthlyViews / 1000).toFixed(1) + 'k' 
                    : (stats.data?.monthlyViews || 0)
                )}
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-regular fa-eye"></i>
            </div>
          </div>
        </div>

        {/* Card 3: Tỉ lệ tương tác */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100 p-4" style={{ borderRadius: '12px', border: 'none', borderLeft: '6px solid #ef4444', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="text-muted fw-semibold mb-2" style={{ fontSize: '14px' }}>Tỉ lệ tương tác</div>
              <div className="fs-3 fw-bold text-dark lh-1">
                {stats.loading ? '...' : (stats.data?.engagementRate || 0)}%
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              <i className="fa-solid fa-arrow-trend-up"></i>
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
                      <tr key={item.MaTin} style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        <td className="ps-4 py-3 border-0 rounded-start" style={{ color: '#2563eb', fontWeight: '600' }}>
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
                            <Link to={`/staff/news/${item.MaTin}/edit`} className="btn btn-sm btn-light text-primary" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }} title="Sửa">
                              <i className="fa-solid fa-pen" style={{ fontSize: '12px' }}></i>
                            </Link>
                            <button type="button" onClick={() => toggle(item.MaTin)} className={`btn btn-sm btn-light ${isVisible ? 'text-secondary' : 'text-success'}`} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }} title={isVisible ? 'Ẩn' : 'Hiện'}>
                              <i className={`fa-regular ${isVisible ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '13px' }}></i>
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
