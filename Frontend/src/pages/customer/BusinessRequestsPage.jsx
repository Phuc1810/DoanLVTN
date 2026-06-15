import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { businessRequestApi } from '../../api/businessRequestApi'
import Loading from '../../components/common/Loading'
import StatusBadge from '../../components/common/StatusBadge'
import { listFrom } from '../../utils/data'
import { formatDate } from '../../utils/formatDate'

export default function BusinessRequestsPage() {
  const [state, setState] = useState({ loading: true, error: '', requests: [] })

  useEffect(() => {
    businessRequestApi.getBusinessRequests()
      .then((payload) => setState({ loading: false, error: '', requests: listFrom(payload) }))
      .catch(() => setState({ loading: false, error: 'Backend chưa hỗ trợ danh sách yêu cầu doanh nghiệp của khách hàng.', requests: [] }))
  }, [])

  return (
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5">
        <div className="d-flex justify-content-between align-items-start">
          <div><div className="title"><i className="fa-solid fa-briefcase me-2"></i>Yêu cầu doanh nghiệp</div><div className="muted">Danh sách yêu cầu tour doanh nghiệp của bạn.</div></div>
          <Link className="btn btn-primary" to="/business-requests/create">Tạo yêu cầu</Link>
        </div>
        <div className="divider"></div>
        {state.loading && <Loading />}
        {state.error && <div className="alert alert-warning">{state.error}</div>}
        {state.requests.length > 0 && (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Mã</th><th>Công ty</th><th>Người liên hệ</th><th>Số người</th><th>Khởi hành</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>{state.requests.map((item) => (
                <tr key={item.MaYC || item.id}>
                  <td>#{item.MaYC || item.id}</td><td>{item.TenCongTy}</td><td>{item.NguoiLienHe}</td><td>{item.SoNguoi}</td><td>{formatDate(item.ThoiGianKhoiHanh)}</td><td><StatusBadge status={item.TrangThai} /></td><td><Link to={`/business-requests/${item.MaYC || item.id}`}>Chi tiết</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
