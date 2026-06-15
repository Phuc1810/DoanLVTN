import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import { formatDate } from '../../utils/formatDate'

function customerFromMe(payload) {
  const data = payload?.data || payload || {}
  return data.khach_hang || data.khachHang || data.customer || data.user?.khach_hang || data.user || data
}

export default function ProfilePage() {
  const [state, setState] = useState({ loading: true, error: '', profile: null })

  useEffect(() => {
    authApi.me()
      .then((payload) => setState({ loading: false, error: '', profile: customerFromMe(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, profile: null }))
  }, [])

  if (state.loading) return <Loading />
  if (state.error) return <ErrorState message={state.error} />

  const p = state.profile || {}

  return (
    <div className="container wrap">
      <div className="cardx p-4 p-lg-5">
        <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start">
          <div>
            <div className="title"><i className="fa-regular fa-id-card me-2"></i>Thông tin cá nhân</div>
            <div className="muted mt-1">Thông tin tài khoản khách hàng của bạn.</div>
          </div>
          <Link className="btn btn-outline-secondary" to="/"><i className="fa-solid fa-house me-1"></i> Trang chủ</Link>
        </div>
        <div className="alert alert-warning mt-3 mb-0">
          Backend hiện chưa có API cập nhật hồ sơ khách hàng công khai, trang này đang hiển thị read-only.
        </div>
        <div className="divider"></div>
        <div className="row g-3">
          {[
            ['Họ tên', p.HoTen || p.name],
            ['Email', p.Email || p.email],
            ['Số điện thoại', p.SoDienThoai || p.phone],
            ['Địa chỉ', p.DiaChi || p.address],
            ['Ngày sinh', formatDate(p.NgaySinh)],
            ['Giới tính', p.GioiTinh],
            ['Tên đăng nhập', p.TenDangNhap],
          ].map(([label, value]) => (
            <div className="col-md-6" key={label}>
              <label className="form-label fw-semibold">{label}</label>
              <input className="form-control" value={value || ''} readOnly />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
