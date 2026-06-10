import { useEffect, useState } from 'react'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import TourGrid from '../../components/tours/TourGrid'
import { listFrom } from '../../utils/data'

export default function BusinessToursPage() {
  const [state, setState] = useState({ loading: true, error: '', tours: [] })

  useEffect(() => {
    tourApi.list({ loai_tour: 'Doanh nghiệp', per_page: 12 })
      .then((payload) => setState({ loading: false, error: '', tours: listFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, tours: [] }))
  }, [])

  return (
    <div className="container business-tour-wrapper">
      <h2 className="fw-bold text-center mb-4">TOUR DOANH NGHIỆP</h2>
      <p className="text-center text-muted mb-4">Các chương trình tour dành cho công ty, đoàn thể và khách hàng doanh nghiệp.</p>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && <TourGrid tours={state.tours} />}
    </div>
  )
}
