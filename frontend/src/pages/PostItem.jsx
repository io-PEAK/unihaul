import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'

const categories = [
  'Books & Notes',
  'Electronics',
  'Food & Drinks',
  'Clothing',
  'Furniture',
  'Sports & Fitness',
  'Stationery',
  'Appliances',
  'Games & Hobbies',
  'Services',
  'Other',
]

const subcategoryMap = {
  'Clothing':        ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'Books & Notes':   ['1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'],
  'Electronics':     ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Camera', 'Accessories', 'Other'],
  'Furniture':       ['Chair', 'Table', 'Bed', 'Shelf', 'Sofa', 'Other'],
  'Sports & Fitness':['Cricket', 'Football', 'Basketball', 'Gym Equipment', 'Badminton', 'Cycling', 'Other'],
  'Stationery':      ['Notes', 'Textbook', 'Novel', 'Art Supplies', 'Geometry Box', 'Other'],
  'Appliances':      ['Fan', 'Fridge', 'Microwave', 'Washing Machine', 'AC', 'Heater', 'Other'],
  'Games & Hobbies': ['Board Game', 'Video Game', 'Puzzle', 'Instrument', 'Collectible', 'Other'],
  'Services':        ['Tutoring', 'Repair', 'Design', 'Photography', 'Other'],
  'Food & Drinks':   ['Homemade', 'Packaged', 'Beverages', 'Snacks', 'Other'],
  'Other':           [],
}

function PostItem() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state?.prefill

  const [form, setForm] = useState({
    title: prefill?.title || '',
    price: prefill?.price || '',
    category: prefill?.category || '',
    subcategory: prefill?.subcategory || '',
    description: prefill?.description || '',
    condition: prefill?.condition || '',
    quantity: prefill?.quantity || 1,
  })
  const [focusedField, setFocusedField] = useState(null)
  const [btnHovered, setBtnHovered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const subcategories = subcategoryMap[form.category] || []

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'category') {
      setForm({ ...form, category: value, subcategory: '' })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.title || !form.price || !form.category || !form.condition) {
      setError('Title, price, category and condition are required.')
      return
    }
    if (parseFloat(form.price) <= 0) {
      setError('Price must be greater than ₹0.')
      return
    }
    if (parseInt(form.quantity) < 1) {
      setError('Quantity must be at least 1.')
      return
    }
    try {
      setLoading(true)
      await API.post('/items', {
        title: form.title,
        price: parseFloat(form.price),
        category: form.category,
        subcategory: form.subcategory || null,
        description: form.description,
        condition: form.condition,
        quantity: parseInt(form.quantity),
      })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to post item. Please try again.')
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

  return (
    <div
      onClick={() => navigate(-1)}
      style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', cursor: 'default' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '520px',
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
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: '400', letterSpacing: '0.2px' }}>
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
                  <option value="" style={{ background: '#1a1225', color: 'rgba(255,255,255,0.5)' }}>Select category</option>
                  {categories.map(cat => <option key={cat} value={cat} style={{ background: '#1a1225', color: 'white' }}>{cat}</option>)}
                </select>
                <ArrowIcon />
              </div>
            </div>
            <div>
              <label style={labelStyle('condition')}>Condition</label>
              <div style={{ position: 'relative' }}>
                <select name="condition" value={form.condition} onChange={handleChange} onFocus={() => setFocusedField('condition')} onBlur={() => setFocusedField(null)} style={selectStyle('condition')}>
                  <option value="" style={{ background: '#1a1225', color: 'rgba(255,255,255,0.5)' }}>Select condition</option>
                  {['Like New', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c} style={{ background: '#1a1225', color: 'white' }}>{c}</option>)}
                </select>
                <ArrowIcon />
              </div>
            </div>
          </div>

          {/* Subcategory + Quantity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.15rem' }}>

            {/* Subcategory — only show if category has options */}
            <div style={{ opacity: subcategories.length === 0 ? 0.35 : 1, transition: 'opacity 0.3s ease' }}>
              <label style={labelStyle('subcategory')}>
                {form.category === 'Clothing' ? 'Size'
                  : form.category === 'Books & Notes' ? 'Semester'
                  : form.category === 'Electronics' ? 'Type'
                  : form.category === 'Furniture' ? 'Type'
                  : form.category === 'Sports & Fitness' ? 'Sport'
                  : 'Subcategory'}
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="subcategory"
                  value={form.subcategory}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('subcategory')}
                  onBlur={() => setFocusedField(null)}
                  disabled={subcategories.length === 0}
                  style={{ ...selectStyle('subcategory'), cursor: subcategories.length === 0 ? 'not-allowed' : 'pointer' }}
                >
                  <option value="" style={{ background: '#1a1225', color: 'rgba(255,255,255,0.5)' }}>
                    {subcategories.length === 0 ? 'N/A' : 'Select...'}
                  </option>
                  {subcategories.map(s => <option key={s} value={s} style={{ background: '#1a1225', color: 'white' }}>{s}</option>)}
                </select>
                <ArrowIcon />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label style={labelStyle('quantity')}>Quantity</label>
              <input
                name="quantity"
                type="number"
                min="1"
                max="99"
                step="1"
                value={form.quantity}
                onChange={handleChange}
                onFocus={() => setFocusedField('quantity')}
                onBlur={() => setFocusedField(null)}
                placeholder="1"
                style={inputStyle('quantity')}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={labelStyle('description')}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} onFocus={() => setFocusedField('description')} onBlur={() => setFocusedField(null)} placeholder="Condition, age, any defects..." rows="4" style={{ ...inputStyle('description'), resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }} />
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