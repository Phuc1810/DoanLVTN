export default function FormError({ message, errors }) {
  const fieldMessages = errors
    ? Object.values(errors).flat().filter(Boolean)
    : []

  if (!message && !fieldMessages.length) return null

  return (
    <div className="alert alert-danger mb-3">
      {message && <div>{message}</div>}
      {fieldMessages.length > 0 && (
        <ul className="mb-0 ps-3">
          {fieldMessages.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
