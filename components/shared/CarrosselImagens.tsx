'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarrosselImagensProps {
  images: string[]
  fallbackUrl?: string | null
  /** Fill the parent container (position absolute inset 0). Use for hero sections. */
  fill?: boolean
  /** Extra className applied to the container when not in fill mode */
  className?: string
}

export default function CarrosselImagens({
  images,
  fallbackUrl,
  fill = false,
  className = '',
}: CarrosselImagensProps) {
  const allImages = images.length > 0 ? images : fallbackUrl ? [fallbackUrl] : []
  const multiple = allImages.length > 1

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const prev = useCallback(
    () => setCurrent(i => (i - 1 + allImages.length) % allImages.length),
    [allImages.length]
  )
  const next = useCallback(
    () => setCurrent(i => (i + 1) % allImages.length),
    [allImages.length]
  )

  // Auto-play every 5 seconds, pause on hover
  useEffect(() => {
    if (!multiple || paused) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [multiple, paused, next])

  // Preload next image for smooth transition
  useEffect(() => {
    if (!multiple) return
    const img = new window.Image()
    img.src = allImages[(current + 1) % allImages.length]
  }, [current, allImages, multiple])

  const containerStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }
    : { position: 'relative', overflow: 'hidden', background: '#000' }

  if (allImages.length === 0) {
    return (
      <div
        style={{
          ...containerStyle,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
        className={className}
      />
    )
  }

  return (
    <div
      style={containerStyle}
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Images with crossfade */}
      {allImages.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          loading={i === 0 ? 'eager' : 'lazy'}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: i === current ? 1 : 0,
            transition: 'opacity 0.7s ease',
            zIndex: i === current ? 1 : 0,
          }}
        />
      ))}

      {/* Navigation arrows */}
      {multiple && (
        <>
          <button
            onClick={prev}
            aria-label="Imagem anterior"
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Próxima imagem"
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots — only in non-fill mode (fill mode uses hero text overlay instead) */}
      {multiple && !fill && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            gap: 6,
          }}
        >
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Ir para imagem ${i + 1}`}
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === current ? '#fff' : 'rgba(255,255,255,0.5)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
