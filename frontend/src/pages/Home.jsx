import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const mockItems = [
  { id: 1, title: 'Physics Textbook', price: 299, category: 'Books', status: 'Available' },
  { id: 2, title: 'Laptop Stand', price: 499, category: 'Electronics', status: 'Available' },
  { id: 3, title: 'Study Lamp', price: 199, category: 'Furniture', status: 'Sold' },
  { id: 4, title: 'Calculus Book', price: 149, category: 'Books', status: 'Available' },
  { id: 5, title: 'Wireless Mouse', price: 349, category: 'Electronics', status: 'Available' },
  { id: 6, title: 'Wooden Chair', price: 799, category: 'Furniture', status: 'Available' },
]

const categories = ['All', 'Books', 'Electronics', 'Furniture', 'Clothing', 'Other']

function ItemCard({ item }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/items/${item.id}`)}
      style={{
        background: hovered
          ? 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: hovered
          ? '1px solid rgba(232,119,34,0.4)'
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '1.75rem',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: hovered
          ? '0 25px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>

      {/* Subtle glass shine effect */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
      }} />

      {/* Category + Status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{
          fontSize: '0.65rem',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          fontWeight: '700',
        }}>{item.category}</span>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: '700',
          color: item.status === 'Sold' ? '#ff6b6b' : '#51cf66',
          background: item.status === 'Sold' ? 'rgba(255,107,107,0.1)' : 'rgba(81,207,102,0.1)',
          backdropFilter: 'blur(8px)',
          padding: '3px 12px',
          borderRadius: '20px',
          border: item.status === 'Sold'
            ? '1px solid rgba(255,107,107,0.15)'
            : '1px solid rgba(81,207,102,0.15)',
        }}>{item.status}</span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '1.15rem',
        fontWeight: '700',
        color: 'rgba(255,255,255,0.95)',
        marginBottom: '0.5rem',
        lineHeight: '1.35',
        letterSpacing: '-0.3px',
      }}>{item.title}</h3>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.1), rgba(255,255,255,0.06))',
        margin: '1.25rem 0',
      }} />

      {/* Price + Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '1.5rem',
          fontWeight: '800',
          color: '#e87722',
          letterSpacing: '-0.5px',
        }}>
          ₹{item.price}
        </span>
        <button style={{
          padding: '0.45rem 1.1rem',
          background: hovered
            ? 'linear-gradient(135deg, #e87722, #f09030)'
            : 'rgba(232,119,34,0.12)',
          color: hovered ? 'white' : 'rgba(232,119,34,0.8)',
          border: hovered ? '1px solid transparent' : '1px solid rgba(232,119,34,0.25)',
          borderRadius: '10px',
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontWeight: '600',
          letterSpacing: '0.3px',
          boxShadow: hovered ? '0 4px 15px rgba(232,119,34,0.35)' : 'none',
        }}>
          View →
        </button>
      </div>
    </div>
  )
}

function Home() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchFocused, setSearchFocused] = useState(false)

  const filtered = mockItems.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === 'All' || item.category === activeCategory
    return matchSearch && matchCategory
  })

  return (
    <div style={{ padding: '3rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Hero section — tighter layout */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: '3.2rem',
          fontWeight: '900',
          lineHeight: '1.05',
          letterSpacing: '-2px',
          marginBottom: '0.75rem',
          color: 'white',
        }}>
          Buy. Sell.<br />
          <span style={{
            background: 'linear-gradient(135deg, #e87722, #f5a623)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Campus Style.</span>
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.95rem',
          marginTop: '0.5rem',
          fontWeight: '400',
          letterSpacing: '0.2px',
        }}>
          Second-hand goods, first-class deals — only for students.
        </p>
      </div>

      {/* Search + Filters in a glass panel */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '1.5rem',
        marginBottom: '2.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {/* Clean search bar — no icon, no double layer, shorter */}
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            width: '100%',
            padding: '0.7rem 1.2rem',
            background: searchFocused
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(255,255,255,0.05)',
            border: searchFocused
              ? '1px solid rgba(232,119,34,0.35)'
              : '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box',
            fontWeight: '400',
            letterSpacing: '0.2px',
          }}
        />

        {/* Category filters — inside the glass panel */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
          flexWrap: 'wrap',
        }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '0.4rem 1rem',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: activeCategory === cat
                ? '1px solid transparent'
                : '1px solid rgba(255,255,255,0.06)',
              background: activeCategory === cat
                ? 'linear-gradient(135deg, #e87722, #f09030)'
                : 'rgba(255,255,255,0.04)',
              color: activeCategory === cat ? 'white' : 'rgba(255,255,255,0.45)',
              boxShadow: activeCategory === cat
                ? '0 4px 15px rgba(232,119,34,0.3)'
                : 'none',
              letterSpacing: '0.3px',
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p style={{
        color: 'rgba(255,255,255,0.3)',
        fontSize: '0.8rem',
        marginBottom: '1.25rem',
        fontWeight: '500',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
      }}>
        {filtered.length} item{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '5rem 2rem',
          color: 'rgba(255,255,255,0.25)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>∅</div>
          <p style={{ fontSize: '1rem', fontWeight: '500' }}>No items match your search.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {filtered.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

export default Home