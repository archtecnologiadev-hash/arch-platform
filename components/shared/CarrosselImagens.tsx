'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarrosselImagensProps {
  images: string[]
  fallbackUrl?: string | null
  aspectRatio?: string
  maxWidth?: number
  className?: string
}

export default function CarrosselImagens({
  images,
  fallbackUrl,
  aspectRatio = '1/1',
  maxWidth = 600,
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

  useEffect(() => {
    if (!multiple || paused) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [multiple, paused, next])

  useEffect(() => {
    if (!multiple) return
    const img = new window.Image()
    img.src = allImages[(current + 1) % allImages.length]
  }, [current, allImages, multiple])

  if (allImages.length === 0) {
    return (
      <div style={{ maxWidth, margin: '0 auto' }} className={className}>
        <div style={{
          position: 'relative', aspectRatio, borderRadius: 12, overflow: 'hidden',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }} />
      </div>
    )
  }

  const arrowStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.32)',
    backdropFilter: 'blur(4px)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    flexShrink: 0,
    transition: 'background 0.15s',
  }

  return (
    <div style={{ maxWidth, margin: '0 auto' }} className={className}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: multiple ? 8 : 0 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {multiple && (
          <button
            onClick={prev}
            aria-label="Imagem anterior"
            style={arrowStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.32)')}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div style={{
          flex: 1,
          position: 'relative',
          aspectRatio,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          background: '#000',
        }}>
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

          {multiple && (
            <div style={{
              position: 'absolute', top: 10, right: 12, zIndex: 10,
              fontSize: 11, fontWeight: 600, color: '#fff',
              background: 'rgba(0,0,0,0.42)',
              backdropFilter: 'blur(4px)',
              borderRadius: 20,
              padding: '3px 9px',
              letterSpacing: '0.02em',
              userSelect: 'none',
            }}>
              {current + 1}/{allImages.length}
            </div>
          )}
        </div>

        {multiple && (
          <button
            onClick={next}
            aria-label="Próxima imagem"
            style={arrowStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.32)')}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {multiple && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {allImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Ir para imagem ${i + 1}`}
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === current ? '#007AFF' : '#c7c7cc',
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
