const STATUS_CLASS = {
  // Tour states
  'Hoạt động': 'badge-soft-success',
  'Đang hoạt động': 'badge-soft-success',
  'Tạm ngưng': 'badge-soft-secondary',

  // Order states
  'Chờ thanh toán': 'badge-soft-warning', // Orange/Yellow
  'Đã thanh toán': 'badge-soft-info', // Blue
  'Đang diễn ra': 'badge-soft-purple', // Purple
  'Đã hoàn tất': 'badge-soft-success', // Green
  'Hết chỗ': 'badge-soft-secondary', // Gray
  'Đã huỷ': 'badge-soft-danger', // Red
  'Đã hoàn tiền': 'badge-soft-pink', // Pink

  // Other
  'Đã ký hợp đồng': 'badge-soft-success',
  'Đã liên hệ': 'badge-soft-info',
  'Chờ xử lý': 'badge-soft-warning',
  'Chờ liên hệ': 'badge-soft-warning',
  'Chưa thanh toán': 'badge-soft-warning',
  'Hủy': 'badge-soft-danger',
  'Hủy tour': 'badge-soft-danger',
  'Hoàn thành': 'badge-soft-success',
}

export default function StaffStatusBadge({ status }) {
  const label = status || 'Chưa cập nhật'
  const className = STATUS_CLASS[label] || 'badge-soft-secondary'
  return <span className={`badge-soft ${className}`}>{label}</span>
}
