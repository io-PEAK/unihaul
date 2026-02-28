import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import API from '../api/axios'

function NavLink({ to, label, isActive, onClick, showDot, onDotClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textDecoration: 'none', fontSize: '0.78rem', letterSpacing: '1.5px',
        textTransform: 'uppercase', fontWeight: isActive ? '700' : '500',
        transition: 'all 0.3s ease', padding: '0.45rem 0.9rem', borderRadius: '8px',
        color: isActive ? '#e87722' : hovered ? 'white' : 'rgba(255,255,255,0.5)',
        background: isActive ? 'rgba(232,119,34,0.1)' : hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
        position: 'relative', whiteSpace: 'nowrap',
      }}
    >
      {label}
      {isActive && (
        <div style={{
          position: 'absolute', bottom: '0px', left: '50%',
          transform: 'translateX(-50%)', width: '4px', height: '4px',
          borderRadius: '50%', background: '#e87722',
          boxShadow: '0 0 8px rgba(232,119,34,0.6)',
        }} />
      )}
      {showDot && (
        <div
          onClick={e => { e.preventDefault(); e.stopPropagation(); onDotClick && onDotClick() }}
          title="New sale — click to view"
          style={{
            position: 'absolute', top: '2px', right: '2px',
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#ff4444',
            boxShadow: '0 0 6px rgba(255,68,68,0.8)',
            border: '1.5px solid rgba(20,18,40,0.9)',
            cursor: 'pointer',
          }}
        />
      )}
    </Link>
  )
}

function HistoryIcon() {
  const navigate = useNavigate()
  const location = useLocation()
  const [hovered, setHovered] = useState(false)
  const isActive = location.pathname === '/transactions'
  return (
    <button
      onClick={() => navigate('/transactions')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Transaction History"
      style={{
        position: 'relative', width: '38px', height: '38px', borderRadius: '10px',
        background: isActive ? 'rgba(232,119,34,0.18)' : hovered ? 'rgba(232,119,34,0.12)' : 'rgba(255,255,255,0.05)',
        border: isActive ? '1px solid rgba(232,119,34,0.5)' : hovered ? '1px solid rgba(232,119,34,0.3)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isActive ? '0 0 12px rgba(232,119,34,0.2)' : 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease', flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={isActive ? '#e87722' : hovered ? '#e87722' : 'rgba(255,255,255,0.55)'}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.3s ease' }}>
        <path d="M12 8v4l3 3" />
        <path d="M3.05 11a9 9 0 1 1 .5 4" />
        <path d="M3 3v5h5" />
      </svg>
    </button>
  )
}

function CartIcon({ count }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [hovered, setHovered] = useState(false)
  const isActive = location.pathname === '/cart'
  return (
    <button
      onClick={() => navigate('/cart')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Cart"
      style={{
        position: 'relative', width: '38px', height: '38px', borderRadius: '10px',
        background: isActive ? 'rgba(232,119,34,0.18)' : hovered ? 'rgba(232,119,34,0.12)' : 'rgba(255,255,255,0.05)',
        border: isActive ? '1px solid rgba(232,119,34,0.5)' : hovered ? '1px solid rgba(232,119,34,0.3)' : '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s ease', flexShrink: 0,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke={isActive ? '#e87722' : hovered ? '#e87722' : 'rgba(255,255,255,0.55)'}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.3s ease' }}>
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <div style={{
          position: 'absolute', top: '-5px', right: '-5px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #e87722, #f09030)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: '800', color: 'white',
          boxShadow: '0 2px 8px rgba(232,119,34,0.5)', border: '1.5px solid rgba(0,0,0,0.3)',
        }}>{count > 9 ? '9+' : count}</div>
      )}
    </button>
  )
}

function Navbar({ hasUnseenNotifications }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [logoHovered, setLogoHovered] = useState(false)
  const [logoutHovered, setLogoutHovered] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isLoggedIn = !!token
  const isHomePath = location.pathname === '/' || location.pathname === '/home'

  useEffect(() => {
    if (!isLoggedIn) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
      setCartCount(guestCart.length)
      return
    }
    const fetchCartCount = async () => {
      try {
        const res = await API.get('/cart')
        setCartCount(res.data.length)
      } catch { setCartCount(0) }
    }
    fetchCartCount()
  }, [isLoggedIn, location.pathname])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('pendingNotifications')
    setCartCount(0)
    navigate('/')
  }

  // When user clicks the red dot on Dashboard link → go straight to sold tab
  function handleDotClick() {
    navigate('/dashboard?tab=sold')
  }

  return (
    <>
      <style>{`
        .nav-desktop { display: flex !important; }
        .nav-hamburger { display: none !important; }
        .nav-inner { padding: 0.6rem 4rem !important; }
        .greeting-center { z-index: 0; }
        @media (max-width: 950px) { .greeting-center { display: none !important; } }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-inner { padding: 0.6rem 1.5rem !important; }
        }
      `}</style>
      <nav style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="nav-inner" style={{
          display: 'flex', alignItems: 'center', position: 'relative',
          padding: '0.6rem 2.5rem 0.6rem 4rem',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          {/* Logo */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/"
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              style={{
                textDecoration: 'none', display: 'flex', alignItems: 'center',
                gap: '0.75rem', transition: 'transform 0.3s ease',
                transform: logoHovered ? 'scale(1.03)' : 'scale(1)',
              }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #e87722, #ff6b35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: logoHovered ? '0 8px 25px rgba(232,119,34,0.5)' : '0 4px 15px rgba(232,119,34,0.3)',
                transition: 'box-shadow 0.3s ease', flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: '900', color: 'white', letterSpacing: '-1px', textTransform: 'uppercase' }}>Student</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '-1px', textTransform: 'uppercase', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Shop</span>
                </div>
                <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: '-1px' }}>Campus Buy & Sell</div>
              </div>
            </Link>
            <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.08)', marginLeft: '0.5rem' }} />
            <CartIcon count={cartCount} />
            <HistoryIcon />
          </div>

          {isLoggedIn && (
            <div className="greeting-center" style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)',
              fontWeight: '500', letterSpacing: '0.5px',
              pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap',
            }}>
              Hi, {user?.name || user?.username || 'there'}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <NavLink to="/" label="Home" isActive={isHomePath} />
            <NavLink to="/post" label="Post Item" isActive={location.pathname === '/post'} />
            <NavLink
              to="/dashboard"
              label="Dashboard"
              isActive={location.pathname === '/dashboard'}
              showDot={hasUnseenNotifications}
              onDotClick={handleDotClick}
            />
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                style={{
                  fontSize: '0.78rem', letterSpacing: '1.5px', textTransform: 'uppercase',
                  fontWeight: '500', padding: '0.45rem 0.9rem', borderRadius: '8px',
                  cursor: 'pointer', transition: 'all 0.3s ease', border: 'none',
                  whiteSpace: 'nowrap', outline: 'none',
                  color: logoutHovered ? '#ff6b6b' : 'rgba(255,107,107,0.5)',
                  background: logoutHovered ? 'rgba(255,107,107,0.12)' : 'transparent',
                }}
              >Logout</button>
            ) : (
              <>
                <NavLink to="/login" label="Login" isActive={location.pathname === '/login'} />
                <NavLink to="/register" label="Register" isActive={location.pathname === '/register'} />
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar