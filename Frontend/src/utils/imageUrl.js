const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || 'http://127.0.0.1:8000'

export function buildImageUrl(pathOrUrl, fallback = '/assets/img/no-image.jpg') {
  if (!pathOrUrl) return fallback

  const path = String(pathOrUrl).trim()
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/storage')) return ASSET_BASE_URL + path
  if (path.startsWith('storage/')) return `${ASSET_BASE_URL}/${path}`
  if (path.startsWith('/assets/')) return path
  if (path.startsWith('assets/')) return `/${path}`
  if (path.startsWith('img/')) return `/assets/${path}`

  return `/assets/img/${path.replace(/^\/+/, '')}`
}
