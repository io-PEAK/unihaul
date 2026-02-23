import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

function NavLink({ to, label, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textDecoration: 'none',
        fontSize: '0.78rem',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        fontWeight: isActive ? '700' : '500',
        transition: 'all 0.3s ease',
        padding: '0.45rem 0.9rem',
        borderRadius: '8px',
        color: isActive
          ? '#e87722'
          : hovered
            ? 'white'
            : 'rgba(255,255,255,0.5)',
        background: isActive
          ? 'rgba(232,119,34,0.1)'
          : hovered
            ? 'rgba(255,255,255,0.08)'
            : 'transparent',
        position: 'relative',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {isActive && (
        <div style={{
          position: 'absolute',
          bottom: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: '#e87722',
          boxShadow: '0 0 8px rgba(232,119,34,0.6)',
        }} />
      )}
    </Link>
  )
}

function Dropdown({ label, items, location }) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)

  const isChildActive = items.some(item => location.pathname === item.path)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: isChildActive
            ? 'rgba(232,119,34,0.1)'
            : hovered || open
              ? 'rgba(255,255,255,0.08)'
              : 'transparent',
          border: 'none',
          color: isChildActive
            ? '#e87722'
            : hovered || open
              ? 'white'
              : 'rgba(255,255,255,0.5)',
          fontSize: '0.78rem',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          fontWeight: isChildActive ? '700' : '500',
          padding: '0.45rem 0.9rem',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          whiteSpace: 'nowrap',
          outline: 'none',
          position: 'relative',
        }}
      >
        {label}
        <svg
          width="10" height="10" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"
          style={{
            transition: 'transform 0.3s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {isChildActive && (
          <div style={{
            position: 'absolute',
            bottom: '0px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#e87722',
            boxShadow: '0 0 8px rgba(232,119,34,0.6)',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          right: 0,
          minWidth: '180px',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '0.4rem',
          boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
          zIndex: 200,
        }}>
          {items.map(item => (
            <DropdownItem
              key={item.path}
              to={item.path}
              label={item.label}
              isActive={location.pathname === item.path}
              onClick={() => setOpen(false)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DropdownItem({ to, label, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        padding: '0.55rem 0.85rem',
        borderRadius: '8px',
        fontSize: '0.8rem',
        fontWeight: isActive ? '700' : '500',
        letterSpacing: '0.5px',
        color: isActive
          ? '#e87722'
          : hovered
            ? 'white'
            : 'rgba(255,255,255,0.5)',
        background: isActive
          ? 'rgba(232,119,34,0.1)'
          : hovered
            ? 'rgba(255,255,255,0.08)'
            : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </Link>
  )
}

function MobileLink({ to, label, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        padding: '0.7rem 0.75rem',
        borderRadius: '10px',
        fontSize: '0.85rem',
        fontWeight: isActive ? '700' : '500',
        color: isActive
          ? '#e87722'
          : hovered
            ? 'white'
            : 'rgba(255,255,255,0.5)',
        background: isActive
          ? 'rgba(232,119,34,0.1)'
          : hovered
            ? 'rgba(255,255,255,0.06)'
            : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </Link>
  )
}

function Navbar() {
  const location = useLocation()
  const [logoHovered, setLogoHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hamburgerHovered, setHamburgerHovered] = useState(false)

  // Helper to check if Home is active
  const isHomePath = location.pathname === '/' || location.pathname === '/home'

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) setMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const sellerLinks = [
    { path: '/post', label: 'Post Item' },
    { path: '/dashboard', label: 'Dashboard' },
  ]

  return (
    <>
      <style>{`
        .nav-desktop { display: flex !important; }
        .nav-hamburger { display: none !important; }
        .nav-mobile-backdrop { display: none !important; }
        .nav-mobile-panel { display: none !important; }
        .nav-inner { padding: 0.6rem 4rem !important; }

        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-mobile-backdrop { display: block !important; }
          .nav-mobile-panel { display: flex !important; }
          .nav-inner { padding: 0.6rem 1.5rem !important; }
        }
      `}</style>

      <nav style={{ position: 'sticky', top: 0, zIndex: 100 }}>

        <div
          className="nav-inner"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          {/* Logo */}
          <Link
            to="/"
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'transform 0.3s ease',
              transform: logoHovered ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e87722, #ff6b35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: logoHovered
                ? '0 8px 25px rgba(232,119,34,0.5)'
                : '0 4px 15px rgba(232,119,34,0.3)',
              transition: 'box-shadow 0.3s ease',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                <span style={{
                  fontSize: '1.3rem', fontWeight: '900', color: 'white',
                  letterSpacing: '-1px', textTransform: 'uppercase',
                }}>Student</span>
                <span style={{
                  fontSize: '1.3rem', fontWeight: '900', letterSpacing: '-1px',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #e87722, #f5a623)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>Shop</span>
              </div>
              <div style={{
                fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)',
                letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: '-1px',
              }}>Campus Buy & Sell</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="nav-desktop" style={{ gap: '0.25rem', alignItems: 'center' }}>
            <NavLink to="/" label="Home" isActive={isHomePath} />
            <Dropdown label="Seller" items={sellerLinks} location={location} />
            <NavLink to="/login" label="Login" isActive={location.pathname === '/login'} />
            <NavLink to="/register" label="Register" isActive={location.pathname === '/register'} />
          </div>

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            onMouseEnter={() => setHamburgerHovered(true)}
            onMouseLeave={() => setHamburgerHovered(false)}
            aria-label="Toggle menu"
            style={{
              flexDirection: 'column',
              gap: '5px',
              background: hamburgerHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.6rem',
              borderRadius: '8px',
              transition: 'background 0.3s ease',
              zIndex: 110,
            }}
          >
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '20px',
                height: '2px',
                borderRadius: '2px',
                background: 'white',
                transition: 'all 0.3s ease',
                transform: menuOpen
                  ? i === 0 ? 'rotate(45deg) translateY(7px)'
                    : i === 2 ? 'rotate(-45deg) translateY(-7px)'
                      : 'scaleX(0)'
                  : 'none',
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>

        {/* Mobile backdrop */}
        <div
          className="nav-mobile-backdrop"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 99,
            opacity: menuOpen ? 1 : 0,
            pointerEvents: menuOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s ease',
          }}
          onClick={() => setMenuOpen(false)}
        />

        {/* Mobile panel */}
        <div
          className="nav-mobile-panel"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '280px',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.3)',
            zIndex: 101,
            flexDirection: 'column',
            transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
          }}
        >
          {/* Panel header */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '0.65rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              fontWeight: '700',
            }}>Menu</span>
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                outline: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Links */}
          <div style={{ padding: '0.75rem' }}>

            <div style={{
              fontSize: '0.55rem', letterSpacing: '2px', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.2)', fontWeight: '700',
              padding: '0.5rem 0.75rem 0.4rem',
            }}>Navigate</div>

            <MobileLink to="/" label="Home" isActive={isHomePath} onClick={() => setMenuOpen(false)} />
            <MobileLink to="/login" label="Login" isActive={location.pathname === '/login'} onClick={() => setMenuOpen(false)} />
            <MobileLink to="/register" label="Register" isActive={location.pathname === '/register'} onClick={() => setMenuOpen(false)} />

            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              margin: '0.75rem 0',
            }} />

            <div style={{
              fontSize: '0.55rem', letterSpacing: '2px', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.2)', fontWeight: '700',
              padding: '0.5rem 0.75rem 0.4rem',
            }}>Seller</div>

            <MobileLink to="/post" label="Post Item" isActive={location.pathname === '/post'} onClick={() => setMenuOpen(false)} />
            <MobileLink to="/dashboard" label="Dashboard" isActive={location.pathname === '/dashboard'} onClick={() => setMenuOpen(false)} />
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar