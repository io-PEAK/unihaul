import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

// ─── Data maps ────────────────────────────────────────────────────────────────
const categories = [
  'Books & Notes', 'Electronics', 'Food & Drinks', 'Clothing',
  'Furniture', 'Sports & Fitness', 'Stationery', 'Appliances',
  'Games & Hobbies', 'Services', 'Other',
]

const subcategoryMap = {
  'Clothing':         ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Books & Notes':    ['1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'],
  'Electronics':      ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Camera', 'Accessories', 'Other'],
  'Furniture':        ['Chair', 'Table', 'Bed', 'Shelf', 'Sofa', 'Other'],
  'Sports & Fitness': ['Cricket', 'Football', 'Basketball', 'Gym Equipment', 'Badminton', 'Cycling', 'Other'],
  'Stationery':       ['Notes', 'Textbook', 'Novel', 'Art Supplies', 'Geometry Box', 'Other'],
  'Appliances':       ['Fan', 'Fridge', 'Microwave', 'Washing Machine', 'AC', 'Heater', 'Other'],
  'Games & Hobbies':  ['Board Game', 'Video Game', 'Puzzle', 'Instrument', 'Collectible', 'Other'],
  'Services':         ['Tutoring', 'Repair', 'Design', 'Photography', 'Other'],
  'Food & Drinks':    ['Homemade', 'Packaged', 'Beverages', 'Snacks', 'Other'],
}

const subcategoryLabel = {
  'Clothing': 'Size', 'Books & Notes': 'Semester',
  'Electronics': 'Type', 'Furniture': 'Type', 'Sports & Fitness': 'Sport',
}

const specFieldsMap = {
  'Electronics': [
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Dell, Apple' },
    { key: 'ram', label: 'RAM', placeholder: 'e.g. 8GB, 16GB' },
    { key: 'storage', label: 'Storage', placeholder: 'e.g. 256GB, 1TB' },
    { key: 'processor', label: 'Processor', placeholder: 'e.g. Intel i5, M2' },
    { key: 'display', label: 'Display', placeholder: 'e.g. 15.6", 4K' },
  ],
  'Clothing': [
    { key: 'gender', label: 'Gender', placeholder: 'Male / Female / Unisex' },
    { key: 'color', label: 'Color', placeholder: 'e.g. Black, White' },
    { key: 'type', label: 'Type', placeholder: 'e.g. T-shirt, Jeans' },
  ],
  'Books & Notes': [
    { key: 'subject', label: 'Subject', placeholder: 'e.g. Physics, Maths' },
    { key: 'author', label: 'Author', placeholder: 'e.g. H.C. Verma' },
    { key: 'edition', label: 'Edition', placeholder: 'e.g. 3rd, 2023' },
  ],
  'Furniture': [
    { key: 'material', label: 'Material', placeholder: 'e.g. Wood, Metal' },
    { key: 'color', label: 'Color', placeholder: 'e.g. Brown, White' },
    { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 120×60 cm' },
  ],
  'Sports & Fitness': [
    { key: 'sport', label: 'Sport', placeholder: 'e.g. Cricket, Football' },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Nike, Adidas' },
    { key: 'size', label: 'Size', placeholder: 'e.g. Size 7, XL' },
  ],
  'Stationery': [
    { key: 'type', label: 'Type', placeholder: 'e.g. Notebook, Pen set' },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Classmate, Natraj' },
  ],
  'Appliances': [
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Samsung, LG' },
    { key: 'capacity', label: 'Capacity', placeholder: 'e.g. 5kg, 200L' },
    { key: 'color', label: 'Color', placeholder: 'e.g. White, Silver' },
  ],
  'Games & Hobbies': [
    { key: 'platform', label: 'Platform', placeholder: 'e.g. PS5, PC, Mobile' },
    { key: 'type', label: 'Type', placeholder: 'e.g. Strategy, Action' },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Sony, Nintendo' },
  ],
  'Services': [
    { key: 'mode', label: 'Mode', placeholder: 'Online / Offline / Both' },
    { key: 'experience', label: 'Experience', placeholder: 'e.g. 2 years' },
  ],
  'Food & Drinks': [
    { key: 'type', label: 'Type', placeholder: 'e.g. Snack, Meal' },
    { key: 'ingredients', label: 'Ingredients', placeholder: 'Main ingredients' },
    { key: 'allergens', label: 'Allergens', placeholder: 'e.g. Nuts, Gluten' },
  ],
}

const statusOptions = ['available', 'pending', 'sold']
const statusMeta = {
  available: { label: 'Available', color: '#51cf66' },
  pending:   { label: 'Pending',   color: '#ffd43b' },
  sold:      { label: 'Sold',      color: '#ff6b6b' },
}

const sortOptions = [
  { value: '', label: 'Newest' },
  { value: 'desc', label: '↑ Price' },
  { value: 'asc', label: '↓ Price' },
]

const emptyFilters = {
  category: '', subcategory: '', sortPrice: '',
  statuses: ['available'], specs: {},
}

const FilterIcon = ({ size = 15, color = 'currentColor', strokeWidth = 2.2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="10" y1="18" x2="14" y2="18" />
  </svg>
)

function FilterChip({ label, onRemove }) {
  const [h, setH] = useState(false)
  return (
    <button
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={onRemove}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.28rem 0.7rem',
        background: h ? 'rgba(232,119,34,0.2)' : 'rgba(232,119,34,0.1)',
        border: `1px solid ${h ? 'rgba(232,119,34,0.55)' : 'rgba(232,119,34,0.28)'}`,
        borderRadius: '20px', cursor: 'pointer',
        transition: 'all 0.18s ease',
        animation: 'chipIn 0.22s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}
    >
      <span style={{ fontSize: '0.73rem', fontWeight: '600', color: h ? '#f5a623' : 'rgba(232,119,34,0.85)' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: h ? '#f5a623' : 'rgba(232,119,34,0.5)', lineHeight: 1, marginTop: '-1px' }}>×</span>
    </button>
  )
}

function ItemCard({ item }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const status = item.status?.toLowerCase()
  const specs = item.specs && typeof item.specs === 'object' ? Object.entries(item.specs).slice(0, 2) : []

  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/items/${item.id}`)}
      style={{
        background: hovered
          ? 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? '1px solid rgba(232,119,34,0.4)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px', padding: '1.75rem', cursor: 'pointer',
        transform: hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: hovered ? '0 25px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)' : '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <span style={{ fontSize: '0.62rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontWeight: '700', whiteSpace: 'nowrap' }}>{item.category}</span>
          {item.subcategory && <>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>›</span>
            <span style={{ fontSize: '0.58rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(232,119,34,0.5)', fontWeight: '700', whiteSpace: 'nowrap' }}>{item.subcategory}</span>
          </>}
        </div>
        <span style={{
          fontSize: '0.68rem', fontWeight: '700', flexShrink: 0, marginLeft: '0.5rem',
          color: status === 'sold' ? '#ff6b6b' : status === 'pending' ? '#ffd43b' : '#51cf66',
          background: status === 'sold' ? 'rgba(255,107,107,0.1)' : status === 'pending' ? 'rgba(255,212,59,0.1)' : 'rgba(81,207,102,0.1)',
          padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize',
          border: status === 'sold' ? '1px solid rgba(255,107,107,0.15)' : status === 'pending' ? '1px solid rgba(255,212,59,0.15)' : '1px solid rgba(81,207,102,0.15)',
        }}>{status}</span>
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'rgba(255,255,255,0.95)', marginBottom: specs.length ? '0.6rem' : '0.4rem', lineHeight: '1.35', letterSpacing: '-0.3px' }}>{item.title}</h3>
      {specs.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {specs.map(([, v]) => (
            <span key={v} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', fontWeight: '600' }}>{v}</span>
          ))}
        </div>
      )}
      {item.quantity > 1 && <span style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.22)', fontWeight: '600', display: 'block', marginBottom: '0.3rem' }}>{item.quantity}x in stock</span>}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.1), rgba(255,255,255,0.06))', margin: '1rem 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#e87722', letterSpacing: '-0.5px' }}>₹{item.price}</span>
        <button style={{
          padding: '0.45rem 1.1rem',
          background: hovered ? 'linear-gradient(135deg, #e87722, #f09030)' : 'rgba(232,119,34,0.12)',
          color: hovered ? 'white' : 'rgba(232,119,34,0.8)',
          border: hovered ? '1px solid transparent' : '1px solid rgba(232,119,34,0.25)',
          borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer',
          transition: 'all 0.3s ease', fontWeight: '600',
          boxShadow: hovered ? '0 4px 15px rgba(232,119,34,0.35)' : 'none',
        }}>View →</button>
      </div>
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function Home() {
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter panel
  const [showFilters, setShowFilters] = useState(false)
  const [filterBtnH, setFilterBtnH] = useState(false)
  const filterPanelRef = useRef(null)
  const filterBtnRef = useRef(null)
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 })

  // Recalculate panel position on scroll so it tracks the button
  useEffect(() => {
    function updatePos() {
      if (showFilters && filterBtnRef.current) {
        const rect = filterBtnRef.current.getBoundingClientRect()
        setPanelPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
      }
    }
    window.addEventListener('scroll', updatePos, true)
    return () => window.removeEventListener('scroll', updatePos, true)
  }, [showFilters])

  // Status menu
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const statusRef = useRef(null)
  const statusBtnRef = useRef(null)
  const statusMenuRef = useRef(null)
  const [statusMenuPos, setStatusMenuPos] = useState({ top: 0, right: 0 })

  // Single source of truth — filters applied live, no draft
  const [filters, setFilters] = useState({ ...emptyFilters })

  const subcats    = subcategoryMap[filters.category]  || []
  const subLabel   = subcategoryLabel[filters.category] || 'Subcategory'
  const specFields = specFieldsMap[filters.category]   || []

  // Close panels on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (
        filterPanelRef.current && !filterPanelRef.current.contains(e.target) &&
        filterBtnRef.current   && !filterBtnRef.current.contains(e.target)
      ) setShowFilters(false)

      if (
        statusRef.current     && !statusRef.current.contains(e.target) &&
        statusMenuRef.current && !statusMenuRef.current.contains(e.target)
      ) setShowStatusMenu(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function setCategory(cat) {
    setFilters(f => ({ ...f, category: cat, subcategory: '', specs: {} }))
  }

  function toggleStatus(s) {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(s)
        ? prev.statuses.length === 1 ? prev.statuses : prev.statuses.filter(x => x !== s)
        : [...prev.statuses, s]
    }))
  }

  function openStatusMenu() {
    if (statusBtnRef.current) {
      const rect = statusBtnRef.current.getBoundingClientRect()
      setStatusMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setShowStatusMenu(v => !v)
  }

  function clearAllFilters() {
    setFilters({ ...emptyFilters })
  }

  // Fetch on search/filters change
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true); setError(null)
        const params = {}
        if (search)              params.search      = search
        if (filters.category)    params.category    = filters.category
        if (filters.subcategory) params.subcategory = filters.subcategory
        if (filters.sortPrice)   params.sortPrice   = filters.sortPrice
        Object.entries(filters.specs || {}).forEach(([k, v]) => { if (v) params[k] = v })
        const res = await API.get('/items', { params })
        setItems(res.data)
      } catch {
        setError('Failed to load items. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    const t = setTimeout(run, 300)
    return () => clearTimeout(t)
  }, [search, filters])

  const filteredItems = items.filter(item => filters.statuses.includes(item.status?.toLowerCase()))

  const activeCount = [
    filters.category, filters.subcategory, filters.sortPrice,
    ...Object.values(filters.specs || {}).filter(Boolean),
  ].filter(Boolean).length

  const chips = [
    filters.category    && { id: 'cat',  label: filters.category,    remove: () => setFilters(f => ({ ...f, category: '', subcategory: '', specs: {} })) },
    filters.subcategory && { id: 'sub',  label: filters.subcategory,  remove: () => setFilters(f => ({ ...f, subcategory: '' })) },
    filters.sortPrice   && { id: 'sort', label: sortOptions.find(s => s.value === filters.sortPrice)?.label, remove: () => setFilters(f => ({ ...f, sortPrice: '' })) },
    ...Object.entries(filters.specs || {}).filter(([, v]) => v).map(([k, v]) => ({ id: `spec-${k}`, label: `${k}: ${v}`, remove: () => setFilters(f => ({ ...f, specs: { ...f.specs, [k]: '' } })) })),
  ].filter(Boolean)

  // ── Animated ··· status button vars ──────────────────────────────────────
  const statusColors = filters.statuses.map(s => statusMeta[s].color)
  const strokeColor = statusColors.length === 1 ? statusColors[0]
    : statusColors.length === 2
      ? (filters.statuses.includes('available') && filters.statuses.includes('pending')) ? '#a8e060'
      : (filters.statuses.includes('available') && filters.statuses.includes('sold'))    ? '#c06090' : '#ffa060'
    : '#e0b840'
  const animId = 'travel' + filters.statuses.slice().sort().join('')
  const r = 9, bw = 34, bh = 34
  const perim = 2 * (bw + bh) - (8 - 2 * Math.PI) * r
  const dashLen = Math.round(perim * 1.0)

  const pi = {
    width: '100%', padding: '0.52rem 0.85rem',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '9px', color: 'white', fontSize: '0.8rem',
    outline: 'none', boxSizing: 'border-box',
    appearance: 'none', WebkitAppearance: 'none', transition: 'border 0.2s ease',
  }

  return (
    <div style={{ padding: '3rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @keyframes chipIn  { from { opacity:0; transform:scale(0.75) translateY(5px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes panelIn { from { opacity:0; transform:translateY(-8px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes btnGlow { 0%,100% { box-shadow:0 0 0 0 rgba(232,119,34,0); } 60% { box-shadow:0 0 0 5px rgba(232,119,34,0.13); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes ${animId} { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -${Math.round(perim)}; } }
        @keyframes ${animId}-glow { 0% { stroke-dashoffset:0; opacity:0.5; } 50% { opacity:0.85; } 100% { stroke-dashoffset:-${Math.round(perim)}; opacity:0.5; } }
        @keyframes ${animId}-pulse { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
        input::placeholder, textarea::placeholder { color:rgba(255,255,255,0.22); }
        select option { background:#1a1225; color:white; }
        .filter-panel::-webkit-scrollbar { width: 4px; }
        .filter-panel::-webkit-scrollbar-track { background: transparent; }
        .filter-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        .filter-panel::-webkit-scrollbar-thumb:hover { background: rgba(232,119,34,0.4); }
      `}</style>

      {/* Hero */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '3.2rem', fontWeight: '900', lineHeight: '1.05', letterSpacing: '-2px', marginBottom: '0.75rem', color: 'white' }}>
          Buy. Sell.<br />
          <span style={{ background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Campus Style.</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', fontWeight: '400' }}>Second-hand goods, first-class deals — only for students.</p>
      </div>

      {/* Search bar + filter row */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        marginBottom: chips.length > 0 ? '0.65rem' : '2.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>

          {/* Search */}
          <input type="text" placeholder="Search items..." value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1, padding: '0.65rem 1.2rem',
              background: searchFocused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
              border: searchFocused ? '1px solid rgba(232,119,34,0.35)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', color: 'white', fontSize: '0.9rem',
              outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box',
            }}
          />

          {/* ── Animated ··· Status Button ── */}
          <div ref={statusRef} style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.06)', pointerEvents: 'none', zIndex: 0 }} />
            <svg width={bw} height={bh} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', filter: 'blur(2.5px)', overflow: 'visible' }}>
              <rect x="1" y="1" width={bw-2} height={bh-2} rx={r} ry={r} fill="none" stroke={strokeColor} strokeWidth="4"
                strokeDasharray={`${Math.round(dashLen*0.4)} ${Math.round(perim-dashLen*0.4)}`} strokeLinecap="round"
                style={{ animation: `${animId}-glow 2s linear infinite` }} />
            </svg>
            <svg width={bw} height={bh} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'visible' }}>
              <rect x="1" y="1" width={bw-2} height={bh-2} rx={r} ry={r} fill="none" stroke={strokeColor} strokeWidth="1.5"
                strokeDasharray={`${dashLen} ${Math.round(perim-dashLen)}`} strokeLinecap="round"
                style={{ animation: `${animId} 2s linear infinite` }} />
            </svg>
            <button ref={statusBtnRef} onClick={openStatusMenu} title="Filter by status"
              style={{
                position: 'relative', zIndex: 3,
                width: `${bw}px`, height: `${bh}px`, borderRadius: '10px', cursor: 'pointer',
                background: showStatusMenu ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: 'none', color: strokeColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', letterSpacing: '1px', fontWeight: '900', lineHeight: 1,
                transition: 'background 0.2s ease',
                animation: `${animId}-pulse 2s ease-in-out infinite`,
              }}>···</button>
          </div>

          {/* ── Filters Button ── */}
          <button ref={filterBtnRef}
            onClick={() => {
              if (!showFilters && filterBtnRef.current) {
                const rect = filterBtnRef.current.getBoundingClientRect()
                setPanelPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
              }
              setShowFilters(v => !v)
            }}
            onMouseEnter={() => setFilterBtnH(true)}
            onMouseLeave={() => setFilterBtnH(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.2rem',
              background: showFilters
                ? 'linear-gradient(135deg, rgba(232,119,34,0.22), rgba(232,119,34,0.1))'
                : filterBtnH ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
              border: activeCount > 0 || showFilters
                ? '1px solid rgba(232,119,34,0.45)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', cursor: 'pointer', color: 'white',
              fontSize: '0.84rem', fontWeight: '700',
              transition: 'all 0.22s ease', flexShrink: 0,
              animation: activeCount > 0 ? 'btnGlow 2.8s ease-in-out infinite' : 'none',
            }}>
            <FilterIcon color={activeCount > 0 ? '#e87722' : filterBtnH ? 'white' : 'rgba(255,255,255,0.55)'} strokeWidth={activeCount > 0 ? 2.5 : 2.2} />
            <span style={{ color: activeCount > 0 ? '#f0a040' : filterBtnH ? 'white' : 'rgba(255,255,255,0.65)' }}>Filters</span>
            {activeCount > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #e87722, #f09030)', color: 'white',
                fontSize: '0.62rem', fontWeight: '800', minWidth: '18px', height: '18px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
              }}>{activeCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter Panel — position:fixed, outside search card stacking context ── */}
      {showFilters && (
        <div
          ref={filterPanelRef}
          className="filter-panel"
          style={{
            position: 'fixed',
            top: `${panelPos.top}px`,
            right: `${panelPos.right}px`,
            width: '360px',
            maxHeight: `calc(100vh - ${panelPos.top}px - 16px)`,
            overflowY: 'auto',
            background: 'linear-gradient(160deg, rgba(20,20,28,0.99) 0%, rgba(13,13,19,0.99) 100%)',
            backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            padding: '1.35rem',
            boxShadow: '0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
            zIndex: 9999,
            animation: 'panelIn 0.22s cubic-bezier(0.175,0.885,0.32,1.275)',
          }}
          >
            {/* Panel header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FilterIcon color="rgba(232,119,34,0.75)" />
                <span style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Filters</span>
              </div>
              <button onClick={clearAllFilters}
                style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '6px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
              >Clear all</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Sort — live apply */}
              <div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontWeight: '700', marginBottom: '0.55rem' }}>Sort by Price</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {sortOptions.map(opt => (
                    <button key={opt.value}
                      onClick={() => setFilters(f => ({ ...f, sortPrice: opt.value }))}
                      style={{
                        flex: 1, padding: '0.48rem 0.4rem', fontSize: '0.74rem', fontWeight: '700',
                        borderRadius: '9px', cursor: 'pointer', transition: 'all 0.18s ease',
                        background: filters.sortPrice === opt.value ? 'linear-gradient(135deg, rgba(232,119,34,0.22), rgba(232,119,34,0.1))' : 'rgba(255,255,255,0.04)',
                        border: filters.sortPrice === opt.value ? '1px solid rgba(232,119,34,0.45)' : '1px solid rgba(255,255,255,0.07)',
                        color: filters.sortPrice === opt.value ? '#f0a040' : 'rgba(255,255,255,0.4)',
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.055)' }} />

              {/* Category — live apply */}
              <div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontWeight: '700', marginBottom: '0.55rem' }}>Category</div>
                <div style={{ position: 'relative' }}>
                  <select value={filters.category} onChange={e => setCategory(e.target.value)}
                    style={{ ...pi, paddingRight: '2rem', cursor: 'pointer', color: filters.category ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="rgba(255,255,255,0.3)"><path d="M8 11L3 6h10z"/></svg>
                  </div>
                </div>
              </div>

              {/* Subcategory chips — live apply */}
              {subcats.length > 0 && (
                <div style={{ animation: 'chipIn 0.2s ease' }}>
                  <div style={{ fontSize: '0.6rem', letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(232,119,34,0.5)', fontWeight: '700', marginBottom: '0.55rem' }}>{subLabel}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {subcats.map(s => (
                      <button key={s}
                        onClick={() => setFilters(f => ({ ...f, subcategory: f.subcategory === s ? '' : s }))}
                        style={{
                          padding: '0.3rem 0.7rem', fontSize: '0.75rem', fontWeight: '600',
                          borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s ease',
                          background: filters.subcategory === s ? 'rgba(232,119,34,0.18)' : 'rgba(255,255,255,0.04)',
                          border: filters.subcategory === s ? '1px solid rgba(232,119,34,0.5)' : '1px solid rgba(255,255,255,0.08)',
                          color: filters.subcategory === s ? '#f0a040' : 'rgba(255,255,255,0.4)',
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Specs — live apply via debounce (already handled in useEffect) */}
              {specFields.length > 0 && (
                <div style={{ animation: 'chipIn 0.25s ease' }}>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.055)', marginBottom: '1.1rem' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(232,119,34,0.55)" strokeWidth="2.2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                    </svg>
                    <span style={{ fontSize: '0.6rem', letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontWeight: '700' }}>Specifications</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    {specFields.map(f => (
                      <div key={f.key}>
                        <div style={{ fontSize: '0.58rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: '700', marginBottom: '0.3rem' }}>{f.label}</div>
                        <input type="text" value={filters.specs[f.key] || ''} placeholder={f.placeholder}
                          onChange={e => setFilters(d => ({ ...d, specs: { ...d.specs, [f.key]: e.target.value } }))}
                          style={{
                            ...pi,
                            border: filters.specs[f.key] ? '1px solid rgba(232,119,34,0.38)' : '1px solid rgba(255,255,255,0.07)',
                            color: filters.specs[f.key] ? 'white' : undefined,
                          }}
                          onFocus={e => e.target.style.borderColor = 'rgba(232,119,34,0.45)'}
                          onBlur={e => e.target.style.borderColor = filters.specs[f.key] ? 'rgba(232,119,34,0.38)' : 'rgba(255,255,255,0.07)'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', paddingTop: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#51cf66', boxShadow: '0 0 6px #51cf6680', display: 'inline-block', animation: 'chipIn 0.3s ease' }} />
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>Filters apply instantly</span>
              </div>

            </div>
          </div>
        )}

      {/* ── Status dropdown ── */}
      {showStatusMenu && (
        <div ref={statusMenuRef} style={{
          position: 'fixed', top: `${statusMenuPos.top}px`, right: `${statusMenuPos.right}px`,
          background: 'linear-gradient(135deg, rgba(28,28,35,0.98) 0%, rgba(18,18,24,0.98) 100%)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.09)', borderRadius: '16px',
          padding: '0.6rem', minWidth: '170px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          zIndex: 9999,
          animation: 'panelIn 0.18s cubic-bezier(0.175,0.885,0.32,1.275)',
        }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', fontWeight: '800', padding: '0.35rem 0.85rem 0.65rem' }}>Show Status</div>
          {statusOptions.map(s => {
            const isOn = filters.statuses.includes(s)
            const meta = statusMeta[s]
            return (
              <div key={s} onClick={() => toggleStatus(s)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s ease', background: isOn ? 'rgba(255,255,255,0.04)' : 'transparent', marginBottom: '2px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = isOn ? 'rgba(255,255,255,0.04)' : 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOn ? meta.color : 'rgba(255,255,255,0.15)', display: 'inline-block', transition: 'background 0.2s', boxShadow: isOn ? `0 0 6px ${meta.color}80` : 'none' }} />
                  <span style={{ fontSize: '0.83rem', fontWeight: '600', color: isOn ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', transition: 'color 0.15s' }}>{meta.label}</span>
                </div>
                <div style={{ width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0, border: isOn ? 'none' : '1.5px solid rgba(255,255,255,0.12)', background: isOn ? 'linear-gradient(135deg, #e87722, #f09030)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: isOn ? '0 2px 8px rgba(232,119,34,0.4)' : 'none' }}>
                  {isOn && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center', marginBottom: '2rem' }}>
          {chips.map(chip => <FilterChip key={chip.id} label={chip.label} onRemove={chip.remove} />)}
          {chips.length > 1 && (
            <button onClick={clearAllFilters}
              style={{ fontSize: '0.7rem', padding: '0.28rem 0.7rem', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', color: 'rgba(255,255,255,0.28)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >Clear all ×</button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #e87722', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading items...</p>
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '20px', color: '#ff6b6b' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{error}</p>
          <button onClick={() => setFilters(f => ({ ...f }))} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: '10px', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.85rem' }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.78rem', marginBottom: '1.25rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
          </p>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'rgba(255,255,255,0.25)', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>∅</div>
              <p style={{ fontSize: '1rem', fontWeight: '500' }}>No items match your filters.</p>
              <button onClick={clearAllFilters} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(232,119,34,0.12)', border: '1px solid rgba(232,119,34,0.25)', borderRadius: '10px', color: 'rgba(232,119,34,0.8)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>Clear Filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {filteredItems.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Home