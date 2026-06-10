import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import TourGrid from '../../components/tours/TourGrid'
import { listFrom, paginationFrom } from '../../utils/data'

export default function ToursPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState({ loading: true, error: '', tours: [], pagination: null })

  useEffect(() => {
    tourApi.list({ page: searchParams.get('page') || 1, per_page: 9 })
      .then((payload) => setState({ loading: false, error: '', tours: listFrom(payload), pagination: paginationFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, tours: [], pagination: null }))
  }, [searchParams])

  return (
    <div className="container search-result-wrapper">
      <h2 className="fw-bold text-center mb-4">TẤT CẢ TOUR</h2>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && <TourGrid tours={state.tours} />}
      <Pagination pagination={state.pagination} onPageChange={(page) => setSearchParams({ page })} />
    </div>
  )
}
