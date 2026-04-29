import { ShieldX } from 'lucide-react'

export default function ContaSuspensaPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
          border: '1.5px solid rgba(239,68,68,0.25)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <ShieldX size={28} color="#ef4444" />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
          Conta suspensa
        </h1>

        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 28 }}>
          Sua conta está temporariamente suspensa. Para regularizar sua situação e reativar o acesso,
          entre em contato com nossa equipe.
        </p>

        <a
          href="mailto:contato@usearc.com.br"
          style={{
            display: 'inline-block', background: 'var(--btn-bg)', color: '#fff',
            padding: '12px 28px', borderRadius: 10, textDecoration: 'none',
            fontSize: 14, fontWeight: 600,
          }}
        >
          Entrar em contato
        </a>

        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)' }}>
          contato@usearc.com.br
        </p>
      </div>
    </div>
  )
}
