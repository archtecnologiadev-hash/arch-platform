'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, X } from 'lucide-react'

function BannerInner({ text }: { text: string }) {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('welcome') === '1') setShow(true)
  }, [searchParams])

  if (!show) return null

  return (
    <div style={{
      background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.18)',
      borderRadius: 12, padding: '13px 16px', marginBottom: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Sparkles size={15} color="#007AFF" />
        <span style={{ fontSize: 13, fontWeight: 300, color: '#007AFF', lineHeight: 1.5 }}>{text}</span>
      </div>
      <button
        onClick={() => setShow(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007AFF', padding: 2, flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function WelcomeBanner({ text }: { text: string }) {
  return (
    <Suspense fallback={null}>
      <BannerInner text={text} />
    </Suspense>
  )
}
