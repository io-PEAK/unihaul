import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import API from '../api/axios'

function NavLink({ to, label, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '1.5px',
        textTransform: 'uppercase', fontWeight: isActive ? '700' : '500',
        transition: 'all 0.3s ease', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)',
        color: isActive ? 'var(--accent)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: isActive ? 'var(--accent-soft)' : hovered ? 'var(--bg-card-hover)' : 'transparent',
        position: 'relative', whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)',
      }}
    >
      {label}
      {isActive && (
        <div style={{
          position: 'absolute', bottom: '0px', left: '50%',
          transform: 'translateX(-50%)', width: '4px', height: '4px',
          borderRadius: '50%', background: 'var(--accent)',
          boxShadow: '0 0 8px var(--accent-glow)',
        }} />
      )}
    </Link>
  )
}

function NavIconButton({ onClick, onNavigate, to, title, isActive, children }) {
  const navigate = useNavigate ? useNavigate() : null
  const [hovered, setHovered] = useState(false)
  const handleClick = () => {
    if (onNavigate && to) onNavigate(to)
    if (onClick) onClick()
  }
  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      style={{
        position: 'relative', width: '38px', height: '38px', borderRadius: 'var(--radius-sm)',
        background: isActive ? 'var(--accent-soft)' : hovered ? 'var(--accent-soft)' : 'var(--bg-card)',
        border: isActive ? '1px solid var(--accent-border)' : hovered ? '1px solid var(--accent-border)' : '1px solid var(--border)',
        boxShadow: isActive ? 'var(--shadow-accent)' : 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease', flexShrink: 0,
      }}
    >
      {children(isActive || hovered)}
    </button>
  )
}

function HistoryIcon() {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname === '/transactions'
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={() => navigate('/transactions')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Transaction History"
      style={{
        position: 'relative', width: '38px', height: '38px', borderRadius: 'var(--radius-sm)',
        background: isActive ? 'var(--accent-soft)' : hovered ? 'var(--accent-soft)' : 'var(--bg-card)',
        border: isActive ? '1px solid var(--accent-border)' : hovered ? '1px solid var(--accent-border)' : '1px solid var(--border)',
        boxShadow: isActive ? '0 0 12px var(--accent-glow)' : 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease', flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={isActive || hovered ? 'var(--accent)' : 'var(--text-secondary)'}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.3s ease' }}>
        <path d="M12 8v4l3 3" />
        <path d="M3.05 11a9 9 0 1 1 .5 4" />
        <path d="M3 3v5h5" />
      </svg>
    </button>
  )
}

function SettingsIcon() {
  const navigate = useNavigate()
  const location = useLocation()
  const [hovered, setHovered] = useState(false)
  const isActive = location.pathname === '/settings'
  return (
    <button
      onClick={() => navigate('/settings')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Settings"
      style={{
        position: 'relative', width: '38px', height: '38px', borderRadius: 'var(--radius-sm)',
        background: isActive ? 'var(--accent-soft)' : hovered ? 'var(--accent-soft)' : 'var(--bg-card)',
        border: isActive ? '1px solid var(--accent-border)' : hovered ? '1px solid var(--accent-border)' : '1px solid var(--border)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease', flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={isActive || hovered ? 'var(--accent)' : 'var(--text-secondary)'}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.3s ease' }}>
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
  )
}

function CartIcon({ count }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [hovered, setHovered] = useState(false)
  const isActive = location.pathname === '/cart'
  return (
    <button
      onClick={() => navigate('/cart')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Cart"
      style={{
        position: 'relative', width: '38px', height: '38px', borderRadius: 'var(--radius-sm)',
        background: isActive ? 'var(--accent-soft)' : hovered ? 'var(--accent-soft)' : 'var(--bg-card)',
        border: isActive ? '1px solid var(--accent-border)' : hovered ? '1px solid var(--accent-border)' : '1px solid var(--border)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease', flexShrink: 0,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke={isActive || hovered ? 'var(--accent)' : 'var(--text-secondary)'}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.3s ease' }}>
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <div style={{
          position: 'absolute', top: '-5px', right: '-5px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: '800', color: 'white',
          boxShadow: 'var(--shadow-accent)', border: '1.5px solid var(--bg-base)',
        }}>{count > 9 ? '9+' : count}</div>
      )}
    </button>
  )
}

// ─── Notification Row (Sales tab) ──────────────────────────────
function SaleNotifRow({ notif, onDelete, onClick }) {
  const [hovered, setHovered] = useState(false)
  const [delHovered, setDelHovered] = useState(false)
  const isUnseen = !notif.seen

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

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
        background: hovered ? 'var(--accent-soft)' : isUnseen ? 'var(--bg-card)' : 'transparent',
        transition: 'background 0.2s ease',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        position: 'relative', cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {isUnseen && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: '3px', height: '60%', borderRadius: '0 2px 2px 0',
          background: 'linear-gradient(180deg, var(--accent), var(--accent-alt))',
        }} />
      )}
      <div style={{
        width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: isUnseen ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'var(--bg-card-hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isUnseen ? 'var(--shadow-accent)' : 'none',
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke={isUnseen ? 'white' : 'var(--text-muted)'}
          strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem', fontWeight: isUnseen ? '700' : '500',
          color: isUnseen ? 'var(--text-primary)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: '0.18rem',
        }}>
          {notif.itemTitle || 'Item sold'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: '800',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>₹{notif.price}</span>
          <span style={{ color: 'var(--border-hover)', fontSize: '0.6rem' }}>·</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Bought by {notif.buyerName || 'Buyer'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: '500' }}>
          {timeAgo(notif.createdAt)}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(notif.id) }}
          onMouseEnter={() => setDelHovered(true)}
          onMouseLeave={() => setDelHovered(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px',
            color: delHovered ? '#ff6b6b' : 'var(--text-muted)',
            fontSize: '0.85rem', lineHeight: 1, transition: 'color 0.15s',
          }}
          title="Remove"
        >×</button>
      </div>
    </div>
  )
}

