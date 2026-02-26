import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './ThemeContext'
import ThemeToggle from './ThemeToggle'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ItemDetail from './pages/ItemDetail'
import PostItem from './pages/PostItem'
import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import Transactions from './pages/Transactions'
import Cart from './pages/Cart'
import Navbar from './components/Navbar'
import MessageButton from './components/MessageButton'
import ProtectedRoute from './components/ProtectedRoute'
import ToastNotification from './components/ToastNotification'
import { useState, useEffect } from 'react'

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const pageHeight = document.documentElement.scrollHeight - window.innerHeight
      setVisible(pageHeight > 0 && scrolled / pageHeight > 0.20)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes scrollBtnPop {
          0%   { opacity: 0; transform: translateX(-50%) translateY(14px) scale(0.8); }
          60%  { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1.08); }
          80%  { transform: translateX(-50%) translateY(2px) scale(0.97); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Back to top"
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: hovered ? 'translateX(-50%) translateY(-2px)' : 'translateX(-50%)',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          border: hovered ? '1px solid rgba(232,119,34,0.4)' : '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 89,
          background: hovered ? 'rgba(232,119,34,0.12)' : 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: hovered
            ? '0 8px 24px rgba(232,119,34,0.2)'
            : '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'scrollBtnPop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          transition: 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={hovered ? '#e87722' : 'rgba(255,255,255,0.5)'}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'stroke 0.3s ease' }}
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </>
  )
}

function AppInner() {
  const location = useLocation()
  const [notifications, setNotifications] = useState([])
  const [hasUnseen, setHasUnseen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('pendingNotifications')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.length > 0) {
          setNotifications(parsed)
          setHasUnseen(true)
        }
      } catch (_) {}
      localStorage.removeItem('pendingNotifications')
    }
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname === '/dashboard' && hasUnseen) {
      setHasUnseen(false)
    }
  }, [location.pathname])

  return (
    <>
      <Navbar hasUnseenNotifications={hasUnseen} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/post" element={<ProtectedRoute><PostItem /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      </Routes>
      <MessageButton />
      <ScrollToTopButton />
      <ThemeToggle />
      <ToastNotification notifications={notifications} />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App