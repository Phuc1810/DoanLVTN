import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Loading from '../common/Loading'

const ROLE_COLORS = {
  AD: '#0047b3', // Xanh dương đậm
  NV: '#b45309', // Cam đất (Amber)
  KH: '#007b55', // Xanh lá đậm
}

const STATUS_COLORS = {
  'Hoạt động': '#007b55',
  'Khóa': '#f87171',
}

export default function StaffAccountStats({ data, loading }) {
  if (loading) return <Loading />
  if (!data) return null

  // Calculate active percentage
  const activeCount = data.statuses.find(s => s.name === 'Hoạt động')?.count || 0
  const totalCount = data.statuses.reduce((sum, s) => sum + s.count, 0)
  const activePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0

  return (
    <div className="row g-4 mb-4">
      {/* Phân bổ vai trò */}
      <div className="col-md-8">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body">
            <h6 className="card-title fw-bold mb-4 text-muted">Phân bổ vai trò</h6>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.roles} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                  <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => [value + ' tài khoản', 'Số lượng']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {data.roles.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.key] || '#cccccc'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Trạng thái tài khoản */}
      <div className="col-md-4">
        <div className="card h-100 border-0 shadow-sm">
          <div className="card-body d-flex flex-column">
            <h6 className="card-title fw-bold mb-0 text-muted">Trạng thái tài khoản</h6>
            <div className="flex-grow-1 position-relative" style={{ minHeight: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statuses}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    stroke="none"
                  >
                    {data.statuses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cccccc'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value + ' tài khoản', 'Số lượng']} />
                </PieChart>
              </ResponsiveContainer>
              {/* Central Label */}
              <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ pointerEvents: 'none' }}>
                <div className="fs-5 fw-bold text-dark">{activePercent}%</div>
                <div className="small text-muted">Active</div>
              </div>
            </div>
            
            {/* Custom Legend */}
            <div className="mt-auto pt-3">
              {data.statuses.map((s, idx) => (
                <div key={idx} className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.name === 'Hoạt động' ? '#007b55' : 'transparent', border: s.name === 'Hoạt động' ? 'none' : '2px solid #f87171', marginRight: 8 }}></div>
                    <span className="small text-dark fw-medium">{s.name === 'Khóa' ? 'Đã khóa' : s.name}</span>
                  </div>
                  <span className="small fw-bold">{s.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
