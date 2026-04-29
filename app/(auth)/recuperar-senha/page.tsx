'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Mail } from 'lucide-react'

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  borderRadius: 10,
  color: 'var(--text)',
  fontSize: 15,
  fontWeight: 300,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

export default function RecuperarSenhaPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.usearc.com.br/auth/confirm?next=recovery',
    })

    if (authError) {
      setError('Não foi possível enviar o email. Verifique o endereço e tente novamente.')
      setLoading(false)
      return
    }

    router.push(`/recuperar-senha/codigo?email=${encodeURIComponent(email)}`)
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '36px 32px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 22,
        background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Mail size={20} color="var(--accent)" />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 300, color: 'var(--text)', marginBottom: 6 }}>
        Recuperar senha
      </h1>
      <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.6 }}>
        Digite seu email e enviaremos um link para criar uma nova senha.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--text-2)', marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            style={inputBase}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-input)')}
          />
        </div>

        {error && (
          <p style={{
            fontSize: 13, color: '#ff3b30', margin: 0,
            padding: '10px 14px', background: 'rgba(255,59,48,0.06)',
            borderRadius: 8, border: '1px solid rgba(255,59,48,0.15)',
          }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '13px',
          background: loading ? 'var(--btn-disabled)' : 'var(--btn-bg)',
          color: 'var(--btn-text)', border: 'none', borderRadius: 10,
          fontSize: 15, fontWeight: 400,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s', marginTop: 4,
        }}>
          {loading ? 'Enviando…' : 'Enviar link de recuperação'}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, fontWeight: 300, color: 'var(--text-3)' }}>
        Lembrou a senha?{' '}
        <Link href="/login" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
