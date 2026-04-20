import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f2f2f7',
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
          marginBottom: 32,
          fontSize: 20,
          fontWeight: 300,
          letterSpacing: '0.35em',
          color: '#007AFF',
          textDecoration: 'none',
        }}
      >
        ARC
      </Link>
      <div style={{ width: '100%', maxWidth: 440 }}>{children}</div>
    </div>
  )
}
