'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#f2f2f7',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  color: '#1a1a1a',
  fontSize: 15,
  fontWeight: 300,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
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

    const redirectTo = `${window.location.origin}/auth/confirm`
    const res = await fetch('/api/notifications/reset-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo }),
    })

    if (!res.ok) {
      setError('Não foi possível enviar o email. Verifique o endereço e tente novamente.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div style={{
        background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16, padding: '40px 32px', textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle2 size={26} color="#34c759" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 300, color: '#1a1a1a', marginBottom: 10 }}>
          Email enviado!
        </h2>
        <p style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93', lineHeight: 1.6, marginBottom: 8 }}>
          Enviamos um link de recuperação para
        </p>
        <p style={{ fontSize: 14, fontWeight: 400, color: '#007AFF', marginBottom: 24 }}>
          {email}
        </p>
        <p style={{ fontSize: 12, fontWeight: 300, color: '#8e8e93', lineHeight: 1.7, marginBottom: 28 }}>
          Verifique sua caixa de entrada e spam.<br />
          O link expira em 1 hora.
        </p>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#007AFF', textDecoration: 'none',
        }}>
          <ArrowLeft size={14} /> Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 16, padding: '36px 32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 22,
        background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Mail size={20} color="#007AFF" />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 300, color: '#1a1a1a', marginBottom: 6 }}>
        Recuperar senha
      </h1>
      <p style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93', marginBottom: 28, lineHeight: 1.6 }}>
        Digite seu email e enviaremos um link para criar uma nova senha.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#6b6b6b', marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            style={inputBase}
            onFocus={e => (e.target.style.borderColor = '#007AFF')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
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
          background: loading ? '#a0c4ff' : '#007AFF',
          color: '#ffffff', border: 'none', borderRadius: 10,
          fontSize: 15, fontWeight: 400,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s', marginTop: 4,
        }}>
          {loading ? 'Enviando…' : 'Enviar link de recuperação'}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, fontWeight: 300, color: '#8e8e93' }}>
        Lembrou a senha?{' '}
        <Link href="/login" style={{ color: '#007AFF', textDecoration: 'none' }}>
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
