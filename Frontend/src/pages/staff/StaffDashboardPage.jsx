import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { staffBusinessRequestApi } from '../../api/staffBusinessRequestApi'
import { staffDashboardApi } from '../../api/staffDashboardApi'
import { staffOrderApi } from '../../api/staffOrderApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StaffStatCard from '../../components/staff/StaffStatCard'
import StaffStatusBadge from '../../components/staff/StaffStatusBadge'
import StaffTable from '../../components/staff/StaffTable'
import { formatCurrency } from '../../utils/formatCurrency'
import { API_TODO_MESSAGE, countPeople, extractList } from './staffPageUtils'
import {
  ClipboardList,
  DollarSign,
  Map,
  MessageSquare,
  MoreVertical,
  Plus,
  FileDown,
} from 'lucide-react'

function getVietnameseWeekday() {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return days[new Date().getDay()]
}

function formatVietnameseDate() {
  const d = new Date()
  const weekday = getVietnameseWeekday()
  return `${weekday}, ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`
}

/* ===== DONUT CHART (SVG) ===== */
function DonutChart({ data }) {
  const size = 150
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let cumulativePercent = 0

  return (
    <div className="donut-chart-wrapper">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, i) => {
          const offset = circumference * (1 - cumulativePercent / 100)
          const dashArray = (circumference * item.percent) / 100
          cumulativePercent += item.percent
          
          if (item.percent === 0) return null

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference - dashArray}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
        })}
      </svg>
      <div className="donut-center-text">
        <span className="donut-percent">100%</span>
        <span className="donut-label">Tổng cộng</span>
      </div>
    </div>
  )
}

