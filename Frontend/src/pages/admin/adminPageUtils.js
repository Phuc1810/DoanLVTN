export const ADMIN_API_TODO =
  'Backend hiện chưa hỗ trợ API admin tương ứng. Giao diện đã gắn đúng endpoint và sẽ hoạt động khi backend bổ sung API.'

export function extractAccounts(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.accounts)) return payload.accounts
  return []
}

export function extractPagination(payload) {
  if (!payload || Array.isArray(payload)) return null
  return payload.pagination || {
    current_page: payload.current_page,
    per_page: payload.per_page,
    total: payload.total,
    last_page: payload.last_page,
  }
}

export function extractAccount(payload) {
  if (!payload) return null
  if (payload.data && !Array.isArray(payload.data)) return payload.data
  if (payload.account) return payload.account
  return payload
}

export function normalizeError(error) {
  return {
    message: error?.message || ADMIN_API_TODO,
    errors: error?.errors || {},
  }
}

export function profileText(account) {
  const profile = account?.profile || account?.khach_hang || account?.nhan_vien || account?.admin || {}
  return {
    name: profile.HoTen || account?.HoTen || 'Chưa cập nhật',
    email: profile.Email || account?.Email || '',
    phone: profile.SoDienThoai || profile.SDT || account?.SoDienThoai || account?.SDT || '',
  }
}

export function generatePassword(length = 10) {
  const groups = ['abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '0123456789', '!@#']
  const all = groups.join('')
  const base = groups.map((group) => group[Math.floor(Math.random() * group.length)])
  while (base.length < length) base.push(all[Math.floor(Math.random() * all.length)])
  return base.sort(() => Math.random() - 0.5).join('')
}
