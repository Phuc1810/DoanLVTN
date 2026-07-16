import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState, useRef } from 'react'
import { orderApi } from '../../api/orderApi'
import ErrorState from '../../components/common/ErrorState'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'

function refundPolicy(order) {
  const start = order?.tour?.NgayKhoiHanh
  if (!start) return { canCancel: false, rate: 0, text: 'Tour chưa có ngày khởi hành.' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)
  const days = Math.floor((startDate - today) / 86400000)
  if (order.TrangThai !== 'Đã thanh toán' && order.TrangThai !== 'Chờ thanh toán') return { canCancel: false, rate: 0, text: 'Đơn này không đủ điều kiện huỷ.' }
  
  if (order.TrangThai === 'Chờ thanh toán') {
    return { canCancel: true, rate: 0, text: 'Huỷ đơn chưa thanh toán -> hoàn 0%' }
  }

  if (days >= 10) return { canCancel: true, rate: 0.7, text: `Huỷ trước ${days} ngày -> dự kiến hoàn 70%` }
  if (days >= 5) return { canCancel: true, rate: 0.5, text: `Huỷ trước ${days} ngày -> dự kiến hoàn 50%` }
  if (days >= 3) return { canCancel: true, rate: 0.25, text: `Huỷ trước ${days} ngày -> dự kiến hoàn 25%` }
  return { canCancel: true, rate: 0, text: `Huỷ sát ngày (${days} ngày) -> hoàn 0%` }
}

export default function CancelOrderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: '', order: null })
  const [lydo, setLydo] = useState('')
  const [nganHang, setNganHang] = useState('')
  const [soTaiKhoan, setSoTaiKhoan] = useState('')
  const [tenTaiKhoan, setTenTaiKhoan] = useState('')
  const [agree, setAgree] = useState(false)
  const [submitError, setSubmitError] = useState({ message: '', errors: {} })
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [banks, setBanks] = useState([])
  const [showBanks, setShowBanks] = useState(false)
  const [activeBankIndex, setActiveBankIndex] = useState(-1)
  const bankWrapperRef = useRef(null)

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000)
  }

  useEffect(() => {
    orderApi.getOrder(id)
      .then((order) => setState({ loading: false, error: '', order }))
      .catch((error) => setState({ loading: false, error: error.message, order: null }))

    // Fetch list of banks for datalist
    fetch('https://api.vietqr.io/v2/banks')
      .then(res => res.json())
      .then(data => {
        if (data.code === '00' && data.data) {
          setBanks(data.data)
        }
      })
      .catch(err => console.error('Failed to fetch banks', err))
  }, [id])

  useEffect(() => {
    function handleClickOutside(event) {
      if (bankWrapperRef.current && !bankWrapperRef.current.contains(event.target)) {
        setShowBanks(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredBanks = useMemo(() => {
    if (!nganHang) return banks
    const lower = nganHang.toLowerCase()
    return banks.filter(b => b.name.toLowerCase().includes(lower) || b.shortName.toLowerCase().includes(lower))
  }, [banks, nganHang])

  function handleBankKeyDown(event) {
    if (!showBanks) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveBankIndex((current) => (current + 1) % filteredBanks.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveBankIndex((current) => (current <= 0 ? filteredBanks.length - 1 : current - 1))
    } else if (event.key === 'Enter' && activeBankIndex >= 0) {
      event.preventDefault()
      setNganHang(filteredBanks[activeBankIndex].shortName)
      setShowBanks(false)
    } else if (event.key === 'Escape') {
      setShowBanks(false)
    }
  }

  const order = state.order || {}
  const policy = useMemo(() => refundPolicy(state.order), [state.order])
  const refundAmount = Math.round(Number(state.order?.TongTienPhaiTra || 0) * policy.rate)

  async function submit(event) {
    event.preventDefault()
    setSubmitError({ message: '', errors: {} })
    
    if (order?.TrangThai === 'Đã thanh toán') {
      const isLydoEmpty = !lydo.trim();
      const isNganHangEmpty = !nganHang.trim();
      const isSoTKEmpty = !soTaiKhoan.trim();
      const isTenTKEmpty = !tenTaiKhoan.trim();

      if (isLydoEmpty && isNganHangEmpty && isSoTKEmpty && isTenTKEmpty && !agree) {
        showToast('Vui lòng nhập đầy đủ thông tin.', 'danger')
        return
      }

      if (!agree) {
        showToast('Vui lòng đồng ý với chính sách huỷ/hoàn tiền.', 'danger')
        return
      }
      if (isLydoEmpty) {
        showToast('Vui lòng nhập Lý do huỷ tour.', 'danger')
        return
      }
      if (isNganHangEmpty) {
        showToast('Vui lòng chọn hoặc nhập Ngân hàng để nhận hoàn tiền.', 'danger')
        return
      }
      if (isSoTKEmpty) {
        showToast('Vui lòng nhập Số tài khoản để nhận hoàn tiền.', 'danger')
        return
      }
      if (isTenTKEmpty) {
        showToast('Vui lòng nhập Tên chủ tài khoản để nhận hoàn tiền.', 'danger')
        return
      }
    } else {
      if (!agree) {
        showToast('Vui lòng đồng ý với chính sách huỷ/hoàn tiền.', 'danger')
        return
      }
      if (order?.TrangThai !== 'Chờ thanh toán' && !lydo.trim()) {
        showToast('Vui lòng nhập Lý do huỷ tour.', 'danger')
        return
      }
    }

    setSubmitting(true)
    setSubmitError({ message: '', errors: {} })
    try {
      await orderApi.cancelOrder(id, { 
        ly_do: lydo,
        NganHang: nganHang,
        SoTaiKhoan: soTaiKhoan,
        TenTaiKhoan: tenTaiKhoan
      })
      showToast('Huỷ tour thành công. Đang quay lại trang chi tiết...', 'success')
      setTimeout(() => {
        navigate(`/orders/${id}`)
      }, 1500)
    } catch (err) {
      const errMsg = err.status === 404 ? 'Chức năng huỷ tour chưa được backend hỗ trợ.' : err.message
      showToast(errMsg, 'danger')
      setSubmitError({
        message: '',
        errors: err.errors || {},
      })
      setSubmitting(false)
    }
  }

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const qty = Number(order.SoLuongNguoiLon || 0) + Number(order.SoLuongTreEm || 0) + Number(order.SoLuongTreNho || 0)

  return (
    <div className="container wrap" style={{ maxWidth: 920 }}>
      <div className="bg-white p-4 rounded-4 shadow-sm border">
        <h3 className="fw-bold mb-1">Xác nhận huỷ tour</h3>
        <div className="text-muted mb-3">Vui lòng kiểm tra thông tin và xác nhận trước khi huỷ.</div>
        {submitError.errors && Object.keys(submitError.errors).length > 0 && <FormError message={submitError.message} errors={submitError.errors} />}
        <div className="row g-3">
          <div className="col-md-7">
            <div className="border rounded-4 p-3">
              <div className="fw-bold mb-2">Thông tin đơn</div>
              <div>Mã đơn: <b>#{order.MaDon}</b></div>
              <div>Tour: <b>{order.tour?.TenTour}</b></div>
              <div>Ngày khởi hành: <b>{formatDate(order.tour?.NgayKhoiHanh)}</b></div>
              <div>Số lượng khách: <b>{qty}</b></div>
              <div>Tổng tiền đã thanh toán: <b className="text-danger">{formatCurrency(order.TongTienPhaiTra)}</b></div>
              <div>Trạng thái hiện tại: <b>{order.TrangThai}</b></div>
            </div>
          </div>
          <div className="col-md-5">
            <div className="border rounded-4 p-3">
              <div className="fw-bold mb-2">Chính sách hoàn tiền</div>
              {policy.canCancel ? (
                <>
                  <div className="alert alert-info mb-2">Bạn đang ở trường hợp: <b>{policy.text}</b></div>
                  <div>Phần trăm hoàn: <b>{Math.round(policy.rate * 100)}%</b></div>
                  <div>Số tiền hoàn dự kiến: <b className="text-success">{formatCurrency(refundAmount)}</b></div>
                </>
              ) : <div className="alert alert-warning mb-0">{policy.text}</div>}
            </div>
          </div>
        </div>
        <hr className="my-4" />
        <form onSubmit={submit}>
          {order.TrangThai !== 'Chờ thanh toán' && (
            <>
              <div className="mb-3">
                <label className="form-label fw-semibold">Lý do huỷ <span className="text-danger">*</span></label>
                <input className="form-control" value={lydo} onChange={(event) => setLydo(event.target.value)} placeholder="VD: Thay đổi kế hoạch..." />
              </div>
              <div className="card mb-4 border-warning">
                <div className="card-header bg-warning bg-opacity-10 fw-bold text-dark">
                  <i className="fa-solid fa-building-columns me-2"></i>Thông tin nhận hoàn tiền
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Ngân hàng <span className="text-danger">*</span></label>
                      <div className="position-relative" ref={bankWrapperRef}>
                        <input 
                          className="form-control" 
                          value={nganHang} 
                          onChange={(event) => {
                            setNganHang(event.target.value)
                            setShowBanks(true)
                            setActiveBankIndex(-1)
                          }} 
                          onFocus={() => setShowBanks(true)}
                          onKeyDown={handleBankKeyDown}
                          placeholder="VD: Vietcombank, MBBank..." 
                          autoComplete="off"
                        />
                        {showBanks && (
                          <div 
                            className="bg-white border rounded shadow-sm position-absolute w-100" 
                            style={{ top: '100%', left: 0, zIndex: 1000, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}
                          >
                            {filteredBanks.length > 0 ? filteredBanks.map((bank, index) => (
                              <div
                                key={bank.bin}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  backgroundColor: index === activeBankIndex ? '#f8f9fa' : 'transparent',
                                  borderBottom: '1px solid #f1f5f9'
                                }}
                                onMouseEnter={() => setActiveBankIndex(index)}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setNganHang(bank.shortName)
                                  setShowBanks(false)
                                }}
                              >
                                <div className="fw-semibold text-primary" style={{ fontSize: '14px' }}>{bank.shortName}</div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>{bank.name}</div>
                              </div>
                            )) : (
                              <div style={{ padding: '8px 12px', color: '#6c757d', fontSize: '14px' }}>Không tìm thấy ngân hàng</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Số tài khoản <span className="text-danger">*</span></label>
                      <input className="form-control" value={soTaiKhoan} onChange={(event) => setSoTaiKhoan(event.target.value)} placeholder="Nhập số tài khoản..." />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Tên chủ tài khoản <span className="text-danger">*</span></label>
                      <input className="form-control" value={tenTaiKhoan} onChange={(event) => setTenTaiKhoan(event.target.value.toUpperCase())} placeholder="VD: NGUYEN VAN A" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="form-check mb-3">
            <input className="form-check-input" type="checkbox" id="agreeCancel" checked={agree} onChange={(event) => setAgree(event.target.checked)} />
            <label className="form-check-label" htmlFor="agreeCancel">Tôi đã đọc và đồng ý với chính sách huỷ/hoàn tiền ở trên.</label>
          </div>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to={`/orders/${id}`}>Quay lại</Link>
            <button className="btn btn-danger" type="submit" disabled={!policy.canCancel || submitting}>
              {submitting ? 'Đang xử lý...' : 'Xác nhận huỷ tour'}
            </button>
          </div>
        </form>
      </div>

      {toast.show && (
        <div className={`toast align-items-center text-white bg-${toast.type} border-0 show fade`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '250px' }}>
          <div className="d-flex">
            <div className="toast-body fw-semibold">
              <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'} me-2`}></i>
              {toast.message}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      )}
    </div>
  )
}
