// Usage: <AvatarUpload user={user} onUpload={(url) => { /* update user.avatar */ }} />

import { useRef, useState } from 'react'
import API from '../api/axios'

export function AvatarUpload({ user, onUpload }) {
  const fileRef             = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [hovered, setHovered]     = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('image', file)
      const res = await API.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // save avatar URL to backend
      await API.put('/users/profile', { avatar: res.data.url })
      onUpload(res.data.url)
    } catch (err) {
      console.error('Avatar upload failed:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const initial = (user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()

  return (
    <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
      {/* Avatar circle */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: user?.avatar ? 'transparent' : 'var(--accent-soft)',
          border: '2px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          overflow: 'hidden', position: 'relative',
          transition: 'border-color 0.2s',
        }}
      >
        {user?.avatar
          ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" onError={e => { e.currentTarget.style.display='none' }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent)' }}>{initial}</span>
        }

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: (hovered || uploading) ? 1 : 0,
          transition: 'opacity 0.2s',
        }}>
          {uploading
            ? <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'avSpin 0.6s linear infinite' }} />
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          }
        </div>
      </div>

      {/* Small camera badge */}
      {!uploading && (
        <div style={{
          position: 'absolute', bottom: '-2px', right: '-2px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: 'var(--accent)', border: '2px solid var(--bg-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      <style>{`@keyframes avSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}