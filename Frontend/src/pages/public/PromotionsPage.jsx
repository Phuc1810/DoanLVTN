import { useEffect, useState } from 'react'
import { promotionApi } from '../../api/promotionApi'
import ErrorState from '../../components/common/ErrorState'
import Loading from '../../components/common/Loading'
import PromotionCard from '../../components/promotions/PromotionCard'
import { listFrom } from '../../utils/data'

export default function PromotionsPage() {
  const [state, setState] = useState({ loading: true, error: '', promotions: [] })

  useEffect(() => {
    promotionApi.list()
      .then((payload) => setState({ loading: false, error: '', promotions: listFrom(payload) }))
      .catch((error) => setState({ loading: false, error: error.message, promotions: [] }))
  }, [])

  return (
    <div className="container km-wrapper">
      <h2 className="fw-bold text-center mb-4 km-title" style={{ color: 'black', fontSize: '33px', marginTop: '10px' }}>CHƯƠNG TRÌNH KHUYẾN MÃI</h2>
      {state.loading && <Loading />}
      {state.error && <ErrorState message={state.error} />}
      <div className="row g-4">
        {!state.loading && !state.error && state.promotions.length === 0 && (
          <h5 className="text-center text-muted mb-5">Hiện chưa có chương trình khuyến mãi nào.</h5>
        )}
        {state.promotions.map((promotion) => (
          <div className="col-md-4" key={promotion.MaCTKM}>
            <PromotionCard promotion={promotion} />
          </div>
        ))}
      </div>
    </div>
  )
}
