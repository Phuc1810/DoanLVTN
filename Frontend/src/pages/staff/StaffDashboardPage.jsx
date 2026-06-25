import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { staffBusinessRequestApi } from '../../api/staffBusinessRequestApi'
import { staffOrderApi } from '../../api/staffOrderApi'
import { staffPromotionApi } from '../../api/staffPromotionApi'
import { staffTourApi } from '../../api/staffTourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatCard from '../../components/staff/StaffStatCard'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import StaffTable from '../../components/staff/StaffTable'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import { API_TODO_MESSAGE, countPeople, extractList } from './staffPageUtils'

export default function StaffDashboardPage() {
  const [state, setState] = useState({ loading: true, warning: '', orders: [], tours: [], promotions: [], requests: [] })

  useEffect(() => {
    Promise.allSettled([
      staffOrderApi.list({ per_page: 5 }),
      staffTourApi.list({ per_page: 5 }),
      staffPromotionApi.list({ per_page: 5 }),
      staffBusinessRequestApi.list({ per_page: 5 }),
    ]).then((results) => {
      const [orders, tours, promotions, requests] = results
      setState({
        loading: false,
        warning: results.some((item) => item.status === 'rejected') ? API_TODO_MESSAGE : '',
        orders: orders.status === 'fulfilled' ? extractList(orders.value).slice(0, 5) : [],
        tours: tours.status === 'fulfilled' ? extractList(tours.value).slice(0, 5) : [],
        promotions: promotions.status === 'fulfilled' ? extractList(promotions.value) : [],
        requests: requests.status === 'fulfilled' ? extractList(requests.value).slice(0, 5) : [],
      })
    })
  }, [])

  if (state.loading) return <Loading />

  const revenue = state.orders
    .filter((order) => order.TrangThaiTT === 'Đã thanh toán' || order.thanh_toan?.TrangThaiTT === 'Đã thanh toán')
    .reduce((sum, order) => sum + Number(order.TongTienPhaiTra || order.TongTien || 0), 0)

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="current-date">{formatDate(new Date())}</div>
        </div>
      </div>
      {state.warning && <ErrorState message={state.warning} />}
      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3"><StaffStatCard icon="▣" label="Đơn đặt tour" value={state.orders.length} tone="blue" /></div>
        <div className="col-md-6 col-xl-3"><StaffStatCard icon="₫" label="Doanh thu đã tải" value={formatCurrency(revenue)} tone="green" /></div>
        <div className="col-md-6 col-xl-3"><StaffStatCard icon="⌖" label="Tour" value={state.tours.length} tone="orange" /></div>
        <div className="col-md-6 col-xl-3"><StaffStatCard icon="☏" label="Yêu cầu doanh nghiệp" value={state.requests.length} tone="purple" /></div>
      </div>
      <div className="row g-4">
        <div className="col-lg-6">
          <StaffTable title="Đơn đặt tour gần đây" action={<Link className="view-all" to="/staff/orders">Xem tất cả</Link>}>
            <table className="table">
              <thead><tr><th>Mã đơn</th><th>Khách/Tour</th><th>Số người</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {state.orders.map((order) => (
                  <tr key={order.MaDon}>
                    <td className="col-id">#{order.MaDon}</td>
                    <td><span className="cell-truncate">{order.khach_hang?.HoTen || order.KhachHang?.HoTen || order.tour?.TenTour || order.TenTour}</span></td>
                    <td>{countPeople(order)}</td>
                    <td><StaffStatusBadge status={order.TrangThai} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </StaffTable>
        </div>
        <div className="col-lg-6">
          <StaffTable title="Yêu cầu doanh nghiệp" action={<Link className="view-all" to="/staff/business-requests">Xem tất cả</Link>}>
            <table className="table">
              <thead><tr><th>Mã</th><th>Công ty</th><th>Liên hệ</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {state.requests.map((request) => (
                  <tr key={request.MaYC || request.id}>
                    <td className="col-id">#{request.MaYC || request.id}</td>
                    <td><span className="cell-truncate">{request.cong_ty?.TenCongTy || request.TenCongTy || request.TenDoanhNghiep}</span></td>
                    <td>{request.SoDienThoai || request.SDT || request.Email}</td>
                    <td><StaffStatusBadge status={request.TrangThai} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </StaffTable>
        </div>
      </div>
    </>
  )
}
