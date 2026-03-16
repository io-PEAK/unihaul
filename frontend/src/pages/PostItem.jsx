import { useState, useRef, useEffect, useCallback } from 'react'
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
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Dell, Apple, Samsung', span: 1 },
    { key: 'ram', label: 'RAM', placeholder: 'e.g. 8GB, 16GB', span: 1 },
    { key: 'storage', label: 'Storage', placeholder: 'e.g. 256GB, 1TB', span: 1 },
    { key: 'processor', label: 'Processor', placeholder: 'e.g. Intel i5, M2', span: 1 },
    { key: 'display', label: 'Display', placeholder: 'e.g. 15.6", 4K OLED', span: 2 },
  ],
  'Clothing': [
    { key: 'gender', label: 'Gender', placeholder: 'e.g. Male, Female, Unisex', span: 1 },
    { key: 'color', label: 'Color', placeholder: 'e.g. Black, Navy Blue', span: 1 },
    { key: 'type', label: 'Type', placeholder: 'e.g. T-shirt, Jeans', span: 2 },
  ],
  'Books & Notes': [
    { key: 'subject', label: 'Subject', placeholder: 'e.g. Physics, Maths', span: 1 },
    { key: 'author', label: 'Author', placeholder: 'e.g. H.C. Verma', span: 1 },
    { key: 'edition', label: 'Edition', placeholder: 'e.g. 3rd Edition 2023', span: 2 },
  ],
  'Furniture': [
    { key: 'material', label: 'Material', placeholder: 'e.g. Solid Wood, Metal', span: 1 },
    { key: 'color', label: 'Color', placeholder: 'e.g. Brown, White', span: 1 },
    { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 120 × 60 cm', span: 2 },
  ],
  'Sports & Fitness': [
    { key: 'sport', label: 'Sport', placeholder: 'e.g. Cricket, Football', span: 1 },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Nike, Adidas, SG', span: 1 },
    { key: 'size', label: 'Size', placeholder: 'e.g. Size 7, XL', span: 2 },
  ],
  'Stationery': [
    { key: 'type', label: 'Type', placeholder: 'e.g. Notebook, Pen set', span: 1 },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Classmate, Natraj', span: 1 },
  ],
  'Appliances': [
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Samsung, LG, Whirlpool', span: 1 },
    { key: 'capacity', label: 'Capacity', placeholder: 'e.g. 5kg, 200L', span: 1 },
    { key: 'color', label: 'Color', placeholder: 'e.g. White, Silver', span: 2 },
  ],
  'Games & Hobbies': [
    { key: 'platform', label: 'Platform', placeholder: 'e.g. PS5, PC, Mobile', span: 1 },
    { key: 'type', label: 'Type', placeholder: 'e.g. Strategy, Action', span: 1 },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Sony, Nintendo, EA', span: 2 },
  ],
  'Services': [
    { key: 'mode', label: 'Mode', placeholder: 'e.g. Online, Offline', span: 1 },
    { key: 'experience', label: 'Experience', placeholder: 'e.g. 2 years', span: 1 },
  ],
  'Food & Drinks': [
    { key: 'diet', label: 'Diet', placeholder: 'e.g. Vegetarian, Vegan', span: 1 },
    { key: 'contains', label: 'Contains', placeholder: 'e.g. Nuts, Dairy', span: 1 },
  ],
}