// ─── Message Notif Row ─────────────────────────────────────────
function MsgNotifRow({ msg, onClick }) {
  const [hovered, setHovered] = useState(false)

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

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
        background: hovered ? 'rgba(116,185,255,0.06)' : 'var(--bg-card)',
        transition: 'background 0.2s ease',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        position: 'relative', cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
        width: '3px', height: '60%', borderRadius: '0 2px 2px 0',
        background: 'linear-gradient(180deg, #74b9ff, #a29bfe)',
      }} />
      <div style={{
        width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(116,185,255,0.25), rgba(162,155,254,0.15))',
        border: '1px solid rgba(116,185,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.72rem', fontWeight: '800', color: '#74b9ff',
      }}>
        {(msg.senderName || 'U').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)',
          marginBottom: '0.18rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {msg.senderName || 'Someone'}
        </div>
        <div style={{
          fontSize: '0.71rem', color: 'var(--text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.12rem',
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize: '0.67rem', color: '#74b9ff', fontWeight: '600', opacity: 0.7 }}>
          item: {msg.itemTitle || 'Item'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: '500' }}>
          {timeAgo(msg.createdAt)}
        </span>
        <span style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.2s', color: '#74b9ff', fontSize: '0.7rem' }}>→</span>
      </div>
    </div>
  )
}

// ─── Bell Icon + Dropdown ──────────────────────────────────────
function BellIcon({ isLoggedIn, registerOpenBell }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('sales')
  const [saleNotifs, setSaleNotifs] = useState([])
  const [msgNotifs, setMsgNotifs] = useState([])
  const [loadingSales, setLoadingSales] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [unreadSales, setUnreadSales] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (registerOpenBell) {
      registerOpenBell(() => {
        setOpen(true)
        setActiveTab('sales')
        fetchSaleNotifs()
        fetchMsgNotifs()
      })
    }
  }, [registerOpenBell])

  useEffect(() => {
    if (!isLoggedIn) return
    fetchUnreadCounts()
    const interval = setInterval(fetchUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [isLoggedIn])

  useEffect(() => {
    function handleOutside(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  async function fetchUnreadCounts() {
    try {
      const [saleRes, msgRes] = await Promise.all([
        API.get('/notifications'),
        API.get('/messages/unread-count'),
      ])
      setUnreadSales(saleRes.data.length)
      setUnreadMsgs(msgRes.data.count || 0)
    } catch {
      try {
        const saleRes = await API.get('/notifications')
        setUnreadSales(saleRes.data.length)
      } catch {}
    }
  }

  async function fetchSaleNotifs() {
    setLoadingSales(true)
    try {
      const res = await API.get('/notifications/all')
      setSaleNotifs(res.data || [])
    } catch { setSaleNotifs([]) }
    setLoadingSales(false)
  }

  async function fetchMsgNotifs() {
    setLoadingMsgs(true)
    try {
      const res = await API.get('/messages/unread')
      const msgs = res.data || []
      setMsgNotifs(msgs)
      setUnreadMsgs(msgs.length)
    } catch {
      setMsgNotifs([])
      setUnreadMsgs(0)
    }
    setLoadingMsgs(false)
  }

  async function handleOpen() {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      fetchSaleNotifs()
      fetchMsgNotifs()
      if (activeTab === 'messages') setUnreadMsgs(0)
    }
  }

  async function handleMarkAllSeen() {
    try {
      await API.post('/notifications/mark-seen')
      setUnreadSales(0)
      setSaleNotifs(prev => prev.map(n => ({ ...n, seen: true })))
    } catch {}
  }

  async function handleDeleteOne(id) {
    try {
      await API.delete(`/notifications/${id}`)
      setSaleNotifs(prev => prev.filter(n => n.id !== id))
      const remaining = saleNotifs.filter(n => n.id !== id && !n.seen)
      setUnreadSales(remaining.length)
    } catch {}
  }

  async function handleClearAll() {
    try {
      await API.delete('/notifications/clear')
      setSaleNotifs([])
      setUnreadSales(0)
    } catch {}
  }

  function handleSaleClick(notif) {
    setOpen(false)
    navigate(`/dashboard?tab=sold&item=${notif.itemId}`)
    if (unreadSales > 0) {
      API.post('/notifications/mark-seen').catch(() => {})
      setUnreadSales(0)
    }
  }

  function handleMsgClick(msg) {
    setOpen(false)
    navigate('/messages', {
      state: {
        item: {
          id: msg.itemId, title: msg.itemTitle,
          seller: { id: msg.senderId, name: msg.senderName },
        }
      }
    })
  }

  function handleTabClick(tabKey) {
    setActiveTab(tabKey)
    if (tabKey === 'messages' && unreadMsgs > 0) {
      setUnreadMsgs(0)
      API.post('/messages/mark-read').catch(() => {})
    }
  }

  if (!isLoggedIn) return null

  const totalUnread = unreadSales + unreadMsgs
  const hasUnread = totalUnread > 0

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Notifications"
        style={{
          position: 'relative', width: '38px', height: '38px', borderRadius: 'var(--radius-sm)',
          background: open ? 'var(--accent-soft)' : hovered ? 'var(--accent-soft)' : 'var(--bg-card)',
          border: open ? '1px solid var(--accent-border)' : hovered ? '1px solid var(--accent-border)' : '1px solid var(--border)',
          boxShadow: open ? 'var(--shadow-accent)' : 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={open || hovered ? 'var(--accent)' : 'var(--text-secondary)'}
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'stroke 0.3s ease' }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasUnread && (
          <div style={{
            position: 'absolute', top: '-5px', right: '-5px',
            minWidth: '18px', height: '18px', borderRadius: '9px', padding: '0 4px',
            background: 'linear-gradient(135deg, #ff4444, #ff6b6b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.58rem', fontWeight: '800', color: 'white',
            boxShadow: '0 2px 8px rgba(255,68,68,0.5)',
            border: '1.5px solid var(--bg-base)',
            animation: 'bellBadgePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}>
            {totalUnread > 9 ? '9+' : totalUnread}
          </div>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            width: '340px',
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
            animation: 'dropdownSlide 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            zIndex: 200,
          }}
        >
          {/* Header */}
          <div style={{ padding: '0.85rem 1rem 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                Notifications
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {activeTab === 'sales' && unreadSales > 0 && (
                  <button onClick={handleMarkAllSeen}
                    style={{ fontSize: '0.65rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 6px', borderRadius: '6px', opacity: 0.7, transition: 'opacity 0.2s', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                  >Mark seen</button>
                )}
                {activeTab === 'sales' && saleNotifs.length > 0 && (
                  <button onClick={handleClearAll}
                    style={{ fontSize: '0.65rem', color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 6px', borderRadius: '6px', opacity: 0.7, transition: 'opacity 0.2s', fontFamily: 'var(--font-body)' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                  >Clear all</button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex' }}>
              {[
                { key: 'sales', label: 'Sales', count: unreadSales },
                { key: 'messages', label: 'Messages', count: unreadMsgs },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  style={{
                    flex: 1, padding: '0.5rem 0.5rem 0.6rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.72rem', fontWeight: activeTab === tab.key ? '700' : '500',
                    color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                    borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    letterSpacing: '0.5px', fontFamily: 'var(--font-body)',
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{
                      fontSize: '0.55rem', fontWeight: '800', padding: '1px 5px',
                      borderRadius: '10px', minWidth: '16px', textAlign: 'center',
                      background: activeTab === tab.key ? 'var(--accent-soft)' : 'var(--bg-card-hover)',
                      color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                      border: activeTab === tab.key ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                    }}>
                      {tab.count > 9 ? '9+' : tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }} className="notif-scroll">
            {activeTab === 'sales' && (
              <>
                {loadingSales ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--accent-soft)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                  </div>
                ) : saleNotifs.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem', opacity: 0.3 }}>🛒</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No sale notifications yet</div>
                  </div>
                ) : (
                  saleNotifs.map((notif, i) => (
                    <SaleNotifRow key={notif.id || i} notif={notif} onDelete={handleDeleteOne} onClick={() => handleSaleClick(notif)} />
                  ))
                )}
              </>
            )}
            {activeTab === 'messages' && (
              <>
                {loadingMsgs ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(116,185,255,0.3)', borderTopColor: '#74b9ff', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                  </div>
                ) : msgNotifs.length === 0 ? (
                  <div style={{ padding: '1.5rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '2px' }}>All caught up</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>No unread messages</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  msgNotifs.map((msg, i) => (
                    <MsgNotifRow key={msg.id || i} msg={msg} onClick={() => handleMsgClick(msg)} />
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <button
              onClick={() => {
                setOpen(false)
                if (activeTab === 'sales') navigate('/dashboard?tab=sold')
                else navigate('/messages')
              }}
              style={{ fontSize: '0.68rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', transition: 'opacity 0.2s', opacity: 0.7, fontFamily: 'var(--font-body)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              {activeTab === 'sales' ? 'View all sales →' : 'Open messages →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Navbar ───────────────────────────────────────────────
function Navbar({ registerOpenBell }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [logoHovered, setLogoHovered] = useState(false)
  const [logoutHovered, setLogoutHovered] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isLoggedIn = !!token
  const isHomePath = location.pathname === '/' || location.pathname === '/home'

  useEffect(() => {
    if (!isLoggedIn) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
      setCartCount(guestCart.length)
      return
    }
    const fetchCartCount = async () => {
      try {
        const res = await API.get('/cart')
        setCartCount(res.data.length)
      } catch { setCartCount(0) }
    }
    fetchCartCount()
    const handleCartUpdate = (e) => {
      if (typeof e.detail?.count === 'number') setCartCount(e.detail.count)
      else fetchCartCount()
    }
    window.addEventListener('cart-updated', handleCartUpdate)
    return () => window.removeEventListener('cart-updated', handleCartUpdate)
  }, [isLoggedIn, location.pathname])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('pendingNotifications')
    setCartCount(0)
    navigate('/')
  }

  return (
    <>
      <style>{`
        @keyframes bellBadgePop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 950px) { .greeting-center { display: none !important; } }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .nav-inner { padding: 0.6rem 1.5rem !important; }
        }
        .notif-scroll::-webkit-scrollbar { width: 4px; }
        .notif-scroll::-webkit-scrollbar-track { background: transparent; }
        .notif-scroll::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 2px; }
      `}</style>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-inner" style={{
          display: 'flex', alignItems: 'center', position: 'relative',
          padding: '0.6rem 2.5rem',
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-nav)',
        }}>

          {/* LEFT: Logo + icon buttons */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link to="/"
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'transform 0.3s ease', transform: logoHovered ? 'scale(1.03)' : 'scale(1)', flexShrink: 0 }}>
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: logoHovered ? 'var(--shadow-accent)' : 'var(--shadow-card)', transition: 'box-shadow 0.3s ease', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Student</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.5px', textTransform: 'uppercase', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontFamily: 'var(--font-body)' }}>Shop</span>
                </div>
                <div style={{ fontSize: '0.45rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '-1px', fontFamily: 'var(--font-body)' }}>Campus Buy & Sell</div>
              </div>
            </Link>

            {/* Divider */}
            <div style={{ width: '1px', height: '24px', background: 'var(--border)', marginLeft: '0.25rem', marginRight: '0.15rem', flexShrink: 0 }} />

            {/* Icon buttons */}
            <CartIcon count={cartCount} />
            {isLoggedIn && <HistoryIcon />}
            {isLoggedIn && <SettingsIcon />}
            <BellIcon isLoggedIn={isLoggedIn} registerOpenBell={registerOpenBell} />
          </div>

          {/* CENTER: Greeting */}
          {isLoggedIn && (
            <div className="greeting-center" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.5px', pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
              Hi, {user?.name?.split(' ')[0] || user?.username || 'there'}
            </div>
          )}

          {/* RIGHT: Nav links */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <NavLink to="/" label="Home" isActive={isHomePath} />
            <NavLink to="/post" label="Post Item" isActive={location.pathname === '/post'} />
            <NavLink to="/dashboard" label="Dashboard" isActive={location.pathname === '/dashboard'} />
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                style={{ fontSize: '0.78rem', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '500', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.3s ease', border: 'none', whiteSpace: 'nowrap', outline: 'none', fontFamily: 'var(--font-body)', color: logoutHovered ? '#ff6b6b' : 'rgba(255,107,107,0.5)', background: logoutHovered ? 'rgba(255,107,107,0.12)' : 'transparent' }}
              >Logout</button>
            ) : (
              <>
                <NavLink to="/login" label="Login" isActive={location.pathname === '/login'} />
                <NavLink to="/register" label="Register" isActive={location.pathname === '/register'} />
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar