import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
}

const subcategoryLabel = {
  'Clothing': 'Size', 'Books & Notes': 'Semester',
  'Electronics': 'Type', 'Furniture': 'Type',
  'Sports & Fitness': 'Sport',
}

const statusOptions = ['available', 'pending', 'sold']
const statusMeta = {
  available: { label: 'Available', color: '#51cf66' },
  pending:   { label: 'Pending',   color: '#ffd43b' },
  sold:      { label: 'Sold',      color: '#ff6b6b' },
}

function ItemCard({ item }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const status = item.status?.toLowerCase()

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
        boxShadow: hovered
          ? '0 25px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontWeight: '700' }}>{item.category}</span>
          {item.subcategory && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>›</span>
              <span style={{ fontSize: '0.6rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(232,119,34,0.5)', fontWeight: '700' }}>{item.subcategory}</span>
            </>
          )}
        </div>
        <span style={{
          fontSize: '0.7rem', fontWeight: '700',
          color: status === 'sold' ? '#ff6b6b' : status === 'pending' ? '#ffd43b' : '#51cf66',
          background: status === 'sold' ? 'rgba(255,107,107,0.1)' : status === 'pending' ? 'rgba(255,212,59,0.1)' : 'rgba(81,207,102,0.1)',
          backdropFilter: 'blur(8px)', padding: '3px 12px', borderRadius: '20px',
          border: status === 'sold' ? '1px solid rgba(255,107,107,0.15)' : status === 'pending' ? '1px solid rgba(255,212,59,0.15)' : '1px solid rgba(81,207,102,0.15)',
          textTransform: 'capitalize', whiteSpace: 'nowrap',
        }}>{status}</span>
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'rgba(255,255,255,0.95)', marginBottom: '0.4rem', lineHeight: '1.35', letterSpacing: '-0.3px' }}>{item.title}</h3>

      {item.quantity > 1 && (
        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>{item.quantity}x in stock</span>
      )}

      <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.1), rgba(255,255,255,0.06))', margin: '1.25rem 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#e87722', letterSpacing: '-0.5px' }}>₹{item.price}</span>
        <button style={{
          padding: '0.45rem 1.1rem',
          background: hovered ? 'linear-gradient(135deg, #e87722, #f09030)' : 'rgba(232,119,34,0.12)',
          color: hovered ? 'white' : 'rgba(232,119,34,0.8)',
          border: hovered ? '1px solid transparent' : '1px solid rgba(232,119,34,0.25)',
          borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer',
          transition: 'all 0.3s ease', fontWeight: '600', letterSpacing: '0.3px',
          boxShadow: hovered ? '0 4px 15px rgba(232,119,34,0.35)' : 'none',
        }}>View →</button>
      </div>
    </div>
  )
}

