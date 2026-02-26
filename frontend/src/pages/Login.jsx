import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [focusedField, setFocusedField] = useState(null)
  const [btnHovered, setBtnHovered] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/'

  // Determine a friendly message for why they were redirected
  const fromMessage = from.startsWith('/cart')
    ? 'Sign in to complete your purchase'
    : from !== '/'
    ? 'Sign in to continue'
    : null

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await API.post('/auth/login', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))

      // ✅ Merge guest cart into real cart after login
      try {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
        if (guestCart.length > 0) {
          await Promise.allSettled(
            guestCart.map(item =>
              API.post('/cart', { itemId: item.id }, {
                headers: { Authorization: `Bearer ${res.data.token}` }
              })
            )
          )
          localStorage.removeItem('guestCart')
        }
      } catch (_) {}

      // ✅ Fetch unseen notifications right after login
      try {
        const notifRes = await API.get('/notifications', {
          headers: { Authorization: `Bearer ${res.data.token}` }
        })
        if (notifRes.data.length > 0) {
          localStorage.setItem('pendingNotifications', JSON.stringify(notifRes.data))
        }
      } catch (_) {}

      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { label: 'Email', name: 'email', type: 'email', placeholder: 'your@email.com' },
    { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div style={{
      minHeight: '90vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.75rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        }} />

        <div style={{ marginBottom: '2.25rem' }}>
          <h1 style={{
            fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1.5px',
            lineHeight: '1.05', marginBottom: '0.6rem', color: 'white',
          }}>
            Welcome<br />
            <span style={{
              background: 'linear-gradient(135deg, #e87722, #f5a623)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Back.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: '400' }}>
            Sign in to your Student Shop account
          </p>
          {fromMessage && (
            <div style={{
              marginTop: '0.75rem', padding: '0.5rem 0.85rem',
              background: 'rgba(232,119,34,0.08)', border: '1px solid rgba(232,119,34,0.15)',
              borderRadius: '8px', fontSize: '0.75rem', color: 'rgba(232,119,34,0.7)', fontWeight: '500',
            }}>
              {fromMessage}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {fields.map(field => (
            <div key={field.name} style={{ marginBottom: '1.15rem' }}>
              <label style={{
                display: 'block', fontSize: '0.65rem', letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: focusedField === field.name ? 'rgba(232,119,34,0.7)' : 'rgba(255,255,255,0.35)',
                fontWeight: '700', marginBottom: '0.45rem', transition: 'color 0.3s ease',
              }}>{field.label}</label>
              <input
                name={field.name} type={field.type} value={form[field.name]}
                onChange={handleChange}
                onFocus={() => setFocusedField(field.name)}
                onBlur={() => setFocusedField(null)}
                placeholder={field.placeholder}
                style={{
                  width: '100%', padding: '0.7rem 1rem',
                  background: focusedField === field.name ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  border: focusedField === field.name ? '1px solid rgba(232,119,34,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', color: 'white', fontSize: '0.9rem',
                  outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box',
                }}
              />
            </div>
          ))}

          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            margin: '1.25rem 0',
          }} />

          {error && (
            <div style={{
              marginBottom: '1rem', padding: '0.75rem 1rem',
              background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)',
              borderRadius: '10px', color: '#ff4d4d', fontSize: '0.85rem', textAlign: 'center',
            }}>{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              width: '100%', padding: '0.8rem',
              background: loading ? 'rgba(255,255,255,0.08)'
                : btnHovered ? 'linear-gradient(135deg, #f09030, #e87722)'
                : 'linear-gradient(135deg, #e87722, #f09030)',
              color: loading ? 'rgba(255,255,255,0.3)' : 'white',
              border: 'none', borderRadius: '12px', fontSize: '0.85rem',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '1px', textTransform: 'uppercase',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: btnHovered && !loading ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: btnHovered && !loading ? '0 15px 35px rgba(232,119,34,0.35)' : '0 4px 15px rgba(232,119,34,0.2)',
            }}
          >{loading ? 'Signing in...' : 'Sign In →'}</button>
        </form>

        <p style={{
          textAlign: 'center', marginTop: '1.75rem',
          color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem',
        }}>
          No account yet?{' '}
          <Link to="/register" style={{
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', textDecoration: 'none', fontWeight: '700',
          }}>Register here</Link>
        </p>
      </div>
    </div>
  )
}

export default Login