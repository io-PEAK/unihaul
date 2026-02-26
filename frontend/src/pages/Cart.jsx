import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

function CartItem({ cartItem, onRemove, onQtyChange }) {
  const [removing, setRemoving] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [updatingQty, setUpdatingQty] = useState(false)
  const navigate = useNavigate()
  const item = cartItem.item || cartItem
  const status = item?.status?.toLowerCase()
  const isGuest = !cartItem.item
  const currentQty = cartItem.quantity || 1
  const maxQty = item?.quantity || 1

  async function handleRemove() {
    try {
      setRemoving(true)
      if (!isGuest) await API.delete(`/cart/${item.id}`)
      onRemove(isGuest ? item.id : cartItem.id)
    } catch (err) {
      alert('Failed to remove item.')
      setRemoving(false)
    }
  }

  async function handleQtyChange(newQty) {
    if (newQty < 1 || newQty > maxQty || updatingQty) return
    if (isGuest) { onQtyChange(item.id, newQty); return }
    try {
      setUpdatingQty(true)
      await API.patch(`/cart/${item.id}`, { quantity: newQty })
      onQtyChange(cartItem.id, newQty)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update quantity.')
    } finally {
      setUpdatingQty(false)
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: hovered
          ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '1.25rem 1.75rem',
        transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
        opacity: removing ? 0.4 : 1, gap: '1rem',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

      {/* Item info */}
      <div style={{ flex: 1, cursor: 'pointer', minWidth: 0 }} onClick={() => navigate(`/items/${item.id}`)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.3px' }}>{item.title}</h3>
          {status && status !== 'available' && (
            <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.15)', whiteSpace: 'nowrap' }}>No longer available</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '800', fontSize: '1.1rem', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{(item.price * currentQty).toFixed(2)}</span>
          {currentQty > 1 && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', fontWeight: '500' }}>₹{item.price} × {currentQty}</span>}
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600' }}>{item.category}</span>
          {item.subcategory && <>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem' }}>›</span>
            <span style={{ color: 'rgba(232,119,34,0.5)', fontSize: '0.75rem', fontWeight: '600' }}>{item.subcategory}</span>
          </>}
          {item.seller?.name && <>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600' }}>Sold by {item.seller.name}</span>
          </>}
        </div>
      </div>

      {/* Qty controls — only show if maxQty > 1 */}
      {maxQty > 1 && status === 'available' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, opacity: updatingQty ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          <button
            onClick={() => handleQtyChange(currentQty - 1)}
            disabled={currentQty === 1 || updatingQty}
            style={{ width: '32px', height: '32px', background: 'none', border: 'none', color: currentQty === 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', cursor: currentQty === 1 ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
          >−</button>
          <span style={{ minWidth: '28px', textAlign: 'center', color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>{currentQty}</span>
          <button
            onClick={() => handleQtyChange(currentQty + 1)}
            disabled={currentQty === maxQty || updatingQty}
            style={{ width: '32px', height: '32px', background: 'none', border: 'none', color: currentQty === maxQty ? 'rgba(255,255,255,0.15)' : 'rgba(232,119,34,0.7)', cursor: currentQty === maxQty ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
          >+</button>
        </div>
      )}

      {/* Remove btn */}
      <button
        onClick={handleRemove} disabled={removing}
        style={{ padding: '0.4rem 1rem', background: 'rgba(255,107,107,0.08)', color: 'rgba(255,107,107,0.6)', border: '1px solid rgba(255,107,107,0.1)', borderRadius: '10px', cursor: removing ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: '600', transition: 'all 0.3s ease', whiteSpace: 'nowrap', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.08)'; e.currentTarget.style.color = 'rgba(255,107,107,0.6)' }}
      >{removing ? '...' : 'Remove'}</button>
    </div>
  )
}

function Cart() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [guestItems, setGuestItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkedOut, setCheckedOut] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)

  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  useEffect(() => {
    if (!isLoggedIn) {
      setGuestItems(JSON.parse(localStorage.getItem('guestCart') || '[]'))
      setLoading(false)
      return
    }
    const fetchCart = async () => {
      try {
        setLoading(true)
        const res = await API.get('/cart')
        setCartItems(res.data)
      } catch (err) {
        console.error('Failed to load cart', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCart()
  }, [])

  function handleRemove(id) { setCartItems(prev => prev.filter(c => c.id !== id)) }
  function handleQtyChange(id, newQty) {
    setCartItems(prev => prev.map(c => c.id === id ? { ...c, quantity: newQty } : c))
  }
  function handleGuestRemove(itemId) {
    const updated = guestItems.filter(i => i.id !== itemId)
    setGuestItems(updated)
    localStorage.setItem('guestCart', JSON.stringify(updated))
  }
  function handleGuestQtyChange(itemId, newQty) {
    const updated = guestItems.map(i => i.id === itemId ? { ...i, cartQty: newQty } : i)
    setGuestItems(updated)
    localStorage.setItem('guestCart', JSON.stringify(updated))
  }

  const availableItems = cartItems.filter(c => c.item?.status?.toLowerCase() === 'available')
  const unavailableItems = cartItems.filter(c => c.item?.status?.toLowerCase() !== 'available')
  const totalPrice = availableItems.reduce((sum, c) => sum + ((c.item?.price || 0) * (c.quantity || 1)), 0).toFixed(2)
  const guestTotal = guestItems.reduce((sum, i) => sum + ((i.price || 0) * (i.cartQty || 1)), 0).toFixed(2)

  async function handleCheckout() {
    if (!window.confirm(`Buy all ${availableItems.length} available item(s) for ₹${totalPrice}?`)) return
    try {
      setCheckingOut(true)
      await API.post('/cart/checkout')
      setCheckedOut(true)
      setCartItems([])
    } catch (err) {
      alert(err.response?.data?.error || 'Checkout failed.')
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <div onClick={() => navigate(-1)} style={{ minHeight: 'calc(100vh - 70px)', padding: '3rem 4rem', cursor: 'default' }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <button onClick={() => navigate(-1)}
              style={{ padding: '0.4rem 0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.3s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >← Back</button>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', lineHeight: '1', color: 'white', margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'baseline', gap: '0.5rem', justifyContent: 'center' }}>
              My <span style={{ background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Cart.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: 0 }}>
              {isLoggedIn ? `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your cart` : `${guestItems.length} item${guestItems.length !== 1 ? 's' : ''} in your cart`}
            </p>
          </div>
          <div />
        </div>

        {/* Guest cart */}
        {!isLoggedIn && !loading && (
          guestItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>🛒</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Your cart is empty</p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Browse items and add them to your cart</p>
              <button onClick={() => navigate('/')} style={{ padding: '0.7rem 2rem', background: 'linear-gradient(135deg, #e87722, #f09030)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', boxShadow: '0 4px 15px rgba(232,119,34,0.3)' }}>Browse Items →</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.75rem' }}>Items ({guestItems.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {guestItems.map(item => (
                    <CartItem key={item.id} cartItem={item} onRemove={handleGuestRemove} onQtyChange={handleGuestQtyChange} />
                  ))}
                </div>
              </div>
              <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', margin: '1.5rem 0' }} />
              <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
                <div style={{ fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '1rem' }}>Order Summary</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{guestItems.length} item{guestItems.length !== 1 ? 's' : ''}</span>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: '0.85rem' }}>₹{guestTotal}</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '1rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: '1rem' }}>Total</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-1px', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{guestTotal}</span>
                </div>
                <button onClick={() => navigate('/login', { state: { from: '/cart' } })}
                  style={{ width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg, #e87722, #f09030)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(232,119,34,0.3)' }}>
                  Sign In to Buy →
                </button>
                <p style={{ textAlign: 'center', marginTop: '0.75rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Your cart will be saved when you sign in</p>
              </div>
            </>
          )
        )}

        {/* Success */}
        {checkedOut && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(81,207,102,0.06)', border: '1px solid rgba(81,207,102,0.15)', borderRadius: '20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ color: '#51cf66', fontWeight: '800', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Purchase Successful!</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Your items have been purchased. Check your transaction history.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => navigate('/')} style={{ padding: '0.7rem 1.5rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>Browse More</button>
              <button onClick={() => navigate('/transactions')} style={{ padding: '0.7rem 1.5rem', background: 'linear-gradient(135deg, #e87722, #f09030)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', boxShadow: '0 4px 15px rgba(232,119,34,0.3)' }}>View Transactions →</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoggedIn && !checkedOut && loading && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #e87722', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading cart...</p>
          </div>
        )}

        {/* Empty logged in */}
        {isLoggedIn && !checkedOut && !loading && cartItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>🛒</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Your cart is empty</p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Browse items and add them to your cart</p>
            <button onClick={() => navigate('/')} style={{ padding: '0.7rem 2rem', background: 'linear-gradient(135deg, #e87722, #f09030)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', boxShadow: '0 4px 15px rgba(232,119,34,0.3)' }}>Browse Items →</button>
          </div>
        )}

        {/* Logged-in cart */}
        {isLoggedIn && !checkedOut && !loading && cartItems.length > 0 && (
          <>
            {availableItems.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '0.75rem' }}>Available ({availableItems.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {availableItems.map(c => <CartItem key={c.id} cartItem={c} onRemove={handleRemove} onQtyChange={handleQtyChange} />)}
                </div>
              </div>
            )}
            {unavailableItems.length > 0 && (
              <div style={{ marginBottom: '1.5rem', opacity: 0.6 }}>
                <p style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,107,107,0.5)', marginBottom: '0.75rem' }}>No Longer Available ({unavailableItems.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {unavailableItems.map(c => <CartItem key={c.id} cartItem={c} onRemove={handleRemove} onQtyChange={handleQtyChange} />)}
                </div>
              </div>
            )}

            <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', margin: '1.5rem 0' }} />

            <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
              <div style={{ fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '1rem' }}>Order Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{availableItems.length} item{availableItems.length !== 1 ? 's' : ''}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: '0.85rem' }}>₹{totalPrice}</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '1rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: '1rem' }}>Total</span>
                <span style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-1px', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₹{totalPrice}</span>
              </div>
              <button onClick={handleCheckout} disabled={checkingOut || availableItems.length === 0}
                style={{ width: '100%', padding: '0.9rem', background: checkingOut || availableItems.length === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #e87722, #f09030)', color: checkingOut || availableItems.length === 0 ? 'rgba(255,255,255,0.25)' : 'white', border: 'none', borderRadius: '12px', cursor: checkingOut || availableItems.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.3s ease', boxShadow: availableItems.length > 0 && !checkingOut ? '0 4px 15px rgba(232,119,34,0.3)' : 'none' }}>
                {checkingOut ? 'Processing...' : `Buy Now — ₹${totalPrice}`}
              </button>
              {unavailableItems.length > 0 && (
                <p style={{ textAlign: 'center', marginTop: '0.75rem', color: 'rgba(255,107,107,0.5)', fontSize: '0.75rem' }}>
                  {unavailableItems.length} item{unavailableItems.length !== 1 ? 's' : ''} no longer available will be skipped.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Cart