import { useState, useEffect } from 'react'
import { useDraggable } from './useDraggable'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'
import { getSocket } from '../socket'

function MessageButton() {
  const [hovered, setHovered] = useState(false)
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  // Fetch count on route change
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || location.pathname === '/messages') {
      setUnread(0)
      return
    }
    API.get('/messages/unread-count')
      .then(res => setUnread(res.data.count || 0))
      .catch(() => setUnread(0))
  }, [location.pathname])

  // Socket: bump red dot instantly when NOT in /messages
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || location.pathname === '/messages') return
    const me = JSON.parse(localStorage.getItem('user') || 'null')
    let handler = null
    let attachedSocket = null

    const tryAttach = () => {
      const socket = getSocket()
      if (!socket?.connected) return false
      handler = (msg) => {
        if (String(msg.receiverId) === String(me?.id)) setUnread(prev => prev + 1)
      }
      socket.on('new-message', handler)
      attachedSocket = socket
      return true
    }

    if (!tryAttach()) {
      const interval = setInterval(() => { if (tryAttach()) clearInterval(interval) }, 400)
      return () => {
        clearInterval(interval)
        if (attachedSocket && handler) attachedSocket.off('new-message', handler)
      }
    }
    return () => { if (attachedSocket && handler) attachedSocket.off('new-message', handler) }
  }, [location.pathname])

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

  const { nodeRef, pos, dragHandlers } = useDraggable(
    'drag_messagebtn',
    { bottom: 'clamp(1rem,3vw,2rem)', right: 'clamp(1rem,3vw,2rem)', top: 'auto', left: 'auto' },
    draggable
  )
  const { onMouseDown, onTouchStart } = dragHandlers

  const token = localStorage.getItem('token')
  if (!token) return null
  if (location.pathname === '/messages') return null

  return (
    <button
      ref={nodeRef}
      onClick={() => navigate('/messages')}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Messages"
      style={{
        position: 'fixed',
        ...pos,
        width: 'clamp(42px, 5vw, 52px)',
        height: 'clamp(42px, 5vw, 52px)',
        borderRadius: '16px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
        background: hovered
          ? 'linear-gradient(135deg, var(--accent-alt), var(--accent))'
          : 'linear-gradient(135deg, var(--accent), var(--accent-alt))',
        boxShadow: hovered
          ? '0 12px 30px rgba(var(--accent-rgb),0.5)'
          : '0 6px 20px rgba(var(--accent-rgb),0.3)',
        transform: hovered ? 'translateY(-3px) scale(1.05)' : 'translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {unread > 0 && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: '#ff4444',
          boxShadow: '0 0 6px rgba(255,68,68,0.8)',
          border: '2px solid rgba(20,18,40,0.9)',
        }} />
      )}
    </button>
  )
}

export default MessageButton