import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PaymentQrBox({ amountText, addInfo, qrUrl, liveStatus = 'pending', expiresAt }) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!expiresAt) return undefined

    const calcTimeLeft = () => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      return Math.max(0, diff)
    }

    setTimeLeft(calcTimeLeft())

    const timer = window.setInterval(() => {
      const remaining = calcTimeLeft()
      setTimeLeft(remaining)
      if (remaining <= 0) window.clearInterval(timer)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [expiresAt])

  const isExpired = liveStatus === 'expired' || (timeLeft !== null && timeLeft <= 0)
  const isPaid = liveStatus === 'paid'
  const isUrgent = timeLeft !== null && timeLeft <= 120 && timeLeft > 0

  return (
    <div className="cardx h-100">
      <div className="qrHead">
        <div>
          <p className="h1">Quét mã VietQR</p>
          <p className="sub">Nội dung CK: <span className="code">{addInfo}</span></p>
        </div>
        <span className="badge-money">{amountText}</span>
      </div>

      <div className="qrBody" style={{ position: 'relative' }}>
        {!isPaid && !isExpired && timeLeft !== null && qrUrl && (
          <div className={`countdown-floating ${isUrgent ? 'urgent' : ''}`}>
            <i className="fa-regular fa-clock me-1"></i>
            {formatTime(timeLeft)}
          </div>
        )}
        {isExpired ? (
          <div className="qr-expired-overlay">
            <div className="qr-expired-icon">
              <i className="fa-solid fa-clock fa-3x"></i>
            </div>
            <div className="qr-expired-title">Đã hết thời gian thanh toán</div>
            <div className="qr-expired-desc">Mã QR này đã hết hạn. Vui lòng tạo đơn hàng mới.</div>
            <Link to="/orders" className="btn btn-outline-primary mt-3">
              <i className="fa-solid fa-arrow-left me-2"></i>Về trang đơn hàng
            </Link>
          </div>
        ) : qrUrl ? (
          <img className="qrImg" src={qrUrl} alt="VietQR" />
        ) : (
          <div className="alert alert-warning mb-0">Backend chưa trả QR thanh toán.</div>
        )}
      </div>

      <div className="qrFoot">
        {!isExpired && (
          <div>Sử dụng App Ngân hàng hoặc Ví điện tử để quét.</div>
        )}
        <div className={`mt-2 fw-bold ${liveStatus === 'pending' && !isExpired ? 'text-primary' : liveStatus === 'paid' ? 'text-success' : 'text-warning'}`}>
          {liveStatus === 'pending' && !isExpired && <><i className="fa-solid fa-spinner fa-spin me-1"></i> Đang chờ nhận tiền...</>}
          {liveStatus === 'paid' && <><i className="fa-solid fa-circle-check me-1"></i> Đã nhận tiền thành công!</>}
          {liveStatus === 'soldout' && <>Đã hết chỗ!</>}
        </div>
      </div>

      <style>{`
        .countdown-floating {
          position: absolute;
          top: 15px;
          left: 0px;
          background: rgba(255, 255, 255, 0.95);
          padding: 6px 12px;
          border-radius: 0 8px 8px 0;
          font-weight: 700;
          font-size: 16px;
          color: #2563eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 10;
          letter-spacing: 1px;
        }
        .countdown-floating.urgent {
          color: #ef4444;
          background: rgba(254, 226, 226, 0.95);
          animation: pulse-icon 1s ease-in-out infinite;
        }
        @keyframes pulse-icon {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .qr-expired-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          min-height: 280px;
        }
        .qr-expired-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          margin-bottom: 16px;
        }
        .qr-expired-title {
          font-size: 18px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 8px;
        }
        .qr-expired-desc {
          font-size: 14px;
          color: #6b7280;
          max-width: 280px;
        }
      `}</style>
    </div>
  )
}
