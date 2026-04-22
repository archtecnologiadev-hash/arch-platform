'use client'

import { useState, useRef } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X } from 'lucide-react'

export interface CropConfig {
  src: string
  aspect: number
  circular?: boolean
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

function initCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
    width, height,
  )
}

async function cropToBlob(image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    pixelCrop.x * scaleX, pixelCrop.y * scaleY,
    pixelCrop.width * scaleX, pixelCrop.height * scaleY,
    0, 0, pixelCrop.width, pixelCrop.height,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Canvas vazio')),
      'image/jpeg', 0.92,
    )
  })
}

function aspectLabel(aspect: number): string {
  if (aspect === 1) return '1:1'
  if (Math.abs(aspect - 16 / 5) < 0.01) return '16:5'
  if (Math.abs(aspect - 4 / 3) < 0.01) return '4:3'
  if (Math.abs(aspect - 16 / 9) < 0.01) return '16:9'
  return `${aspect.toFixed(2)}:1`
}

export default function ImageCropModal({ src, aspect, circular = false, onConfirm, onCancel }: CropConfig) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [confirming, setConfirming] = useState(false)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCrop(initCrop(width, height, aspect))
  }

  async function handleConfirm() {
    if (!imgRef.current || !completedCrop) return
    setConfirming(true)
    try {
      const blob = await cropToBlob(imgRef.current, completedCrop)
      onConfirm(blob)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)', zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        background: '#ffffff', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)', maxWidth: 580, width: '100%',
        border: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '15px 20px', borderBottom: '1px solid #f2f2f7',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1c1c1e' }}>Ajustar imagem</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#8e8e93', background: '#f2f2f7', padding: '3px 9px', borderRadius: 6 }}>
              {aspectLabel(aspect)}{circular ? ' · circular' : ''}
            </span>
            <button
              onClick={onCancel}
              style={{ background: '#f2f2f7', border: 'none', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6c6c70' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#e5e5ea')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f2f2f7')}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Crop area */}
        <div style={{ padding: 16, background: '#f9f9fb', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220, overflow: 'auto' }}>
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            onComplete={c => setCompletedCrop(c)}
            aspect={aspect}
            circularCrop={circular}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={onImageLoad}
              style={{ maxWidth: '100%', maxHeight: 420, display: 'block' }}
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div style={{
          padding: '13px 20px', borderTop: '1px solid #f2f2f7',
          display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0,
        }}>
          <button
            onClick={onCancel}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#f2f2f7', color: '#3a3a3c', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e5e5ea')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f2f2f7')}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!completedCrop || confirming}
            style={{
              padding: '9px 20px', borderRadius: 10, border: 'none',
              background: !completedCrop || confirming ? '#b0c8ff' : '#007AFF',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: !completedCrop || confirming ? 'not-allowed' : 'pointer',
            }}
          >
            {confirming ? 'Aguarde...' : 'Recortar e salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
