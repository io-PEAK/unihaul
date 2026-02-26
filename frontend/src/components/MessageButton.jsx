import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'

function MessageButton() {
  const [hovered, setHovered] = useState(false)
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || location.pathname === '/messages') return

    const fetchUnread = async () => {
      try {
        const res = await API.get('/messages/unread-count')
        setUnread(res.data.count || 0)
      } catch {
        setUnread(0)
      }
    }
    fetchUnread()
  }, [location.pathname])

  const token = localStorage.getItem('token')
  if (!token) return null
  if (location.pathname === '/messages') return null

  return (
    <button
      onClick={() => navigate('/messages')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Messages"
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '52px',
        height: '52px',
        borderRadius: '16px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 90,
        background: hovered
          ? 'linear-gradient(135deg, #f09030, #e87722)'
          : 'linear-gradient(135deg, #e87722, #f09030)',
        boxShadow: hovered
          ? '0 12px 30px rgba(232,119,34,0.5)'
          : '0 6px 20px rgba(232,119,34,0.3)',
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