const specSuggestionsMap = {
  'Electronics': {
    brand: ['Apple', 'Dell', 'HP', 'Lenovo', 'Samsung', 'Sony', 'Asus', 'Acer', 'Microsoft', 'LG', 'OnePlus', 'Xiaomi'],
    ram: ['2GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
    storage: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
    processor: ['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M1', 'Apple M2', 'Apple M3', 'Snapdragon'],
    display: ['11"', '13"', '14"', '15.6"', '16"', 'Full HD', '4K', 'OLED', 'Retina Display'],
  },
  'Clothing': {
    gender: ['Male', 'Female', 'Unisex', 'Kids'],
    color: ['Black', 'White', 'Navy Blue', 'Grey', 'Red', 'Green', 'Brown', 'Beige', 'Multicolor'],
    type: ['T-shirt', 'Shirt', 'Jeans', 'Trousers', 'Jacket', 'Hoodie', 'Kurta', 'Saree', 'Shorts', 'Dress', 'Sweater'],
  },
  'Books & Notes': {
    subject: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science', 'Economics', 'History', 'Geography'],
    author: ['H.C. Verma', 'R.D. Sharma', 'S.L. Arora', 'NCERT', 'Arihant', 'DC Pandey', 'P.K. Nag'],
    edition: ['1st Edition', '2nd Edition', '3rd Edition', '4th Edition', '2022 Edition', '2023 Edition', '2024 Edition', 'Latest Edition'],
  },
  'Furniture': {
    material: ['Wood', 'Solid Wood', 'Plywood', 'Metal', 'Steel', 'Plastic', 'Glass', 'Cane', 'MDF'],
    color: ['Brown', 'White', 'Black', 'Natural Wood', 'Walnut', 'Oak', 'Mahogany'],
    dimensions: ['Single Bed (90×190cm)', 'Double Bed (120×190cm)', '2-Seater', '3-Seater', '4-Seater', 'L-Shaped'],
  },
  'Sports & Fitness': {
    sport: ['Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis', 'Table Tennis', 'Gym', 'Yoga', 'Cycling', 'Swimming'],
    brand: ['Nike', 'Adidas', 'Puma', 'Reebok', 'SG', 'MRF', 'Yonex', 'Decathlon', 'Under Armour'],
    size: ['XS', 'S', 'M', 'L', 'XL', 'Size 3', 'Size 4', 'Size 5', 'Size 6', 'Size 7'],
  },
  'Stationery': {
    type: ['Notebook', 'Pen Set', 'Pencil Set', 'Marker Set', 'Geometry Box', 'Art Kit', 'Calculator', 'Highlighters', 'Sticky Notes'],
    brand: ['Classmate', 'Natraj', 'Camlin', 'Reynolds', 'Cello', 'Faber-Castell', 'Staedtler', 'Casio'],
  },
  'Appliances': {
    brand: ['Samsung', 'LG', 'Whirlpool', 'Haier', 'Godrej', 'Voltas', 'IFB', 'Bosch', 'Bajaj', 'Philips'],
    capacity: ['5L', '10L', '15L', '5kg', '6.5kg', '7kg', '8kg', '150L', '200L', '250L', '300L'],
    color: ['White', 'Silver', 'Black', 'Graphite', 'Grey'],
  },
  'Games & Hobbies': {
    platform: ['PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'PC', 'Nintendo Switch', 'Mobile', 'Board Game'],
    type: ['Action', 'Strategy', 'RPG', 'Sports', 'Racing', 'Puzzle', 'Adventure', 'Simulation', 'FPS'],
    brand: ['Sony', 'Microsoft', 'Nintendo', 'EA', 'Ubisoft', 'Activision', 'Hasbro'],
  },
  'Services': {
    mode: ['Online', 'Offline', 'Both Online & Offline'],
    experience: ['Beginner', '6 Months', '1 Year', '2 Years', '3+ Years', 'Expert'],
  },
  'Food & Drinks': {
    type: ['Snack', 'Full Meal', 'Dessert', 'Beverage', 'Breakfast', 'Homemade', 'Packaged'],
    diet: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Gluten-Free'],
    contains: ['No Allergens', 'Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Shellfish'],
  },
}

// ─── Spec Validators ──────────────────────────────────────────────────────
const noLetters    = v => !/[a-zA-Z]/.test(v)
const pureNum      = v => /^\d+$/.test(v.trim())
const startsSpecial = v => /^[^a-zA-Z0-9]/.test(v.trim())
const badStart     = v => startsSpecial(v) ? 'Can\'t start with a special character' : null
const specValidators = {
  'Electronics': {
    brand:     v => badStart(v) || (pureNum(v) ? 'Enter a brand name' : v.length < 2 ? 'Too short' : null),
    ram:       v => badStart(v) || (!/^\d+\s*(gb|tb|mb)/i.test(v.trim()) ? 'e.g. 8GB, 16GB' : null),
    storage:   v => badStart(v) || (!/^\d+\s*(gb|tb|mb)/i.test(v.trim()) ? 'e.g. 256GB, 1TB' : null),
    processor: v => badStart(v) || (pureNum(v) ? 'Enter processor name' : v.length < 2 ? 'Too short' : null),
    display:   v => badStart(v) || (pureNum(v) ? 'e.g. 15.6", 4K OLED' : null),
  },
  'Clothing': {
    gender: v => badStart(v) || (!(/[a-zA-Z]/.test(v)) ? 'Enter gender — e.g. Male, Female' : null),
    color:  v => badStart(v) || (pureNum(v) ? 'Enter a color name' : v.length < 4 ? 'Too short' : null),
    type:   v => badStart(v) || (pureNum(v) ? 'Enter clothing type' : v.length < 4 ? 'Too short' : null),
  },
  'Books & Notes': {
    subject: v => badStart(v) || (pureNum(v) ? 'Enter subject name' : !(/^[a-zA-Z]/.test(v.trim())) ? 'Must start with a letter' : v.length < 5 ? 'Too short' : null),
    author:  v => badStart(v) || (pureNum(v) ? 'Enter author name'  : !(/^[a-zA-Z]/.test(v.trim())) ? 'Must start with a letter' : v.length < 5 ? 'Too short' : null),
  },
  'Furniture': {
    material:   v => badStart(v) || (pureNum(v) ? 'Enter material name' : v.length < 2 ? 'Too short' : null),
    color:      v => badStart(v) || (pureNum(v) ? 'Enter a color name'  : v.length < 2 ? 'Too short' : null),
    dimensions: v => badStart(v) || (pureNum(v) ? 'Add a unit — e.g. 120×60 cm' : null),
  },
  'Sports & Fitness': {
    sport: v => badStart(v) || (pureNum(v) ? 'Enter sport name'  : v.length < 2 ? 'Too short' : null),
    brand: v => badStart(v) || (pureNum(v) ? 'Enter a brand name' : v.length < 2 ? 'Too short' : null),
  },
  'Stationery': {
    type:  v => badStart(v) || (pureNum(v) ? 'Enter item type'    : v.length < 2 ? 'Too short' : null),
    brand: v => badStart(v) || (pureNum(v) ? 'Enter a brand name' : v.length < 2 ? 'Too short' : null),
  },
  'Appliances': {
    brand:    v => badStart(v) || (pureNum(v) ? 'Enter a brand name' : v.length < 2 ? 'Too short' : null),
    capacity: v => badStart(v) || (!/^\d+\s*(l|ltr|litre|kg|kgs|g|ml|w|kw)/i.test(v.trim()) ? 'e.g. 5kg, 200L' : null),
    color:    v => badStart(v) || (pureNum(v) ? 'Enter a color name' : v.length < 2 ? 'Too short' : null),
  },
  'Games & Hobbies': {
    platform: v => badStart(v) || (pureNum(v) ? 'e.g. PS5, PC, Switch' : null),
    type:     v => badStart(v) || (pureNum(v) ? 'Enter genre name'   : v.length < 2 ? 'Too short' : null),
    brand:    v => badStart(v) || (pureNum(v) ? 'Enter a brand name'  : v.length < 2 ? 'Too short' : null),
  },
  'Food & Drinks': {
    diet:     v => badStart(v) || (!(/[a-zA-Z]/.test(v)) ? 'e.g. Vegetarian, Vegan' : v.length < 2 ? 'Too short' : null),
    contains: v => badStart(v) || (!(/[a-zA-Z]/.test(v)) ? 'e.g. Nuts, Dairy'       : v.length < 2 ? 'Too short' : null),
  },
}

function DropItem({ label, onSelect, isFirst, isLast, active }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onMouseDown={e => { e.preventDefault(); onSelect() }}
      style={{
        padding: '0.52rem 0.9rem', cursor: 'pointer', fontSize: '0.84rem',
        color: active ? 'var(--dropdown-item-active)' : hovered ? 'var(--dropdown-item-active)' : 'var(--dropdown-item-text)',
        background: active ? 'var(--dropdown-item-active-bg)' : hovered ? 'var(--dropdown-item-hover-bg)' : 'transparent',
        borderTop: !isFirst ? '1px solid var(--dropdown-divider)' : 'none',
        borderRadius: isLast ? '0 0 11px 11px' : '0',
        transition: 'all 0.1s ease',
        fontWeight: active || hovered ? '600' : '400',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}
    >
      {active && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="1,6 4,9 11,3" stroke="var(--dropdown-item-active)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {!active && <span style={{ width: '9px' }} />}
      {label}
    </div>
  )
}

const dropdownMenuStyle = {
  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99999,
  background: 'var(--dropdown-bg)',
  border: '1px solid var(--dropdown-border)', borderTop: 'none',
  borderRadius: '0 0 12px 12px', maxHeight: '200px', overflowY: 'auto',
  boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
}

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

  const selectedLabel = options.find(o => (o.value ?? o) === value)?.label ?? value

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button type="button" disabled={disabled}
        onMouseDown={() => { if (disabled) return; setFocusedField(open ? null : focusKey); setOpen(o => !o) }}
        style={{
          width: '100%', padding: '0.7rem 2.5rem 0.7rem 1rem',
          background: isFocused ? 'var(--select-bg-focus)' : 'var(--select-bg)',
          border: isFocused ? '1px solid var(--accent-border)' : '1px solid var(--select-border)',
          borderRadius: open ? '12px 12px 0 0' : '12px',
          color: value ? 'var(--text-primary)' : 'var(--select-placeholder)',
          fontSize: '0.9rem', cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none', textAlign: 'left', boxSizing: 'border-box',
          transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? selectedLabel : placeholder}
        </span>
        <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: 'transform 0.2s', pointerEvents: 'none' }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="var(--select-arrow)"><path d="M8 11L3 6h10z"/></svg>
        </span>
      </button>
      {open && !disabled && (
        <div className="pi-dropdown" style={dropdownMenuStyle}>
          {options.map((opt, i) => {
            const val = opt.value ?? opt; const lbl = opt.label ?? opt
            return <DropItem key={val} label={lbl} active={val === value} isFirst={i === 0} isLast={i === options.length - 1} onSelect={() => { onChange(val); setOpen(false); setFocusedField(null) }} />
          })}
        </div>
      )}
    </div>
  )
}

function SpecInput({ fieldKey, category, value, onChange, placeholder, openKey, setOpenKey, focusedField, setFocusedField }) {
  const wrapRef = useRef(null)
  const isOpen = openKey === fieldKey
  const isFocused = focusedField === `spec-${fieldKey}`
  const all = specSuggestionsMap[category]?.[fieldKey] || []
  const filtered = value ? all.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()) : all

  const validator = specValidators[category]?.[fieldKey]
  const [touched, setTouched] = useState(false)
  const inlineError = value && validator ? validator(value) : null

  useEffect(() => {
    function handler(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) { if (isOpen) setOpenKey(null); if (isFocused) setFocusedField(null) } }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, isFocused, setOpenKey, setFocusedField])

  const showDrop = isOpen && filtered.length > 0 && !inlineError
  const hasError = !!inlineError

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input type="text" value={value} placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpenKey(fieldKey) }}
        onFocus={() => { setFocusedField(`spec-${fieldKey}`); setOpenKey(fieldKey) }}
        onBlur={() => { setFocusedField(null); setTouched(true) }}
        style={{ width: '100%', padding: '0.6rem 0.85rem', background: isFocused ? 'var(--bg-input-focus)' : hasError ? 'rgba(255,107,107,0.06)' : 'var(--bg-input)', border: isFocused ? `1px solid ${hasError ? 'rgba(255,107,107,0.6)' : 'var(--accent-border)'}` : hasError ? '1px solid rgba(255,107,107,0.35)' : value ? '1px solid var(--accent-border)' : '1px solid var(--glass-border)', borderRadius: showDrop || hasError ? '10px 10px 0 0' : '10px', color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none', transition: 'background 0.2s, border 0.2s', boxSizing: 'border-box' }}
      />
      {showDrop && (
        <div className="pi-dropdown" style={{ ...dropdownMenuStyle, borderRadius: '0 0 10px 10px', maxHeight: '170px' }}>
          {filtered.map((s, i) => <DropItem key={s} label={s} isFirst={i === 0} isLast={i === filtered.length - 1} onSelect={() => { onChange(s); setOpenKey(null); setFocusedField(null); setTouched(false) }} />)}
        </div>
      )}
      {hasError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: '0.62rem', color: '#ff6b6b', fontWeight: '600' }}>{inlineError}</span>
        </div>
      )}
    </div>
  )
}

// ─── Image Preview Modal ───────────────────────────────────────────────────
function ImagePreviewModal({ src, index, total, onClose, onPrev, onNext }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'piModalIn 0.2s ease',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={src}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '85vw', maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: '14px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
          animation: 'piModalScale 0.28s cubic-bezier(0.175,0.885,0.32,1.275)',
          cursor: 'default',
        }}
      />

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem',
          width: '38px', height: '38px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-hover)',
          color: 'var(--text-secondary)', fontSize: '1rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = 'white' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
      >✕</button>

      {/* Counter */}
      <div style={{
        position: 'fixed', top: '1.4rem', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
        borderRadius: '20px', padding: '4px 14px',
        fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)',
        letterSpacing: '1px',
      }}>{index + 1} / {total}</div>

      {/* Prev arrow */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev() }}
          style={{
            position: 'fixed', left: '1.25rem', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-hover)',
            color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', fontSize: '1.1rem',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >‹</button>
      )}

      {/* Next arrow */}
      {total > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext() }}
          style={{
            position: 'fixed', right: '1.25rem', top: '50%', transform: 'translateY(-50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-hover)',
            color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', fontSize: '1.1rem',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >›</button>
      )}

      <style>{`
        @keyframes piModalIn    { from{opacity:0} to{opacity:1} }
        @keyframes piModalScale { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  )
}

// ─── Image Upload Zone ─────────────────────────────────────────────────────
function ImageUploadZone({ images, onAdd, onRemove, onReorder, uploading, onClearImageError }) {
  const fileRef = useRef(null)
  const dragIdx = useRef(null)
  const [dragOver, setDragOver]       = useState(false)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [previewIdx, setPreviewIdx]   = useState(null)

  function handleFiles(files) {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 5 - images.length)
    if (valid.length) onAdd(valid)
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  function onDragStart(i) { dragIdx.current = i }
  function onDragEnterSlot(i) { setDragOverIdx(i) }
  function onDragEndSlot() {
    if (dragIdx.current !== null && dragOverIdx !== null && dragIdx.current !== dragOverIdx) {
      onReorder(dragIdx.current, dragOverIdx)
    }
    dragIdx.current = null; setDragOverIdx(null)
  }

  function handleThumbnailClick(e, i) {
    e.stopPropagation()
    if (images[i].uploading) return
    setPreviewIdx(i)
  }

  const MAX = 5
  const previewSrc = previewIdx !== null ? (images[previewIdx]?.url || images[previewIdx]?.preview) : null

  return (
    <>
      <div style={{ marginBottom: '1.15rem' }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Photos
          {images.length === 0 && <span style={{ color: 'var(--text-ghost)', fontWeight: '500', textTransform: 'none', letterSpacing: '0', fontSize: '0.6rem' }}>min. 2 required</span>}
          {images.length === 1 && <span style={{ color: 'rgba(255,107,107,0.7)', fontWeight: '600', textTransform: 'none', letterSpacing: '0', fontSize: '0.6rem' }}>1 more needed</span>}
          {images.length >= 2 && <span style={{ color: 'var(--accent)', fontWeight: '600', opacity: 0.7 }}>({images.length}/{MAX}) · drag to reorder</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
          {images.map((img, i) => (
            <div key={img._uid || img.url || img.preview}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnterSlot(i)}
              onDragEnd={onDragEndSlot}
              onDragOver={e => e.preventDefault()}
              style={{
                position: 'relative', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden',
                border: dragOverIdx === i ? '2px solid rgba(232,119,34,0.8)' : i === 0 ? '2px solid rgba(232,119,34,0.4)' : '2px solid rgba(255,255,255,0.06)',
                cursor: img.uploading ? 'wait' : 'pointer',
                transition: 'border 0.15s, transform 0.15s',
                transform: dragOverIdx === i ? 'scale(1.04)' : 'scale(1)',
                opacity: img.uploading ? 0.6 : 1,
              }}
              onClick={e => handleThumbnailClick(e, i)}
            >
              <img src={img.preview || img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />

              {/* Cover badge */}
              {i === 0 && (
                <div style={{ position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(232,119,34,0.9)', borderRadius: '5px', fontSize: '0.52rem', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'white', padding: '2px 6px' }}>Cover</div>
              )}

              {/* Uploading spinner */}
              {img.uploading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
                  <div style={{ width: '20px', height: '20px', border: '2.5px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'piSpin 0.7s linear infinite' }} />
                </div>
              )}

              {/* Hover overlay with zoom icon */}
              {!img.uploading && (
                <div
                  className="pi-hover-overlay"
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.18s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                >
                  <svg
                    width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2" strokeLinecap="round"
                    style={{ opacity: 0, transition: 'opacity 0.18s ease', pointerEvents: 'none' }}
                    className="pi-zoom-icon"
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </div>
              )}

              {/* Remove button */}
              {!img.uploading && (
                <button
                  onMouseDown={e => { e.stopPropagation(); onRemove(i) }}
                  onClick={e => e.stopPropagation()}
                  style={{ position: 'absolute', top: '5px', right: '5px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.75)', border: '1px solid var(--border-hover)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', zIndex: 2 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.85)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}

          {/* Add more slot */}
          {images.length < MAX && (
            <div
              onClick={() => { fileRef.current?.click(); onClearImageError?.() }}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                aspectRatio: '1', borderRadius: '10px', cursor: 'pointer',
                border: dragOver ? '2px dashed var(--border-dashed-hover)' : '2px dashed var(--border-dashed)',
                background: dragOver ? 'var(--accent-soft)' : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-dashed-hover)'; e.currentTarget.style.background = 'var(--accent-soft)' }}
              onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.borderColor = 'var(--border-dashed)'; e.currentTarget.style.background = 'transparent' } }}
            >
              {uploading
                ? <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'piSpin 0.7s linear infinite' }} />
                : <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-ghost)', fontWeight: '600', textAlign: 'center', letterSpacing: '0.3px' }}>{images.length === 0 ? 'Add photo' : 'Add more'}</span>
                  </>
              }
            </div>
          )}

          {/* Empty placeholder slots */}
          {Array.from({ length: Math.max(0, MAX - images.length - 1) }).map((_, i) => (
            <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }} />
          ))}
        </div>

        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />
      </div>

      {previewIdx !== null && previewSrc && (
        <ImagePreviewModal
          src={previewSrc}
          index={previewIdx}
          total={images.length}
          onClose={() => setPreviewIdx(null)}
          onPrev={() => setPreviewIdx(i => (i - 1 + images.length) % images.length)}
          onNext={() => setPreviewIdx(i => (i + 1) % images.length)}
        />
      )}

      <style>{`
        .pi-hover-overlay:hover .pi-zoom-icon { opacity: 1 !important; }
        .pi-dropdown::-webkit-scrollbar { display: none; }
        .pi-dropdown { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}

// ─── PostItem ──────────────────────────────────────────────────────────────
function PostItem() {
  const navigate = useNavigate()
  // ── Draggable back button ──────────────────────────────────
  const [draggable, setDraggable] = useState(() => {
    try { return JSON.parse(localStorage.getItem('floatingDraggable') ?? 'false') } catch { return false }
  })
  useEffect(() => {
    const sync = () => {
      try { setDraggable(JSON.parse(localStorage.getItem('floatingDraggable') ?? 'false')) } catch {}
    }
    window.addEventListener('floatingDraggableChanged', sync)
    return () => window.removeEventListener('floatingDraggableChanged', sync)
  }, [])
  const backRef = useRef(null)
  useEffect(() => {
    if (!backRef.current) return
    if (!draggable) {
      backRef.current.style.transform = ''
      backRef.current.style.transition = ''
      backRef.current.style.zIndex = ''
      backRef.current.style.cursor = ''
      localStorage.removeItem('drag_backbtn_postitem')
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('drag_backbtn_postitem'))
        if (saved) backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`
      } catch {}
    }
  }, [draggable])
  useEffect(() => {
    if (!draggable || !backRef.current) return
    try {
      const saved = JSON.parse(localStorage.getItem('drag_backbtn_postitem'))
      if (saved) backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`
    } catch {}
  }, [])
  const startBackDrag = useCallback((clientX, clientY) => {
    if (!draggable || !backRef.current) return
    const el = backRef.current
    const match = el.style.transform.match(/translate\(([-.0-9]+)px,\s*([-.0-9]+)px\)/)
    const baseDx = match ? parseFloat(match[1]) : 0
    const baseDy = match ? parseFloat(match[2]) : 0
    let dx = baseDx, dy = baseDy
    let hasDragged = false
    let rafId = null
    el.style.transition = 'none'
    el.style.zIndex = '9999'
    el.style.cursor = 'grabbing'
    const onMove = (cx, cy) => {
      dx = baseDx + (cx - clientX)
      dy = baseDy + (cy - clientY)
      if (Math.abs(cx - clientX) > 4 || Math.abs(cy - clientY) > 4) hasDragged = true
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        el.style.transform = `translate(${dx}px, ${dy}px)`
      })
    }
    const onUp = () => {
      if (rafId) cancelAnimationFrame(rafId)
      el.style.cursor = 'grab'
      el.style.transition = ''
      el.style.zIndex = ''
      if (hasDragged) {
        localStorage.setItem('drag_backbtn_postitem', JSON.stringify({ dx, dy }))
        const kill = (ce) => { ce.stopPropagation(); ce.preventDefault(); window.removeEventListener('click', kill, true) }
        window.addEventListener('click', kill, true)
      }
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onUp)
    }
    const onMouseMove = (e) => onMove(e.clientX, e.clientY)
    const onTouchMove = (e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }, [draggable])
  const onBackMouseDown = useCallback((e) => { e.preventDefault(); startBackDrag(e.clientX, e.clientY) }, [startBackDrag])
  const onBackTouchStart = useCallback((e) => { startBackDrag(e.touches[0].clientX, e.touches[0].clientY) }, [startBackDrag])
  const location = useLocation()
  const prefill = location.state?.prefill

  const [form, setForm] = useState({
    title: prefill?.title || '',
    price: prefill?.price || '',
    category: prefill?.category || '',
    subcategory: prefill?.subcategory || '',
    description: prefill?.description || '',
    condition: prefill?.condition || '',
    quantity: prefill?.quantity || 1,
    purchaseYear: prefill?.purchaseYear || '',
    expiryDate:   prefill?.expiryDate ? prefill.expiryDate.slice(0,10) : '',
    madeOn:       prefill?.madeOn     ? prefill.madeOn.slice(0,10)     : '',
  })
  const [specs, setSpecs]               = useState(prefill?.specs || {})
  const [images, setImages] = useState(() => {
    if (prefill?.images && prefill.images.length > 0) {
      return prefill.images.map((url, i) => ({
        _uid: `prefill-${i}`, url, preview: url, uploading: false, publicId: null,
      }))
    }
    return []
  })
  const [focusedField, setFocusedField] = useState(null)
  const [openSpecKey, setOpenSpecKey]   = useState(null)
  const [btnHovered, setBtnHovered]     = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const errorRef = useRef(null)

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 3000)
    return () => clearTimeout(t)
  }, [error])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  const [success, setSuccess]           = useState(false)
  const scrollRef = useRef(null)

  const subcategories = subcategoryMap[form.category] || []
  const specFields    = specFieldsMap[form.category] || []

  const uploadedPublicIds = useRef([])
  const successRef = useRef(false)

  useEffect(() => {
    return () => {
      if (successRef.current) return
      if (uploadedPublicIds.current.length === 0) return
      const token = localStorage.getItem('token')
      uploadedPublicIds.current.forEach(publicId => {
        try {
          fetch(`${API.defaults.baseURL}/upload/item-image`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ publicId }),
            keepalive: true,
          }).catch(() => {})
        } catch {}
      })
    }
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'category') { setForm(f => ({ ...f, category: value, subcategory: '' })); setSpecs({}) }
    else if (name === 'quantity') {
      const n = parseInt(value)
      if (value === '' || isNaN(n)) setForm(f => ({ ...f, quantity: value }))
      else setForm(f => ({ ...f, quantity: Math.min(99, Math.max(1, n)) }))
    }
    else setForm(f => ({ ...f, [name]: value }))
  }
  async function uploadImages(files) {
    setError(null)
    const newSlots = files.map(f => ({
      _uid: Math.random().toString(36).slice(2),
      name: f.name,
      preview: URL.createObjectURL(f),
      url: null, publicId: null, uploading: true,
    }))
    setImages(prev => [...prev, ...newSlots])

    const results = await Promise.allSettled(
      newSlots.map(async (slot, i) => {
        const formData = new FormData()
        formData.append('image', files[i])
        const res = await API.post('/upload/item-image', formData)
        uploadedPublicIds.current.push(res.data.publicId)
        setImages(prev => prev.map(img =>
          img._uid === slot._uid
            ? { ...img, url: res.data.url, publicId: res.data.publicId, uploading: false }
            : img
        ))
        return { uid: slot._uid, success: true }
      })
    )

    const failed = results
      .map((r, i) => r.status === 'rejected'
        ? { name: newSlots[i].name, status: r.reason?.response?.status, reason: r.reason }
        : null
      )
      .filter(Boolean)

    if (failed.length > 0) {
      setImages(prev => prev.filter(img => !img.uploading))
      const messages = failed.map(f => {
        const short = f.name.length > 24 ? f.name.slice(0, 21) + '…' : f.name
        const errMsg = (f.reason?.response?.data?.error || f.reason?.message || '').toLowerCase()
        if (f.status === 413 || errMsg.includes('limit') || errMsg.includes('large') || errMsg.includes('size')) return `${short} is over 5MB`
        if (f.status === 400 || errMsg.includes('type') || errMsg.includes('format')) return `${short} is an invalid file type`
        if (f.status === 401) return `session expired, please log in again`
        return `${short} failed to upload`
      })
      setError(messages.join(' · '))
    }
  }

  function removeImage(idx) {
    const img = images[idx]
    if (img?.publicId) {
      API.delete('/upload/item-image', { data: { publicId: img.publicId } }).catch(() => {})
      uploadedPublicIds.current = uploadedPublicIds.current.filter(id => id !== img.publicId)
    }
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  function reorderImages(fromIdx, toIdx) {
    setImages(prev => {
      const arr = [...prev]
      const [moved] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, moved)
      return arr
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.title || !form.price || !form.category || !form.condition) { setError('Title, price, category and condition are required.'); return }
    if (['Electronics', 'Appliances', 'Games & Hobbies'].includes(form.category) && !form.purchaseYear) { setError('Purchase year is required for this category.'); return }
    if (/^[^a-zA-Z0-9]/.test(form.title.trim())) { setError('Title can\'t start with a special character.'); return }
    if (/^\d/.test(form.title.trim())) { setError('Title can\'t start with a number.'); return }
    if (form.title.trim().length < 10) { setError('Title too short (min 10 chars).'); return }
    if (parseFloat(form.price) <= 0) { setError('Price must be greater than ₹0.'); return }
    if (images.some(img => img.uploading)) { setError('Please wait for images to finish uploading.'); return }
    const uploadedImages = images.filter(img => img.url)
    if (uploadedImages.length < 2) { setError('Please add at least 2 photos — buyers trust listings more with multiple images.'); return }
    const cleanSpecs = Object.fromEntries(Object.entries(specs).filter(([, v]) => v && v.trim() !== ''))
    const uploadedUrls = images.filter(img => img.url).map(img => img.url)
    try {
      setLoading(true)
      const res = await API.post('/items', {
        title: form.title, price: parseFloat(form.price),
        category: form.category, subcategory: form.subcategory || null,
        description: form.description, condition: form.condition,
        quantity: parseInt(form.quantity),
        specs: Object.keys(cleanSpecs).length > 0 ? cleanSpecs : null,
        imageUrl: uploadedUrls[0] || null,
        images: uploadedUrls,
        purchaseYear: form.purchaseYear ? parseInt(form.purchaseYear) : null,
        expiryDate:   form.expiryDate   || null,
        madeOn:       form.madeOn       || null,
      })
      setSuccess(true)
      successRef.current = true
      uploadedPublicIds.current = []
      if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => navigate(`/items/${res.data.id}`), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post item.')
    } finally { setLoading(false) }
  }

  const inputStyle = (name) => ({
    width: '100%', padding: '0.7rem 1rem',
    background: focusedField === name ? 'var(--bg-input-focus)' : 'var(--bg-input)',
    border: focusedField === name ? '1px solid var(--accent-border)' : '1px solid var(--glass-border)',
    borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.9rem',
    outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box',
  })

  const labelStyle = (name) => ({
    display: 'block', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase',
    color: focusedField === name ? 'var(--accent)' : 'var(--text-muted)',
    fontWeight: '700', marginBottom: '0.45rem', transition: 'color 0.3s ease',
  })

  return (
    <div className="pi-page-wrap">
      <style>{`
        input::placeholder, textarea::placeholder { color: var(--text-ghost); }
        select option { background: var(--bg-surface); color: var(--text-primary); }
        @keyframes specsIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes piSpin  { to { transform: rotate(360deg); } }
        .pi-scroll::-webkit-scrollbar { display: none; }
        .pi-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        /* ════════════════════════════════════
           Base (desktop)
        ════════════════════════════════════ */
        .pi-page-wrap {
          height: calc(100vh - 70px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow: hidden;
        }
        .pi-container {
          width: 100%;
          max-width: 560px;
          position: relative;
        }
        .pi-back-btn {
          position: absolute;
          left: -50px;
          top: 16px;
        }
        .pi-back-btn:hover {
          border-color: var(--accent) !important;
          color: var(--accent) !important;
          box-shadow: 0 0 8px 2px rgba(var(--accent-rgb),0.35) !important;
        }
        .pi-panel {
          width: 100%;
          max-height: calc(100vh - 70px - 4rem);
          overflow-y: auto;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 2.75rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06);
          position: relative;
          overflow: auto;
        }
        .pi-heading {
          font-size: 2.4rem;
        }
        .pi-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1.15rem;
        }
        .pi-spec-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.65rem;
          overflow: visible;
        }

        /* ════════════════════════════════════
           769px – 1024px  (tablet)
        ════════════════════════════════════ */
        @media (max-width: 1024px) {
          .pi-page-wrap {
            padding: 2rem 1.5rem;
          }
          .pi-back-btn {
            left: -36px;
          }
          .pi-heading {
            font-size: 2rem;
          }
        }

        /* ════════════════════════════════════
           < 768px  (mobile)
        ════════════════════════════════════ */
        @media (max-width: 768px) {
          .pi-page-wrap {
            height: auto;
            overflow: visible;
            justify-content: flex-start;
            padding: 1.5rem 1.25rem 2.5rem;
          }
          .pi-container {
            max-width: 100%;
          }
          /* Back button goes inline above the panel */
          .pi-back-btn {
            position: static;
            display: inline-flex !important;
            margin-bottom: 0.75rem;
          }
          .pi-panel {
            max-height: none;
            overflow-y: visible;
            padding: 1.75rem 1.5rem;
            border-radius: 20px;
          }
          .pi-heading {
            font-size: 1.9rem;
          }
          /* Form rows collapse to 1 col */
          .pi-form-row {
            grid-template-columns: 1fr;
          }
          /* Spec grid collapses to 1 col */
          .pi-spec-grid {
            grid-template-columns: 1fr;
          }
          /* span-2 fields no longer need to span anything */
          .pi-spec-grid > div[style*="span 2"] {
            grid-column: span 1 !important;
          }
        }

        /* ════════════════════════════════════
           < 480px  (small mobile)
        ════════════════════════════════════ */
        @media (max-width: 480px) {
          .pi-page-wrap {
            padding: 1rem 1rem 2rem;
          }
          .pi-panel {
            padding: 1.5rem 1.1rem;
            border-radius: 16px;
          }
          .pi-heading {
            font-size: 1.65rem;
          }
        }
      `}</style>

      <div className="pi-container">

        {/* ── Back button ── */}
        <button
          ref={backRef}
          className="pi-back-btn back-btn-circle"
          onClick={() => navigate(-1)}
          onMouseDown={onBackMouseDown}
          onTouchStart={onBackTouchStart}
          style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--bg-surface)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: draggable ? 'grab' : 'pointer', flexShrink: 0, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.boxShadow='0 0 8px 2px rgba(var(--accent-rgb),0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <div ref={scrollRef} className="pi-scroll pi-panel">
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', borderRadius: '24px 24px 0 0' }} />

          <div style={{ marginBottom: '2rem' }}>
            <h1 className="pi-heading" style={{ fontWeight: '900', letterSpacing: '-1.5px', lineHeight: '1.05', marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
              {prefill ? 'Relist' : 'List an'}<br />
              <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Item.</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{prefill ? 'Edit the details and repost your listing' : 'Fill in the details to post your listing'}</p>
          </div>

          {success && (
            <div style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', background: 'linear-gradient(135deg, rgba(81,207,102,0.15) 0%, rgba(64,192,87,0.08) 100%)', border: '1px solid rgba(81,207,102,0.4)', borderRadius: '14px', boxShadow: '0 4px 20px rgba(81,207,102,0.15)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(81,207,102,0.6), transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(81,207,102,0.35), rgba(64,192,87,0.2))', border: '1.5px solid rgba(81,207,102,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(81,207,102,0.3)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#51cf66" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#51cf66', letterSpacing: '-0.2px' }}>Listing Published!</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(81,207,102,0.55)', fontWeight: '500', marginTop: '1px' }}>Redirecting to your listing…</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div ref={errorRef} style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '12px', color: '#ff6b6b', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', opacity: 0.6, padding: '0', flexShrink: 0, lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ overflow: 'visible' }}>
            <ImageUploadZone
              images={images}
              onAdd={uploadImages}
              onRemove={removeImage}
              onReorder={reorderImages}
              uploading={images.some(i => i.uploading)}
              onClearImageError={() => setError(null)}
            />

            <div className="pi-form-row">
              <div>
                <label style={labelStyle('title')}>Title</label>
                <input name="title" type="text" value={form.title} onChange={handleChange} onFocus={() => setFocusedField('title')} onBlur={() => setFocusedField(null)} placeholder="e.g. Physics Textbook" style={{ ...inputStyle('title'), borderRadius: (/^\d/.test(form.title) || /^[^a-zA-Z0-9]/.test(form.title) || (form.title.length > 0 && form.title.trim().length < 10)) ? '12px 12px 0 0' : undefined }} />
                {/^[^a-zA-Z0-9]/.test(form.title) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ fontSize: '0.62rem', color: '#ff6b6b', fontWeight: '600' }}>Can't start with a special character</span>
                  </div>
                )}
                {!/^[^a-zA-Z0-9]/.test(form.title) && /^\d/.test(form.title) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ fontSize: '0.62rem', color: '#ff6b6b', fontWeight: '600' }}>Can't start with a number</span>
                  </div>
                )}
                {!/^[^a-zA-Z0-9]/.test(form.title) && !(/^\d/.test(form.title)) && form.title.length > 0 && form.title.trim().length < 10 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderTop: 'none', borderRadius: '0 0 10px 10px' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ fontSize: '0.62rem', color: '#ff6b6b', fontWeight: '600' }}>Too short (min 10 chars)</span>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle('price')}>Price (₹)</label>
                <input name="price" type="number" min="1" step="any" value={form.price} onChange={handleChange} onFocus={() => setFocusedField('price')} onBlur={() => setFocusedField(null)} onKeyDown={e => ['e','E','+','-'].includes(e.key) && e.preventDefault()} placeholder="e.g. 299" style={inputStyle('price')} />
              </div>
            </div>

            <div className="pi-form-row">
              <div>
                <label style={labelStyle('category')}>Category</label>
                <CustomSelect value={form.category} onChange={val => { setForm(f => ({ ...f, category: val, subcategory: '' })); setSpecs({}) }} options={categories.map(c => ({ value: c, label: c }))} placeholder="Select category" focusKey="category" focusedField={focusedField} setFocusedField={setFocusedField} />
              </div>
              <div>
                <label style={labelStyle('condition')}>Condition</label>
                <CustomSelect value={form.condition} onChange={val => setForm(f => ({ ...f, condition: val }))} options={['Like New', 'Good', 'Fair', 'Poor'].map(c => ({ value: c, label: c }))} placeholder="Select condition" focusKey="condition" focusedField={focusedField} setFocusedField={setFocusedField} />
              </div>
            </div>

            <div className="pi-form-row">
              <div>
                <label style={labelStyle('subcategory')}>{subcategoryLabel[form.category] || 'Subcategory'}</label>
                <CustomSelect value={form.subcategory} onChange={val => setForm(f => ({ ...f, subcategory: val }))} options={subcategories.map(s => ({ value: s, label: s }))} placeholder={subcategories.length === 0 ? 'N/A' : 'Select...'} focusKey="subcategory" focusedField={focusedField} setFocusedField={setFocusedField} disabled={subcategories.length === 0} />
              </div>
              <div>
                <label style={labelStyle('quantity')}>Quantity</label>
                <input name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={handleChange} onFocus={() => setFocusedField('quantity')} onBlur={() => setFocusedField(null)} onKeyDown={e => ['e','E','+','-','.'].includes(e.key) && e.preventDefault()} placeholder="1" style={inputStyle('quantity')} />
              </div>
            </div>

            {specFields.length > 0 && (
              <div style={{ marginBottom: '1.15rem', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '1.15rem', animation: 'specsIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)', overflow: 'visible', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
                  <span style={{ fontSize: '0.62rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: '800' }}>{form.category} Specifications</span>

                </div>
                <div className="pi-spec-grid">
                  {specFields.map(field => (
                    <div key={field.key} style={{ gridColumn: field.span === 2 ? 'span 2' : 'span 1', overflow: 'visible' }}>
                      <div style={{ fontSize: '0.6rem', letterSpacing: '1.2px', textTransform: 'uppercase', color: focusedField === `spec-${field.key}` ? 'var(--accent)' : 'var(--text-muted)', fontWeight: '700', marginBottom: '0.35rem', transition: 'color 0.2s' }}>{field.label}</div>
                      <SpecInput fieldKey={field.key} category={form.category} value={specs[field.key] || ''} onChange={val => setSpecs(s => ({ ...s, [field.key]: val }))} placeholder={field.placeholder} openKey={openSpecKey} setOpenKey={setOpenSpecKey} focusedField={focusedField} setFocusedField={setFocusedField} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Purchase Year — Electronics, Appliances, Games & Hobbies ── */}
            {['Electronics', 'Appliances', 'Games & Hobbies'].includes(form.category) && (
              <div style={{ marginBottom: '1.15rem', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '1.15rem', animation: 'specsIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span style={{ fontSize: '0.62rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: '800' }}>Purchase Year</span>
                </div>
                <CustomSelect
                  value={form.purchaseYear ? String(form.purchaseYear) : ''}
                  onChange={val => setForm(f => ({ ...f, purchaseYear: val }))}
                  options={Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => {
                    const y = new Date().getFullYear() - i
                    return { value: String(y), label: String(y) }
                  })}
                  placeholder="Select year bought"
                  focusKey="purchaseYear"
                  focusedField={focusedField}
                  setFocusedField={setFocusedField}
                />
              </div>
            )}

            {/* ── Expiry / Made On — Food & Drinks ── */}
            {form.category === 'Food & Drinks' && (
              <div style={{ marginBottom: '1.15rem', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '1.15rem', animation: 'specsIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span style={{ fontSize: '0.62rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: '800' }}>
                    {form.subcategory === 'Homemade' ? 'Made On' : 'Expiry Date'}
                  </span>
                </div>
                {form.subcategory === 'Homemade' ? (
                  <input
                    type="date"
                    name="madeOn"
                    value={form.madeOn}
                    max={new Date().toISOString().slice(0,10)}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('madeOn')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle('madeOn')}
                  />
                ) : (
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    min={new Date().toISOString().slice(0,10)}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('expiryDate')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle('expiryDate')}
                  />
                )}
              </div>
            )}

            <div style={{ marginBottom: '1.15rem' }}>
              <label style={labelStyle('description')}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} onFocus={() => setFocusedField('description')} onBlur={() => setFocusedField(null)} placeholder="Condition, age, any defects, reason for selling..." rows="3" style={{ ...inputStyle('description'), resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }} />
            </div>

            <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', margin: '1.25rem 0' }} />

            <button type="submit" disabled={loading || success} onMouseEnter={() => setBtnHovered(true)} onMouseLeave={() => setBtnHovered(false)}
              style={{ width: '100%', padding: '0.8rem', background: success ? 'linear-gradient(135deg, rgba(81,207,102,0.25), rgba(64,192,87,0.15))' : loading ? 'rgba(255,255,255,0.08)' : btnHovered ? 'linear-gradient(135deg, var(--accent-alt), var(--accent))' : 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: success ? '#51cf66' : loading ? 'rgba(255,255,255,0.3)' : 'white', border: success ? '1px solid rgba(81,207,102,0.4)' : 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', cursor: loading || success ? 'not-allowed' : 'pointer', letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: btnHovered && !loading ? 'translateY(-3px)' : 'translateY(0)', boxShadow: success ? '0 4px 20px rgba(81,207,102,0.2)' : btnHovered && !loading ? '0 15px 35px rgba(var(--accent-rgb),0.35)' : '0 4px 15px rgba(var(--accent-rgb),0.2)' }}>
              {loading ? 'Posting...' : 'Post Listing →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PostItem