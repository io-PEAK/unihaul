import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import API from '../api/axios'

const categories = [
  'Books & Notes', 'Electronics', 'Food & Drinks', 'Clothing',
  'Furniture', 'Sports & Fitness', 'Stationery', 'Appliances',
  'Games & Hobbies', 'Services', 'Other',
]
const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor']
const statuses   = ['available', 'pending']

const SPEC_FIELDS = {
  'Electronics':      [{ key: 'brand', label: 'Brand' }, { key: 'ram', label: 'RAM' }, { key: 'storage', label: 'Storage' }, { key: 'processor', label: 'Processor' }, { key: 'display', label: 'Display' }],
  'Clothing':         [{ key: 'gender', label: 'Gender' }, { key: 'color', label: 'Color' }, { key: 'type', label: 'Type' }],
  'Books & Notes':    [{ key: 'subject', label: 'Subject' }, { key: 'author', label: 'Author' }, { key: 'edition', label: 'Edition' }],
  'Furniture':        [{ key: 'material', label: 'Material' }, { key: 'color', label: 'Color' }, { key: 'dimensions', label: 'Dimensions' }],
  'Sports & Fitness': [{ key: 'sport', label: 'Sport' }, { key: 'brand', label: 'Brand' }, { key: 'size', label: 'Size' }],
  'Stationery':       [{ key: 'type', label: 'Type' }, { key: 'brand', label: 'Brand' }],
  'Appliances':       [{ key: 'brand', label: 'Brand' }, { key: 'capacity', label: 'Capacity' }, { key: 'color', label: 'Color' }],
  'Games & Hobbies':  [{ key: 'platform', label: 'Platform' }, { key: 'type', label: 'Type' }, { key: 'brand', label: 'Brand' }],
  'Services':         [{ key: 'mode', label: 'Mode' }, { key: 'experience', label: 'Experience' }],
  'Food & Drinks':    [{ key: 'type', label: 'Type' }, { key: 'ingredients', label: 'Ingredients' }, { key: 'allergens', label: 'Allergens' }],
  'Other':            [],
}

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'active',  label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'sold',    label: 'Sold' },
]

function safeDate(val) {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}
function getTimestamp(obj) { return obj?.createdAt || obj?.created_at || null }
function formatDate(obj) {
  const raw = typeof obj === 'string' ? obj : getTimestamp(obj)
  const d   = safeDate(raw)
  if (!d) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatTime(obj) {
  const raw = typeof obj === 'string' ? obj : getTimestamp(obj)
  const d   = safeDate(raw)
  if (!d) return ''
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ── ConfirmDeleteModal ────────────────────────────────────────
function ConfirmDeleteModal({ title, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter')  onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onConfirm, onCancel])

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'cdFadeIn 0.18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(22,20,30,0.98) 0%, rgba(14,12,20,0.98) 100%)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '2rem',
          width: '380px',
          maxWidth: '90vw',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          position: 'relative', overflow: 'hidden',
          animation: 'cdSlideUp 0.22s cubic-bezier(0.175,0.885,0.32,1.275)',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,107,107,0.4), transparent)' }} />

        <div style={{
          width: '48px', height: '48px', borderRadius: '14px', margin: '0 auto 1.25rem',
          background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: 'rgba(255,255,255,0.92)', marginBottom: '0.5rem', letterSpacing: '-0.3px' }}>
            Delete listing?
          </div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '600' }}>"{title}"</span>
            {' '}will be permanently removed along with its images. This cannot be undone.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s ease', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >Cancel</button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, rgba(255,107,107,0.9), rgba(220,53,69,0.9))', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', color: 'white', transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(255,107,107,0.25)', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,107,107,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,107,107,0.25)' }}
          >Delete</button>
        </div>

        <style>{`
          @keyframes cdFadeIn  { from{opacity:0} to{opacity:1} }
          @keyframes cdSlideUp { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        `}</style>
      </div>
    </div>
  )
}

