import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import API from '../api/axios'
import { connectSocket } from '../socket'
import { useTheme, THEMES } from '../ThemeContext'

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── IconBtn — no box, only color change on hover/active ─────────────────────
function IconBtn({ onClick, title, isActive, children }) {
  const [hovered, setHovered] = useState(false)
  const active = isActive || hovered
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      style={{
        position: 'relative',
        width: '36px', height: '36px',
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
    >
      {typeof children === 'function' ? children(active) : children}
    </button>
  )
}

// ─── Notification rows ────────────────────────────────────────────────────────

function SaleNotifRow({ notif, onDelete, onClick }) {
  const [hovered, setHovered] = useState(false)
  const [delHovered, setDelHovered] = useState(false)
  const isUnseen = !notif.seen
  const isPriceDrop = notif.type === 'price_drop'
  const PD_COLOR = '#ef4444'
  const PD_SOFT  = 'rgba(239,68,68,0.12)'
  const PD_BORDER = 'rgba(239,68,68,0.25)'

  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}
      style={{
        padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
        background: hovered
          ? isPriceDrop ? 'rgba(239,68,68,0.06)' : 'var(--accent-soft)'
          : isUnseen ? isPriceDrop ? 'rgba(239,68,68,0.04)' : 'var(--bg-card)' : 'transparent',
        transition: 'background 0.2s ease',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        position: 'relative', cursor: 'pointer',
      }}
    >
      {isUnseen && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: '3px', height: '60%', borderRadius: '0 2px 2px 0',
          background: isPriceDrop ? `linear-gradient(180deg, ${PD_COLOR}, #f87171)` : 'linear-gradient(180deg, var(--accent), var(--accent-alt))',
        }} />
      )}
      <div style={{
        width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: isUnseen
          ? isPriceDrop ? `linear-gradient(135deg, ${PD_COLOR}, #f87171)` : 'linear-gradient(135deg, var(--accent), var(--accent-alt))'
          : isPriceDrop ? PD_SOFT : 'var(--accent-soft)',
        border: isUnseen ? 'none' : isPriceDrop ? `1px solid ${PD_BORDER}` : '1px solid var(--border-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isUnseen ? isPriceDrop ? '0 2px 10px rgba(239,68,68,0.35)' : 'var(--shadow-accent)' : 'none',
      }}>
        {isPriceDrop ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isUnseen ? 'white' : PD_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isUnseen ? 'white' : 'var(--accent)'} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
          {isPriceDrop && (
            <span style={{ fontSize: '0.58rem', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase', color: PD_COLOR, background: PD_SOFT, border: `1px solid ${PD_BORDER}`, padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>Price Drop</span>
          )}
          <div style={{ fontSize: '0.82rem', fontWeight: isUnseen ? '700' : '500', color: isUnseen ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {notif.itemTitle || (isPriceDrop ? 'Item price dropped' : 'Item sold')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {isPriceDrop ? (
            <>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: '600' }}>₹{notif.oldPrice?.toLocaleString()}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={PD_COLOR} strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: PD_COLOR }}>₹{notif.price?.toLocaleString()}</span>
              {notif.oldPrice && (
                <>
                  <span style={{ color: 'var(--border-hover)', fontSize: '0.6rem' }}>·</span>
                  <span style={{ fontSize: '0.7rem', color: PD_COLOR, fontWeight: '600', opacity: 0.8 }}>
                    -{Math.round(((notif.oldPrice - notif.price) / notif.oldPrice) * 100)}% off
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{notif.price}</span>
              <span style={{ color: 'var(--border-hover)', fontSize: '0.6rem' }}>·</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>Bought by {notif.buyerName || 'Buyer'}</span>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: '500' }}>{timeAgo(notif.createdAt)}</span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(notif.id) }}
          onMouseEnter={() => setDelHovered(true)} onMouseLeave={() => setDelHovered(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', color: delHovered ? '#ff6b6b' : 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1, transition: 'color 0.15s' }}
          title="Remove"
        >×</button>
      </div>
    </div>
  )
}

function MsgNotifRow({ msg, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: hovered ? 'rgba(var(--accent-rgb),0.06)' : 'var(--bg-card)', transition: 'background 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', cursor: 'pointer' }}
    >
      <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '60%', borderRadius: '0 2px 2px 0', background: 'linear-gradient(180deg, var(--accent), var(--accent-alt))' }} />
      <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, background: 'var(--bg-card-hover)', border: '1.5px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800', color: 'var(--accent)', overflow: 'hidden' }}>
        {msg.senderAvatar
          ? <img src={msg.senderAvatar} alt="" referrerPolicy="no-referrer" onError={e => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : (msg.senderName || 'U').charAt(0).toUpperCase()
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.18rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.senderName || 'Someone'}</div>
        <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.12rem' }}>{msg.content}</div>
        <div style={{ fontSize: '0.67rem', fontWeight: '600', opacity: 0.7 }}>
          <span style={{ color: 'var(--text-muted)' }}>item: </span>
          <span style={{ color: 'var(--accent)' }}>{msg.itemTitle || 'Item'}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: '500' }}>{timeAgo(msg.createdAt)}</span>
        <span style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.2s', color: 'var(--accent)', fontSize: '0.7rem' }}>→</span>
      </div>
    </div>
  )
}

// ─── Bell ─────────────────────────────────────────────────────────────────────

function BellIcon({ isLoggedIn, registerOpenBell }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isOnMessages = location.pathname === '/messages'
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('sales')
  const [saleNotifs, setSaleNotifs] = useState([])
  const [msgNotifs, setMsgNotifs] = useState([])
  const [loadingSales, setLoadingSales] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [unreadSales, setUnreadSales] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [pendingSales, setPendingSales] = useState(0)
  const [pendingMsgs, setPendingMsgs] = useState(0)
  const [unreadRequests, setUnreadRequests] = useState(0)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (registerOpenBell) {
      registerOpenBell(() => { setOpen(true); setActiveTab('sales'); fetchSaleNotifs(); fetchMsgNotifs() })
    }
  }, [registerOpenBell])

  useEffect(() => {
    if (isLoggedIn) { if (!isOnMessages) fetchUnreadCounts() }
    const interval = setInterval(() => { if (!isOnMessages) fetchUnreadCounts() }, 120000)
    return () => clearInterval(interval)
  }, [isLoggedIn, isOnMessages])

  useEffect(() => {
    if (isOnMessages && unreadMsgs > 0) { setUnreadMsgs(0); API.post('/messages/mark-all-read').catch(() => {}) }
  }, [isOnMessages])

  useEffect(() => {
    if (!isLoggedIn) return
    const me = JSON.parse(localStorage.getItem('user') || 'null')
    if (!me?.id) return
    const socket = connectSocket(me.id)
    const handler = (msg) => {
      if (String(msg.receiverId) !== String(me.id)) return
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      if (u?.messageNotificationsEnabled === false) return
      if (window.location.pathname === '/messages') { setUnreadMsgs(0); return }
      const activeKey = window.__activeConvoKey
      const msgKeyA = `${msg.itemId}-${msg.senderId}`
      const msgKeyB = `${msg.itemId}-${msg.receiverId}`
      if (activeKey && (activeKey === msgKeyA || activeKey === msgKeyB)) return
      setUnreadMsgs(prev => prev + 1)
      setMsgNotifs(prev => {
        if (prev.some(n => n.id === msg.id)) return prev
        return [{ id: msg.id, senderId: msg.senderId, senderName: msg.senderName || '', senderAvatar: msg.senderAvatar || null, itemId: msg.itemId, itemTitle: msg.itemTitle || '', content: msg.content, createdAt: msg.createdAt }, ...prev]
      })
    }
    socket.on('new-message', handler)
    const priceDropHandler = (data) => {
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      if (u?.notificationsEnabled === false || u?.priceDropAlerts === false) return
      setUnreadSales(prev => prev + 1)
      setSaleNotifs(prev => {
        const notif = { id: data.notification?.id || Date.now(), type: 'price_drop', itemId: data.itemId, itemTitle: data.itemTitle, oldPrice: data.oldPrice, price: data.newPrice, seen: false, createdAt: new Date().toISOString() }
        if (prev.some(n => n.id === notif.id)) return prev
        return [notif, ...prev]
      })
    }
    const newSaleHandler = (data) => {
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      if (u?.notificationsEnabled === false) return
      setUnreadSales(prev => prev + 1)
      setSaleNotifs(prev => {
        const notif = { id: data.notification?.id || Date.now(), type: 'sale', itemId: data.itemId, itemTitle: data.itemTitle, price: data.price, buyerName: data.buyerName, seen: false, createdAt: new Date().toISOString() }
        if (prev.some(n => n.id === notif.id)) return prev
        return [notif, ...prev]
      })
    }
    const chatReqHandler = () => setUnreadRequests(prev => prev + 1)
    socket.on('new-chat-request', chatReqHandler)
    socket.on('new-sale', newSaleHandler)
    socket.on('price-drop', priceDropHandler)
    return () => {
      socket.off('new-message', handler)
      socket.off('new-sale', newSaleHandler)
      socket.off('price-drop', priceDropHandler)
      socket.off('new-chat-request', chatReqHandler)
    }
  }, [isLoggedIn])

  useEffect(() => {
    function handleOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  async function fetchUnreadCounts() {
    const u = JSON.parse(localStorage.getItem('user') || 'null')
    try {
      const [saleRes, msgRes, reqRes] = await Promise.all([API.get('/notifications'), API.get('/messages/unread-count'), API.get('/chat-requests')])
      const pendingReqs = (reqRes.data?.received || []).filter(r => r.status === 'pending').length
      setUnreadRequests(pendingReqs)
      if (u?.notificationsEnabled !== false) setUnreadSales(saleRes.data.length); else setUnreadSales(0)
      if (u?.messageNotificationsEnabled !== false) setUnreadMsgs(msgRes.data.count || 0); else setUnreadMsgs(0)
    } catch {
      try { const saleRes = await API.get('/notifications'); const u2 = JSON.parse(localStorage.getItem('user') || 'null'); if (u2?.notificationsEnabled !== false) setUnreadSales(saleRes.data.length) } catch {}
    }
  }
  async function fetchSaleNotifs() { setLoadingSales(true); try { const res = await API.get('/notifications/all'); setSaleNotifs(res.data || []) } catch { setSaleNotifs([]) } setLoadingSales(false) }
  async function fetchMsgNotifs() { setLoadingMsgs(true); try { const res = await API.get('/messages/unread'); const msgs = res.data || []; setMsgNotifs(msgs); setUnreadMsgs(msgs.length) } catch { setMsgNotifs([]); setUnreadMsgs(0) } setLoadingMsgs(false) }

  async function handleOpen() {
    const w = !open; setOpen(w)
    if (w) {
      setPendingSales(unreadSales); setPendingMsgs(unreadMsgs); setUnreadSales(0); setUnreadMsgs(0)
      if (unreadSales > 0) setActiveTab('sales'); else if (unreadMsgs > 0) setActiveTab('messages')
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      try {
        const [saleRes, allRes, msgRes] = await Promise.all([API.get('/notifications'), API.get('/notifications/all'), API.get('/messages/unread')])
        const sales = u?.notificationsEnabled !== false ? saleRes.data.length : 0
        const msgs  = u?.messageNotificationsEnabled !== false ? msgRes.data.length : 0
        setPendingSales(sales); setPendingMsgs(msgs); setSaleNotifs(allRes.data || []); setMsgNotifs(msgRes.data || [])
        if (sales > 0) setActiveTab('sales'); else if (msgs > 0) setActiveTab('messages')
      } catch {}
    } else {
      setUnreadSales(pendingSales); setUnreadMsgs(pendingMsgs); setPendingSales(0); setPendingMsgs(0)
    }
  }
  async function handleMarkAllSeen() { try { await API.post('/notifications/mark-seen'); setUnreadSales(0); setPendingSales(0); setSaleNotifs(prev => prev.map(n => ({ ...n, seen: true }))) } catch {} }
  async function handleDeleteOne(id) { try { await API.delete(`/notifications/${id}`); setSaleNotifs(prev => prev.filter(n => n.id !== id)); setUnreadSales(saleNotifs.filter(n => n.id !== id && !n.seen).length) } catch {} }
  async function handleClearAll() { try { await API.delete('/notifications/clear'); setSaleNotifs([]); setUnreadSales(0) } catch {} }
  function handleSaleClick(notif) { setOpen(false); setPendingSales(0); setUnreadSales(0); navigate(`/dashboard?tab=${notif.type === 'price_drop' ? 'watching' : 'sold'}&item=${notif.itemId}`); API.post('/notifications/mark-seen').catch(() => {}) }
  function handleMsgClick(msg) { setOpen(false); setUnreadMsgs(0); API.post('/messages/mark-all-read').catch(() => {}); navigate('/messages', { state: { item: { id: msg.itemId, title: msg.itemTitle, seller: { id: msg.senderId, name: msg.senderName } } } }) }
  function handleTabClick(tabKey) {
    setActiveTab(tabKey)
    if (tabKey === 'messages') { setPendingMsgs(0); setUnreadMsgs(0); API.post('/messages/mark-read').catch(() => {}) }
    if (tabKey === 'sales') { setPendingSales(0); setUnreadSales(0); API.post('/notifications/mark-seen').catch(() => {}) }
  }

  if (!isLoggedIn) return null
  const totalUnread = unreadSales + unreadMsgs
  const hasUnread = totalUnread > 0
  const isActive = open || hovered

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Bell button — no box, only icon color changes */}
      <button
        ref={buttonRef}
        onClick={handleOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Notifications"
        style={{
          position: 'relative', width: '36px', height: '36px',
          borderRadius: 'var(--radius-sm)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', transition: 'all 0.2s ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={isActive ? 'var(--accent)' : 'var(--text-secondary)'}
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'stroke 0.2s ease' }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasUnread && (
          <div style={{ position: 'absolute', top: '-5px', right: '-5px', minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 4px', background: 'linear-gradient(135deg, #ff4444, #ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: '800', color: 'white', boxShadow: '0 2px 8px rgba(255,68,68,0.5)', border: '1.5px solid var(--bg-base)', animation: 'bellBadgePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            {totalUnread > 9 ? '9+' : totalUnread}
          </div>
        )}
      </button>

      {open && (
        <div ref={dropdownRef} style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '340px', background: 'var(--bg-surface)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', animation: 'dropdownSlide 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)', zIndex: 200 }}>
          <div style={{ padding: '0.85rem 1rem 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Notifications</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {activeTab === 'sales' && unreadSales > 0 && <button onClick={handleMarkAllSeen} style={{ fontSize: '0.65rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 6px', borderRadius: '6px', opacity: 0.7, transition: 'opacity 0.2s', fontFamily: 'var(--font-body)' }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.7'}>Mark seen</button>}
                {activeTab === 'sales' && saleNotifs.length > 0 && <button onClick={handleClearAll} style={{ fontSize: '0.65rem', color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 6px', borderRadius: '6px', opacity: 0.7, transition: 'opacity 0.2s', fontFamily: 'var(--font-body)' }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.7'}>Clear all</button>}
              </div>
            </div>
            <div style={{ display: 'flex' }}>
              {[{ key: 'sales', label: 'Sales & Alerts', count: pendingSales }, { key: 'messages', label: 'Messages', count: pendingMsgs }].map(tab => (
                <button key={tab.key} onClick={() => handleTabClick(tab.key)} style={{ flex: 1, padding: '0.5rem 0.5rem 0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: activeTab === tab.key ? '700' : '500', color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', letterSpacing: '0.5px', fontFamily: 'var(--font-body)' }}>
                  {tab.label}
                  {tab.count > 0 && <span style={{ fontSize: '0.55rem', fontWeight: '800', padding: '1px 5px', borderRadius: '10px', minWidth: '16px', textAlign: 'center', background: activeTab === tab.key ? 'var(--accent-soft)' : 'var(--bg-card-hover)', color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)', border: activeTab === tab.key ? '1px solid var(--accent-border)' : '1px solid var(--border)' }}>{tab.count > 9 ? '9+' : tab.count}</span>}
                </button>
              ))}
            </div>
          </div>
          <div style={{ maxHeight: '360px', overflowY: 'auto' }} className="notif-scroll">
            {activeTab === 'sales' && (loadingSales ? <div style={{ padding: '2rem', textAlign: 'center' }}><div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--accent-soft)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} /></div> : saleNotifs.length === 0 ? <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}><div style={{ fontSize: '1.6rem', marginBottom: '0.5rem', opacity: 0.3 }}>🛒</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No sale notifications yet</div></div> : saleNotifs.map((notif, i) => <SaleNotifRow key={notif.id || i} notif={notif} onDelete={handleDeleteOne} onClick={() => handleSaleClick(notif)} />))}
            {activeTab === 'messages' && (loadingMsgs ? <div style={{ padding: '2rem', textAlign: 'center' }}><div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(116,185,255,0.3)', borderTopColor: '#74b9ff', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} /></div> : msgNotifs.length === 0 ? <div style={{ padding: '1.5rem 1rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}><div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg></div><div><div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '2px' }}>All caught up</div><div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>No unread messages</div></div></div></div> : msgNotifs.map((msg, i) => <MsgNotifRow key={msg.id || i} msg={msg} onClick={() => handleMsgClick(msg)} />))}
          </div>
          <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <button onClick={() => { setOpen(false); if (activeTab === 'sales') navigate('/dashboard?tab=sold'); else navigate('/messages') }} style={{ fontSize: '0.68rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', transition: 'opacity 0.2s', opacity: 0.7, fontFamily: 'var(--font-body)' }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.7'}>
              {activeTab === 'sales' ? 'View all sales →' : 'Open messages →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Profile Nudge Banner ─────────────────────────────────────────────────────

function ProfileNudge({ onDismiss }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ background: 'var(--accent-soft)', borderBottom: '1px solid var(--accent-border)', padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', animation: 'nudgeSlide 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', flexShrink: 0, animation: 'pulse 2s ease infinite' }} />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Complete your profile — <span style={{ color: 'var(--accent)', fontWeight: '600' }}>add institution &amp; phone</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <button onClick={() => navigate('/settings?section=institution')} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ padding: '0.28rem 0.75rem', background: hovered ? 'var(--accent)' : 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '700', color: hovered ? 'white' : 'var(--accent)', transition: 'all 0.2s ease', letterSpacing: '0.5px', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>Complete →</button>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1, padding: '2px 4px', transition: 'color 0.2s', fontFamily: 'var(--font-body)' }} onMouseEnter={e => e.currentTarget.style.color='var(--text-secondary)'} onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'} title="Dismiss">×</button>
      </div>
    </div>
  )
}

// ─── Desktop nav link with icon fallback at medium widths ─────────────────────
function DesktopNavLink({ to, label, icon, isActive, linkRef }) {
  return (
    <Link
      ref={linkRef}
      to={to}
      style={{
        textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.3px',
        fontWeight: isActive ? '700' : '500',
        padding: '0.38rem 0.9rem', borderRadius: '999px',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        position: 'relative', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)',
        zIndex: 1, transition: 'color 0.18s ease',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}
    >
      {/* Icon — shown on medium screens, hidden on wide */}
      <span className="nav-link-icon" style={{ display: 'flex', alignItems: 'center', color: isActive ? 'var(--accent)' : 'var(--text-secondary)', transition: 'color 0.18s ease', flexShrink: 0 }}>
        {icon}
      </span>
      {/* Label — hidden on medium screens, shown on wide */}
      <span className="nav-link-label">{label}</span>
      {/* Active dot */}
      {isActive && (
        <div style={{
          position: 'absolute', bottom: '2px', left: '50%',
          transform: 'translateX(-50%)',
          width: '3px', height: '3px', borderRadius: '50%',
          background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)',
        }} />
      )}
    </Link>
  )
}

// ─── NavLinkGroup with moving hover pill ──────────────────────────────────────
function NavLinkGroup({ items, isLoggedIn, location }) {
  const groupRef = useRef(null)
  const linkRefs = useRef([])
  const pillRef  = useRef(null)
  const [pillVisible, setPillVisible] = useState(false)
  const rafRef = useRef(null)

  function movePillTo(idx) {
    const el = linkRefs.current[idx]
    const group = groupRef.current
    const pillEl = pillRef.current
    if (!el || !group || !pillEl) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const ge = group.getBoundingClientRect()
      const le = el.getBoundingClientRect()
      pillEl.style.left  = `${le.left - ge.left}px`
      pillEl.style.width = `${le.width}px`
    })
    setPillVisible(true)
  }
  function handleMouseLeave() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPillVisible(false)
  }

  const guestLinks = [
    { to: '/login', label: 'Login', isActive: location.pathname === '/login' },
    { to: '/register', label: 'Register', isActive: location.pathname === '/register' },
  ]
  const allItems = isLoggedIn ? items : [...items, ...guestLinks]

  return (
    <div ref={groupRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.05rem' }}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={pillRef}
        style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          height: '32px', borderRadius: '999px',
          background: 'color-mix(in srgb, var(--text-primary) 9%, transparent)',
          border: '1px solid color-mix(in srgb, var(--text-primary) 13%, transparent)',
          left: 0, width: 0,
          opacity: pillVisible ? 1 : 0,
          transition: 'opacity 0.12s ease',
          pointerEvents: 'none', zIndex: 0,
        }}
      />
      {allItems.map((item, idx) => (
        <div key={item.to} onMouseEnter={() => movePillTo(idx)} style={{ position: 'relative' }}>
          <DesktopNavLink
            to={item.to}
            label={item.label}
            icon={item.icon}
            isActive={item.isActive}
            linkRef={el => { linkRefs.current[idx] = el }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── SwipePill — FIXED: perfect circle always, offsetHeight, 50ms settle ──────
function SwipePill({ options, activeIdx, onChange, renderOption, pillBg = 'var(--bg-surface)', trackBg = 'var(--bg-input)' }) {
  const trackRef    = useRef(null)
  const pillElRef   = useRef(null)
  const startXRef   = useRef(null)
  const startIdxRef = useRef(activeIdx)
  const n = options.length

  function positionPill(idx) {
    const track = trackRef.current
    const pill  = pillElRef.current
    if (!track || !pill) return
    const PAD    = 4
    // offsetHeight/offsetWidth are always correct after paint — never return 0
    const trackH = track.offsetHeight
    const trackW = track.offsetWidth
    if (!trackH || !trackW) return
    const inner  = trackH - PAD * 2          // circle diameter = track inner height
    const btnW   = (trackW - PAD * 2) / n
    const center = PAD + btnW * idx + btnW / 2
    const left   = center - inner / 2
    pill.style.width        = `${inner}px`
    pill.style.height       = `${inner}px`
    pill.style.left         = `${left}px`
    pill.style.top          = `${PAD}px`
    pill.style.borderRadius = '50%'          // always force perfect circle
  }

  // Run after every render + 50ms delay to catch dropdown open animation
  useEffect(() => {
    positionPill(activeIdx)
    const t = setTimeout(() => positionPill(activeIdx), 50)
    return () => clearTimeout(t)
  })

  function handleTouchStart(e) {
    startXRef.current   = e.touches[0].clientX
    startIdxRef.current = activeIdx
  }
  function handleTouchMove(e) {
    if (startXRef.current === null) return
    // 3-finger swipe — prevent page scroll
    if (e.touches.length >= 3) e.preventDefault()
  }
  function handleTouchEnd(e) {
    if (startXRef.current === null) return
    const dx = e.changedTouches[0].clientX - startXRef.current
    const threshold = 28
    if      (dx < -threshold && startIdxRef.current < n - 1) onChange(startIdxRef.current + 1)
    else if (dx >  threshold && startIdxRef.current > 0)     onChange(startIdxRef.current - 1)
    startXRef.current = null
  }

  return (
    <div
      ref={trackRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        background: trackBg,
        border: '1px solid var(--border)',
        borderRadius: '999px',
        padding: '4px',
        userSelect: 'none', WebkitUserSelect: 'none',
        cursor: 'pointer',
        height: '44px',                      // explicit → offsetHeight always valid
        minWidth: `${n * 44}px`,
      }}
    >
      {/* Sliding circle — DOM-mutated via positionPill, never React state */}
      <div
        ref={pillElRef}
        style={{
          position: 'absolute',
          borderRadius: '50%',
          background: pillBg,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2), 0 0 0 1.5px color-mix(in srgb, var(--text-primary) 12%, transparent)',
          transition: 'left 0.22s cubic-bezier(0.34,1.15,0.64,1)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {options.map((opt, idx) => (
        <button
          key={idx}
          onClick={() => onChange(idx)}
          style={{
            position: 'relative', zIndex: 1,
            flex: 1,
            height: '36px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '999px',
            transition: 'color 0.18s ease',
            minWidth: '36px',
          }}
        >
          {renderOption(opt, idx, idx === activeIdx)}
        </button>
      ))}
    </div>
  )
}

// ─── Slim dropdown ────────────────────────────────────────────────────────────
function SlimDropdown({ open, dropdownRef, theme, setThemeById, gridSize, setGridSize, handleLogout, navigate, location, isHomePage, onMouseEnter, onMouseLeave }) {
  const THEME_OPTS = [
    {
      id: 'ember',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"
          style={{ color: active ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.18s' }}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )
    },
    {
      id: 'midnight',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"
          style={{ color: active ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.18s' }}>
          <path d="M12 2a10 10 0 0 1 0 20V2z"/><circle cx="12" cy="12" r="10"/>
        </svg>
      )
    },
    {
      id: 'chalk',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"
          style={{ color: active ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.18s' }}>
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      )
    },
  ]

  const GRID_OPTS = isHomePage
    ? [{ val: 2, label: 'II' }, { val: 3, label: 'III' }]
    : [{ val: 1, label: 'I' }, { val: 2, label: 'II' }, { val: 3, label: 'III' }]

  const themeIdx = THEME_OPTS.findIndex(t => t.id === theme)
  const effectiveGridSize = (isHomePage && gridSize < 2) ? 2 : gridSize
  const gridIdx = Math.max(0, GRID_OPTS.findIndex(o => o.val === effectiveGridSize))

  const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif'
  const ROW = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1.1rem' }
  const LABEL = { fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)', fontFamily: SF, letterSpacing: '-0.1px' }
  const DIV = { height: '1px', background: 'var(--border)', margin: '0 1rem' }

  return (
    <div
      ref={dropdownRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: '68px',
        right: '0.75rem',
        width: 'min(260px, calc(100vw - 1.5rem))',
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid var(--border)',
        borderRadius: '18px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 160,
        overflow: 'hidden',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.96)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.2,0.64,1)',
        transformOrigin: 'top right',
      }}
    >
      {/* Transactions */}
      <button onClick={() => navigate('/transactions')}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.65rem 1.1rem',
          background: location?.pathname === '/transactions' ? 'var(--accent-soft)' : 'transparent',
          border: 'none', cursor: 'pointer', transition: 'background 0.15s',
          fontFamily: SF,
        }}
        onMouseEnter={e => { if (location?.pathname !== '/transactions') e.currentTarget.style.background = 'var(--bg-card-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = location?.pathname === '/transactions' ? 'var(--accent-soft)' : 'transparent' }}
      >
        <span style={{ ...LABEL, color: location?.pathname === '/transactions' ? 'var(--accent)' : 'var(--text-primary)' }}>Transactions</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke={location?.pathname === '/transactions' ? 'var(--accent)' : 'var(--text-muted)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v4l3 3" /><path d="M3.05 11a9 9 0 1 1 .5 4" /><path d="M3 3v5h5" />
        </svg>
      </button>

      <div style={DIV} />

      {/* Theme */}
      <div style={ROW}>
        <span style={LABEL}>Theme</span>
        <SwipePill
          options={THEME_OPTS}
          activeIdx={themeIdx === -1 ? 0 : themeIdx}
          onChange={idx => setThemeById(THEME_OPTS[idx].id)}
          renderOption={(opt, idx, active) => opt.icon(active)}
          pillBg="var(--bg-card)"
          trackBg="var(--bg-input)"
        />
      </div>

      <div style={DIV} />

      {/* Grid size */}
      <div style={ROW}>
        <span style={LABEL}>Grid size</span>
        <SwipePill
          options={GRID_OPTS}
          activeIdx={gridIdx}
          onChange={idx => setGridSize(GRID_OPTS[idx].val)}
          renderOption={(opt, idx, active) => (
            <span style={{
              fontSize: '0.82rem', fontWeight: active ? '700' : '400',
              letterSpacing: '1.8px', fontFamily: SF,
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'color 0.18s',
              lineHeight: 1,
            }}>{opt.label}</span>
          )}
          pillBg="var(--bg-card)"
          trackBg="var(--bg-input)"
        />
      </div>

      <div style={DIV} />

      {/* Logout */}
      <div style={{ padding: '0.5rem 0.7rem' }}>
        <button onClick={handleLogout}
          style={{
            width: '100%', padding: '0.6rem 1rem', borderRadius: '11px',
            background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.18)',
            cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500', color: '#ff6b6b',
            fontFamily: SF,
            transition: 'all 0.2s ease', textAlign: 'center', letterSpacing: '-0.1px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.38)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.18)' }}
        >Logout</button>
      </div>
    </div>
  )
}

// ─── Drawer link ──────────────────────────────────────────────────────────────
function DrawerLink({ to, label, icon, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link to={to} onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', textDecoration: 'none', background: isActive ? 'var(--accent-soft)' : hovered ? 'var(--bg-card-hover)' : 'transparent', border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent', color: isActive ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: isActive ? '700' : '500', letterSpacing: '0.3px', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease' }}
    >
      {icon && <span style={{ opacity: 0.7, display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {label}
    </Link>
  )
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
function Navbar({ registerOpenBell }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [logoHovered, setLogoHovered] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [showNudge, setShowNudge] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerHoverTimer = useRef(null)
  const hamburgerRef = useRef(null)
  const mobileDropdownRef = useRef(null)

  const [slimOpen, setSlimOpen] = useState(false)
  const slimDropdownRef = useRef(null)
  const slimBtnRef = useRef(null)
  const slimHoverTimer = useRef(null)

  const [scrolled, setScrolled] = useState(false)

  // ── Search: shown on home ONLY when user has scrolled past the home search bar ──
  // Uses scrollY directly — no dependency on Home page events which fire unreliably.
  // 350px is approximately where the home page's own search bar scrolls out of view.
  // Also listens to the event as a supplement (Home page can override if it wants).
  const [navSearchActive, setNavSearchActive] = useState(false)
  // navSearchActive is driven ONLY by the home-searchbar-visibility event
  // (fired by IntersectionObserver in Home.jsx when the real search bar enters/leaves view)
  const [navSearch, setNavSearch] = useState('')
  const [navSearchFocused, setNavSearchFocused] = useState(false)
  const navSearchRef = useRef(null)

  const [gridSize, setGridSizeState] = useState(() => {
    try { return parseInt(localStorage.getItem('homeGridSize') || '3', 10) } catch { return 3 }
  })
  function setGridSize(val) {
    setGridSizeState(val)
    localStorage.setItem('homeGridSize', String(val))
    if (window.__homeGridBridge) window.__homeGridBridge.set(val)
    else window.dispatchEvent(new CustomEvent('home-grid-size', { detail: { val } }))
  }

  const token = localStorage.getItem('token')
  const user  = JSON.parse(localStorage.getItem('user') || 'null')
  const isLoggedIn = !!token
  const isHomePath = location.pathname === '/' || location.pathname === '/home'

  // When navigating TO home, clamp gridSize to min 2 (home doesn't support grid 1)
  useEffect(() => {
    if (isHomePath && gridSize < 2) setGridSize(2)
  }, [isHomePath])

  const { theme, setThemeById } = useTheme()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Search visibility: driven purely by Home.jsx IntersectionObserver event ──
  // Home.jsx fires 'home-searchbar-visibility' with { visible: true/false }
  // when the real search bar enters/leaves the viewport. We just listen.
  useEffect(() => {
    // Always reset when route changes
    setNavSearchActive(false)
    setNavSearch('')

    function onVisibility(e) {
      if (!isHomePath) return   // ignore if not on home
      const visible = e.detail?.visible
      if (typeof visible === 'boolean') setNavSearchActive(!visible)
    }
    window.addEventListener('home-searchbar-visibility', onVisibility)
    return () => window.removeEventListener('home-searchbar-visibility', onVisibility)
  }, [isHomePath])

  // Keep navSearch in sync when user types in the home search bar directly
  useEffect(() => {
    function onHomeSearch(e) { setNavSearch(e.detail.value) }
    window.addEventListener('home-search-changed', onHomeSearch)
    return () => window.removeEventListener('home-search-changed', onHomeSearch)
  }, [])

  useEffect(() => { setDrawerOpen(false); setSlimOpen(false) }, [location.pathname])

  useEffect(() => {
    if (!drawerOpen) return
    function onMouseDown(e) {
      if (hamburgerRef.current?.contains(e.target) || mobileDropdownRef.current?.contains(e.target)) return
      setDrawerOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [drawerOpen])

  useEffect(() => {
    if (!slimOpen) return
    function onMouseDown(e) {
      if (slimBtnRef.current?.contains(e.target) || slimDropdownRef.current?.contains(e.target)) return
      setSlimOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [slimOpen])

  useEffect(() => {
    if (isLoggedIn && user?.profileComplete === false) {
      const dismissed = sessionStorage.getItem('nudgeDismissed')
      if (!dismissed) setShowNudge(true)
    } else { setShowNudge(false) }
  }, [isLoggedIn, user?.profileComplete])

  useEffect(() => { if (location.pathname === '/settings') setShowNudge(false) }, [location.pathname])
  function handleDismissNudge() { setShowNudge(false); sessionStorage.setItem('nudgeDismissed', 'true') }

  useEffect(() => {
    if (!isLoggedIn) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
      setCartCount(guestCart.length); return
    }
    const fetchCartCount = async () => { try { const res = await API.get('/cart'); setCartCount(res.data.length) } catch { setCartCount(0) } }
    fetchCartCount()
    const handleCartUpdate = (e) => { if (typeof e.detail?.count === 'number') setCartCount(e.detail.count); else fetchCartCount() }
    window.addEventListener('cart-updated', handleCartUpdate)
    return () => window.removeEventListener('cart-updated', handleCartUpdate)
  }, [isLoggedIn, location.pathname])

  function handleLogout() {
    localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('pendingNotifications')
    sessionStorage.removeItem('nudgeDismissed'); setCartCount(0); setDrawerOpen(false); setSlimOpen(false); navigate('/')
  }

  // Icons for each nav item (shown at medium widths instead of labels)
  const drawerItems = [
    {
      to: '/', label: 'Home', isActive: isHomePath,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    },
    {
      to: '/sellers', label: 'Find Sellers', isActive: location.pathname === '/sellers' || location.pathname.startsWith('/users/'),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    },
    {
      to: '/post', label: 'Post Item', isActive: location.pathname === '/post',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    },
    {
      to: '/dashboard', label: 'Dashboard', isActive: location.pathname === '/dashboard',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    },
    {
      to: '/messages', label: 'Messages', isActive: location.pathname === '/messages',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    },
    {
      to: '/settings', label: 'Settings', isActive: location.pathname === '/settings',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    },
  ]

  // Desktop shows all except Settings and Messages (those are in the slim dropdown / bell)
  const desktopItems = drawerItems.filter(i => i.to !== '/settings' && i.to !== '/messages')

  const pillClass = `nav-pill-base${scrolled ? ' nav-pill-scrolled' : ''}`

  return (
    <>
      <style>{`
        /* ── Animations ── */
        @keyframes bellBadgePop { 0% { transform:scale(0);opacity:0 } 70% { transform:scale(1.2);opacity:1 } 100% { transform:scale(1);opacity:1 } }
        @keyframes dropdownSlide { from { opacity:0;transform:translateY(-8px) scale(0.97) } to { opacity:1;transform:translateY(0) scale(1) } }
        @keyframes nudgeSlide { from { opacity:0;transform:translateY(-6px) } to { opacity:1;transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:1;box-shadow:0 0 8px var(--accent) } 50% { opacity:0.5;box-shadow:0 0 4px var(--accent) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes pillDrop { from { opacity:0;transform:translateY(-14px) scale(0.97) } to { opacity:1;transform:translateY(0) scale(1) } }
        @keyframes navSearchFadeIn { from { opacity:0;transform:translate(-50%,-50%) scale(0.94) } to { opacity:1;transform:translate(-50%,-50%) scale(1) } }

        /* ── Nav pill base ── */
        .nav-pill-base {
          animation: pillDrop 0.4s cubic-bezier(0.34,1.1,0.64,1) both;
          pointer-events: auto;
          display: flex; align-items: center;
          height: 52px;
          border-radius: 999px;
          background: var(--bg-nav);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          transition: background 0.35s ease, border-color 0.35s ease;
          flex-shrink: 0;
        }
        [data-theme="ember"] .nav-pill-base,
        [data-theme="midnight"] .nav-pill-base {
          background: color-mix(in srgb, var(--bg-nav) 85%, transparent) !important;
          box-shadow: 0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.08) inset !important;
          border-color: rgba(255,255,255,0.1) !important;
          backdrop-filter: blur(20px) !important; -webkit-backdrop-filter: blur(20px) !important;
        }
        [data-theme="ember"] .nav-pill-scrolled,
        [data-theme="midnight"] .nav-pill-scrolled {
          background: color-mix(in srgb, var(--bg-nav) 30%, transparent) !important;
          backdrop-filter: blur(48px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(48px) saturate(180%) !important;
          box-shadow: 0 8px 40px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.05) inset !important;
          border-color: rgba(255,255,255,0.07) !important;
        }
        [data-theme="midnight"] .nav-pill-base,
        [data-theme="midnight"] .nav-pill-scrolled { border-color: rgba(79,142,247,0.25) !important; }
        [data-theme="ember"] .nav-pill-base,
        [data-theme="ember"] .nav-pill-scrolled { border-color: rgba(232,119,34,0.22) !important; }
        [data-theme="chalk"] .nav-pill-base {
          background: rgba(255,255,255,0.96) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07), 0 8px 28px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06) !important;
        }

        /* ── Logo pill ── */
        .nav-logo-pill { width:52px; padding:0; justify-content:center; }

        /* ── Links pill ── */
        .nav-links-pill { padding:0 0.5rem; }

        /* ── Search pill — centered in the full nav row ── */
        .nav-search-pill {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          padding: 0 0.85rem;
          gap: 0.6rem;
          width: min(360px, 30vw);
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.3,0.64,1), width 0.2s ease;
        }
        .nav-search-pill.focused { width: min(440px, 36vw); }

        /* ── Right pill ── */
        .nav-right-pill { margin-left:auto; padding:0 0.5rem; gap:0.1rem; }

        /* ── Nav link label / icon responsive ── */
        /* >960px: show labels, hide icons */
        .nav-link-icon { display: none !important; }
        .nav-link-label { display: inline !important; }

        /* 600–960px: hide labels, show icons — pill stays visible */
        @media (max-width: 960px) {
          .nav-link-icon { display: flex !important; }
          .nav-link-label { display: none !important; }
        }

        /* ── Responsive breakpoints ── */
        /* nav-links-pill: always shown (switches content via CSS above) */
        .nav-links-pill { display: flex !important; }
        /* hamburger pill: hidden at >600px, shown at ≤600px */
        .nav-hamburger-pill { display: none !important; }

        @media (max-width: 600px) {
          /* Hide the links pill, show hamburger pill */
          .nav-links-pill { display: none !important; }
          .nav-hamburger-pill { display: flex !important; }
          .nav-outer { padding: 0.5rem 0.75rem !important; gap: 0.4rem !important; }
          .nav-logo-pill { width:44px !important; height:44px !important; }
          .nav-right-pill { height:44px !important; }
          .nav-search-pill { display: none !important; }
        }

        /* ── Notif scrollbar ── */
        .notif-scroll::-webkit-scrollbar { width: 4px; }
        .notif-scroll::-webkit-scrollbar-track { background: transparent; }
        .notif-scroll::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 2px; }

        /* ── Search input reset ── */
        .nav-search-input { background:transparent!important; border:none!important; outline:none!important; box-shadow:none!important; -webkit-appearance:none!important; appearance:none!important; }
        .nav-search-input:focus { outline:none!important; box-shadow:none!important; }
      `}</style>

      {/* ══ NAV OUTER — position:relative so absolute search pill centers correctly ══ */}
      <div
        className="nav-outer"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          padding: '0.65rem 1.25rem',
          pointerEvents: 'none',
          display: 'flex', alignItems: 'center',
          gap: '0.6rem',
          maxWidth: '100%',
        }}
      >

        {/* ── PILL 1: Logo ── */}
        <div className={`nav-pill-base nav-logo-pill${scrolled ? ' nav-pill-scrolled' : ''}`}>
          <Link to="/"
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', transition: 'transform 0.3s ease', transform: logoHovered ? 'scale(1.08)' : 'scale(1)' }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: logoHovered ? 'var(--shadow-glow-logo)' : 'var(--shadow-accent)', transition: 'box-shadow 0.3s ease', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
          </Link>
        </div>

        {/* ── PILL 2: Nav links ──
            >960px  → text labels
            600-960px → icons only (labels hidden via CSS)
            <600px  → this pill hides, standalone hamburger pill shows instead ── */}
        <div className={`nav-pill-base nav-links-pill${scrolled ? ' nav-pill-scrolled' : ''}`}>
          <NavLinkGroup items={desktopItems} isLoggedIn={isLoggedIn} location={location} />
        </div>

        {/* ── Hamburger pill — standalone, only visible <600px via CSS ── */}
        <div className={`nav-pill-base nav-hamburger-pill${scrolled ? ' nav-pill-scrolled' : ''}`}
          style={{ width: '52px', justifyContent: 'center', padding: 0 }}
        >
          <button
            ref={hamburgerRef}
            onClick={() => setDrawerOpen(v => !v)}
            onMouseEnter={() => { clearTimeout(drawerHoverTimer.current); setDrawerOpen(true) }}
            onMouseLeave={() => { drawerHoverTimer.current = setTimeout(() => setDrawerOpen(false), 100) }}
            title="Menu"
            style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease' }}
          >
            {drawerOpen
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>

        {/* ── PILL 3: Search — absolute center, ONLY when home search is out of view ── */}
        {isHomePath && navSearchActive && (
          <div
            className={`nav-pill-base nav-search-pill${navSearchFocused ? ' focused' : ''}${scrolled ? ' nav-pill-scrolled' : ''}`}
            style={{
              opacity: 1,
              pointerEvents: 'auto',
              transform: 'translate(-50%, -50%) scale(1)',
              animation: 'navSearchFadeIn 0.2s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={navSearchFocused ? 'var(--accent)' : 'var(--text-muted)'}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, transition: 'stroke 0.2s' }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={navSearchRef}
              type="text"
              className="nav-search-input"
              value={navSearch}
              placeholder="Search items..."
              onChange={e => {
                const val = e.target.value
                setNavSearch(val)
                if (window.__homeSearchBridge) window.__homeSearchBridge.set(val)
                window.dispatchEvent(new CustomEvent('home-navbar-search', { detail: { value: val } }))
                window.dispatchEvent(new CustomEvent('home-navbar-handoff', { detail: { value: val } }))
              }}
              onFocus={() => setNavSearchFocused(true)}
              onBlur={() => setNavSearchFocused(false)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'var(--font-body)', width: '100%', fontWeight: '500', minWidth: 0, padding: 0, margin: 0 }}
            />
            {navSearch && (
              <button
                onClick={() => { setNavSearch(''); if (window.__homeSearchBridge) window.__homeSearchBridge.set(''); window.dispatchEvent(new CustomEvent('home-navbar-search', { detail: { value: '' } })); navSearchRef.current?.focus() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color='var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        )}

        {/* ── PILL 4: Right cluster ── */}
        <div className={`nav-pill-base nav-right-pill${scrolled ? ' nav-pill-scrolled' : ''}`}>

          {/* Cart — no box, only icon color */}
          <IconBtn onClick={() => navigate('/cart')} title="Cart" isActive={location.pathname === '/cart'}>
            {(active) => (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={active ? 'var(--accent)' : 'var(--text-secondary)'}
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'stroke 0.2s ease' }}
                >
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '16px', height: '16px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: '800', color: 'white', border: '1.5px solid var(--bg-base)' }}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </div>
                )}
              </div>
            )}
          </IconBtn>

          {/* Bell */}
          <BellIcon isLoggedIn={isLoggedIn} registerOpenBell={registerOpenBell} />

          {/* Avatar + slim menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.1rem' }}>
            {isLoggedIn && user ? (
              <>
                <button
                  onClick={() => navigate('/settings?section=profile')}
                  title="Your profile"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: user?.avatar ? 'transparent' : 'var(--accent-soft)', border: '2px solid color-mix(in srgb, var(--accent) 45%, transparent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: 0, transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.boxShadow='0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='color-mix(in srgb, var(--accent) 45%, transparent)'; e.currentTarget.style.boxShadow='none' }}
                >
                  {user?.avatar
                    ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" onError={e => e.currentTarget.style.display='none'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--accent)', fontFamily: 'var(--font-body)', lineHeight: 1 }}>{(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}</span>
                  }
                </button>

                <button
                  ref={slimBtnRef}
                  onClick={() => setSlimOpen(v => !v)}
                  onMouseEnter={() => { clearTimeout(slimHoverTimer.current); setSlimOpen(true) }}
                  onMouseLeave={() => { slimHoverTimer.current = setTimeout(() => setSlimOpen(false), 120) }}
                  title="Menu"
                  style={{ width: '30px', height: '30px', borderRadius: '999px', background: slimOpen ? 'var(--accent-soft)' : 'var(--bg-card)', border: slimOpen ? '1px solid var(--accent-border)' : '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3.5px', transition: 'all 0.2s ease', flexShrink: 0 }}
                >
                  <span style={{ display: 'block', width: '12px', height: '1.5px', borderRadius: '2px', background: slimOpen ? 'var(--accent)' : 'var(--text-secondary)', transition: 'background 0.2s' }} />
                  <span style={{ display: 'block', width: '12px', height: '1.5px', borderRadius: '2px', background: slimOpen ? 'var(--accent)' : 'var(--text-secondary)', transition: 'background 0.2s' }} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{ display: 'flex', alignItems: 'center', padding: '0.38rem 1.1rem', borderRadius: '999px', background: 'var(--accent)', color: 'white', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.2px', textDecoration: 'none', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-accent)', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1)' }}
              >Sign In</Link>
            )}
          </div>
        </div>

        {/* Nudge */}
        {showNudge && <ProfileNudge onDismiss={handleDismissNudge} />}
      </div>

      {/* ══ SLIM DROPDOWN ══ */}
      <SlimDropdown
        open={slimOpen}
        dropdownRef={slimDropdownRef}
        theme={theme}
        setThemeById={setThemeById}
        gridSize={gridSize}
        setGridSize={setGridSize}
        handleLogout={handleLogout}
        navigate={navigate}
        location={location}
        isHomePage={isHomePath}
        onMouseEnter={() => clearTimeout(slimHoverTimer.current)}
        onMouseLeave={() => { slimHoverTimer.current = setTimeout(() => setSlimOpen(false), 120) }}
      />

      {/* ══ MOBILE DRAWER ══ */}
      <div
        ref={mobileDropdownRef}
        onMouseEnter={() => clearTimeout(drawerHoverTimer.current)}
        onMouseLeave={() => setDrawerOpen(false)}
        style={{
          position: 'fixed', top: '72px', left: '12px',
          width: 'min(300px, calc(100vw - 24px))',
          maxHeight: 'calc(100vh - 90px)',
          overflowY: 'auto',
          background: 'var(--bg-surface)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid var(--border)', borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.24), 0 4px 16px rgba(0,0,0,0.1)',
          zIndex: 160, display: 'flex', flexDirection: 'column',
          opacity: drawerOpen ? 1 : 0,
          transform: drawerOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.97)',
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.34,1.2,0.64,1)',
          transformOrigin: 'top left',
        }}
      >
        {/* Profile section */}
        <div style={{ padding: '1.5rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: user?.avatar ? 'transparent' : 'var(--accent-soft)', border: '2.5px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 4px color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" onError={e => e.currentTarget.style.display='none'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>{(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}</span>
            }
          </div>
          {isLoggedIn && user ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', letterSpacing: '-0.2px' }}>{user.firstName} {user.lastName}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>{user.email}</div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>Student Shop</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>Campus Buy &amp; Sell</div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {isLoggedIn
            ? drawerItems.map(item => <DrawerLink key={item.to} to={item.to} label={item.label} icon={item.icon} isActive={item.isActive} onClick={() => setDrawerOpen(false)} />)
            : <>
                <DrawerLink to="/" label="Home" isActive={isHomePath} onClick={() => setDrawerOpen(false)} icon={drawerItems[0].icon} />
                <DrawerLink to="/login" label="Login" isActive={location.pathname === '/login'} onClick={() => setDrawerOpen(false)} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>} />
                <DrawerLink to="/register" label="Register" isActive={location.pathname === '/register'} onClick={() => setDrawerOpen(false)} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>} />
              </>
          }
        </div>
      </div>
    </>
  )
}

export default Navbar