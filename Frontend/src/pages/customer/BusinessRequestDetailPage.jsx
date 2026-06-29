import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { businessRequestApi } from '../../api/businessRequestApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDate } from '../../utils/formatDate'
import { buildImageUrl } from '../../utils/imageUrl'

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `${amount.toLocaleString('vi-VN')} VNĐ`
}

export default function BusinessRequestDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const [state, setState] = useState({ loading: true, error: '', request: null })
  const [toastMessage, setToastMessage] = useState(location.state?.successToast || '')

  useEffect(() => {
    businessRequestApi.getBusinessRequest(id)
      .then((request) => setState({ loading: false, error: '', request }))
      .catch((error) => setState({ loading: false, error: error.message, request: null }))
  }, [id])

  useEffect(() => {
    if (!toastMessage) return undefined

    const timer = window.setTimeout(() => {
      setToastMessage('')
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const pricing = useMemo(() => {
    const item = state.request || {}
    const giaGoc = Number(item.GiaGoc || 0)
    const giaGiam = Number(item.GiaGiam || 0)
    let phanTramGiam = Number(item.PhanTramGiam || 0)

    const hasSale = (giaGoc > 0 && giaGiam > 0 && giaGiam < giaGoc) || phanTramGiam > 0
    if (phanTramGiam <= 0 && hasSale && giaGoc > 0 && giaGiam > 0) {
      phanTramGiam = Math.round(100 - (giaGiam / giaGoc) * 100)
    }

    return {
      hasSale,
      giaGoc,
      giaGiam,
      phanTramGiam,
      displayPrice: hasSale ? giaGiam : giaGoc,
    }
  }, [state.request])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />
  if (!state.request) return <ErrorState message="Không tìm thấy yêu cầu." />

  const item = state.request

  return (
    <div className="container wrap">
      {toastMessage && (
        <div className="customer-toast customer-toast-success" role="status" aria-live="polite">
          <i className="fa-solid fa-circle-check me-2"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="cardx p-4 p-lg-5">
        <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start">
          <div>
            <div className="title"><i className="fa-solid fa-clipboard-list me-2"></i>Chi tiết yêu cầu</div>
            <div className="muted mt-1">
              Mã yêu cầu: <b>#{item.MaYC}</b> • <StatusBadge status={item.TrangThai} />
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link className="btn btn-outline-secondary" to="/business-requests">
              <i className="fa-solid fa-arrow-left me-1"></i> Danh sách yêu cầu
            </Link>
            <Link className="btn btn-outline-secondary" to="/">
              <i className="fa-solid fa-house me-1"></i> Trang chủ
            </Link>
          </div>
        </div>

        <div className="divider"></div>

        <div className="business-request-tour-mini">
          {item.image_url || item.AnhChinh ? (
            <img src={buildImageUrl(item.image_url || item.AnhChinh)} alt={item.TenTour || ''} />
          ) : (
            <div className="business-request-tour-thumb"></div>
          )}

          <div className="flex-grow-1">
            <div className="business-request-tour-title">
              {item.TenTour || 'Tour doanh nghiệp'}
            </div>

            <div className="muted business-request-tour-meta">
              {item.DiaDiem && (
                <>
                  <i className="fa-solid fa-location-dot me-1 business-request-dot"></i>{item.DiaDiem}
                </>
              )}
              {item.ThoiLuong && (
                <>
                  <span className="mx-2">•</span>
                  <i className="fa-regular fa-clock me-1 business-request-clock"></i>{item.ThoiLuong}
                </>
              )}
            </div>

            <div className="mt-2">
              <span className="fw-bold text-danger">
                {pricing.displayPrice > 0 ? formatMoney(pricing.displayPrice) : '—'}
              </span>

              {pricing.hasSale && (
                <>
                  <span className="text-muted text-decoration-line-through ms-2">
                    {pricing.giaGoc > 0 ? formatMoney(pricing.giaGoc) : ''}
                  </span>
                  {pricing.phanTramGiam > 0 && (
                    <span className="badge text-bg-warning ms-2">-{pricing.phanTramGiam}%</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="divider"></div>

        <div className="business-request-kv">
          <div className="business-request-k">Tên công ty</div>
          <div className="business-request-v">{item.TenCongTy || '—'}</div>

          <div className="business-request-k">Người liên hệ</div>
          <div className="business-request-v">{item.NguoiLienHe || '—'}</div>

          <div className="business-request-k">Số điện thoại liên hệ</div>
          <div className="business-request-v">{item.SDT || '—'}</div>

          <div className="business-request-k">Số người</div>
          <div className="business-request-v">{Number(item.SoNguoi || 0)}</div>

          <div className="business-request-k">Thời gian khởi hành</div>
          <div className="business-request-v">{formatDate(item.ThoiGianKhoiHanh) || '—'}</div>

          <div className="business-request-k">Giá trị hợp đồng</div>
          <div className="business-request-v">{formatMoney(item.GiaTriHopDong)}</div>

          <div className="business-request-k">Ngày thanh toán</div>
          <div className="business-request-v">{formatDate(item.NgayThanhToan) || '—'}</div>

          <div className="business-request-k">Trạng thái</div>
          <div className="business-request-v">{item.TrangThai || '—'}</div>

          <div className="business-request-k">Mã tour</div>
          <div className="business-request-v">{item.MaTour || '—'}</div>

          <div className="business-request-k">Mã nhân viên phụ trách</div>
          <div className="business-request-v">{item.MaNV || '—'}</div>
        </div>

        <div className="divider"></div>

        <div className="muted small">
          Nếu trạng thái là <b>Chờ xử lý</b> / <b>Đang xử lý</b> thì nhân viên sẽ liên hệ để chốt chi tiết (giá, lịch trình, hợp đồng...).
        </div>
      </div>
    </div>
  )
}
