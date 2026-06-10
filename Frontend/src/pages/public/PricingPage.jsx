import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import { listFrom } from '../../utils/data'
import { formatCurrency } from '../../utils/formatCurrency'

export default function PricingPage() {
  const [state, setState] = useState({ loading: true, error: '', tours: [] })

  useEffect(() => {
    tourApi.list({ loai_tour: 'Cá nhân', per_page: 100 })
      .then((payload) => setState({ loading: false, error: '', tours: listFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, tours: [] }))
  }, [])

  return (
    <div className="container price-wrapper">
      <div className="price-header text-center mb-4">
        <h2 className="fw-bold price-title mb-1">BẢNG GIÁ TOUR ĐANG HOẠT ĐỘNG</h2>
      </div>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <div className="table-responsive">
          <table className="table price-table align-middle">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>STT</th>
                <th style={{ width: '35%' }}>Tên tour</th>
                <th style={{ width: '20%' }}>Địa điểm</th>
                <th style={{ width: '10%' }}>Thời lượng</th>
                <th style={{ width: '20%' }}>Giá</th>
                <th style={{ width: '10%' }} className="text-center">Xem tour</th>
              </tr>
            </thead>
            <tbody>
              {state.tours.map((tour, index) => (
                <tr className="price-row" key={tour.MaTour}>
                  <td>{index + 1}</td>
                  <td className="tour-name-cell">
                    <div className="tour-name">{tour.TenTour}</div>
                    <div className="tour-sub"><i className="fa-solid fa-location-dot me-1 text-danger"></i>{tour.DiaDiem}</div>
                  </td>
                  <td className="d-none d-md-table-cell">
                    <span className="badge bg-light text-dark border"><i className="fa-solid fa-map-pin me-1 text-primary"></i>{tour.DiaDiem}</span>
                  </td>
                  <td><span className="badge duration-badge"><i className="fa-regular fa-clock me-1"></i>{tour.ThoiLuong}</span></td>
                  <td>
                    <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-1">
                      <span className="price-new">{formatCurrency(tour.GiaGiam)}</span>
                      {Number(tour.discount_percent) > 0 && <span className="price-discount-badge">-{tour.discount_percent}%</span>}
                    </div>
                  </td>
                  <td className="text-center">
                    <Link to={`/tours/${tour.MaTour}`} className="btn btn-view">XEM TOUR</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
