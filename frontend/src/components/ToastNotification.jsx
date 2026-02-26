import { useEffect, useState } from 'react'

function Toast({ notification, onDone }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Slide in
    const t1 = setTimeout(() => setVisible(true), 50)
    // Start exit after 3s
    const t2 = setTimeout(() => setExiting(true), 3200)
    // Remove after exit animation
    const t3 = setTimeout(() => onDone(), 3700)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30,27,60,0.98) 0%, rgba(20,18,45,0.98) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(232,119,34,0.3)',
      borderRadius: '16px',
      padding: '1rem 1.25rem',
      minWidth: '280px',
      maxWidth: '340px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(232,119,34,0.1)',
      transform: visible && !exiting ? 'translateX(0) scale(1)' : 'translateX(120%) scale(0.95)',
      opacity: visible && !exiting ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '0.6rem',
    }}>
      {/* Top shimmer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(232,119,34,0.4), transparent)',
      }} />

      {/* Orange left bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
        background: 'linear-gradient(180deg, #e87722, #f5a623)',
        borderRadius: '16px 0 0 16px',
      }} />

      <div style={{ paddingLeft: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1rem' }}>🎉</span>
          <span style={{
            fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1.5px',
            textTransform: 'uppercase', color: '#e87722',
          }}>Item Sold!</span>
        </div>

        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: '0.3rem' }}>
          {notification.item?.title}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.85rem', fontWeight: '800',
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>₹{notification.price}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
            Bought by <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{notification.buyerName}</strong>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
        background: 'rgba(255,255,255,0.06)',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #e87722, #f5a623)',
          animation: 'shrink 3.2s linear forwards',
        }} />
      </div>

      <style>{`@keyframes shrink { from { width: 100% } to { width: 0% } }`}</style>
    </div>
  )
}

function ToastNotification({ notifications, onClear }) {
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
      position: 'fixed', bottom: '5rem', right: '2rem',
      zIndex: 9999, display: 'flex', flexDirection: 'column-reverse',
    }}>
      {queue.map(n => (
        <Toast key={n.id} notification={n} onDone={() => handleDone(n.id)} />
      ))}
    </div>
  )
}

export default ToastNotification