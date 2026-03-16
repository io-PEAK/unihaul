import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'

const specLabels = {
  brand: 'Brand', ram: 'RAM', storage: 'Storage', processor: 'Processor', display: 'Display',
  gender: 'Gender', color: 'Color', type: 'Type',
  subject: 'Subject', author: 'Author', edition: 'Edition',
  material: 'Material', dimensions: 'Dimensions',
  sport: 'Sport', size: 'Size', capacity: 'Capacity', platform: 'Platform',
  mode: 'Mode', experience: 'Experience', ingredients: 'Ingredients', allergens: 'Allergens',
}

function ZoomModal({ src, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [onClose])
  return createPortal(
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(24px)', display:'flex', alignItems:'center', justifyContent:'center', animation:'zmFadeIn 0.2s ease', cursor:'zoom-out' }}>
      <img src={src} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth:'88vw', maxHeight:'88vh', objectFit:'contain', borderRadius:'16px', boxShadow:'0 40px 120px rgba(0,0,0,0.9)', animation:'zmScaleIn 0.28s cubic-bezier(0.175,0.885,0.32,1.275)', cursor:'default' }} />
      <button onClick={onClose} style={{ position:'fixed', top:'1.25rem', right:'1.25rem', width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.8)', fontSize:'1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100000 }}>✕</button>
      <style>{`@keyframes zmFadeIn{from{opacity:0}to{opacity:1}} @keyframes zmScaleIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>,
    document.body
  )
}

function SolarCarousel({ images, isMobile }) {
  const n = images.length
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [pos, setPos]       = useState(0)
  const [theme, setTheme]   = useState(() => document.documentElement.dataset.theme || 'ember')

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.dataset.theme || 'ember')
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  const posRef    = useRef(0)
  const targetRef = useRef(0)
  const rafRef    = useRef(null)
  const snapTimer = useRef(null)
  const wrapRef   = useRef(null)
  const nRef      = useRef(n)
  const touchRef  = useRef(null)

  useEffect(() => { nRef.current = n }, [n])

  function tick() {
    const diff = targetRef.current - posRef.current
    if (Math.abs(diff) < 0.0008) {
      posRef.current = targetRef.current
      setPos(targetRef.current)
      rafRef.current = null
      return
    }
    posRef.current += diff * 0.11
    setPos(posRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }

  function startSpring() {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick)
  }

  function goTo(idx) {
    const nn = nRef.current
    const wrapped = ((idx % nn) + nn) % nn
    const cur = ((Math.round(targetRef.current) % nn) + nn) % nn
    let delta = wrapped - cur
    if (delta >  nn / 2) delta -= nn
    if (delta < -nn / 2) delta += nn
    targetRef.current += delta
    setActive(wrapped)
    startSpring()
  }

  function snap() {
    const nn = nRef.current
    const nearest = Math.round(posRef.current)
    const wrapped = ((nearest % nn) + nn) % nn
    targetRef.current = nearest
    setActive(wrapped)
    startSpring()
  }

  const isMobileRef = useRef(isMobile)
  useEffect(() => { isMobileRef.current = isMobile }, [isMobile])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    function onWheel(e) {
      if (isMobileRef.current) return
      e.preventDefault()
      e.stopPropagation()
      const clamped = Math.max(-40, Math.min(40, e.deltaY))
      targetRef.current += clamped / 180
      startSpring()
      clearTimeout(snapTimer.current)
      snapTimer.current = setTimeout(snap, 150)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, []) // eslint-disable-line

  const velRef      = useRef(0)
  const lastTimeRef = useRef(0)
  const lastPosRef  = useRef(0)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const dirLocked   = useRef(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    function handleTouchStart(e) {
      const t = e.touches[0]
      touchStartX.current = t.clientX
      touchStartY.current = t.clientY
      touchRef.current    = t.clientX
      lastPosRef.current  = t.clientX
      lastTimeRef.current = Date.now()
      velRef.current      = 0
      dirLocked.current   = null
    }

    function handleTouchMove(e) {
      if (isMobileRef.current) {
        if (touchRef.current === null) return
        const t  = e.touches[0]
        const dx = Math.abs(t.clientX - touchStartX.current)
        const dy = Math.abs(t.clientY - touchStartY.current)
        if (!dirLocked.current) {
          if (dx > 10 || dy > 10) dirLocked.current = dx > dy ? 'h' : 'v'
          else return
        }
        if (dirLocked.current === 'h') {
          e.preventDefault()
          e.stopPropagation()
          const delta = touchRef.current - t.clientX
          targetRef.current += delta / 40
          const now = Date.now()
          const dt  = now - lastTimeRef.current
          if (dt > 0) velRef.current = (lastPosRef.current - t.clientX) / dt
          lastPosRef.current  = t.clientX
          lastTimeRef.current = now
          touchRef.current    = t.clientX
          startSpring()
        }
      } else {
        if (touchRef.current === null) return
        e.preventDefault()
        targetRef.current += (touchRef.current - e.touches[0].clientY) / 160
        touchRef.current = e.touches[0].clientY
        startSpring()
      }
    }

    function handleTouchEnd() {
      if (isMobileRef.current && dirLocked.current === 'h') {
        targetRef.current += velRef.current * 80
      }
      goTo(Math.round(targetRef.current))
      touchRef.current  = null
      dirLocked.current = null
      velRef.current    = 0
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove',  handleTouchMove,  { passive: false })
    el.addEventListener('touchend',   handleTouchEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove',  handleTouchMove)
      el.removeEventListener('touchend',   handleTouchEnd)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    function onKey(e) {
      if (isMobile) {
        if (e.key === 'ArrowLeft')  goTo(Math.round(targetRef.current) - 1)
        if (e.key === 'ArrowRight') goTo(Math.round(targetRef.current) + 1)
      } else {
        if (e.key === 'ArrowUp')   goTo(Math.round(targetRef.current) - 1)
        if (e.key === 'ArrowDown') goTo(Math.round(targetRef.current) + 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [n, isMobile]) // eslint-disable-line

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    clearTimeout(snapTimer.current)
  }, [])

  if (!images || n === 0) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'0.6rem' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ opacity:0.45, color:'var(--text-primary)' }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span style={{ fontSize:'0.68rem', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text-muted)', fontWeight:'600', opacity:0.8 }}>No photos</span>
    </div>
  )

  if (n === 1) return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
        <div onClick={() => setZoomed(true)} style={{ width:'260px', height:'260px', borderRadius:'20px', overflow:'hidden', cursor:'zoom-in', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
          <img src={images[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        </div>
      </div>
      {zoomed && <ZoomModal src={images[0]} onClose={() => setZoomed(false)} />}
    </>
  )

  // ── MOBILE: pure CSS scroll-snap carousel (no JS touch handling needed) ──────
  const isChalk = theme === 'chalk'
  if (isMobile) {
    const liveActive = ((Math.round(pos) % n) + n) % n
    return (
      <>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', width:'100%' }}>

          {/* scroll-snap track */}
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            width: '100%',
            gap: '12px',
            padding: '8px 24px',
            boxSizing: 'border-box',
            scrollbarWidth: 'none',
          }}
          onScroll={e => {
            const el = e.currentTarget
            const idx = Math.round(el.scrollLeft / (el.offsetWidth - 48 + 12))
            setActive(Math.min(Math.max(idx, 0), n - 1))
          }}
          ref={el => {
            // scroll to active on dot click
            if (el) el._scrollRef = el
          }}
          id="mob-carousel-track"
          >
            <style>{`.mob-carousel-track::-webkit-scrollbar{display:none}`}</style>
            {images.map((src, i) => (
              <div key={i} style={{
                scrollSnapAlign: 'center',
                flexShrink: 0,
                width: 'calc(100% - 48px)',
                aspectRatio: '1',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
              }}
                onClick={() => { if (i === active) setZoomed(true) }}
              >
                <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              </div>
            ))}
          </div>

          {/* dot indicators */}
          <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', borderRadius:'999px', background: isChalk ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', border: isChalk ? '1.5px solid rgba(0,0,0,0.18)' : '1px solid rgba(255,255,255,0.14)' }}>
            {images.map((_, i) => {
              const isAct = i === active
              return (
                <button key={i}
                  onClick={() => {
                    setActive(i)
                    const track = document.getElementById('mob-carousel-track')
                    if (track) track.scrollTo({ left: i * (track.offsetWidth - 48 + 12), behavior: 'smooth' })
                  }}
                  style={{ width: isAct ? '22px' : '7px', height: isAct ? '6px' : '5px', borderRadius:'999px', border:'none', padding:0, cursor:'pointer', flexShrink:0, background: isAct ? 'linear-gradient(90deg,var(--accent),var(--accent-alt))' : isChalk ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.22)', boxShadow: isAct ? '0 0 8px var(--accent)' : 'none', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
                />
              )
            })}
            <span style={{ fontSize:'0.58rem', fontWeight:'800', letterSpacing:'1px', color:'var(--accent)', marginLeft:'4px', opacity:0.85 }}>{active+1}/{n}</span>
          </div>

        </div>
        {zoomed && <ZoomModal src={images[active]} onClose={() => setZoomed(false)} />}
      </>
    )
  }

  // ── DESKTOP: original vertical solar carousel ────────────────────────────────
  const C    = 280
  const S    = 205
  const SP   = 26
  const SLOT = C + SP
  const H    = S + SP + C + SP + S
  const MID  = H / 2

  const base  = Math.round(pos)
  const slots = [-1, 0, 1].map(off => ({
    off,
    imgIdx:  ((base + off) % n + n) % n,
    realOff: (base + off) - pos,
  }))

  const liveActive = ((Math.round(pos) % n) + n) % n

  return (
    <>
      <div style={{ display:'flex', alignItems:'center', gap:'28px', justifyContent:'center' }}>

        {/* ── Carousel ── */}
        <div
          ref={wrapRef}
          style={{
            position: 'relative',
            width:  `${C}px`,
            height: `${H}px`,
            cursor: 'ns-resize',
            flexShrink: 0,
            overflow: 'visible',
            WebkitMaskImage: !isChalk
              ? 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)'
              : undefined,
            maskImage: !isChalk
              ? 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)'
              : undefined,
          }}
        >
          {slots.map(({ off, imgIdx, realOff }) => {
            const a     = Math.abs(realOff)
            const sz    = C - (C - S) * Math.min(a, 1)
            const sc    = Math.max(0.86, 1 - a * 0.1)
            const rx    = realOff * -20
            const zi    = a < 0.35 ? 10 : 5
            const isCtr = a < 0.4
            return (
              <div key={`s${off}`}
                onClick={() => isCtr ? setZoomed(true) : goTo(base + off)}
                style={{
                  position: 'absolute', left: '50%',
                  top: `${MID + realOff * SLOT}px`,
                  width: `${sz}px`, height: `${sz}px`,
                  transform: `translateX(-50%) translateY(-50%) rotateX(${rx}deg) scale(${sc})`,
                  borderRadius: `${Math.max(14, 20 - a * 4)}px`,
                  overflow: 'hidden',
                  zIndex: zi,
                  cursor: isCtr ? 'zoom-in' : 'pointer',
                  boxShadow: isCtr
                    ? '0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1)'
                    : '0 6px 18px rgba(0,0,0,0.3)',
                }}
              >
                <img src={images[imgIdx]} alt="" draggable={false}
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', userSelect:'none', pointerEvents:'none' }}
                />
              </div>
            )
          })}
        </div>

        {/* ── Indicator strip ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}>
          {/* pill track */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 7px',
            borderRadius: '999px',
            background: isChalk ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
            border: isChalk ? '1.5px solid rgba(0,0,0,0.18)' : '1px solid rgba(255,255,255,0.14)',
            boxShadow: isChalk ? '0 2px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)' : '0 2px 12px rgba(0,0,0,0.3)',
          }}>
            {images.map((_, i) => {
              const isActive = i === liveActive
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Image ${i + 1}`}
                  style={{
                    width:  isActive ? '6px'  : '5px',
                    height: isActive ? '22px' : '7px',
                    borderRadius: '999px',
                    border: 'none',
                    padding: 0,
                    flexShrink: 0,
                    cursor: 'pointer',
                    background: isActive
                      ? 'linear-gradient(180deg, var(--accent) 0%, var(--accent-alt) 100%)'
                      : isChalk ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.22)',
                    boxShadow: isActive ? '0 0 8px var(--accent)' : 'none',
                    transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                />
              )
            })}
          </div>

          {/* counter badge */}
          <div style={{
            fontSize: '0.6rem',
            fontWeight: '800',
            letterSpacing: '1px',
            color: 'var(--accent)',
            background: isChalk ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)',
            border: isChalk ? '1.5px solid rgba(0,0,0,0.16)' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: '999px',
            padding: '4px 9px',
            lineHeight: 1,
            boxShadow: isChalk ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
          }}>
            {liveActive + 1}<span style={{ opacity: 0.9, fontWeight: '700', color: 'var(--accent)', margin: '0 2px' }}>/</span>{n}
          </div>
        </div>

      </div>

      {zoomed && <ZoomModal src={images[active]} onClose={() => setZoomed(false)} />}
    </>
  )
}

