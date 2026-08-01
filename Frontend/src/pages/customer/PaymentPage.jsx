import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { paymentApi } from '../../api/paymentApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import PaymentQrBox from '../../components/payments/PaymentQrBox'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl } from '../../utils/imageUrl'

function formatMoney(value, suffix = 'VNĐ') {
  const amount = Number(value || 0)
  return `${amount.toLocaleString('vi-VN')} ${suffix}`
}

export default function PaymentPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: '', payment: null, liveStatus: 'pending' })

  useEffect(() => {
    paymentApi.getPayment(orderId)
      .then((payload) => {
        const paymentStatus = payload?.payment_status || 'pending'
        setState({ loading: false, error: '', payment: payload, liveStatus: paymentStatus })

        if (paymentStatus === 'paid' || paymentStatus === 'soldout') {
          navigate(`/booking-success/${orderId}`, { replace: true })
        }
      })
      .catch((error) => setState({ loading: false, error: error.message, payment: null, liveStatus: 'error' }))
  }, [navigate, orderId])

  useEffect(() => {
    if (!state.payment || state.liveStatus === 'expired') return undefined

    const timer = window.setInterval(() => {
      // Kiểm tra hết hạn ở phía frontend trước
      const expiresAt = state.payment?.payment_expires_at
      if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
        setState((current) => ({ ...current, liveStatus: 'expired' }))
        window.clearInterval(timer)
        return
      }

      paymentApi.checkPayment(orderId)
        .then((payload) => {
          const status = payload?.status || payload?.payment_status || payload?.TrangThai || 'pending'
          if (status === 'paid' || status === 'soldout') {
            setState((current) => ({ ...current, liveStatus: status }))
            window.clearInterval(timer)
            window.setTimeout(() => {
              navigate(`/booking-success/${orderId}`)
            }, status === 'paid' ? 1500 : 300)
          } else if (status === 'expired') {
            setState((current) => ({ ...current, liveStatus: 'expired' }))
            window.clearInterval(timer)
          }
        })
        .catch(() => {})
    }, 2000)

    return () => window.clearInterval(timer)
  }, [navigate, orderId, state.payment, state.liveStatus])

  const data = state.payment || {}
  const order = data.order || {}
  const tour = data.tour || {}
  const customer = data.customer || {}
  const discount = data.discount || {}
  const payment = data.payment || {}

  const totalGoc = Number(order.TongTienGoc || 0)
  const tongPhaiTra = Number(order.TongTienPhaiTra || payment.amount || 0)
  const discountAmount = Number(discount.discount_amount || Math.max(0, totalGoc - tongPhaiTra))
  const percent = Number(discount.percent || 0)
  const hasDiscount = percent > 0 && discountAmount > 0

  const lineItems = useMemo(() => ([
    { label: 'Người lớn', qty: Number(order.SoLuongNguoiLon || 0), icon: 'fa-user' },
    { label: 'Trẻ em', qty: Number(order.SoLuongTreEm || 0), icon: 'fa-child' },
    { label: 'Trẻ nhỏ', qty: Number(order.SoLuongTreNho || 0), icon: 'fa-baby' },
  ]).filter((item) => item.qty > 0), [order.SoLuongNguoiLon, order.SoLuongTreEm, order.SoLuongTreNho])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  return (
    <div className="container page shell">
      <div className="cardx payment-hero mb-4">
        <div className="d-flex gap-3 align-items-center">
          {tour.image_url || tour.AnhChinh ? (
            <img className="payment-thumb" src={buildImageUrl(tour.image_url || tour.AnhChinh)} alt={tour.TenTour || ''} />
          ) : (
            <div className="payment-thumb"></div>
          )}

          <div className="flex-grow-1">
            <div className="payment-title">{tour.TenTour || `Thanh toán đơn #${orderId}`}</div>
            <div className="payment-meta mt-2">
              <i className="fa-solid fa-receipt me-1"></i>Đơn hàng: <span className="text-dark fw-bold">#{orderId}</span>
              &nbsp; • &nbsp;
              <i className="fa-regular fa-calendar-days me-1"></i>
              {formatDate(tour.NgayKhoiHanh) || 'Đang cập nhật'}
            </div>
          </div>

          <span className={`payment-pill d-none d-md-inline-flex ${state.liveStatus === 'expired' ? 'payment-pill-expired' : ''}`}>
            <span className="payment-dot"></span>
            {state.liveStatus === 'expired' ? 'Hết hạn thanh toán' : 'Đang chờ thanh toán'}
          </span>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <PaymentQrBox
            amountText={formatMoney(tongPhaiTra, 'đ')}
            addInfo={payment.add_info || `DH${orderId}`}
            qrUrl={payment.qr_url}
            liveStatus={state.liveStatus}
            expiresAt={data.payment_expires_at}
          />
        </div>

        <div className="col-lg-6">
          <div className="cardx h-100">
            <div className="payment-summary-body">
              <div className="payment-rowline">
                <div className="payment-label">Khách hàng</div>
                <div className="payment-val text-truncate" style={{ maxWidth: '200px' }}>{customer.HoTen || 'Khách'}</div>
              </div>

              <div className="payment-divider"></div>

              {lineItems.map((item) => (
                <div className="payment-rowline mb-2" key={item.label}>
                  <div className="payment-label text-dark">
                    <i className={`fa-solid ${item.icon} me-2 payment-muted-icon`}></i>{item.label}
                  </div>
                  <div className="payment-val">
                    {item.qty} <span className="payment-qty-unit">vé</span>
                  </div>
                </div>
              ))}

              <div className="payment-divider"></div>

              <div className="payment-rowline">
                <div className="payment-label">Tổng tiền gốc</div>
                <div className="payment-money">{formatMoney(totalGoc, 'đ')}</div>
              </div>

              {hasDiscount && (
                <>
                  <div className="payment-rowline mt-3">
                    <div className="payment-label text-success">
                      <i className="fa-solid fa-tag me-1"></i>
                      Ưu đãi (Giảm {Math.round(percent)}%)
                    </div>
                    <div className="payment-money payment-neg">-{formatMoney(discountAmount, 'đ')}</div>
                  </div>
                  {discount.type === 'CTKM' && discount.name && (
                    <div className="text-end mt-1 payment-discount-note">
                      {discount.name}
                    </div>
                  )}
                </>
              )}

              <div className="mt-4">
                <div className="payment-total-box">
                  <div className="payment-total-label">Thanh toán</div>
                  <div className="text-end">
                    <div className="payment-total">{Number(tongPhaiTra || 0).toLocaleString('vi-VN')}</div>
                    <div className="payment-vnd">VND</div>
                  </div>
                </div>
              </div>

              <div className="alert alert-warning mt-4 mb-0" style={{ fontSize: '14px', borderRadius: '8px' }}>
                <div className="fw-bold mb-2 text-dark">
                  <i className="fa-solid fa-triangle-exclamation me-2 text-warning"></i>Lưu ý quan trọng
                </div>
                <ul className="mb-0 ps-3" style={{ color: '#555', lineHeight: '1.6' }}>
                  <li>
                    Bạn có <b className="text-danger">15 phút</b> để hoàn tất thanh toán. Quá thời gian này, hệ thống sẽ tự động hủy đơn và nhường vé cho khách khác.
                  </li>
                  <li>
                    Vé sẽ được kích hoạt tự động ngay khi hệ thống nhận được tiền (thường chỉ mất từ 10 - 30 giây).
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
