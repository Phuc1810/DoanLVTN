import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import adminReportApi from '../../api/adminReportApi'
import { formatCurrency } from '../../utils/formatCurrency'
import Pagination from '../../components/common/Pagination'

export default function AdminReportsPage() {
  const [data, setData] = useState({
    summary: { total_revenue: 0, total_tickets: 0, total_orders: 0 },
    top_tours: [],
    details: [],
  })
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 5

  const fetchReports = async () => {
    try {
      setLoading(true)
      setErrorMsg('')
      setCurrentPage(1)
      const res = await adminReportApi.getRevenue({ start_date: startDate, end_date: endDate })
      setData(res)
    } catch (error) {
      console.error(error)
      setErrorMsg('Không thể lấy dữ liệu báo cáo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilter = (e) => {
    e.preventDefault()
    fetchReports()
  }

  const handleExport = async () => {
    try {
      const response = await adminReportApi.exportRevenue({ start_date: startDate, end_date: endDate })
      
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Bao_Cao_Doanh_Thu_${new Date().getTime()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error(error)
      window.alert('Lỗi khi tải file báo cáo.')
    }
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-dark fw-bold">Báo cáo Doanh thu</h2>
          <p className="text-muted mb-0">Phân tích chuyên sâu về doanh thu và hiệu quả bán hàng</p>
        </div>
        <button onClick={handleExport} className="btn btn-warning fw-bold px-4 shadow-sm" style={{ backgroundColor: '#ffc107' }}>
          <i className="fa-solid fa-file-excel me-2"></i> Xuất Excel
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={handleFilter} className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label text-muted fw-bold small">Từ ngày (Ngày đặt)</label>
              <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted fw-bold small">Đến ngày</label>
              <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-primary w-100 fw-bold">
                <i className="fa-solid fa-filter me-2"></i> Lọc dữ liệu
              </button>
            </div>
          </form>
          {errorMsg && <div className="alert alert-danger mt-3 mb-0">{errorMsg}</div>}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)', color: 'white', borderRadius: '12px' }}>
                <div className="card-body p-4 d-flex align-items-center">
                  <div className="me-3 bg-white bg-opacity-25 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                    <i className="fa-solid fa-sack-dollar fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-white-50 text-uppercase fw-bold mb-1" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Tổng doanh thu</h6>
                    <h3 className="fw-bold mb-0">{formatCurrency(data.summary.total_revenue)}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #198754 0%, #146c43 100%)', color: 'white', borderRadius: '12px' }}>
                <div className="card-body p-4 d-flex align-items-center">
                  <div className="me-3 bg-white bg-opacity-25 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                    <i className="fa-solid fa-ticket fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-white-50 text-uppercase fw-bold mb-1" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Số vé đã bán</h6>
                    <h3 className="fw-bold mb-0">{data.summary.total_tickets} <small className="fs-6 fw-normal opacity-75">vé</small></h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #6f42c1 0%, #59359a 100%)', color: 'white', borderRadius: '12px' }}>
                <div className="card-body p-4 d-flex align-items-center">
                  <div className="me-3 bg-white bg-opacity-25 p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                    <i className="fa-solid fa-cart-shopping fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-white-50 text-uppercase fw-bold mb-1" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>Số đơn hàng</h6>
                    <h3 className="fw-bold mb-0">{data.summary.total_orders} <small className="fs-6 fw-normal opacity-75">đơn</small></h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="card-title fw-bold mb-0 text-dark">
                  <i className="fa-solid fa-chart-column me-2 text-primary"></i>
                  Top 5 Tour Doanh Thu Cao Nhất
                </h5>
              </div>
              <div style={{ height: 380, width: '100%' }}>
                {data.top_tours.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.top_tours} margin={{ top: 30, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: '#6c757d' }} 
                        tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val} 
                        axisLine={{ stroke: '#dee2e6' }}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6c757d' }}
                        tickFormatter={(val) => val >= 1000000 ? (val / 1000000) + 'M' : val} 
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Doanh thu']} 
                        cursor={{ fill: 'rgba(13, 110, 253, 0.05)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        <LabelList dataKey="revenue" position="top" formatter={(val) => val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val} style={{ fill: '#495057', fontSize: '12px', fontWeight: 'bold' }} dy={-10} />
                      </Bar>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0d6efd" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#0dcaf0" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex flex-column h-100 align-items-center justify-content-center text-muted">
                    <i className="fa-solid fa-inbox fs-1 mb-3 text-light"></i>
                    <p className="mb-0 fw-medium">Không có dữ liệu trong khoảng thời gian này</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header bg-white border-bottom-0 pt-4 pb-3 px-4">
              <h5 className="card-title fw-bold mb-0 text-dark">
                <i className="fa-solid fa-table-list me-2 text-primary"></i>
                Bảng chi tiết doanh thu theo Tour
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted small text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                    <tr>
                      <th className="ps-4 py-3 border-0 rounded-start">Mã Tour</th>
                      <th className="py-3 border-0">Tên Tour</th>
                      <th className="text-center py-3 border-0">Số Đơn</th>
                      <th className="text-center py-3 border-0">Số Vé Bán</th>
                      <th className="text-end pe-4 py-3 border-0 rounded-end">Tổng Doanh Thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.details.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">Không có dữ liệu</td>
                      </tr>
                    ) : (
                      data.details.slice((currentPage - 1) * perPage, currentPage * perPage).map(row => (
                        <tr key={row.MaTour}>
                          <td className="ps-4 fw-bold">#{row.MaTour}</td>
                          <td>
                            <div className="fw-medium text-dark">{row.TenTour}</div>
                          </td>
                          <td className="text-center">{row.TongSoDon}</td>
                          <td className="text-center">
                            <span className="badge bg-success-subtle text-success px-2 py-1">
                              {row.TongSoVeDaBan}
                            </span>
                          </td>
                          <td className="text-end pe-4 fw-bold text-primary">
                            {formatCurrency(row.TongDoanhThu)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {data.details.length > perPage && (
                <div className="p-3 border-top">
                  <Pagination 
                    current={currentPage} 
                    total={Math.ceil(data.details.length / perPage)} 
                    onPageChange={setCurrentPage} 
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
