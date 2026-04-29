import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ThemeToggle size={16} />
      </div>
      <Link
        href="/"
        style={{
          marginBottom: 32,
          fontSize: 20,
          fontWeight: 300,
          letterSpacing: '0.35em',
          color: 'var(--text)',
          textDecoration: 'none',
        }}
      >
        ARC
      </Link>
      <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
    </div>
  )
}
