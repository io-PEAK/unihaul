import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'

const categories = [
  'Books & Notes', 'Electronics', 'Food & Drinks', 'Clothing',
  'Furniture', 'Sports & Fitness', 'Stationery', 'Appliances',
  'Games & Hobbies', 'Services', 'Other',
]

const subcategoryMap = {
  'Clothing':         ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Books & Notes':    ['1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'],
  'Electronics':      ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Camera', 'Accessories', 'Other'],
  'Furniture':        ['Chair', 'Table', 'Bed', 'Shelf', 'Sofa', 'Other'],
  'Sports & Fitness': ['Cricket', 'Football', 'Basketball', 'Gym Equipment', 'Badminton', 'Cycling', 'Other'],
  'Stationery':       ['Notes', 'Textbook', 'Novel', 'Art Supplies', 'Geometry Box', 'Other'],
  'Appliances':       ['Fan', 'Fridge', 'Microwave', 'Washing Machine', 'AC', 'Heater', 'Other'],
  'Games & Hobbies':  ['Board Game', 'Video Game', 'Puzzle', 'Instrument', 'Collectible', 'Other'],
  'Services':         ['Tutoring', 'Repair', 'Design', 'Photography', 'Other'],
  'Food & Drinks':    ['Homemade', 'Packaged', 'Beverages', 'Snacks', 'Other'],
  'Other':            [],
}

const subcategoryLabel = {
  'Clothing': 'Size', 'Books & Notes': 'Semester',
  'Electronics': 'Type', 'Furniture': 'Type', 'Sports & Fitness': 'Sport',
}

