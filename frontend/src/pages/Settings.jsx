import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'
import { useTheme } from '../ThemeContext'

function InstitutionSearch({ value, type, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    function handleOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    setOpen(true)
    clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await API.get('/institutions/search', { params: { q, type: type || 'all', limit: 8 } })
        setResults(res.data || [])
      } catch { setResults([]) }
      setLoading(false)
    }, 300)
  }

  function handleSelect(inst) {
    setQuery(inst.name)
    setOpen(false)
    setResults([])
    onSelect(inst)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input type="text" value={query} onChange={handleChange}
          placeholder={type === 'school' ? 'Search your school' : 'Search your college'}
          style={{ width: '100%', paddingLeft: '2.25rem', paddingRight: '2rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', outline: 'none', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease' }}
          onFocus={e => { if (query) setOpen(true); e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
        />
        <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        {loading && <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'stSpin 0.6s linear infinite' }} />}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', zIndex: 100, maxHeight: '220px', overflowY: 'auto' }}>
          {results.map((inst, i) => (
            <div key={i} onClick={() => handleSelect(inst)}
              style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s ease' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inst.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{[inst.city, inst.state].filter(Boolean).join(', ')}</div>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '999px', background: inst.type === 'college' ? 'var(--accent-soft)' : 'rgba(34,197,94,0.1)', color: inst.type === 'college' ? 'var(--accent)' : '#16a34a', border: inst.type === 'college' ? '1px solid var(--accent-border)' : '1px solid rgba(34,197,94,0.2)', marginLeft: '0.75rem', flexShrink: 0 }}>{inst.type}</span>
            </div>
          ))}
        </div>
      )}
      {open && !loading && results.length === 0 && query.trim().length > 1 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', zIndex: 100, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No results for "{query}"</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', opacity: 0.7 }}>You can still type it manually in the field above</div>
        </div>
      )}
    </div>
  )
}

