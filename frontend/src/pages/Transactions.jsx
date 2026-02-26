import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api/axios'

function TransactionRow({ txn }) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isBuyer = txn.buyer_id === user.id
  const role = isBuyer ? 'Bought' : 'Sold'
  const otherParty = isBuyer
    ? (txn.seller_name || txn.seller_username || 'Seller')
    : (txn.buyer_name || txn.buyer_username || 'Buyer')

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/items/${txn.item_id || txn.id}`)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: hovered
          ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', padding: '1.35rem 1.75rem',
        transition: 'all 0.3s ease', cursor: 'pointer', position: 'relative', overflow: 'hidden',
        boxShadow: hovered
          ? '0 12px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 4px 15px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      }} />

      {/* Left info */}
      <div>
        <h3 style={{
          margin: 0, fontSize: '1.05rem', fontWeight: '700',
          color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.3px',
        }}>{txn.item_title || txn.title}</h3>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center' }}>
          <span style={{
            fontWeight: '800', fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>₹{txn.price || txn.amount}</span>

          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />

          <span style={{
            color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px',
          }}>{otherParty}</span>

          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />

          <span style={{
            fontSize: '0.7rem', fontWeight: '700',
            color: isBuyer ? '#74b9ff' : '#51cf66',
            background: isBuyer ? 'rgba(116,185,255,0.1)' : 'rgba(81,207,102,0.1)',
            padding: '2px 10px', borderRadius: '20px',
            border: isBuyer ? '1px solid rgba(116,185,255,0.15)' : '1px solid rgba(81,207,102,0.15)',
          }}>{role}</span>
        </div>

        {txn.created_at && (
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.4rem' }}>
            {new Date(txn.created_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div style={{
        color: hovered ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
        transition: 'color 0.3s ease', fontSize: '1.1rem',
      }}>→</div>
    </div>
  )
}

function Transactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await API.get('/transactions')
        setTransactions(res.data)
      } catch (err) {
        setError('Failed to load transactions.')
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const filtered = filter === 'All'
    ? transactions
    : filter === 'Bought'
      ? transactions.filter(t => t.buyer_id === user.id)
      : transactions.filter(t => t.seller_id === user.id)

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) navigate(-1) }}
      style={{ padding: '3rem 4rem', maxWidth: '900px', margin: '0 auto', cursor: 'default' }}
    >

      {/* Header */}
      <div style={{ marginBottom: '2.5rem', pointerEvents: 'none' }}>
        <h1 style={{
          fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px',
          lineHeight: '1.05', marginBottom: '0.6rem', color: 'white',
        }}>
          My<br />
          <span style={{
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Transactions.</span>
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem',
          marginTop: '0.5rem', fontWeight: '400', letterSpacing: '0.2px',
        }}>
          All your purchases and sales in one place.
        </p>
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {['All', 'Bought', 'Sold'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.8rem',
            fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease',
            border: filter === f ? '1px solid transparent' : '1px solid rgba(255,255,255,0.06)',
            background: filter === f ? 'linear-gradient(135deg, #e87722, #f09030)' : 'rgba(255,255,255,0.04)',
            color: filter === f ? 'white' : 'rgba(255,255,255,0.45)',
            boxShadow: filter === f ? '0 4px 15px rgba(232,119,34,0.3)' : 'none',
            letterSpacing: '0.3px',
          }}>{f}</button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Bought', value: transactions.filter(t => t.buyer_id === user.id).length },
          { label: 'Sold', value: transactions.filter(t => t.seller_id === user.id).length },
          { label: 'Total', value: transactions.length },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px', padding: '0.85rem 1.25rem', minWidth: '80px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            }} />
            <div style={{
              fontSize: '0.55rem', letterSpacing: '1.5px', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginBottom: '0.25rem',
            }}>{stat.label}</div>
            <div style={{
              fontSize: '1.4rem', fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.5px',
            }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
        marginBottom: '1.5rem',
      }} />

      <p style={{
        color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', marginBottom: '1rem',
        fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase',
      }}>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #e87722',
            borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading transactions...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{
          textAlign: 'center', padding: '3rem 2rem',
          background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)',
          borderRadius: '20px', color: '#ff6b6b',
        }}>
          <p style={{ fontSize: '0.95rem', fontWeight: '500' }}>{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(20px)', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>∅</div>
          <p style={{ fontSize: '1rem', fontWeight: '500', color: 'rgba(255,255,255,0.35)' }}>
            No transactions yet.
          </p>
        </div>
      )}

      {/* List */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(txn => (
            <TransactionRow key={txn.id} txn={txn} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Transactions