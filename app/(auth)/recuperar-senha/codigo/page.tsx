'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { KeyRound, ArrowLeft } from 'lucide-react'

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

export default function RecuperarSenhaCodigoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(emailParam)
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) { setError('Informe o email.'); return }
    if (code.length !== 6) { setError('O código deve ter exatamente 6 dígitos.'); return }
    setLoading(true)

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    })

    if (otpError) {
      setError('Código inválido ou expirado. Solicite um novo código.')
      setLoading(false)
      return
    }

    router.push('/nova-senha')
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
        <KeyRound size={20} color="#007AFF" strokeWidth={1.5} />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 300, color: '#1a1a1a', marginBottom: 6 }}>
        Digite o código
      </h1>
      <p style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93', marginBottom: 28, lineHeight: 1.6 }}>
        Enviamos um código de 6 dígitos para seu email.<br />
        Verifique sua caixa de entrada e spam.
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

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#6b6b6b', marginBottom: 6 }}>
            Código de 6 dígitos
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
            style={{
              ...inputBase,
              fontSize: 24,
              fontWeight: 400,
              letterSpacing: '0.3em',
              textAlign: 'center',
            }}
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

        <button type="submit" disabled={loading || code.length !== 6} style={{
          width: '100%', padding: '13px',
          background: loading || code.length !== 6 ? '#a0c4ff' : '#007AFF',
          color: '#ffffff', border: 'none', borderRadius: 10,
          fontSize: 15, fontWeight: 400,
          cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s', marginTop: 4,
        }}>
          {loading ? 'Verificando…' : 'Verificar código'}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, fontWeight: 300, color: '#8e8e93' }}>
        Não recebeu?{' '}
        <Link href="/recuperar-senha" style={{ color: '#007AFF', textDecoration: 'none' }}>
          Enviar novo código
        </Link>
      </p>

      <p style={{ marginTop: 12, textAlign: 'center', fontSize: 13, fontWeight: 300, color: '#8e8e93' }}>
        <Link href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          color: '#8e8e93', textDecoration: 'none',
        }}>
          <ArrowLeft size={13} /> Voltar ao login
        </Link>
      </p>
    </div>
  )
}
