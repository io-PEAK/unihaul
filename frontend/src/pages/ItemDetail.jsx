import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import API from '../api/axios'

const specLabels = {
  brand: 'Brand', ram: 'RAM', storage: 'Storage', processor: 'Processor', display: 'Display',
  gender: 'Gender', color: 'Color', type: 'Type',
  subject: 'Subject', author: 'Author', edition: 'Edition',
  material: 'Material', dimensions: 'Dimensions',
  sport: 'Sport', size: 'Size',
  capacity: 'Capacity',
  platform: 'Platform',
  mode: 'Mode', experience: 'Experience',
  ingredients: 'Ingredients', allergens: 'Allergens',
}

function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backTo = location.state?.from || '/'
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [backHovered, setBackHovered] = useState(false)
  const [btnHovered, setBtnHovered] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const myId = user?.id

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await API.get(`/items/${id}`)
        setItem(res.data)
      } catch (err) {
        setError('Item not found or failed to load.')
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #e87722', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading item...</p>
    </div>
  )

  if (error || !item) return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'rgba(255,255,255,0.25)' }}>
      <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.5 }}>∅</div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>Item not found</h2>
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>This listing may have been removed or doesn't exist.</p>
      <button onClick={() => navigate(backTo)} style={{ padding: '0.6rem 1.75rem', background: 'linear-gradient(135deg, #e87722, #f09030)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.5px', boxShadow: '0 4px 15px rgba(232,119,34,0.25)', transition: 'all 0.3s ease' }}>← Back to Home</button>
    </div>
  )

  const status = item.status?.toLowerCase()
  const isMyItem = parseInt(myId) === parseInt(item.seller?.id)

  // Parse specs — filter out empty values
  const specs = item.specs && typeof item.specs === 'object'
    ? Object.entries(item.specs).filter(([, v]) => v && String(v).trim() !== '')
    : []

  async function handleAddToCart() {
    if (!user) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
      if (!guestCart.find(i => i.id === item.id)) {
        guestCart.push(item)
        localStorage.setItem('guestCart', JSON.stringify(guestCart))
      }
      navigate('/cart')
      return
    }
    try {
      await API.post('/cart', { itemId: item.id })
      navigate('/cart')
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add to cart.'
      if (msg.includes('already in cart')) navigate('/cart')
      else alert(msg)
    }
  }

  // ✅ Info grid — now includes Stock card
  const infoGrid = [
    { label: 'Seller',    value: item.seller?.name || 'Unknown' },
    { label: 'Condition', value: item.condition },
    { label: 'Category',  value: item.category },
    { label: 'Status',    value: status, isStatus: true },
    { label: 'Stock',     value: status === 'sold' ? '0 remaining' : `${item.quantity ?? 1}` },
    ...(item.subcategory ? [{ label: item.category === 'Clothing' ? 'Size' : item.category === 'Books & Notes' ? 'Semester' : 'Subcategory', value: item.subcategory }] : []),
  ]

  return (
    <div style={{ padding: '3rem 4rem', maxWidth: '900px', margin: '0 auto' }}>

      <button onClick={() => navigate(backTo)} onMouseEnter={() => setBackHovered(true)} onMouseLeave={() => setBackHovered(false)}
        style={{ background: backHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', border: backHovered ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)', color: backHovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)', padding: '0.45rem 1.1rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', marginBottom: '2rem', transition: 'all 0.3s ease', backdropFilter: 'blur(12px)', letterSpacing: '0.3px' }}>← Back</button>

      <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{item.category}</span>
              {item.subcategory && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>›</span>
                  <span style={{ fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(232,119,34,0.6)', fontWeight: '700' }}>{item.subcategory}</span>
                </>
              )}
            </div>
            <h1 style={{ fontSize: '2.3rem', fontWeight: '900', letterSpacing: '-1.5px', lineHeight: '1.1', color: 'rgba(255,255,255,0.95)', margin: 0 }}>{item.title}</h1>
          </div>
          <span style={{ padding: '4px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '0.75rem', color: status === 'sold' ? '#ff6b6b' : status === 'pending' ? '#ffd43b' : '#51cf66', background: status === 'sold' ? 'rgba(255,107,107,0.1)' : status === 'pending' ? 'rgba(255,212,59,0.1)' : 'rgba(81,207,102,0.1)', border: status === 'sold' ? '1px solid rgba(255,107,107,0.15)' : status === 'pending' ? '1px solid rgba(255,212,59,0.15)' : '1px solid rgba(81,207,102,0.15)', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap', marginTop: '0.25rem', textTransform: 'capitalize' }}>{status}</span>
        </div>

        {/* Price */}
        <div style={{ fontSize: '2.75rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '2rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{item.price}</span>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', marginBottom: '2rem' }} />

        {/* ✅ Info grid — 2 columns, Stock always shown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {infoGrid.map(({ label, value, isStatus }) => (
            <div key={label} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '1rem 1.15rem', backdropFilter: 'blur(8px)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
              <div style={{ fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '0.4rem', fontWeight: '700' }}>{label}</div>
              {isStatus ? (
                <span style={{ display: 'inline-block', fontWeight: '700', fontSize: '0.82rem', textTransform: 'capitalize', padding: '2px 10px', borderRadius: '20px', color: status === 'sold' ? '#ff6b6b' : status === 'pending' ? '#ffd43b' : '#51cf66', background: status === 'sold' ? 'rgba(255,107,107,0.12)' : status === 'pending' ? 'rgba(255,212,59,0.12)' : 'rgba(81,207,102,0.12)', border: status === 'sold' ? '1px solid rgba(255,107,107,0.2)' : status === 'pending' ? '1px solid rgba(255,212,59,0.2)' : '1px solid rgba(81,207,102,0.2)' }}>{value}</span>
              ) : (
                <div style={{ fontWeight: '600', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', letterSpacing: '-0.2px', textTransform: 'capitalize' }}>{value}</div>
              )}
            </div>
          ))}
        </div>

        {/* ✅ Specs section — only shown if item has specs data */}
        {specs.length > 0 && (
          <div style={{ marginBottom: '1.5rem', background: 'rgba(232,119,34,0.04)', border: '1px solid rgba(232,119,34,0.12)', borderRadius: '16px', padding: '1.25rem 1.35rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(232,119,34,0.2), transparent)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(232,119,34,0.7)" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              </svg>
              <span style={{ fontSize: '0.62rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(232,119,34,0.7)', fontWeight: '800' }}>Specifications</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.65rem' }}>
              {specs.map(([key, value]) => (
                <div key={key} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.58rem', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(232,119,34,0.5)', marginBottom: '0.3rem', fontWeight: '700' }}>{specLabels[key] || key}</div>
                  <div style={{ fontWeight: '600', color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {item.description && (
          <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '1.25rem 1.35rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
            <div style={{ fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '0.65rem', fontWeight: '700' }}>Description</div>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: '1.75', margin: 0, fontSize: '0.92rem', fontWeight: '400', letterSpacing: '0.1px' }}>{item.description}</p>
          </div>
        )}

        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', marginBottom: '1.5rem' }} />

        {/* Action buttons */}
        {isMyItem ? (
          <div style={{ textAlign: 'center', padding: '0.85rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600', fontSize: '0.85rem', letterSpacing: '0.5px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            This is your listing — manage it in your Dashboard
          </div>
        ) : status === 'available' ? (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => navigate('/messages', { state: { item } })}
              style={{ flex: 1, padding: '0.85rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px', transition: 'all 0.3s ease' }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = 'white' }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.color = 'rgba(255,255,255,0.7)' }}
            >Message Seller</button>
            <button onMouseEnter={() => setBtnHovered(true)} onMouseLeave={() => setBtnHovered(false)} onClick={handleAddToCart}
              style={{ flex: 1, padding: '0.85rem', background: btnHovered ? 'linear-gradient(135deg, #f09030, #e87722)' : 'linear-gradient(135deg, #e87722, #f09030)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: btnHovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: btnHovered ? '0 15px 35px rgba(232,119,34,0.35)' : '0 4px 15px rgba(232,119,34,0.2)' }}
            >Add to Cart →</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '0.85rem', color: status === 'pending' ? 'rgba(255,212,59,0.7)' : 'rgba(255,107,107,0.6)', fontWeight: '600', fontSize: '0.85rem', letterSpacing: '0.5px', background: status === 'pending' ? 'rgba(255,212,59,0.08)' : 'rgba(255,107,107,0.08)', borderRadius: '12px', border: status === 'pending' ? '1px solid rgba(255,212,59,0.15)' : '1px solid rgba(255,107,107,0.1)', backdropFilter: 'blur(8px)' }}>
            {status === 'pending' ? 'This item is pending sale' : 'This item has been sold'}
          </div>
        )}
      </div>
    </div>
  )
}

export default ItemDetail