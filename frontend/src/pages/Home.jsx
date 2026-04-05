import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'
import LocationPicker from '../components/LocationPicker'
import { defaultLocation } from '../utils/locationUtils'

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
  'Food & Drinks':    ['Snack', 'Full Meal', 'Dessert', 'Beverage', 'Breakfast', 'Homemade', 'Packaged'],
}

const subcategoryLabel = {
  'Clothing': 'Size', 'Books & Notes': 'Semester',
  'Electronics': 'Type', 'Furniture': 'Type', 'Sports & Fitness': 'Sport',
}

const specFieldsMap = {
  'Electronics': [
    { key: 'brand',     label: 'Brand',     placeholder: 'e.g. Dell, Apple' },
    { key: 'ram',       label: 'RAM',        placeholder: 'e.g. 8GB, 16GB' },
    { key: 'storage',   label: 'Storage',    placeholder: 'e.g. 256GB, 1TB' },
    { key: 'processor', label: 'Processor',  placeholder: 'e.g. Intel i5, M2' },
    { key: 'display',   label: 'Display',    placeholder: 'e.g. 15.6", 4K' },
  ],
  'Clothing': [
    { key: 'gender', label: 'Gender', placeholder: 'e.g. Male, Female, Unisex' },
    { key: 'color',  label: 'Color',  placeholder: 'e.g. Black, Navy Blue' },
    { key: 'type',   label: 'Type',   placeholder: 'e.g. T-Shirt, Jeans' },
  ],
  'Books & Notes': [
    { key: 'subject', label: 'Subject', placeholder: 'e.g. Physics, Maths' },
    { key: 'author',  label: 'Author',  placeholder: 'e.g. H.C. Verma' },
    { key: 'edition', label: 'Edition', placeholder: 'e.g. 3rd Edition 2023' },
  ],
  'Furniture': [
    { key: 'material',   label: 'Material',   placeholder: 'e.g. Wood, Metal' },
    { key: 'color',      label: 'Color',      placeholder: 'e.g. Brown, White' },
    { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 120×60 cm' },
  ],
  'Sports & Fitness': [
    { key: 'sport', label: 'Sport', placeholder: 'e.g. Cricket, Football' },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Nike, Adidas' },
    { key: 'size',  label: 'Size',  placeholder: 'e.g. Size 7, XL' },
  ],
  'Stationery': [
    { key: 'type',  label: 'Type',  placeholder: 'e.g. Notebook, Pen set' },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Classmate, Natraj' },
  ],
  'Appliances': [
    { key: 'brand',    label: 'Brand',    placeholder: 'e.g. Samsung, LG' },
    { key: 'capacity', label: 'Capacity', placeholder: 'e.g. 5kg, 200L' },
    { key: 'color',    label: 'Color',    placeholder: 'e.g. White, Silver' },
  ],
  'Games & Hobbies': [
    { key: 'platform', label: 'Platform', placeholder: 'e.g. PS5, PC, Mobile' },
    { key: 'type',     label: 'Type',     placeholder: 'e.g. Strategy, Action' },
    { key: 'brand',    label: 'Brand',    placeholder: 'e.g. Sony, Nintendo' },
  ],
  'Services': [
    { key: 'mode',       label: 'Mode',       placeholder: 'e.g. Online, Offline' },
    { key: 'experience', label: 'Experience', placeholder: 'e.g. 2 years, Beginner' },
  ],
  'Food & Drinks': [
    { key: 'diet',     label: 'Diet',     placeholder: 'e.g. Vegetarian, Vegan' },
    { key: 'contains', label: 'Contains', placeholder: 'e.g. Nuts, Dairy'       },
  ],
}

const specSuggestionsMap = {
  'Electronics': {
    brand:     ['Apple', 'Dell', 'HP', 'Lenovo', 'Samsung', 'Sony', 'Asus', 'Acer', 'OnePlus', 'Xiaomi', 'LG', 'MSI'],
    ram:       ['4GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
    storage:   ['128GB', '256GB', '512GB', '1TB', '2TB', '500GB SSD', '1TB HDD'],
    processor: ['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M1', 'Apple M2', 'Apple M3', 'Snapdragon 8'],
    display:   ['13.3"', '14"', '15.6"', '16"', '17.3"', '6.1"', '6.7"', '4K', 'FHD', 'OLED', 'AMOLED'],
  },
  'Clothing': {
    gender: ['Male', 'Female', 'Unisex', 'Kids'],
    color:  ['Black', 'White', 'Navy Blue', 'Grey', 'Red', 'Green', 'Yellow', 'Pink', 'Brown', 'Beige', 'Maroon'],
    type:   ['T-Shirt', 'Jeans', 'Shirt', 'Kurta', 'Hoodie', 'Jacket', 'Saree', 'Salwar', 'Shorts', 'Ethnic Wear', 'Formal Wear', 'Sportswear'],
  },
  'Books & Notes': {
    subject: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'English', 'Economics', 'Management', 'Engineering Maths', 'Data Structures'],
    edition: ['1st Edition', '2nd Edition', '3rd Edition', '4th Edition', '5th Edition', '2021', '2022', '2023', '2024'],
  },
  'Furniture': {
    material:   ['Solid Wood', 'Plywood', 'MDF', 'Metal', 'Steel', 'Glass', 'Plastic', 'Bamboo'],
    color:      ['Brown', 'White', 'Black', 'Natural Wood', 'Grey', 'Walnut', 'Oak'],
    dimensions: ['90×200cm (Single)', '135×200cm (Double)', '120×60cm', '80×80cm', '150×75cm'],
  },
  'Sports & Fitness': {
    sport: ['Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis', 'Cycling', 'Swimming', 'Gym', 'Yoga', 'Table Tennis'],
    brand: ['Nike', 'Adidas', 'Puma', 'Reebok', 'SG', 'SS', 'Yonex', 'Cosco', 'Decathlon', 'Under Armour'],
    size:  ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Size 5', 'Size 6', 'Size 7', 'One Size'],
  },
  'Stationery': {
    type:  ['Notebook', 'Pen Set', 'Pencil Box', 'Highlighters', 'Sticky Notes', 'Markers', 'Folders', 'Art Supplies', 'Geometry Box'],
    brand: ['Classmate', 'Natraj', 'Camlin', 'Apsara', 'Reynolds', 'Cello', 'Parker', 'Pilot', 'Staedtler', 'Faber-Castell'],
  },
  'Appliances': {
    brand:    ['Samsung', 'LG', 'Whirlpool', 'Bosch', 'IFB', 'Havells', 'Bajaj', 'Usha', 'Voltas', 'Godrej'],
    capacity: ['5kg', '6kg', '7kg', '8kg', '150L', '200L', '250L', '300L', '0.5 ton', '1 ton', '1.5 ton'],
    color:    ['White', 'Silver', 'Black', 'Grey', 'Stainless Steel'],
  },
  'Games & Hobbies': {
    platform: ['PS5', 'PS4', 'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'PC', 'Mobile', 'Board Game'],
    type:     ['Action', 'Strategy', 'RPG', 'Sports', 'Racing', 'Puzzle', 'Simulation', 'Adventure', 'FPS', 'Horror'],
    brand:    ['Sony', 'Nintendo', 'Microsoft', 'EA', 'Ubisoft', 'Activision', 'Lego', 'Hasbro', 'Mattel'],
  },
  'Services': {
    mode:       ['Online', 'Offline', 'Both Online & Offline', 'Home Visit', 'Remote'],
    experience: ['Beginner', '6 months', '1 year', '2 years', '3+ years', '5+ years', 'Student', 'Professional'],
  },
  'Food & Drinks': {
    type:     ['Snack', 'Full Meal', 'Dessert', 'Beverage', 'Breakfast', 'Homemade', 'Packaged'],
    diet:     ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Gluten-Free'],
    contains: ['No Allergens', 'Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Shellfish'],
  },
}

// ─── Shared dark dropdown style ───────────────────────────────────────────────
const dropMenuStyle = {
  background: 'var(--glass-bg-deep)',
  border: '1px solid var(--border-accent)',
  maxHeight: '200px', overflowY: 'auto',
  boxShadow: '0 20px 48px rgba(0,0,0,0.85)',
  borderRadius: '0 0 9px 9px',
  borderTop: 'none',
}

// ─── Smart Spec Input with suggestions dropdown ──────────────────────────────
function FilterSpecInput({ fieldKey, value, placeholder, onChange, suggestions = [], openKey, setOpenKey }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const wrapRef = useRef(null)
  const [focused, setFocused] = useState(false)
  const [dropRect, setDropRect] = useState(null)
  const isOpen = openKey === fieldKey

  const filtered = value
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
    : suggestions

  useEffect(() => {
    function onOut(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target) && !e.target.closest('[data-portal-dropdown]')) {
        if (isOpen) setOpenKey(null)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [isOpen, setOpenKey])

  // Update dropdown position on scroll so it tracks the input
  useEffect(() => {
    if (!isOpen) return
    function onScroll() {
      if (wrapRef.current) {
        const r = wrapRef.current.getBoundingClientRect()
        setDropRect({ top: r.bottom, left: r.left, width: r.width })
      }
    }
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [isOpen])

  function openDrop() {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect()
      setDropRect({ top: r.bottom, left: r.left, width: r.width })
    }
    setOpenKey(fieldKey)
  }

  const dropdown = isOpen && filtered.length > 0 && dropRect && createPortal(
    <div data-portal-dropdown
      onMouseDown={e => e.stopPropagation()}
      style={{
      ...dropMenuStyle,
      position: 'fixed',
      top: dropRect.top,
      left: dropRect.left,
      width: dropRect.width,
      zIndex: 99999999,
    }}>
      {filtered.map((s, i) => {
        const matchIdx = value ? s.toLowerCase().indexOf(value.toLowerCase()) : -1
        return (
          <div key={s}
            data-portal-dropdown
            onMouseDown={e => { e.preventDefault(); onChange(s); setOpenKey(null) }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              padding: '0.45rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer',
              color: hoveredIdx === i ? 'var(--accent-alt)' : 'var(--text-secondary)',
              background: hoveredIdx === i ? 'var(--accent-soft)' : 'transparent',
              transition: 'all 0.12s', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            {matchIdx >= 0 ? (
              <span>
                {s.slice(0, matchIdx)}
                <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{s.slice(matchIdx, matchIdx + value.length)}</span>
                {s.slice(matchIdx + value.length)}
              </span>
            ) : s}
          </div>
        )
      })}
    </div>,
    document.body
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={e => { onChange(e.target.value); openDrop() }}
          onFocus={() => { setFocused(true); openDrop() }}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: suggestions.length > 0 ? '0.52rem 1.8rem 0.52rem 0.85rem' : '0.52rem 0.85rem',
            background: 'var(--bg-input)',
            border: focused ? '1px solid var(--accent-border)' : value ? '1px solid var(--border-accent)' : '1px solid var(--border)',
            borderRadius: '9px',
            color: value ? 'var(--text-primary)' : undefined, fontSize: '0.8rem',
            outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
            appearance: 'none', WebkitAppearance: 'none',
          }}
        />
        {suggestions.length > 0 && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); if (isOpen) { setOpenKey(null) } else { openDrop() } }}
            style={{
              position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem',
              color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-ghost)'}
          >
            <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M8 11L3 6h10z"/>
            </svg>
          </button>
        )}
      </div>
      {dropdown}
    </div>
  )
}

