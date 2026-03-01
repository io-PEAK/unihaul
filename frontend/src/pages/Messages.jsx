import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'

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
function Avatar({ name, size = 36, orange = false }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: orange ? 'linear-gradient(135deg, #e87722, #f09030)' : 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))',
      border: orange ? 'none' : '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: '800', color: 'white', letterSpacing: '-0.5px',
      boxShadow: orange ? '0 4px 12px rgba(232,119,34,0.35)' : 'none',
    }}>{initials}</div>
  )
}

// ── Conversation Item ─────────────────────────────────────────
function ConversationItem({ convo, isActive, onClick, onDeleteRequest }) {
  const [hovered, setHovered] = useState(false)
  const hasUnread = convo.unread_count > 0

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '0.85rem 1rem', borderRadius: '14px', cursor: 'pointer',
        transition: 'all 0.18s ease',
        background: isActive ? 'linear-gradient(135deg, rgba(232,119,34,0.15), rgba(232,119,34,0.06))' : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: isActive ? '1px solid rgba(232,119,34,0.25)' : '1px solid transparent',
        marginBottom: '0.25rem', position: 'relative',
        display: 'flex', gap: '0.75rem', alignItems: 'center',
      }}
    >
      {hasUnread && !isActive && (
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '55%', borderRadius: '0 3px 3px 0', background: 'linear-gradient(180deg, #e87722, #f5a623)' }} />
      )}
      <Avatar name={convo.other_user_name} size={38} orange={isActive} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: hasUnread ? '800' : '600', color: isActive ? '#e87722' : hasUnread ? 'white' : 'rgba(255,255,255,0.8)', letterSpacing: '-0.2px' }}>
            {convo.other_user_name || 'Unknown'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {hasUnread && !isActive && (
              <div style={{ minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 5px', background: 'linear-gradient(135deg, #e87722, #f09030)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: '800', color: 'white', flexShrink: 0 }}>
                {convo.unread_count > 9 ? '9+' : convo.unread_count}
              </div>
            )}
            {hovered && (
              <button
                onClick={e => { e.stopPropagation(); onDeleteRequest(convo) }}
                title="Delete conversation"
                style={{ width: '24px', height: '24px', borderRadius: '6px', border: 'none', background: 'rgba(255,107,107,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,107,107,0.12)'}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ff8787" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Item Card ─────────────────────────────────────────────────
function ItemCard({ convo, myId, onStatusChange }) {
  const isSeller = convo.item_seller_id === myId
  const status = convo.item_status?.toLowerCase() || 'available'
  const [loading, setLoading] = useState(false)
  const [btnHovered, setBtnHovered] = useState(false)
  const [inCart, setInCart] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState('')
  const [addHovered, setAddHovered] = useState(false)
  const [removeHovered, setRemoveHovered] = useState(false)
  const [cartCheckDone, setCartCheckDone] = useState(false)
  const isSold = status === 'sold'
  const isPending = status === 'pending'
  const isAvailable = status === 'available'
  const statusColor = isSold ? '#ff6b6b' : isPending ? '#ffd43b' : '#51cf66'
  const statusBg = isSold ? 'rgba(255,107,107,0.1)' : isPending ? 'rgba(255,212,59,0.1)' : 'rgba(81,207,102,0.1)'
  const statusLabel = isSold ? 'Sold' : isPending ? 'Pending' : 'Available'

  useEffect(() => {
    if (isSeller || !convo.item_id || !isAvailable) return
    setCartCheckDone(false); setInCart(false); setCartError('')
    const check = async () => {
      try {
        const res = await API.get('/cart')
        setInCart((res.data || []).some(ci => ci.itemId === convo.item_id || ci.item?.id === convo.item_id))
      } catch { setInCart(false) }
      finally { setCartCheckDone(true) }
    }
    check()
  }, [convo.item_id, isSeller, status])

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

  const pillBase = { display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.75rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.2px', cursor: 'pointer', transition: 'all 0.18s ease', border: 'none', outline: 'none' }

  return (
    <div style={{ margin: '0 1.5rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'linear-gradient(135deg, rgba(232,119,34,0.18), rgba(232,119,34,0.07))', border: '1px solid rgba(232,119,34,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e87722" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.58rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', fontWeight: '700', marginBottom: '0.15rem' }}>Item</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{convo.item_title || 'Item'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <div style={{ ...pillBase, cursor: 'default', background: statusBg, border: `1px solid ${statusColor}30`, color: statusColor }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 5px ${statusColor}` }} />
            {statusLabel}
          </div>
          {isSeller && !isSold && (
            <button onClick={toggleStatus} disabled={loading} onMouseEnter={() => setBtnHovered(true)} onMouseLeave={() => setBtnHovered(false)}
              style={{ ...pillBase, background: isPending ? `rgba(81,207,102,${btnHovered ? '0.16' : '0.07'})` : `rgba(255,212,59,${btnHovered ? '0.16' : '0.07'})`, border: isPending ? `1px solid rgba(81,207,102,${btnHovered ? '0.45' : '0.2'})` : `1px solid rgba(255,212,59,${btnHovered ? '0.45' : '0.2'})`, color: isPending ? '#51cf66' : '#ffd43b', opacity: loading ? 0.6 : 1 }}>
              {loading ? <><div style={{ width: '8px', height: '8px', border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'mspin 0.6s linear infinite' }} />Updating</> : isPending ? '✓ Mark Available' : '◷ Mark Pending'}
            </button>
          )}
          {!isSeller && cartCheckDone && isAvailable && !inCart && (
            <button onClick={handleAddToCart} disabled={cartLoading} onMouseEnter={() => setAddHovered(true)} onMouseLeave={() => setAddHovered(false)}
              style={{ ...pillBase, background: addHovered ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.09)', border: `1px solid rgba(99,102,241,${addHovered ? '0.55' : '0.28'})`, color: addHovered ? '#c7d2fe' : '#a5b4fc', opacity: cartLoading ? 0.6 : 1 }}>
              {cartLoading ? <><div style={{ width: '8px', height: '8px', border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'mspin 0.6s linear infinite' }} />Adding...</> : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>Add to Cart</>}
            </button>
          )}
          {!isSeller && cartCheckDone && isAvailable && inCart && (
            <button onClick={handleRemoveFromCart} disabled={cartLoading} onMouseEnter={() => setRemoveHovered(true)} onMouseLeave={() => setRemoveHovered(false)}
              style={{ ...pillBase, background: removeHovered ? 'rgba(255,107,107,0.14)' : 'rgba(255,107,107,0.06)', border: `1px solid rgba(255,107,107,${removeHovered ? '0.45' : '0.2'})`, color: removeHovered ? '#ffa8a8' : '#ff8787', opacity: cartLoading ? 0.6 : 1 }}>
              {cartLoading ? <><div style={{ width: '8px', height: '8px', border: '1.5px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'mspin 0.6s linear infinite' }} />Removing...</> : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>Remove from Cart</>}
            </button>
          )}
        </div>
      </div>
      {cartError && (
        <div style={{ marginTop: '0.6rem', padding: '0.4rem 0.8rem', background: 'rgba(255,107,107,0.07)', border: '1px solid rgba(255,107,107,0.18)', borderRadius: '8px', fontSize: '0.72rem', color: '#ff8787', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {cartError}
        </div>
      )}
      <style>{`@keyframes mspin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Main Messages ─────────────────────────────────────────────
function Messages() {
  const navigate = useNavigate()
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

  // Confirm dialog state
  const [confirmTarget, setConfirmTarget] = useState(null) // convo to delete
  const [deleting, setDeleting] = useState(false)

  const messagesEndRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const myId = user?.id
  const token = localStorage.getItem('token')

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
            setActiveConvo({ item_id: incomingItem.id, item_title: incomingItem.title, item_status: incomingItem.status || 'available', item_seller_id: incomingItem.seller?.id, other_user_name: incomingItem.seller?.name || 'Seller', other_user_id: incomingItem.seller?.id, isNew: true })
          }
        } else if (res.data.length > 0) {
          setActiveConvo(res.data[0])
        }
      } catch (err) { console.error('Failed to load conversations', err) }
      finally { setLoadingConvos(false) }
    }
    fetchConversations()
  }, [])

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
        const res = await API.post('/messages', { receiverId: activeConvo.other_user_id, itemId: activeConvo.item_id, content: newMessage.trim() })
        setMessages(prev => [...prev, res.data])
      }
      setNewMessage('')
    } catch (err) { console.error('Failed to send message', err) }
    finally { setSending(false) }
  }

  return (
    <div style={{ height: 'calc(100vh - 65px)', display: 'flex', flexDirection: 'column', padding: '2rem 4rem 1.5rem' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        .msg-input::placeholder { color: rgba(255,255,255,0.2) }
        .msg-input:focus { outline: none }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px }
      `}</style>

      {/* Confirm dialog — rendered at top level so it overlays everything */}
      <ConfirmDialog
        open={!!confirmTarget}
        name={confirmTarget?.other_user_name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minHeight: 0 }}>

        {/* Heading */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, lineHeight: 1.05 }}>
              <span style={{ display: 'block', fontSize: '2.8rem', fontWeight: '900', color: 'white', letterSpacing: '-1.5px' }}>My</span>
              <span style={{ display: 'block', fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1.5px', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Messages.</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem' }}>
              <button onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                {totalUnread > 0 && <span style={{ color: '#e87722', fontWeight: '700', marginLeft: '0.5rem' }}>· {totalUnread} unread</span>}
              </p>
            </div>
          </div>
          {totalUnread > 0 && (
            <button onClick={handleMarkAllRead} disabled={markingRead}
              style={{ padding: '0.5rem 1.2rem', background: 'rgba(232,119,34,0.08)', border: '1px solid rgba(232,119,34,0.18)', color: 'rgba(232,119,34,0.8)', borderRadius: '10px', cursor: markingRead ? 'not-allowed' : 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s ease' }}>
              {markingRead ? 'Marking...' : '✓ Mark all read'}
            </button>
          )}
        </div>

        {/* Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>

          {/* LEFT: sidebar */}
          <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', fontWeight: '700' }}>Conversations</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
              {newConvoMode && activeConvo?.isNew && (
                <div style={{ padding: '0.85rem 1rem', borderRadius: '14px', background: 'rgba(232,119,34,0.12)', border: '1px solid rgba(232,119,34,0.2)', marginBottom: '0.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Avatar name={activeConvo.other_user_name} size={38} orange />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#e87722' }}>{activeConvo.other_user_name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(232,119,34,0.6)', fontWeight: '600', marginTop: '0.1rem' }}>New conversation</div>
                  </div>
                </div>
              )}
              {loadingConvos ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ width: '28px', height: '28px', border: '2.5px solid rgba(255,255,255,0.08)', borderTop: '2.5px solid #e87722', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
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
                    onClick={() => { setActiveConvo(convo); setNewConvoMode(false); setMessages([]) }}
                    onDeleteRequest={handleDeleteRequest}
                  />
                ))
              )}
            </div>
          </div>

          {/* RIGHT: chat panel */}
          <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
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
                    <Avatar name={activeConvo.other_user_name} size={40} />
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: 'white', letterSpacing: '-0.3px' }}>{activeConvo.other_user_name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem', fontWeight: '500' }}>
                        {activeConvo.isNew ? 'Start a new conversation' : 'Active now'}
                      </div>
                    </div>
                  </div>
                  <ItemCard convo={activeConvo} myId={myId} onStatusChange={handleStatusChange} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {loadingMessages ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '28px', height: '28px', border: '2.5px solid rgba(255,255,255,0.08)', borderTop: '2.5px solid #e87722', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  ) : activeConvo.isNew ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.2rem', opacity: 0.25 }}>👋</div>
                      <p style={{ fontSize: '0.85rem', fontWeight: '500' }}>Say hello to <span style={{ color: '#e87722', fontWeight: '700' }}>{activeConvo.other_user_name}</span></p>
                      <p style={{ fontSize: '0.72rem', opacity: 0.6 }}>about {activeConvo.item_title}</p>
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
                            <div style={{ padding: '0.6rem 0.95rem', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? 'linear-gradient(135deg, #e87722, #f09030)' : 'rgba(255,255,255,0.08)', border: isMe ? 'none' : '1px solid rgba(255,255,255,0.07)', color: isMe ? 'white' : 'rgba(255,255,255,0.88)', fontSize: '0.875rem', lineHeight: '1.5', boxShadow: isMe ? '0 4px 12px rgba(232,119,34,0.22)' : 'none' }}>
                              {msg.content}
                            </div>
                            {time && <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', paddingInline: '0.3rem' }}>{new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
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
                      <input className="msg-input" type="text" value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
                        placeholder={activeConvo.isNew ? `Message ${activeConvo.other_user_name}...` : 'Type a message...'}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem 1rem', background: inputFocused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: inputFocused ? '1px solid rgba(232,119,34,0.3)' : '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', color: 'white', fontSize: '0.875rem', fontFamily: 'inherit', transition: 'all 0.2s ease' }}
                      />
                    </div>
                    <button type="submit" disabled={sending || !newMessage.trim()}
                      style={{ width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0, background: sending || !newMessage.trim() ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #e87722, #f09030)', border: 'none', cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: !sending && newMessage.trim() ? '0 4px 14px rgba(232,119,34,0.3)' : 'none' }}>
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