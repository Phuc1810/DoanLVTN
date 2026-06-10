import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import Pagination from '../../components/common/Pagination'
import TourGrid from '../../components/tours/TourGrid'
import { listFrom, paginationFrom } from '../../utils/data'

const titles = { bac: 'TOUR MIỀN BẮC', trung: 'TOUR MIỀN TRUNG', nam: 'TOUR MIỀN NAM' }

export default function RegionToursPage() {
  const { mien } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [state, setState] = useState({ loading: true, error: '', tours: [], pagination: null })
  const title = useMemo(() => titles[mien] || `TOUR MIỀN ${String(mien || '').toUpperCase()}`, [mien])

  useEffect(() => {
    tourApi.region(mien, { page: searchParams.get('page') || 1, per_page: 9 })
      .then((payload) => setState({ loading: false, error: '', tours: listFrom(payload), pagination: paginationFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, tours: [], pagination: null }))
  }, [mien, searchParams])

  return (
    <div className="container search-result-wrapper">
      <h2 className="fw-bold text-center mb-4">{title}</h2>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      {!state.loading && !state.error && <TourGrid tours={state.tours} />}
      <Pagination pagination={state.pagination} onPageChange={(page) => setSearchParams({ page })} />
    </div>
  )
}
