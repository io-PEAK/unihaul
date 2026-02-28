import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'

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
  'Other':            [],
}

const subcategoryLabel = {
  'Clothing': 'Size', 'Books & Notes': 'Semester',
  'Electronics': 'Type', 'Furniture': 'Type', 'Sports & Fitness': 'Sport',
}

const specFieldsMap = {
  'Electronics': [
    { key: 'brand',     label: 'Brand',     placeholder: 'e.g. Dell, Apple, Samsung', span: 1 },
    { key: 'ram',       label: 'RAM',        placeholder: 'e.g. 8GB, 16GB',           span: 1 },
    { key: 'storage',   label: 'Storage',    placeholder: 'e.g. 256GB, 1TB',          span: 1 },
    { key: 'processor', label: 'Processor',  placeholder: 'e.g. Intel i5, M2',        span: 1 },
    { key: 'display',   label: 'Display',    placeholder: 'e.g. 15.6", 4K OLED',      span: 2 },
  ],
  'Clothing': [
    { key: 'gender', label: 'Gender', placeholder: 'e.g. Male, Female, Unisex', span: 1 },
    { key: 'color',  label: 'Color',  placeholder: 'e.g. Black, Navy Blue',     span: 1 },
    { key: 'type',   label: 'Type',   placeholder: 'e.g. T-shirt, Jeans',       span: 2 },
  ],
  'Books & Notes': [
    { key: 'subject', label: 'Subject', placeholder: 'e.g. Physics, Maths',   span: 1 },
    { key: 'author',  label: 'Author',  placeholder: 'e.g. H.C. Verma',       span: 1 },
    { key: 'edition', label: 'Edition', placeholder: 'e.g. 3rd Edition 2023', span: 2 },
  ],
  'Furniture': [
    { key: 'material',   label: 'Material',   placeholder: 'e.g. Solid Wood, Metal', span: 1 },
    { key: 'color',      label: 'Color',      placeholder: 'e.g. Brown, White',      span: 1 },
    { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 120 × 60 cm',       span: 2 },
  ],
  'Sports & Fitness': [
    { key: 'sport', label: 'Sport', placeholder: 'e.g. Cricket, Football', span: 1 },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Nike, Adidas, SG',  span: 1 },
    { key: 'size',  label: 'Size',  placeholder: 'e.g. Size 7, XL',        span: 2 },
  ],
  'Stationery': [
    { key: 'type',  label: 'Type',  placeholder: 'e.g. Notebook, Pen set', span: 1 },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Classmate, Natraj',  span: 1 },
  ],
  'Appliances': [
    { key: 'brand',    label: 'Brand',    placeholder: 'e.g. Samsung, LG, Whirlpool', span: 1 },
    { key: 'capacity', label: 'Capacity', placeholder: 'e.g. 5kg, 200L',              span: 1 },
    { key: 'color',    label: 'Color',    placeholder: 'e.g. White, Silver',           span: 2 },
  ],
  'Games & Hobbies': [
    { key: 'platform', label: 'Platform', placeholder: 'e.g. PS5, PC, Mobile',    span: 1 },
    { key: 'type',     label: 'Type',     placeholder: 'e.g. Strategy, Action',   span: 1 },
    { key: 'brand',    label: 'Brand',    placeholder: 'e.g. Sony, Nintendo, EA', span: 2 },
  ],
  'Services': [
    { key: 'mode',       label: 'Mode',       placeholder: 'e.g. Online, Offline', span: 1 },
    { key: 'experience', label: 'Experience', placeholder: 'e.g. 2 years',         span: 1 },
  ],
  'Food & Drinks': [
    { key: 'diet',        label: 'Diet',     placeholder: 'e.g. Vegetarian, Vegan', span: 1 },
    { key: 'contains',    label: 'Contains', placeholder: 'e.g. Nuts, Dairy',       span: 1 },
  ],
}

// ─── Spec suggestions ─────────────────────────────────────────────────────────
const specSuggestionsMap = {
  'Electronics': {
    brand:     ['Apple', 'Dell', 'HP', 'Lenovo', 'Samsung', 'Sony', 'Asus', 'Acer', 'Microsoft', 'LG', 'OnePlus', 'Xiaomi'],
    ram:       ['2GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
    storage:   ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
    processor: ['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M1', 'Apple M2', 'Apple M3', 'Snapdragon'],
    display:   ['11"', '13"', '14"', '15.6"', '16"', 'Full HD', '4K', 'OLED', 'Retina Display'],
  },
  'Clothing': {
    gender: ['Male', 'Female', 'Unisex', 'Kids'],
    color:  ['Black', 'White', 'Navy Blue', 'Grey', 'Red', 'Green', 'Brown', 'Beige', 'Multicolor'],
    type:   ['T-shirt', 'Shirt', 'Jeans', 'Trousers', 'Jacket', 'Hoodie', 'Kurta', 'Saree', 'Shorts', 'Dress', 'Sweater'],
  },
  'Books & Notes': {
    subject: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science', 'Economics', 'History', 'Geography'],
    author:  ['H.C. Verma', 'R.D. Sharma', 'S.L. Arora', 'NCERT', 'Arihant', 'DC Pandey', 'P.K. Nag'],
    edition: ['1st Edition', '2nd Edition', '3rd Edition', '4th Edition', '2022 Edition', '2023 Edition', '2024 Edition', 'Latest Edition'],
  },
  'Furniture': {
    material:   ['Wood', 'Solid Wood', 'Plywood', 'Metal', 'Steel', 'Plastic', 'Glass', 'Cane', 'MDF'],
    color:      ['Brown', 'White', 'Black', 'Natural Wood', 'Walnut', 'Oak', 'Mahogany'],
    dimensions: ['Single Bed (90×190cm)', 'Double Bed (120×190cm)', '2-Seater', '3-Seater', '4-Seater', 'L-Shaped'],
  },
  'Sports & Fitness': {
    sport: ['Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis', 'Table Tennis', 'Gym', 'Yoga', 'Cycling', 'Swimming'],
    brand: ['Nike', 'Adidas', 'Puma', 'Reebok', 'SG', 'MRF', 'Yonex', 'Decathlon', 'Under Armour'],
    size:  ['XS', 'S', 'M', 'L', 'XL', 'Size 3', 'Size 4', 'Size 5', 'Size 6', 'Size 7'],
  },
  'Stationery': {
    type:  ['Notebook', 'Pen Set', 'Pencil Set', 'Marker Set', 'Geometry Box', 'Art Kit', 'Calculator', 'Highlighters', 'Sticky Notes'],
    brand: ['Classmate', 'Natraj', 'Camlin', 'Reynolds', 'Cello', 'Faber-Castell', 'Staedtler', 'Casio'],
  },
  'Appliances': {
    brand:    ['Samsung', 'LG', 'Whirlpool', 'Haier', 'Godrej', 'Voltas', 'IFB', 'Bosch', 'Bajaj', 'Philips'],
    capacity: ['5L', '10L', '15L', '5kg', '6.5kg', '7kg', '8kg', '150L', '200L', '250L', '300L'],
    color:    ['White', 'Silver', 'Black', 'Graphite', 'Grey'],
  },
  'Games & Hobbies': {
    platform: ['PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'PC', 'Nintendo Switch', 'Mobile', 'Board Game'],
    type:     ['Action', 'Strategy', 'RPG', 'Sports', 'Racing', 'Puzzle', 'Adventure', 'Simulation', 'FPS'],
    brand:    ['Sony', 'Microsoft', 'Nintendo', 'EA', 'Ubisoft', 'Activision', 'Hasbro'],
  },
  'Services': {
    mode:       ['Online', 'Offline', 'Both Online & Offline'],
    experience: ['Beginner', '6 Months', '1 Year', '2 Years', '3+ Years', 'Expert'],
  },
  'Food & Drinks': {
    type:     ['Snack', 'Full Meal', 'Dessert', 'Beverage', 'Breakfast', 'Homemade', 'Packaged'],
    diet:     ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Gluten-Free'],
    contains: ['No Allergens', 'Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Shellfish'],
  },
}

// ─── Shared dropdown item ────────────────────────────────────────────────────
function DropItem({ label, onSelect, isFirst, isLast, active }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onMouseDown={e => { e.preventDefault(); onSelect() }}
      style={{
        padding: '0.52rem 0.9rem', cursor: 'pointer', fontSize: '0.84rem',
        color: active ? '#f0a040' : hovered ? '#f0a040' : 'rgba(255,255,255,0.75)',
        background: active ? 'rgba(232,119,34,0.12)' : hovered ? 'rgba(232,119,34,0.08)' : 'transparent',
        borderTop: !isFirst ? '1px solid rgba(255,255,255,0.05)' : 'none',
        borderRadius: isLast ? '0 0 11px 11px' : '0',
        transition: 'all 0.1s ease',
        fontWeight: active || hovered ? '600' : '400',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}
    >
      {active && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="1,6 4,9 11,3" stroke="#f0a040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {!active && <span style={{ width: '9px' }} />}
      {label}
    </div>
  )
}

const dropdownMenuStyle = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99999,
  background: 'linear-gradient(160deg, rgba(20,20,28,0.99) 0%, rgba(13,13,20,0.99) 100%)',
  border: '1px solid rgba(232,119,34,0.25)', borderTop: 'none',
  borderRadius: '0 0 12px 12px', maxHeight: '200px', overflowY: 'auto',
  boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
}

// ─── CustomSelect — replaces native <select> with dark-themed dropdown ────────
function CustomSelect({ value, onChange, options, placeholder, focusKey, focusedField, setFocusedField, disabled }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const isFocused = focusedField === focusKey

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); if (isFocused) setFocusedField(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isFocused, setFocusedField])

  const selectedLabel = options.find(o => (o.value ?? o) === value)?.label ?? (typeof options[0] === 'string' ? value : null) ?? value

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={() => {
          if (disabled) return
          setFocusedField(open ? null : focusKey)
          setOpen(o => !o)
        }}
        style={{
          width: '100%', padding: '0.7rem 2.5rem 0.7rem 1rem',
          background: isFocused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
          border: isFocused ? '1px solid rgba(232,119,34,0.35)' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: open ? '12px 12px 0 0' : '12px',
          color: value ? 'white' : 'rgba(255,255,255,0.28)',
          fontSize: '0.9rem', fontWeight: '400', letterSpacing: '0.2px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none', textAlign: 'left', boxSizing: 'border-box',
          transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? selectedLabel : placeholder}
        </span>
        <span style={{
          position: 'absolute', right: '1rem', top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          transition: 'transform 0.2s', pointerEvents: 'none',
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.4)"><path d="M8 11L3 6h10z"/></svg>
        </span>
      </button>
      {open && !disabled && (
        <div style={{ ...dropdownMenuStyle, borderRadius: '0 0 12px 12px' }}>
          {options.map((opt, i) => {
            const val = opt.value ?? opt
            const lbl = opt.label ?? opt
            return (
              <DropItem key={val} label={lbl} active={val === value}
                isFirst={i === 0} isLast={i === options.length - 1}
                onSelect={() => { onChange(val); setOpen(false); setFocusedField(null) }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── SpecInput — one open at a time via openKey/setOpenKey ───────────────────
function SpecInput({ fieldKey, category, value, onChange, placeholder, openKey, setOpenKey, focusedField, setFocusedField }) {
  const wrapRef = useRef(null)
  const isOpen = openKey === fieldKey
  const isFocused = focusedField === `spec-${fieldKey}`

  const all = specSuggestionsMap[category]?.[fieldKey] || []
  const filtered = value
    ? all.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
    : all

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        if (isOpen) setOpenKey(null)
        if (isFocused) setFocusedField(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, isFocused, setOpenKey, setFocusedField])

  const showDrop = isOpen && filtered.length > 0

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpenKey(fieldKey) }}
        onFocus={() => { setFocusedField(`spec-${fieldKey}`); setOpenKey(fieldKey) }}
        style={{
          width: '100%', padding: '0.6rem 0.85rem',
          background: isFocused ? 'rgba(255,255,255,0.1)' : value ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
          border: isFocused ? '1px solid rgba(232,119,34,0.4)' : value ? '1px solid rgba(232,119,34,0.2)' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: showDrop ? '10px 10px 0 0' : '10px',
          color: 'white', fontSize: '0.83rem',
          outline: 'none', transition: 'background 0.2s, border 0.2s', boxSizing: 'border-box',
        }}
      />
      {showDrop && (
        <div style={{ ...dropdownMenuStyle, borderRadius: '0 0 10px 10px', maxHeight: '170px' }}>
          {filtered.map((s, i) => (
            <DropItem key={s} label={s} isFirst={i === 0} isLast={i === filtered.length - 1}
              onSelect={() => { onChange(s); setOpenKey(null); setFocusedField(null) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PostItem ─────────────────────────────────────────────────────────────────
function PostItem() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill

  const [form, setForm] = useState({
    title:       prefill?.title       || '',
    price:       prefill?.price       || '',
    category:    prefill?.category    || '',
    subcategory: prefill?.subcategory || '',
    description: prefill?.description || '',
    condition:   prefill?.condition   || '',
    quantity:    prefill?.quantity    || 1,
  })
  const [specs, setSpecs]               = useState(prefill?.specs || {})
  const [focusedField, setFocusedField] = useState(null)
  const [openSpecKey, setOpenSpecKey]   = useState(null)
  const [btnHovered, setBtnHovered]     = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [success, setSuccess]           = useState(false)

  const subcategories = subcategoryMap[form.category] || []
  const specFields    = specFieldsMap[form.category]  || []

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'category') {
      setForm(f => ({ ...f, category: value, subcategory: '' }))
      setSpecs({})
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.title || !form.price || !form.category || !form.condition) {
      setError('Title, price, category and condition are required.')
      return
    }
    if (parseFloat(form.price) <= 0) { setError('Price must be greater than ₹0.'); return }
    if (parseInt(form.quantity) < 1) { setError('Quantity must be at least 1.'); return }
    const cleanSpecs = Object.fromEntries(Object.entries(specs).filter(([, v]) => v && v.trim() !== ''))
    try {
      setLoading(true)
      await API.post('/items', {
        title:       form.title,
        price:       parseFloat(form.price),
        category:    form.category,
        subcategory: form.subcategory || null,
        description: form.description,
        condition:   form.condition,
        quantity:    parseInt(form.quantity),
        specs:       Object.keys(cleanSpecs).length > 0 ? cleanSpecs : null,
      })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to post item.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (name) => ({
    width: '100%', padding: '0.7rem 1rem',
    background: focusedField === name ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
    border: focusedField === name ? '1px solid rgba(232,119,34,0.35)' : '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', color: 'white', fontSize: '0.9rem',
    outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box',
    fontWeight: '400', letterSpacing: '0.2px',
  })

  const labelStyle = (name) => ({
    display: 'block', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase',
    color: focusedField === name ? 'rgba(232,119,34,0.7)' : 'rgba(255,255,255,0.35)',
    fontWeight: '700', marginBottom: '0.45rem', transition: 'color 0.3s ease',
  })

  const selectStyle = (name) => ({
    ...inputStyle(name),
    appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
    paddingRight: '2.5rem', cursor: 'pointer',
  })

  const ArrowIcon = () => (
    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
      <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.4)"><path d="M8 11L3 6h10z"/></svg>
    </div>
  )

  return (
    <div
      onClick={() => navigate('/')}
      style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', cursor: 'default' }}
    >
      <style>{`
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #1a1225; color: white; }
        @keyframes specsIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '540px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.75rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
          position: 'relative', overflow: 'visible',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', borderRadius: '24px 24px 0 0' }} />

        <div style={{ marginBottom: '2.25rem' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: '1.05', marginBottom: '0.6rem', color: 'white' }}>
            {prefill ? 'Relist' : 'List an'}<br />
            <span style={{ background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Item.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: '400' }}>
            {prefill ? 'Edit the details and repost your listing' : 'Fill in the details to post your listing'}
          </p>
        </div>

        {success && (
          <div style={{ marginBottom: '1.25rem', padding: '1rem 1.1rem', background: 'linear-gradient(135deg, rgba(81,207,102,0.08), rgba(64,192,87,0.04))', border: '1px solid rgba(81,207,102,0.25)', borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(81,207,102,0.4), transparent)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(81,207,102,0.15)', border: '1px solid rgba(81,207,102,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#51cf66" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#51cf66', marginBottom: '2px' }}>Listing Published</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>Redirecting to your dashboard…</div>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '12px', color: '#ff6b6b', fontSize: '0.85rem', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ overflow: 'visible' }}>

          {/* Title + Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.15rem' }}>
            <div>
              <label style={labelStyle('title')}>Title</label>
              <input name="title" type="text" value={form.title} onChange={handleChange} onFocus={() => setFocusedField('title')} onBlur={() => setFocusedField(null)} placeholder="e.g. Physics Textbook" style={inputStyle('title')} />
            </div>
            <div>
              <label style={labelStyle('price')}>Price (₹)</label>
              <input name="price" type="number" min="1" step="1" value={form.price} onChange={handleChange} onFocus={() => setFocusedField('price')} onBlur={() => setFocusedField(null)} placeholder="e.g. 299" style={inputStyle('price')} />
            </div>
          </div>

          {/* Category + Condition */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.15rem' }}>
            <div>
              <label style={labelStyle('category')}>Category</label>
              <CustomSelect
                value={form.category}
                onChange={val => { setForm(f => ({ ...f, category: val, subcategory: '' })); setSpecs({}) }}
                options={[...categories.map(c => ({ value: c, label: c }))]}
                placeholder="Select category"
                focusKey="category" focusedField={focusedField} setFocusedField={setFocusedField}
              />
            </div>
            <div>
              <label style={labelStyle('condition')}>Condition</label>
              <CustomSelect
                value={form.condition}
                onChange={val => setForm(f => ({ ...f, condition: val }))}
                options={['Like New', 'Good', 'Fair', 'Poor'].map(c => ({ value: c, label: c }))}
                placeholder="Select condition"
                focusKey="condition" focusedField={focusedField} setFocusedField={setFocusedField}
              />
            </div>
          </div>

          {/* Subcategory + Quantity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.15rem' }}>
            <div>
              <label style={labelStyle('subcategory')}>{subcategoryLabel[form.category] || 'Subcategory'}</label>
              <CustomSelect
                value={form.subcategory}
                onChange={val => setForm(f => ({ ...f, subcategory: val }))}
                options={subcategories.map(s => ({ value: s, label: s }))}
                placeholder={subcategories.length === 0 ? 'N/A' : 'Select...'}
                focusKey="subcategory" focusedField={focusedField} setFocusedField={setFocusedField}
                disabled={subcategories.length === 0}
              />
            </div>
            <div>
              <label style={labelStyle('quantity')}>Quantity</label>
              <input name="quantity" type="number" min="1" max="99" step="1" value={form.quantity} onChange={handleChange} onFocus={() => setFocusedField('quantity')} onBlur={() => setFocusedField(null)} placeholder="1" style={inputStyle('quantity')} />
            </div>
          </div>

          {/* ── Specs with suggestions ────────────────────────────────────── */}
          {specFields.length > 0 && (
            <div style={{
              marginBottom: '1.15rem',
              background: 'rgba(232,119,34,0.04)',
              border: '1px solid rgba(232,119,34,0.15)',
              borderRadius: '16px', padding: '1.15rem',
              animation: 'specsIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
              overflow: 'visible', position: 'relative', zIndex: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(232,119,34,0.85)" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                </svg>
                <span style={{ fontSize: '0.62rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(232,119,34,0.9)', fontWeight: '800' }}>
                  {form.category} Specifications
                </span>
                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', fontWeight: '500', marginLeft: 'auto' }}>
                  type or pick a suggestion
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', overflow: 'visible' }}>
                {specFields.map(field => (
                  <div key={field.key} style={{ gridColumn: field.span === 2 ? 'span 2' : 'span 1', overflow: 'visible' }}>
                    <div style={{
                      fontSize: '0.6rem', letterSpacing: '1.2px', textTransform: 'uppercase',
                      color: focusedField === `spec-${field.key}` ? 'rgba(232,119,34,0.75)' : 'rgba(255,255,255,0.5)',
                      fontWeight: '700', marginBottom: '0.35rem', transition: 'color 0.2s',
                    }}>
                      {field.label}
                    </div>
                    <SpecInput
                      fieldKey={field.key}
                      category={form.category}
                      value={specs[field.key] || ''}
                      onChange={val => setSpecs(s => ({ ...s, [field.key]: val }))}
                      placeholder={field.placeholder}
                      openKey={openSpecKey}
                      setOpenKey={setOpenSpecKey}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={labelStyle('description')}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} onFocus={() => setFocusedField('description')} onBlur={() => setFocusedField(null)} placeholder="Condition, age, any defects, reason for selling..." rows="4" style={{ ...inputStyle('description'), resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }} />
          </div>

          <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', margin: '1.25rem 0' }} />

          <button
            type="submit" disabled={loading || success}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              width: '100%', padding: '0.8rem',
              background: loading || success ? 'rgba(255,255,255,0.08)' : btnHovered ? 'linear-gradient(135deg, #f09030, #e87722)' : 'linear-gradient(135deg, #e87722, #f09030)',
              color: loading || success ? 'rgba(255,255,255,0.3)' : 'white',
              border: 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700',
              cursor: loading || success ? 'not-allowed' : 'pointer',
              letterSpacing: '1px', textTransform: 'uppercase',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: btnHovered && !loading ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: btnHovered && !loading ? '0 15px 35px rgba(232,119,34,0.35)' : '0 4px 15px rgba(232,119,34,0.2)',
            }}
          >{loading ? 'Posting...' : success ? '✓ Posted!' : 'Post Listing →'}</button>
        </form>
      </div>
    </div>
  )
}

export default PostItem