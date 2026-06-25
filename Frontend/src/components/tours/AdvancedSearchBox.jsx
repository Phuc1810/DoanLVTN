import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tourApi } from '../../api/tourApi'

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
}

export default function AdvancedSearchBox({ initial = {} }) {
  const navigate = useNavigate()
  const locationRef = useRef(null)
  const today = new Date().toISOString().slice(0, 10)
  const [locations, setLocations] = useState([])
  const [showLocations, setShowLocations] = useState(false)
  const [activeLocation, setActiveLocation] = useState(-1)
  const [form, setForm] = useState({
    dia_diem: initial.dia_diem || initial.keyword || initial.q || '',
    ngay_khoi_hanh: initial.ngay_khoi_hanh || '',
    thoi_luong: initial.thoi_luong || '',
    gia: initial.gia || '',
  })

  useEffect(() => {
    tourApi.locations().then(setLocations).catch(() => setLocations([]))
  }, [])

  useEffect(() => {
    function closeLocations(event) {
      if (!locationRef.current?.contains(event.target)) setShowLocations(false)
    }

    document.addEventListener('mousedown', closeLocations)
    return () => document.removeEventListener('mousedown', closeLocations)
  }, [])

  const filteredLocations = useMemo(() => {
    const keyword = normalizeText(form.dia_diem.trim())
    if (!keyword) return locations
    return locations.filter((location) => normalizeText(location).includes(keyword))
  }, [form.dia_diem, locations])

  const canSearch = Object.values(form).some(Boolean)

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    if (event.target.name === 'dia_diem') {
      setShowLocations(true)
      setActiveLocation(-1)
    }
  }

  function selectLocation(location) {
    setForm((current) => ({ ...current, dia_diem: location }))
    setShowLocations(false)
    setActiveLocation(-1)
  }

  function handleLocationKeyDown(event) {
    if (event.key === 'Escape') {
      setShowLocations(false)
      return
    }

    if (!showLocations || filteredLocations.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveLocation((current) => (current + 1) % filteredLocations.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveLocation((current) => (current <= 0 ? filteredLocations.length - 1 : current - 1))
    } else if (event.key === 'Enter' && activeLocation >= 0) {
      event.preventDefault()
      selectLocation(filteredLocations[activeLocation])
    }
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
        <div className="search-item position-relative" ref={locationRef}>
          <label><i className="fa-solid fa-location-dot"></i> Địa điểm</label>
          <input
            type="text"
            name="dia_diem"
            className="search-location-input"
            placeholder="Nhập hoặc chọn địa điểm..."
            value={form.dia_diem}
            onChange={update}
            onFocus={() => setShowLocations(true)}
            onMouseEnter={() => setShowLocations(true)}
            onKeyDown={handleLocationKeyDown}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showLocations}
            aria-controls="location-suggestions"
          />
          {showLocations && (
            <div id="location-suggestions" className="suggest-location-box" role="listbox">
              {filteredLocations.length > 0 ? filteredLocations.map((location, index) => (
                <button
                  type="button"
                  className={`suggest-item${index === activeLocation ? ' active' : ''}`}
                  key={location}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectLocation(location)}
                  role="option"
                  aria-selected={index === activeLocation}
                >
                  {location}
                </button>
              )) : (
                <div className="suggest-empty">Không có địa điểm phù hợp</div>
              )}
            </div>
          )}
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
