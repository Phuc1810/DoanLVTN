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

export default function StaffBusinessRequestsPage() {
  const [filters, setFilters] = useState({ q: '', TrangThai: '', page: 1 })
  const [state, setState] = useState({ loading: true, error: '', rows: [], pagination: null })

  useEffect(() => {
    staffBusinessRequestApi.list(filters)
      .then((payload) => setState({ loading: false, error: '', rows: extractList(payload), pagination: extractPagination(payload) }))
      .catch((error) => setState({ loading: false, error: normalizeError(error).message, rows: [], pagination: null }))
  }, [filters])

  return (
    <>
      <div className="page-header"><h1 className="page-title">Yêu cầu doanh nghiệp</h1></div>
      <div className="toolbar-card"><div className="search-form"><div className="search-group"><input className="search-input" value={filters.q} onChange={(e) => setFilters((c) => ({ ...c, q: e.target.value, page: 1 }))} placeholder="Tìm công ty, người liên hệ..." /></div><div className="search-group"><select className="search-select" value={filters.TrangThai} onChange={(e) => setFilters((c) => ({ ...c, TrangThai: e.target.value, page: 1 }))}><option value="">Trạng thái</option><option>Chờ liên hệ</option><option>Đã liên hệ</option><option>Đã ký hợp đồng</option><option>Đã thanh toán</option><option>Hủy</option></select></div></div></div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <StaffTable>
          {state.rows.length === 0 ? <EmptyState /> : (
            <table className="table">
              <thead><tr><th>Mã</th><th>Công ty</th><th>Người liên hệ</th><th>SĐT</th><th>Khởi hành</th><th>Trạng thái</th><th>Phụ trách</th><th></th></tr></thead>
              <tbody>
                {state.rows.map((request) => {
                  const requestId = getId(request, ['MaYC', 'MaYCDN', 'id'])
                  return (
                    <tr key={requestId}>
                      <td className="col-id">#{requestId}</td>
                      <td>{request.cong_ty?.TenCongTy || request.TenCongTy || request.TenDoanhNghiep}</td>
                      <td>{request.NguoiLienHe || request.HoTen}</td>
                      <td>{request.SoDienThoai || request.SDT}</td>
                      <td>{formatDate(request.ThoiGianKhoiHanh || request.NgayKhoiHanh)}</td>
                      <td><StaffStatusBadge status={request.TrangThai} /></td>
                      <td>{request.nhan_vien?.HoTen || request.NhanVien?.HoTen || 'Chưa phân công'}</td>
                      <td><Link className="view-all" to={`/staff/business-requests/${requestId}`}>Chi tiết</Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </StaffTable>
      )}
      <Pagination pagination={state.pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
    </>
  )
}