const specFieldsMap = {
  'Electronics': [
    { key: 'brand',     label: 'Brand',     placeholder: 'e.g. Dell, Apple, Samsung', span: 1 },
    { key: 'ram',       label: 'RAM',        placeholder: 'e.g. 8GB, 16GB',           span: 1 },
    { key: 'storage',   label: 'Storage',    placeholder: 'e.g. 256GB, 1TB',          span: 1 },
    { key: 'processor', label: 'Processor',  placeholder: 'e.g. Intel i5, M2',        span: 1 },
    { key: 'display',   label: 'Display',    placeholder: 'e.g. 15.6", 4K OLED',      span: 2 },
  ],
  'Clothing': [
    { key: 'gender', label: 'Gender',  placeholder: 'Male / Female / Unisex', span: 1 },
    { key: 'color',  label: 'Color',   placeholder: 'e.g. Black, Navy Blue',  span: 1 },
    { key: 'type',   label: 'Type',    placeholder: 'e.g. T-shirt, Jeans',    span: 2 },
  ],
  'Books & Notes': [
    { key: 'subject', label: 'Subject', placeholder: 'e.g. Physics, Maths',   span: 1 },
    { key: 'author',  label: 'Author',  placeholder: 'e.g. H.C. Verma',       span: 1 },
    { key: 'edition', label: 'Edition', placeholder: 'e.g. 3rd Edition 2023', span: 2 },
  ],
  'Furniture': [
    { key: 'material',   label: 'Material',   placeholder: 'e.g. Solid Wood, Metal', span: 1 },
    { key: 'color',      label: 'Color',      placeholder: 'e.g. Brown, White',      span: 1 },
    { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 120 × 60 cm',       span: 2 },
  ],
  'Sports & Fitness': [
    { key: 'sport', label: 'Sport', placeholder: 'e.g. Cricket, Football', span: 1 },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Nike, Adidas, SG',  span: 1 },
    { key: 'size',  label: 'Size',  placeholder: 'e.g. Size 7, XL',        span: 2 },
  ],
  'Stationery': [
    { key: 'type',  label: 'Type',  placeholder: 'e.g. Notebook, Pen set', span: 1 },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Classmate, Natraj',  span: 1 },
  ],
  'Appliances': [
    { key: 'brand',    label: 'Brand',    placeholder: 'e.g. Samsung, LG, Whirlpool', span: 1 },
    { key: 'capacity', label: 'Capacity', placeholder: 'e.g. 5kg, 200L',              span: 1 },
    { key: 'color',    label: 'Color',    placeholder: 'e.g. White, Silver',           span: 2 },
  ],
  'Games & Hobbies': [
    { key: 'platform', label: 'Platform', placeholder: 'e.g. PS5, PC, Mobile',    span: 1 },
    { key: 'type',     label: 'Type',     placeholder: 'e.g. Strategy, Action',   span: 1 },
    { key: 'brand',    label: 'Brand',    placeholder: 'e.g. Sony, Nintendo, EA', span: 2 },
  ],
  'Services': [
    { key: 'mode',       label: 'Mode',       placeholder: 'Online / Offline / Both', span: 1 },
    { key: 'experience', label: 'Experience', placeholder: 'e.g. 2 years, Beginner',  span: 1 },
  ],
  'Food & Drinks': [
    { key: 'type',        label: 'Type',        placeholder: 'e.g. Snack, Full Meal',    span: 2 },
    { key: 'ingredients', label: 'Ingredients', placeholder: 'Main ingredients',          span: 1 },
    { key: 'allergens',   label: 'Allergens',   placeholder: 'e.g. Nuts, Gluten, Dairy', span: 1 },
  ],
}

function PostItem() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill

  const [form, setForm] = useState({
    title:       prefill?.title       || '',
    price:       prefill?.price       || '',
    category:    prefill?.category    || '',
    subcategory: prefill?.subcategory || '',
    description: prefill?.description || '',
    condition:   prefill?.condition   || '',
    quantity:    prefill?.quantity    || 1,
  })
  const [specs, setSpecs]               = useState(prefill?.specs || {})
  const [focusedField, setFocusedField] = useState(null)
  const [btnHovered, setBtnHovered]     = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [success, setSuccess]           = useState(false)

  const subcategories = subcategoryMap[form.category] || []
  const specFields    = specFieldsMap[form.category]  || []

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'category') {
      setForm(f => ({ ...f, category: value, subcategory: '' }))
      setSpecs({})
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  function handleSpecChange(key, value) {
    setSpecs(s => ({ ...s, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.title || !form.price || !form.category || !form.condition) {
      setError('Title, price, category and condition are required.')
      return
    }
    if (parseFloat(form.price) <= 0) { setError('Price must be greater than ₹0.'); return }
    if (parseInt(form.quantity) < 1) { setError('Quantity must be at least 1.'); return }

    const cleanSpecs = Object.fromEntries(Object.entries(specs).filter(([, v]) => v && v.trim() !== ''))

    try {
      setLoading(true)
      await API.post('/items', {
        title:       form.title,
        price:       parseFloat(form.price),
        category:    form.category,
        subcategory: form.subcategory || null,
        description: form.description,
        condition:   form.condition,
        quantity:    parseInt(form.quantity),
        specs:       Object.keys(cleanSpecs).length > 0 ? cleanSpecs : null,
      })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to post item.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (name) => ({
    width: '100%', padding: '0.7rem 1rem',
    background: focusedField === name ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
    border: focusedField === name ? '1px solid rgba(232,119,34,0.35)' : '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', color: 'white', fontSize: '0.9rem',
    outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box',
    fontWeight: '400', letterSpacing: '0.2px',
  })

  const labelStyle = (name) => ({
    display: 'block', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase',
    color: focusedField === name ? 'rgba(232,119,34,0.7)' : 'rgba(255,255,255,0.35)',
    fontWeight: '700', marginBottom: '0.45rem', transition: 'color 0.3s ease',
  })

  const selectStyle = (name) => ({
    ...inputStyle(name),
    appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
    paddingRight: '2.5rem', cursor: 'pointer',
  })

  const ArrowIcon = () => (
    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
      <svg width="11" height="11" viewBox="0 0 16 16" fill="rgba(255,255,255,0.4)"><path d="M8 11L3 6h10z"/></svg>
    </div>
  )

  const specInputStyle = (key) => ({
    width: '100%', padding: '0.6rem 0.85rem',
    background: focusedField === `spec-${key}` ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
    border: focusedField === `spec-${key}` ? '1px solid rgba(232,119,34,0.4)' : specs[key] ? '1px solid rgba(232,119,34,0.2)' : '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px', color: 'white', fontSize: '0.83rem',
    outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box',
  })

  return (
    <div
       onClick={() => navigate('/')}
      style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', cursor: 'default' }}
    >
      <style>{`input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); } select option { background: #1a1225; color: white; }`}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '540px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.75rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

        <div style={{ marginBottom: '2.25rem' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: '1.05', marginBottom: '0.6rem', color: 'white' }}>
            {prefill ? 'Relist' : 'List an'}<br />
            <span style={{ background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Item.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: '400' }}>
            {prefill ? 'Edit the details and repost your listing' : 'Fill in the details to post your listing'}
          </p>
        </div>

        {success && (
          <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(81,207,102,0.1)', border: '1px solid rgba(81,207,102,0.2)', borderRadius: '12px', color: '#51cf66', fontSize: '0.85rem', fontWeight: '600', textAlign: 'center' }}>
            ✓ Item posted! Redirecting to dashboard...
          </div>
        )}
        {error && (
          <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '12px', color: '#ff6b6b', fontSize: '0.85rem', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Title + Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.15rem' }}>
            <div>
              <label style={labelStyle('title')}>Title</label>
              <input name="title" type="text" value={form.title} onChange={handleChange} onFocus={() => setFocusedField('title')} onBlur={() => setFocusedField(null)} placeholder="e.g. Physics Textbook" style={inputStyle('title')} />
            </div>
            <div>
              <label style={labelStyle('price')}>Price (₹)</label>
              <input name="price" type="number" min="1" step="1" value={form.price} onChange={handleChange} onFocus={() => setFocusedField('price')} onBlur={() => setFocusedField(null)} placeholder="e.g. 299" style={inputStyle('price')} />
            </div>
          </div>

          {/* Category + Condition */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.15rem' }}>
            <div>
              <label style={labelStyle('category')}>Category</label>
              <div style={{ position: 'relative' }}>
                <select name="category" value={form.category} onChange={handleChange} onFocus={() => setFocusedField('category')} onBlur={() => setFocusedField(null)} style={selectStyle('category')}>
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ArrowIcon />
              </div>
            </div>
            <div>
              <label style={labelStyle('condition')}>Condition</label>
              <div style={{ position: 'relative' }}>
                <select name="condition" value={form.condition} onChange={handleChange} onFocus={() => setFocusedField('condition')} onBlur={() => setFocusedField(null)} style={selectStyle('condition')}>
                  <option value="">Select condition</option>
                  {['Like New', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ArrowIcon />
              </div>
            </div>
          </div>

          {/* Subcategory + Quantity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.15rem' }}>
            {/* ✅ FIX: removed opacity dimming — was opacity: subcategories.length === 0 ? 0.35 : 1 */}
            <div>
              <label style={labelStyle('subcategory')}>
                {subcategoryLabel[form.category] || 'Subcategory'}
              </label>
              <div style={{ position: 'relative' }}>
                <select name="subcategory" value={form.subcategory} onChange={handleChange} onFocus={() => setFocusedField('subcategory')} onBlur={() => setFocusedField(null)} disabled={subcategories.length === 0} style={{ ...selectStyle('subcategory'), cursor: subcategories.length === 0 ? 'not-allowed' : 'pointer' }}>
                  <option value="">{subcategories.length === 0 ? 'N/A' : 'Select...'}</option>
                  {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ArrowIcon />
              </div>
            </div>
            <div>
              <label style={labelStyle('quantity')}>Quantity</label>
              <input name="quantity" type="number" min="1" max="99" step="1" value={form.quantity} onChange={handleChange} onFocus={() => setFocusedField('quantity')} onBlur={() => setFocusedField(null)} placeholder="1" style={inputStyle('quantity')} />
            </div>
          </div>

          {/* ── Specs Section ─────────────────────────────────────────────── */}
          {/* ✅ FIX: removed "(optional)" text, icon and label at full brightness */}
          {specFields.length > 0 && (
            <div style={{
              marginBottom: '1.15rem',
              background: 'rgba(232,119,34,0.04)',
              border: '1px solid rgba(232,119,34,0.15)',
              borderRadius: '16px', padding: '1.15rem',
              animation: 'specsIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
            }}>
              <style>{`@keyframes specsIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(232,119,34,0.85)" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                </svg>
                <span style={{ fontSize: '0.62rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(232,119,34,0.9)', fontWeight: '800' }}>
                  {form.category} Specifications
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                {specFields.map(field => (
                  <div key={field.key} style={{ gridColumn: field.span === 2 ? 'span 2' : 'span 1' }}>
                    <div style={{ fontSize: '0.6rem', letterSpacing: '1.2px', textTransform: 'uppercase', color: focusedField === `spec-${field.key}` ? 'rgba(232,119,34,0.75)' : 'rgba(255,255,255,0.5)', fontWeight: '700', marginBottom: '0.35rem', transition: 'color 0.2s' }}>
                      {field.label}
                    </div>
                    <input
                      type="text"
                      value={specs[field.key] || ''}
                      onChange={e => handleSpecChange(field.key, e.target.value)}
                      onFocus={() => setFocusedField(`spec-${field.key}`)}
                      onBlur={() => setFocusedField(null)}
                      placeholder={field.placeholder}
                      style={specInputStyle(field.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={labelStyle('description')}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} onFocus={() => setFocusedField('description')} onBlur={() => setFocusedField(null)} placeholder="Condition, age, any defects, reason for selling..." rows="4" style={{ ...inputStyle('description'), resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }} />
          </div>

          <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', margin: '1.25rem 0' }} />

          <button
            type="submit" disabled={loading || success}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              width: '100%', padding: '0.8rem',
              background: loading || success ? 'rgba(255,255,255,0.08)' : btnHovered ? 'linear-gradient(135deg, #f09030, #e87722)' : 'linear-gradient(135deg, #e87722, #f09030)',
              color: loading || success ? 'rgba(255,255,255,0.3)' : 'white',
              border: 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700',
              cursor: loading || success ? 'not-allowed' : 'pointer',
              letterSpacing: '1px', textTransform: 'uppercase',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: btnHovered && !loading ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: btnHovered && !loading ? '0 15px 35px rgba(232,119,34,0.35)' : '0 4px 15px rgba(232,119,34,0.2)',
            }}
          >{loading ? 'Posting...' : success ? '✓ Posted!' : 'Post Listing →'}</button>
        </form>
      </div>
    </div>
  )
}

export default PostItem