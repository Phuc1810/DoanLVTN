import { useEffect, useState } from 'react'
import { adminAccountApi } from '../../api/adminAccountApi'
import { normalizeError } from '../../pages/admin/adminPageUtils'
import FormError from '../common/FormError'

export default function ReassignModal({ data, onClose, onSuccess }) {
  const [assignments, setAssignments] = useState({})
  const [eligibleStaffs, setEligibleStaffs] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  function showToastError(msg) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 5000)
  }

  useEffect(() => {
    if (!data) return
    // Fetch eligible staff for each request
    data.requests.forEach(async (req) => {
      try {
        const payload = await adminAccountApi.getEligibleStaff({
          start_date: req.ThoiGianKhoiHanh,
          end_date: req.NgayKetThuc,
        })
        setEligibleStaffs((curr) => ({ ...curr, [req.MaYC]: Array.isArray(payload) ? payload : (payload?.data || []) }))
      } catch (e) {
        console.error('Lỗi khi lấy nhân viên', e)
      }
    })
  }, [data])

  if (!data) return null
  const { account, requests } = data

  function handleAssignChange(maYc, newMaNv) {
    setAssignments((curr) => ({ ...curr, [maYc]: newMaNv }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // Verify all requests are assigned
    for (const req of requests) {
      if (!assignments[req.MaYC]) {
        setError({ message: 'Vui lòng chọn nhân viên tiếp nhận cho tất cả các đơn.' })
        return
      }
    }

    // Check for overlaps
    const assignmentsByNv = {}
    for (const req of requests) {
      const nv = assignments[req.MaYC]
      if (!assignmentsByNv[nv]) assignmentsByNv[nv] = []
      assignmentsByNv[nv].push(req)
    }

    for (const nv in assignmentsByNv) {
      const assignedReqs = assignmentsByNv[nv]
      if (assignedReqs.length > 1) {
        // Compute date ranges
        const parsedReqs = assignedReqs.map(req => {
          const start = new Date(req.ThoiGianKhoiHanh)
          let end = new Date(start)
          if (req.NgayKetThuc) {
            end = new Date(req.NgayKetThuc)
          } else {
            const thoiLuongStr = req.tour ? req.tour.ThoiLuong : req.DiaDiem
            let days = 1
            if (thoiLuongStr) {
              const match = thoiLuongStr.match(/(\d+)\s*(n|ngày)/i)
              if (match) days = parseInt(match[1], 10)
            }
            end.setDate(end.getDate() + (days - 1))
          }
          return { req, start, end }
        })

        // Cross-check for overlap
        for (let i = 0; i < parsedReqs.length; i++) {
          for (let j = i + 1; j < parsedReqs.length; j++) {
            if (parsedReqs[i].start <= parsedReqs[j].end && parsedReqs[i].end >= parsedReqs[j].start) {
              const nvName = eligibleStaffs[parsedReqs[i].req.MaYC]?.find(s => s.MaNV == nv)?.HoTen || nv
              showToastError(`Lỗi: Bạn đang phân công nhân viên ${nvName} phụ trách nhiều yêu cầu bị trùng lịch nhau. Vui lòng chọn người khác.`)
              return
            }
          }
        }
      }
    }

    setSubmitting(true)
    setError(null)
    try {
      const payload = requests.map((req) => ({
        ma_yc: req.MaYC,
        new_ma_nv: parseInt(assignments[req.MaYC], 10),
      }))
      await adminAccountApi.reassignAndLock(account.MaTK, payload)
      onSuccess(`Đã khóa tài khoản và bàn giao ${requests.length} công việc thành công.`)
    } catch (e) {
      setError(normalizeError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="modal-backdrop show"></div>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow">
            <form onSubmit={handleSubmit}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">Bàn giao công việc đang xử lý</h5>
                <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning mb-4">
                  Tài khoản <strong>{account.TenDangNhap}</strong> hiện đang phụ trách {requests.length} yêu cầu doanh nghiệp chưa hoàn tất. Vui lòng chọn nhân viên tiếp quản để hệ thống có thể khóa tài khoản này.
                </div>
                <FormError message={error?.message} errors={error?.errors} />

                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Mã đơn</th>
                        <th>Công ty</th>
                        <th>Ngày khởi hành</th>
                        <th>Nhân viên tiếp quản</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => {
                        const staffs = eligibleStaffs[req.MaYC] || []
                        return (
                          <tr key={req.MaYC}>
                            <td className="fw-bold">#{req.MaYC}</td>
                            <td>
                              <div>{req.TenCongTy}</div>
                              {req.tour && <div className="small text-muted">{req.tour.TenTour}</div>}
                            </td>
                            <td>
                              {req.ThoiGianKhoiHanh ? new Date(req.ThoiGianKhoiHanh).toLocaleDateString('vi-VN') : 'Chưa xếp'}
                              {req.NgayKetThuc && ` - ${new Date(req.NgayKetThuc).toLocaleDateString('vi-VN')}`}
                            </td>
                            <td>
                              <select 
                                className="form-select shadow-none" 
                                value={assignments[req.MaYC] || ''} 
                                onChange={(e) => handleAssignChange(req.MaYC, e.target.value)}
                                disabled={submitting || staffs.length === 0}
                              >
                                <option value="">-- Chọn nhân viên --</option>
                                {staffs.map((s) => (
                                  <option key={s.MaNV} value={s.MaNV}>{s.HoTen} (ID: {s.MaNV})</option>
                                ))}
                              </select>
                              {staffs.length === 0 && <div className="small text-danger mt-1">Không có nhân viên rảnh rỗi</div>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-light fw-medium border shadow-sm px-4" onClick={onClose} disabled={submitting}>Hủy</button>
                <button type="submit" className="btn btn-primary fw-medium shadow-sm px-4" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : 'Bàn giao & Khóa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1060 }}>
          <div className="toast align-items-center text-white bg-danger border-0 show fade" role="alert" aria-live="assertive" aria-atomic="true">
            <div className="d-flex">
              <div className="toast-body fw-semibold">
                {toastMessage}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMessage('')} aria-label="Close"></button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
