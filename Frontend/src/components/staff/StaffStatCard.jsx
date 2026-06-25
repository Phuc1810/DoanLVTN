export default function StaffStatCard({ icon, label, value, tone = 'orange', trend }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div>
          <div className="stat-label">{label}</div>
          <p className="stat-value">{value}</p>
        </div>
        <div className={`stat-icon icon-${tone}`}>{icon}</div>
      </div>
      {trend && <div className="stat-trend trend-neutral">{trend}</div>}
    </div>
  )
}