function Home() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [activeSubcategory, setActiveSubcategory] = useState('')
  const [categoryFocused, setCategoryFocused] = useState(false)
  const [subcategoryFocused, setSubcategoryFocused] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeStatuses, setActiveStatuses] = useState(['available'])
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const menuRef = useRef(null)

  const subcategories = subcategoryMap[activeCategory] || []
  const subLabel = subcategoryLabel[activeCategory] || 'Subcategory'

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowStatusMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleStatus(s) {
    setActiveStatuses(prev =>
      prev.includes(s) ? prev.length === 1 ? prev : prev.filter(x => x !== s) : [...prev, s]
    )
  }

  // Reset subcategory when category changes
  useEffect(() => { setActiveSubcategory('') }, [activeCategory])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = {}
        if (search) params.search = search
        if (activeCategory) params.category = activeCategory
        if (activeSubcategory) params.subcategory = activeSubcategory
        const res = await API.get('/items', { params })
        setItems(res.data)
      } catch (err) {
        setError('Failed to load items. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    const timer = setTimeout(fetchItems, 300)
    return () => clearTimeout(timer)
  }, [search, activeCategory, activeSubcategory])

  const filteredItems = items.filter(item => activeStatuses.includes(item.status?.toLowerCase()))

  return (
    <div style={{ padding: '3rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '3.2rem', fontWeight: '900', lineHeight: '1.05', letterSpacing: '-2px', marginBottom: '0.75rem', color: 'white' }}>
          Buy. Sell.<br />
          <span style={{ background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Campus Style.</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', marginTop: '0.5rem', fontWeight: '400', letterSpacing: '0.2px' }}>
          Second-hand goods, first-class deals — only for students.
        </p>
      </div>

      {/* Search + Filters */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
        padding: '1.5rem', marginBottom: '2.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {/* Search */}
        <input
          type="text" placeholder="Search items..." value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          style={{
            width: '100%', padding: '0.7rem 1.2rem',
            background: searchFocused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
            border: searchFocused ? '1px solid rgba(232,119,34,0.35)' : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', color: 'white', fontSize: '0.9rem',
            outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box',
          }}
        />

        {/* Row 2: category + subcategory + status */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>

          {/* Category */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <select
              value={activeCategory}
              onChange={e => setActiveCategory(e.target.value)}
              onFocus={() => setCategoryFocused(true)} onBlur={() => setCategoryFocused(false)}
              style={{
                width: '100%', padding: '0.45rem 2.5rem 0.45rem 1rem',
                background: categoryFocused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                border: categoryFocused ? '1px solid rgba(232,119,34,0.35)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px', color: activeCategory ? 'white' : 'rgba(255,255,255,0.4)',
                fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                outline: 'none', transition: 'all 0.3s ease',
                appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
              }}
            >
              <option value="" style={{ background: '#1a1225', color: 'rgba(255,255,255,0.5)' }}>All Categories</option>
              {categories.map(cat => <option key={cat} value={cat} style={{ background: '#1a1225', color: 'white' }}>{cat}</option>)}
            </select>
            <div style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.4)"><path d="M8 11L3 6h10z"/></svg>
            </div>
          </div>

          {/* Subcategory — only when category has subcategories */}
          {subcategories.length > 0 && (
            <div style={{ position: 'relative', minWidth: '160px', animation: 'fadeIn 0.25s ease' }}>
              <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }`}</style>
              <select
                value={activeSubcategory}
                onChange={e => setActiveSubcategory(e.target.value)}
                onFocus={() => setSubcategoryFocused(true)} onBlur={() => setSubcategoryFocused(false)}
                style={{
                  width: '100%', padding: '0.45rem 2.5rem 0.45rem 1rem',
                  background: subcategoryFocused ? 'rgba(232,119,34,0.12)' : 'rgba(232,119,34,0.06)',
                  border: subcategoryFocused ? '1px solid rgba(232,119,34,0.5)' : '1px solid rgba(232,119,34,0.2)',
                  borderRadius: '10px', color: activeSubcategory ? '#f5a623' : 'rgba(232,119,34,0.6)',
                  fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                  outline: 'none', transition: 'all 0.3s ease',
                  appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
                }}
              >
                <option value="" style={{ background: '#1a1225', color: 'rgba(255,255,255,0.5)' }}>All {subLabel}s</option>
                {subcategories.map(s => <option key={s} value={s} style={{ background: '#1a1225', color: 'white' }}>{s}</option>)}
              </select>
              <div style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(232,119,34,0.5)"><path d="M8 11L3 6h10z"/></svg>
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Status dots button */}
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            {(() => {
              const colors = activeStatuses.map(s => statusMeta[s].color)
              const strokeColor = colors.length === 1 ? colors[0]
                : colors.length === 2
                  ? (activeStatuses.includes('available') && activeStatuses.includes('pending')) ? '#a8e060'
                  : (activeStatuses.includes('available') && activeStatuses.includes('sold')) ? '#c06090' : '#ffa060'
                : '#e0b840'
              const animId = 'travel' + activeStatuses.slice().sort().join('')
              const r = 9, w = 34, h = 34
              const perim = 2 * (w + h) - (8 - 2 * Math.PI) * r
              const dashLen = Math.round(perim * 1.0)

              return (
                <>
                  <style>{`
                    @keyframes ${animId} { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -${Math.round(perim)}; } }
                    @keyframes ${animId}-glow { 0% { stroke-dashoffset: 0; opacity: 0.5; } 50% { opacity: 0.85; } 100% { stroke-dashoffset: -${Math.round(perim)}; opacity: 0.5; } }
                    @keyframes ${animId}-pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
                  `}</style>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.06)', pointerEvents: 'none', zIndex: 0 }} />
                  <svg width={w} height={h} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', filter: 'blur(2.5px)', overflow: 'visible' }}>
                    <rect x="1" y="1" width={w-2} height={h-2} rx={r} ry={r} fill="none" stroke={strokeColor} strokeWidth="4" strokeDasharray={`${Math.round(dashLen*0.4)} ${Math.round(perim-dashLen*0.4)}`} strokeDashoffset="0" strokeLinecap="round" style={{ animation: `${animId}-glow 2s linear infinite` }} />
                  </svg>
                  <svg width={w} height={h} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'visible' }}>
                    <rect x="1" y="1" width={w-2} height={h-2} rx={r} ry={r} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeDasharray={`${dashLen} ${Math.round(perim-dashLen)}`} strokeDashoffset="0" strokeLinecap="round" style={{ animation: `${animId} 2s linear infinite` }} />
                  </svg>
                  <button onClick={() => setShowStatusMenu(v => !v)} title="Filter by status"
                    style={{ position: 'relative', zIndex: 3, width: `${w}px`, height: `${h}px`, borderRadius: '10px', cursor: 'pointer', background: showStatusMenu ? 'rgba(255,255,255,0.07)' : 'transparent', border: 'none', color: strokeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', letterSpacing: '1px', fontWeight: '900', lineHeight: 1, transition: 'background 0.2s ease', animation: `${animId}-pulse 2s ease-in-out infinite` }}>···</button>
                </>
              )
            })()}

            {showStatusMenu && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, background: 'linear-gradient(135deg, rgba(28,28,35,0.98) 0%, rgba(18,18,24,0.98) 100%)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '16px', padding: '0.6rem', minWidth: '170px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', zIndex: 100 }}>
                <div style={{ fontSize: '0.58rem', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', fontWeight: '800', padding: '0.35rem 0.85rem 0.65rem' }}>Show Status</div>
                {statusOptions.map(s => {
                  const isOn = activeStatuses.includes(s)
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
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #e87722', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading items...</p>
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '20px', color: '#ff6b6b' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{error}</p>
          <button onClick={() => setActiveCategory(activeCategory)} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: '10px', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.85rem' }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginBottom: '1.25rem', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
            {activeSubcategory && <span style={{ color: 'rgba(232,119,34,0.5)', marginLeft: '0.5rem' }}>· {activeSubcategory}</span>}
          </p>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'rgba(255,255,255,0.25)', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>∅</div>
              <p style={{ fontSize: '1rem', fontWeight: '500' }}>No items match your search.</p>
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