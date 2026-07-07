export default function StaffStatCard({ icon, label, value, tone = 'blue', subtitle }) {
  const toneColors = {
    blue: { bg: '#eff6ff', color: '#3b82f6', border: '#3b82f6' },
    green: { bg: '#f0fdf4', color: '#22c55e', border: '#22c55e' },
    orange: { bg: '#fff7ed', color: '#f97316', border: '#f97316' },
    purple: { bg: '#f3e8ff', color: '#a855f7', border: '#a855f7' },
  }
  const c = toneColors[tone] || toneColors.blue

  return (
    <div className="stat-card" style={{ borderLeft: `4px solid ${c.border}` }}>
      <div className="stat-header">
        <div>
          <div className="stat-label">{label}</div>
          <p className="stat-value">{value}</p>
        </div>
        <div
          className="stat-icon-circle"
          style={{ background: c.bg, color: c.color }}
        >
          {icon}
        </div>
      </div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  )
}
