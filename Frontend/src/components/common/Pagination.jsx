import React from 'react'
import { useLocation } from 'react-router-dom'

export default function Pagination({ pagination, onPageChange, itemName = 'mục' }) {
  const location = useLocation()
  const isStaff = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin')

  if (!pagination || !pagination.last_page || pagination.last_page <= 1) return null

  const { current_page, per_page, total, last_page } = pagination
  const from = (current_page - 1) * per_page + 1
  const to = Math.min(current_page * per_page, total)

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = []
    if (last_page <= 5) {
      for (let i = 1; i <= last_page; i++) pages.push(i)
    } else {
      if (current_page <= 3) {
        pages.push(1, 2, 3, '...', last_page)
      } else if (current_page >= last_page - 2) {
        pages.push(1, '...', last_page - 2, last_page - 1, last_page)
      } else {
        pages.push(1, '...', current_page - 1, current_page, current_page + 1, '...', last_page)
      }
    }
    return pages
  }

  return (
    <div className={`d-flex align-items-center ${isStaff ? 'justify-content-between w-100 px-3' : 'justify-content-center mt-4 w-100'}`}>
      {isStaff && (
        <div className="text-muted" style={{ fontSize: '14px' }}>
          Hiển thị {from}-{to} trên {total} {itemName}
        </div>
      )}
      <div className="d-flex gap-2">
        <button
          className={`btn btn-outline-secondary btn-sm ${isStaff ? '' : 'px-3'}`}
          style={isStaff ? { width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
          disabled={current_page === 1}
          onClick={() => onPageChange(current_page - 1)}
        >
          &lt;
        </button>
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <button
              key={`ellipsis-${index}`}
              className={`btn btn-outline-secondary btn-sm ${isStaff ? '' : 'px-3'}`}
              style={isStaff ? { width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
              disabled
            >
              ...
            </button>
          ) : (
            <button
              key={page}
              className={`btn btn-sm ${page === current_page ? (isStaff ? 'btn-primary rounded-circle' : 'btn-primary px-3') : `btn-outline-secondary ${isStaff ? '' : 'px-3'}`}`}
              style={isStaff ? { width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: page === current_page ? '600' : '400' } : {}}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        ))}
        <button
          className={`btn btn-outline-secondary btn-sm ${isStaff ? '' : 'px-3'}`}
          style={isStaff ? { width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}}
          disabled={current_page === last_page}
          onClick={() => onPageChange(current_page + 1)}
        >
          &gt;
        </button>
      </div>
    </div>
  )
}
