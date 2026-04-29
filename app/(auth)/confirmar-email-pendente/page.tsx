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
      background: '#f2f2f7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <span style={{ marginBottom: 32, fontSize: 20, fontWeight: 300, letterSpacing: '0.35em', color: '#007AFF' }}>
        ARC
      </span>

      <div style={{
        width: '100%', maxWidth: 440,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: '40px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <Mail size={24} color="#007AFF" />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 400, color: '#1a1a1a', marginBottom: 8 }}>
          Confirme seu email
        </h1>
        <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: email ? 6 : 24 }}>
          Seu email ainda não foi confirmado. Use o código que enviamos para ativar sua conta.
        </p>

        {email && (
          <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', marginBottom: 24 }}>
            {email}
          </p>
        )}

        <button
          onClick={() => router.push(`/confirmar-email/codigo${email ? `?email=${encodeURIComponent(email)}` : ''}`)}
          style={{
            width: '100%', padding: '13px', marginBottom: 12,
            background: '#007AFF', border: 'none',
            color: '#ffffff', borderRadius: 10, fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Inserir código de confirmação
        </button>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '12px',
            background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
            color: '#8e8e93', borderRadius: 10, fontSize: 13,
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
