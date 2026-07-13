import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { staffNewsApi } from '../../api/staffNewsApi'
import FormError from '../../components/common/FormError'
import Loading from '../../components/common/Loading'
import { extractItem, imageSrc, makeMultipart, normalizeError, validateImage } from './staffPageUtils'
import { getToken } from '../../utils/tokenStorage'

import { CKEditor } from '@ckeditor/ckeditor5-react'
import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Font,
  Paragraph,
  SimpleUploadAdapter,
  Image,
  ImageUpload,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize
} from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'

const EMPTY = { TieuDe: '', MoTa: '', NoiDung: '', LoaiTin: 'tintuc', TrangThai: 'Hiển thị' }

export default function StaffNewsFormPage({ mode }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage('')
    }, 5000)
  }

  useEffect(() => {
    if (!isEdit) return
    staffNewsApi.show(id)
      .then((payload) => {
        const item = extractItem(payload)
        setForm({ ...EMPTY, ...item })
        setPreview(imageSrc(item?.AnhDaiDien))
      })
      .catch((err) => setError(normalizeError(err)))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function chooseFile(event) {
    const selected = event.target.files?.[0] || null
    if (selected) {
      const validation = validateImage(selected)
      if (validation) return setError({ message: validation })
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  const [showConfirmModal, setShowConfirmModal] = useState(false)

  function handleFormSubmit(event) {
    event.preventDefault()
    
    // Custom Validation
    const isTieuDeEmpty = !form.TieuDe || form.TieuDe.trim() === ''
    const isMoTaEmpty = !form.MoTa || form.MoTa.trim() === ''
    const isNoiDungEmpty = !form.NoiDung || form.NoiDung.trim() === ''
    const isAnhEmpty = !isEdit && !preview && !file

    if (isTieuDeEmpty && isMoTaEmpty && isNoiDungEmpty && isAnhEmpty) {
      showToast('Vui lòng nhập đầy đủ thông tin')
      return
    }

    if (isTieuDeEmpty) {
      showToast('Vui lòng nhập Tiêu đề')
      return
    }
    if (isMoTaEmpty) {
      showToast('Vui lòng nhập Mô tả ngắn')
      return
    }
    if (isNoiDungEmpty) {
      showToast('Vui lòng nhập Nội dung chi tiết')
      return
    }
    if (isAnhEmpty) {
      showToast('Vui lòng chọn Ảnh đại diện')
      return
    }

    setShowConfirmModal(true)
  }

  async function confirmSubmit() {
    setShowConfirmModal(false)
    setSubmitting(true)
    setError(null)
    try {
      // Remove AnhDaiDien string from form so it doesn't conflict with file upload
      const { AnhDaiDien, ...restForm } = form
      const payload = makeMultipart({ ...restForm, ...(isEdit ? { _method: 'PUT' } : {}) }, [['AnhDaiDien', file]])
      
      if (isEdit) {
        await staffNewsApi.update(id, payload)
        showToast('Cập nhật bài viết thành công')
        
        // Refetch fresh data
        const res = await staffNewsApi.show(id)
        const item = extractItem(res)
        setForm({ ...EMPTY, ...item })
        setPreview(imageSrc(item?.AnhDaiDien))
        setFile(null)
        
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        await staffNewsApi.create(payload)
        navigate('/staff/news', { state: { toastMessage: 'Tạo bài viết thành công' } })
      }
    } catch (err) {
      setError(normalizeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  const uploadUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api') + '/staff/news/upload-editor-image'
  const token = getToken()

  return (
    <>
      {toastMessage && (
        <div 
          className={`toast align-items-center text-white border-0 show fade ${toastMessage.includes('Vui lòng') ? 'bg-danger' : 'bg-success'}`} 
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true"
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '250px' }}
        >
          <div className="d-flex">
            <div className="toast-body fw-semibold">
              <i className={`fa-solid ${toastMessage.includes('Vui lòng') ? 'fa-circle-exclamation' : 'fa-circle-check'} me-2`}></i>
              {toastMessage}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMessage('')} aria-label="Close"></button>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="page-title">{isEdit ? 'Sửa bài viết' : 'Thêm bài viết'}</h1>
          <div className="text-muted">Tạo mới tin tức hoặc bài viết chia sẻ kinh nghiệm</div>
        </div>
        <Link className="btn btn-outline-secondary" to="/staff/news">
          <i className="fa-solid fa-arrow-left me-1"></i> Quay lại danh sách
        </Link>
      </div>

      <FormError message={error?.message} errors={error?.errors} />

      <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: '#fff' }}>
        <form onSubmit={handleFormSubmit} className="row g-3" noValidate>
          <div className="col-md-8">
            <label className="form-label fw-bold">Tiêu đề <span className="text-danger">*</span></label>
            <input className="form-control" name="TieuDe" value={form.TieuDe || ''} onChange={updateField} />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-bold">Loại tin</label>
            <select className="form-select" name="LoaiTin" value={form.LoaiTin || 'tintuc'} onChange={updateField}>
              <option value="tintuc">Tin tức</option>
              <option value="kinhnghiem">Kinh nghiệm</option>
            </select>
          </div>

          <div className="col-12">
            <label className="form-label fw-bold">Mô tả ngắn <span className="text-danger">*</span></label>
            <textarea className="form-control" name="MoTa" rows="3" value={form.MoTa || ''} onChange={updateField}></textarea>
            <div className="form-text">Hiển thị tóm tắt trên danh sách tin tức.</div>
          </div>

          <div className="col-12" style={{ color: '#000' }}>
            <label className="form-label fw-bold">Nội dung chi tiết <span className="text-danger">*</span></label>
            <CKEditor
              editor={ClassicEditor}
              config={{
                licenseKey: 'GPL',
                plugins: [Essentials, Bold, Italic, Font, Paragraph, SimpleUploadAdapter, Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize],
                toolbar: [
                  'undo', 'redo', '|', 'bold', 'italic', 'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|', 'imageUpload'
                ],
                simpleUpload: {
                  uploadUrl,
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              }}
              data={form.NoiDung || ''}
              onChange={(event, editor) => {
                const data = editor.getData()
                setForm(c => ({ ...c, NoiDung: data }))
              }}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Ảnh đại diện {isEdit ? '' : <span className="text-danger">*</span>}</label>
            <input type="file" className="form-control" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} />
            {preview && (
              <div className="mt-3">
                <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }} />
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Trạng thái</label>
            <select className="form-select" name="TrangThai" value={form.TrangThai || 'Hiển thị'} onChange={updateField}>
              <option value="Hiển thị">Hiển thị</option>
              <option value="Ẩn">Ẩn</option>
            </select>
          </div>

          <div className="col-12 d-flex justify-content-end gap-2 pt-3 border-top mt-3">
            <Link to="/staff/news" className="btn btn-light border px-4">Hủy bỏ</Link>
            <button className="btn btn-primary px-4 fw-bold" type="submit" disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-1"></i> {submitting ? 'Đang lưu...' : 'Lưu bài viết'}
            </button>
          </div>
        </form>
      </div>

      {showConfirmModal && (
        <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}></div>
      )}
      {showConfirmModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div className="modal-body text-center p-4">
                <div className="mb-3">
                  <i className="fa-solid fa-circle-question text-primary" style={{ fontSize: '50px', opacity: 0.8 }}></i>
                </div>
                <h5 className="mb-4 text-dark fw-bold" style={{ lineHeight: '1.5' }}>
                  Bạn có muốn lưu bài viết này không?
                </h5>
                <div className="d-flex justify-content-center gap-3">
                  <button type="button" className="btn btn-outline-secondary px-4 rounded-pill" onClick={() => setShowConfirmModal(false)}>Hủy</button>
                  <button type="button" className="btn btn-primary px-4 rounded-pill" onClick={confirmSubmit}>Đồng ý</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
