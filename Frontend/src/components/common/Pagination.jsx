export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || !pagination.last_page || pagination.last_page <= 1) return null

  return (
    <div className="d-flex justify-content-center gap-2 mt-4">
      {Array.from({ length: pagination.last_page }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          className={`btn ${page === pagination.current_page ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
    </div>
  )
}
