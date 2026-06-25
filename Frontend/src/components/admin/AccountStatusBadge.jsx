export function AccountRoleBadge({ role }) {
  const classes = {
    AD: 'bg-danger-subtle text-danger border border-danger-subtle',
    NV: 'bg-primary-subtle text-primary border border-primary-subtle',
    KH: 'bg-success-subtle text-success border border-success-subtle',
  }
  return <span className={`badge rounded-pill ${classes[role] || 'bg-secondary'}`}>{role || 'N/A'}</span>
}

export default function AccountStatusBadge({ status }) {
  const normalized = status || 'Chưa cập nhật'
  const isActive = normalized === 'Hoạt động' || normalized === 'Hoáº¡t Ä‘á»™ng'
  const isLocked = normalized === 'Khóa' || normalized === 'KhÃ³a'
  const className = isActive
    ? 'bg-success-subtle text-success'
    : isLocked
      ? 'bg-dark-subtle text-dark'
      : 'bg-secondary'
  return <span className={`badge rounded-pill ${className}`}>{normalized}</span>
}
