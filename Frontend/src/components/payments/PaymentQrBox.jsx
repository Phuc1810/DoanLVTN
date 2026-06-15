import { formatCurrency } from '../../utils/formatCurrency'

export default function PaymentQrBox({ amount, orderId, qrUrl }) {
  const addInfo = `DH${orderId}`

  return (
    <div className="cardx h-100">
      <div className="qrHead">
        <div>
          <p className="h1">Quét mã VietQR</p>
          <p className="sub">Nội dung CK: <span className="code">{addInfo}</span></p>
        </div>
        <span className="badge-money">{formatCurrency(amount)}</span>
      </div>
      <div className="qrBody">
        {qrUrl ? (
          <img className="qrImg" src={qrUrl} alt="VietQR" />
        ) : (
          <div className="alert alert-warning mb-0">Backend chưa trả QR thanh toán.</div>
        )}
      </div>
      <div className="qrFoot">
        <div>Sử dụng App Ngân hàng hoặc Ví điện tử để quét.</div>
        <div className="mt-2 fw-bold text-primary">
          <i className="fa-solid fa-spinner fa-spin me-1"></i> Đang chờ nhận tiền...
        </div>
      </div>
    </div>
  )
}
