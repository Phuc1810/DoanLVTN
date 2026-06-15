import { buildImageUrl } from '../../utils/imageUrl'

export const API_TODO_MESSAGE =
  'Backend hiện chưa hỗ trợ API staff tương ứng. Trang đã gắn endpoint đúng và sẽ hoạt động khi backend bổ sung API.'

export function extractList(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.tours)) return payload.tours
  if (Array.isArray(payload.orders)) return payload.orders
  if (Array.isArray(payload.promotions)) return payload.promotions
  if (Array.isArray(payload.news)) return payload.news
  if (Array.isArray(payload.requests)) return payload.requests
  return []
}

export function extractItem(payload) {
  if (!payload) return null
  if (payload.data && !Array.isArray(payload.data)) return payload.data
  if (payload.tour) return payload.tour
  if (payload.order) return payload.order
  if (payload.promotion) return payload.promotion
  if (payload.news) return payload.news
  if (payload.request) return payload.request
  return payload
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

export function firstImageOfTour(tour) {
  return (
    tour?.AnhChinh ||
    tour?.DuongDan ||
    tour?.anh_chinh ||
    tour?.hinh_anh_chinh?.DuongDan ||
    tour?.hinh_anh_chinh?.duong_dan ||
    tour?.hinhAnhTour?.[0]?.DuongDan ||
    tour?.hinhanhtour?.[0]?.DuongDan
  )
}

export function imageSrc(path) {
  return buildImageUrl(path, '/assets/img/no-image.jpg')
}

export function getId(item, keys) {
  return keys.map((key) => item?.[key]).find((value) => value !== undefined && value !== null)
}

export function countPeople(order) {
  return Number(order?.SoLuongNguoiLon || 0) + Number(order?.SoLuongTreEm || 0) + Number(order?.SoLuongTreNho || 0)
}

export function makeMultipart(data, fileFields = []) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value) || typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, value)
    }
  })
  fileFields.forEach(([key, file]) => {
    if (file) formData.append(key, file)
  })
  return formData
}

export function validateImage(file) {
  if (!file) return null
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) return 'Ảnh chỉ hỗ trợ JPG, PNG hoặc WEBP.'
  if (file.size > 5 * 1024 * 1024) return 'Ảnh không được vượt quá 5MB.'
  return null
}

export function normalizeError(error) {
  return {
    message: error?.message || API_TODO_MESSAGE,
    errors: error?.errors || {},
  }
}
