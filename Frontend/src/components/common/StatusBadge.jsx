const statusClass = {
  'Chờ thanh toán': 'text-bg-warning',
  'Đã thanh toán': 'text-bg-success',
  'Hết chỗ': 'text-bg-danger',
  'Đang diễn ra': 'text-bg-primary',
  'Đã hoàn tất': 'text-bg-secondary',
  'Đã huỷ': 'text-bg-dark',
  'Đã hủy': 'text-bg-dark',
  'Đã hoàn tiền': 'text-bg-info',
  'Chờ xử lý': 'text-bg-warning',
  'Đã liên hệ': 'text-bg-info text-white',
  'Hoàn thành': 'text-bg-success',
  'Hủy tour': 'text-bg-danger',
}

export default function StatusBadge({ status }) {
  return <span className={`badge ${statusClass[status] || 'text-bg-light'}`}>{status || 'Đang cập nhật'}</span>
}
