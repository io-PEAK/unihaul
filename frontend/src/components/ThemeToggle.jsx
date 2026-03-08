import { useState, useEffect } from 'react'
import { useTheme, THEMES } from '../ThemeContext'
import { useDraggable } from './useDraggable'

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const [hovered, setHovered] = useState(false)
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

  const current = THEMES.find(t => t.id === theme) || THEMES[0]
  const next    = THEMES[(THEMES.findIndex(t => t.id === theme) + 1) % THEMES.length]

  const { nodeRef, pos, dragHandlers } = useDraggable(
    'drag_themetoggle',
    { bottom: '2rem', left: '2rem', top: 'auto', right: 'auto' },
    draggable
  )
  const { onMouseDown, onTouchStart } = dragHandlers

  return (
    <>
      <style>{`
        @media (max-width: 1250px) { .theme-toggle-btn { display: none !important; } }
      `}</style>
      <button
        ref={nodeRef}
        className="theme-toggle-btn"
        onClick={toggle}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Switch to ${next.label} theme`}
        title={draggable ? `Drag to move · ${current.label}` : `${current.label} → ${next.label}`}
        style={{
          position: 'fixed',
          ...pos,
          width: '48px', height: '48px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          cursor: draggable ? 'grab' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'box-shadow 0.3s ease, background 0.3s ease, border 0.3s ease',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          boxShadow: hovered
            ? '0 0 0 1px rgba(var(--accent-rgb),0.4), 0 0 20px 6px rgba(var(--accent-rgb),0.25), 0 8px 24px rgba(0,0,0,0.4)'
            : 'var(--shadow-card)',
          zIndex: 1000,
          padding: 0, outline: 'none',
          color: 'var(--text-primary)',
          userSelect: 'none',
        }}
      >
        {theme === 'ember' && (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
        {theme === 'midnight' && (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        )}
        {theme === 'chalk' && (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        )}
      </button>
    </>
  )
}

export default ThemeToggle