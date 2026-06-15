import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { newsApi } from '../../api/newsApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import NewsCard from '../../components/news/NewsCard'
import { listFrom } from '../../utils/data'

export default function NewsPage() {
  const [searchParams] = useSearchParams()
  const loai = searchParams.get('loai') || 'tintuc'
  const title = useMemo(() => (loai === 'kinhnghiem' ? 'KINH NGHIỆM DU LỊCH' : 'TIN TỨC DU LỊCH'), [loai])
  const [state, setState] = useState({ loading: true, error: '', news: [] })

  useEffect(() => {
    newsApi.list({ loai_tin: loai, per_page: 12 })
      .then((payload) => setState({ loading: false, error: '', news: listFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, news: [] }))
  }, [loai])

  return (
    <div className="container blog-list-wrapper">
      <h2 className="fw-bold text-center mb-4 blog-list-title">{title}</h2>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      <div className="row g-4">
        {state.news.map((item) => (
          <div className="col-md-4" key={item.MaTin}>
            <NewsCard news={item} />
          </div>
        ))}
      </div>
    </div>
  )
}