/* ===== BAR CHART (CSS) ===== */
function BarChart({ data }) {
  const maxVal = Math.max(1, ...data.map((d) => d.value ?? d.revenue ?? 0))
  return (
    <div className="bar-chart">
      {data.map((item, i) => {
        const val = item.value ?? item.revenue ?? 0
        return (
          <div key={i} className="bar-column">
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ height: `${(val / maxVal) * 100}%` }}
              />
            </div>
            <span className="bar-label">{item.day}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ===== TRANG CHÍNH ===== */
export default function StaffDashboardPage() {
  const [state, setState] = useState({
    loading: true,
    warning: '',
    orders: [],
    requests: [],
    stats: {
      total_orders: 0,
      orders_this_month: 0,
      orders_growth_percent: 0,
      total_revenue: 0,
      revenue_growth_percent: 0,
      active_tours: 0,
      pending_requests: 0,
      requests_growth_percent: 0,
    },
    revenueWeekly: [],
    tourStatus: null,
  })

  useEffect(() => {
    Promise.allSettled([
      staffDashboardApi.getStats(),
      staffDashboardApi.getRevenueWeekly(),
      staffDashboardApi.getTourStatus(),
      staffOrderApi.list({ per_page: 5 }),
      staffBusinessRequestApi.list({ per_page: 5 }),
    ]).then((results) => {
      const [statsRes, revenueRes, statusRes, ordersRes, requestsRes] = results

      const getInnerData = (res) => (res.status === 'fulfilled' ? res.value : null)

      setState({
        loading: false,
        warning: results.some((item) => item.status === 'rejected') ? API_TODO_MESSAGE : '',
        stats: getInnerData(statsRes) || state.stats,
        revenueWeekly: getInnerData(revenueRes) || [],
        tourStatus: getInnerData(statusRes) || null,
        orders: ordersRes.status === 'fulfilled' ? extractList(ordersRes.value).slice(0, 5) : [],
        requests: requestsRes.status === 'fulfilled' ? extractList(requestsRes.value).slice(0, 5) : [],
      })
    })
  }, [])

  if (state.loading) return <Loading />

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tổng quan hệ thống</h1>
          <div className="current-date">
            Chào mừng trở lại! Đây là những gì đang diễn ra hôm nay, {formatVietnameseDate()}
          </div>
        </div>
        <div className="dash-header-actions">
          <button className="dash-btn-outline">
            <FileDown size={16} />
            Xuất báo cáo
          </button>
          <Link to="/staff/tours/create" className="dash-btn-primary">
            <Plus size={16} />
            Thêm Tour mới
          </Link>
        </div>
      </div>

      {state.warning && <ErrorState message={state.warning} />}

      {/* ===== STAT CARDS ===== */}
      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<ClipboardList size={22} />}
            label="ĐƠN ĐẶT TOUR"
            value={state.stats.total_orders}
            tone="blue"
            subtitle={
              <span className={state.stats.orders_growth_percent >= 0 ? "trend-up" : "trend-down"}>
                {state.stats.orders_growth_percent > 0 ? '+' : ''}{state.stats.orders_growth_percent}% <span className="trend-text">so với tháng trước</span>
              </span>
            }
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<DollarSign size={22} />}
            label="DOANH THU ƯỚC TÍNH"
            value={formatCurrency(state.stats.total_revenue)}
            tone="green"
            subtitle={
              <span className={state.stats.revenue_growth_percent >= 0 ? "trend-up" : "trend-down"}>
                {state.stats.revenue_growth_percent > 0 ? '+' : ''}{state.stats.revenue_growth_percent}% <span className="trend-text">so với tháng trước</span>
              </span>
            }
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<Map size={22} />}
            label="TOUR ĐANG HOẠT ĐỘNG"
            value={state.stats.active_tours}
            tone="orange"
            subtitle={<span className="trend-text">Đang trong hành trình</span>}
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<MessageSquare size={22} />}
            label="YÊU CẦU CẦN XỬ LÝ"
            value={state.stats.pending_requests}
            tone="purple"
            subtitle={
              <span className={state.stats.requests_growth_percent >= 0 ? "trend-up" : "trend-down"}>
                {state.stats.requests_growth_percent > 0 ? '+' : ''}{state.stats.requests_growth_percent}% <span className="trend-text">so với tháng trước</span>
              </span>
            }
          />
        </div>
      </div>

      {/* ===== CHARTS ROW ===== */}
      <div className="row g-4 mb-4">
        {/* Biểu đồ Doanh thu tuần */}
        <div className="col-lg-7">
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Xu hướng doanh thu tuần này</h3>
              <button className="chart-menu-btn"><MoreVertical size={18} /></button>
            </div>
            <div className="chart-card-body">
              {state.revenueWeekly.length > 0 ? (
                <BarChart data={state.revenueWeekly} />
              ) : (
                <div className="text-muted p-3 text-center">Chưa có dữ liệu tuần này</div>
              )}
            </div>
          </div>
        </div>

        {/* Biểu đồ Trạng thái tour */}
        <div className="col-lg-5">
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Trạng thái tour</h3>
              <button className="chart-menu-btn"><MoreVertical size={18} /></button>
            </div>
            <div className="chart-card-body chart-donut-body">
              {state.tourStatus?.data?.length > 0 ? (
                <>
                  <DonutChart data={state.tourStatus.data} />
                  <div className="donut-legend">
                    {state.tourStatus.data.map((item, i) => (
                      <div key={i} className="legend-item">
                        <span className="legend-dot" style={{ background: item.color }} />
                        <span className="legend-label">{item.label}</span>
                        <span className="legend-value">{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-muted p-3 text-center">Chưa có dữ liệu trạng thái tour</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABLES ROW ===== */}
      <div className="row g-4">
        {/* Đơn đặt tour mới nhất */}
        <div className="col-lg-6">
          <StaffTable
            title="Đơn đặt tour mới nhất"
            action={<Link className="view-all" to="/staff/orders">Xem tất cả</Link>}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng / Tour</th>
                  <th>Số khách</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {state.orders.map((order) => (
                  <tr key={order.MaDon}>
                    <td className="col-id">
                      <span className="order-id-badge">#{order.MaDon}</span>
                    </td>
                    <td>
                      <div className="cell-two-line">
                        <span className="cell-primary">
                          {order.khach_hang?.HoTen || order.KhachHang?.HoTen || '—'}
                        </span>
                        <span className="cell-secondary">
                          {order.tour?.TenTour || order.TenTour || ''}
                        </span>
                      </div>
                    </td>
                    <td>{countPeople(order) || '—'} người</td>
                    <td><StaffStatusBadge status={order.TrangThai} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </StaffTable>
        </div>

        {/* Yêu cầu doanh nghiệp */}
        <div className="col-lg-6">
          <StaffTable
            title="Yêu cầu doanh nghiệp"
            action={<Link className="view-all" to="/staff/business-requests">Xem tất cả</Link>}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>Công ty / Liên hệ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {state.requests.map((request) => (
                  <tr key={request.MaYC || request.id}>
                    <td>
                      <div className="cell-two-line">
                        <span className="cell-primary">
                          {request.cong_ty?.TenCongTy || request.TenCongTy || request.TenDoanhNghiep || '—'}
                        </span>
                        <span className="cell-secondary cell-phone">
                          {request.SoDienThoai || request.SDT || request.Email || ''}
                        </span>
                      </div>
                    </td>
                    <td><StaffStatusBadge status={request.TrangThai} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer-action">
              <Link to="/staff/business-requests" className="dash-btn-outline-sm">
                Tạo yêu cầu báo giá mới
              </Link>
            </div>
          </StaffTable>
        </div>
      </div>
    </>
  )
}
