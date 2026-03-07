import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'
import { connectSocket, getSocket } from '../socket'

// ── Confirm Dialog ────────────────────────────────────────────
function ConfirmDialog({ open, onConfirm, onCancel, name }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      animation: 'cdFadeIn 0.18s ease',
    }}>
      <style>{`
        @keyframes cdFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cdSlideUp { from { opacity:0; transform:translateY(12px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
      <div style={{
        width: '380px', background: '#0d0d18',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
        animation: 'cdSlideUp 0.22s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}>
        {/* Top accent bar */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #ff6b6b, #ff8787)' }} />

        <div style={{ padding: '1.75rem 1.75rem 1.5rem' }}>
          {/* Icon */}
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </div>

          {/* Text */}
          <div style={{ fontSize: '1rem', fontWeight: '800', color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.3px', marginBottom: '0.5rem' }}>
            Delete conversation?
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: '1.55' }}>
            Your conversation with <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>{name}</span> will be permanently removed from your inbox. This cannot be undone.
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 1.75rem' }} />

        {/* Actions */}
        <div style={{ padding: '1.25rem 1.75rem', display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.18s ease', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '0.65rem', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: '10px', color: '#ff6b6b', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.18s ease', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.22)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.25)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ name, size = 36, orange = false, src = null }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (src) return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: orange ? 'none' : '1px solid rgba(255,255,255,0.1)', boxShadow: orange ? '0 4px 12px rgba(var(--accent-rgb),0.35)' : 'none' }}>
      <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: orange ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))',
      border: orange ? 'none' : '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: '800', color: 'white', letterSpacing: '-0.5px',
      boxShadow: orange ? '0 4px 12px rgba(var(--accent-rgb),0.35)' : 'none',
    }}>{initials}</div>
  )
}

// ── Conversation Item ─────────────────────────────────────────
function ConversationItem({ convo, isActive, isSelected, selectMode, onClick, onSelect, isTyping }) {
  const [hovered, setHovered] = useState(false)
  const hasUnread = convo.unread_count > 0

  return (
    <div
      onClick={() => selectMode ? onSelect(convo.conversation_id) : onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '0.75rem 1rem', borderRadius: '14px', cursor: 'pointer',
        transition: 'background 0.18s ease, border 0.18s ease',
        background: isSelected ? 'rgba(var(--accent-rgb),0.14)' : isActive ? 'var(--accent-soft)' : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: isSelected ? '1px solid rgba(var(--accent-rgb),0.35)' : isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
        marginBottom: '0.25rem', position: 'relative',
        display: 'flex', gap: '0.75rem', alignItems: 'center',
        height: '64px', boxSizing: 'border-box',
      }}
    >
      {hasUnread && !isActive && !selectMode && (
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '55%', borderRadius: '0 3px 3px 0', background: 'linear-gradient(180deg, var(--accent), var(--accent-alt))' }} />
      )}
      {selectMode && (
        <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,0.25)', background: isSelected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
          {isSelected && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
      )}
      <Avatar name={convo.other_user_name} size={38} orange={isActive && !selectMode} src={convo.other_user_avatar || null} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: hasUnread ? '800' : '600', color: isActive ? 'var(--accent)' : hasUnread ? 'white' : 'rgba(255,255,255,0.8)', letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>
            {convo.other_user_name || 'Unknown'}
          </span>
          {hasUnread && !isActive && !selectMode && (
            <div style={{ minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 5px', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: '800', color: 'white', flexShrink: 0 }}>
              {convo.unread_count > 9 ? '9+' : convo.unread_count}
            </div>
          )}
        </div>
        {isTyping ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '0.3rem' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#a8c4a2',
                animation: 'typingDot 1.1s ease-in-out infinite',
                animationDelay: `${i * 0.18}s`,
              }} />
            ))}
          </div>
        ) : convo.last_message && (
          <div style={{ fontSize: '0.72rem', color: hasUnread && !isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)', fontWeight: hasUnread && !isActive ? '600' : '400', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {convo.last_message}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Item Card ─────────────────────────────────────────────────
function ItemCard({ convo, myId, onStatusChange }) {
  const navigate = useNavigate()
  const isSeller = convo.item_seller_id === myId
  const status = convo.item_status?.toLowerCase() || 'available'
  const [loading, setLoading] = useState(false)
  const [statusHovered, setStatusHovered] = useState(false)
  const [inCart, setInCart] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState('')
  const [addHovered, setAddHovered] = useState(false)
  const [removeHovered, setRemoveHovered] = useState(false)
  const [cartCheckDone, setCartCheckDone] = useState(false)
  const [itemImage, setItemImage] = useState(convo.item_image || null)

  // Reset image immediately when convo changes — prevents stale image from previous convo
  useEffect(() => {
    setItemImage(convo.item_image || null)
  }, [convo.item_id])
  const [itemPrice, setItemPrice] = useState(convo.item_price ?? null)
  // seller inline price edit
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceVal, setPriceVal] = useState('')
  const [priceSaving, setPriceSaving] = useState(false)
  const priceInputRef = useRef(null)

  const isSold = status === 'sold'
  const isPending = status === 'pending'
  const isAvailable = status === 'available'

  // status pill appearance — when seller hovers available, show "Mark Pending" intent
  const showPendingHint = isSeller && isAvailable && statusHovered && !loading
  const showAvailHint   = isSeller && isPending  && statusHovered && !loading
  const statusColor = isSold ? '#ff6b6b' : isPending ? '#ffd43b' : '#51cf66'
  const statusBg    = isSold ? 'rgba(255,107,107,0.1)' : isPending ? 'rgba(255,212,59,0.1)' : 'rgba(81,207,102,0.1)'
  const statusLabel = isSold ? 'Sold' : isPending ? 'Pending' : 'Available'

  // hover-morph colors for seller status pill
  const hoverColor = showPendingHint ? '#ffd43b' : showAvailHint ? '#51cf66' : statusColor
  const hoverBg    = showPendingHint ? 'rgba(255,212,59,0.14)' : showAvailHint ? 'rgba(81,207,102,0.14)' : statusBg
  const hoverLabel = showPendingHint ? 'Mark Pending' : showAvailHint ? 'Mark Available' : statusLabel

  useEffect(() => {
    if (!convo.item_id) return
    API.get(`/items/${convo.item_id}`).then(res => {
      const imgs = res.data?.images
      if (imgs?.length) setItemImage(imgs[0])
      if (res.data?.price != null) setItemPrice(res.data.price)
    }).catch(() => {})
  }, [convo.item_id]) // eslint-disable-line

  useEffect(() => {
    if (isSeller || !convo.item_id || !isAvailable) return
    setCartCheckDone(false); setInCart(false); setCartError('')
    API.get('/cart').then(res => {
      setInCart((res.data || []).some(ci => ci.itemId === convo.item_id || ci.item?.id === convo.item_id))
    }).catch(() => {}).finally(() => setCartCheckDone(true))
  }, [convo.item_id, isSeller, status]) // eslint-disable-line

  async function handleAddToCart() {
    if (cartLoading || inCart) return
    setCartError('')
    try {
      setCartLoading(true)
      await API.post('/cart', { itemId: convo.item_id, quantity: 1 })
      setInCart(true)
      const cartRes = await API.get('/cart')
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: cartRes.data.length } }))
    } catch (err) {
      setCartError(err?.response?.data?.error || 'Could not add to cart')
      setTimeout(() => setCartError(''), 4000)
    } finally { setCartLoading(false) }
  }

  async function handleRemoveFromCart() {
    if (cartLoading || !inCart) return
    setCartError('')
    try {
      setCartLoading(true)
      await API.delete(`/cart/${convo.item_id}`)
      setInCart(false)
      const cartRes = await API.get('/cart')
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: cartRes.data.length } }))
    } catch (err) {
      setCartError(err?.response?.data?.error || 'Could not remove from cart')
      setTimeout(() => setCartError(''), 4000)
    } finally { setCartLoading(false) }
  }

  async function toggleStatus() {
    if (!isSeller || isSold || loading) return
    try {
      setLoading(true)
      const newStatus = isPending ? 'available' : 'pending'
      await API.patch(`/items/${convo.item_id}/status`, { status: newStatus })
      onStatusChange(newStatus)
    } catch (err) { console.error('Failed to update status', err) }
    finally { setLoading(false) }
  }

  function startEditPrice() {
    setPriceVal(itemPrice != null ? String(itemPrice) : '')
    setEditingPrice(true)
    setTimeout(() => priceInputRef.current?.focus(), 60)
  }

  async function savePrice() {
    const num = parseFloat(priceVal)
    if (isNaN(num) || num < 0) { setEditingPrice(false); return }
    try {
      setPriceSaving(true)
      await API.put(`/items/${convo.item_id}`, { price: num })
      setItemPrice(num)
    } catch (err) { console.error('Failed to update price', err) }
    finally { setPriceSaving(false); setEditingPrice(false) }
  }

  const pillBase = { display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.75rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.2px', cursor: 'pointer', transition: 'all 0.18s ease', border: 'none', outline: 'none', whiteSpace: 'nowrap' }

  return (
    <div style={{ margin: '0 1.5rem', padding: '0.65rem 1rem', background: 'var(--glass-bg-row)', border: '1px solid var(--glass-border-row)', borderRadius: '14px' }}>
      <style>{`@keyframes mspin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>

        {/* Left: image + title + price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
          {/* thumbnail — clickable for both */}
          <div
            onClick={() => isSeller ? navigate(`/dashboard?tab=${status === 'available' ? 'active' : status}`) : navigate(`/items/${convo.item_id}`)}
            title={isSeller ? 'Go to Dashboard' : 'View Item'}
            style={{ width: '40px', height: '40px', borderRadius: '9px', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {itemImage
              ? <img src={itemImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            }
          </div>

          {/* title + price stacked */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.58rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', fontWeight: '700', marginBottom: '0.1rem' }}>Item</div>
            {/* title — both clickable */}
            <div
              onClick={() => isSeller ? navigate(`/dashboard?tab=${status === 'available' ? 'active' : status}`) : navigate(`/items/${convo.item_id}`)}
              style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--accent)', letterSpacing: '-0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}
            >
              {convo.item_title || 'Item'}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </div>

            {/* price row */}
            <div style={{ marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {editingPrice ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>₹</span>
                  <input
                    ref={priceInputRef}
                    type="number" min="0" value={priceVal}
                    onChange={e => setPriceVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') savePrice(); if (e.key === 'Escape') setEditingPrice(false) }}
                    onBlur={savePrice}
                    style={{ width: '72px', padding: '0.15rem 0.4rem', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--accent-border)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }}
                  />
                  {priceSaving && <div style={{ width: '8px', height: '8px', border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'mspin 0.6s linear infinite' }} />}
                </div>
              ) : (
                <div
                  onClick={isSeller && !isSold ? startEditPrice : undefined}
                  title={isSeller && !isSold ? 'Click to edit price' : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: isSeller && !isSold ? 'pointer' : 'default' }}
                  onMouseEnter={e => { if (isSeller && !isSold) e.currentTarget.querySelector('.edit-icon')?.style && (e.currentTarget.querySelector('.edit-icon').style.opacity = '1') }}
                  onMouseLeave={e => { if (isSeller && !isSold) e.currentTarget.querySelector('.edit-icon')?.style && (e.currentTarget.querySelector('.edit-icon').style.opacity = '0') }}
                >
                  {itemPrice != null ? (
                    <>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>₹</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.3px' }}>{Number(itemPrice).toLocaleString('en-IN')}</span>
                      {isSeller && !isSold && (
                        <svg className="edit-icon" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" style={{ opacity: 0, transition: 'opacity 0.15s' }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      )}
                    </>
                  ) : (
                    isSeller && !isSold
                      ? <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontWeight: '500', fontStyle: 'italic' }}>set price</span>
                      : null
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: status pill (morphs on hover for seller) + buyer cart btn */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/* Status pill — for seller it's interactive and morphs */}
          {isSeller && !isSold ? (
            <button
              onClick={toggleStatus} disabled={loading}
              onMouseEnter={() => setStatusHovered(true)}
              onMouseLeave={() => setStatusHovered(false)}
              style={{ ...pillBase, background: hoverBg, border: `1px solid ${hoverColor}40`, color: hoverColor, opacity: loading ? 0.6 : 1, minWidth: '90px', justifyContent: 'center' }}
            >
              {loading
                ? <><div style={{ width: '8px', height: '8px', border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'mspin 0.6s linear infinite' }} />Updating</>
                : <><div style={{ width: '5px', height: '5px', borderRadius: '50%', background: hoverColor, boxShadow: `0 0 5px ${hoverColor}`, flexShrink: 0 }} />{hoverLabel}</>
              }
            </button>
          ) : (
            /* Buyer or sold — static pill */
            <div style={{ ...pillBase, cursor: 'default', background: statusBg, border: `1px solid ${statusColor}40`, color: statusColor }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 5px ${statusColor}`, flexShrink: 0 }} />
              {statusLabel}
            </div>
          )}

          {/* Buyer: add/remove cart */}
          {!isSeller && cartCheckDone && isAvailable && !inCart && (
            <button onClick={handleAddToCart} disabled={cartLoading} onMouseEnter={() => setAddHovered(true)} onMouseLeave={() => setAddHovered(false)}
              style={{ ...pillBase, background: addHovered ? 'rgba(139,92,246,0.22)' : 'rgba(139,92,246,0.10)', border: `1px solid rgba(139,92,246,${addHovered ? '0.6' : '0.3'})`, color: '#c4b5fd', opacity: cartLoading ? 0.6 : 1 }}>
              {cartLoading ? <><div style={{ width: '8px', height: '8px', border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'mspin 0.6s linear infinite' }} />Adding...</> : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>Add to Cart</>}
            </button>
          )}
          {!isSeller && cartCheckDone && isAvailable && inCart && (
            <button onClick={handleRemoveFromCart} disabled={cartLoading} onMouseEnter={() => setRemoveHovered(true)} onMouseLeave={() => setRemoveHovered(false)}
              style={{ ...pillBase, background: removeHovered ? 'rgba(255,107,107,0.14)' : 'rgba(255,107,107,0.06)', border: `1px solid rgba(255,107,107,${removeHovered ? '0.45' : '0.2'})`, color: removeHovered ? '#ffa8a8' : '#ff8787', opacity: cartLoading ? 0.6 : 1 }}>
              {cartLoading ? <><div style={{ width: '8px', height: '8px', border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'mspin 0.6s linear infinite' }} />Removing...</> : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>Remove</>}
            </button>
          )}
        </div>
      </div>

      {cartError && (
        <div style={{ marginTop: '0.5rem', padding: '0.35rem 0.8rem', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.18)', borderRadius: '8px', fontSize: '0.72rem', color: '#ff8787', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {cartError}
        </div>
      )}
    </div>
  )
}

// ── Main Messages ─────────────────────────────────────────────
function Messages() {
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
      localStorage.removeItem('drag_backbtn_msgs')
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('drag_backbtn_msgs'))
        if (saved) backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`
      } catch {}
    }
  }, [draggable])
  useEffect(() => {
    if (!draggable || !backRef.current) return
    try {
      const saved = JSON.parse(localStorage.getItem('drag_backbtn_msgs'))
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
        localStorage.setItem('drag_backbtn_msgs', JSON.stringify({ dx, dy }))
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
  const incomingItem = location.state?.item

  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [newConvoMode, setNewConvoMode] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'ember')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [deletingSelected, setDeletingSelected] = useState(false)
  const [mobShowChat, setMobShowChat] = useState(false)

  // ── Socket / presence state ────────────────────────────────
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [typingUserIds, setTypingUserIds] = useState(new Set()) // global — all convos
  const typingEmitRef = useRef(false)
  const typingEmitTimeoutRef = useRef(null)  // sender: schedules typing-stop emit
  const typingClearTimeoutRef = useRef(null) // receiver: fallback if typing-stop lost
  const typingTimersRef = useRef({}) // per-user sidebar timers

  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(document.documentElement.dataset.theme || 'ember'))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  // Confirm dialog state
  const [confirmTarget, setConfirmTarget] = useState(null) // convo to delete
  const [deleting, setDeleting] = useState(false)

  const messagesEndRef = useRef(null)
  const msgInputRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const myId = user?.id
  const token = localStorage.getItem('token')

  // Lock page scroll while Messages is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ── Socket connect + online/typing/message listeners ──────
  useEffect(() => {
    if (!myId) return
    const socket = connectSocket(myId)

    // online-list fires on initial connect — also re-request it when switching convos
    socket.on('online-list', ({ userIds }) => {
      if (activeConvo?.other_user_id) {
        setOtherUserOnline(userIds.includes(String(activeConvo.other_user_id)))
      }
    })

    // Re-request the online list so we get fresh status for this convo's other user
    if (activeConvo?.other_user_id) {
      if (socket.connected) {
        socket.emit('get-online-list')
      } else {
        socket.once('connect', () => socket.emit('get-online-list'))
      }
    }

    socket.on('user-online', ({ userId }) => {
      if (activeConvo && String(userId) === String(activeConvo.other_user_id))
        setOtherUserOnline(true)
    })

    socket.on('user-offline', ({ userId }) => {
      if (activeConvo && String(userId) === String(activeConvo.other_user_id))
        setOtherUserOnline(false)
    })

    socket.on('typing-start', ({ fromUserId }) => {
      // ── Right panel: only for active convo ──
      if (activeConvo && String(fromUserId) === String(activeConvo.other_user_id)) {
        setOtherUserTyping(true)
        clearTimeout(typingClearTimeoutRef.current)
        typingClearTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 2000)
      }
      // ── Sidebar: track ALL typing users (even if not in active convo) ──
      setTypingUserIds(prev => { const s = new Set(prev); s.add(String(fromUserId)); return s })
      clearTimeout(typingTimersRef.current[fromUserId])
      typingTimersRef.current[fromUserId] = setTimeout(() => {
        setTypingUserIds(prev => { const s = new Set(prev); s.delete(String(fromUserId)); return s })
      }, 2000)
    })

    socket.on('typing-stop', ({ fromUserId }) => {
      // ── Right panel ──
      if (activeConvo && String(fromUserId) === String(activeConvo.other_user_id)) {
        clearTimeout(typingClearTimeoutRef.current)
        setOtherUserTyping(false)
      }
      // ── Sidebar ──
      clearTimeout(typingTimersRef.current[fromUserId])
      setTypingUserIds(prev => { const s = new Set(prev); s.delete(String(fromUserId)); return s })
    })

    // ── Real-time incoming messages ───────────────────────
    socket.on('new-message', (msg) => {
      // Only append if it belongs to the active conversation
      if (
        activeConvo &&
        msg.itemId === activeConvo.item_id &&
        (String(msg.senderId) === String(activeConvo.other_user_id) ||
         String(msg.senderId) === String(myId))
      ) {
        setMessages(prev => {
          // Avoid duplicate if sender already appended optimistically
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
      // Update unread count in sidebar for receiver
      if (String(msg.receiverId) === String(myId) && msg.itemId !== activeConvo?.item_id) {
        setConversations(prev => prev.map(c =>
          c.item_id === msg.itemId
            ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message: msg.content }
            : c
        ))
      }
    })

    return () => {
      socket.off('online-list')
      socket.off('user-online')
      socket.off('user-offline')
      socket.off('typing-start')
      socket.off('typing-stop')
      socket.off('new-message')
      clearTimeout(typingClearTimeoutRef.current)
      clearTimeout(typingEmitTimeoutRef.current)
    }
  }, [myId, activeConvo?.other_user_id, activeConvo?.item_id]) // eslint-disable-line

  useEffect(() => {
    if (!token) navigate('/login', { replace: true })
  }, [token])

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConvos(true)
        const res = await API.get('/messages/conversations')
        setConversations(res.data)
        if (incomingItem) {
          const existing = res.data.find(c => c.item_id === incomingItem.id || c.itemId === incomingItem.id)
          if (existing) { setActiveConvo(existing); setNewConvoMode(false) }
          else {
            setNewConvoMode(true)
            setActiveConvo({ item_id: incomingItem.id, item_title: incomingItem.title, item_status: incomingItem.status || 'available', item_seller_id: incomingItem.seller?.id, item_image: incomingItem.images?.[0] || null, other_user_name: `${incomingItem.seller?.firstName} ${incomingItem.seller?.lastName}`.trim() || 'Seller', other_user_id: incomingItem.seller?.id, other_user_avatar: incomingItem.seller?.avatar || null, isNew: true })
          }
        } else if (res.data.length > 0) {
          // Pick the conversation with the most unread messages; fall back to most recent
          const mostUnread = res.data.reduce((best, c) =>
            (c.unread_count || 0) > (best.unread_count || 0) ? c : best
          , res.data[0])
          setActiveConvo(mostUnread)
        }
      } catch (err) { console.error('Failed to load conversations', err) }
      finally { setLoadingConvos(false) }
    }
    fetchConversations()
  }, [])

  // Sync activeConvoKey so Navbar suppresses notifications for current convo
  useEffect(() => {
    if (activeConvo?.item_id && activeConvo?.other_user_id) {
      window.__activeConvoKey = `${activeConvo.item_id}-${activeConvo.other_user_id}`
    } else {
      window.__activeConvoKey = null
    }
    return () => { window.__activeConvoKey = null }
  }, [activeConvo?.item_id, activeConvo?.other_user_id])

  useEffect(() => {
    if (!activeConvo || activeConvo.isNew) return
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true)
        const res = await API.get(`/messages/${activeConvo.item_id}`, { params: { otherUserId: activeConvo.other_user_id } })
        setMessages(res.data)
        setConversations(prev => prev.map(c => c.conversation_id === activeConvo.conversation_id ? { ...c, unread_count: 0 } : c))
      } catch (err) { console.error('Failed to load messages', err) }
      finally { setLoadingMessages(false) }
    }
    fetchMessages()
  }, [activeConvo])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (activeConvo) setTimeout(() => msgInputRef.current?.focus(), 100) }, [activeConvo?.conversation_id, activeConvo?.item_id])

  async function handleMarkAllRead() {
    try {
      setMarkingRead(true)
      await API.post('/messages/mark-all-read')
      setConversations(prev => prev.map(c => ({ ...c, unread_count: 0 })))
    } catch (err) { console.error(err) }
    finally { setMarkingRead(false) }
  }

  function handleStatusChange(newStatus) {
    setActiveConvo(prev => ({ ...prev, item_status: newStatus }))
    setConversations(prev => prev.map(c => c.conversation_id === activeConvo?.conversation_id ? { ...c, item_status: newStatus } : c))
  }

  // Step 1: user clicks trash → open dialog
  function handleDeleteRequest(convo) {
    setConfirmTarget(convo)
  }

  // Step 2: user confirms → actually delete
  async function handleDeleteConfirm() {
    if (!confirmTarget) return
    if (confirmTarget === 'bulk') {
      await handleDeleteSelected()
      setConfirmTarget(null)
      return
    }
    try {
      setDeleting(true)
      await API.delete(`/messages/conversation/${confirmTarget.item_id}/${confirmTarget.other_user_id}`)
      setConversations(prev => prev.filter(c => c.conversation_id !== confirmTarget.conversation_id))
      if (activeConvo?.conversation_id === confirmTarget.conversation_id) {
        setActiveConvo(null)
        setMessages([])
      }
    } catch (err) { console.error('Failed to delete conversation', err) }
    finally { setDeleting(false); setConfirmTarget(null) }
  }

  async function handleDeleteSelected() {
    if (!selectedIds.length) return
    try {
      setDeletingSelected(true)
      const toDelete = conversations.filter(c => selectedIds.includes(c.conversation_id))
      await Promise.allSettled(toDelete.map(c => API.delete(`/messages/conversation/${c.item_id}/${c.other_user_id}`)))
      setConversations(prev => prev.filter(c => !selectedIds.includes(c.conversation_id)))
      if (activeConvo && selectedIds.includes(activeConvo.conversation_id)) { setActiveConvo(null); setMessages([]) }
      setSelectedIds([])
      setSelectMode(false)
    } catch (err) { console.error('Failed to delete selected', err) }
    finally { setDeletingSelected(false) }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !activeConvo) return
    try {
      setSending(true)
      if (activeConvo.isNew) {
        const res = await API.post('/messages', { receiverId: activeConvo.other_user_id, itemId: activeConvo.item_id, content: newMessage.trim() })
        const convosRes = await API.get('/messages/conversations')
        setConversations(convosRes.data)
        const newConvo = convosRes.data.find(c => c.item_id === activeConvo.item_id || c.itemId === activeConvo.item_id)
        if (newConvo) setActiveConvo({ ...newConvo, isNew: false })
        setMessages([res.data])
        setNewConvoMode(false)
      } else {
        await API.post('/messages', { receiverId: activeConvo.other_user_id, itemId: activeConvo.item_id, content: newMessage.trim() })
        // Don't append here — socket 'new-message' event handles it for both sender and receiver
      }
      setNewMessage('')
      // stop typing indicator when message sent
      const socket = getSocket()
      if (socket && activeConvo?.other_user_id) {
        clearTimeout(typingEmitTimeoutRef.current)
        typingEmitRef.current = false
        socket.emit('typing-stop', { toUserId: activeConvo.other_user_id, itemId: activeConvo.item_id })
      }
    } catch (err) { console.error('Failed to send message', err) }
    finally { setSending(false) }
  }

  return (
    <div className="msgs-page" style={{ height: 'calc(100vh - 65px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '2rem 4rem 1.5rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse  { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.5; transform:scale(0.85) } }
        @keyframes typingDot { 0%,60%,100% { transform:translateY(0); opacity:0.4 } 30% { transform:translateY(-3px); opacity:1 } }
        .msg-input::placeholder { color: var(--text-muted) }
        .msg-input:focus { outline: none }
        ::-webkit-scrollbar { width: 0px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: transparent }
        .hide-scrollbar::-webkit-scrollbar { display: none }
        .msgs-page { padding: 2rem 4rem 1.5rem }
        .msgs-heading { display:flex; align-items:flex-end; justify-content:space-between; flex-shrink:0 }
        .msgs-title  { font-size:2.8rem }
        .msgs-panels { display:grid; grid-template-columns:300px 1fr; gap:1rem; flex:1; min-height:0; position:relative }
        .msgs-back-desktop { display:flex }
        .msgs-hamburger    { display:none }
        .msgs-drawer       { display:none }
        @media (max-width:680px) {
          .msgs-page        { padding: 1rem 1rem 0.75rem !important }
          .msgs-heading     { flex-direction:column; align-items:flex-start; gap:0.5rem }
          .msgs-title       { font-size:2rem !important }
          .msgs-panels      { grid-template-columns:1fr !important }
          .msgs-panel-sidebar { display:none !important }
          .msgs-panel-chat  { display:flex !important }
          .msgs-back-desktop { display:none !important }
          .msgs-hamburger   { display:flex !important }
          .msgs-drawer      { display:block !important; position:absolute; inset:0; z-index:50; border-radius:20px; overflow:hidden }
        }
      `}</style>

      {/* Confirm dialog — rendered at top level so it overlays everything */}
      <ConfirmDialog
        open={!!confirmTarget}
        name={confirmTarget === 'bulk' ? `${selectedIds.length} conversation${selectedIds.length > 1 ? 's' : ''}` : confirmTarget?.other_user_name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minHeight: 0 }}>

        {/* Heading */}
        <div className="msgs-heading" style={{ flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, lineHeight: 1.05 }}>
              <span className="msgs-title" style={{ display: 'block', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1.5px' }}>My</span>
              <span className="msgs-title" style={{ display: 'block', fontWeight: '900', letterSpacing: '-1.5px', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Messages.</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                {totalUnread > 0 && <span style={{ color: 'var(--accent)', fontWeight: '700', marginLeft: '0.5rem' }}>· {totalUnread} unread</span>}
              </p>
            </div>
          </div>
          {totalUnread > 0 && (
            <button onClick={handleMarkAllRead} disabled={markingRead}
              style={{ padding: '0.5rem 1.2rem', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)', borderRadius: '10px', cursor: markingRead ? 'not-allowed' : 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s ease', fontFamily: 'inherit', opacity: markingRead ? 0.6 : 1 }}>
              {markingRead ? 'Marking...' : '✓ Mark all read'}
            </button>
          )}
        </div>

        {/* Mobile drawer overlay — absolute within chat card */}
        {mobShowChat && (
          <div className="msgs-drawer" onClick={() => setMobShowChat(false)}>
            {/* Dim layer — solid, no blur */}
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', borderRadius:'20px' }} />
            {/* Drawer panel — fully opaque solid bg */}
            <div onClick={e => e.stopPropagation()}
              style={{ position:'absolute', top:'70px', left:'0.75rem', bottom:'0.75rem', width:'88%', maxWidth:'310px', background:'var(--bg-base,#0d0d14)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.9)', zIndex:51 }}>

              {/* Header — select mode + close */}
              <div style={{ padding:'0.85rem 1rem', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                <span style={{ fontSize:'0.6rem', letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', fontWeight:'700' }}>Conversations</span>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  {selectMode && selectedIds.length > 0 && (
                    <button onClick={() => setConfirmTarget('bulk')}
                      style={{ padding:'0.3rem 0.7rem', borderRadius:'8px', border:'1px solid rgba(255,107,107,0.35)', background:'rgba(255,107,107,0.1)', color:'#ff8787', fontSize:'0.68rem', fontWeight:'700', cursor:'pointer', transition:'all 0.15s' }}>
                      Delete {selectedIds.length}
                    </button>
                  )}
                  <button onClick={() => { setSelectMode(s => !s); setSelectedIds([]) }}
                    style={{ padding:'0.3rem 0.7rem', borderRadius:'8px', border:`1px solid ${selectMode ? 'rgba(var(--accent-rgb),0.4)' : 'rgba(255,255,255,0.1)'}`, background: selectMode ? 'rgba(var(--accent-rgb),0.12)' : 'transparent', color: selectMode ? 'var(--accent)' : 'rgba(255,255,255,0.35)', fontSize:'0.68rem', fontWeight:'700', cursor:'pointer', transition:'all 0.15s' }}>
                    {selectMode ? 'Cancel' : 'Select'}
                  </button>
                  <button onClick={() => setMobShowChat(false)}
                    style={{ width:'26px', height:'26px', borderRadius:'7px', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              {/* Conversation list */}
              <div style={{ flex:1, overflowY:'auto', padding:'0.5rem', scrollbarWidth:'none', msOverflowStyle:'none' }} className="hide-scrollbar">
                {newConvoMode && activeConvo?.isNew && (
                  <div style={{ padding:'0.75rem 1rem', borderRadius:'14px', background: theme === 'midnight' ? 'rgba(59,130,246,0.12)' : theme === 'chalk' ? 'rgba(99,102,241,0.1)' : 'rgba(232,119,34,0.12)', marginBottom:'0.25rem', display:'flex', gap:'0.75rem', alignItems:'center', height:'64px', boxSizing:'border-box' }}>
                    <Avatar name={activeConvo.other_user_name} size={38} orange src={activeConvo.other_user_avatar || null} />
                    <div>
                      <div style={{ fontSize:'0.88rem', fontWeight:'700', color:'var(--accent)' }}>{activeConvo.other_user_name}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--accent-alt)', fontWeight:'600', marginTop:'0.1rem', opacity:0.8 }}>New conversation</div>
                    </div>
                  </div>
                )}
                {loadingConvos ? (
                  <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
                    <div style={{ width:'28px', height:'28px', border:'2.5px solid rgba(255,255,255,0.08)', borderTop:'2.5px solid var(--accent)', borderRadius:'50%', margin:'0 auto', animation:'spin 0.8s linear infinite' }} />
                  </div>
                ) : conversations.length === 0 && !newConvoMode ? (
                  <div style={{ textAlign:'center', padding:'3rem 1rem', color:'rgba(255,255,255,0.2)' }}>
                    <div style={{ fontSize:'2rem', marginBottom:'0.5rem', opacity:0.3 }}>✉</div>
                    <p style={{ fontSize:'0.78rem', fontWeight:'500' }}>No conversations yet</p>
                  </div>
                ) : (
                  conversations.map(convo => (
                    <ConversationItem
                      key={convo.conversation_id}
                      convo={convo}
                      isActive={activeConvo && !activeConvo.isNew && activeConvo.conversation_id === convo.conversation_id}
                      isSelected={selectedIds.includes(convo.conversation_id)}
                      selectMode={selectMode}
                      isTyping={!(activeConvo && activeConvo.conversation_id === convo.conversation_id) && typingUserIds.has(String(convo.other_user_id))}
                      onClick={() => { setActiveConvo(convo); setNewConvoMode(false); setMessages([]); setMobShowChat(false) }}
                      onSelect={toggleSelect}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panels */}
        <div className="msgs-panels" style={{ '--mob-sidebar': mobShowChat ? 'none' : 'flex', '--mob-chat': mobShowChat ? 'flex' : 'none' }}>
          <button ref={backRef} className="msgs-back-desktop" onClick={() => navigate(-1)} onMouseDown={onBackMouseDown} onTouchStart={onBackTouchStart}
            style={{ position:'absolute', left:'-50px', top:'12px', width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1.5px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor: draggable ? 'grab' : 'pointer', flexShrink:0, color:'rgba(255,255,255,0.5)', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.boxShadow='0 0 8px 2px rgba(var(--accent-rgb),0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.boxShadow='none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          {/* LEFT: sidebar */}
          <div className="msgs-panel-sidebar" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: '700' }}>Conversations</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectMode && selectedIds.length > 0 && (
                  <button onClick={() => setConfirmTarget('bulk')}
                    style={{ padding: '0.3rem 0.7rem', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.35)', background: 'rgba(255,107,107,0.1)', color: '#ff8787', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.1)' }}>
                    Delete {selectedIds.length}
                  </button>
                )}
                <button onClick={() => { setSelectMode(s => !s); setSelectedIds([]) }}
                  style={{ padding: '0.3rem 0.7rem', borderRadius: '8px', border: `1px solid ${selectMode ? 'rgba(var(--accent-rgb),0.4)' : 'rgba(255,255,255,0.1)'}`, background: selectMode ? 'rgba(var(--accent-rgb),0.12)' : 'transparent', color: selectMode ? 'var(--accent)' : 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {selectMode ? 'Cancel' : 'Select'}
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scrollbar">
              {newConvoMode && activeConvo?.isNew && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '14px', background: theme === 'midnight' ? 'rgba(59,130,246,0.12)' : theme === 'chalk' ? 'rgba(99,102,241,0.1)' : 'rgba(232,119,34,0.12)', border: '1px solid transparent', marginBottom: '0.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', height: '64px', boxSizing: 'border-box' }}>
                  <Avatar name={activeConvo.other_user_name} size={38} orange src={activeConvo.other_user_avatar || null} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--accent)' }}>{activeConvo.other_user_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-alt)', fontWeight: '600', marginTop: '0.1rem', opacity: 0.8 }}>New conversation</div>
                  </div>
                </div>
              )}
              {loadingConvos ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ width: '28px', height: '28px', border: '2.5px solid rgba(255,255,255,0.08)', borderTop: '2.5px solid var(--accent)', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : conversations.length === 0 && !newConvoMode ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3 }}>✉</div>
                  <p style={{ fontSize: '0.78rem', fontWeight: '500' }}>No conversations yet</p>
                </div>
              ) : (
                conversations.map(convo => (
                  <ConversationItem
                    key={convo.conversation_id}
                    convo={convo}
                    isActive={activeConvo && !activeConvo.isNew && activeConvo.conversation_id === convo.conversation_id}
                    isSelected={selectedIds.includes(convo.conversation_id)}
                    selectMode={selectMode}
                    isTyping={
                      // Only show typing in sidebar if NOT the active convo (active convo shows it in right panel)
                      !(activeConvo && activeConvo.conversation_id === convo.conversation_id) &&
                      typingUserIds.has(String(convo.other_user_id))
                    }
                    onClick={() => { setActiveConvo(convo); setNewConvoMode(false); setMessages([]); setMobShowChat(true) }}
                    onSelect={toggleSelect}
                  />
                ))
              )}
            </div>
          </div>

          {/* RIGHT: chat panel */}
          <div className="msgs-panel-chat" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            {!activeConvo ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.15)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p style={{ fontSize: '0.85rem', fontWeight: '500' }}>Select a conversation</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '1rem 1.5rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <button className="msgs-hamburger" onClick={() => setMobShowChat(true)}
                      style={{ width: '32px', height: '32px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s', gap: '0' }}>
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <line x1="2" y1="5"  x2="18" y2="5"/>
                        <line x1="2" y1="10" x2="14" y2="10"/>
                        <line x1="2" y1="15" x2="18" y2="15"/>
                      </svg>
                    </button>
                    <Avatar name={activeConvo.other_user_name} size={40} src={activeConvo.other_user_avatar || null} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: 'white', letterSpacing: '-0.3px' }}>{activeConvo.other_user_name}</div>
                      <div style={{ fontSize: '0.68rem', marginTop: '0.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem',
                        color: activeConvo.isNew ? 'rgba(255,255,255,0.3)' : otherUserTyping ? 'var(--accent)' : otherUserOnline ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
                        {!activeConvo.isNew && (
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                            background: otherUserTyping ? 'var(--accent)' : otherUserOnline ? '#4ade80' : 'rgba(255,255,255,0.2)',
                            boxShadow: otherUserOnline && !otherUserTyping ? '0 0 6px #4ade80' : otherUserTyping ? '0 0 6px var(--accent)' : 'none',
                            animation: otherUserTyping ? 'pulse 1s ease-in-out infinite' : 'none'
                          }} />
                        )}
                        {activeConvo.isNew ? 'Start a new conversation' : otherUserTyping ? 'typing...' : otherUserOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    {!activeConvo.isNew && (
                      <button onClick={() => setConfirmTarget(activeConvo)}
                        style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.2)', background: 'rgba(255,107,107,0.06)', color: '#ff8787', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.45)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.2)' }}
                        title="Delete conversation">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <ItemCard convo={activeConvo} myId={myId} onStatusChange={handleStatusChange} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {loadingMessages ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '28px', height: '28px', border: '2.5px solid rgba(255,255,255,0.08)', borderTop: '2.5px solid #e87722', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  ) : activeConvo.isNew ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </div>
                      <p style={{ fontSize: '0.85rem', fontWeight: '500', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Say hello to <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{activeConvo.other_user_name}</span></p>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.22)', margin: 0 }}>about {activeConvo.item_title}</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem' }}>No messages yet. Say hello!</div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMe = msg.senderId === myId || msg.sender_id === myId
                      const time = msg.createdAt || msg.created_at
                      return (
                        <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.2s ease' }}>
                          <div style={{ maxWidth: '62%', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{ padding: '0.6rem 0.95rem', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'rgba(255,255,255,0.08)', border: isMe ? 'none' : '1px solid rgba(255,255,255,0.07)', color: isMe ? 'white' : 'rgba(255,255,255,0.88)', fontSize: '0.875rem', lineHeight: '1.5', boxShadow: isMe ? '0 4px 12px rgba(var(--accent-rgb),0.22)' : 'none' }}>
                              {msg.content}
                            </div>
                            {time && <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', paddingInline: '0.3rem' }}>{new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                  <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input ref={msgInputRef} className="msg-input" type="text" value={newMessage}
                        onChange={e => {
                          setNewMessage(e.target.value)
                          // emit typing to other user
                          const socket = getSocket()
                          if (socket && activeConvo?.other_user_id) {
                            if (!typingEmitRef.current) {
                              typingEmitRef.current = true
                              socket.emit('typing-start', { toUserId: activeConvo.other_user_id, itemId: activeConvo.item_id })
                            }
                            clearTimeout(typingEmitTimeoutRef.current)
                            typingEmitTimeoutRef.current = setTimeout(() => {
                              typingEmitRef.current = false
                              socket.emit('typing-stop', { toUserId: activeConvo.other_user_id, itemId: activeConvo.item_id })
                            }, 800)
                          }
                        }}
                        onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
                        placeholder={activeConvo.isNew ? `Message ${activeConvo.other_user_name}...` : 'Type a message...'}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 1rem', background: inputFocused ? 'var(--bg-card-hover)' : 'var(--bg-input)', border: inputFocused ? '1px solid var(--accent-border)' : '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
                      />
                    </div>
                    <button type="submit" disabled={sending || !newMessage.trim()}
                      style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0, background: sending || !newMessage.trim() ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--accent), var(--accent-alt))', border: 'none', cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: !sending && newMessage.trim() ? '0 4px 14px rgba(var(--accent-rgb),0.3)' : 'none' }}>
                      {sending
                        ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={!newMessage.trim() ? 'rgba(255,255,255,0.2)' : 'white'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      }
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages