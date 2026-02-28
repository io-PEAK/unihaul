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
        transition: 'all 0.3s ease', padding: '0.45rem 0.9rem', borderRadius: '8px',
        color: isActive ? '#e87722' : hovered ? 'white' : 'rgba(255,255,255,0.5)',
        background: isActive ? 'rgba(232,119,34,0.1)' : hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
        position: 'relative', whiteSpace: 'nowrap',
      }}
    >
      {label}
      {isActive && (
        <div style={{
          position: 'absolute', bottom: '0px', left: '50%',
          transform: 'translateX(-50%)', width: '4px', height: '4px',
          borderRadius: '50%', background: '#e87722',
          boxShadow: '0 0 8px rgba(232,119,34,0.6)',
        }} />
      )}
    </Link>
  )
}

function HistoryIcon() {
  const navigate = useNavigate()
  const location = useLocation()
  const [hovered, setHovered] = useState(false)
  const isActive = location.pathname === '/transactions'
  return (
    <button
      onClick={() => navigate('/transactions')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Transaction History"
      style={{
        position: 'relative', width: '38px', height: '38px', borderRadius: '10px',
        background: isActive ? 'rgba(232,119,34,0.18)' : hovered ? 'rgba(232,119,34,0.12)' : 'rgba(255,255,255,0.05)',
        border: isActive ? '1px solid rgba(232,119,34,0.5)' : hovered ? '1px solid rgba(232,119,34,0.3)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isActive ? '0 0 12px rgba(232,119,34,0.2)' : 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease', flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={isActive ? '#e87722' : hovered ? '#e87722' : 'rgba(255,255,255,0.55)'}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.3s ease' }}>
        <path d="M12 8v4l3 3" />
        <path d="M3.05 11a9 9 0 1 1 .5 4" />
        <path d="M3 3v5h5" />
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
        position: 'relative', width: '38px', height: '38px', borderRadius: '10px',
        background: isActive ? 'rgba(232,119,34,0.18)' : hovered ? 'rgba(232,119,34,0.12)' : 'rgba(255,255,255,0.05)',
        border: isActive ? '1px solid rgba(232,119,34,0.5)' : hovered ? '1px solid rgba(232,119,34,0.3)' : '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease', flexShrink: 0,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke={isActive ? '#e87722' : hovered ? '#e87722' : 'rgba(255,255,255,0.55)'}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.3s ease' }}>
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <div style={{
          position: 'absolute', top: '-5px', right: '-5px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #e87722, #f09030)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: '800', color: 'white',
          boxShadow: '0 2px 8px rgba(232,119,34,0.5)', border: '1.5px solid rgba(0,0,0,0.3)',
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
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: hovered ? 'rgba(232,119,34,0.06)' : isUnseen ? 'rgba(255,255,255,0.02)' : 'transparent',
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
          background: 'linear-gradient(180deg, #e87722, #f5a623)',
        }} />
      )}
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: isUnseen ? 'linear-gradient(135deg, #e87722, #f5a623)' : 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isUnseen ? '0 3px 10px rgba(232,119,34,0.3)' : 'none',
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke={isUnseen ? 'white' : 'rgba(255,255,255,0.4)'}
          strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem', fontWeight: isUnseen ? '700' : '500',
          color: isUnseen ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: '0.18rem',
        }}>
          {notif.itemTitle || 'Item sold'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: '800',
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>₹{notif.price}</span>
          <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.6rem' }}>·</span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>
            Bought by {notif.buyerName || 'Buyer'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', fontWeight: '500' }}>
          {timeAgo(notif.createdAt)}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(notif.id) }}
          onMouseEnter={() => setDelHovered(true)}
          onMouseLeave={() => setDelHovered(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px',
            color: delHovered ? 'rgba(255,107,107,0.8)' : 'rgba(255,255,255,0.15)',
            fontSize: '0.85rem', lineHeight: 1, transition: 'color 0.15s',
          }}
          title="Remove"
        >×</button>
      </div>
    </div>
  )
}

// ─── Message Notif Row (Messages tab) ─────────────────────────
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
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: hovered ? 'rgba(116,185,255,0.06)' : 'rgba(255,255,255,0.02)',
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
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(116,185,255,0.25), rgba(162,155,254,0.15))',
        border: '1px solid rgba(116,185,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.72rem', fontWeight: '800', color: '#74b9ff',
      }}>
        {(msg.senderName || 'U').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem', fontWeight: '700',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '0.18rem',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {msg.senderName || 'Someone'}
        </div>
        <div style={{
          fontSize: '0.71rem', color: 'rgba(255,255,255,0.35)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: '0.12rem',
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize: '0.67rem', color: 'rgba(116,185,255,0.5)', fontWeight: '600' }}>
          item: {msg.itemTitle || 'Item'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)', fontWeight: '500' }}>
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

  // ── FIX 1: sync unreadMsgs from the actual fetched data ──────
  async function fetchMsgNotifs() {
    setLoadingMsgs(true)
    try {
      const res = await API.get('/messages/unread')
      const msgs = res.data || []
      setMsgNotifs(msgs)
      setUnreadMsgs(msgs.length)   // badge now matches real data immediately
    } catch {
      setMsgNotifs([])
      setUnreadMsgs(0)
    }
    setLoadingMsgs(false)
  }

  // ── FIX 2: clear msg badge instantly when dropdown opens on messages tab ──
  async function handleOpen() {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      fetchSaleNotifs()
      fetchMsgNotifs()
      // If already on messages tab, zero badge right away (no waiting for fetch)
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
          id: msg.itemId,
          title: msg.itemTitle,
          seller: { id: msg.senderId, name: msg.senderName },
        }
      }
    })
  }

  // ── FIX 3: clear msg badge instantly when switching to Messages tab ────────
  function handleTabClick(tabKey) {
    setActiveTab(tabKey)
    if (tabKey === 'messages' && unreadMsgs > 0) {
      setUnreadMsgs(0)
      API.post('/messages/mark-read').catch(() => {}) // optional — remove if endpoint doesn't exist
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
          position: 'relative', width: '38px', height: '38px', borderRadius: '10px',
          background: open ? 'rgba(232,119,34,0.18)' : hovered ? 'rgba(232,119,34,0.12)' : 'rgba(255,255,255,0.05)',
          border: open ? '1px solid rgba(232,119,34,0.5)' : hovered ? '1px solid rgba(232,119,34,0.3)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: open ? '0 0 12px rgba(232,119,34,0.2)' : 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={open || hovered ? '#e87722' : 'rgba(255,255,255,0.55)'}
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
            border: '1.5px solid rgba(14,12,28,0.9)',
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
            background: 'rgba(14, 12, 28, 0.98)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            animation: 'dropdownSlide 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            zIndex: 200,
          }}
        >
          {/* Header */}
          <div style={{ padding: '0.85rem 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>
                Notifications
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {activeTab === 'sales' && unreadSales > 0 && (
                  <button onClick={handleMarkAllSeen}
                    style={{ fontSize: '0.65rem', color: 'rgba(232,119,34,0.7)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 6px', borderRadius: '6px', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#e87722'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,119,34,0.7)'}
                  >Mark seen</button>
                )}
                {activeTab === 'sales' && saleNotifs.length > 0 && (
                  <button onClick={handleClearAll}
                    style={{ fontSize: '0.65rem', color: 'rgba(255,107,107,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 6px', borderRadius: '6px', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,107,107,0.6)'}
                  >Clear all</button>
                )}
              </div>
            </div>

            {/* Tabs — now use handleTabClick instead of setActiveTab directly */}
            <div style={{ display: 'flex', gap: '0' }}>
              {[
                { key: 'sales', label: 'Sales', count: unreadSales },
                { key: 'messages', label: 'Messages', count: unreadMsgs },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}   // ← FIX 3 wired here
                  style={{
                    flex: 1, padding: '0.5rem 0.5rem 0.6rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.72rem', fontWeight: activeTab === tab.key ? '700' : '500',
                    color: activeTab === tab.key ? '#e87722' : 'rgba(255,255,255,0.3)',
                    borderBottom: activeTab === tab.key ? '2px solid #e87722' : '2px solid transparent',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{
                      fontSize: '0.55rem', fontWeight: '800', padding: '1px 5px',
                      borderRadius: '10px', minWidth: '16px', textAlign: 'center',
                      background: activeTab === tab.key ? 'rgba(232,119,34,0.2)' : 'rgba(255,255,255,0.08)',
                      color: activeTab === tab.key ? '#e87722' : 'rgba(255,255,255,0.4)',
                      border: activeTab === tab.key ? '1px solid rgba(232,119,34,0.3)' : '1px solid rgba(255,255,255,0.1)',
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

            {/* SALES TAB */}
            {activeTab === 'sales' && (
              <>
                {loadingSales ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(232,119,34,0.3)', borderTopColor: '#e87722', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                  </div>
                ) : saleNotifs.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem', opacity: 0.3 }}>🛒</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>No sale notifications yet</div>
                  </div>
                ) : (
                  saleNotifs.map((notif, i) => (
                    <SaleNotifRow
                      key={notif.id || i}
                      notif={notif}
                      onDelete={handleDeleteOne}
                      onClick={() => handleSaleClick(notif)}
                    />
                  ))
                )}
              </>
            )}

            {/* MESSAGES TAB */}
            {activeTab === 'messages' && (
              <>
                {loadingMsgs ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(116,185,255,0.3)', borderTopColor: '#74b9ff', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                  </div>
                ) : msgNotifs.length === 0 ? (
                  <div style={{ padding: '1.5rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(116,185,255,0.08)', border: '1px solid rgba(116,185,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(116,185,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>All caught up</div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)' }}>No unread messages</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  msgNotifs.map((msg, i) => (
                    <MsgNotifRow
                      key={msg.id || i}
                      msg={msg}
                      onClick={() => handleMsgClick(msg)}
                    />
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <button
              onClick={() => {
                setOpen(false)
                if (activeTab === 'sales') navigate('/dashboard?tab=sold')
                else navigate('/messages')
              }}
              style={{ fontSize: '0.68rem', color: 'rgba(232,119,34,0.6)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#e87722'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(232,119,34,0.6)'}
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

    // Listen for instant cart updates fired from anywhere (e.g. Messages page)
    const handleCartUpdate = (e) => {
      if (typeof e.detail?.count === 'number') {
        setCartCount(e.detail.count)
      } else {
        fetchCartCount()
      }
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
        .nav-desktop { display: flex !important; }
        .nav-hamburger { display: none !important; }
        .nav-inner { padding: 0.6rem 4rem !important; }
        .greeting-center { z-index: 0; }
        @media (max-width: 950px) { .greeting-center { display: none !important; } }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-inner { padding: 0.6rem 1.5rem !important; }
        }
        .notif-scroll::-webkit-scrollbar { width: 4px; }
        .notif-scroll::-webkit-scrollbar-track { background: transparent; }
        .notif-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-inner" style={{
          display: 'flex', alignItems: 'center', position: 'relative',
          padding: '0.6rem 2.5rem 0.6rem 4rem',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          {/* Logo + icons */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/"
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'transform 0.3s ease', transform: logoHovered ? 'scale(1.03)' : 'scale(1)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #e87722, #ff6b35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: logoHovered ? '0 8px 25px rgba(232,119,34,0.5)' : '0 4px 15px rgba(232,119,34,0.3)', transition: 'box-shadow 0.3s ease', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: '900', color: 'white', letterSpacing: '-1px', textTransform: 'uppercase' }}>Student</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '-1px', textTransform: 'uppercase', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Shop</span>
                </div>
                <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: '-1px' }}>Campus Buy & Sell</div>
              </div>
            </Link>
            <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.08)', marginLeft: '0.5rem' }} />
            <CartIcon count={cartCount} />
            {isLoggedIn && <HistoryIcon />}
            <BellIcon isLoggedIn={isLoggedIn} registerOpenBell={registerOpenBell} />
          </div>

          {/* Center greeting */}
          {isLoggedIn && (
            <div className="greeting-center" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontWeight: '500', letterSpacing: '0.5px', pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}>
              Hi, {user?.name || user?.username || 'there'}
            </div>
          )}

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <NavLink to="/" label="Home" isActive={isHomePath} />
            <NavLink to="/post" label="Post Item" isActive={location.pathname === '/post'} />
            <NavLink to="/dashboard" label="Dashboard" isActive={location.pathname === '/dashboard'} />
            {isLoggedIn ? (
              <button onClick={handleLogout} onMouseEnter={() => setLogoutHovered(true)} onMouseLeave={() => setLogoutHovered(false)}
                style={{ fontSize: '0.78rem', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '500', padding: '0.45rem 0.9rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease', border: 'none', whiteSpace: 'nowrap', outline: 'none', color: logoutHovered ? '#ff6b6b' : 'rgba(255,107,107,0.5)', background: logoutHovered ? 'rgba(255,107,107,0.12)' : 'transparent' }}
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