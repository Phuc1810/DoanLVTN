import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { businessRequestApi } from '../../api/businessRequestApi'
import Loading from '../../components/common/Loading'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDate } from '../../utils/formatDate'

export default function BusinessRequestDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true, error: '', request: null })

  useEffect(() => {
    businessRequestApi.getBusinessRequest(id)
      .then((request) => setState({ loading: false, error: '', request }))
      .catch(() => setState({ loading: false, error: 'Backend chưa hỗ trợ chi tiết yêu cầu doanh nghiệp của khách hàng.', request: null }))
  }, [id])

  if (state.loading) return <Loading />

  return (
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5">
        <div className="d-flex justify-content-between align-items-start">
          <div><div className="title"><i className="fa-solid fa-briefcase me-2"></i>Chi tiết yêu cầu #{id}</div></div>
          <Link className="btn btn-outline-secondary" to="/business-requests">Quay lại</Link>
        </div>
        <div className="divider"></div>
        {state.error && <div className="alert alert-warning">{state.error}</div>}
        {state.request && (
          <div className="row g-3">
            <div className="col-md-6"><strong>Công ty:</strong> {state.request.TenCongTy}</div>
            <div className="col-md-6"><strong>Người liên hệ:</strong> {state.request.NguoiLienHe}</div>
            <div className="col-md-6"><strong>SĐT:</strong> {state.request.SDT}</div>
            <div className="col-md-6"><strong>Số người:</strong> {state.request.SoNguoi}</div>
            <div className="col-md-6"><strong>Khởi hành:</strong> {formatDate(state.request.ThoiGianKhoiHanh)}</div>
            <div className="col-md-6"><strong>Trạng thái:</strong> <StatusBadge status={state.request.TrangThai} /></div>
            <div className="col-12"><strong>Ghi chú:</strong> {state.request.GhiChu}</div>
          </div>
        )}
      </div>
    </div>
  )
}
