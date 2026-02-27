import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

const categories = [
  'Books & Notes', 'Electronics', 'Food & Drinks', 'Clothing',
  'Furniture', 'Sports & Fitness', 'Stationery', 'Appliances',
  'Games & Hobbies', 'Services', 'Other',
]
const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor']
const statuses = ['available', 'pending']

// ✅ Spec fields per category — mirrors PostItem
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

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ── Sold item row with expandable sale history ──────────────────────────────
function SoldGroupRow({ group, isNewSale, onDelete }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteHovered, setDeleteHovered] = useState(false)
  const [relistHovered, setRelistHovered] = useState(false)

  const item = group.item
  const sales = group.sales

  async function handleDelete() {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return
    try {
      setDeleting(true)
      await API.delete(`/items/${item.id}`)
      onDelete(item.id)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete.')
      setDeleting(false)
    }
  }

  return (
    <div style={{
      background: isNewSale
        ? 'linear-gradient(135deg, rgba(81,207,102,0.08) 0%, rgba(255,255,255,0.02) 100%)'
        : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(20px)',
      border: isNewSale ? '1px solid rgba(81,207,102,0.25)' : hovered ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s ease',
      boxShadow: isNewSale ? '0 4px 20px rgba(81,207,102,0.1)' : hovered ? '0 8px 25px rgba(0,0,0,0.2)' : '0 4px 15px rgba(0,0,0,0.08)',
      opacity: deleting ? 0.5 : 1,
    }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ height: '1px', background: isNewSale ? 'linear-gradient(90deg, transparent, rgba(81,207,102,0.3), transparent)' : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      <div style={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.3px' }}>{item.title}</h3>
            <div style={{ fontSize: '0.62rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.15)', whiteSpace: 'nowrap' }}>
            Sold {sales.reduce((sum, s) => sum + (s.quantity || 1), 0)}×
            </div>
            {isNewSale && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, rgba(81,207,102,0.15), rgba(64,192,87,0.1))', border: '1px solid rgba(81,207,102,0.35)', color: '#51cf66', fontSize: '0.62rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', animation: 'pulse-green 2.5s ease-in-out infinite' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#51cf66" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                New Sale
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontWeight: '800', fontSize: '0.95rem', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{item.price}</span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600' }}>{item.category}</span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem' }}>Listed {formatDate(item.createdAt)} · {formatTime(item.createdAt)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '1rem' }}>
          <button onClick={() => setExpanded(e => !e)}
            style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '5px', background: expanded ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', color: expanded ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s ease' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            History
          </button>
          <button
            onClick={() => navigate('/post', { state: { prefill: { title: item.title, price: item.price, category: item.category, condition: item.condition, description: item.description } } })}
            onMouseEnter={() => setRelistHovered(true)} onMouseLeave={() => setRelistHovered(false)}
            style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '5px', background: relistHovered ? 'rgba(232,119,34,0.18)' : 'rgba(232,119,34,0.08)', color: relistHovered ? '#f09030' : 'rgba(232,119,34,0.7)', border: relistHovered ? '1px solid rgba(232,119,34,0.4)' : '1px solid rgba(232,119,34,0.2)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s ease' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Relist
          </button>
          <button onClick={handleDelete} disabled={deleting}
            onMouseEnter={() => setDeleteHovered(true)} onMouseLeave={() => setDeleteHovered(false)}
            style={{ padding: '0.4rem 1rem', background: deleteHovered ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.08)', color: deleteHovered ? '#ff6b6b' : 'rgba(255,107,107,0.6)', border: deleteHovered ? '1px solid rgba(255,107,107,0.25)' : '1px solid rgba(255,107,107,0.1)', borderRadius: '10px', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s ease' }}
          >{deleting ? '...' : 'Delete'}</button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1.75rem 1rem' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', fontWeight: '700', marginBottom: '0.75rem' }}>Sale History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sales.map((sale, i) => (
              <div key={sale.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(232,119,34,0.15)', border: '1px solid rgba(232,119,34,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: '800', color: '#e87722', flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>{sale.buyer_name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', marginTop: '1px' }}>Buyer</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{sale.price}</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{formatDate(sale.createdAt)} · {formatTime(sale.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes pulse-green { 0%,100% { box-shadow: 0 2px 12px rgba(81,207,102,0.15) } 50% { box-shadow: 0 2px 20px rgba(81,207,102,0.3) } }`}</style>
    </div>
  )
}

// ── Active/Pending listing row ───────────────────────────────────────────────
function ListingRow({ item, onDelete, onUpdate }) {
  const [hovered, setHovered] = useState(false)
  const [editHovered, setEditHovered] = useState(false)
  const [deleteHovered, setDeleteHovered] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    title: item.title,
    price: item.price,
    category: item.category,
    condition: item.condition,
    description: item.description || '',
    status: item.status,
  })

  // ✅ NEW: spec fields state — pre-filled from existing item.specs
  const [editSpecs, setEditSpecs] = useState(() => {
    const existing = item.specs && typeof item.specs === 'object' ? item.specs : {}
    const fields = SPEC_FIELDS[item.category] || []
    const initial = {}
    fields.forEach(f => { initial[f.key] = existing[f.key] || '' })
    return initial
  })

  const status = item.status?.toLowerCase()

  // ✅ When category changes in edit form, reset specs to blank for new category
  // but preserve any keys that overlap
  function handleCategoryChange(newCategory) {
    const newFields = SPEC_FIELDS[newCategory] || []
    const newSpecs = {}
    newFields.forEach(f => { newSpecs[f.key] = editSpecs[f.key] || '' })
    setEditForm(prev => ({ ...prev, category: newCategory }))
    setEditSpecs(newSpecs)
  }

  async function handleDelete() {
    try {
      setDeleting(true)
      await API.delete(`/items/${item.id}`)
      onDelete(item.id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete item.')
      setDeleting(false)
    }
  }

  async function handleSave() {
    const parsedPrice = parseFloat(editForm.price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Price must be greater than ₹0.')
      return
    }
    // Clean specs — remove empty strings before sending
    const cleanSpecs = Object.fromEntries(
      Object.entries(editSpecs).filter(([, v]) => v && String(v).trim() !== '')
    )
    try {
      setSaving(true)
      const res = await API.put(`/items/${item.id}`, {
        ...editForm,
        price: parsedPrice,
        specs: Object.keys(cleanSpecs).length > 0 ? cleanSpecs : null,
      })
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
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)',
        border: editing ? '1px solid rgba(232,119,34,0.3)' : hovered ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '1.25rem 1.75rem',
        transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
        opacity: deleting ? 0.5 : 1,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

      {/* View mode */}
      {!editing && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.3px' }}>{item.title}</h3>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', fontSize: '0.95rem', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{item.price}</span>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600' }}>{item.category}</span>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: status === 'pending' ? '#ffd43b' : '#51cf66', background: status === 'pending' ? 'rgba(255,212,59,0.1)' : 'rgba(81,207,102,0.1)', padding: '2px 10px', borderRadius: '20px', border: status === 'pending' ? '1px solid rgba(255,212,59,0.15)' : '1px solid rgba(81,207,102,0.15)', textTransform: 'capitalize' }}>{status}</span>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>Listed {formatDate(item.createdAt)} · {formatTime(item.createdAt)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setEditing(true)} onMouseEnter={() => setEditHovered(true)} onMouseLeave={() => setEditHovered(false)}
              style={{ padding: '0.4rem 1rem', background: editHovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)', color: editHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)', border: editHovered ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease' }}>Edit</button>
            <button onClick={handleDelete} disabled={deleting} onMouseEnter={() => setDeleteHovered(true)} onMouseLeave={() => setDeleteHovered(false)}
              style={{ padding: '0.4rem 1rem', background: deleteHovered ? 'rgba(255,107,107,0.2)' : 'rgba(255,107,107,0.08)', color: deleteHovered ? '#ff6b6b' : 'rgba(255,107,107,0.6)', border: deleteHovered ? '1px solid rgba(255,107,107,0.25)' : '1px solid rgba(255,107,107,0.1)', borderRadius: '10px', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.2s ease' }}>{deleting ? '...' : 'Delete'}</button>
          </div>
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div>
          <div style={{ fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(232,119,34,0.7)', fontWeight: '700', marginBottom: '1rem' }}>
            Editing: {item.title}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {/* Title — full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Title</label>
              <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} style={inputStyle} />
            </div>

            {/* Price */}
            <div>
              <label style={labelStyle}>Price (₹)</label>
              <input type="number" min="1" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={inputStyle} />
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>Category</label>
              <div style={{ position: 'relative' }}>
                <select value={editForm.category} onChange={e => handleCategoryChange(e.target.value)}
                  style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: '2rem', cursor: 'pointer' }}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="rgba(255,255,255,0.4)"><path d="M8 11L3 6h10z"/></svg>
                </div>
              </div>
            </div>

            {/* Condition */}
            <div>
              <label style={labelStyle}>Condition</label>
              <div style={{ position: 'relative' }}>
                <select value={editForm.condition} onChange={e => setEditForm({ ...editForm, condition: e.target.value })}
                  style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: '2rem', cursor: 'pointer' }}>
                  {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="rgba(255,255,255,0.4)"><path d="M8 11L3 6h10z"/></svg>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <div style={{ position: 'relative' }}>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', paddingRight: '2rem', cursor: 'pointer' }}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="rgba(255,255,255,0.4)"><path d="M8 11L3 6h10z"/></svg>
                </div>
              </div>
            </div>

            {/* Description — full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          </div>

          {/* ✅ NEW: Specs section — only shown if this category has spec fields */}
          {currentSpecFields.length > 0 && (
            <div style={{ marginBottom: '0.75rem', background: 'rgba(232,119,34,0.04)', border: '1px solid rgba(232,119,34,0.12)', borderRadius: '12px', padding: '1rem 1.15rem' }}>
              <div style={{ fontSize: '0.58rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(232,119,34,0.6)', fontWeight: '800', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(232,119,34,0.6)" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                </svg>
                Specifications (optional)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {currentSpecFields.map(field => (
                  <div key={field.key}>
                    <label style={labelStyle}>{field.label}</label>
                    <input
                      value={editSpecs[field.key] || ''}
                      onChange={e => setEditSpecs(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={`e.g. ${field.key === 'ram' ? '8GB' : field.key === 'storage' ? '256GB' : field.key === 'brand' ? 'Samsung' : '...'}`}
                      style={{ ...inputStyle, color: editSpecs[field.key] ? 'white' : 'rgba(255,255,255,0.25)' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save / Cancel */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={{ padding: '0.4rem 1rem', borderRadius: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', fontWeight: '600' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '0.4rem 1.25rem', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', background: saving ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #e87722, #f09030)', color: saving ? 'rgba(255,255,255,0.3)' : 'white', border: 'none', fontSize: '0.8rem', fontWeight: '700', boxShadow: saving ? 'none' : '0 4px 15px rgba(232,119,34,0.3)' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.6rem', letterSpacing: '1.5px',
  textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
  fontWeight: '700', marginBottom: '0.35rem',
}
const inputStyle = {
  width: '100%', padding: '0.55rem 0.85rem', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', color: 'white', fontSize: '0.85rem',
  outline: 'none', fontFamily: 'inherit',
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [postBtnHovered, setPostBtnHovered] = useState(false)
  const [activeFilter, setActiveFilter] = useState('active')
  const [newSaleItemIds, setNewSaleItemIds] = useState(new Set())

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const username = user.name || user.username || 'there'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [itemsRes, txnRes] = await Promise.all([
          API.get('/items/mine'),
          API.get('/transactions'),
        ])
        setItems(itemsRes.data)
        setTransactions(txnRes.data)

        try {
          const notifRes = await API.get('/notifications')
          const soldItemIds = new Set(notifRes.data.map(n => n.itemId))
          setNewSaleItemIds(soldItemIds)
          if (soldItemIds.size > 0) {
            setTimeout(async () => {
              setNewSaleItemIds(new Set())
              try { await API.post('/notifications/mark-seen') } catch (_) {}
            }, 2000)
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

  function handleDelete(id) { setItems(prev => prev.filter(i => i.id !== id)) }
  function handleUpdate(updatedItem) { setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i)) }

  const activeCount  = items.filter(i => i.status?.toLowerCase() === 'available').length
  const pendingCount = items.filter(i => i.status?.toLowerCase() === 'pending').length
  const soldCount    = items.filter(i => i.status?.toLowerCase() === 'sold').length

  const myId = user.id
  const soldTxns = transactions.filter(t => t.seller_id === myId)

  const soldGroups = (() => {
    const map = new Map()
    soldTxns.forEach(t => {
      if (!map.has(t.item_id)) map.set(t.item_id, { sales: [] })
      map.get(t.item_id).sales.push(t)
    })
    return Array.from(map.entries()).map(([itemId, data]) => ({
      item: items.find(i => i.id === itemId) || { id: itemId, title: data.sales[0]?.item_title, price: data.sales[0]?.price, category: '', createdAt: null },
      sales: data.sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    })).sort((a, b) => new Date(b.sales[0]?.createdAt) - new Date(a.sales[0]?.createdAt))
  })()

  const activeItems     = items.filter(i => i.status?.toLowerCase() === 'available')
  const pendingItems    = items.filter(i => i.status?.toLowerCase() === 'pending')
  const allNonSoldItems = items.filter(i => i.status?.toLowerCase() !== 'sold')

  const sectionLabel = { active: 'Active Listings', pending: 'Pending Listings', sold: 'Sold Items', all: 'All Listings' }

  const EmptyState = ({ label }) => (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.4 }}>📭</div>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontWeight: '500' }}>No {label} yet.</p>
    </div>
  )

  return (
    <div onClick={() => navigate('/')} style={{ minHeight: 'calc(100vh - 70px)', cursor: 'default' }}>
      <div onClick={e => e.stopPropagation()} style={{ padding: '3rem 4rem', maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', lineHeight: '1.05', marginBottom: '0.6rem', color: 'white' }}>
            My<br />
            <span style={{ background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Dashboard.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '400' }}>
            Welcome back, {username} — {activeCount} active listing{activeCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', alignItems: 'center' }}>
          {[
            { label: 'Active', value: activeCount },
            { label: 'Pending', value: pendingCount },
            { label: 'Sold', value: soldCount },
            { label: 'Total', value: items.length },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '0.85rem 1.25rem', minWidth: '72px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
              <div style={{ fontSize: '0.5rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '0.25rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.5px' }}>{stat.value}</div>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => navigate('/post')} onMouseEnter={() => setPostBtnHovered(true)} onMouseLeave={() => setPostBtnHovered(false)}
            style={{ padding: '0.85rem 1.75rem', background: postBtnHovered ? 'linear-gradient(135deg, #f09030, #e87722)' : 'linear-gradient(135deg, #e87722, #f09030)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: postBtnHovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: postBtnHovered ? '0 15px 35px rgba(232,119,34,0.35)' : '0 4px 15px rgba(232,119,34,0.2)', whiteSpace: 'nowrap' }}>
            + Post New Item
          </button>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', marginBottom: '1.5rem' }} />

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
          {FILTERS.map(f => {
            const isActive = activeFilter === f.key
            return (
              <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{ padding: '0.55rem 1.4rem', background: isActive ? 'linear-gradient(135deg, #e87722, #f09030)' : 'rgba(255,255,255,0.06)', color: isActive ? 'white' : 'rgba(255,255,255,0.5)', border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', transition: 'all 0.25s ease', boxShadow: isActive ? '0 4px 15px rgba(232,119,34,0.3)' : 'none' }}>{f.label}</button>
            )
          })}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', marginBottom: '1rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {sectionLabel[activeFilter]}
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #e87722', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading your dashboard...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '20px', color: '#ff6b6b' }}>
            <p>{error}</p>
          </div>
        )}

        {/* Active / Pending */}
        {!loading && !error && (activeFilter === 'active' || activeFilter === 'pending') && (() => {
          const list = activeFilter === 'active' ? activeItems : pendingItems
          if (list.length === 0) return <EmptyState label={activeFilter + ' listings'} />
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {list.map(item => <ListingRow key={item.id} item={item} onDelete={handleDelete} onUpdate={handleUpdate} />)}
            </div>
          )
        })()}

        {/* All */}
        {!loading && !error && activeFilter === 'all' && (() => {
          if (allNonSoldItems.length === 0 && soldGroups.length === 0) return <EmptyState label="listings" />
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {allNonSoldItems.map(item => <ListingRow key={item.id} item={item} onDelete={handleDelete} onUpdate={handleUpdate} />)}
              {soldGroups.map(group => <SoldGroupRow key={group.item.id} group={group} isNewSale={newSaleItemIds.has(group.item.id)} onDelete={handleDelete} />)}
            </div>
          )
        })()}

        {/* Sold */}
        {!loading && !error && activeFilter === 'sold' && (() => {
          if (soldGroups.length === 0) return <EmptyState label="sold items" />
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {soldGroups.map(group => <SoldGroupRow key={group.item.id} group={group} isNewSale={newSaleItemIds.has(group.item.id)} onDelete={handleDelete} />)}
            </div>
          )
        })()}

      </div>
    </div>
  )
}

export default Dashboard