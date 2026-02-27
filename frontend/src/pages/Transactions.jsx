import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

// ── Transaction Row ───────────────────────────────────────────
function TransactionRow({ txn, selectMode, selected, onToggle, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [trashHovered, setTrashHovered] = useState(false)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isBuyer = txn.buyer_id === user.id
  const role = isBuyer ? 'Bought' : 'Sold'
  const otherParty = isBuyer ? (txn.seller_name || 'Seller') : (txn.buyer_name || 'Buyer')

  function handleClick(e) {
    if (selectMode) { onToggle(); return }
    if (txn.item_id) navigate(`/items/${txn.item_id}`, { state: { from: '/transactions' } })
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
          ? 'linear-gradient(135deg, rgba(232,119,34,0.12) 0%, rgba(232,119,34,0.04) 100%)'
          : hovered
          ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: selected
          ? '1px solid rgba(232,119,34,0.3)'
          : hovered ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '1.25rem 1.5rem',
        transition: 'all 0.2s ease', cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        boxShadow: selected
          ? '0 4px 20px rgba(232,119,34,0.1)'
          : hovered ? '0 8px 24px rgba(0,0,0,0.18)' : '0 4px 15px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      {/* Checkbox */}
      <div
        onClick={e => { e.stopPropagation(); onToggle() }}
        style={{
          width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
          border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.18)',
          background: selected ? 'linear-gradient(135deg, #e87722, #f09030)' : 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: selected ? '0 2px 10px rgba(232,119,34,0.45)' : 'none',
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
          {/* ✅ Quantity badge */}
          {txn.quantity > 1 && (
            <span style={{
              fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.5px',
              background: 'rgba(232,119,34,0.15)', color: '#e87722',
              border: '1px solid rgba(232,119,34,0.3)',
              padding: '2px 8px', borderRadius: '20px', flexShrink: 0,
            }}>×{txn.quantity}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* ✅ Show snapshot total price, with unit breakdown if qty > 1 */}
          <span style={{ fontWeight: '800', fontSize: '0.95rem', background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            ₹{txn.price}
          </span>
          {txn.quantity > 1 && (
            <span style={{ fontSize: '0.72rem', color: 'rgba(232,119,34,0.55)', fontWeight: '500' }}>
              ₹{(txn.price / txn.quantity).toFixed(2)} × {txn.quantity}
            </span>
          )}

          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600' }}>{otherParty}</span>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <span style={{
            fontSize: '0.7rem', fontWeight: '700',
            color: isBuyer ? '#74b9ff' : '#51cf66',
            background: isBuyer ? 'rgba(116,185,255,0.1)' : 'rgba(81,207,102,0.1)',
            padding: '2px 10px', borderRadius: '20px',
            border: isBuyer ? '1px solid rgba(116,185,255,0.15)' : '1px solid rgba(81,207,102,0.15)',
          }}>{role}</span>
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
            title="Delete transaction"
            style={{
              width: '32px', height: '32px', borderRadius: '9px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: trashHovered ? 'rgba(255,77,77,0.18)' : 'rgba(255,107,107,0.08)',
              border: trashHovered ? '1px solid rgba(255,77,77,0.35)' : '1px solid rgba(255,107,107,0.12)',
              transition: 'all 0.2s ease',
              boxShadow: trashHovered ? '0 0 14px rgba(255,77,77,0.25)' : 'none',
              transform: trashHovered ? 'scale(1.1)' : 'scale(1)',
            }}>
            <svg width="14" height="15" viewBox="0 0 16 17" fill="none" style={{ transition: 'all 0.2s ease' }}>
              <path d="M2 4h12" stroke={trashHovered ? '#ff4d4d' : 'rgba(255,107,107,0.7)'} strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4" stroke={trashHovered ? '#ff4d4d' : 'rgba(255,107,107,0.7)'} strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M3.5 4.5l.75 9.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75l.75-9.5" stroke={trashHovered ? '#ff4d4d' : 'rgba(255,107,107,0.7)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 7.5v4M9.5 7.5v4" stroke={trashHovered ? '#ff4d4d' : 'rgba(255,107,107,0.5)'} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
        ) : (
          <span style={{ color: hovered ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)', transition: 'color 0.2s ease', fontSize: '1rem' }}>
            {txn.item_id ? '→' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Confirm Modal ─────────────────────────────────────────────
function ConfirmModal({ count, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}
      onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, rgba(22,20,30,0.99) 0%, rgba(14,12,20,0.99) 100%)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '20px', padding: '2rem 2.25rem', maxWidth: '340px', width: '90%', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <svg width="20" height="21" viewBox="0 0 16 17" fill="none">
            <path d="M2 4h12" stroke="#ff4d4d" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M6 4V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V4" stroke="#ff4d4d" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M3.5 4.5l.75 9.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75l.75-9.5" stroke="#ff4d4d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 7.5v4M9.5 7.5v4" stroke="rgba(255,77,77,0.7)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
          Delete {count > 1 ? `${count} transactions` : 'this transaction'}?
        </h3>
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
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [confirmIds, setConfirmIds] = useState(null) // null | number[] — ids pending delete confirm

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

  const filtered = filter === 'All'
    ? transactions
    : filter === 'Bought'
    ? transactions.filter(t => t.buyer_id === user.id)
    : transactions.filter(t => t.seller_id === user.id)

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
    <div style={{ padding: '3rem 4rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Confirm modal */}
      {confirmIds && (
        <ConfirmModal
          count={confirmIds.length}
          onConfirm={() => confirmDelete(confirmIds)}
          onCancel={() => setConfirmIds(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', lineHeight: '1.05', marginBottom: '0.6rem', color: 'white' }}>
          My<br />
          <span style={{ background: 'linear-gradient(135deg, #e87722, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Transactions.</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: '400' }}>All your purchases and sales in one place.</p>
      </div>

      {/* Filter + Select row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['All', 'Bought', 'Sold'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease',
              border: filter === f ? '1px solid transparent' : '1px solid rgba(255,255,255,0.06)',
              background: filter === f ? 'linear-gradient(135deg, #e87722, #f09030)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? 'white' : 'rgba(255,255,255,0.45)',
              boxShadow: filter === f ? '0 4px 15px rgba(232,119,34,0.3)' : 'none',
            }}>{f}</button>
          ))}
        </div>
        {filtered.length > 0 && (
          <button onClick={() => { setSelectMode(v => !v); setSelected(new Set()) }} style={{
            padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease',
            background: selectMode ? 'rgba(232,119,34,0.1)' : 'rgba(255,255,255,0.04)',
            border: selectMode ? '1px solid rgba(232,119,34,0.3)' : '1px solid rgba(255,255,255,0.06)',
            color: selectMode ? '#e87722' : 'rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        )}
      </div>

      {/* Select mode toolbar */}
      {selectMode && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(232,119,34,0.07) 0%, rgba(232,119,34,0.02) 100%)',
          border: '1px solid rgba(232,119,34,0.18)', borderRadius: '14px',
          padding: '0.75rem 1.25rem', marginBottom: '1rem',
          animation: 'fadeSlideIn 0.2s ease',
        }}>
          <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(-5px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: '600' }}>{selected.size} selected</span>
            <button
              onClick={() => {
                if (selected.size === filtered.length) { setSelected(new Set()); setSelectMode(false) }
                else setSelected(new Set(filtered.map(t => t.id)))
              }}
              style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            >{selected.size === filtered.length ? 'Deselect All' : 'Select All'}</button>
          </div>
          <button
            disabled={selected.size === 0}
            onClick={() => selected.size > 0 && setConfirmIds([...selected])}
            style={{
              padding: '0.35rem 1rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700',
              cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
              background: selected.size > 0 ? 'rgba(255,77,77,0.1)' : 'rgba(255,255,255,0.03)',
              border: selected.size > 0 ? '1px solid rgba(255,77,77,0.22)' : '1px solid rgba(255,255,255,0.05)',
              color: selected.size > 0 ? '#ff6b6b' : 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s ease',
            }}>
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
          <div key={stat.label} style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '0.85rem 1.25rem', minWidth: '80px', position: 'relative', overflow: 'hidden' }}>
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
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.4 }}>∅</div>
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Transactions