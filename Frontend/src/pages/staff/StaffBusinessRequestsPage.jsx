import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function StaffBusinessRequestsPage() {
  const [filters, setFilters] = useState({ q: '', TrangThai: '', page: 1, per_page: 5 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })

  const fetchRequests = () => {
    setState((prev) => ({ ...prev, loading: true }))
    staffBusinessRequestApi.list(filters)
      .then((payload) => setState({ loading: false, error: '', rows: extractList(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }

  useEffect(() => {
    fetchRequests()
  }, [filters])

  const handleRefresh = () => {
    fetchRequests()
  }

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
