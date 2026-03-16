import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useDraggable — free drag, no indicator, no snap.
 * - Zero lag (direct DOM during drag, React state only on drop)
 * - Click suppressed after drag so button action doesn't fire
 * - Position saved to localStorage, resets when disabled
 */
export function useDraggable(storageKey, defaultPos, enabled) {
  const [pos, setPos] = useState(() => {
    if (!enabled) return defaultPos
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : defaultPos
    } catch { return defaultPos }
  })

  const nodeRef    = useRef(null)
  const dragging   = useRef(false)
  const hasDragged = useRef(false)
  const startMouse = useRef({ x: 0, y: 0 })
  const startElem  = useRef({ x: 0, y: 0 })
  const curPos     = useRef({ x: 0, y: 0 })
  const rafId      = useRef(null)

  // Reset / restore when enabled toggles
  useEffect(() => {
    if (!enabled) {
      setPos(defaultPos)
      localStorage.removeItem(storageKey)
    } else {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) setPos(JSON.parse(saved))
      } catch {}
    }
  }, [enabled]) // eslint-disable-line

  const startDrag = useCallback((clientX, clientY) => {
    if (!enabled || !nodeRef.current) return
    const rect = nodeRef.current.getBoundingClientRect()

    dragging.current   = true
    hasDragged.current = false
    startMouse.current = { x: clientX, y: clientY }
    startElem.current  = { x: rect.left, y: rect.top }
    curPos.current     = { x: rect.left, y: rect.top }

    // Visual feedback during drag
    nodeRef.current.style.transition = 'opacity 0.15s, transform 0.15s'
    nodeRef.current.style.transform  = 'scale(1.1)'
    nodeRef.current.style.opacity    = '0.85'
    nodeRef.current.style.cursor     = 'grabbing'
    nodeRef.current.style.zIndex     = '9999'

    const move = (cx, cy) => {
      if (!dragging.current) return
      const dx = cx - startMouse.current.x
      const dy = cy - startMouse.current.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDragged.current = true
      if (!hasDragged.current) return

      const w    = nodeRef.current?.offsetWidth  ?? 48
      const h    = nodeRef.current?.offsetHeight ?? 48
      const newX = Math.max(8, Math.min(window.innerWidth  - w - 8, startElem.current.x + dx))
      const newY = Math.max(8, Math.min(window.innerHeight - h - 8, startElem.current.y + dy))
      curPos.current = { x: newX, y: newY }

      if (rafId.current) cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        if (!nodeRef.current) return
        nodeRef.current.style.left   = `${newX}px`
        nodeRef.current.style.top    = `${newY}px`
        nodeRef.current.style.bottom = 'auto'
        nodeRef.current.style.right  = 'auto'
      })
    }

    const up = () => {
      if (!dragging.current) return
      dragging.current = false
      if (rafId.current) cancelAnimationFrame(rafId.current)

      // Restore button style
      if (nodeRef.current) {
        nodeRef.current.style.transition = ''
        nodeRef.current.style.transform  = ''
        nodeRef.current.style.opacity    = ''
        nodeRef.current.style.cursor     = 'grab'
        nodeRef.current.style.zIndex     = '1000'
      }

      if (hasDragged.current) {
        // Suppress the click that fires after mouseup
        const killClick = (e) => {
          e.stopPropagation()
          e.preventDefault()
          window.removeEventListener('click', killClick, true)
        }
        window.addEventListener('click', killClick, true)

        const finalPos = {
          top: `${curPos.current.y}px`, left: `${curPos.current.x}px`,
          bottom: 'auto', right: 'auto',
        }
        setPos(finalPos)
        localStorage.setItem(storageKey, JSON.stringify(finalPos))
      }

      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('mouseup',   up)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend',  up)
    }

    const onMouse = (e) => move(e.clientX, e.clientY)
    const onTouch = (e) => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY) }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('mouseup',   up)
    window.addEventListener('touchmove', onTouch, { passive: false })
    window.addEventListener('touchend',  up)
  }, [enabled, storageKey]) // eslint-disable-line

  const onMouseDown = useCallback((e) => {
    if (!enabled) return
    e.preventDefault()
    startDrag(e.clientX, e.clientY)
  }, [enabled, startDrag])

  const onTouchStart = useCallback((e) => {
    if (!enabled) return
    startDrag(e.touches[0].clientX, e.touches[0].clientY)
  }, [enabled, startDrag])

  return {
    nodeRef,
    pos,
    dragHandlers: enabled ? { onMouseDown, onTouchStart } : {},
  }
}