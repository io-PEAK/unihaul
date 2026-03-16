import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import indiaCities from '../data/indiaCities.json'
import API from '../api/axios'

function LocationIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="3" />
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    </svg>
  )
}

function ChevronIcon({ size = 10, flipped = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"
      style={{ transform: flipped ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
      <path d="M8 11L3 6h10z" />
    </svg>
  )
}

function CheckIcon({ size = 9 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <polyline points="1,6 4,9 11,3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function buildPillLabel(location) {
  if (location.mode === 'all') return 'All India'
  const parts = []
  if (location.institutions.length > 0) parts.push(...location.institutions)
  Object.values(location.cities).forEach(cityList => parts.push(...cityList))
  Object.keys(location.statesOnly).forEach(s => parts.push(s))
  if (parts.length === 0) return 'All India'
  if (parts.length === 1) return parts[0].length > 22 ? parts[0].slice(0, 20) + '…' : parts[0]
  return `${parts.length} locations`
}

export default function LocationPicker({ location, setLocation }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('institution')
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const dropRef = useRef(null)
  const [hovered, setHovered] = useState(false)

  const [instQuery, setInstQuery] = useState('')
  const [instResults, setInstResults] = useState([])
  const [instLoading, setInstLoading] = useState(false)
  const userInstitution = (() => {
    try { return JSON.parse(localStorage.getItem('user'))?.institution || null } catch { return null }
  })()

  const [areaQuery, setAreaQuery] = useState('')
  const [stateResults, setStateResults] = useState([])
  const [cityMap, setCityMap] = useState({})
  const [expandedState, setExpandedState] = useState(null)

  // ── Recompute dropdown position from button rect ──────────────
  const updatePos = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 6, left: Math.max(8, r.left + (r.width / 2) - 150) })
    }
  }, [])

  function openDrop() {
    updatePos()
    setOpen(true)
  }

  // Re-anchor on scroll or resize while open so it never drifts
  useEffect(() => {
    if (!open) return
    const onScrollResize = () => updatePos()
    window.addEventListener('scroll', onScrollResize, true)   // capture = catches all scroll events
    window.addEventListener('resize', onScrollResize)
    return () => {
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
    }
  }, [open, updatePos])

  // Close on outside click
  useEffect(() => {
    function onOut(e) {
      if (
        dropRef.current && !dropRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  // Institution search — debounced API call
  useEffect(() => {
    if (!instQuery.trim()) { setInstResults([]); return }
    const t = setTimeout(async () => {
      setInstLoading(true)
      try {
        const res = await API.get('/institutions/search', { params: { q: instQuery, limit: 8 } })
        setInstResults(res.data || [])
      } catch { setInstResults([]) }
      setInstLoading(false)
    }, 280)
    return () => clearTimeout(t)
  }, [instQuery])

  // Load state list from local JSON — instant
  useEffect(() => {
    if (activeTab !== 'area') return
    setStateResults(Object.keys(indiaCities).sort())
  }, [activeTab])

  // Pre-load cities for states that have matching cities
  useEffect(() => {
    if (!areaQuery.trim()) return
    const q = areaQuery.toLowerCase()
    stateResults.forEach(state => {
      const cities = indiaCities[state] || []
      if (cities.some(c => c.toLowerCase().includes(q))) {
        loadCitiesForState(state)
      }
    })
  }, [areaQuery, stateResults])

  function loadCitiesForState(state) {
    if (cityMap[state]) return
    const cities = indiaCities[state] || []
    setCityMap(prev => ({ ...prev, [state]: cities }))
  }

  function toggleAllIndia() { setLocation({ mode: 'all', institutions: [], cities: {}, statesOnly: {} }) }

  function toggleInstitution(name) {
    setLocation(prev => {
      if (prev.mode === 'all') return { mode: 'custom', institutions: [name], cities: {}, statesOnly: {} }
      const has = prev.institutions.includes(name)
      const next = has ? prev.institutions.filter(i => i !== name) : [...prev.institutions, name]
      const isEmpty = next.length === 0 && Object.keys(prev.cities).length === 0 && Object.keys(prev.statesOnly).length === 0
      return isEmpty ? { mode: 'all', institutions: [], cities: {}, statesOnly: {} } : { ...prev, mode: 'custom', institutions: next }
    })
  }

  function toggleCity(state, city) {
    setLocation(prev => {
      if (prev.mode === 'all') return { mode: 'custom', institutions: [], cities: { [state]: [city] }, statesOnly: {} }
      const stateCities = prev.cities[state] || []
      const has = stateCities.includes(city)
      const next = has ? stateCities.filter(c => c !== city) : [...stateCities, city]
      const newCities = { ...prev.cities }
      if (next.length === 0) delete newCities[state]
      else newCities[state] = next
      const newStatesOnly = { ...prev.statesOnly }
      delete newStatesOnly[state]
      const isEmpty = prev.institutions.length === 0 && Object.keys(newCities).length === 0 && Object.keys(newStatesOnly).length === 0
      return isEmpty ? { mode: 'all', institutions: [], cities: {}, statesOnly: {} } : { ...prev, mode: 'custom', cities: newCities, statesOnly: newStatesOnly }
    })
  }

  function toggleStateOnly(state) {
    setLocation(prev => {
      if (prev.mode === 'all') return { mode: 'custom', institutions: [], cities: {}, statesOnly: { [state]: true } }
      const has = prev.statesOnly[state]
      const newStatesOnly = { ...prev.statesOnly }
      if (has) delete newStatesOnly[state]
      else newStatesOnly[state] = true
      const newCities = { ...prev.cities }
      if (has) delete newCities[state]
      const isEmpty = prev.institutions.length === 0 && Object.keys(newCities).length === 0 && Object.keys(newStatesOnly).length === 0
      return isEmpty ? { mode: 'all', institutions: [], cities: {}, statesOnly: {} } : { ...prev, mode: 'custom', cities: newCities, statesOnly: newStatesOnly }
    })
  }

  const filteredStates = areaQuery.trim()
    ? stateResults.filter(s => {
        const q = areaQuery.toLowerCase()
        if (s.toLowerCase().includes(q)) return true
        const cities = indiaCities[s] || []
        return cities.some(c => c.toLowerCase().includes(q))
      })
    : stateResults

  const getIsExpanded = (state) => {
    if (expandedState === state) return true
    if (areaQuery.trim()) {
      const q = areaQuery.toLowerCase()
      if (state.toLowerCase().includes(q)) return false
      const cities = indiaCities[state] || []
      return cities.some(c => c.toLowerCase().includes(q))
    }
    return false
  }

  const isAllIndia = location.mode === 'all'
  const pillLabel = buildPillLabel(location)
  const isActive = !isAllIndia

  function Checkbox({ checked }) {
    return (
      <div style={{ width: '16px', height: '16px', borderRadius: '5px', flexShrink: 0, border: checked ? 'none' : '1.5px solid var(--border-hover)', background: checked ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', boxShadow: checked ? 'var(--shadow-accent)' : 'none', color: 'white' }}>
        {checked && <CheckIcon />}
      </div>
    )
  }

  const tabStyle = (id) => ({ flex: 1, padding: '0.5rem 0.4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: activeTab === id ? '700' : '500', color: activeTab === id ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === id ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.18s ease', fontFamily: 'var(--font-body)' })
  const rowStyle = (checked) => ({ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 0.15s ease', background: checked ? 'var(--accent-soft)' : 'transparent' })
  const searchInputStyle = { width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box', transition: 'border 0.2s' }

  const dropdown = open && createPortal(
    <div ref={dropRef} style={{
      position: 'fixed',
      top: dropPos.top,
      left: dropPos.left,
      width: '300px',
      background: 'var(--bg-surface)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      zIndex: 99999,
      overflow: 'hidden',
      animation: 'locPickerIn 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
    }}>
      <style>{`
        @keyframes locPickerIn { from { opacity:0; transform:translateY(-6px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        .loc-scroll::-webkit-scrollbar { width:3px }
        .loc-scroll::-webkit-scrollbar-thumb { background:var(--scrollbar); border-radius:99px }
        .loc-row:hover { background:var(--bg-card-hover) !important }
      `}</style>

      {/* Header */}
      <div style={{ padding: '0.75rem 0.75rem 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LocationIcon size={12} color="var(--accent)" /> Location
          </span>
          {/* Reset button — visible size, proper padding */}
          {!isAllIndia && (
            <button
              onClick={toggleAllIndia}
              style={{
                fontSize: '0.72rem', fontWeight: '600',
                color: 'var(--text-secondary)',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                padding: '0.25rem 0.6rem',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s ease',
                lineHeight: 1.4,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#ff6b6b'
                e.currentTarget.style.borderColor = 'rgba(255,107,107,0.4)'
                e.currentTarget.style.background = 'rgba(255,107,107,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--bg-card-hover)'
              }}
            >
              Reset
            </button>
          )}
        </div>

        <div className="loc-row" onClick={toggleAllIndia} style={rowStyle(isAllIndia)}>
          <Checkbox checked={isAllIndia} />
          <span style={{ fontSize: '0.82rem', fontWeight: isAllIndia ? '700' : '500', color: isAllIndia ? 'var(--accent)' : 'var(--text-primary)' }}>All India</span>
        </div>

        <div style={{ display: 'flex', marginTop: '0.4rem' }}>
          {[{ id: 'institution', label: 'Institution' }, { id: 'area', label: 'Area' }].map(t => (
            <button key={t.id} style={tabStyle(t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="loc-scroll" style={{ maxHeight: '300px', overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
        {activeTab === 'institution' && (
          <div>
            {userInstitution && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.58rem', letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.3rem', marginTop: '0.2rem' }}>Your Institution</div>
                <div className="loc-row" onClick={() => toggleInstitution(userInstitution)} style={rowStyle(location.institutions.includes(userInstitution))}>
                  <Checkbox checked={location.institutions.includes(userInstitution)} />
                  <span style={{ fontSize: '0.8rem', fontWeight: location.institutions.includes(userInstitution) ? '700' : '500', color: location.institutions.includes(userInstitution) ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1.3 }}>{userInstitution}</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
              </div>
            )}
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <input value={instQuery} onChange={e => setInstQuery(e.target.value)} placeholder="Search institutions..." style={searchInputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            {instLoading && (
              <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid var(--accent-soft)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
              </div>
            )}
            {!instLoading && instResults.map(inst => {
              const checked = location.institutions.includes(inst.name)
              return (
                <div key={inst.name} className="loc-row" onClick={() => toggleInstitution(inst.name)} style={rowStyle(checked)}>
                  <Checkbox checked={checked} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: checked ? '700' : '500', color: checked ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inst.name}</div>
                    {inst.city && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{inst.city}{inst.state ? `, ${inst.state}` : ''}</div>}
                  </div>
                </div>
              )
            })}
            {!instLoading && instQuery && instResults.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.4rem 0.25rem' }}>No results found.</div>}
            {!instQuery && !userInstitution && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.4rem 0.25rem' }}>Type to search institutions...</div>}
          </div>
        )}

        {activeTab === 'area' && (
          <div>
            <div style={{ position: 'relative', marginBottom: '0.5rem', marginTop: '0.25rem' }}>
              <input value={areaQuery} onChange={e => setAreaQuery(e.target.value)} placeholder="Search state or city..." style={searchInputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            {filteredStates.map(state => {
              const stateChecked = !!location.statesOnly[state]
              const stateCities = location.cities[state] || []
              const isExpanded = getIsExpanded(state)
              const loadedCities = cityMap[state] || []
              const visibleCities = areaQuery.trim()
                ? loadedCities.filter(c => c.toLowerCase().includes(areaQuery.toLowerCase()))
                : loadedCities
              return (
                <div key={state} style={{ marginBottom: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div className="loc-row" onClick={() => toggleStateOnly(state)} style={{ ...rowStyle(stateChecked), flex: 1 }}>
                      <Checkbox checked={stateChecked} />
                      <span style={{ fontSize: '0.8rem', fontWeight: stateChecked ? '700' : '500', color: stateChecked ? 'var(--accent)' : 'var(--text-primary)', flex: 1 }}>{state}</span>
                      {stateCities.length > 0 && !stateChecked && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: '700', background: 'var(--accent-soft)', padding: '1px 5px', borderRadius: '10px' }}>{stateCities.length}</span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (expandedState === state) setExpandedState(null)
                        else { setExpandedState(state); loadCitiesForState(state) }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.3rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Select specific cities"
                    >
                      <ChevronIcon size={10} flipped={isExpanded} />
                    </button>
                  </div>
                  {isExpanded && (
                    <div style={{ paddingLeft: '1.5rem', marginTop: '2px', marginBottom: '4px' }}>
                      {visibleCities.length === 0
                        ? <div style={{ padding: '0.4rem 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{loadedCities.length === 0 ? 'Loading cities...' : 'No cities match.'}</div>
                        : visibleCities.map(city => {
                          const cityChecked = stateCities.includes(city)
                          return (
                            <div key={city} className="loc-row" onClick={() => toggleCity(state, city)} style={rowStyle(cityChecked)}>
                              <Checkbox checked={cityChecked} />
                              <span style={{ fontSize: '0.75rem', fontWeight: cityChecked ? '700' : '400', color: cityChecked ? 'var(--accent)' : 'var(--text-secondary)' }}>{city}</span>
                            </div>
                          )
                        })
                      }
                    </div>
                  )}
                </div>
              )
            })}
            {filteredStates.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.4rem 0.25rem' }}>No results found.</div>}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isAllIndia && (
        <div style={{ padding: '0.55rem 0.75rem', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '600' }}>{pillLabel} selected</div>
        </div>
      )}
    </div>,
    document.body
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => { if (open) setOpen(false); else openDrop() }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.45rem',
          padding: '0.65rem 1rem',
          background: open || isActive ? 'var(--accent-soft)' : hovered ? 'var(--bg-card-hover)' : 'var(--bg-input)',
          border: open || isActive ? '1px solid var(--accent-border)' : hovered ? '1px solid var(--border-hover)' : '1px solid var(--border)',
          borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
          flexShrink: 0, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
        }}
      >
        <LocationIcon size={14} color={open || isActive || hovered ? 'var(--accent)' : 'var(--text-muted)'} />
        <span style={{ fontSize: '0.82rem', fontWeight: isActive ? '700' : '500', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: open || isActive ? 'var(--accent)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>{pillLabel}</span>
        <ChevronIcon size={9} flipped={open} />
      </button>
      {dropdown}
    </>
  )
}