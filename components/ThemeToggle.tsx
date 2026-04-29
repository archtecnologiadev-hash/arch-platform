'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ size = 16 }: { size?: number }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <div style={{ width: size + 16, height: size + 16 }} />

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-3)',
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
    >
      {isDark ? <Sun size={size} strokeWidth={1.5} /> : <Moon size={size} strokeWidth={1.5} />}
    </button>
  )
}
