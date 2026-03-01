import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const THEMES = [
  { id: 'ember',    label: 'Ember',    desc: 'Dark • Orange',   preview: ['#080810', '#e87722'] },
  { id: 'midnight', label: 'Midnight', desc: 'Dark Navy • Blue', preview: ['#070b14', '#4f8ef7'] },
  { id: 'chalk',    label: 'Chalk',    desc: 'Light • Indigo',  preview: ['#f2f0eb', '#4f46e5'] },
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'ember'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggle = () => {
    const ids = THEMES.map(t => t.id)
    const idx = ids.indexOf(theme)
    setTheme(ids[(idx + 1) % ids.length])
  }

  const setThemeById = (id) => {
    if (THEMES.find(t => t.id === id)) setTheme(id)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, setThemeById, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}