function Toggle({ value, onChange, label, desc, disabled = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border)', opacity: disabled ? 0.5 : 1 }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', marginTop: '0.125rem', color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      <button onClick={() => !disabled && onChange(!value)}
        style={{ position: 'relative', flexShrink: 0, width: '44px', height: '24px', borderRadius: '12px', background: value ? 'var(--accent)' : 'var(--border-hover)', cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', marginLeft: '1rem', transition: 'background 0.25s ease' }}>
        <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 0.25s ease', left: value ? '23px' : '3px' }} />
      </button>
    </div>
  )
}

function ThemeCard({ t, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ width: '100%', textAlign: 'left', padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', position: 'relative', border: isActive ? '2px solid var(--accent)' : hovered ? '2px solid var(--border-hover)' : '2px solid var(--border)', background: isActive ? 'var(--accent-soft)' : hovered ? 'var(--bg-card-hover)' : 'var(--bg-input)', transition: 'all 0.2s ease', fontFamily: 'var(--font-body)' }}>
      {isActive && (
        <div style={{ position: 'absolute', top: '0.625rem', right: '0.625rem', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem' }}>
        {t.preview.map((c, i) => (<div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: '2px solid var(--border)' }} />))}
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>{t.label}</div>
      <div style={{ fontSize: '0.75rem', marginTop: '0.125rem', color: 'var(--text-muted)' }}>{t.desc}</div>
    </button>
  )
}

function DeleteAccountDialog({ open, onConfirm, onCancel, loading }) {
  const [typed, setTyped] = useState('')
  if (!open) return null
  const confirmed = typed.trim().toLowerCase() === 'delete'
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', animation: 'stFadeIn 0.18s ease' }}>
      <div style={{ width: '400px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', animation: 'stSlideUp 0.22s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #ef4444, #f87171)' }} />
        <div style={{ padding: '1.75rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Delete your account?</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            This will permanently delete your account, all your listings, messages, and transaction history. <strong style={{ color: 'var(--text-primary)' }}>This cannot be undone.</strong>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>
              Type <span style={{ color: '#ef4444' }}>delete</span> to confirm
            </label>
            <input value={typed} onChange={e => setTyped(e.target.value)} placeholder="delete"
              style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', outline: 'none', background: 'var(--bg-input)', border: `1px solid ${confirmed ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>Cancel</button>
            <button onClick={() => confirmed && !loading && onConfirm()} disabled={!confirmed || loading}
              style={{ flex: 1, padding: '0.65rem', background: confirmed ? 'rgba(239,68,68,0.12)' : 'var(--bg-input)', border: `1px solid ${confirmed ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', color: confirmed ? '#ef4444' : 'var(--text-muted)', fontSize: '0.82rem', fontWeight: '700', cursor: confirmed && !loading ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              {loading && <div style={{ width: '12px', height: '12px', border: '2px solid rgba(239,68,68,0.3)', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'stSpin 0.6s linear infinite' }} />}
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChangeEmailPanel({ currentEmail, onSuccess }) {
  const [step, setStep] = useState('idle')
  const [newEmail, setNewEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)
  const otpInputRef = useRef(null)

  function startCountdown() {
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current); return 0 } return c - 1 })
    }, 1000)
  }

  async function handleSendOtp() {
    if (!newEmail.trim()) { setError('Please enter a new email address'); return }
    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) { setError('New email must be different from current email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) { setError('Please enter a valid email address'); return }
    try {
      setStep('sending'); setError('')
      await API.post('/users/send-otp', { type: 'email_change' })
      setStep('otp_sent')
      startCountdown()
      setTimeout(() => otpInputRef.current?.focus(), 100)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP')
      setStep('idle')
    }
  }

  async function handleSubmit(otpVal) {
    const otpToUse = otpVal || otp
    if (!otpToUse.trim()) { setError('Please enter the OTP'); return }
    try {
      setStep('submitting'); setError('')
      const res = await API.post('/users/change-email', { otp: otpToUse, newEmail: newEmail.trim() })
      setStep('done')
      onSuccess(res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change email')
      setStep('otp_sent')
    }
  }

  if (step === 'done') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '0.82rem', fontWeight: '600' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      Email changed successfully to {newEmail}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>New Email Address</label>
        <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input value={newEmail} onChange={e => { setNewEmail(e.target.value); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleSendOtp() }}
            placeholder="Enter your new email" type="email"
            disabled={step === 'otp_sent' || step === 'submitting' || step === 'sending'}
            style={{ flex: 1, padding: '0.625rem 0.75rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', outline: 'none', background: step === 'otp_sent' ? 'var(--bg-base)' : 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease', opacity: (step === 'otp_sent' || step === 'submitting') ? 0.6 : 1 }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
          />
          {step === 'idle' && (
            <button onClick={handleSendOtp}
              style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-border)', background: 'var(--accent-soft)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-border)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          )}
          {step === 'sending' && (
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'stSpin 0.6s linear infinite' }} />
            </div>
          )}
          {(step === 'otp_sent' || step === 'submitting') && (
            <button onClick={() => { setStep('idle'); setOtp(''); setError('') }}
              style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s ease' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>
      {(step === 'otp_sent' || step === 'submitting') && (
        <div style={{ animation: 'stFadeUp 0.25s ease' }}>
          <div style={{ padding: '0.6rem 0.875rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', fontSize: '0.72rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            OTP sent to <strong>{currentEmail}</strong>
          </div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>6-digit OTP</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input ref={otpInputRef} value={otp}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setOtp(val); setError('')
                if (val.length === 6 && step !== 'submitting') handleSubmit(val)
              }}
              onKeyDown={e => { if (e.key === 'Enter' && otp.length === 6) handleSubmit() }}
              placeholder="••••••" maxLength={6} disabled={step === 'submitting'}
              style={{ flex: 1, padding: '0.625rem 0.75rem', fontSize: '1.1rem', fontWeight: '700', letterSpacing: '0.3em', borderRadius: 'var(--radius-sm)', outline: 'none', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'monospace', transition: 'all 0.2s ease', textAlign: 'center' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
            <button onClick={() => handleSubmit()} disabled={step === 'submitting' || otp.length < 6}
              style={{ padding: '0 1.25rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: '700', cursor: (step === 'submitting' || otp.length < 6) ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'var(--font-body)', background: (step === 'submitting' || otp.length < 6) ? 'var(--bg-card-hover)' : 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: (step === 'submitting' || otp.length < 6) ? 'var(--text-muted)' : 'white', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
              {step === 'submitting' && <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'stSpin 0.6s linear infinite' }} />}
              {step === 'submitting' ? 'Verifying...' : 'Confirm'}
            </button>
          </div>
          <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
            <button onClick={countdown === 0 ? handleSendOtp : undefined} disabled={countdown > 0}
              style={{ fontSize: '0.7rem', fontWeight: '600', color: countdown > 0 ? 'var(--text-muted)' : 'var(--accent)', background: 'none', border: 'none', cursor: countdown > 0 ? 'default' : 'pointer', fontFamily: 'var(--font-body)' }}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: '500' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}
    </div>
  )
}

function ChangePasswordPanel() {
  const [mode, setMode] = useState('normal')
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })
  const [otp, setOtp] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  function startCountdown() {
    setCountdown(60)
    timerRef.current = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(timerRef.current); return 0 } return c - 1 })
    }, 1000)
  }

  async function handleChangePassword() {
    if (!form.current || !form.newPass || !form.confirm) { setError('All fields are required'); return }
    if (form.newPass.length < 8) { setError('New password must be at least 8 characters'); return }
    if (form.newPass !== form.confirm) { setError('Passwords do not match'); return }
    try {
      setLoading(true); setError('')
      await API.post('/users/change-password', { currentPassword: form.current, newPassword: form.newPass })
      setSuccess('Password changed successfully')
      setForm({ current: '', newPass: '', confirm: '' })
    } catch (err) { setError(err.response?.data?.error || 'Failed to change password') }
    finally { setLoading(false) }
  }

  async function handleSendForgotOtp() {
    try {
      setLoading(true); setError('')
      await API.post('/users/send-otp', { type: 'password_reset' })
      setMode('otp_sent'); startCountdown()
    } catch (err) { setError(err.response?.data?.error || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  async function handleResetWithOtp() {
    if (!otp || !newPass || !confirmPass) { setError('All fields are required'); return }
    if (newPass.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPass !== confirmPass) { setError('Passwords do not match'); return }
    try {
      setLoading(true); setError('')
      await API.post('/users/reset-password', { otp, newPassword: newPass })
      setSuccess('Password reset successfully'); setMode('normal')
    } catch (err) { setError(err.response?.data?.error || 'Failed to reset password') }
    finally { setLoading(false) }
  }

  const eyeIcon = (show) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {show ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
    </svg>
  )

  const pwInput = (val, setter, show, toggleShow, placeholder) => (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} value={val} onChange={e => setter(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 0.75rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', outline: 'none', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease' }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
      />
      <button type="button" onClick={toggleShow} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>{eyeIcon(show)}</button>
    </div>
  )

  if (success) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '0.82rem', fontWeight: '600' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      {success}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {mode === 'normal' && (
        <>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>Current Password</label>
            {pwInput(form.current, v => setForm(f => ({...f, current: v})), showCurrent, () => setShowCurrent(s => !s), 'Enter current password')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>New Password</label>
              {pwInput(form.newPass, v => setForm(f => ({...f, newPass: v})), showNew, () => setShowNew(s => !s), 'Min 8 characters')}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>Confirm Password</label>
              {pwInput(form.confirm, v => setForm(f => ({...f, confirm: v})), showConfirm, () => setShowConfirm(s => !s), 'Repeat new password')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={handleChangePassword} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.25rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'var(--font-body)', background: loading ? 'var(--bg-card-hover)' : 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: loading ? 'var(--text-muted)' : 'white', transition: 'all 0.2s ease' }}>
              {loading && <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'stSpin 0.6s linear infinite' }} />}
              {loading ? 'Saving...' : 'Change Password'}
            </button>
            <button onClick={() => { setMode('forgot'); setError('') }} style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              Forgot current password?
            </button>
          </div>
        </>
      )}
      {mode === 'forgot' && (
        <div style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Reset via email</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.875rem', lineHeight: '1.5' }}>We'll send a 6-digit code to your registered email. Use it to set a new password.</div>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button onClick={handleSendForgotOtp} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'var(--font-body)', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: 'white', transition: 'all 0.2s ease' }}>
              {loading && <div style={{ width: '11px', height: '11px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'stSpin 0.6s linear infinite' }} />}
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <button onClick={() => { setMode('normal'); setError('') }} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Cancel</button>
          </div>
        </div>
      )}
      {mode === 'otp_sent' && (
        <>
          <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Reset code sent. Check your email inbox.
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>6-digit Code</label>
            <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="••••••" maxLength={6}
              style={{ width: '100%', padding: '0.625rem 0.75rem', fontSize: '1rem', fontWeight: '700', letterSpacing: '0.2em', borderRadius: 'var(--radius-sm)', outline: 'none', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'monospace', transition: 'all 0.2s ease', textAlign: 'center' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>New Password</label>
              {pwInput(newPass, setNewPass, showNew, () => setShowNew(s => !s), 'Min 8 characters')}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>Confirm Password</label>
              {pwInput(confirmPass, setConfirmPass, showConfirm, () => setShowConfirm(s => !s), 'Repeat new password')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={handleResetWithOtp} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.25rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'var(--font-body)', background: loading ? 'var(--bg-card-hover)' : 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: loading ? 'var(--text-muted)' : 'white', transition: 'all 0.2s ease' }}>
              {loading && <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'stSpin 0.6s linear infinite' }} />}
              {loading ? 'Resetting...' : 'Set New Password'}
            </button>
            <button onClick={countdown === 0 ? handleSendForgotOtp : undefined} disabled={countdown > 0}
              style={{ fontSize: '0.72rem', fontWeight: '600', color: countdown > 0 ? 'var(--text-muted)' : 'var(--accent)', background: 'none', border: 'none', cursor: countdown > 0 ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)' }}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>
        </>
      )}
      {error && <p style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: '500', margin: 0 }}>{error}</p>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>{label}</label>
      {children}
    </div>
  )
}

function Section({ icon, title, subtitle, children }) {
  return (
    <div style={{ borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>{icon}</div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

function AccountSubPanel({ title, icon, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden', transition: 'all 0.2s ease' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: open ? 'var(--bg-card-hover)' : 'var(--bg-input)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'background 0.15s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.875rem',
  borderRadius: 'var(--radius-sm)', outline: 'none',
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
  transition: 'all 0.2s ease', marginTop: 0,
}

const AppearanceIcon = ({ size = 16, color = 'var(--accent)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r="0.5" fill={color}/>
    <circle cx="17.5" cy="10.5" r="0.5" fill={color}/>
    <circle cx="8.5" cy="7.5" r="0.5" fill={color}/>
    <circle cx="6.5" cy="12.5" r="0.5" fill={color}/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
)

export default function Settings() {
  const navigate = useNavigate()
  const { theme, setThemeById, themes } = useTheme()

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const [loadingUser, setLoadingUser] = useState(true)

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', bio: '',
    institutionType: '',        // empty = not set yet
    institution: '', city: '', state: '',
    notificationsEnabled: true,
    messageNotificationsEnabled: true,
  })
  // true = user clicked "Change type", show toggle + clear fields
  const [changingType, setChangingType] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('profile')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get('/users/me')
        const fresh = res.data
        setUser(fresh)
        localStorage.setItem('user', JSON.stringify(fresh))
        const iType = fresh.institutionType || ''
        setForm({
          firstName: fresh.firstName || '',
          lastName:  fresh.lastName  || '',
          phone: fresh.phone || '',
          bio:   fresh.bio   || '',
          institutionType: iType,
          institution: fresh.institution || '',
          city:        fresh.city        || '',
          state:       fresh.state       || '',
          notificationsEnabled: fresh.notificationsEnabled ?? true,
          messageNotificationsEnabled: fresh.messageNotificationsEnabled ?? true,
        })
        if (fresh.theme && fresh.theme !== theme) setThemeById(fresh.theme)
      } catch {
        if (user) {
          const iType = user.institutionType || ''
          setForm({
            firstName: user.firstName || '',
            lastName:  user.lastName  || '',
            phone: user.phone || '',
            bio:   user.bio   || '',
            institutionType: iType,
            institution: user.institution || '',
            city:        user.city        || '',
            state:       user.state       || '',
            notificationsEnabled: user.notificationsEnabled ?? true,
            messageNotificationsEnabled: user.messageNotificationsEnabled ?? true,
          })
        }
      } finally { setLoadingUser(false) }
    }
    fetchUser()
  }, [])

  const sections = [
    { id: 'profile',       label: 'Profile',       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { id: 'institution',   label: 'Institution',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: 'appearance',    label: 'Appearance',    icon: <AppearanceIcon size={14} color="currentColor" /> },
    { id: 'notifications', label: 'Notifications', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
    { id: 'account',       label: 'Account',       icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ]

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  async function handleSave() {
    if (!form.firstName.trim()) { setError('First name cannot be empty.'); return }
    if (!form.institutionType) { setError('Please select College or School first.'); return }
    try {
      setSaving(true); setError('')
      const payload = {
        firstName: form.firstName,
        lastName:  form.lastName,
        phone: form.phone,
        bio:   form.bio,
        institutionType: form.institutionType,
        institution: form.institution,
        city:        form.city,
        state:       form.state,
        notificationsEnabled: form.notificationsEnabled,
        messageNotificationsEnabled: form.messageNotificationsEnabled,
        theme,
      }
      const res = await API.put('/users/profile', payload)
      const updated = { ...user, ...res.data }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) { setError(err.response?.data?.error || 'Failed to save.') }
    finally { setSaving(false) }
  }

  function handleThemeChange(id) {
    setThemeById(id)
    API.put('/users/profile', { theme: id }).catch(() => {})
    const updated = { ...user, theme: id }
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
  }

  async function handleDeleteAccount() {
    try {
      setDeleting(true)
      await API.delete('/users/account')
      localStorage.removeItem('token'); localStorage.removeItem('user')
      navigate('/register')
    } catch (err) {
      setDeleting(false); setShowDeleteDialog(false)
      setError(err.response?.data?.error || 'Failed to delete account.')
      setActiveSection('account')
    }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', background: 'var(--bg-base)', fontFamily: 'var(--font-body)' }}>
      <style>{`
        @keyframes stFadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes stFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes stSlideUp { from { opacity:0; transform:translateY(12px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes stSpin    { to { transform: rotate(360deg) } }
        .st-animate { animation: stFadeUp 0.3s ease both; }
        .st-input-focus:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-soft) !important; background: var(--bg-input-focus) !important; outline: none !important; }
        .st-input-focus::placeholder { color: var(--text-muted); }
        .st-input-focus:disabled { opacity: 0.45; cursor: not-allowed; }
        .st-sidebar-btn:hover { background: var(--bg-card-hover) !important; border-color: var(--border-hover) !important; }
      `}</style>

      <DeleteAccountDialog open={showDeleteDialog} onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteDialog(false)} loading={deleting} />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <div className="st-animate" style={{ marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: '600', marginBottom: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '900', letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Settings</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Manage your profile, institution and preferences</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.25rem', alignItems: 'start' }}>

          {/* Sidebar */}
          <div className="st-animate" style={{ position: 'sticky', top: '90px', borderRadius: 'var(--radius-xl)', padding: '0.375rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', animationDelay: '60ms' }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} className="st-sidebar-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', textAlign: 'left', marginBottom: '2px', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s ease', background: activeSection === s.id ? 'var(--accent-soft)' : 'transparent', border: activeSection === s.id ? '1px solid var(--accent-border)' : '1px solid transparent', color: activeSection === s.id ? 'var(--accent)' : 'var(--text-primary)', fontWeight: activeSection === s.id ? '700' : '500' }}>
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, opacity: activeSection === s.id ? 1 : 0.55 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div>
            {loadingUser ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'stSpin 0.7s linear infinite' }} />
              </div>
            ) : (
              <>
                {/* ── PROFILE ── */}
                {activeSection === 'profile' && (
                  <div className="st-animate">
                    <Section icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} title="Profile" subtitle="Your public information">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Field label="First Name"><input className="st-input-focus" style={inputStyle} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="First name" /></Field>
                        <Field label="Last Name"><input className="st-input-focus" style={inputStyle} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Last name" /></Field>
                        <Field label="Phone"><input className="st-input-focus" style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></Field>
                      </div>
                      <Field label="Bio">
                        <textarea className="st-input-focus" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell buyers a little about yourself..." />
                      </Field>
                      <Field label="Email">
                        <input className="st-input-focus" style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={user?.email || ''} disabled />
                        <button onClick={() => setActiveSection('account')}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem', fontSize: '0.72rem', fontWeight: '600', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)', opacity: 0.85, transition: 'opacity 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          Change email address
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </button>
                      </Field>
                    </Section>
                  </div>
                )}

                {/* ── INSTITUTION ── */}
                {activeSection === 'institution' && (
                  <div className="st-animate">
                    <Section icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} title="Institution" subtitle="Where you study — connects you with nearby students">

                      {/* ── Type picker: shown if not set yet OR user clicked Change type ── */}
                      {(!form.institutionType || changingType) && (
                        <div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {[
                              {
                                id: 'college',
                                label: 'College Student',
                                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                              },
                              {
                                id: 'school',
                                label: 'School Student',
                                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                              }
                            ].map(t => {
                              const isSelected = form.institutionType === t.id
                              return (
                                <button key={t.id}
                                  onClick={() => {
                                    set('institutionType', t.id)
                                    set('institution', '')
                                    set('city', '')
                                    set('state', '')
                                    setChangingType(false)
                                  }}
                                  style={{ flex: 1, padding: '0.875rem 1rem', textAlign: 'left', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.18s ease', border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border)', background: isSelected ? 'var(--accent-soft)' : 'var(--bg-input)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                                >
                                  <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>{t.icon}</span>
                                  <span style={{ fontSize: '0.875rem', fontWeight: '700', color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>{t.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Warning — only when changing an existing saved type */}
                      

                      {/* ── Institution form: only shown once type is chosen ── */}
                      {form.institutionType && !changingType && (
                        <>
                          {/* Type badge + change link */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                              {form.institutionType === 'college'
                                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                              }
                              <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--accent)', textTransform: 'capitalize' }}>
                                {form.institutionType === 'college' ? 'College' : 'School'} student
                              </span>
                            </div>
                            <button
                              onClick={() => setChangingType(true)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: '0.25rem 0.625rem', transition: 'all 0.15s ease' }}
                              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.background = 'var(--accent-soft)' }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'none' }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Change
                            </button>
                          </div>

                          <Field label={form.institutionType === 'college' ? 'Institution Name' : 'School Name'}>
                            <InstitutionSearch
                              key={form.institutionType}
                              value={form.institution}
                              type={form.institutionType}
                              onSelect={inst => {
                                set('institution', inst.name)
                                set('city',  inst.city  || '')
                                set('state', inst.state || '')
                              }}
                            />
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Can't find it? Just type the name manually and hit Save.</p>
                          </Field>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Field label="City">
                              <input className="st-input-focus" style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
                            </Field>
                            <Field label="State">
                              <input className="st-input-focus" style={inputStyle} value={form.state} onChange={e => set('state', e.target.value)} placeholder="State" />
                            </Field>
                          </div>
                        </>
                      )}

                      {/* Info strip removed — too cluttered */}
                    </Section>
                  </div>
                )}

                {/* ── APPEARANCE ── */}
                {activeSection === 'appearance' && (
                  <div className="st-animate">
                    <Section icon={<AppearanceIcon size={16} />} title="Appearance" subtitle="Choose how Student Shop looks for you">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        {themes.map(t => (<ThemeCard key={t.id} t={t} isActive={theme === t.id} onClick={() => handleThemeChange(t.id)} />))}
                      </div>
                    </Section>
                  </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeSection === 'notifications' && (
                  <div className="st-animate">
                    <Section icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} title="Notifications" subtitle="Control what alerts you receive">
                      <Toggle value={form.notificationsEnabled} onChange={v => set('notificationsEnabled', v)} label="Sale notifications" desc="Get notified when someone buys your item" />
                      <Toggle value={form.messageNotificationsEnabled} onChange={v => set('messageNotificationsEnabled', v)} label="Message notifications" desc="Get notified when you receive a new message" />
                      <Toggle value={false} onChange={() => {}} label="Price drop alerts" desc="Coming soon — not available yet" disabled={true} />
                    </Section>
                  </div>
                )}

                {/* ── ACCOUNT ── */}
                {activeSection === 'account' && (
                  <div className="st-animate">
                    <Section icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>} title="Account" subtitle="Manage your account">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Member since</div>
                            <div style={{ fontSize: '0.72rem', marginTop: '0.125rem', color: 'var(--text-muted)' }}>
                              {memberSince || (loadingUser ? 'Loading...' : 'Not available')}
                            </div>
                          </div>
                          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login') }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.875rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-body)', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444', transition: 'all 0.15s ease', flexShrink: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.18)' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Log out
                          </button>
                        </div>

                        <AccountSubPanel title="Change Email" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}>
                          <ChangeEmailPanel currentEmail={user?.email || ''} onSuccess={updated => { setUser(updated); localStorage.setItem('user', JSON.stringify(updated)) }} />
                        </AccountSubPanel>

                        <AccountSubPanel title="Change Password" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}>
                          <ChangePasswordPanel />
                        </AccountSubPanel>

                        <div style={{ height: '1px', background: 'var(--border)', margin: '0.25rem 0' }} />

                        <div style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Danger Zone</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.875rem', lineHeight: '1.5' }}>Permanently delete your account and all associated data. This cannot be reversed.</div>
                          <button onClick={() => setShowDeleteDialog(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-body)', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', transition: 'all 0.15s ease' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </Section>
                  </div>
                )}

                {/* Save Changes */}
                {!['appearance', 'account'].includes(activeSection) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <button onClick={handleSave} disabled={saving}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease', background: saving ? 'var(--bg-card-hover)' : 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: saving ? 'var(--text-muted)' : 'white', boxShadow: saving ? 'none' : 'var(--shadow-accent)' }}>
                      {saving && <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'stSpin 0.6s linear infinite' }} />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {saved && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: '600', color: '#22c55e', animation: 'stFadeUp 0.3s ease' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Saved
                      </div>
                    )}
                    {error && <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ef4444' }}>{error}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}