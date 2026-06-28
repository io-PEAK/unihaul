import { createContext, useContext, useState, useEffect, useRef } from 'react'

const ThemeContext = createContext()

export const THEMES = [
  { id: 'ember',    label: 'Ember',    desc: 'Dark • Orange',   preview: ['#080810', '#e87722'] },
  { id: 'midnight', label: 'Midnight', desc: 'Dark Navy • Blue', preview: ['#070b14', '#4f8ef7'] },
  { id: 'chalk',    label: 'Chalk',    desc: 'Light • Indigo',  preview: ['#f2f0eb', '#4f46e5'] },
]

const THEME_COLORS = {
  ember:    '#f08030',
  midnight: '#4f8ef7',
  chalk:    '#4f46e5',
}

function updateFavicon(theme) {
  const bg = THEME_COLORS[theme] || THEME_COLORS.ember
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="20" ry="20" fill="${bg}"/>
    <g transform="translate(18, 14) scale(2.8)" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </g>
  </svg>`
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  let link = document.querySelector("link[rel~='icon']")
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
  const old = link.href
  link.href = url
  if (old.startsWith('blob:')) URL.revokeObjectURL(old)
}

// ── Crossfade + micro-zoom (iOS-style) ───────────────────────────────────────
// Old page: fades out + scales up slightly (recedes)
// New page: fades in  + scales down into place (advances)
// 380ms, cubic-bezier(0.4, 0, 0.2, 1)
// Falls back to instant switch on Firefox < 126.
async function playTransition(setTheme, nextId) {
  if (!document.startViewTransition) {
    setTheme(nextId)
    return
  }

  const transition = document.startViewTransition(() => {
    setTheme(nextId)
  })

  await transition.ready

  const DURATION = 380
  const EASING   = 'cubic-bezier(0.4, 0, 0.2, 1)'

  document.documentElement.animate(
    [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(1.012)' },
    ],
    { duration: DURATION, easing: EASING, fill: 'forwards', pseudoElement: '::view-transition-old(root)' }
  )

  document.documentElement.animate(
    [
      { opacity: 0, transform: 'scale(0.988)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
    { duration: DURATION, easing: EASING, fill: 'forwards', pseudoElement: '::view-transition-new(root)' }
  )
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'chalk'
  })

  const themeRef = useRef(theme)
  useEffect(() => { themeRef.current = theme }, [theme])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    updateFavicon(theme)
  }, [theme])

  // Plain toggle with no animation (keyboard fallback etc.)
  const toggle = () => {
    const ids = THEMES.map(t => t.id)
    setTheme(ids[(ids.indexOf(themeRef.current) + 1) % ids.length])
  }

  // Used by Settings page, Navbar dropdown — plays animation automatically
  const setThemeById = (id) => {
    if (!THEMES.find(t => t.id === id)) return
    if (id === themeRef.current) return   // already on this theme, skip
    playTransition(setTheme, id)
  }

  // Used by ThemeToggle button — same animation, kept as separate name
  // so ThemeToggle.jsx doesn't need changing
  const toggleWithRay = (nextId) => {
    if (!THEMES.find(t => t.id === nextId)) return
    if (nextId === themeRef.current) return
    playTransition(setTheme, nextId)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, setThemeById, toggleWithRay, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}