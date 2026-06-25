export function roleRedirect(user, fallback = '/') {
  if (user?.VaiTro === 'NV') return '/staff'
  if (user?.VaiTro === 'AD') return '/admin'
  if (user?.VaiTro === 'KH') return fallback || '/'
  return fallback || '/'
}
