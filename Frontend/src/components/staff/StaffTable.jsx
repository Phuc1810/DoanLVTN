export default function StaffTable({ title, action, footer, children }) {
  return (
    <div className="table-card" style={{ height: 'fit-content' }}>
      {(title || action) && (
        <div className="table-header">
          {title && <h3 className="table-title">{title}</h3>}
          {action}
        </div>
      )}
      <div className="table-responsive" style={{ flex: 'none' }}>{children}</div>
      {footer && <div className="table-footer pb-3 pt-2">{footer}</div>}
    </div>
  )
}
