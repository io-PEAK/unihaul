import { useState } from 'react'
import { useTheme, THEMES } from '../ThemeContext'

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const [hovered, setHovered] = useState(false)

  const current = THEMES.find(t => t.id === theme) || THEMES[0]
  const next    = THEMES[(THEMES.findIndex(t => t.id === theme) + 1) % THEMES.length]

  return (
    <>
      <style>{`
        @media (max-width: 900px) { .theme-toggle-btn { display: none !important; } }
      `}</style>
      <button
        className="theme-toggle-btn"
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Switch to ${next.label} theme`}
        title={`Current: ${current.label} → Next: ${next.label}`}
        style={{
          position: 'fixed',
          bottom: '2rem', left: '2rem',
          width: '48px', height: '48px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
          transform: hovered ? 'scale(1.1) rotate(20deg)' : 'scale(1) rotate(0deg)',
          boxShadow: hovered ? '0 0 0 1px rgba(var(--accent-rgb),0.4), 0 0 20px 6px rgba(var(--accent-rgb),0.25), 0 8px 24px rgba(0,0,0,0.4)' : 'var(--shadow-card)',
          zIndex: 1000,
          padding: 0, outline: 'none',
          color: 'var(--text-primary)',
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