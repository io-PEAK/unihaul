import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import API from '../api/axios'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function GoogleButton({ onClick, loading }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', padding: '0.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem',
        background: hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
        border: hovered ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease', color: 'white', fontSize: '0.88rem', fontWeight: '600',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
      {loading ? 'Signing in...' : 'Continue with Google'}
    </button>
  )
}

function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [focusedField, setFocusedField] = useState(null)
  const [btnHovered, setBtnHovered] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (e.target.name === 'email') setEmailError('')
  }

  function handleEmailBlur() {
    setFocusedField(null)
    if (form.email && !isValidEmail(form.email)) {
      setEmailError('Enter a valid email address')
    }
  }

  async function handleGoogleSuccess(codeResponse) {
    setGoogleLoading(true)
    setError('')
    try {
      const res = await API.post('/auth/google', { code: codeResponse.code })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed. Try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google sign-in was cancelled or failed.'),
    flow: 'auth-code',
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.firstName.trim()) { setError('First name is required'); return }
    if (!isValidEmail(form.email)) { setEmailError('Enter a valid email address'); return }

    setLoading(true)
    try {
      const res = await API.post('/auth/register', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { label: 'First Name', name: 'firstName', type: 'text', placeholder: 'Naman' },
    { label: 'Last Name', name: 'lastName', type: 'text', placeholder: 'Saini' },
    { label: 'Email', name: 'email', type: 'email', placeholder: 'your@email.com' },
    { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <style>{`
        .reg-back { position:absolute; left:-50px; top:16px; width:34px; height:34px }
        .reg-heading { font-size:2.4rem }
        @media (max-width:1024px) { .reg-back { left:-36px } .reg-heading { font-size:2rem } }
        @media (max-width:768px)  {
          .reg-back { position:static; margin-bottom:1rem; display:flex }
          .reg-heading { font-size:1.9rem }
          .reg-card { padding:2rem !important }
          .reg-name-grid { grid-template-columns:1fr !important }
        }
        @media (max-width:480px)  { .reg-heading { font-size:1.6rem } .reg-card { padding:1.5rem !important } }
      `}</style>
      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>

        {/* ── Back button — outside the box ── */}
        <button
          className="reg-back"
          onClick={() => navigate(-1)}
          style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', transition: 'all 0.15s', width:'34px', height:'34px', flexShrink:0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.boxShadow='0 0 8px 2px rgba(var(--accent-rgb),0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.boxShadow = 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

      <div className="reg-card" style={{
        width: '100%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px',
        padding: '2.75rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

        <div style={{ marginBottom: '2.25rem' }}>
          <h1 className="reg-heading" style={{ fontWeight: '900', letterSpacing: '-1.5px', lineHeight: '1.05', marginBottom: '0.6rem', color: 'white' }}>
            Join the<br />
            <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Shop.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: '400', letterSpacing: '0.2px' }}>
            Create your free Student Shop account
          </p>
        </div>

        {/* Google Button */}
        <GoogleButton onClick={googleLogin} loading={googleLoading} />

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontWeight: '600', letterSpacing: '1px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {/* First + Last name side by side */}
          <div className="reg-name-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.15rem' }}>
            {fields.slice(0, 2).map(field => (
              <div key={field.name}>
                <label style={{
                  display: 'block', fontSize: '0.65rem', letterSpacing: '1.5px',
                  textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.45rem',
                  transition: 'color 0.3s ease',
                  color: focusedField === field.name ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
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
                    border: focusedField === field.name ? '1px solid rgba(var(--accent-rgb),0.35)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px', color: 'white', fontSize: '0.9rem',
                    outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Email + Password */}
          {fields.slice(2).map(field => (
            <div key={field.name} style={{ marginBottom: '1.15rem' }}>
              <label style={{
                display: 'block', fontSize: '0.65rem', letterSpacing: '1.5px',
                textTransform: 'uppercase', fontWeight: '700', marginBottom: '0.45rem',
                transition: 'color 0.3s ease',
                color: field.name === 'email' && emailError
                  ? 'rgba(255,77,77,0.8)'
                  : focusedField === field.name ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
              }}>{field.label}</label>
              <input
                name={field.name} type={field.type} value={form[field.name]}
                onChange={handleChange}
                onFocus={() => setFocusedField(field.name)}
                onBlur={field.name === 'email' ? handleEmailBlur : () => setFocusedField(null)}
                placeholder={field.placeholder}
                style={{
                  width: '100%', padding: '0.7rem 1rem',
                  background: focusedField === field.name ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  border: field.name === 'email' && emailError
                    ? '1px solid rgba(255,77,77,0.5)'
                    : focusedField === field.name ? '1px solid rgba(var(--accent-rgb),0.35)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', color: 'white', fontSize: '0.9rem',
                  outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box',
                }}
              />
              {field.name === 'email' && emailError && (
                <p style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'rgba(255,77,77,0.8)', fontWeight: '500' }}>⚠ {emailError}</p>
              )}
            </div>
          ))}

          <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', margin: '1.25rem 0' }} />

          {error && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '10px', color: '#ff4d4d', fontSize: '0.85rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              width: '100%', padding: '0.8rem',
              background: loading ? 'rgba(255,255,255,0.08)'
                : btnHovered ? 'linear-gradient(135deg, var(--accent-alt), var(--accent))'
                : 'linear-gradient(135deg, var(--accent), var(--accent-alt))',
              color: loading ? 'rgba(255,255,255,0.3)' : 'white',
              border: 'none', borderRadius: '12px',
              fontSize: '0.85rem', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '1px', textTransform: 'uppercase',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: btnHovered && !loading ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: btnHovered && !loading ? '0 15px 35px rgba(var(--accent-rgb),0.35)' : '0 4px 15px rgba(var(--accent-rgb),0.2)',
            }}>
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.75rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textDecoration: 'none', fontWeight: '700' }}>
            Sign in
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}

export default Register