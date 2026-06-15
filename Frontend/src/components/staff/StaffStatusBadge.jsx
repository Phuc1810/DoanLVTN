const STATUS_CLASS = {
  'Hoạt động': 'badge-soft-success',
  'Đang hoạt động': 'badge-soft-success',
  'Đã thanh toán': 'badge-soft-success',
  'Đã ký hợp đồng': 'badge-soft-success',
  'Đã liên hệ': 'badge-soft-info',
  'Chờ xử lý': 'badge-soft-warning',
  'Chờ liên hệ': 'badge-soft-warning',
  'Chưa thanh toán': 'badge-soft-warning',
  'Tạm ngưng': 'badge-soft-secondary',
  'Đã hủy': 'badge-soft-danger',
  'Hủy': 'badge-soft-danger',
}

export default function StaffStatusBadge({ status }) {
  const label = status || 'Chưa cập nhật'
  const className = STATUS_CLASS[label] || 'badge-soft-secondary'
  return <span className={`badge-soft ${className}`}>{label}</span>
}
