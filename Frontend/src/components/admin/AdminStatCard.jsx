export default function AdminStatCard({ label, value, icon, tone = 'primary' }) {
  return (
    <div className="admin-kpi-card">
      <div>
        <div className="admin-kpi-label">{label}</div>
        <div className="admin-kpi-value">{value}</div>
      </div>
      <div className={`admin-kpi-icon admin-icon-${tone}`}>{icon}</div>
    </div>
  )
}
