'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: '#111',
  border: '1px solid #222', color: '#e8e8e8', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
}

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/nova-senha`

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (authError) {
      setError('Não foi possível enviar o email. Verifique o endereço e tente novamente.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', padding: '40px 36px', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle2 size={26} color="#34d399" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e8e8e8', marginBottom: 10 }}>
          Email enviado!
        </h2>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 8 }}>
          Enviamos um link de recuperação para
        </p>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#c8a96e', marginBottom: 24 }}>
          {email}
        </p>
        <p style={{ fontSize: 12, color: '#3a3a3a', lineHeight: 1.7, marginBottom: 28 }}>
          Verifique sua caixa de entrada e spam.<br />
          O link expira em 1 hora.
        </p>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#c8a96e', textDecoration: 'none', fontWeight: 600,
        }}>
          <ArrowLeft size={14} /> Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', padding: '40px 36px' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, marginBottom: 24,
        background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Mail size={20} color="#c8a96e" />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8e8', marginBottom: 6, letterSpacing: '0.02em' }}>
        Recuperar senha
      </h1>
      <p style={{ fontSize: 13, color: '#4a4a4a', marginBottom: 32, lineHeight: 1.6 }}>
        Digite seu email e enviaremos um link para você criar uma nova senha.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 7, letterSpacing: '0.08em' }}>
            EMAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            style={inp}
            onFocus={e => (e.target.style.borderColor = '#c8a96e')}
            onBlur={e => (e.target.style.borderColor = '#222')}
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#ef4444', margin: 0, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '13px',
          background: loading ? '#2a2010' : '#c8a96e',
          color: loading ? '#666' : '#0d0d0d',
          border: 'none', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.15em', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s', marginTop: 4,
        }}>
          {loading ? 'ENVIANDO...' : 'ENVIAR LINK DE RECUPERAÇÃO'}
        </button>
      </form>

      <p style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: '#3a3a3a' }}>
        Lembrou a senha?{' '}
        <Link href="/login" style={{ color: '#c8a96e', textDecoration: 'none' }}>
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
