import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const mockItems = [
  { id: 1, title: 'Physics Textbook', price: 299, category: 'Books', status: 'Available', description: 'HC Verma Part 1 and 2, good condition, no missing pages.', seller: 'Naman Saini', condition: 'Good' },
  { id: 2, title: 'Laptop Stand', price: 499, category: 'Electronics', status: 'Available', description: 'Adjustable aluminum laptop stand, fits all laptops up to 17 inches.', seller: 'Shivam Nagar', condition: 'Like New' },
  { id: 3, title: 'Study Lamp', price: 199, category: 'Furniture', status: 'Sold', description: 'LED study lamp with brightness control. Used for 1 semester.', seller: 'Hikanshu Rana', condition: 'Good' },
  { id: 4, title: 'Calculus Book', price: 149, category: 'Books', status: 'Available', description: 'Thomas Calculus 13th edition, minor highlights in chapter 3.', seller: 'Naman Saini', condition: 'Fair' },
  { id: 5, title: 'Wireless Mouse', price: 349, category: 'Electronics', status: 'Available', description: 'Logitech M235 wireless mouse, battery included, works perfectly.', seller: 'Shivam Nagar', condition: 'Like New' },
  { id: 6, title: 'Wooden Chair', price: 799, category: 'Furniture', status: 'Available', description: 'Sturdy wooden study chair, comfortable for long hours.', seller: 'Hikanshu Rana', condition: 'Good' },
]

function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const item = mockItems.find(i => i.id === parseInt(id))
  const [backHovered, setBackHovered] = useState(false)
  const [btnHovered, setBtnHovered] = useState(false)

  if (!item) return (
    <div style={{
      textAlign: 'center',
      padding: '6rem 2rem',
      color: 'rgba(255,255,255,0.25)',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        margin: '0 auto 1.5rem',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        opacity: 0.5,
      }}>∅</div>
      <h2 style={{
        fontSize: '1.4rem',
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: '-0.5px',
        marginBottom: '0.5rem',
      }}>Item not found</h2>
      <p style={{
        color: 'rgba(255,255,255,0.25)',
        fontSize: '0.85rem',
        marginBottom: '1.75rem',
      }}>This listing may have been removed or doesn't exist.</p>
      <button onClick={() => navigate('/')} style={{
        padding: '0.6rem 1.75rem',
        background: 'linear-gradient(135deg, #e87722, #f09030)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '700',
        fontSize: '0.85rem',
        letterSpacing: '0.5px',
        boxShadow: '0 4px 15px rgba(232,119,34,0.25)',
        transition: 'all 0.3s ease',
      }}>← Back to Home</button>
    </div>
  )

  return (
    <div style={{ padding: '3rem 4rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        onMouseEnter={() => setBackHovered(true)}
        onMouseLeave={() => setBackHovered(false)}
        style={{
          background: backHovered
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(255,255,255,0.05)',
          border: backHovered
            ? '1px solid rgba(255,255,255,0.12)'
            : '1px solid rgba(255,255,255,0.06)',
          color: backHovered
            ? 'rgba(255,255,255,0.85)'
            : 'rgba(255,255,255,0.5)',
          padding: '0.45rem 1.1rem',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: '600',
          marginBottom: '2rem',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(12px)',
          letterSpacing: '0.3px',
        }}>← Back</button>

      {/* Main card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '2.75rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Top glass shine */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        }} />

        {/* Top row: Category + Title + Status */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.75rem',
        }}>
          <div>
            <span style={{
              fontSize: '0.6rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              fontWeight: '700',
            }}>{item.category}</span>
            <h1 style={{
              fontSize: '2.3rem',
              fontWeight: '900',
              letterSpacing: '-1.5px',
              marginTop: '0.5rem',
              lineHeight: '1.1',
              color: 'rgba(255,255,255,0.95)',
            }}>{item.title}</h1>
          </div>
          <span style={{
            padding: '4px 14px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '0.75rem',
            color: item.status === 'Sold' ? '#ff6b6b' : '#51cf66',
            background: item.status === 'Sold' ? 'rgba(255,107,107,0.1)' : 'rgba(81,207,102,0.1)',
            border: item.status === 'Sold'
              ? '1px solid rgba(255,107,107,0.15)'
              : '1px solid rgba(81,207,102,0.15)',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
            marginTop: '0.25rem',
          }}>{item.status}</span>
        </div>

        {/* Price */}
        <div style={{
          fontSize: '2.75rem',
          fontWeight: '900',
          letterSpacing: '-1px',
          marginBottom: '2rem',
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>₹{item.price}</span>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          marginBottom: '2rem',
        }} />

        {/* Info grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          {[
            { label: 'Seller', value: item.seller },
            { label: 'Condition', value: item.condition },
            { label: 'Category', value: item.category },
            { label: 'Status', value: item.status },
          ].map(info => (
            <div key={info.label} style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '14px',
              padding: '1rem 1.15rem',
              backdropFilter: 'blur(8px)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Inner shine */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              }} />
              <div style={{
                fontSize: '0.6rem',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.3)',
                marginBottom: '0.4rem',
                fontWeight: '700',
              }}>{info.label}</div>
              <div style={{
                fontWeight: '600',
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.95rem',
                letterSpacing: '-0.2px',
              }}>{info.value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '14px',
          padding: '1.25rem 1.35rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Inner shine */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          }} />
          <div style={{
            fontSize: '0.6rem',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
            marginBottom: '0.65rem',
            fontWeight: '700',
          }}>Description</div>
          <p style={{
            color: 'rgba(255,255,255,0.65)',
            lineHeight: '1.75',
            margin: 0,
            fontSize: '0.92rem',
            fontWeight: '400',
            letterSpacing: '0.1px',
          }}>{item.description}</p>
        </div>

        {/* Divider before action */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          marginBottom: '1.5rem',
        }} />

        {/* Action button */}
        {item.status === 'Available' ? (
          <button
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: btnHovered
                ? 'linear-gradient(135deg, #f09030, #e87722)'
                : 'linear-gradient(135deg, #e87722, #f09030)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transform: btnHovered ? 'translateY(-3px)' : 'translateY(0)',
              boxShadow: btnHovered
                ? '0 15px 35px rgba(232,119,34,0.35)'
                : '0 4px 15px rgba(232,119,34,0.2)',
            }}
          >
            Message Seller →
          </button>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '0.85rem',
            color: 'rgba(255,107,107,0.6)',
            fontWeight: '600',
            fontSize: '0.85rem',
            letterSpacing: '0.5px',
            background: 'linear-gradient(135deg, rgba(255,107,107,0.08) 0%, rgba(255,107,107,0.03) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(255,107,107,0.1)',
            backdropFilter: 'blur(8px)',
          }}>
            This item has been sold
          </div>
        )}
      </div>
    </div>
  )
}

export default ItemDetail