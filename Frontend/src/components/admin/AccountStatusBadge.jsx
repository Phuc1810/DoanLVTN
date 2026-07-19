export function AccountRoleBadge({ role }) {
  const styles = {
    AD: { color: '#0047b3', backgroundColor: '#f0f7ff', borderColor: '#99c2ff' },
    NV: { color: '#b45309', backgroundColor: '#fffbeb', borderColor: '#fde68a' },
    KH: { color: '#007b55', backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  }
  const labels = {
    AD: 'Admin',
    NV: 'Nhân viên',
    KH: 'Khách hàng',
  }
  const currentStyle = styles[role] || { color: '#4b5563', backgroundColor: '#f3f4f6', borderColor: '#d1d5db' }
  return (
    <span 
      className="badge rounded-3 px-3 py-2 border" 
      style={{ ...currentStyle, fontWeight: 700, fontSize: '11px' }}
    >
      {labels[role] || role || 'N/A'}
    </span>
  )
}

export default function AccountStatusBadge({ status }) {
  const normalized = status || 'Chưa cập nhật'
  const isActive = normalized === 'Hoạt động' || normalized === 'Hoáº¡t Ä‘á»™ng'
  const isLocked = normalized === 'Khóa' || normalized === 'KhÃ³a'
  
  let currentStyle = { color: '#4b5563', backgroundColor: '#f3f4f6', borderColor: '#d1d5db' }
  if (isActive) {
    currentStyle = { color: '#007b55', backgroundColor: '#f0fdf4', borderColor: '#86efac' }
  } else if (isLocked) {
    currentStyle = { color: '#b91c1c', backgroundColor: '#fef2f2', borderColor: '#fecaca' }
  }

  return (
    <span 
      className="badge rounded-3 px-3 py-2 border" 
      style={{ ...currentStyle, fontWeight: 700, fontSize: '11px' }}
    >
      {normalized}
    </span>
  )
}
