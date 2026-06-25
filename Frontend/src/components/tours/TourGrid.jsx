import EmptyState from '../common/EmptyState'
import TourCard from './TourCard'

export default function TourGrid({ tours }) {
  if (!tours.length) return <EmptyState />

  return (
    <div className="row g-4">
      {tours.map((tour) => (
        <div className="col-md-4" key={tour.MaTour}>
          <TourCard tour={tour} />
        </div>
      ))}
    </div>
  )
}
