import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api/axios'

function StarRating({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= rating ? 'var(--accent)' : 'none'}
          stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

function ItemCard({ item, onClick }) {
  const [hovered, setHovered] = useState(false)
  const img = item.images?.[0] || item.imageUrl

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--glass-bg-hover)' : 'var(--glass-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? '1px solid rgba(var(--accent-rgb),0.4)' : '1px solid var(--glass-border)',
        borderRadius: '16px', overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: hovered
          ? '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div style={{
        height: '130px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {img
          ? <img src={img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        }
      </div>
      <div style={{ padding: '0.85rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ₹{item.price?.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.62rem', fontWeight: '700', color: 'var(--text-ghost)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {item.condition}
          </span>
        </div>
      </div>
    </div>
  )
}

function SellerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(null)
  const [requestStatus, setRequestStatus] = useState(null)
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
  const isOwnProfile = currentUser?.id === parseInt(id)
  const isLoggedIn = !!localStorage.getItem('token')

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
      localStorage.removeItem('drag_backbtn_sellerprofile')
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('drag_backbtn_sellerprofile'))
        if (saved) backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`
      } catch {}
    }
  }, [draggable])
  useEffect(() => {
    if (!draggable || !backRef.current) return
    try {
      const saved = JSON.parse(localStorage.getItem('drag_backbtn_sellerprofile'))
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
      rafId = requestAnimationFrame(() => { el.style.transform = `translate(${dx}px, ${dy}px)` })
    }
    const onUp = () => {
      if (rafId) cancelAnimationFrame(rafId)
      el.style.cursor = 'grab'
      el.style.transition = ''
      el.style.zIndex = ''
      if (hasDragged) {
        localStorage.setItem('drag_backbtn_sellerprofile', JSON.stringify({ dx, dy }))
        const kill = (ce) => { ce.stopPropagation(); ce.preventDefault(); window.removeEventListener('click', kill, true) }
        window.addEventListener('click', kill, true)
      }
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', onUp)
    }
    const onMouse = (e) => onMove(e.clientX, e.clientY)
    const onTouch = (e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', onMouse)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouch, { passive: false })
    window.addEventListener('touchend', onUp)
  }, [draggable])
  const onBackMouseDown = useCallback((e) => {
    if (!draggable) return
    e.preventDefault()
    startBackDrag(e.clientX, e.clientY)
  }, [draggable, startBackDrag])
  const onBackTouchStart = useCallback((e) => {
    if (!draggable) return
    startBackDrag(e.touches[0].clientX, e.touches[0].clientY)
  }, [draggable, startBackDrag])

  // Close popup on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setActiveTab(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await API.get(`/users/${id}/profile`)
        setData(res.data)
        if (isLoggedIn && !isOwnProfile) {
          try {
            const reqRes = await API.get('/chat-requests')
            const sent = reqRes.data.sent || []
            const existing = sent.find(r => r.receiverId === parseInt(id))
            if (existing) setRequestStatus(existing.status)
          } catch {}
        }
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSendRequest() {
    if (!isLoggedIn) { navigate('/login'); return }
    setRequestLoading(true)
    try {
      await API.post('/chat-requests', {
        receiverId: parseInt(id),
        message: requestMessage || null,
      })
      setRequestStatus('pending')
      setShowRequestModal(false)
      setRequestMessage('')
    } catch (err) {
      const status = err.response?.data?.status
      if (status) setRequestStatus(status)
    } finally {
      setRequestLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>
      User not found.
    </div>
  )

  const { user, listings, soldItems, reviews, averageRating } = data

  const tabs = [
    { key: 'listings', label: `Listings`, count: listings.length },
    { key: 'sold', label: `Sold`, count: soldItems.length },
    { key: 'reviews', label: `Reviews`, count: reviews.length },
  ]

  return (
    <div className="seller-profile-page" style={{ minHeight: 'calc(100vh - 70px)', padding: '5rem 4rem 3rem' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes overlayFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes panelSlideUp { from { opacity:0; transform:translateY(60px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        .seller-profile-page { padding: 5rem 4rem 3rem }
        .seller-back-btn { position: absolute; left: -50px; top: 6px; width: 34px; height: 34px; }
        .popup-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .popup-scroll::-webkit-scrollbar { width: 4px; }
        .popup-scroll::-webkit-scrollbar-track { background: transparent; }
        .popup-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        @media (min-width: 1280px) { .seller-profile-page { padding: 6rem 5rem 3rem !important; } .seller-back-btn { left: -60px !important; } }
        @media (min-width: 769px) and (max-width: 1024px) { .seller-profile-page { padding: 4rem 2rem 3rem !important; } .seller-back-btn { left: -36px !important; } }
        @media (max-width: 768px) { .seller-profile-page { padding: 3.5rem 1.25rem 3rem !important; } .seller-back-btn { position: relative !important; left: 0 !important; top: 0 !important; margin-bottom: 1rem !important; } .popup-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important; } }
        @media (max-width: 480px) { .seller-profile-page { padding: 3rem 0.875rem 3rem !important; } }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header with back button */}
        <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
          <button
            ref={backRef}
            onClick={() => navigate(-1)}
            onMouseDown={onBackMouseDown}
            onTouchStart={onBackTouchStart}
            className="seller-back-btn back-btn-circle"
            style={{
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1.5px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: draggable ? 'grab' : 'pointer', flexShrink: 0,
              color: 'var(--text-muted)', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.boxShadow='0 0 8px 2px rgba(var(--accent-rgb),0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.boxShadow='none' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', lineHeight: '1.05', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {user.firstName}'s<br />
            <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Profile.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, fontWeight: '400' }}>
            {listings.length} active listing{listings.length !== 1 ? 's' : ''} · {soldItems.length} sold · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Profile card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px',
          padding: '2rem', marginBottom: '1.25rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
          position: 'relative', overflow: 'hidden',
          animation: 'fadeUp 0.4s ease both',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
              background: user.avatar ? 'transparent' : 'var(--accent-soft)',
              border: '2.5px solid rgba(var(--accent-rgb),0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 0 0 4px rgba(var(--accent-rgb),0.1)',
            }}>
              {user.avatar
                ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent)' }}>
                    {(user.firstName?.[0] || '?').toUpperCase()}
                  </span>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                  {user.firstName} {user.lastName}
                </h2>
                {averageRating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '3px 10px' }}>
                    <StarRating rating={Math.round(averageRating)} size={12} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      {averageRating} ({reviews.length})
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {user.institution && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    {user.institution}
                  </div>
                )}
                {user.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {user.city}{user.state ? `, ${user.state}` : ''}
                  </div>
                )}
                {user.bio && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                    "{user.bio}"
                  </div>
                )}
                <div style={{ fontSize: '0.68rem', color: 'var(--text-ghost)', marginTop: '0.25rem', fontWeight: '600', letterSpacing: '0.3px' }}>
                  Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Request Chat button */}
            {!isOwnProfile && (
              <div style={{ flexShrink: 0 }}>
                {requestStatus === 'pending' ? (
                  <div style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffd43b', boxShadow: '0 0 6px rgba(255,212,59,0.6)' }} />
                    Request Pending
                  </div>
                ) : requestStatus === 'accepted' ? (
                  <button onClick={() => navigate('/messages')} style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700', boxShadow: '0 4px 15px rgba(var(--accent-rgb),0.35)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Open Chat
                  </button>
                ) : requestStatus === 'declined' ? (
                  <div style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', fontSize: '0.82rem', color: '#ff4d4d', fontWeight: '600' }}>
                    Request Declined
                  </div>
                ) : (
                  <button
                    onClick={() => isLoggedIn ? setShowRequestModal(true) : navigate('/login')}
                    style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700', boxShadow: '0 4px 15px rgba(var(--accent-rgb),0.35)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(var(--accent-rgb),0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(var(--accent-rgb),0.35)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Request Chat
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem', animation: 'fadeUp 0.4s ease 0.1s both' }}>
          {tabs.map(tab => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px', padding: '1.25rem', textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                position: 'relative', overflow: 'hidden',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(var(--accent-rgb),0.3)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(var(--accent-rgb),0.1) 0%, rgba(var(--accent-rgb),0.04) 100%)' }}
              onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
              <div style={{ fontSize: '1.75rem', fontWeight: '900', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-1px' }}>
                {tab.count}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '4px' }}>
                {tab.label}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: '600', marginTop: '4px' }}>
                tap to view →
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Popup Panel ── */}
      {activeTab && (
        <div
          onClick={() => setActiveTab(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            animation: 'overlayFadeIn 0.2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '960px',
              maxHeight: '82vh',
              background: 'var(--glass-bg-deep)',
              backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '24px 24px 0 0',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
              animation: 'panelSlideUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.75rem', paddingBottom: '0.25rem', flexShrink: 0 }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Panel header */}
            <div style={{
              padding: '0.75rem 1.5rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  {activeTab === 'listings' ? `Active Listings` : activeTab === 'sold' ? `Sold Items` : `Reviews`}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeTab === 'listings' ? listings.length : activeTab === 'sold' ? soldItems.length : reviews.length} {activeTab === 'listings' ? 'item' : activeTab === 'sold' ? 'item' : 'review'}{(activeTab === 'listings' ? listings.length : activeTab === 'sold' ? soldItems.length : reviews.length) !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Tab switcher inside panel */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    style={{
                      padding: '0.4rem 0.9rem', borderRadius: '20px',
                      background: activeTab === t.key ? 'var(--accent-soft)' : 'transparent',
                      border: activeTab === t.key ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                      color: activeTab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: '0.72rem', fontWeight: activeTab === t.key ? '700' : '500',
                      cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                    }}
                  >
                    {t.label} <span style={{ opacity: 0.6 }}>({t.count})</span>
                  </button>
                ))}
                <button
                  onClick={() => setActiveTab(null)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.12)'; e.currentTarget.style.color = '#ff6b6b' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="popup-scroll" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem' }}>

              {activeTab === 'listings' && (
                listings.length === 0
                  ? <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.2)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.4 }}>∅</div>
                      No active listings.
                    </div>
                  : <div className="popup-grid">
                      {listings.map(item => <ItemCard key={item.id} item={item} onClick={() => navigate(`/items/${item.id}`)} />)}
                    </div>
              )}

              {activeTab === 'sold' && (
                soldItems.length === 0
                  ? <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.2)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.4 }}>∅</div>
                      No sold items yet.
                    </div>
                  : <div className="popup-grid">
                      {soldItems.map(item => (
                        <div key={item.id} style={{ position: 'relative' }}>
                          <ItemCard item={item} onClick={() => navigate(`/items/${item.id}`)} />
                          <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.58rem', fontWeight: '800', color: 'rgba(255,107,107,0.9)', letterSpacing: '1px', textTransform: 'uppercase', border: '1px solid rgba(255,107,107,0.2)' }}>
                            SOLD
                          </div>
                        </div>
                      ))}
                    </div>
              )}

              {activeTab === 'reviews' && (
                reviews.length === 0
                  ? <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.2)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.4 }}>∅</div>
                      No reviews yet.
                    </div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {reviews.map(review => (
                        <div key={review.id} style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-soft)', border: '1.5px solid rgba(var(--accent-rgb),0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                              {review.reviewer.avatar
                                ? <img src={review.reviewer.avatar} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent)' }}>{review.reviewer.firstName?.[0]?.toUpperCase()}</span>
                              }
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>
                                {review.reviewer.firstName} {review.reviewer.lastName}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>
                                {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                            <StarRating rating={review.rating} />
                          </div>
                          {review.comment && (
                            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', paddingLeft: '3rem', lineHeight: '1.5' }}>
                              "{review.comment}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Chat Modal */}
      {showRequestModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowRequestModal(false)}>
          <div
            style={{ width: '100%', maxWidth: '420px', padding: '2rem', background: 'var(--glass-bg-modal)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--glass-border)', borderRadius: '24px', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.3s cubic-bezier(0.175,0.885,0.32,1.275)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Request Chat</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Send a chat request to {user.firstName}. They can accept or decline.
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.62rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.45rem' }}>
                Message (optional)
              </label>
              <textarea
                value={requestMessage}
                onChange={e => setRequestMessage(e.target.value)}
                placeholder={`Hi ${user.firstName}, I wanted to ask about...`}
                rows={3}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)', transition: 'border 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'rgba(var(--accent-rgb),0.35)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowRequestModal(false)} style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>
                Cancel
              </button>
              <button onClick={handleSendRequest} disabled={requestLoading} style={{ flex: 1, padding: '0.75rem', background: requestLoading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: requestLoading ? 'rgba(255,255,255,0.25)' : 'white', border: 'none', borderRadius: '12px', cursor: requestLoading ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '700', boxShadow: requestLoading ? 'none' : '0 4px 15px rgba(var(--accent-rgb),0.35)', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}>
                {requestLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerProfile