'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const FACES = [
  { transform: 'translateZ(120px)',                       bg: 'rgba(26,86,219,0.9)'  },
  { transform: 'translateZ(-120px) rotateY(180deg)',      bg: 'rgba(0,68,181,0.9)'   },
  { transform: 'rotateY(90deg)  translateZ(120px)',       bg: 'rgba(37,99,235,0.9)'  },
  { transform: 'rotateY(-90deg) translateZ(120px)',       bg: 'rgba(0,57,153,0.9)'   },
  { transform: 'rotateX(90deg)  translateZ(120px)',       bg: 'rgba(30,78,200,0.9)'  },
  { transform: 'rotateX(-90deg) translateZ(120px)',       bg: 'rgba(0,80,208,0.9)'   },
]

export default function CubeScene3D() {
  const [rotX, setRotX] = useState(20)
  const [rotY, setRotY] = useState(0)
  const isDragging = useRef(false)
  const lastPos    = useRef({ x: 0, y: 0 })
  const velocityY  = useRef(0)
  const autoRotY   = useRef(0)
  const rafRef     = useRef<number>(0)
  const manualRotX = useRef(20)
  const manualRotY = useRef(0)

  useEffect(() => {
    const tick = () => {
      if (!isDragging.current) {
        velocityY.current *= 0.93
        autoRotY.current  += Math.abs(velocityY.current) > 0.05 ? velocityY.current : 0.35
        manualRotY.current = autoRotY.current
        setRotY(autoRotY.current)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    velocityY.current = 0
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    velocityY.current  = dx * 0.4
    manualRotY.current += dx * 0.4
    manualRotX.current  = Math.max(-40, Math.min(40, manualRotX.current + dy * 0.3))
    autoRotY.current    = manualRotY.current
    setRotY(manualRotY.current)
    setRotX(manualRotX.current)
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseUp = useCallback(() => { isDragging.current = false }, [])

  // Touch support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    velocityY.current = 0
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - lastPos.current.x
    const dy = e.touches[0].clientY - lastPos.current.y
    velocityY.current  = dx * 0.4
    manualRotY.current += dx * 0.4
    manualRotX.current  = Math.max(-40, Math.min(40, manualRotX.current + dy * 0.3))
    autoRotY.current    = manualRotY.current
    setRotY(manualRotY.current)
    setRotX(manualRotX.current)
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isDragging.current ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseUp}
    >
      <div style={{ perspective: 800, userSelect: 'none' }}>
        <div style={{
          width: 240, height: 240,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}>
          {FACES.map((f, i) => (
            <div key={i} style={{
              position: 'absolute', inset: 0,
              background: f.bg,
              transform: f.transform,
              border: '1px solid rgba(96,165,250,0.5)',
              backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Face edge highlight */}
              <div style={{
                position: 'absolute', inset: 6,
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
              }} />
              {/* Center dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                boxShadow: '0 0 12px rgba(96,165,250,0.6)',
              }} />
            </div>
          ))}

          {/* Wireframe overlay (slightly larger) */}
          {FACES.map((f, i) => (
            <div key={`e${i}`} style={{
              position: 'absolute',
              inset: -2,
              transform: f.transform,
              border: '1px solid rgba(96,165,250,0.25)',
              pointerEvents: 'none',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
