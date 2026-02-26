import { useState } from 'react'
import { useTheme } from './ThemeContext'

function ThemeToggle() {
  const { mode, toggle } = useTheme()
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Toggle theme"
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',                 // <-- moved from right to left
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        transform: hovered ? 'scale(1.1) rotate(20deg)' : 'scale(1) rotate(0deg)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        zIndex: 1000,
        padding: 0,
        outline: 'none',
        color: 'white',
        fontSize: '0.85rem',
        fontWeight: '700',
        letterSpacing: '-0.5px',
      }}
    >
      {mode === 'default' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  )
}

export default ThemeToggle