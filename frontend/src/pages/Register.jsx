import { useState } from 'react'
import { Link } from 'react-router-dom'

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [focusedField, setFocusedField] = useState(null)
  const [btnHovered, setBtnHovered] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    console.log('Register:', form)
  }

  const fields = [
    { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Naman Saini' },
    { label: 'Email', name: 'email', type: 'email', placeholder: 'your@email.com' },
    { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '2.75rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Top glass shine */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        }} />

        {/* Header */}
        <div style={{ marginBottom: '2.25rem' }}>
          <h1 style={{
            fontSize: '2.4rem',
            fontWeight: '900',
            letterSpacing: '-1.5px',
            lineHeight: '1.05',
            marginBottom: '0.6rem',
            color: 'white',
          }}>
            Join the<br />
            <span style={{
              background: 'linear-gradient(135deg, #e87722, #f5a623)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Shop.</span>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.85rem',
            fontWeight: '400',
            letterSpacing: '0.2px',
          }}>
            Create your free Student Shop account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {fields.map(field => (
            <div key={field.name} style={{ marginBottom: '1.15rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.65rem',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: focusedField === field.name
                  ? 'rgba(232,119,34,0.7)'
                  : 'rgba(255,255,255,0.35)',
                fontWeight: '700',
                marginBottom: '0.45rem',
                transition: 'color 0.3s ease',
              }}>{field.label}</label>
              <input
                name={field.name}
                type={field.type}
                value={form[field.name]}
                onChange={handleChange}
                onFocus={() => setFocusedField(field.name)}
                onBlur={() => setFocusedField(null)}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  background: focusedField === field.name
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(255,255,255,0.05)',
                  border: focusedField === field.name
                    ? '1px solid rgba(232,119,34,0.35)'
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  fontWeight: '400',
                  letterSpacing: '0.2px',
                }}
              />
            </div>
          ))}

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            margin: '1.25rem 0',
          }} />

          <button
            type="submit"
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              width: '100%',
              padding: '0.8rem',
              background: btnHovered
                ? 'linear-gradient(135deg, #f09030, #e87722)'
                : 'linear-gradient(135deg, #e87722, #f09030)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: btnHovered ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: btnHovered
                ? '0 15px 35px rgba(232,119,34,0.35)'
                : '0 4px 15px rgba(232,119,34,0.2)',
            }}
          >
            Create Account →
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '1.75rem',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.85rem',
          fontWeight: '400',
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textDecoration: 'none',
            fontWeight: '700',
          }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register