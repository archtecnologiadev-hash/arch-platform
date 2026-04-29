'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Mail, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react'

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

function ConfirmarCodigoForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const codeRef      = useRef<HTMLInputElement>(null)

  const [email, setEmail]       = useState('')
  const [code, setCode]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(emailParam)
    setTimeout(() => codeRef.current?.focus(), 100)
  }, [searchParams])

  // Auto-redirect after confirmation
  useEffect(() => {
    if (!confirmed) return
    const t = setTimeout(() => router.push('/login?msg=email-confirmado'), 2000)
    return () => clearTimeout(t)
  }, [confirmed, router])

  async function handleVerify(e?: React.FormEvent) {
    e?.preventDefault()
    if (!email) { setError('Informe o email.'); return }
    if (code.length !== 8) { setError('O código deve ter exatamente 8 dígitos.'); return }
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    })

    if (otpError) {
      setError('Código inválido ou expirado. Solicite um novo código.')
      setLoading(false)
      return
    }

    // Sign out so user goes through normal login after confirmation
    await supabase.auth.signOut()
    setLoading(false)
    setConfirmed(true)
  }

  function handleCodeChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 8)
    setCode(digits)
    setError('')
    if (digits.length === 8) {
      setTimeout(() => handleVerify(), 50)
    }
  }

  async function handleResend() {
    if (!email || cooldown > 0 || resending) return
    setResending(true)
    setResendMsg('')
    setError('')
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
        setResendMsg('Código reenviado!')
        setCode('')
        let secs = 60
        setCooldown(secs)
        const iv = setInterval(() => {
          secs -= 1
          setCooldown(secs)
          if (secs <= 0) clearInterval(iv)
        }, 1000)
        setTimeout(() => codeRef.current?.focus(), 50)
      }
    } catch {
      setResendMsg('Erro ao reenviar. Tente novamente.')
    } finally {
      setResending(false)
    }
  }

  const card: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 16,
    padding: '36px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }

  if (confirmed) {
    return (
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <CheckCircle2 size={26} color="#34c759" />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 400, color: '#1a1a1a', marginBottom: 8 }}>
          Conta confirmada!
        </h1>
        <p style={{ fontSize: 13, color: '#8e8e93' }}>
          Redirecionando para o login…
        </p>
      </div>
    )
  }

  return (
    <div style={card}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 22,
        background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Mail size={20} color="#007AFF" strokeWidth={1.5} />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 300, color: '#1a1a1a', marginBottom: 6 }}>
        Confirme sua conta
      </h1>
      <p style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93', marginBottom: 28, lineHeight: 1.6 }}>
        Enviamos um código de 8 dígitos para seu email.<br />
        Verifique sua caixa de entrada e pasta de spam.
      </p>

      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            Código de 8 dígitos
          </label>
          <input
            ref={codeRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={e => handleCodeChange(e.target.value)}
            placeholder="00000000"
            required
            style={{
              ...inputBase,
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: '0.25em',
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

        <button
          type="submit"
          disabled={loading || code.length !== 8}
          style={{
            width: '100%', padding: '13px',
            background: loading || code.length !== 8 ? '#a0c4ff' : '#007AFF',
            color: '#ffffff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 400,
            cursor: loading || code.length !== 8 ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s', marginTop: 4,
          }}
        >
          {loading ? 'Verificando…' : 'Confirmar conta'}
        </button>
      </form>

      <div style={{ marginTop: 20 }}>
        {resendMsg && (
          <p style={{
            fontSize: 12, textAlign: 'center', marginBottom: 10,
            color: resendMsg === 'Código reenviado!' ? '#059669' : '#ff3b30',
          }}>
            {resendMsg === 'Código reenviado!' && <CheckCircle2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
            {resendMsg}
          </p>
        )}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || !email}
          style={{
            width: '100%', padding: '11px',
            background: 'transparent',
            border: `1px solid ${cooldown > 0 ? 'rgba(0,0,0,0.08)' : 'rgba(0,122,255,0.2)'}`,
            color: cooldown > 0 ? '#8e8e93' : '#007AFF',
            borderRadius: 10, fontSize: 13, fontWeight: 500,
            cursor: cooldown > 0 || resending || !email ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <RotateCcw size={13} />
          {resending ? 'Enviando…' : cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
        </button>
      </div>

      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, fontWeight: 300, color: '#8e8e93' }}>
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

export default function ConfirmarEmailCodigoPage() {
  return (
    <Suspense fallback={
      <div style={{
        background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16, padding: '36px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 13, color: '#8e8e93' }}>Carregando…</div>
      </div>
    }>
      <ConfirmarCodigoForm />
    </Suspense>
  )
}
