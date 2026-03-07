import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

// ── Transaction Detail Modal ──────────────────────────────────
function TxnDetailModal({ txn, onClose }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isBuyer = txn.buyer_id === user.id
  const isDeleted = !txn.item_id
  const showListingRemoved = isDeleted && !isBuyer

  const qty = txn.quantity || 1
  const totalPrice = txn.price
  const unitPrice = qty > 1 ? Math.round(totalPrice / qty) : totalPrice

  const [activeImg, setActiveImg] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const images = txn.images && txn.images.length > 0 ? txn.images : []

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: '1.5rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="txn-detail-modal" style={{ background: 'linear-gradient(135deg, rgba(22,20,30,0.98) 0%, rgba(14,12,20,0.98) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '2.5rem', maxWidth: '520px', width: '100%', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />

        {/* Close button */}
        <button onClick={onClose}
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
        >&times;</button>

        {/* Category badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
          {txn.category && (
            <span style={{ fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{txn.category}</span>
          )}
          {showListingRemoved && (
            <span style={{ fontSize: '0.6rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,107,107,0.7)', fontWeight: '700', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', padding: '2px 8px', borderRadius: '20px' }}>Listing Removed</span>
          )}
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px', color: 'rgba(255,255,255,0.95)', margin: '0 0 1.5rem 0', lineHeight: 1.1 }}>
          {txn.item_title || 'Deleted Item'}
        </h2>

        {/* Images — slide animation, arrows, zoom */}
        {images.length > 0 && (
          <div style={{ marginBottom: '1.5rem', position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)', height: '200px', cursor: 'zoom-in' }}
            onClick={() => setZoomed(true)}
          >
            {/* Sliding track */}
            <div style={{
              display: 'flex', width: '100%', height: '100%',
              transform: `translateX(-${activeImg * 100}%)`,
              transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}>
              {images.map((img, i) => (
                <div key={i} style={{ minWidth: '100%', height: '100%', flexShrink: 0 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                </div>
              ))}
            </div>
            {images.length > 1 && activeImg > 0 && (
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => i - 1) }}
                style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', zIndex: 2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            {images.length > 1 && activeImg < images.length - 1 && (
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => i + 1) }}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', zIndex: 2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
            {images.length > 1 && (
              <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.6rem', fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.75)', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '20px', backdropFilter: 'blur(6px)', zIndex: 2 }}>
                {activeImg + 1} / {images.length}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.6rem', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.5)', padding: '2px 7px', borderRadius: '20px', backdropFilter: 'blur(6px)', zIndex: 2 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </div>
          </div>
        )}
        {/* Zoom modal */}
        {zoomed && images.length > 0 && (
          <div onClick={() => setZoomed(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
            <img src={images[activeImg]} alt="" style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '10px' }} onClick={e => e.stopPropagation()} />
            {images.length > 1 && activeImg > 0 && (
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => i - 1) }} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            {images.length > 1 && activeImg < images.length - 1 && (
              <button onClick={e => { e.stopPropagation(); setActiveImg(i => i + 1) }} style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
            {images.length > 1 && (
              <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '20px' }}>
                {activeImg + 1} / {images.length}
              </div>
            )}
          </div>
        )}

        {/* Price */}
        <div style={{ marginBottom: '1.75rem' }}>
          {qty > 1 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
                  &#8377;{unitPrice}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>per unit</span>
              </div>
              <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>
                  &#8377;{unitPrice} &times; {qty} units
                </span>
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>=</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'rgba(255,255,255,0.7)' }}>
                  &#8377;{totalPrice} total
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
              &#8377;{totalPrice}
            </div>
          )}
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', marginBottom: '1.5rem' }} />

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.5rem' }}>
          {[
            { label: isBuyer ? 'Seller' : 'Buyer', value: isBuyer ? txn.seller_name : txn.buyer_name },
            { label: 'Category', value: txn.category || '—' },
            { label: 'Role', value: isBuyer ? 'Bought' : 'Sold', isRole: true },
            { label: 'Quantity', value: `${qty} unit${qty > 1 ? 's' : ''}` },
            { label: 'Date', value: txn.created_at ? new Date(txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—', fullWidth: true },
          ].map(({ label, value, isRole, fullWidth }) => (
            <div key={label} style={{ gridColumn: fullWidth ? '1 / -1' : 'auto', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.85rem 1rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
              <div style={{ fontSize: '0.58rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: '0.35rem', fontWeight: '700' }}>{label}</div>
              {isRole ? (
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isBuyer ? '#74b9ff' : '#51cf66', background: isBuyer ? 'rgba(116,185,255,0.1)' : 'rgba(81,207,102,0.1)', padding: '2px 10px', borderRadius: '20px', border: isBuyer ? '1px solid rgba(116,185,255,0.15)' : '1px solid rgba(81,207,102,0.15)' }}>
                  {value}
                </span>
              ) : (
                <div style={{ fontWeight: '600', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', letterSpacing: '-0.2px' }}>{value}</div>
              )}
            </div>
          ))}
        </div>

        {/* Status bar */}
        <div style={{ textAlign: 'center', padding: '0.75rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '600', letterSpacing: '0.3px', background: isBuyer ? 'rgba(116,185,255,0.06)' : 'rgba(81,207,102,0.06)', border: isBuyer ? '1px solid rgba(116,185,255,0.1)' : '1px solid rgba(81,207,102,0.1)', color: isBuyer ? 'rgba(116,185,255,0.6)' : 'rgba(81,207,102,0.6)' }}>
          {isBuyer ? 'Purchase completed' : 'Sale completed'}
        </div>

        {showListingRemoved && (
          <div style={{ marginTop: '0.65rem', textAlign: 'center', padding: '0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '500', color: 'rgba(255,107,107,0.45)', background: 'rgba(255,107,107,0.04)', border: '1px solid rgba(255,107,107,0.08)' }}>
            You removed this listing after the sale
          </div>
        )}
      </div>
    </div>
  )
}

// ── Transaction Row ───────────────────────────────────────────
function TransactionRow({ txn, selectMode, selected, onToggle, onDelete, onOpen }) {
  const [hovered, setHovered] = useState(false)
  const [trashHovered, setTrashHovered] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isBuyer = txn.buyer_id === user.id
  const role = isBuyer ? 'Bought' : 'Sold'
  const otherParty = isBuyer ? (txn.seller_name || 'Seller') : (txn.buyer_name || 'Buyer')
  const qty = txn.quantity || 1

  function handleClick() {
    if (selectMode) { onToggle(); return }
    onOpen()
  }

  const showCheckbox = hovered || selectMode
  const showTrash = selected

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        background: selected
          ? 'linear-gradient(135deg, rgba(var(--accent-rgb),0.12) 0%, rgba(var(--accent-rgb),0.04) 100%)'
          : hovered
          ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: selected ? '1px solid rgba(var(--accent-rgb),0.3)' : hovered ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '1.25rem 1.5rem',
        transition: 'all 0.2s ease', cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        boxShadow: selected ? '0 4px 20px rgba(var(--accent-rgb),0.1)' : hovered ? '0 8px 24px rgba(0,0,0,0.18)' : '0 4px 15px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      {/* Checkbox */}
      <div
        onClick={e => { e.stopPropagation(); onToggle() }}
        style={{
          width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
          border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.18)',
          background: selected ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: selected ? '0 2px 10px rgba(var(--accent-rgb),0.45)' : 'none',
          opacity: showCheckbox ? 1 : 0,
          transform: showCheckbox ? 'scale(1)' : 'scale(0.7)',
          pointerEvents: showCheckbox ? 'auto' : 'none',
        }}>
        {selected && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {txn.item_title || 'Deleted Item'}
          </h3>
          {qty > 1 && (
            <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.5px', background: 'rgba(var(--accent-rgb),0.15)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.3)', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>&times;{qty}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            &#8377;{txn.price}
          </span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600' }}>{otherParty}</span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: isBuyer ? '#74b9ff' : '#51cf66', background: isBuyer ? 'rgba(116,185,255,0.1)' : 'rgba(81,207,102,0.1)', padding: '2px 10px', borderRadius: '20px', border: isBuyer ? '1px solid rgba(116,185,255,0.15)' : '1px solid rgba(81,207,102,0.15)' }}>{role}</span>
          {txn.created_at && (
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
              {new Date(txn.created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Right — trash or arrow */}
      <div style={{ flexShrink: 0, width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {showTrash ? (
          <div
            onClick={e => { e.stopPropagation(); onDelete() }}
            onMouseEnter={() => setTrashHovered(true)}
            onMouseLeave={() => setTrashHovered(false)}
            style={{ width: '32px', height: '32px', borderRadius: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: trashHovered ? 'rgba(255,77,77,0.18)' : 'rgba(255,107,107,0.08)', border: trashHovered ? '1px solid rgba(255,77,77,0.35)' : '1px solid rgba(255,107,107,0.12)', transition: 'all 0.2s ease', boxShadow: trashHovered ? '0 0 14px rgba(255,77,77,0.25)' : 'none', transform: trashHovered ? 'scale(1.1)' : 'scale(1)' }}>
            <svg width="14" height="15" viewBox="0 0 16 17" fill="none">
              <path d="M2 4h12" stroke={trashHovered ? '#ff4d4d' : 'rgba(255,107,107,0.7)'} strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4" stroke={trashHovered ? '#ff4d4d' : 'rgba(255,107,107,0.7)'} strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M3.5 4.5l.75 9.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75l.75-9.5" stroke={trashHovered ? '#ff4d4d' : 'rgba(255,107,107,0.7)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 7.5v4M9.5 7.5v4" stroke={trashHovered ? '#ff4d4d' : 'rgba(255,107,107,0.5)'} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
        ) : (
          <span style={{ color: hovered ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)', transition: 'color 0.2s ease', fontSize: '1rem' }}>&#8594;</span>
        )}
      </div>
    </div>
  )
}

// ── Confirm Modal ─────────────────────────────────────────────
function ConfirmModal({ count, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, rgba(22,20,30,0.99) 0%, rgba(14,12,20,0.99) 100%)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '20px', padding: '2rem 2.25rem', maxWidth: '340px', width: '90%', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <svg width="20" height="21" viewBox="0 0 16 17" fill="none">
            <path d="M2 4h12" stroke="#ff4d4d" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4" stroke="#ff4d4d" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M3.5 4.5l.75 9.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75l.75-9.5" stroke="#ff4d4d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 7.5v4M9.5 7.5v4" stroke="rgba(255,77,77,0.7)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.4rem' }}>Delete {count > 1 ? `${count} transactions` : 'this transaction'}?</h3>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #ff4d4d, #e03030)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', boxShadow: '0 4px 15px rgba(255,77,77,0.3)' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
function Transactions() {
  const navigate = useNavigate()
  // ── Draggable back button ──────────────────────────────────
  const [draggable, setDraggable] = useState(() => {
    try { return JSON.parse(localStorage.getItem('floatingDraggable') ?? 'false') } catch { return false }
  })
  useEffect(() => {
    const sync = () => {
      try { setDraggable(JSON.parse(localStorage.getItem('floatingDraggable') ?? 'false')) } catch {}
    }
    window.addEventListener('floatingDraggableChanged', sync)
    return () => window.removeEventListener('floatingDraggableChanged', sync)
  }, [])
  const backRef = useRef(null)
  useEffect(() => {
    if (!backRef.current) return
    if (!draggable) {
      backRef.current.style.transform = ''
      backRef.current.style.transition = ''
      backRef.current.style.zIndex = ''
      backRef.current.style.cursor = ''
      localStorage.removeItem('drag_backbtn_txn')
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('drag_backbtn_txn'))
        if (saved) backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`
      } catch {}
    }
  }, [draggable])
  useEffect(() => {
    if (!draggable || !backRef.current) return
    try {
      const saved = JSON.parse(localStorage.getItem('drag_backbtn_txn'))
      if (saved) backRef.current.style.transform = `translate(${saved.dx}px, ${saved.dy}px)`
    } catch {}
  }, [])
  const startBackDrag = useCallback((clientX, clientY) => {
    if (!draggable || !backRef.current) return
    const el = backRef.current
    const match = el.style.transform.match(/translate\(([-.0-9]+)px,\s*([-.0-9]+)px\)/)
    const baseDx = match ? parseFloat(match[1]) : 0
    const baseDy = match ? parseFloat(match[2]) : 0
    let dx = baseDx, dy = baseDy
    let hasDragged = false
    let rafId = null
    el.style.transition = 'none'
    el.style.zIndex = '9999'
    el.style.cursor = 'grabbing'
    const onMove = (cx, cy) => {
      dx = baseDx + (cx - clientX)
      dy = baseDy + (cy - clientY)
      if (Math.abs(cx - clientX) > 4 || Math.abs(cy - clientY) > 4) hasDragged = true
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        el.style.transform = `translate(${dx}px, ${dy}px)`
      })
    }
    const onUp = () => {
      if (rafId) cancelAnimationFrame(rafId)
      el.style.cursor = 'grab'
      el.style.transition = ''
      el.style.zIndex = ''
      if (hasDragged) {
        localStorage.setItem('drag_backbtn_txn', JSON.stringify({ dx, dy }))
        const kill = (ce) => { ce.stopPropagation(); ce.preventDefault(); window.removeEventListener('click', kill, true) }
        window.addEventListener('click', kill, true)
      }
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onUp)
    }
    const onMouseMove = (e) => onMove(e.clientX, e.clientY)
    const onTouchMove = (e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }, [draggable])
  const onBackMouseDown = useCallback((e) => { e.preventDefault(); startBackDrag(e.clientX, e.clientY) }, [startBackDrag])
  const onBackTouchStart = useCallback((e) => { startBackDrag(e.touches[0].clientX, e.touches[0].clientY) }, [startBackDrag])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [confirmIds, setConfirmIds] = useState(null)
  const [search, setSearch] = useState('')
  const [openTxn, setOpenTxn] = useState(null)

  useEffect(() => {
    API.get('/transactions')
      .then(r => setTransactions(r.data))
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { setSelectMode(false); setSelected(new Set()) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const baseFiltered = filter === 'All'
    ? transactions
    : filter === 'Bought'
    ? transactions.filter(t => t.buyer_id === user.id)
    : transactions.filter(t => t.seller_id === user.id)

  const filtered = search.trim()
    ? baseFiltered.filter(t => {
        const q = search.toLowerCase()
        return (
          (t.item_title || '').toLowerCase().includes(q) ||
          (t.buyer_name || '').toLowerCase().includes(q) ||
          (t.seller_name || '').toLowerCase().includes(q)
        )
      })
    : baseFiltered

  function toggleSelect(id) {
    if (!selectMode) setSelectMode(true)
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      if (next.size === 0) setSelectMode(false)
      return next
    })
  }

  async function confirmDelete(ids) {
    setConfirmIds(null)
    for (const id of ids) {
      try {
        await API.delete(`/transactions/${id}`)
        setTransactions(prev => prev.filter(t => t.id !== id))
      } catch {}
    }
    setSelectMode(false)
    setSelected(new Set())
  }

  return (
    <div className="txn-page" style={{ padding: '5rem 4rem 3rem', maxWidth: '900px', margin: '0 auto' }}>
      <style>{`
        /* ── Tablet: 769px – 1024px ── */
        @media (min-width: 769px) and (max-width: 1024px) {
          .txn-page { padding: 4rem 2rem 3rem !important; }
          .txn-back-btn { left: -36px !important; }
          .txn-header h1 { font-size: 2.2rem !important; letter-spacing: -1.2px !important; }
          .txn-detail-modal { padding: 2rem !important; max-width: 92vw !important; }
        }

        /* ── Wide: > 1280px ── */
        @media (min-width: 1280px) {
          .txn-page { padding: 6rem 5rem 3rem !important; }
          .txn-back-btn { left: -60px !important; }
        }

        /* ── Mobile: < 768px ── */
        @media (max-width: 768px) {
          .txn-page { padding: 3.5rem 1.25rem 3rem !important; }
          .txn-back-btn { position: relative !important; left: 0 !important; top: 0 !important; margin-bottom: 1rem !important; }
          .txn-header { padding-left: 0 !important; }
          .txn-header h1 { font-size: 2rem !important; letter-spacing: -1px !important; }
          .txn-filter-row { flex-wrap: wrap !important; }
          .txn-detail-modal { padding: 1.5rem !important; }
        }
        @media (max-width: 480px) {
          .txn-page { padding: 3rem 0.875rem 3rem !important; }
          .txn-header h1 { font-size: 1.6rem !important; }
        }
      `}</style>

      {openTxn && <TxnDetailModal txn={openTxn} onClose={() => setOpenTxn(null)} />}

      {confirmIds && (
        <ConfirmModal
          count={confirmIds.length}
          onConfirm={() => confirmDelete(confirmIds)}
          onCancel={() => setConfirmIds(null)}
        />
      )}

      {/* Header */}
      <div className="txn-header" style={{ marginBottom: '2.5rem', position: 'relative' }}>
        <button
          ref={backRef} onClick={() => navigate(-1)} onMouseDown={onBackMouseDown} onTouchStart={onBackTouchStart}
          className="txn-back-btn" style={{ position: 'absolute', left: '-50px', top: '6px', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: draggable ? 'grab' : 'pointer', flexShrink: 0, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.boxShadow='0 0 8px 2px rgba(var(--accent-rgb),0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.boxShadow = 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', lineHeight: '1.05', marginBottom: '0.6rem', color: 'white' }}>
          My<br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-alt))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Transactions.</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: '400' }}>All your purchases and sales in one place.</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.2" strokeLinecap="round" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by item, buyer, or seller..."
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 1rem 0.65rem 2.75rem', background: 'rgba(255,255,255,0.07)', border: search ? '1px solid rgba(var(--accent-rgb),0.35)' : '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: 'white', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', transition: 'border 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          onFocus={e => { e.target.style.border = '1px solid rgba(var(--accent-rgb),0.4)'; e.target.style.boxShadow = '0 2px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          onBlur={e => { e.target.style.border = search ? '1px solid rgba(var(--accent-rgb),0.35)' : '1px solid rgba(255,255,255,0.12)'; e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}
        />
        {search && (
          <div onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '1rem', lineHeight: 1 }}>&times;</div>
        )}
      </div>

      {/* Filter + Select row */}
      <div className="txn-filter-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['All', 'Bought', 'Sold'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', border: filter === f ? '1px solid transparent' : '1px solid rgba(255,255,255,0.12)', background: filter === f ? 'linear-gradient(135deg, var(--accent), var(--accent-alt))' : 'rgba(255,255,255,0.08)', color: filter === f ? 'white' : 'rgba(255,255,255,0.65)', boxShadow: filter === f ? 'var(--shadow-accent)' : '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)' }}>{f}</button>
          ))}
        </div>
        {filtered.length > 0 && (
          <button onClick={() => { setSelectMode(v => !v); setSelected(new Set()) }} style={{ padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', background: selectMode ? 'rgba(var(--accent-rgb),0.1)' : 'rgba(255,255,255,0.04)', border: selectMode ? '1px solid rgba(var(--accent-rgb),0.3)' : '1px solid rgba(255,255,255,0.06)', color: selectMode ? 'var(--accent)' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        )}
      </div>

      {/* Select toolbar */}
      {selectMode && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(var(--accent-rgb),0.07) 0%, rgba(var(--accent-rgb),0.02) 100%)', border: '1px solid rgba(var(--accent-rgb),0.18)', borderRadius: '14px', padding: '0.75rem 1.25rem', marginBottom: '1rem', animation: 'fadeSlideIn 0.2s ease' }}>
          <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(-5px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: '600' }}>{selected.size} selected</span>
            <button
              onClick={() => { if (selected.size === filtered.length) { setSelected(new Set()); setSelectMode(false) } else setSelected(new Set(filtered.map(t => t.id))) }}
              style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            >{selected.size === filtered.length ? 'Deselect All' : 'Select All'}</button>
          </div>
          <button
            disabled={selected.size === 0}
            onClick={() => selected.size > 0 && setConfirmIds([...selected])}
            style={{ padding: '0.35rem 1rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: selected.size === 0 ? 'not-allowed' : 'pointer', background: selected.size > 0 ? 'rgba(255,77,77,0.1)' : 'rgba(255,255,255,0.03)', border: selected.size > 0 ? '1px solid rgba(255,77,77,0.22)' : '1px solid rgba(255,255,255,0.05)', color: selected.size > 0 ? '#ff6b6b' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s ease' }}>
            <svg width="12" height="12" viewBox="0 0 16 17" fill="none">
              <path d="M2 4h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M3.5 4.5l.75 9.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75l.75-9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Bought', value: transactions.filter(t => t.buyer_id === user.id).length },
          { label: 'Sold',   value: transactions.filter(t => t.seller_id === user.id).length },
          { label: 'Total',  value: transactions.length },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '0.85rem 1.25rem', minWidth: '80px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
            <div style={{ fontSize: '0.55rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '0.25rem' }}>{stat.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.5px' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))', marginBottom: '1.5rem' }} />
      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', marginBottom: '1rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
      </p>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #e87722', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading transactions...</p>
        </div>
      )}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '20px', color: '#ff6b6b' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{error}</p>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.4 }}>&#8709;</div>
          <p style={{ fontSize: '1rem', fontWeight: '500', color: 'rgba(255,255,255,0.35)' }}>No transactions yet.</p>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(txn => (
            <TransactionRow
              key={txn.id}
              txn={txn}
              selectMode={selectMode}
              selected={selected.has(txn.id)}
              onToggle={() => toggleSelect(txn.id)}
              onDelete={() => setConfirmIds([txn.id])}
              onOpen={() => setOpenTxn(txn)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Transactions