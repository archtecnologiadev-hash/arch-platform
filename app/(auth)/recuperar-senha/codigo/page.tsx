'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'

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

function CodigoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<'code' | 'password'>('code')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(emailParam)
  }, [searchParams])

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) { setError('Informe o email.'); return }
    if (code.length !== 8) { setError('O código deve ter exatamente 8 dígitos.'); return }
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

    setLoading(false)
    setStep('password')
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('A senha deve ter no mínimo 8 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Não foi possível atualizar a senha. Tente solicitar um novo código.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/login?msg=senha-alterada')
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '36px 32px',
    boxShadow: 'var(--shadow-card)',
  }

  if (step === 'code') {
    return (
      <div style={card}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, marginBottom: 22,
          background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <KeyRound size={20} color="var(--accent)" strokeWidth={1.5} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 300, color: 'var(--text)', marginBottom: 6 }}>
          Digite o código
        </h1>
        <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.6 }}>
          Enviamos um código de 8 dígitos para seu email.<br />
          Verifique sua caixa de entrada e spam.
        </p>

        <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--text-2)', marginBottom: 6 }}>
              Código de 8 dígitos
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="00000000"
              required
              style={{
                ...inputBase,
                fontSize: 24,
                fontWeight: 400,
                letterSpacing: '0.3em',
                textAlign: 'center',
              }}
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

          <button type="submit" disabled={loading || code.length !== 8} style={{
            width: '100%', padding: '13px',
            background: loading || code.length !== 8 ? 'var(--btn-disabled)' : 'var(--btn-bg)',
            color: 'var(--btn-text)', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 400,
            cursor: loading || code.length !== 8 ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s', marginTop: 4,
          }}>
            {loading ? 'Verificando…' : 'Verificar código'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, fontWeight: 300, color: 'var(--text-3)' }}>
          Não recebeu?{' '}
          <Link href="/recuperar-senha" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>
            Enviar novo código
          </Link>
        </p>
        <p style={{ marginTop: 12, textAlign: 'center', fontSize: 13, fontWeight: 300, color: 'var(--text-3)' }}>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            color: 'var(--text-3)', textDecoration: 'none',
          }}>
            <ArrowLeft size={13} /> Voltar ao login
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div style={card}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 22,
        background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Lock size={20} color="#34c759" strokeWidth={1.5} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <h1 style={{ fontSize: 22, fontWeight: 300, color: 'var(--text)', margin: 0 }}>
          Nova senha
        </h1>
        <CheckCircle2 size={16} color="#34c759" />
      </div>
      <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-3)', marginBottom: 28 }}>
        Código verificado. Escolha uma nova senha segura.
      </p>

      <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--text-2)', marginBottom: 6 }}>
            Nova senha
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              style={{ ...inputBase, paddingRight: 42 }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-input)')}
            />
            <button type="button" onClick={() => setShowPass(s => !s)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0,
            }}>
              {showPass ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--text-2)', marginBottom: 6 }}>
            Confirmar senha
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repita a nova senha"
              required
              style={{ ...inputBase, paddingRight: 42 }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-input)')}
            />
            <button type="button" onClick={() => setShowConfirm(s => !s)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0,
            }}>
              {showConfirm ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
            </button>
          </div>
          {confirm && password !== confirm && (
            <p style={{ fontSize: 12, fontWeight: 300, color: '#ff3b30', marginTop: 6 }}>
              As senhas não coincidem.
            </p>
          )}
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
          transition: 'background 0.2s', marginTop: 4,
        }}>
          {loading ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}

export default function RecuperarSenhaCodigoPage() {
  return (
    <Suspense fallback={
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '36px 32px',
        boxShadow: 'var(--shadow-card)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-3)' }}>Carregando…</div>
      </div>
    }>
      <CodigoForm />
    </Suspense>
  )
}
