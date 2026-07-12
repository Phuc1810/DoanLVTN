const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || 'http://127.0.0.1:8000'

export function buildImageUrl(pathOrUrl, fallback = '/assets/img/no-image.jpg') {
  if (!pathOrUrl) return fallback

  const path = String(pathOrUrl).trim()
  if (/^https?:\/\//i.test(path)) {
    const url = new URL(path)

    // Legacy database paths live in Frontend/public/assets, not Laravel/public.
    if (url.pathname.startsWith('/assets/')) return `${url.pathname}${url.search}`

    return path
  }
  if (path.startsWith('/storage')) return ASSET_BASE_URL + path
  if (path.startsWith('storage/')) return `${ASSET_BASE_URL}/${path}`
  if (path.startsWith('tours/') || path.startsWith('news/') || path.startsWith('promotions/')) return `${ASSET_BASE_URL}/storage/${path}`
  if (path.startsWith('/assets/')) return path
  if (path.startsWith('assets/')) return `/${path}`
  if (path.startsWith('img/')) return `/assets/${path}`

  return `/assets/img/${path.replace(/^\/+/, '')}`
}

export function tourImagePath(tour) {
  return (
    tour?.image_url ||
    tour?.AnhChinh ||
    tour?.anh_chinh?.DuongDan ||
    tour?.anhChinh?.DuongDan ||
    tour?.hinh_anhs?.[0]?.DuongDan ||
    tour?.hinh_anh?.[0]?.DuongDan ||
    tour?.hinhAnhs?.[0]?.DuongDan ||
    tour?.hinhAnh?.[0]?.DuongDan ||
    tour?.images?.[0]?.DuongDan
  )
}

export function newsImagePath(news) {
  return news?.image_url || news?.AnhDaiDien || news?.anh_dai_dien
}

export function promotionImagePath(promotion) {
  return promotion?.image_url || promotion?.AnhDaiDien || promotion?.anh_dai_dien
}
