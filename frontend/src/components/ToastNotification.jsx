import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Toast({ notification, onDone }) {
  const [phase, setPhase] = useState('entering')
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 30)
    const t2 = setTimeout(() => setPhase('exiting'), 4200)
    const t3 = setTimeout(() => onDone(), 4600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  function handleClick() {
    onDone()
    navigate(`/dashboard?tab=sold${notification.itemId ? `&item=${notification.itemId}` : ''}`)
  }

  function handleClose(e) {
    e.stopPropagation()
    setPhase('exiting')
    setTimeout(onDone, 400)
  }

  const isExiting = phase === 'exiting'
  const isVisible = phase === 'visible'

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { transform: translateY(12px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
        @keyframes live-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      <div
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          marginBottom: '0.6rem',
          cursor: 'pointer',
          borderRadius: '14px',
          overflow: 'hidden',
          // Clean white-ish border, no color
          background: 'rgba(22, 20, 35, 0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: hovered
            ? '0 20px 50px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)'
            : '0 10px 35px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
          width: '290px',
          animation: isExiting ? 'none' : 'toast-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          transform: isExiting ? 'translateY(8px) scale(0.95)' : undefined,
          opacity: isExiting ? 0 : undefined,
          transition: isExiting
            ? 'all 0.35s ease-in'
            : 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Content */}
        <div style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

          {/* Icon — small, clean */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(232,119,34,0.35)',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          {/* Text block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Top: label + close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: '700', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Sale</span>
                {/* Live dot */}
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#51cf66', display: 'inline-block', animation: 'live-pulse 1.8s ease-in-out infinite' }} />
              </div>
              <button onClick={handleClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.18)', fontSize: '0.95rem', lineHeight: 1, padding: 0, transition: 'color 0.15s', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.18)'}
              >&times;</button>
            </div>

            {/* Item name */}
            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.3rem' }}>
              {notification.item?.title || notification.itemTitle || 'Item'}
            </div>

            {/* Price + buyer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                ₹{notification.price}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.65rem' }}>·</span>
              {/* Buyer initials + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', minWidth: 0 }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(116,185,255,0.15)', border: '1px solid rgba(116,185,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: '800', color: '#74b9ff', flexShrink: 0 }}>
                  {(notification.buyerName || 'B').charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {notification.buyerName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar — very subtle */}
        <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #e87722, #f5a623)',
            transformOrigin: 'left center',
            animation: 'toast-progress 4.2s linear forwards',
            animationPlayState: hovered ? 'paused' : 'running',
          }} />
        </div>
      </div>
    </>
  )
}

function ToastNotification({ notifications }) {
  const [queue, setQueue] = useState([...notifications])

  useEffect(() => {
    setQueue([...notifications])
  }, [notifications])

  function handleDone(id) {
    setQueue(prev => prev.filter(n => n.id !== id))
  }

  if (queue.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column-reverse',
    }}>
      {queue.map(n => (
        <Toast key={n.id} notification={n} onDone={() => handleDone(n.id)} />
      ))}
    </div>
  )
}

export default ToastNotification