// ─── Custom Category dropdown for filter panel ────────────────────────────────
function FilterCategorySelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const [hIdx, setHIdx] = useState(null)
  const [dropRect, setDropRect] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target) && !e.target.closest('[data-portal-dropdown]'))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Update dropdown position on scroll
  useEffect(() => {
    if (!open) return
    function onScroll() {
      if (wrapRef.current) {
        const r = wrapRef.current.getBoundingClientRect()
        setDropRect({ top: r.bottom, left: r.left, width: r.width })
      }
    }
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [open])

  function openDrop() {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect()
      setDropRect({ top: r.bottom, left: r.left, width: r.width })
    }
    setOpen(true)
  }

  const dropdown = open && dropRect && createPortal(
    <div data-portal-dropdown
      onMouseDown={e => e.stopPropagation()}
      style={{
      ...dropMenuStyle,
      position: 'fixed',
      top: dropRect.top,
      left: dropRect.left,
      width: dropRect.width,
      zIndex: 99999999,
    }}>
      {['', ...options].map((opt, i) => {
        const lbl = opt || placeholder
        const isActive = opt === value
        return (
          <div key={opt}
            data-portal-dropdown
            onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false) }}
            onMouseEnter={() => setHIdx(i)} onMouseLeave={() => setHIdx(null)}
            style={{
              padding: '0.45rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer',
              color: isActive ? 'var(--accent-alt)' : hIdx === i ? 'var(--accent-alt)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-soft)' : hIdx === i ? 'rgba(var(--accent-rgb),0.08)' : 'transparent',
              borderBottom: i < options.length ? '1px solid var(--border)' : 'none',
              fontWeight: isActive ? '600' : '400',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}
          >
            {isActive && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="1,6 4,9 11,3" stroke="var(--accent-alt)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            {!isActive && <span style={{ width: '9px' }} />}
            {lbl}
          </div>
        )
      })}
    </div>,
    document.body
  )

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onMouseDown={() => { if (open) setOpen(false); else openDrop() }}
        style={{
          width: '100%', padding: '0.52rem 2rem 0.52rem 0.85rem',
          background: 'var(--bg-input)',
          border: open ? '1px solid var(--accent-border)' : value ? '1px solid var(--border-accent)' : '1px solid var(--border)',
          borderRadius: '9px',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.8rem',
          cursor: 'pointer', outline: 'none', textAlign: 'left', boxSizing: 'border-box',
          transition: 'border-color 0.2s', display: 'flex', alignItems: 'center',
        }}
      >
        <span style={{ flex: 1 }}>{value || placeholder}</span>
        <span style={{
          position: 'absolute', right: '0.75rem', top: '50%',
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: 'transform 0.2s',
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--text-muted)"><path d="M8 11L3 6h10z"/></svg>
        </span>
      </button>
      {dropdown}
    </div>
  )
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
        background: h ? 'rgba(var(--accent-rgb),0.2)' : 'var(--accent-soft)',
        border: `1px solid ${h ? 'rgba(var(--accent-rgb),0.55)' : 'var(--border-accent)'}`,
        borderRadius: '20px', cursor: 'pointer',
        transition: 'all 0.18s ease',
        animation: 'chipIn 0.22s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}
    >
      <span style={{ fontSize: '0.73rem', fontWeight: '600', color: h ? 'var(--accent-alt)' : 'var(--accent)' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: h ? 'var(--accent-alt)' : 'rgba(var(--accent-rgb),0.5)', lineHeight: 1, marginTop: '-1px' }}>×</span>
    </button>
  )
}

// ─── Category emoji map ──────────────────────────────────────────────────────
const CATEGORY_EMOJI = {
  'Electronics': '💻', 'Books & Notes': '📚', 'Clothing': '👕',
  'Furniture': '🪑', 'Food & Drinks': '🍱', 'Sports & Fitness': '⚽',
  'Stationery': '✏️', 'Appliances': '🔌', 'Games & Hobbies': '🎮',
  'Services': '🛠️', 'Other': '📦',
}

// ─── Watching border SVG ─────────────────────────────────────────────────────
function WatchingBorder({ cw, ch, radius = 16 }) {
  if (!cw || !ch) return null
  const cp = 2 * (cw + ch) - (8 - 2 * Math.PI) * radius
  const cdash = Math.round(cp)
  const aid = `wg${cw}x${ch}r${radius}`
  return (
    <>
      <style>{`
        @keyframes ${aid} { 0% { stroke-dashoffset:0 } 100% { stroke-dashoffset:-${Math.round(cp)} } }
        @keyframes ${aid}-glow { 0% { stroke-dashoffset:0;opacity:0.5 } 50% { opacity:0.85 } 100% { stroke-dashoffset:-${Math.round(cp)};opacity:0.5 } }
      `}</style>
      <svg width={cw} height={ch} style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', filter:'blur(2.5px)', overflow:'visible' }}>
        <rect x="1" y="1" width={cw-2} height={ch-2} rx={radius} ry={radius} fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${Math.round(cdash*0.4)} ${Math.round(cp-cdash*0.4)}`} style={{ animation:`${aid}-glow 2s linear infinite` }} />
      </svg>
      <svg width={cw} height={ch} style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', overflow:'visible' }}>
        <rect x="1" y="1" width={cw-2} height={ch-2} rx={radius} ry={radius} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={`${Math.round(cdash)} ${Math.round(cp-cdash)}`} style={{ animation:`${aid} 2s linear infinite` }} />
      </svg>
    </>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, small = false }) {
  const s = status?.toLowerCase()
  return (
    <span style={{
      fontSize: small ? '0.6rem' : '0.68rem', fontWeight: '700', flexShrink: 0,
      color: s === 'sold' ? 'var(--color-sold)' : s === 'pending' ? 'var(--color-pending)' : 'var(--color-available)',
      background: s === 'sold' ? 'var(--bg-sold)' : s === 'pending' ? 'var(--bg-pending)' : 'var(--bg-available)',
      padding: small ? '2px 8px' : '3px 10px', borderRadius: '20px', textTransform: 'capitalize',
      border: s === 'sold' ? '1px solid var(--bd-sold)' : s === 'pending' ? '1px solid var(--bd-pending)' : '1px solid var(--bd-available)',
    }}>{s}</span>
  )
}

// ─── Item image or emoji placeholder ─────────────────────────────────────────
function ItemImage({ item, style = {} }) {
  const [imgError, setImgError] = useState(false)
  const img = item.images?.[0]
  const emoji = CATEGORY_EMOJI[item.category] || '📦'
  if (img && !imgError) {
    return (
      <img src={img} alt={item.title}
        onError={() => setImgError(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
      />
    )
  }
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-soft), color-mix(in srgb, var(--accent) 5%, transparent))', ...style }}>
      <span style={{ fontSize: '2.2rem', opacity: 0.55 }}>{emoji}</span>
    </div>
  )
}

// ─── ItemCard — 3 layouts driven by gridSize ──────────────────────────────────
function ItemCard({ item, isWatching = false, gridSize = 3 }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const status = item.status?.toLowerCase()
  const specs = item.specs && typeof item.specs === 'object' ? Object.entries(item.specs).filter(([,v]) => v).slice(0, 3) : []
  const cardRef = useRef(null)
  const [cw, setCw] = useState(0)
  const [ch, setCh] = useState(0)
  useEffect(() => {
    if (!isWatching || !cardRef.current) return
    const update = () => { setCw(cardRef.current.offsetWidth); setCh(cardRef.current.offsetHeight) }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(cardRef.current)
    return () => ro.disconnect()
  }, [isWatching])

  const baseCard = {
    background: hovered ? 'var(--glass-bg-hover)' : 'var(--glass-bg)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: hovered ? '1px solid rgba(var(--accent-rgb),0.35)' : '1px solid var(--glass-border)',
    cursor: 'pointer', position: 'relative', overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
    boxShadow: hovered
      ? '0 16px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
      : '0 4px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
  }

  // ── GRID 1: Polished horizontal list row (non-home pages only) ─────────────
  if (gridSize === 1) {
    return (
      <div ref={cardRef}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onClick={() => navigate(`/items/${item.id}`)}
        style={{
          ...baseCard, borderRadius: '16px',
          display: 'flex', alignItems: 'stretch',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          minHeight: '110px',
        }}
      >
        {isWatching && <WatchingBorder cw={cw} ch={ch} radius={16} />}

        {/* Square image */}
        <div style={{ width: '110px', flexShrink: 0, borderRadius: '15px 0 0 15px', overflow: 'hidden', position: 'relative', background: 'var(--bg-card-hover)' }}>
          <ItemImage item={item} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.32rem' }}>
              <span style={{ fontSize: '0.6rem', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>{item.category}</span>
              {item.subcategory && <>
                <span style={{ color: 'var(--text-ghost)', fontSize: '0.7rem', lineHeight: 1 }}>›</span>
                <span style={{ fontSize: '0.57rem', letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(var(--accent-rgb),0.6)', fontWeight: '700' }}>{item.subcategory}</span>
              </>}
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.3', letterSpacing: '-0.25px', marginBottom: '0.3rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.title}</h3>
            {specs.length > 0 && (
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {specs.slice(0, 3).map(([,v]) => (
                  <span key={v} style={{ fontSize: '0.62rem', padding: '1px 7px', borderRadius: '5px', background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: '600' }}>{v}</span>
                ))}
              </div>
            )}
          </div>

          {/* Right: price, status, button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '0.5rem', flexShrink: 0, minWidth: '120px' }}>
            <StatusBadge status={status} small />
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-price)', letterSpacing: '-0.6px', fontFamily: 'var(--font-body)', lineHeight: 1 }}>
              ₹{Number(item.price).toLocaleString('en-IN')}
            </span>
            <button onClick={e => { e.stopPropagation(); navigate(`/items/${item.id}`) }}
              style={{ padding: '0.35rem 1rem', background: hovered ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'var(--accent-soft)', color: hovered ? 'white' : 'var(--accent)', border: hovered ? '1px solid transparent' : '1px solid var(--border-accent)', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: '700', boxShadow: hovered ? '0 4px 12px var(--accent-glow)' : 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
              View →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── GRID 2: Compact card with image banner ────────────────────────────────
  if (gridSize === 2) {
    return (
      <div ref={cardRef}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onClick={() => navigate(`/items/${item.id}`)}
        style={{ ...baseCard, borderRadius: '16px', transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)' }}
      >
        {isWatching && <WatchingBorder cw={cw} ch={ch} radius={16} />}
        {/* Image banner */}
        <div style={{ width: '100%', height: '150px', position: 'relative', overflow: 'hidden' }}>
          <ItemImage item={item} />
          <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', zIndex: 3 }}>
            <StatusBadge status={status} small />
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, var(--bg-surface), transparent)', pointerEvents: 'none' }} />
        </div>
        {/* Content */}
        <div style={{ padding: '0.85rem 1rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.58rem', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>{item.category}</span>
            {item.subcategory && <>
              <span style={{ color: 'var(--text-ghost)', fontSize: '0.65rem' }}>›</span>
              <span style={{ fontSize: '0.55rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(var(--accent-rgb),0.55)', fontWeight: '700' }}>{item.subcategory}</span>
            </>}
          </div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.3', letterSpacing: '-0.2px', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
          {specs.length > 0 && (
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {specs.map(([,v]) => <span key={v} style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '5px', background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: '600' }}>{v}</span>)}
            </div>
          )}
          <div style={{ height: '1px', background: 'var(--glass-divider)', margin: '0.6rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-price)', letterSpacing: '-0.5px', fontFamily: 'var(--font-body)' }}>
              ₹{Number(item.price).toLocaleString('en-IN')}
            </span>
            <button onClick={e => { e.stopPropagation(); navigate(`/items/${item.id}`) }}
              style={{ padding: '0.32rem 0.85rem', background: hovered ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'var(--accent-soft)', color: hovered ? 'white' : 'var(--accent)', border: hovered ? '1px solid transparent' : '1px solid var(--border-accent)', borderRadius: '8px', fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.25s ease', fontWeight: '700', boxShadow: hovered ? '0 4px 12px var(--accent-glow)' : 'none' }}>
              View →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── GRID 3 (default): Full ecommerce card with tall image ─────────────────
  return (
    <div ref={cardRef}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/items/${item.id}`)}
      style={{ ...baseCard, borderRadius: '20px', transform: hovered ? 'translateY(-6px) scale(1.015)' : 'translateY(0) scale(1)' }}
    >
      {isWatching && <WatchingBorder cw={cw} ch={ch} radius={20} />}
      {/* Hero image */}
      <div style={{ width: '100%', height: '180px', position: 'relative', overflow: 'hidden' }}>
        <ItemImage item={item} />
        {/* Status badge top-right */}
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 3 }}>
          <StatusBadge status={status} />
        </div>
        {/* Category label bottom-left over image */}
        <div style={{ position: 'absolute', bottom: '0.65rem', left: '0.75rem', zIndex: 3 }}>
          <span style={{ fontSize: '0.58rem', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', fontWeight: '700', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', padding: '2px 7px', borderRadius: '5px' }}>
            {item.category}{item.subcategory ? ` › ${item.subcategory}` : ''}
          </span>
        </div>
        {/* Gradient fade into card body */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, color-mix(in srgb, var(--bg-surface) 90%, transparent), transparent)', pointerEvents: 'none' }} />
        {/* Top shimmer */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'var(--glass-shimmer)' }} />
      </div>
      {/* Content */}
      <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.35', letterSpacing: '-0.25px', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h3>
        {specs.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {specs.map(([,v]) => (
              <span key={v} style={{ fontSize: '0.63rem', padding: '2px 8px', borderRadius: '6px', background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: '600' }}>{v}</span>
            ))}
          </div>
        )}
        {item.quantity > 1 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-ghost)', fontWeight: '600', display: 'block', marginBottom: '0.4rem' }}>{item.quantity}x in stock</span>
        )}
        <div style={{ height: '1px', background: 'var(--glass-divider)', margin: '0.75rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-price)', letterSpacing: '-0.5px', fontFamily: 'var(--font-body)' }}>
            ₹{Number(item.price).toLocaleString('en-IN')}
          </span>
          <button onClick={e => { e.stopPropagation(); navigate(`/items/${item.id}`) }}
            style={{ padding: '0.42rem 1.1rem', background: hovered ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'var(--accent-soft)', color: hovered ? 'white' : 'var(--accent)', border: hovered ? '1px solid transparent' : '1px solid var(--border-accent)', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.25s ease', fontWeight: '700', boxShadow: hovered ? '0 4px 15px var(--accent-glow)' : 'none' }}>
            View →
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── Home ─────────────────────────────────────────────────────────────────────
function Home() {
  const { key: routeKey } = useLocation()
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const homeSearchRef = useRef(null)
  // Grid size — controlled by Navbar ≡ dropdown
  const [gridSize, setGridSizeState] = useState(() => {
    try { return parseInt(localStorage.getItem('homeGridSize') || '3', 10) } catch { return 3 }
  })
  useEffect(() => {
    // Register bridge so Navbar can push changes immediately
    window.__homeGridBridge = { set: (val) => setGridSizeState(val) }
    function onGridSize(e) { setGridSizeState(e.detail.val) }
    window.addEventListener('home-grid-size', onGridSize)
    return () => { window.removeEventListener('home-grid-size', onGridSize) }
  }, [])

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [watchedIds, setWatchedIds] = useState(new Set())
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user) return
    API.get('/items/watched').then(r => {
      setWatchedIds(new Set(r.data.map(w => w.itemId)))
    }).catch(() => {})
  }, [])
  const [error, setError] = useState(null)
  const [location, setLocation] = useState(defaultLocation)

  // Filter panel
  const [showFilters, setShowFilters] = useState(false)
  const [filterBtnH, setFilterBtnH] = useState(false)
  const filterPanelRef = useRef(null)
  const filterBtnRef = useRef(null)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })

  // Recalculate panel position on scroll so it tracks the button
  useEffect(() => {
    function updatePos() {
      if (showFilters && filterBtnRef.current) {
        const rect = filterBtnRef.current.getBoundingClientRect()
        setPanelPos({ top: rect.bottom + 8, left: Math.max(8, rect.left + (rect.width / 2) - 180) })
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
  const [statusMenuPos, setStatusMenuPos] = useState({ top: 0, left: 0 })

  // Recalculate status menu position on scroll
  useEffect(() => {
    function updateStatusPos() {
      if (showStatusMenu && statusBtnRef.current) {
        const rect = statusBtnRef.current.getBoundingClientRect()
        setStatusMenuPos({ top: rect.bottom + 8, left: Math.max(8, rect.left + (rect.width / 2) - 90) })
      }
    }
    window.addEventListener('scroll', updateStatusPos, true)
    return () => window.removeEventListener('scroll', updateStatusPos, true)
  }, [showStatusMenu])

  // One spec dropdown open at a time
  const [openSpecKey, setOpenSpecKey] = useState(null)

  // Navbar search bridge — tells navbar when our search bar is out of view
  const searchRowRef = useRef(null)
  useEffect(() => {
    // Expose setter so navbar can update our search state
    window.__homeSearchBridge = { set: setSearch, get: () => search }
  })
  useEffect(() => {
    // Listen for navbar search input → update our state
    function onNavSearch(e) { setSearch(e.detail.value) }
    window.addEventListener('home-navbar-search', onNavSearch)
    return () => window.removeEventListener('home-navbar-search', onNavSearch)
  }, [])

  useEffect(() => {
    // Navbar typed → scroll home to top → focus home search input so user keeps typing
    function onHandoff(e) {
      const val = e.detail?.value ?? ''
      setSearch(val)
      // Scroll to very top first
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Wait for scroll + intersection observer to fire (search bar comes back into view)
      // then steal focus so user can keep typing without re-clicking
      setTimeout(() => {
        homeSearchRef.current?.focus()
        // Move cursor to end of existing text
        const inp = homeSearchRef.current
        if (inp) { const len = inp.value.length; inp.setSelectionRange(len, len) }
      }, 350)
    }
    window.addEventListener('home-navbar-handoff', onHandoff)
    return () => window.removeEventListener('home-navbar-handoff', onHandoff)
  }, [])
  useEffect(() => {
    const el = searchRowRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        window.dispatchEvent(new CustomEvent('home-searchbar-visibility', {
          detail: { visible: entry.isIntersecting }
        }))
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Single source of truth — filters applied live, no draft
  // Restore from sessionStorage so filters survive back-navigation
  const [filters, setFilters] = useState(() => {
    try {
      const saved = sessionStorage.getItem('homeFilters')
      return saved ? JSON.parse(saved) : { ...emptyFilters }
    } catch { return { ...emptyFilters } }
  })

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

  // Persist filters across navigation (back button from item detail)
  useEffect(() => {
    sessionStorage.setItem('homeFilters', JSON.stringify(filters))
  }, [filters])

  // Sync full filter state to navbar so it can show badges + drive buttons
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('navbar-filter-state', {
      detail: { filters, location }
    }))
  }, [filters, location])

  // Listen for navbar → open status / filter panel (navbar passes button rect)
  useEffect(() => {
    function onNavStatus(e) {
      const rect = e.detail?.rect
      if (rect) setStatusMenuPos({ top: rect.bottom + 8, left: Math.max(8, rect.left + (rect.width / 2) - 90) })
      setShowStatusMenu(v => !v)
      setShowFilters(false)
    }
    function onNavFilters(e) {
      const rect = e.detail?.rect
      if (rect) setPanelPos({ top: rect.bottom + 8, left: Math.max(8, rect.left + (rect.width / 2) - 180) })
      setShowFilters(v => !v)
      setShowStatusMenu(false)
    }
    window.addEventListener('navbar-open-status',  onNavStatus)
    window.addEventListener('navbar-open-filters', onNavFilters)
    return () => {
      window.removeEventListener('navbar-open-status',  onNavStatus)
      window.removeEventListener('navbar-open-filters', onNavFilters)
    }
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
      setStatusMenuPos({ top: rect.bottom + 8, left: Math.max(8, rect.left + (rect.width / 2) - 90) })
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

// Location filter
if (location.mode === 'custom') {
  if (location.institutions.length > 0)
    params.institutions = location.institutions.join(',')
  if (Object.keys(location.cities).length > 0)
    params.cities = JSON.stringify(location.cities)
  if (Object.keys(location.statesOnly).length > 0)
    params.states = Object.keys(location.statesOnly).join(',')
}

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
  }, [search, filters, location, routeKey])

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
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: '9px', color: 'var(--text-primary)', fontSize: '0.8rem',
    outline: 'none', boxSizing: 'border-box',
    appearance: 'none', WebkitAppearance: 'none', transition: 'border 0.2s ease',
  }

  return (
    <div className="home-page" style={{ padding: '3rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @keyframes chipIn  { from { opacity:0; transform:scale(0.75) translateY(5px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes panelIn { from { opacity:0; transform:translateY(-8px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes btnGlow { 0%,100% { box-shadow:0 0 0 0 rgba(var(--accent-rgb),0); } 60% { box-shadow:0 0 0 5px rgba(var(--accent-rgb),0.13); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes ${animId} { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -${Math.round(perim)}; } }
        @keyframes ${animId}-glow { 0% { stroke-dashoffset:0; opacity:0.5; } 50% { opacity:0.85; } 100% { stroke-dashoffset:-${Math.round(perim)}; opacity:0.5; } }
        @keyframes ${animId}-pulse { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
        input::placeholder, textarea::placeholder { color: var(--text-ghost); }
        select option { background: var(--bg-surface); color: var(--text-primary); }
        .filter-panel::-webkit-scrollbar { width: 4px; }
        .filter-panel::-webkit-scrollbar-track { background: transparent; }
        .filter-panel::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 4px; }
        .filter-panel::-webkit-scrollbar-thumb:hover { background: rgba(var(--accent-rgb),0.4); }
        .home-page { padding: 3rem 4rem }
        .home-hero-title { font-size: 3.2rem }
        .home-search-row { flex-wrap: nowrap }
        .home-filter-label { display: inline }
        @media (max-width: 1280px) { .home-page { padding: 2.5rem 3rem } }
        @media (max-width: 1024px) { .home-page { padding: 2rem 2rem } .home-hero-title { font-size: 2.6rem } }
        @media (max-width: 768px)  {
          .home-page { padding: 1.5rem 1rem }
          .home-hero-title { font-size: 2.2rem }
          .home-search-row { flex-wrap: wrap; gap: 0.5rem !important }
          .home-search-input { min-width: 0 !important }
          .home-filter-label { display: none }
          .home-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important }
        }
        @media (max-width: 480px)  {
          .home-hero-title { font-size: 1.9rem }
          .home-grid { grid-template-columns: 1fr !important }
          .home-search-row { flex-direction: column }
          .home-search-input { width: 100% !important }
        }
      `}</style>

      {/* Hero */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="home-hero-title" style={{ fontWeight: '900', lineHeight: '1.05', letterSpacing: '-2px', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Buy. Sell.<br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Campus Style.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '400' }}>Second-hand goods, first-class deals — only for students.</p>
      </div>

      {/* Search bar + filter row */}
      <div ref={searchRowRef} style={{
        background: 'var(--glass-bg-row)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)', borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        marginBottom: chips.length > 0 ? '0.65rem' : '2.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        <div className="home-search-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          
         {/* Location */}
<LocationPicker location={location} setLocation={setLocation} />

          {/* Search */}
          <input ref={homeSearchRef} type="text" placeholder="Search items..." value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            className="home-search-input"
            style={{
              flex: 1, padding: '0.65rem 1.2rem',
              background: searchFocused ? 'var(--bg-input-focus)' : 'var(--bg-input)',
              border: searchFocused ? '1px solid var(--accent-border)' : '1px solid var(--border)',
              borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.9rem',
              outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box',
            }}
          />

          {/* ── Animated ··· Status Button ── */}
          <div ref={statusRef} style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '10px', border: '1.5px solid var(--border)', pointerEvents: 'none', zIndex: 0 }} />
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
                background: showStatusMenu ? 'var(--bg-card-hover)' : 'transparent',
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
                setPanelPos({ top: rect.bottom + 8, left: Math.max(8, rect.left + (rect.width / 2) - 180) })
              }
              setShowFilters(v => !v)
            }}
            onMouseEnter={() => setFilterBtnH(true)}
            onMouseLeave={() => setFilterBtnH(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.2rem',
              background: showFilters
                ? 'linear-gradient(135deg, rgba(var(--accent-rgb),0.22), rgba(var(--accent-rgb),0.1))'
                : filterBtnH ? 'var(--bg-card-hover)' : 'var(--bg-input)',
              border: activeCount > 0 || showFilters
                ? '1px solid var(--accent-border)' : '1px solid var(--border)',
              borderRadius: '12px', cursor: 'pointer', color: 'white',
              fontSize: '0.84rem', fontWeight: '700',
              transition: 'all 0.22s ease', flexShrink: 0,
              animation: activeCount > 0 ? 'btnGlow 2.8s ease-in-out infinite' : 'none',
            }}>
            <FilterIcon color={activeCount > 0 ? 'var(--accent)' : filterBtnH ? 'var(--text-primary)' : 'var(--text-secondary)'} strokeWidth={activeCount > 0 ? 2.5 : 2.2} />
            <span className="home-filter-label" style={{ color: activeCount > 0 ? 'var(--accent-alt)' : filterBtnH ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Filters</span>
            {activeCount > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: 'white',
                fontSize: '0.62rem', fontWeight: '800', minWidth: '18px', height: '18px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
              }}>{activeCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter Panel — position:fixed, outside search card stacking context ── */}
      {showFilters && createPortal(
        <div
          ref={filterPanelRef}
          className="filter-panel"
          style={{
            position: 'fixed',
            top: `${panelPos.top}px`,
            left: `${panelPos.left}px`,
            width: '360px',
            maxHeight: `calc(100vh - ${panelPos.top}px - 16px)`,
            overflowY: 'auto',
            overflowX: 'visible',
            background: 'var(--glass-bg-deep)',
            backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid var(--border-hover)', borderRadius: '20px',
            padding: '1.35rem',
            boxShadow: '0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
            zIndex: 9999,
            animation: 'panelIn 0.22s cubic-bezier(0.175,0.885,0.32,1.275)',
          }}
          >
            {/* Panel header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FilterIcon color="rgba(var(--accent-rgb),0.75)" />
                <span style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Filters</span>
              </div>
              <button onClick={clearAllFilters}
                style={{ fontSize: '0.7rem', color: 'var(--text-ghost)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '6px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-sold)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-ghost)'}
              >Clear all</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Sort — live apply */}
              <div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '1.6px', textTransform: 'uppercase', color: 'var(--text-ghost)', fontWeight: '700', marginBottom: '0.55rem' }}>Sort by Price</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {sortOptions.map(opt => (
                    <button key={opt.value}
                      onClick={() => setFilters(f => ({ ...f, sortPrice: opt.value }))}
                      style={{
                        flex: 1, padding: '0.48rem 0.4rem', fontSize: '0.74rem', fontWeight: '700',
                        borderRadius: '9px', cursor: 'pointer', transition: 'all 0.18s ease',
                        background: filters.sortPrice === opt.value ? 'linear-gradient(135deg, rgba(var(--accent-rgb),0.22), rgba(var(--accent-rgb),0.1))' : 'var(--bg-input)',
                        border: filters.sortPrice === opt.value ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                        color: filters.sortPrice === opt.value ? 'var(--accent-alt)' : 'var(--text-muted)',
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }} />

              {/* Category — live apply */}
              <div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '1.6px', textTransform: 'uppercase', color: 'var(--text-ghost)', fontWeight: '700', marginBottom: '0.55rem' }}>Category</div>
                <FilterCategorySelect
                  value={filters.category}
                  onChange={val => setCategory(val)}
                  options={categories}
                  placeholder="All Categories"
                />
              </div>

              {/* Subcategory chips — live apply */}
              {subcats.length > 0 && (
                <div style={{ animation: 'chipIn 0.2s ease' }}>
                  <div style={{ fontSize: '0.6rem', letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(var(--accent-rgb),0.5)', fontWeight: '700', marginBottom: '0.55rem' }}>{subLabel}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {subcats.map(s => (
                      <button key={s}
                        onClick={() => setFilters(f => ({ ...f, subcategory: f.subcategory === s ? '' : s }))}
                        style={{
                          padding: '0.3rem 0.7rem', fontSize: '0.75rem', fontWeight: '600',
                          borderRadius: '20px', cursor: 'pointer', transition: 'all 0.15s ease',
                          background: filters.subcategory === s ? 'rgba(var(--accent-rgb),0.18)' : 'var(--bg-input)',
                          border: filters.subcategory === s ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                          color: filters.subcategory === s ? 'var(--accent-alt)' : 'var(--text-muted)',
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Specs — smart suggestions + free type */}
              {specFields.length > 0 && (
                <div style={{ animation: 'chipIn 0.25s ease' }}>
                  <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1.1rem' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(var(--accent-rgb),0.55)" strokeWidth="2.2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                    </svg>
                    <span style={{ fontSize: '0.6rem', letterSpacing: '1.6px', textTransform: 'uppercase', color: 'var(--text-ghost)', fontWeight: '700' }}>Specifications</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    {specFields.map(f => (
                      <div key={f.key}>
                        <div style={{ fontSize: '0.58rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: '700', marginBottom: '0.3rem' }}>{f.label}</div>
                        <FilterSpecInput
                          fieldKey={f.key}
                          value={filters.specs[f.key] || ''}
                          placeholder={f.placeholder}
                          onChange={val => setFilters(d => ({ ...d, specs: { ...d.specs, [f.key]: val } }))}
                          suggestions={(specSuggestionsMap[filters.category] || {})[f.key] || []}
                          openKey={openSpecKey}
                          setOpenKey={setOpenSpecKey}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
      , document.body)}

      {/* ── Status dropdown ── */}
      {showStatusMenu && createPortal(
        <div ref={statusMenuRef} style={{
          position: 'fixed', top: `${statusMenuPos.top}px`, left: `${statusMenuPos.left}px`,
          background: 'var(--glass-bg-deep)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border)', borderRadius: '16px',
          padding: '0.6rem', minWidth: '170px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          zIndex: 9999,
          animation: 'panelIn 0.18s cubic-bezier(0.175,0.885,0.32,1.275)',
        }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--text-ghost)', fontWeight: '800', padding: '0.35rem 0.85rem 0.65rem' }}>Show Status</div>
          {statusOptions.map(s => {
            const isOn = filters.statuses.includes(s)
            const meta = statusMeta[s]
            return (
              <div key={s} onClick={() => toggleStatus(s)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s ease', background: isOn ? 'var(--bg-card)' : 'transparent', marginBottom: '2px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = isOn ? 'var(--bg-card)' : 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOn ? meta.color : 'var(--text-ghost)', display: 'inline-block', transition: 'background 0.2s', boxShadow: isOn ? `0 0 6px ${meta.color}80` : 'none' }} />
                  <span style={{ fontSize: '0.83rem', fontWeight: '600', color: isOn ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'color 0.15s' }}>{meta.label}</span>
                </div>
                <div style={{ width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0, border: isOn ? 'none' : '1.5px solid var(--border)', background: isOn ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: isOn ? '0 2px 8px var(--accent-glow)' : 'none' }}>
                  {isOn && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </div>
            )
          })}
        </div>
      , document.body)}

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center', marginBottom: '2rem' }}>
          {chips.map(chip => <FilterChip key={chip.id} label={chip.label} onRemove={chip.remove} />)}
          {chips.length > 1 && (
            <button onClick={clearAllFilters}
              style={{ fontSize: '0.7rem', padding: '0.28rem 0.7rem', background: 'none', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text-ghost)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-sold)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-ghost)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >Clear all ×</button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading items...</p>
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-error)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '20px', color: 'var(--color-sold)' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{error}</p>
          <button onClick={() => setFilters(f => ({ ...f }))} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: '10px', color: 'var(--color-sold)', cursor: 'pointer', fontSize: '0.85rem' }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <p style={{ color: 'var(--text-ghost)', fontSize: '0.78rem', marginBottom: '1.25rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
          </p>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-faint)', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>∅</div>
              <p style={{ fontSize: '1rem', fontWeight: '500' }}>No items match your filters.</p>
              <button onClick={clearAllFilters} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', borderRadius: '10px', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>Clear Filters</button>
            </div>
          ) : (
            <div className="home-grid" style={{
              display: 'grid',
              gridTemplateColumns:
                gridSize === 1 ? '1fr'
                : gridSize === 2 ? 'repeat(2, 1fr)'
                : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: gridSize === 1 ? '0.75rem' : '1.25rem',
            }}>
              {filteredItems.map(item => <ItemCard key={item.id} item={item} isWatching={watchedIds.has(item.id)} gridSize={gridSize} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Home