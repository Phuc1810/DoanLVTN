import { useEffect, useState } from 'react'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import BusinessTourCard from '../../components/tours/BusinessTourCard'
import { listFrom } from '../../utils/data'

export default function BusinessToursPage() {
  const [state, setState] = useState({ loading: true, error: '', tours: [] })

  useEffect(() => {
    tourApi.list({ loai_tour: 'Doanh nghiệp', per_page: 12 })
      .then((payload) => setState({ loading: false, error: '', tours: listFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, tours: [] }))
  }, [])

  return (
    <div className="container wrap">
      <h2 className="page-title">TOUR DOANH NGHIỆP</h2>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <div className="row g-4">
          {state.tours.map((tour) => (
            <div className="col-12 col-md-6 col-lg-4" key={tour.MaTour}>
              <BusinessTourCard tour={tour} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
