'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Mail, LogOut } from 'lucide-react'

export default function ConfirmarEmailPendentePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <span style={{ marginBottom: 32, fontSize: 20, fontWeight: 300, letterSpacing: '0.35em', color: 'var(--text)' }}>
        ARC
      </span>

      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '40px 32px',
        boxShadow: 'var(--shadow-card)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <Mail size={24} color="var(--accent)" />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 400, color: 'var(--text)', marginBottom: 8 }}>
          Confirme seu email
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: email ? 6 : 24 }}>
          Seu email ainda não foi confirmado. Use o código que enviamos para ativar sua conta.
        </p>

        {email && (
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 24 }}>
            {email}
          </p>
        )}

        <button
          onClick={() => router.push(`/confirmar-email/codigo${email ? `?email=${encodeURIComponent(email)}` : ''}`)}
          style={{
            width: '100%', padding: '13px', marginBottom: 12,
            background: 'var(--btn-bg)', border: 'none',
            color: 'var(--btn-text)', borderRadius: 10, fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Inserir código de confirmação
        </button>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '12px',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-3)', borderRadius: 10, fontSize: 13,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <LogOut size={13} />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