function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  

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
      localStorage.removeItem('drag_backbtn_itemdetail')
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('drag_backbtn_itemdetail'))
        if (saved) backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`
      } catch {}
    }
  }, [draggable])
  useEffect(() => {
    if (!draggable || !backRef.current) return
    try {
      const saved = JSON.parse(localStorage.getItem('drag_backbtn_itemdetail'))
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
        localStorage.setItem('drag_backbtn_itemdetail', JSON.stringify({ dx, dy }))
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

  const [item, setItem]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [cartQty, setCartQty]         = useState(0)
  const viewCartRef = useRef(null)
  const [cartLoading, setCartLoading] = useState(false)
  const [watching,    setWatching]    = useState(false)
  const [watchLoading,setWatchLoading]= useState(false)

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const myId = user?.id

  // Track viewport width for responsive layout switching
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth <= 768) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Lock scroll only on desktop (carousel scroll behaviour)
  useEffect(() => {
    if (isMobile) return
    const el = document.documentElement
    const prev = el.style.overflow
    el.style.overflow = 'hidden'
    return () => { el.style.overflow = prev }
  }, [isMobile])

  useEffect(() => {
    const fetchItem = async () => {
      try { setLoading(true); setError(null); const res = await API.get(`/items/${id}`); setItem(res.data) }
      catch { setError('Item not found.') }
      finally { setLoading(false) }
    }
    fetchItem()
  }, [id])

  useEffect(() => {
    if (!item || !user || item.sellerId === parseInt(myId)) return
    API.get(`/items/${item.id}/watch`).then(r => setWatching(r.data.watching)).catch(() => {})
  }, [item?.id])

  useEffect(() => {
    if (!item || !user) return
    const check = async () => {
      try {
        const res = await API.get('/cart')
        const found = res.data.find(c => c.itemId === item.id || c.item?.id === item.id)
        if (found) {
          setCartQty(found.quantity || 1)
          setTimeout(() => viewCartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
        }
      } catch {}
    }
    check()
  }, [item]) // eslint-disable-line

  async function handleAddToCart() {
    if (!user) { navigate('/login'); return }
    try {
      setCartLoading(true)
      const res = await API.post('/cart', { itemId: item.id, quantity: 1 })
      setCartQty(res.data.quantity || 1)
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { delta: 1 } }))
      setTimeout(() => viewCartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    } catch (err) {
      const msg = err.response?.data?.error || ''
      if (msg.includes('already in cart')) {
        try { const r = await API.get('/cart'); const found = r.data.find(c => c.itemId === item.id || c.item?.id === item.id); if (found) setCartQty(found.quantity || 1) } catch {}
      } else { alert(msg || 'Failed to add to cart.') }
    } finally { setCartLoading(false) }
  }

  async function handleQtyChange(newQty) {
    if (cartLoading) return
    const totalStock = item?.quantity ?? 1
    if (newQty < 1) {
      try {
        setCartLoading(true)
        await API.delete(`/cart/${item.id}`)
        setCartQty(0)
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { delta: -1 } }))
      } catch { alert('Failed to remove from cart.') }
      finally { setCartLoading(false) }
      return
    }
    if (newQty > totalStock) return
    try { setCartLoading(true); await API.patch(`/cart/${item.id}`, { quantity: newQty }); setCartQty(newQty) }
    catch (err) { alert(err.response?.data?.error || 'Failed to update.') }
    finally { setCartLoading(false) }
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:'6rem 2rem' }}>
      <div style={{ width:'40px', height:'40px', border:'3px solid rgba(255,255,255,0.08)', borderTop:'3px solid var(--accent)', borderRadius:'50%', margin:'0 auto 1rem', animation:'idSpin 0.8s linear infinite' }} />
      <style>{`@keyframes idSpin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>Loading item...</p>
    </div>
  )

  if (error || !item) return (
    <div style={{ textAlign:'center', padding:'6rem 2rem' }}>
      <div style={{ width:'72px', height:'72px', margin:'0 auto 1.5rem', background:'var(--glass-bg-row)', borderRadius:'20px', border:'1px solid var(--glass-border-row)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', opacity:0.5 }}>∅</div>
      <h2 style={{ fontSize:'1.4rem', fontWeight:'700', color:'var(--text-secondary)', marginBottom:'0.5rem' }}>Item not found</h2>
      <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'1.75rem' }}>This listing may have been removed.</p>
      <button onClick={() => navigate(-1)} className="btn-primary" style={{ width:'auto', padding:'0.6rem 1.75rem' }}>← Back</button>
    </div>
  )

  const status     = item.status?.toLowerCase()
  const isMyItem   = parseInt(myId) === parseInt(item.seller?.id)

  async function handleWatch() {
    if (!user) return navigate('/login')
    setWatchLoading(true)
    try {
      if (watching) {
        await API.delete(`/items/${item.id}/watch`)
        setWatching(false)
      } else {
        await API.post(`/items/${item.id}/watch`)
        setWatching(true)
      }
    } catch {}
    setWatchLoading(false)
  }
  const totalStock = item.quantity ?? 1
  const stockLeft  = totalStock - cartQty

  const specs = item.specs && typeof item.specs === 'object'
    ? Object.entries(item.specs).filter(([, v]) => v && String(v).trim() !== '')
    : []

  let imageList = []
  if (item.images && Array.isArray(item.images) && item.images.length > 0) imageList = item.images.filter(Boolean)
  else if (item.imageUrl) imageList = [item.imageUrl]

  const infoGrid = [
    { label:'Seller',    value:`${item.seller?.firstName||''} ${item.seller?.lastName||''}`.trim()||'Unknown' },
    { label:'Condition', value:item.condition },
    { label:'Category',  value:item.category },
    { label:'Status',    value:status, isStatus:true },
    { label:'Stock',     value:status==='sold'?'0 remaining':`${stockLeft}` },
    ...(item.subcategory?[{ label:item.category==='Clothing'?'Size':item.category==='Books & Notes'?'Semester':'Subcategory', value:item.subcategory }]:[]),
    ...(item.purchaseYear ? [{ label:'Purchased', value:`${item.purchaseYear} · ${new Date().getFullYear() - item.purchaseYear} yr${new Date().getFullYear() - item.purchaseYear === 1 ? '' : 's'} old` }] : []),
    ...(item.expiryDate   ? [{ label:'Expires',   value: new Date(item.expiryDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) }] : []),
    ...(item.madeOn       ? [{ label:'Made On',   value: new Date(item.madeOn).toLocaleDateString('en-IN',     { day:'numeric', month:'short', year:'numeric' }) }] : []),
  ]

  return (
    <div className="id-page-wrap" style={{ fontFamily:'var(--font-body)' }}>
      {/* Fixed back button — mobile only, left edge */}
      <button
        ref={backRef}
        className="id-back-fixed"
        onClick={() => navigate(-1)}
        onMouseDown={onBackMouseDown}
        onTouchStart={onBackTouchStart}
        style={{ cursor: draggable ? 'grab' : 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.boxShadow='0 0 8px 2px rgba(var(--accent-rgb),0.35)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.boxShadow='none' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <style>{`
        @keyframes idSpin { to { transform: rotate(360deg); } }

        /* ════════════════════════════════════
           Base (desktop) — unchanged layout
        ════════════════════════════════════ */
        .id-page-wrap {
          padding: 2rem 3rem;
          max-width: 1200px;
          margin: 0 auto;
          height: calc(100vh - 57px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .id-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 3rem;
          flex: 1;
          min-height: 0;
        }
        .id-carousel-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 0;
          position: relative;
        }
        .id-back-btn {
          display: flex;
          position: absolute;
          top: 10%;
          left: -2.5rem;
        }
        .id-detail-col {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-2xl);
          padding: 2rem;
          box-shadow: var(--shadow-card);
          position: relative;
          align-self: start;
          max-height: 100%;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .id-title {
          font-size: 2rem;
        }
        .id-price {
          font-size: 2.6rem;
        }
        .id-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
          margin-bottom: 1.25rem;
        }

        /* ════════════════════════════════════
           769px – 1024px  (tablet)
        ════════════════════════════════════ */
        @media (max-width: 1024px) {
          .id-page-wrap {
            padding: 2rem 2rem;
          }
          .id-grid {
            grid-template-columns: 320px 1fr;
            gap: 2rem;
          }
          .id-back-btn {
            left: -1.75rem;
          }
          .id-title {
            font-size: 1.7rem;
          }
          .id-price {
            font-size: 2.1rem;
          }
        }

        /* ════════════════════════════════════
           < 768px  (mobile)
        ════════════════════════════════════ */
        @media (max-width: 768px) {
          .id-page-wrap {
            padding: 1.25rem 1.25rem 2rem;
            height: auto;
            overflow: visible;
          }
          .id-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .id-carousel-col {
            height: auto;
            justify-content: center;
          }
          /* Back button hidden — fixed button handles mobile */
          .id-back-btn {
            display: none;
          }
          /* Carousel col becomes a column so back btn + carousel stack */
          .id-carousel-col {
            align-items: flex-start;
          }
          .id-carousel-inner {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
          }
          .id-detail-col {
            max-height: none;
            overflow-y: visible;
          }
          .id-title {
            font-size: 1.5rem;
          }
          .id-price {
            font-size: 2rem;
          }
          .id-info-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* ════════════════════════════════════
           < 480px  (small mobile)
        ════════════════════════════════════ */
        @media (max-width: 480px) {
          .id-page-wrap {
            padding: 1rem 1rem 2rem;
          }
          .id-carousel-col {
            height: auto;
          }
          .id-title {
            font-size: 1.3rem;
          }
          .id-price {
            font-size: 1.75rem;
          }
          .id-info-grid {
            grid-template-columns: 1fr;
          }
          .id-detail-col {
            padding: 1.25rem;
          }
        }
        /* ── Mobile-only fixed back button (left edge, vertically centered) ── */
        .id-back-fixed {
          display: none;
        }
        @media (max-width: 900px) {
          .id-back-btn {
            display: none;
          }
          .id-back-fixed {
            display: flex;
            position: fixed;
            left: 0.6rem;
            top: 50%;
            transform: translateY(-50%);
            z-index: 40;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1.5px solid rgba(255,255,255,0.1);
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: rgba(255,255,255,0.5);
            transition: all 0.15s;
          }
        }
      `}</style>

      <div className="id-grid">

        <div className="id-carousel-col">
          {/* Back button — absolute on desktop, static/inline on mobile via CSS */}
          <button
            className="id-back-btn"
            onClick={() => navigate(-1)}
            onMouseDown={onBackMouseDown}
            onTouchStart={onBackTouchStart}
            style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1.5px solid rgba(255,255,255,0.1)', alignItems:'center', justifyContent:'center', cursor: draggable ? 'grab' : 'pointer', color:'rgba(255,255,255,0.5)', transition:'all 0.15s', flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.boxShadow='0 0 8px 2px rgba(var(--accent-rgb),0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.boxShadow='none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="id-carousel-inner">
            <SolarCarousel images={imageList} isMobile={isMobile} />
          </div>
        </div>

        <div className="id-detail-col">
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'var(--glass-shimmer)' }} />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.6rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <span style={{ fontSize:'0.6rem', letterSpacing:'2px', textTransform:'uppercase', color:'var(--text-faint)', fontWeight:'700' }}>{item.category}</span>
              {item.subcategory && (<><span style={{ color:'var(--text-ghost)' }}>›</span><span style={{ fontSize:'0.6rem', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--accent)', opacity:0.7, fontWeight:'700' }}>{item.subcategory}</span></>)}
            </div>
            {watching && !isMyItem && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'0.62rem', fontWeight:'800', letterSpacing:'0.8px', textTransform:'uppercase', color:'#ef4444', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', padding:'3px 8px', borderRadius:'6px' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                Watching
              </span>
            )}
          </div>

          <h1 className="id-title" style={{ fontWeight:'900', letterSpacing:'-1px', lineHeight:'1.15', color:'var(--text-primary)', margin:'0 0 0.75rem' }}>{item.title}</h1>
          <div className="id-price" style={{ fontWeight:'900', letterSpacing:'-1.5px', marginBottom:'1.5rem' }}><span className="price-text">₹{Number(item.price).toLocaleString('en-IN')}</span></div>

          <div className="divider" />

          <div className="id-info-grid">
            {infoGrid.map(({ label, value, isStatus }) => (
              <div key={label} className="glass-infobox" style={{ padding:'0.85rem 1rem' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'var(--glass-shimmer)' }} />
                <div className="label-micro">{label}</div>
                {isStatus
                  ? <span className={`status-pill status-${status}`} style={{ marginTop:'0.1rem' }}>{value}</span>
                  : <div style={{ fontWeight:'600', color:'var(--text-primary)', fontSize:'0.9rem', textTransform:'capitalize' }}>{value}</div>}
              </div>
            ))}
          </div>

          {specs.length > 0 && (
            <div style={{ marginBottom:'1.25rem', background:'var(--accent-soft)', border:'1px solid var(--accent-border)', borderRadius:'var(--radius-lg)', padding:'1.1rem 1.2rem', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg, transparent, var(--accent-border), transparent)' }} />
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.875rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" style={{ opacity:0.7 }}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>
                <span style={{ fontSize:'0.6rem', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--accent)', fontWeight:'800', opacity:0.8 }}>Specifications</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:'0.55rem' }}>
                {specs.map(([key, value]) => (
                  <div key={key} style={{ background:'var(--glass-bg-row)', border:'1px solid var(--glass-border-row)', borderRadius:'var(--radius-sm)', padding:'0.55rem 0.75rem' }}>
                    <div className="label-micro" style={{ color:'var(--accent)', opacity:0.6, marginBottom:'0.2rem' }}>{specLabels[key]||key}</div>
                    <div style={{ fontWeight:'600', color:'var(--text-primary)', fontSize:'0.84rem' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.description && (
            <div className="glass-infobox" style={{ padding:'1.1rem 1.2rem', marginBottom:'1.5rem' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'var(--glass-shimmer)' }} />
              <div className="label-micro" style={{ marginBottom:'0.55rem' }}>Description</div>
              <p style={{ color:'var(--text-secondary)', lineHeight:'1.7', margin:0, fontSize:'0.9rem' }}>{item.description}</p>
            </div>
          )}

          <div className="divider" />

          {/* ── Watch button — only for buyers ── */}
          {!isMyItem && user && (
            <button
              onClick={handleWatch}
              disabled={watchLoading}
              onMouseEnter={e => { if(!watchLoading){ e.currentTarget.style.borderColor = watching ? 'rgba(255,107,107,0.6)' : 'var(--accent)'; e.currentTarget.style.color = watching ? '#ff6b6b' : 'var(--accent)' }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = watching ? 'rgba(255,107,107,0.35)' : 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = watching ? '#ff6b6b' : 'var(--text-secondary)' }}
              style={{ width:'100%', padding:'0.65rem', background: watching ? 'rgba(255,107,107,0.08)' : 'transparent', border: `1px solid ${watching ? 'rgba(255,107,107,0.35)' : 'rgba(255,255,255,0.12)'}`, borderRadius:'var(--radius-md)', color: watching ? '#ff6b6b' : 'var(--text-secondary)', fontSize:'0.82rem', fontWeight:'700', cursor: watchLoading ? 'not-allowed' : 'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.45rem', fontFamily:'var(--font-body)', marginBottom:'0.6rem', opacity: watchLoading ? 0.6 : 1 }}
            >
              {watchLoading ? (
                <div style={{ width:'13px', height:'13px', border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'idSpin 0.7s linear infinite' }} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill={watching ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              )}
              {watching ? 'Watching — tap to unwatch' : 'Watch for price drops'}
            </button>
          )}

          {isMyItem ? (
            <div style={{ background:'var(--glass-bg-row)', border:'1px solid var(--glass-border-row)', borderRadius:'var(--radius-md)', padding:'1rem 1.1rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'rgba(var(--accent-rgb),0.12)', border:'1px solid rgba(var(--accent-rgb),0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize:'0.8rem', fontWeight:'700', color:'var(--text-primary)', lineHeight:1.2 }}>Your Listing</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>Manage, edit, or update status</div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/dashboard?item=${item.id}`)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='var(--shadow-accent)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none' }}
                style={{ padding:'0.55rem 1.1rem', background:'linear-gradient(135deg, var(--accent), var(--accent-alt))', color:'white', border:'none', borderRadius:'var(--radius-sm)', fontSize:'0.78rem', fontWeight:'700', cursor:'pointer', letterSpacing:'0.5px', whiteSpace:'nowrap', transition:'all 0.2s ease', fontFamily:'var(--font-body)', flexShrink:0 }}
              >
                Go to Dashboard →
              </button>
            </div>
          ) : status === 'available' ? (
            cartQty === 0 ? (
              /* ── Not in cart: side-by-side ── */
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button
                  onClick={() => navigate('/messages', { state:{ item } })}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--glass-bg-row)'; e.currentTarget.style.color='var(--text-secondary)' }}
                  style={{ flex:1, padding:'0.85rem', background:'var(--glass-bg-row)', color:'var(--text-secondary)', border:'1px solid var(--glass-border-row)', borderRadius:'var(--radius-md)', fontSize:'0.85rem', fontWeight:'700', cursor:'pointer', transition:'all 0.3s ease', fontFamily:'var(--font-body)' }}
                >Message Seller</button>
                <button onClick={handleAddToCart} disabled={cartLoading}
                  onMouseEnter={e => { if(!cartLoading){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='var(--shadow-accent-lg)'}}}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='var(--shadow-accent)' }}
                  style={{ flex:1, padding:'0.85rem', background:cartLoading?'var(--bg-card-hover)':'linear-gradient(135deg, var(--accent), var(--accent-alt))', color:cartLoading?'var(--text-muted)':'white', border:'none', borderRadius:'var(--radius-md)', fontSize:'0.85rem', fontWeight:'700', cursor:cartLoading?'not-allowed':'pointer', letterSpacing:'1px', textTransform:'uppercase', transition:'all 0.3s ease', boxShadow:'var(--shadow-accent)', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', fontFamily:'var(--font-body)' }}
                >
                  {cartLoading ? <><div style={{ width:'14px', height:'14px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'idSpin 0.7s linear infinite' }} />Adding...</> : 'Add to Cart'}
                </button>
              </div>
            ) : (
              /* ── In cart: Message Seller above, cart controls below ── */
              <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                <button
                  onClick={() => navigate('/messages', { state:{ item } })}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--glass-bg-row)'; e.currentTarget.style.color='var(--text-secondary)' }}
                  style={{ width:'100%', padding:'0.75rem', background:'var(--glass-bg-row)', color:'var(--text-secondary)', border:'1px solid var(--glass-border-row)', borderRadius:'var(--radius-md)', fontSize:'0.85rem', fontWeight:'700', cursor:'pointer', transition:'all 0.3s ease', fontFamily:'var(--font-body)' }}
                >Message Seller</button>
                <div style={{ display:'flex', gap:'0.65rem', alignItems:'center' }}>
                  {/* qty controls */}
                  <div style={{ display:'flex', alignItems:'center', background:'var(--glass-bg-row)', border:'1px solid var(--glass-border-row)', borderRadius:'var(--radius-md)', overflow:'hidden', opacity:cartLoading?0.55:1, transition:'opacity 0.2s', flexShrink:0 }}>
                    <button onClick={() => handleQtyChange(cartQty-1)} disabled={cartLoading}
                      onMouseEnter={e => e.currentTarget.style.background=cartQty===1?'var(--bg-danger)':'rgba(255,255,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      style={{ width:'42px', height:'42px', background:'transparent', border:'none', borderRight:'1px solid var(--glass-border-row)', color:cartQty===1?'var(--color-danger)':'var(--text-secondary)', cursor:cartLoading?'not-allowed':'pointer', fontSize:'1.1rem', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', flexShrink:0 }}>
                      {cartQty===1?<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>:'−'}
                    </button>
                    <div style={{ padding:'0 1rem', display:'flex', alignItems:'center', gap:'0.4rem', height:'42px', whiteSpace:'nowrap' }}>
                      <span style={{ fontSize:'0.9rem', fontWeight:'800', color:'var(--text-primary)' }}>{cartQty} in cart</span>
                      {stockLeft===0 && <span style={{ fontSize:'0.68rem', fontWeight:'600', color:'var(--color-pending)', background:'var(--bg-pending)', padding:'0.1rem 0.45rem', borderRadius:'6px', border:'1px solid var(--bd-pending)' }}>max</span>}
                    </div>
                    <button onClick={() => handleQtyChange(cartQty+1)} disabled={cartLoading||stockLeft===0}
                      onMouseEnter={e => { if(stockLeft>0)e.currentTarget.style.background='var(--accent-soft)' }}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      style={{ width:'42px', height:'42px', background:'transparent', border:'none', borderLeft:'1px solid var(--glass-border-row)', color:stockLeft===0?'var(--text-ghost)':'var(--accent)', cursor:cartLoading||stockLeft===0?'not-allowed':'pointer', fontSize:'1.1rem', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', flexShrink:0 }}>+</button>
                  </div>
                  {/* view cart */}
                  <button ref={viewCartRef} onClick={() => navigate('/cart')}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='var(--shadow-accent-lg)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='var(--shadow-accent)' }}
                    style={{ flex:1, padding:'0.85rem', background:'linear-gradient(135deg, var(--accent), var(--accent-alt))', color:'white', border:'none', borderRadius:'var(--radius-md)', fontSize:'0.85rem', fontWeight:'700', cursor:'pointer', transition:'all 0.25s ease', boxShadow:'var(--shadow-accent)', whiteSpace:'nowrap', fontFamily:'var(--font-body)' }}>View Cart</button>
                </div>
              </div>
            )
          ) : (
            <div style={{ textAlign:'center', padding:'0.85rem', color:status==='pending'?'var(--color-pending)':'var(--color-sold)', fontWeight:'600', fontSize:'0.85rem', background:status==='pending'?'var(--bg-pending)':'var(--bg-sold)', borderRadius:'var(--radius-md)', border:`1px solid ${status==='pending'?'var(--bd-pending)':'var(--bd-sold)'}` }}>
              {status==='pending'?'This item is pending sale':'This item has been sold'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ItemDetail