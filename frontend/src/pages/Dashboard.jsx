import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const mockUserItems = [
  { id: 1, title: 'Physics Textbook', price: 299, category: 'Books', status: 'Available' },
  { id: 4, title: 'Calculus Book', price: 149, category: 'Books', status: 'Available' },
]

function ListingRow({ item, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [editHovered, setEditHovered] = useState(false)
  const [deleteHovered, setDeleteHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: hovered
          ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: hovered
          ? '1px solid rgba(255,255,255,0.12)'
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '1.35rem 1.75rem',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: hovered
          ? '0 12px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 4px 15px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Top glass shine */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      }} />

      {/* Left info */}
      <div>
        <h3 style={{
          margin: 0,
          fontSize: '1.05rem',
          fontWeight: '700',
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '-0.3px',
        }}>
          {item.title}
        </h3>
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '0.5rem',
          alignItems: 'center',
        }}>
          <span style={{
            fontWeight: '800',
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>₹{item.price}</span>

          {/* Dot separator */}
          <span style={{
            width: '3px', height: '3px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
          }} />

          <span style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '0.75rem',
            fontWeight: '600',
            letterSpacing: '0.5px',
          }}>{item.category}</span>

          <span style={{
            width: '3px', height: '3px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
          }} />

          <span style={{
            fontSize: '0.7rem',
            fontWeight: '700',
            color: item.status === 'Sold' ? '#ff6b6b' : '#51cf66',
            background: item.status === 'Sold' ? 'rgba(255,107,107,0.1)' : 'rgba(81,207,102,0.1)',
            padding: '2px 10px',
            borderRadius: '20px',
            border: item.status === 'Sold'
              ? '1px solid rgba(255,107,107,0.15)'
              : '1px solid rgba(81,207,102,0.15)',
            backdropFilter: 'blur(8px)',
          }}>{item.status}</span>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onMouseEnter={() => setEditHovered(true)}
          onMouseLeave={() => setEditHovered(false)}
          style={{
            padding: '0.4rem 1rem',
            background: editHovered
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(255,255,255,0.05)',
            color: editHovered
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(255,255,255,0.5)',
            border: editHovered
              ? '1px solid rgba(255,255,255,0.15)'
              : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            letterSpacing: '0.3px',
          }}>Edit</button>
        <button
          onClick={() => onDelete(item.id)}
          onMouseEnter={() => setDeleteHovered(true)}
          onMouseLeave={() => setDeleteHovered(false)}
          style={{
            padding: '0.4rem 1rem',
            background: deleteHovered
              ? 'rgba(255,107,107,0.2)'
              : 'rgba(255,107,107,0.08)',
            color: deleteHovered ? '#ff6b6b' : 'rgba(255,107,107,0.6)',
            border: deleteHovered
              ? '1px solid rgba(255,107,107,0.25)'
              : '1px solid rgba(255,107,107,0.1)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            letterSpacing: '0.3px',
          }}>Delete</button>
      </div>
    </div>
  )
}

function Dashboard() {
  const [items, setItems] = useState(mockUserItems)
  const navigate = useNavigate()
  const [postBtnHovered, setPostBtnHovered] = useState(false)

  function handleDelete(id) {
    setItems(items.filter(item => item.id !== id))
  }

  return (
    <div style={{ padding: '3rem 4rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '900',
          letterSpacing: '-2px',
          lineHeight: '1.05',
          marginBottom: '0.6rem',
          color: 'white',
        }}>
          My<br />
          <span style={{
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Dashboard.</span>
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: '0.85rem',
          marginTop: '0.5rem',
          fontWeight: '400',
          letterSpacing: '0.2px',
        }}>
          Welcome back, Naman — you have {items.length} active listing{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats + Post button row */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '2rem',
        alignItems: 'stretch',
      }}>
        {/* Stats cards */}
        {[
          { label: 'Active', value: items.filter(i => i.status === 'Available').length },
          { label: 'Sold', value: items.filter(i => i.status === 'Sold').length },
          { label: 'Total', value: items.length },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '0.85rem 1.25rem',
            minWidth: '80px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            }} />
            <div style={{
              fontSize: '0.55rem',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              fontWeight: '700',
              marginBottom: '0.25rem',
            }}>{stat.label}</div>
            <div style={{
              fontSize: '1.4rem',
              fontWeight: '800',
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '-0.5px',
            }}>{stat.value}</div>
          </div>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Post button */}
        <button
          onClick={() => navigate('/post')}
          onMouseEnter={() => setPostBtnHovered(true)}
          onMouseLeave={() => setPostBtnHovered(false)}
          style={{
            padding: '0.85rem 1.75rem',
            background: postBtnHovered
              ? 'linear-gradient(135deg, #f09030, #e87722)'
              : 'linear-gradient(135deg, #e87722, #f09030)',
            color: 'white',
            border: 'none',
            borderRadius: '14px',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: postBtnHovered ? 'translateY(-3px)' : 'translateY(0)',
            boxShadow: postBtnHovered
              ? '0 15px 35px rgba(232,119,34,0.35)'
              : '0 4px 15px rgba(232,119,34,0.2)',
            whiteSpace: 'nowrap',
            alignSelf: 'center',
          }}
        >
          + Post New Item
        </button>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
        marginBottom: '1.5rem',
      }} />

      {/* Section label */}
      <p style={{
        color: 'rgba(255,255,255,0.25)',
        fontSize: '0.7rem',
        marginBottom: '1rem',
        fontWeight: '700',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
      }}>
        Your Listings
      </p>

      {/* Empty state */}
      {items.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top glass shine */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          }} />

          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <p style={{ fontSize: '1rem', fontWeight: '500', color: 'rgba(255,255,255,0.35)' }}>
            No listings yet.
          </p>
          <p style={{
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.2)',
            marginTop: '0.35rem',
          }}>
            Post your first item to get started.
          </p>
        </div>
      )}

      {/* Listings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map(item => (
          <ListingRow key={item.id} item={item} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  )
}

export default Dashboard