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

/* ===== DỮ LIỆU GIẢ (Backend chưa hỗ trợ) ===== */
const FAKE_WEEKLY_REVENUE = [
  { day: 'T2', value: 65 },
  { day: 'T3', value: 80 },
  { day: 'T4', value: 45 },
  { day: 'T5', value: 90 },
  { day: 'T6', value: 55 },
  { day: 'T7', value: 70 },
  { day: 'CN', value: 40 },
]

const FAKE_TOUR_STATUS = [
  { label: 'Sắp khởi hành', percent: 40, color: '#3b82f6' },
  { label: 'Đang diễn ra', percent: 30, color: '#f97316' },
  { label: 'Đã hoàn thành', percent: 30, color: '#22c55e' },
]
/* ================================================ */

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
  const maxVal = Math.max(...data.map((d) => d.value))
  return (
    <div className="bar-chart">
      {data.map((item, i) => (
        <div key={i} className="bar-column">
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ height: `${(item.value / maxVal) * 100}%` }}
            />
          </div>
          <span className="bar-label">{item.day}</span>
        </div>
      ))}
    </div>
  )
}

/* ===== TRANG CHÍNH ===== */
export default function StaffDashboardPage() {
  const [state, setState] = useState({
    loading: true,
    warning: '',
    orders: [],
    tours: [],
    promotions: [],
    requests: [],
  })

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
    .filter(
      (order) =>
        order.TrangThaiTT === 'Đã thanh toán' ||
        order.thanh_toan?.TrangThaiTT === 'Đã thanh toán'
    )
    .reduce((sum, order) => sum + Number(order.TongTienPhaiTra || order.TongTien || 0), 0)

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
            value={state.orders.length}
            tone="blue"
            subtitle={
              <span className="trend-up">+5% <span className="trend-text">so với tháng trước</span></span>
            }
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<DollarSign size={22} />}
            label="DOANH THU ƯỚC TÍNH"
            value={formatCurrency(revenue)}
            tone="green"
            subtitle={
              <span className="trend-up">+12.5% <span className="trend-text">so với tháng trước</span></span>
            }
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<Map size={22} />}
            label="TOUR ĐANG HOẠT ĐỘNG"
            value={state.tours.length}
            tone="orange"
            subtitle={<span className="trend-text">Đang trong hành trình</span>}
          />
        </div>
        <div className="col-md-6 col-xl-3">
          <StaffStatCard
            icon={<MessageSquare size={22} />}
            label="YÊU CẦU CẦN XỬ LÝ"
            value={state.requests.length}
            tone="purple"
            subtitle={
              <span className="trend-down">-2% <span className="trend-text">so với tháng trước</span></span>
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
              <BarChart data={FAKE_WEEKLY_REVENUE} />
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
              <DonutChart data={FAKE_TOUR_STATUS} />
              <div className="donut-legend">
                {FAKE_TOUR_STATUS.map((item, i) => (
                  <div key={i} className="legend-item">
                    <span className="legend-dot" style={{ background: item.color }} />
                    <span className="legend-label">{item.label}</span>
                    <span className="legend-value">{item.percent}%</span>
                  </div>
                ))}
              </div>
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
