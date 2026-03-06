import { useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

// Wraps every page with a fade + slight slide-up animation on route change.
// Usage: wrap each <Route element={...}> child with <PageWrapper>

function PageWrapper({ children }) {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const prevPath = useRef(null)

  useEffect(() => {
    // Reset → trigger animation whenever path changes
    if (prevPath.current !== location.pathname) {
      setVisible(false)
      prevPath.current = location.pathname
      // One RAF to let the browser paint the hidden state first
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [location.pathname])

  // On first mount, show immediately
  useEffect(() => {
    setVisible(true)
  }, [])

  return (
    <>
      <style>{`
        @keyframes pageEnter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .page-enter {
          animation: pageEnter 250ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .page-hidden {
          opacity: 0;
          transform: translateY(10px);
        }
      `}</style>
      <div className={visible ? 'page-enter' : 'page-hidden'}>
        {children}
      </div>
    </>
  )
}

export default PageWrapper