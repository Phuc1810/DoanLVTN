import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { tourApi } from '../../api/tourApi'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import Loading from '../../components/common/Loading'
import TourGrid from '../../components/tours/TourGrid'
import { listFrom } from '../../utils/data'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const params = Object.fromEntries(searchParams.entries())
  const queryString = searchParams.toString()
  const quickKeyword = searchParams.get('keyword')?.trim() || ''
  const isQuickSearch = Boolean(quickKeyword)
  const [state, setState] = useState({ loading: true, error: '', tours: [] })

  useEffect(() => {
    // Luôn cuộn lên đầu trang mỗi khi tìm kiếm
    window.scrollTo(0, 0)

    const raw = Object.fromEntries(new URLSearchParams(queryString).entries())
    const mapped = {
      ...raw,
      keyword: raw.keyword || raw.dia_diem || raw.q || '',
    }

    tourApi.search(mapped)
      .then((payload) => setState({ loading: false, error: '', tours: listFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, tours: [] }))
  }, [queryString])

  return (
    <>
      <div className={`container search-results-area pb-5 search-result-wrapper`}>
        <h2 className="fw-bold text-center mb-4">
          {isQuickSearch ? `Kết quả tìm kiếm: "${quickKeyword}"` : 'KẾT QUẢ TÌM KIẾM'}
        </h2>
        {state.loading && <Loading />}
        {state.error && <ErrorState message={state.error} />}
        {!state.loading && !state.error && (
          state.tours.length > 0
            ? <TourGrid tours={state.tours} />
            : <EmptyState message="Không có tour phù hợp" />
        )}
      </div>
    </>
  )
}
