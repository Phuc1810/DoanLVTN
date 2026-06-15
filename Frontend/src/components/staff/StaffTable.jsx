export default function StaffTable({ title, action, children }) {
  return (
    <div className="table-card">
      {(title || action) && (
        <div className="table-header">
          {title && <h3 className="table-title">{title}</h3>}
          {action}
        </div>
      )}
      <div className="table-responsive">{children}</div>
    </div>
  )
}
