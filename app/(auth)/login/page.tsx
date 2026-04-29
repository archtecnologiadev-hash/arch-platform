'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CheckCircle2, RotateCcw } from 'lucide-react'

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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [showResend, setShowResend] = useState(false)
  const [resending, setResending]   = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMsg, setResendMsg]   = useState('')

  useEffect(() => {
    const msg = searchParams.get('msg')
    if (msg === 'senha-alterada') {
      setSuccessMsg('Senha alterada com sucesso! Faça login para continuar.')
    } else if (msg === 'email-confirmado') {
      setSuccessMsg('Email confirmado! Agora você já pode entrar.')
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setShowResend(false)
    setResendMsg('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('email not confirmed') || msg.includes('email link')) {
        setError('Confirme seu email antes de fazer login. Verifique sua caixa de entrada.')
        setShowResend(true)
      } else if (msg.includes('rate limit') || msg.includes('too many')) {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      } else {
        setError('Email ou senha incorretos.')
      }
      setLoading(false)
      return
    }

    const tipo = data.user?.user_metadata?.tipo ?? 'cliente'
    router.push(`/${tipo}/dashboard`)
    router.refresh()
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending || !email) return
    setResending(true)
    setResendMsg('')
    try {
      const res = await fetch('/api/auth/reenviar-confirmacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) {
        setResendMsg(data.error)
      } else {
        setResendMsg('Email reenviado! Verifique sua caixa de entrada.')
        let secs = 60
        setResendCooldown(secs)
        const iv = setInterval(() => {
          secs -= 1
          setResendCooldown(secs)
          if (secs <= 0) clearInterval(iv)
        }, 1000)
      }
    } catch {
      setResendMsg('Erro ao reenviar. Tente novamente.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 16,
      padding: '36px 32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 300, color: '#1a1a1a', marginBottom: 6 }}>
        Entrar
      </h1>
      <p style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93', marginBottom: 28 }}>
        Acesse sua conta na ARC Platform
      </p>

      {successMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: '#1a7a35', marginBottom: 20,
          padding: '10px 14px', background: 'rgba(52,199,89,0.08)',
          borderRadius: 8, border: '1px solid rgba(52,199,89,0.25)',
        }}>
          <CheckCircle2 size={15} color="#34c759" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#6b6b6b', marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            style={inputBase}
            onFocus={(e) => (e.target.style.borderColor = '#007AFF')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 400, color: '#6b6b6b' }}>Senha</label>
            <Link href="/recuperar-senha" style={{ fontSize: 12, color: '#007AFF', textDecoration: 'none' }}>
              Esqueceu a senha?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={inputBase}
            onFocus={(e) => (e.target.style.borderColor = '#007AFF')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'rgba(255,59,48,0.06)',
            borderRadius: 8, border: '1px solid rgba(255,59,48,0.15)',
          }}>
            <p style={{ fontSize: 13, color: '#ff3b30', margin: 0, textAlign: 'center' }}>
              {error}
            </p>
            {showResend && (
              <div style={{ marginTop: 10 }}>
                {resendMsg && (
                  <p style={{
                    fontSize: 12, margin: '0 0 8px',
                    color: resendMsg.startsWith('Email reenviado') ? '#059669' : '#ff3b30',
                    textAlign: 'center',
                  }}>
                    {resendMsg}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending || !email}
                  style={{
                    width: '100%', padding: '9px',
                    background: resendCooldown > 0 ? '#f2f2f7' : 'rgba(0,122,255,0.08)',
                    border: `1px solid ${resendCooldown > 0 ? 'rgba(0,0,0,0.08)' : 'rgba(0,122,255,0.2)'}`,
                    color: resendCooldown > 0 ? '#8e8e93' : '#007AFF',
                    borderRadius: 8, fontSize: 12, fontWeight: 500,
                    cursor: resendCooldown > 0 || resending || !email ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <RotateCcw size={12} />
                  {resending ? 'Enviando…' : resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar email de confirmação'}
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: loading ? '#a0c4ff' : '#007AFF',
            color: '#ffffff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 400,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s', marginTop: 4,
          }}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, fontWeight: 300, color: '#8e8e93' }}>
        Não tem conta?{' '}
        <Link href="/cadastro" style={{ color: '#007AFF', textDecoration: 'none' }}>
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16, padding: '36px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93' }}>Carregando…</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
