import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'
import { useTheme, THEMES } from '../ThemeContext'

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
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search your college or school..."
          style={{
            width: '100%', paddingLeft: '2.25rem', paddingRight: '2rem',
            paddingTop: '0.625rem', paddingBottom: '0.625rem',
            fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', outline: 'none',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
            transition: 'all 0.2s ease',
          }}
          onFocus={e => {
            if (query) setOpen(true)
            e.target.style.borderColor = 'var(--accent)'
            e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--border)'
            e.target.style.boxShadow = 'none'
          }}
        />
        <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        {loading && (
          <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'stSpin 0.6s linear infinite' }} />
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', zIndex: 100, maxHeight: '220px', overflowY: 'auto' }}>
          {results.map((inst, i) => (
            <div key={i} onClick={() => handleSelect(inst)}
              style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s ease' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)' }}>{inst.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{[inst.city, inst.state].filter(Boolean).join(', ')}</div>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '999px', background: inst.type === 'college' ? 'var(--accent-soft)' : 'rgba(34,197,94,0.1)', color: inst.type === 'college' ? 'var(--accent)' : '#16a34a', border: inst.type === 'college' ? '1px solid var(--accent-border)' : '1px solid rgba(34,197,94,0.2)', marginLeft: '0.75rem', flexShrink: 0 }}>{inst.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Toggle({ value, onChange, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', marginTop: '0.125rem', color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{ position: 'relative', flexShrink: 0, width: '44px', height: '24px', borderRadius: '12px', background: value ? 'var(--accent)' : 'var(--border-hover)', cursor: 'pointer', border: 'none', marginLeft: '1rem', transition: 'background 0.25s ease' }}>
        <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 0.25s ease', left: value ? '23px' : '3px' }} />
      </button>
    </div>
  )
}

function ThemeCard({ t, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: '100%', textAlign: 'left', padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', position: 'relative', border: isActive ? '2px solid var(--accent)' : hovered ? '2px solid var(--border-hover)' : '2px solid var(--border)', background: isActive ? 'var(--accent-soft)' : hovered ? 'var(--bg-card-hover)' : 'var(--bg-input)', transition: 'all 0.2s ease', fontFamily: 'var(--font-body)' }}>
      {isActive && (
        <div style={{ position: 'absolute', top: '0.625rem', right: '0.625rem', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem' }}>
        {t.preview.map((c, i) => (
          <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, border: '2px solid var(--border)' }} />
        ))}
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>{t.label}</div>
      <div style={{ fontSize: '0.75rem', marginTop: '0.125rem', color: 'var(--text-muted)' }}>{t.desc}</div>
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.375rem', fontFamily: 'var(--font-body)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Section({ icon, title, subtitle, children }) {
  return (
    <div style={{ borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{subtitle}</div>}
        </div>
      </div>
      {children}
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

export default function Settings() {
  const navigate = useNavigate()
  const { theme, setThemeById, themes } = useTheme()
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    institution: user?.institution || '',
    institutionType: user?.institutionType || 'college',
    city: user?.city || '',
    state: user?.state || '',
    notificationsEnabled: user?.notificationsEnabled ?? true,
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('profile')

  const sections = [
    {
      id: 'profile', label: 'Profile',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
    {
      id: 'institution', label: 'Institution',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    },
    {
      id: 'appearance', label: 'Appearance',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>,
    },
    {
      id: 'notifications', label: 'Notifications',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    },
    {
      id: 'account', label: 'Account',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    },
  ]

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name cannot be empty.'); return }
    try {
      setSaving(true); setError('')
      const res = await API.put('/users/profile', { ...form, theme })
      localStorage.setItem('user', JSON.stringify({ ...user, ...res.data }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.')
    } finally { setSaving(false) }
  }

  function handleThemeChange(id) {
    setThemeById(id)
    API.put('/users/profile', { theme: id }).catch(() => {})
    localStorage.setItem('user', JSON.stringify({ ...user, theme: id }))
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '80px', background: 'var(--bg-base)', fontFamily: 'var(--font-body)' }}>
      <style>{`
        @keyframes stFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes stSpin { to { transform: rotate(360deg) } }
        .st-animate { animation: stFadeUp 0.3s ease both; }
        .st-input-focus:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px var(--accent-soft) !important;
          background: var(--bg-input-focus) !important;
          outline: none !important;
        }
        .st-input-focus::placeholder { color: var(--text-muted); }
        .st-input-focus:disabled { opacity: 0.45; cursor: not-allowed; }
        .st-sidebar-btn:hover { background: var(--bg-card-hover) !important; }
      `}</style>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Header */}
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

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.25rem', alignItems: 'start' }}>

          {/* Sidebar */}
          <div className="st-animate" style={{ position: 'sticky', top: '90px', borderRadius: 'var(--radius-xl)', padding: '0.375rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)', animationDelay: '60ms' }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className="st-sidebar-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: activeSection === s.id ? '700' : '500', textAlign: 'left', marginBottom: '2px', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s ease', background: activeSection === s.id ? 'var(--accent-soft)' : 'transparent', border: activeSection === s.id ? '1px solid var(--accent-border)' : '1px solid transparent', color: activeSection === s.id ? 'var(--accent)' : 'var(--text-secondary)' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, opacity: activeSection === s.id ? 1 : 0.6 }}>
                  {s.icon}
                </span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div>

            {activeSection === 'profile' && (
              <div className="st-animate">
                <Section
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  title="Profile" subtitle="Your public information"
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Field label="Full Name">
                      <input className="st-input-focus" style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" />
                    </Field>
                    <Field label="Phone">
                      <input className="st-input-focus" style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                    </Field>
                  </div>
                  <Field label="Bio">
                    <textarea className="st-input-focus" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell buyers a little about yourself..." />
                  </Field>
                  <Field label="Email">
                    <input className="st-input-focus" style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={user?.email || ''} disabled />
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Email cannot be changed</p>
                  </Field>
                </Section>
              </div>
            )}

            {activeSection === 'institution' && (
              <div className="st-animate">
                <Section
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                  title="Institution" subtitle="Where you study — connects you with nearby students"
                >
                  <Field label="Type">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['college', 'school'].map(t => (
                        <button key={t} onClick={() => set('institutionType', t)}
                          style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem', fontWeight: '700', textTransform: 'capitalize', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s ease', border: form.institutionType === t ? '1px solid var(--accent)' : '1px solid var(--border)', background: form.institutionType === t ? 'var(--accent-soft)' : 'var(--bg-input)', color: form.institutionType === t ? 'var(--accent)' : 'var(--text-secondary)' }}
                        >{t}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Search Institution">
                    <InstitutionSearch value={form.institution} type={form.institutionType}
                      onSelect={inst => { set('institution', inst.name); set('city', inst.city || ''); set('state', inst.state || ''); if (inst.type) set('institutionType', inst.type) }}
                    />
                  </Field>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Field label="City">
                      <input className="st-input-focus" style={inputStyle} value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
                    </Field>
                    <Field label="State">
                      <input className="st-input-focus" style={inputStyle} value={form.state} onChange={e => set('state', e.target.value)} placeholder="State" />
                    </Field>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', lineHeight: '1.5', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                    <span style={{ marginTop: '0.1rem', flexShrink: 0 }}>ℹ️</span>
                    <span>Your institution is shown on your listings so students from the same place can find your items easily.</span>
                  </div>
                </Section>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="st-animate">
                <Section
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>}
                  title="Appearance" subtitle="Choose how Student Shop looks for you"
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                    {themes.map(t => (
                      <ThemeCard key={t.id} t={t} isActive={theme === t.id} onClick={() => handleThemeChange(t.id)} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.7rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    Theme changes apply instantly and are saved to your account.
                  </p>
                </Section>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="st-animate">
                <Section
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
                  title="Notifications" subtitle="Control what alerts you receive"
                >
                  <Toggle value={form.notificationsEnabled} onChange={v => set('notificationsEnabled', v)} label="Sale notifications" desc="Get notified when someone buys your item" />
                  <Toggle value={true} onChange={() => {}} label="Message notifications" desc="Get notified when you receive a new message" />
                  <Toggle value={false} onChange={() => {}} label="Price drop alerts" desc="Get notified when a saved item drops in price" />
                </Section>
              </div>
            )}

            {activeSection === 'account' && (
              <div className="st-animate">
                <Section
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
                  title="Account" subtitle="Manage your account"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Member since</div>
                        <div style={{ fontSize: '0.72rem', marginTop: '0.125rem', color: 'var(--text-muted)' }}>
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login') }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', transition: 'all 0.15s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.13)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Log out of Student Shop
                    </button>
                  </div>
                </Section>
              </div>
            )}

            {/* Save button */}
            {!['appearance', 'account'].includes(activeSection) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease', background: saving ? 'var(--bg-card-hover)' : 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: saving ? 'var(--text-muted)' : 'white', boxShadow: saving ? 'none' : 'var(--shadow-accent)' }}
                >
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

          </div>
        </div>
      </div>
    </div>
  )
}