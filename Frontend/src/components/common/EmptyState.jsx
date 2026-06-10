export default function EmptyState({ message = 'Không có dữ liệu phù hợp...' }) {
  return <h5 className="text-center text-muted mb-5">{message}</h5>
}
