import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import BusinessTourCard from '../../components/tours/BusinessTourCard'
import { listFrom, paginationFrom } from '../../utils/data'

export default function BusinessToursPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState({ loading: true, error: '', tours: [], pagination: null })

  useEffect(() => {
    window.scrollTo(0, 0)
    tourApi.list({ loai_tour: 'Doanh nghiệp', page: searchParams.get('page') || 1, per_page: 9 })
      .then((payload) => setState({ loading: false, error: '', tours: listFrom(payload), pagination: paginationFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, tours: [], pagination: null }))
  }, [searchParams])

  return (
    <div className="container wrap">
      <h2 className="page-title">TOUR DOANH NGHIỆP</h2>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && (
        <>
          <div className="row g-4 mb-5">
            {state.tours.map((tour) => (
              <div className="col-12 col-md-6 col-lg-4" key={tour.MaTour}>
                <BusinessTourCard tour={tour} />
              </div>
            ))}
          </div>
          <Pagination pagination={state.pagination} onPageChange={(page) => setSearchParams({ page })} />
        </>
      )}
    </div>
  )
}
