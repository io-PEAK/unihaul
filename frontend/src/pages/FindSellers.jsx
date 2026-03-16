import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'

function SellerCard({ user, matchedItems, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--glass-bg-hover)' : 'var(--glass-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? '1px solid rgba(var(--accent-rgb),0.4)' : '1px solid var(--glass-border)',
        borderRadius: '20px', padding: '1.5rem', cursor: 'pointer',
        transform: hovered ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: hovered
          ? '0 25px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'var(--glass-shimmer)', borderRadius: '20px 20px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
          background: user.avatar ? 'transparent' : 'var(--accent-soft)',
          border: '2px solid var(--border-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: hovered ? '0 0 0 3px rgba(var(--accent-rgb),0.2)' : 'none',
          transition: 'box-shadow 0.3s ease',
        }}>
          {user.avatar
            ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
                {(user.firstName?.[0] || '?').toUpperCase()}
              </span>
          }
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px' }}>
            {user.firstName} {user.lastName}
          </div>
          {user.institution && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
              {user.institution}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {user.institutionType && (
          <span style={{ fontSize: '0.6rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px', background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', color: 'var(--accent)' }}>
            {user.institutionType}
          </span>
        )}
        {user.city && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {user.city}{user.state ? `, ${user.state}` : ''}
          </span>
        )}
      </div>

      {matchedItems && matchedItems.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-ghost)', fontWeight: '700', marginBottom: '0.5rem' }}>Matched listings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {matchedItems.slice(0, 3).map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '0.5rem' }}>{item.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{item.price?.toLocaleString()}</span>
                  <span style={{ fontSize: '0.58rem', fontWeight: '700', padding: '1px 6px', borderRadius: '20px', color: item.status === 'sold' ? 'var(--color-sold)' : item.status === 'pending' ? 'var(--color-pending)' : 'var(--color-available)', background: item.status === 'sold' ? 'var(--bg-sold)' : item.status === 'pending' ? 'var(--bg-pending)' : 'var(--bg-available)', border: item.status === 'sold' ? '1px solid var(--bd-sold)' : item.status === 'pending' ? '1px solid var(--bd-pending)' : '1px solid var(--bd-available)', textTransform: 'capitalize' }}>{item.status}</span>
                </div>
              </div>
            ))}
            {matchedItems.length > 3 && <div style={{ fontSize: '0.68rem', color: 'var(--text-ghost)', fontWeight: '600', paddingLeft: '0.65rem' }}>+{matchedItems.length - 3} more</div>}
          </div>
        </div>
      )}

      <div style={{ height: '1px', background: 'var(--glass-divider)', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-ghost)', fontWeight: '600' }}>
          Since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </span>
        <button style={{ padding: '0.4rem 1rem', background: hovered ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'var(--accent-soft)', color: hovered ? 'white' : 'var(--accent)', border: hovered ? '1px solid transparent' : '1px solid var(--border-accent)', borderRadius: '10px', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.3s ease', fontWeight: '600', boxShadow: hovered ? '0 4px 15px var(--accent-glow)' : 'none', fontFamily: 'var(--font-body)' }}>
          View →
        </button>
      </div>
    </div>
  )
}

function FindSellers() {
  const navigate = useNavigate()
  const [itemQuery, setItemQuery] = useState('')
  const [itemQueryFocused, setItemQueryFocused] = useState(false)
  const [peopleQuery, setPeopleQuery] = useState('')
  const [peopleQueryFocused, setPeopleQueryFocused] = useState(false)
  const [type, setType] = useState('all')
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)
  const searchRowRef = useRef(null)
  const itemInputRef = useRef(null)
  const peopleInputRef = useRef(null)

  const isItemMode = itemQuery.trim().length > 0

  // ── Navbar bridge ─────────────────────────────────────────────
  // Navbar shows combined query. On handoff, restore both boxes.
  useEffect(() => {
    window.__homeSearchBridge = {
      // navbar reads this to show current value
      get: () => {
        if (itemQuery && peopleQuery) return `${itemQuery} · ${peopleQuery}`
        return itemQuery || peopleQuery
      },
      // navbar writes here when user types in navbar search
      set: (val) => {
        // put everything into itemQuery when typing from navbar
        setItemQuery(val)
        setPeopleQuery('')
      },
    }
  })

  useEffect(() => {
    function onNavSearch(e) {
      setItemQuery(e.detail.value)
      setPeopleQuery('')
    }
    window.addEventListener('home-navbar-search', onNavSearch)
    return () => window.removeEventListener('home-navbar-search', onNavSearch)
  }, [])

  useEffect(() => {
    function onHandoff(e) {
      const val = e.detail?.value ?? ''
      setItemQuery(val)
      setPeopleQuery('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => {
        itemInputRef.current?.focus()
        const inp = itemInputRef.current
        if (inp) { const len = inp.value.length; inp.setSelectionRange(len, len) }
      }, 350)
    }
    window.addEventListener('home-navbar-handoff', onHandoff)
    return () => window.removeEventListener('home-navbar-handoff', onHandoff)
  }, [])

  // IntersectionObserver — tells navbar when search bar is visible
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

  async function fetchByItem(itemQ, peopleQ, t) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ item: itemQ, limit: 50 })
      if (t && t !== 'all') params.set('type', t)
      if (peopleQ) params.set('q', peopleQ)
      const res = await API.get(`/users/search-by-item?${params.toString()}`)
      setSellers(res.data || [])
    } catch { setSellers([]) }
    finally { setLoading(false) }
  }

  async function fetchByPeople(q, t) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 50 })
      if (q) params.set('q', q)
      if (t && t !== 'all') params.set('type', t)
      const res = await API.get(`/users/search?${params.toString()}`)
      setSellers(res.data || [])
    } catch { setSellers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchByPeople('', 'all') }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (itemQuery.trim()) {
        fetchByItem(itemQuery.trim(), peopleQuery.trim(), type)
      } else {
        fetchByPeople(peopleQuery.trim(), type)
      }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [itemQuery, peopleQuery, type])

  return (
    <div className="sellers-page" style={{ padding: '3rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes chipIn { from { opacity:0; transform:scale(0.75) translateY(5px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .sellers-page { padding: 3rem 4rem }
        .sellers-hero-title { font-size: 3.2rem }
        .sellers-search-row { flex-wrap: nowrap }
        @media (max-width: 1280px) { .sellers-page { padding: 2.5rem 3rem } }
        @media (max-width: 1024px) { .sellers-page { padding: 2rem 2rem } .sellers-hero-title { font-size: 2.6rem } }
        @media (max-width: 768px) {
          .sellers-page { padding: 1.5rem 1rem }
          .sellers-hero-title { font-size: 2.2rem }
          .sellers-search-row { flex-wrap: wrap !important; gap: 0.5rem !important }
          .sellers-type-filters { display: none !important }
          .sellers-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important }
        }
        @media (max-width: 480px) {
          .sellers-hero-title { font-size: 1.9rem }
          .sellers-grid { grid-template-columns: 1fr !important }
          .sellers-search-row { flex-direction: column }
        }
        input::placeholder { color: var(--text-ghost); }
      `}</style>

      {/* Hero */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="sellers-hero-title" style={{ fontWeight: '900', lineHeight: '1.05', letterSpacing: '-2px', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Find<br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Sellers.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '400' }}>
          Search by item name to find who's selling it — or search by name, institution, or city. Use both together to narrow down.
        </p>
      </div>

      {/* Search glass row */}
      <div ref={searchRowRef} style={{
        background: 'var(--glass-bg-row)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)', borderRadius: '20px',
        padding: '1.25rem 1.5rem',
        marginBottom: isItemMode || peopleQuery ? '0.65rem' : '2.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        <div className="sellers-search-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>

          {/* Item search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={itemQueryFocused ? 'var(--accent)' : 'var(--text-muted)'}
              strokeWidth="2.5" strokeLinecap="round"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-30%)', pointerEvents: 'none', transition: 'stroke 0.2s' }}>
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <input
              ref={itemInputRef}
              type="text"
              placeholder="Search by item name..."
              value={itemQuery}
              onChange={e => setItemQuery(e.target.value)}
              onFocus={() => setItemQueryFocused(true)}
              onBlur={() => setItemQueryFocused(false)}
              style={{
                width: '100%', padding: '0.65rem 2rem 0.65rem 2.5rem',
                background: itemQueryFocused ? 'var(--bg-input-focus)' : 'var(--bg-input)',
                border: itemQuery ? '1px solid var(--accent-border)' : itemQueryFocused ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.9rem',
                outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box', fontFamily: 'var(--font-body)',
              }}
            />
            {itemQuery && (
              <button onClick={() => setItemQuery('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '28px', background: 'var(--border)', flexShrink: 0 }} />

          {/* People search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={peopleQueryFocused ? 'var(--accent)' : 'var(--text-muted)'}
              strokeWidth="2.5" strokeLinecap="round"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-30%)', pointerEvents: 'none', transition: 'stroke 0.2s' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <input
              ref={peopleInputRef}
              type="text"
              placeholder="Name, institution, city..."
              value={peopleQuery}
              onChange={e => setPeopleQuery(e.target.value)}
              onFocus={() => setPeopleQueryFocused(true)}
              onBlur={() => setPeopleQueryFocused(false)}
              style={{
                width: '100%', padding: '0.65rem 2rem 0.65rem 2.5rem',
                background: peopleQueryFocused ? 'var(--bg-input-focus)' : 'var(--bg-input)',
                border: peopleQuery ? '1px solid var(--accent-border)' : peopleQueryFocused ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.9rem',
                outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box', fontFamily: 'var(--font-body)',
              }}
            />
            {peopleQuery && (
              <button onClick={() => setPeopleQuery('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="sellers-type-filters" style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
            {['all', 'college', 'school'].map(t => (
              <button key={t} onClick={() => setType(t)} style={{ padding: '0.65rem 1.1rem', borderRadius: '12px', border: type === t ? '1px solid var(--accent-border)' : '1px solid var(--border)', background: type === t ? 'linear-gradient(135deg, rgba(var(--accent-rgb),0.22), rgba(var(--accent-rgb),0.1))' : 'var(--bg-input)', color: type === t ? 'var(--accent-alt)' : 'var(--text-muted)', fontSize: '0.84rem', fontWeight: type === t ? '700' : '500', cursor: 'pointer', transition: 'all 0.22s ease', textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters row */}
        {(isItemMode || peopleQuery) && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', animation: 'chipIn 0.22s ease' }}>
            {isItemMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.28rem 0.7rem', background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', borderRadius: '20px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span style={{ fontSize: '0.73rem', fontWeight: '600', color: 'var(--accent)' }}>item: {itemQuery}</span>
                <button onClick={() => setItemQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--accent-rgb),0.5)', fontSize: '0.85rem', lineHeight: 1, padding: 0, marginTop: '-1px' }}>×</button>
              </div>
            )}
            {peopleQuery && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.28rem 0.7rem', background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', borderRadius: '20px' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <span style={{ fontSize: '0.73rem', fontWeight: '600', color: 'var(--accent)' }}>people: {peopleQuery}</span>
                <button onClick={() => setPeopleQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(var(--accent-rgb),0.5)', fontSize: '0.85rem', lineHeight: 1, padding: 0, marginTop: '-1px' }}>×</button>
              </div>
            )}
            {(isItemMode || peopleQuery) && (
              <button onClick={() => { setItemQuery(''); setPeopleQuery('') }} style={{ fontSize: '0.7rem', padding: '0.28rem 0.7rem', background: 'none', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text-ghost)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.18s', fontFamily: 'var(--font-body)' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-sold)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.35)' }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-ghost)'; e.currentTarget.style.borderColor = 'var(--border)' }}>Clear all ×</button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p style={{ color: 'var(--text-ghost)', fontSize: '0.78rem', marginBottom: '1.25rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {sellers.length} seller{sellers.length !== 1 ? 's' : ''} found
        </p>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Finding sellers...</p>
        </div>
      )}

      {!loading && sellers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-faint)', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>∅</div>
          <p style={{ fontSize: '1rem', fontWeight: '500' }}>No sellers found. Try a different search!</p>
        </div>
      )}

      {!loading && sellers.length > 0 && (
        <div className="sellers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {sellers.map(user => (
            <SellerCard key={user.id} user={user} matchedItems={user.matchedItems} onClick={() => navigate(`/users/${user.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

export default FindSellers