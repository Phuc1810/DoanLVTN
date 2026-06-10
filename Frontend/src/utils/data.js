export function listFrom(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.data)) return payload.data
  return []
}

export function paginationFrom(payload) {
  if (!payload || Array.isArray(payload)) return null
  return payload.pagination || {
    current_page: payload.current_page,
    per_page: payload.per_page,
    total: payload.total,
    last_page: payload.last_page,
  }
}