// ── SoldGroupRow ──────────────────────────────────────────────
function SoldGroupRow({ group, isNewSale, isHighlighted, onDelete, stableKey }) {
  const navigate = useNavigate()
  const rowRef   = useRef(null)

  const item   = group.item
  const sales  = group.sales
  const itemId = group.groupKey

  const [expanded, setExpanded]           = useState(false)
  const [hovered, setHovered]             = useState(false)
  const [deleteHovered, setDeleteHovered] = useState(false)
  const [relistHovered, setRelistHovered] = useState(false)
  const [showNew, setShowNew]             = useState(isNewSale)
  const [flash, setFlash]                 = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)

  useEffect(() => {
    if (isHighlighted) {
      setExpanded(true); setFlash(true)
      const t1 = setTimeout(() => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
      const t2 = setTimeout(() => setFlash(false), 2000)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [isHighlighted])

  useEffect(() => { if (isNewSale) setExpanded(true) }, [isNewSale])
  useEffect(() => {
    if (!isNewSale) return
    const t = setTimeout(() => setShowNew(false), 2000)
    return () => clearTimeout(t)
  }, [isNewSale])

  function handleDeleteClick() { setShowConfirm(true) }

  async function handleConfirmDelete() {
    setShowConfirm(false)
    if (item) onDelete(item.id)
    else      onDelete(null, stableKey)
    try {
      if (item) await API.delete(`/items/${item.id}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete.')
    }
  }

  const displayTitle    = item?.title    || sales[0]?.item_title    || 'Deleted item'
  const displayPrice    = item?.price    || sales[0]?.price         || '—'
  const displayCategory = item?.category || sales[0]?.item_category || ''
  const listedRaw       = item?.createdAt || item?.created_at       || null
  const listedDate      = safeDate(listedRaw)

  return (
    <>
      {showConfirm && (
        <ConfirmDeleteModal
          title={displayTitle}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div
        ref={rowRef}
        style={{
          background: flash
            ? 'linear-gradient(135deg, rgba(var(--accent-rgb),0.12) 0%, rgba(var(--accent-rgb),0.04) 100%)'
            : showNew
              ? 'linear-gradient(135deg, rgba(81,207,102,0.08) 0%, rgba(255,255,255,0.02) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
          backdropFilter: 'blur(20px)',
          border: flash
            ? '1px solid var(--accent)'
            : showNew
              ? '1px solid rgba(81,207,102,0.25)'
              : hovered ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.09)',
          borderRadius: '16px', overflow: 'hidden', transition: 'all 0.4s ease',
          boxShadow: flash
            ? 'var(--shadow-accent)'
            : showNew ? '0 4px 20px rgba(81,207,102,0.1)' : hovered ? '0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ height: '1px', background: flash
          ? 'linear-gradient(90deg, transparent, var(--accent), transparent)'
          : showNew
            ? 'linear-gradient(90deg, transparent, rgba(81,207,102,0.3), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

        <div className="sold-row-inner">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.3px' }}>{displayTitle}</h3>
              <div style={{ fontSize: '0.62rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.15)', whiteSpace: 'nowrap' }}>
                Sold {sales.reduce((sum, s) => sum + (s.quantity || 1), 0)}×
              </div>
              {showNew && !flash && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, rgba(81,207,102,0.15), rgba(64,192,87,0.1))', border: '1px solid rgba(81,207,102,0.35)', color: '#51cf66', fontSize: '0.62rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', animation: 'pulse-green 2.5s ease-in-out infinite' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#51cf66" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  New Sale
                </div>
              )}
              {flash && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '0.62rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  Viewing
                </div>
              )}
            </div>
            <div className="sold-row-meta">
              <span style={{ fontWeight: '800', fontSize: '0.95rem', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{displayPrice}</span>
              {displayCategory && <><span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} /><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600' }}>{displayCategory}</span></>}
              {listedDate && <><span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} /><span className="sold-row-date" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem' }}>Listed {listedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {listedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></>}
            </div>
          </div>

          <div className="sold-row-actions">
            <button onClick={() => setExpanded(e => !e)}
              style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '5px', background: expanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', color: expanded ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s ease' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}><polyline points="6 9 12 15 18 9"/></svg>
              History
            </button>
            <button
              onClick={() => navigate('/post', { state: { prefill: { title: displayTitle, price: displayPrice, category: displayCategory, condition: item?.condition, description: item?.description } } })}
              onMouseEnter={() => setRelistHovered(true)} onMouseLeave={() => setRelistHovered(false)}
              style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '5px', background: relistHovered ? 'var(--accent-soft)' : 'rgba(255,255,255,0.04)', color: relistHovered ? 'var(--accent)' : 'rgba(255,255,255,0.4)', border: relistHovered ? '1px solid var(--accent-border)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s ease' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Relist
            </button>
            <button onClick={handleDeleteClick}
              onMouseEnter={() => setDeleteHovered(true)} onMouseLeave={() => setDeleteHovered(false)}
              style={{ padding: '0.4rem 1rem', background: deleteHovered ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.08)', color: deleteHovered ? '#ff6b6b' : 'rgba(255,107,107,0.6)', border: deleteHovered ? '1px solid rgba(255,107,107,0.25)' : '1px solid rgba(255,107,107,0.1)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s ease' }}>
              Delete
            </button>
          </div>
        </div>

        {expanded && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1.75rem 1rem' }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', fontWeight: '700', marginBottom: '0.75rem' }}>Sale History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sales.map((sale, i) => {
                const saleTs   = getTimestamp(sale)
                const saleDate = safeDate(saleTs)
                return (
                  <div key={sale.id} className="sale-history-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '800', color: 'var(--accent)', flexShrink: 0 }}>{i + 1}</div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>{sale.buyer_name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>Buyer</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{sale.price}</div>
                      <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                        {saleDate ? `${saleDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · ${saleDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}` : '—'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <style>{`@keyframes pulse-green { 0%,100% { box-shadow: 0 2px 12px rgba(81,207,102,0.15) } 50% { box-shadow: 0 2px 20px rgba(81,207,102,0.3) } }`}</style>
      </div>
    </>
  )
}

// ── ListingRow ────────────────────────────────────────────────
function ListingRow({ item, onDelete, onUpdate }) {
  const [hovered, setHovered]             = useState(false)
  const [editHovered, setEditHovered]     = useState(false)
  const [deleteHovered, setDeleteHovered] = useState(false)
  const [editing, setEditing]             = useState(false)
  const [saving, setSaving]               = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)

  const [editForm, setEditForm] = useState({
    title: item.title, price: item.price, category: item.category,
    condition: item.condition, description: item.description || '', status: item.status,
  })
  const [editSpecs, setEditSpecs] = useState(() => {
    const existing = item.specs && typeof item.specs === 'object' ? item.specs : {}
    const fields   = SPEC_FIELDS[item.category] || []
    const initial  = {}
    fields.forEach(f => { initial[f.key] = existing[f.key] || '' })
    return initial
  })

  const status = item.status?.toLowerCase()

  function handleCategoryChange(newCategory) {
    const newFields = SPEC_FIELDS[newCategory] || []
    const newSpecs  = {}
    newFields.forEach(f => { newSpecs[f.key] = editSpecs[f.key] || '' })
    setEditForm(prev => ({ ...prev, category: newCategory }))
    setEditSpecs(newSpecs)
  }

  function handleDeleteClick() { setShowConfirm(true) }

  async function handleConfirmDelete() {
    setShowConfirm(false)
    onDelete(item.id)
    try {
      await API.delete(`/items/${item.id}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete item.')
    }
  }

  async function handleSave() {
    const parsedPrice = parseFloat(editForm.price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) { alert('Price must be greater than ₹0.'); return }
    const cleanSpecs = Object.fromEntries(Object.entries(editSpecs).filter(([, v]) => v && String(v).trim() !== ''))
    try {
      setSaving(true)
      const res = await API.put(`/items/${item.id}`, { ...editForm, price: parsedPrice, specs: Object.keys(cleanSpecs).length > 0 ? cleanSpecs : null })
      onUpdate(res.data)
      setEditing(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update item.')
    } finally {
      setSaving(false)
    }
  }

  const currentSpecFields = SPEC_FIELDS[editForm.category] || []

  return (
    <>
      {showConfirm && (
        <ConfirmDeleteModal
          title={item.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
          backdropFilter: 'blur(20px)',
          border: editing ? '1px solid var(--accent-border)' : hovered ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(255,255,255,0.09)',
          borderRadius: '16px', padding: '1.25rem 1.75rem',
          transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
          boxShadow: hovered ? '0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

        {!editing && (
          <div className="listing-row-view">
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.3px' }}>{item.title}</h3>
              <div className="listing-row-meta">
                <span style={{ fontWeight: '800', fontSize: '0.95rem', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{item.price}</span>
                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600' }}>{item.category}</span>
                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: status === 'pending' ? '#ffd43b' : '#51cf66', background: status === 'pending' ? 'rgba(255,212,59,0.1)' : 'rgba(81,207,102,0.1)', padding: '2px 10px', borderRadius: '20px', border: status === 'pending' ? '1px solid rgba(255,212,59,0.15)' : '1px solid rgba(81,207,102,0.15)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{status}</span>
                <span className="listing-date-dot" style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                <span className="listing-date" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>Listed {formatDate(item.createdAt)} · {formatTime(item.createdAt)}</span>
              </div>
            </div>
            <div className="listing-row-btns">
              <button onClick={() => setEditing(true)} onMouseEnter={() => setEditHovered(true)} onMouseLeave={() => setEditHovered(false)}
                style={{ padding: '0.4rem 1rem', background: editHovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)', color: editHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)', border: editHovered ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease' }}>Edit</button>
              <button onClick={handleDeleteClick} onMouseEnter={() => setDeleteHovered(true)} onMouseLeave={() => setDeleteHovered(false)}
                style={{ padding: '0.4rem 1rem', background: deleteHovered ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.08)', color: deleteHovered ? '#ff6b6b' : 'rgba(255,107,107,0.6)', border: deleteHovered ? '1px solid rgba(255,107,107,0.25)' : '1px solid rgba(255,107,107,0.1)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease' }}>Delete</button>
            </div>
          </div>
        )}

        {editing && (
          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--accent)', opacity: 0.7, fontWeight: '700', marginBottom: '1rem' }}>Editing: {item.title}</div>
            <div className="edit-grid" style={{ marginBottom: '0.75rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Title</label>
                <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Price (₹)</label>
                <input type="number" min="1" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <div style={{ position: 'relative' }}>
                  <select value={editForm.category} onChange={e => handleCategoryChange(e.target.value)} style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', paddingRight: '2rem', cursor: 'pointer' }}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="rgba(255,255,255,0.4)"><path d="M8 11L3 6h10z"/></svg>
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Condition</label>
                <div style={{ position: 'relative' }}>
                  <select value={editForm.condition} onChange={e => setEditForm({ ...editForm, condition: e.target.value })} style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', paddingRight: '2rem', cursor: 'pointer' }}>
                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="rgba(255,255,255,0.4)"><path d="M8 11L3 6h10z"/></svg>
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <div style={{ position: 'relative' }}>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', paddingRight: '2rem', cursor: 'pointer' }}>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="rgba(255,255,255,0.4)"><path d="M8 11L3 6h10z"/></svg>
                  </div>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>
            {currentSpecFields.length > 0 && (
              <div style={{ marginBottom: '0.75rem', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: '12px', padding: '1rem 1.15rem' }}>
                <div style={{ fontSize: '0.58rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--accent)', opacity: 0.6, fontWeight: '800', marginBottom: '0.75rem' }}>Specifications (optional)</div>
                <div className="edit-grid">
                  {currentSpecFields.map(field => (
                    <div key={field.key}>
                      <label style={labelStyle}>{field.label}</label>
                      <input value={editSpecs[field.key] || ''} onChange={e => setEditSpecs(prev => ({ ...prev, [field.key]: e.target.value }))} style={{ ...inputStyle, color: editSpecs[field.key] ? 'white' : 'rgba(255,255,255,0.25)' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(false)} style={{ padding: '0.4rem 1rem', borderRadius: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', fontWeight: '600' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '0.4rem 1.25rem', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', background: saving ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: saving ? 'rgba(255,255,255,0.3)' : 'white', border: 'none', fontSize: '0.8rem', fontWeight: '700', boxShadow: saving ? 'none' : 'var(--shadow-accent)' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const labelStyle = { display: 'block', fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '0.35rem' }
const inputStyle  = { width: '100%', padding: '0.55rem 0.85rem', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [items, setItems]               = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [postBtnHovered, setPostBtnHovered] = useState(false)
  const [freshSaleItemIds, setFreshSaleItemIds] = useState(new Set())

  const tabParam        = searchParams.get('tab')
  const highlightItemId = searchParams.get('item') ? parseInt(searchParams.get('item')) : null
  const [activeFilter, setActiveFilter] = useState(tabParam || 'active')

  useEffect(() => { if (tabParam) setActiveFilter(tabParam) }, [tabParam])

  const user     = JSON.parse(localStorage.getItem('user') || '{}')
  const username = user.firstName || 'there'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); setError(null)
        const [itemsRes, txnRes] = await Promise.all([
          API.get('/items/mine'),
          API.get('/transactions'),
        ])
        setItems(itemsRes.data)
        setTransactions(txnRes.data)
        try {
          const notifRes    = await API.get('/notifications')
          const unseenNotifs = notifRes.data
          if (unseenNotifs.length > 0) {
            await API.post('/notifications/mark-seen')
            const itemIds = new Set(unseenNotifs.map(n => Number(n.itemId)).filter(Boolean))
            setFreshSaleItemIds(itemIds)
            setActiveFilter('sold')
          }
        } catch (_) {}
      } catch (err) {
        setError('Failed to load your dashboard.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const [hiddenGroupKeys, setHiddenGroupKeys] = useState(new Set())
  function handleDelete(id, stableKey) {
    if (id != null) setItems(prev => prev.filter(i => i.id !== id))
    if (stableKey)  setHiddenGroupKeys(prev => new Set([...prev, stableKey]))
  }
  function handleUpdate(updatedItem) { setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i)) }
  function handleTabChange(key)      { setActiveFilter(key); setSearchParams({}) }

  const activeCount  = items.filter(i => i.status?.toLowerCase() === 'available').length
  const pendingCount = items.filter(i => i.status?.toLowerCase() === 'pending').length
  const soldCount    = items.filter(i => i.status?.toLowerCase() === 'sold').length

  const myId     = user.id
  const soldTxns = transactions.filter(t => t.seller_id === myId)

  const soldGroups = (() => {
    const map = new Map()
    soldTxns.forEach(t => {
      const key = t.item_id != null ? `item_${t.item_id}` : `txn_${t.id}`
      if (!map.has(key)) map.set(key, { sales: [], itemId: t.item_id })
      map.get(key).sales.push(t)
    })
    return Array.from(map.entries()).map(([key, data]) => {
      const foundItem = data.itemId != null ? items.find(i => i.id === data.itemId) : null
      return {
        groupKey: data.itemId, stableKey: key,
        item: foundItem || null,
        sales: data.sales.sort((a, b) => new Date(getTimestamp(b) || 0) - new Date(getTimestamp(a) || 0)),
      }
    }).sort((a, b) => new Date(getTimestamp(b.sales[0]) || 0) - new Date(getTimestamp(a.sales[0]) || 0))
  })()

  const visibleSoldGroups = soldGroups.filter(g => !hiddenGroupKeys.has(g.stableKey))
  const activeItems       = items.filter(i => i.status?.toLowerCase() === 'available')
  const pendingItems      = items.filter(i => i.status?.toLowerCase() === 'pending')
  const allNonSoldItems   = items.filter(i => i.status?.toLowerCase() !== 'sold')

  const sectionLabel = { active: 'Active Listings', pending: 'Pending Listings', sold: 'Sold Items', all: 'All Listings' }

  const EmptyState = ({ label }) => (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.4 }}>📭</div>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontWeight: '500' }}>No {label} yet.</p>
    </div>
  )

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)' }}>
      {/* ── Responsive styles injected here ── */}
      <style>{`
        /* ── Dashboard page wrapper ── */
        .dash-wrapper {
          padding: 5rem 4rem 3rem;
          max-width: 960px;
          margin: 0 auto;
        }

        /* ── Back button positioning ── */
        .dash-back-btn {
          position: absolute;
          left: -50px;
          top: 6px;
        }

        /* ── Page heading ── */
        .dash-heading {
          font-size: 3rem;
        }

        /* ── Stats row ── */
        .dash-stats-row {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          align-items: center;
          flex-wrap: nowrap;
        }

        /* ── Filter tabs ── */
        .dash-filter-tabs {
          display: flex;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
          flex-wrap: nowrap;
        }

        /* ── Edit form grid (2 cols by default) ── */
        .edit-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        /* ── ListingRow view mode ── */
        .listing-row-view {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .listing-row-meta {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
          align-items: center;
          flex-wrap: nowrap;
        }
        .listing-row-btns {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        /* ── SoldGroupRow ── */
        .sold-row-inner {
          padding: 1.25rem 1.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .sold-row-meta {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: nowrap;
        }
        .sold-row-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-shrink: 0;
        }

        /* ── Sale history row ── */
        .sale-history-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
        }

        /* ════════════════════════════════════
           769px – 1024px  (tablet)
        ════════════════════════════════════ */
        @media (max-width: 1024px) {
          .dash-wrapper {
            padding: 4rem 2.5rem 3rem;
          }
          .dash-back-btn {
            left: -36px;
          }
          .dash-heading {
            font-size: 2.4rem;
          }
        }

        /* ════════════════════════════════════
           < 768px  (mobile)
        ════════════════════════════════════ */
        @media (max-width: 768px) {
          .dash-wrapper {
            padding: 3rem 1.25rem 2.5rem;
          }

          /* Back button goes inline — sits above title, no absolute positioning */
          .dash-back-btn {
            position: static;
            margin-bottom: 0.75rem;
            display: inline-flex !important;
          }

          .dash-heading {
            font-size: 2rem;
          }

          /* Stats row wraps */
          .dash-stats-row {
            flex-wrap: wrap;
          }

          /* Filter tabs wrap */
          .dash-filter-tabs {
            flex-wrap: wrap;
          }

          /* Edit form → 1 col */
          .edit-grid {
            grid-template-columns: 1fr;
          }
          /* Title field was spanning 2 cols — reset on 1-col grid */
          .edit-grid > div[style*="gridColumn"] {
            grid-column: 1 / -1;
          }

          /* ListingRow: stack content + buttons vertically */
          .listing-row-view {
            flex-direction: column;
            align-items: flex-start;
          }
          .listing-row-meta {
            flex-wrap: wrap;
          }
          .listing-row-btns {
            align-self: flex-end;
          }

          /* Hide date in meta on mobile (saves space) */
          .listing-date-dot,
          .listing-date {
            display: none;
          }

          /* SoldGroupRow: stack too */
          .sold-row-inner {
            flex-direction: column;
            align-items: flex-start;
            padding: 1rem 1.25rem;
          }
          .sold-row-meta {
            flex-wrap: wrap;
          }
          .sold-row-date {
            display: none;
          }
          .sold-row-actions {
            align-self: flex-end;
            flex-wrap: wrap;
          }
        }

        /* ════════════════════════════════════
           < 480px  (small mobile)
        ════════════════════════════════════ */
        @media (max-width: 480px) {
          .dash-wrapper {
            padding: 2.5rem 1rem 2rem;
          }
          .dash-heading {
            font-size: 1.75rem;
          }
          .sold-row-inner {
            padding: 0.9rem 1rem;
          }
        }
      `}</style>

      <div className="dash-wrapper">

        <div style={{ marginBottom: '2.5rem', position: 'relative' }}>

          {/* ── Back button ── */}
          <button
            className="dash-back-btn"
            onClick={() => navigate(-1)}
            style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.boxShadow='0 0 8px 2px rgba(var(--accent-rgb),0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.boxShadow = 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <h1 className="dash-heading" style={{ fontWeight: '900', letterSpacing: '-2px', lineHeight: '1.05', marginBottom: '0.6rem', color: 'white' }}>
            My<br />
            <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Dashboard.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '400' }}>
            Welcome back, {username} — {activeCount} active listing{activeCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="dash-stats-row">
          {[
            { label: 'Active',  value: activeCount },
            { label: 'Pending', value: pendingCount },
            { label: 'Sold',    value: soldCount },
            { label: 'Total',   value: items.length },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '0.85rem 1.25rem', minWidth: '72px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
              <div style={{ fontSize: '0.5rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '0.25rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.5px' }}>{stat.value}</div>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate('/post')} onMouseEnter={() => setPostBtnHovered(true)} onMouseLeave={() => setPostBtnHovered(false)}
            style={{ padding: '0.85rem 1.75rem', background: postBtnHovered ? 'linear-gradient(135deg, var(--accent-alt), var(--accent))' : 'linear-gradient(135deg, var(--accent), var(--accent-alt))', color: 'white', border: 'none', borderRadius: '14px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: postBtnHovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: postBtnHovered ? 'var(--shadow-accent-lg)' : 'var(--shadow-accent)', whiteSpace: 'nowrap' }}>
            + Post New Item
          </button>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', marginBottom: '1.5rem' }} />

        <div className="dash-filter-tabs">
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key
            return (
              <button key={f.key} onClick={() => handleTabChange(f.key)}
                style={{ padding: '0.55rem 1.4rem', background: isActive ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'rgba(255,255,255,0.08)', color: isActive ? 'white' : 'rgba(255,255,255,0.65)', border: isActive ? 'none' : '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', transition: 'all 0.25s ease', boxShadow: isActive ? 'var(--shadow-accent)' : '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                {f.label}
              </button>
            )
          })}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', marginBottom: '1rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {sectionLabel[activeFilter]}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid var(--accent)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading your dashboard...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '20px', color: '#ff6b6b' }}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (activeFilter === 'active' || activeFilter === 'pending') && (() => {
          const list = activeFilter === 'active' ? activeItems : pendingItems
          if (list.length === 0) return <EmptyState label={activeFilter + ' listings'} />
          return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {list.map(item => <ListingRow key={item.id} item={item} onDelete={handleDelete} onUpdate={handleUpdate} />)}
          </div>
        })()}

        {!loading && !error && activeFilter === 'all' && (() => {
          if (allNonSoldItems.length === 0 && soldGroups.length === 0) return <EmptyState label="listings" />
          return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {allNonSoldItems.map(item => <ListingRow key={item.id} item={item} onDelete={handleDelete} onUpdate={handleUpdate} />)}
            {visibleSoldGroups.map(group => (
              <SoldGroupRow key={group.stableKey} group={group} stableKey={group.stableKey}
                isNewSale={group.groupKey != null && freshSaleItemIds.has(group.groupKey)}
                isHighlighted={highlightItemId != null && group.groupKey === highlightItemId}
                onDelete={handleDelete}
              />
            ))}
          </div>
        })()}

        {!loading && !error && activeFilter === 'sold' && (() => {
          if (visibleSoldGroups.length === 0) return <EmptyState label="sold items" />
          return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visibleSoldGroups.map(group => (
              <SoldGroupRow key={group.stableKey} group={group} stableKey={group.stableKey}
                isNewSale={group.groupKey != null && freshSaleItemIds.has(group.groupKey)}
                isHighlighted={highlightItemId != null && group.groupKey === highlightItemId}
                onDelete={handleDelete}
              />
            ))}
          </div>
        })()}

      </div>
    </div>
  )
}

export default Dashboard