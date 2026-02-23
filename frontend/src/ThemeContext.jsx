import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('theme') || 'default'
  })

  useEffect(() => {
    localStorage.setItem('theme', mode)
    if (mode === 'black') {
      document.documentElement.setAttribute('data-theme', 'black')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [mode])

  const toggle = () => setMode(prev => (prev === 'default' ? 'black' : 'default'))

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}