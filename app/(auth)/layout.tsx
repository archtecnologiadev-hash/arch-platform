import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080808',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <Link
        href="/"
        style={{
          marginBottom: 40,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '0.3em',
          color: '#c8a96e',
          textDecoration: 'none',
          fontFamily: 'Georgia, serif',
        }}
      >
        ARC
      </Link>
      <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
    </div>
  )
}
