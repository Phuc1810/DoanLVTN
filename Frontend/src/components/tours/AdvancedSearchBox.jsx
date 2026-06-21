import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdvancedSearchBox({ initial = {} }) {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    dia_diem: initial.dia_diem || initial.keyword || initial.q || '',
    ngay_khoi_hanh: initial.ngay_khoi_hanh || '',
    thoi_luong: initial.thoi_luong || '',
    gia: initial.gia || '',
  })

  const canSearch = Object.values(form).some(Boolean)

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function submit(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    Object.entries(form).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    navigate(`/search?${params.toString()}`)
  }

  return (
    <section className="advanced-search container mt-5">
      <form className="search-box shadow" onSubmit={submit}>
        <div className="search-item position-relative">
          <label><i className="fa-solid fa-location-dot"></i> Địa điểm</label>
          <input
            type="text"
            name="dia_diem"
            className="search-location-input"
            placeholder="Nhập hoặc chọn địa điểm..."
            value={form.dia_diem}
            onChange={update}
            autoComplete="off"
          />
        </div>

        <div className="search-item">
          <label><i className="fa-solid fa-calendar-days"></i> Ngày khởi hành</label>
          <input type="date" name="ngay_khoi_hanh" min={today} value={form.ngay_khoi_hanh} onChange={update} />
        </div>

        <div className="search-item">
          <label><i className="fa-solid fa-clock"></i> Thời lượng</label>
          <select name="thoi_luong" value={form.thoi_luong} onChange={update}>
            <option value="">-- Chọn thời lượng --</option>
            <option value="1N">1N</option>
            <option value="2N1Đ">2N1Đ</option>
            <option value="3N2Đ">3N2Đ</option>
            <option value="4N3Đ">4N3Đ</option>
          </select>
        </div>

        <div className="search-item">
          <label><i className="fa-solid fa-money-bill"></i> Giá</label>
          <select name="gia" value={form.gia} onChange={update}>
            <option value="">-- Chọn giá --</option>
            <option value="1">Dưới 1 triệu</option>
            <option value="2">1-2 triệu</option>
            <option value="3">2-3 triệu</option>
            <option value="4">Trên 3 triệu</option>
          </select>
        </div>

        <div className="search-btn-box">
          <button type="submit" disabled={!canSearch}>
            <i className="fa-solid fa-magnifying-glass"></i> Tìm kiếm
          </button>
        </div>
      </form>
    </section>
  )
}
