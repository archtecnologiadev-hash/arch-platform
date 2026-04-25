'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie-consent')) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('cookie-consent', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(28,28,30,0.95)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
    }}>
      <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.5, flex: 1, minWidth: 220 }}>
        Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa{' '}
        <Link href="/privacidade" style={{ color: '#007AFF', textDecoration: 'none' }}>
          Política de Privacidade
        </Link>.
      </p>
      <button
        onClick={accept}
        style={{
          padding: '8px 20px', background: '#007AFF', color: '#ffffff',
          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 400,
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        Entendi
      </button>
    </div>
  )
}
