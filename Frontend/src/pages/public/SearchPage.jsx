import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import AdvancedSearchBox from '../../components/tours/AdvancedSearchBox'
import TourGrid from '../../components/tours/TourGrid'
import { listFrom } from '../../utils/data'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const params = Object.fromEntries(searchParams.entries())
  const queryString = searchParams.toString()
  const [state, setState] = useState({ loading: true, error: '', tours: [] })

  useEffect(() => {
    tourApi.search(Object.fromEntries(new URLSearchParams(queryString).entries()))
      .then((payload) => setState({ loading: false, error: '', tours: listFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, tours: [] }))
  }, [queryString])

  return (
    <>
      <div className="search-result-wrapper">
        <AdvancedSearchBox initial={params} />
      </div>
      <div className="container pb-5">
        <h2 className="fw-bold text-center mb-4">KẾT QUẢ TÌM KIẾM</h2>
        {state.loading && <Loading />}
        {state.error && <ErrorState message={state.error} />}
        {!state.loading && !state.error && <TourGrid tours={state.tours} />}
      </div>
    </>
  )
}
