'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Mail, RotateCcw, CheckCircle2 } from 'lucide-react'

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

function PendingScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const [cooldown, setCooldown]   = useState(0)
  const [resending, setResending] = useState(false)
  const [toast, setToast]         = useState('')

  async function handleResend() {
    if (cooldown > 0 || resending) return
    setResending(true)
    setToast('')
    try {
      const res = await fetch('/api/auth/reenviar-confirmacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) {
        setToast(data.error)
      } else {
        setToast('Email reenviado!')
        let secs = 60
        setCooldown(secs)
        const iv = setInterval(() => {
          secs -= 1
          setCooldown(secs)
          if (secs <= 0) clearInterval(iv)
        }, 1000)
      }
    } catch {
      setToast('Erro ao reenviar. Tente novamente.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={{
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
        Confirmação enviada
      </h1>
      <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 6 }}>
        Enviamos um link de confirmação para
      </p>
      <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', marginBottom: 20 }}>
        {email}
      </p>
      <p style={{ fontSize: 13, color: '#8e8e93', lineHeight: 1.6, marginBottom: 28 }}>
        Verifique sua caixa de entrada e clique no link para ativar sua conta.
        Não esqueça de checar a pasta de spam.
      </p>

      {toast && (
        <div style={{
          marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 13,
          color: toast === 'Email reenviado!' ? '#059669' : '#ff3b30',
          padding: '10px 14px',
          background: toast === 'Email reenviado!' ? 'rgba(5,150,105,0.06)' : 'rgba(255,59,48,0.06)',
          borderRadius: 8,
          border: `1px solid ${toast === 'Email reenviado!' ? 'rgba(5,150,105,0.2)' : 'rgba(255,59,48,0.15)'}`,
        }}>
          {toast === 'Email reenviado!' && <CheckCircle2 size={14} />}
          {toast}
        </div>
      )}

      <button
        onClick={handleResend}
        disabled={cooldown > 0 || resending}
        style={{
          width: '100%', padding: '12px', marginBottom: 12,
          background: cooldown > 0 || resending ? '#f2f2f7' : 'rgba(0,122,255,0.08)',
          border: `1px solid ${cooldown > 0 || resending ? 'rgba(0,0,0,0.08)' : 'rgba(0,122,255,0.2)'}`,
          color: cooldown > 0 || resending ? '#8e8e93' : '#007AFF',
          borderRadius: 10, fontSize: 14, fontWeight: 500,
          cursor: cooldown > 0 || resending ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          transition: 'all 0.15s',
        }}
      >
        <RotateCcw size={14} />
        {resending ? 'Enviando…' : cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar email'}
      </button>

      <button
        onClick={onBack}
        style={{
          width: '100%', padding: '12px',
          background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
          color: '#6b6b6b', borderRadius: 10, fontSize: 14,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        Trocar email
      </button>
    </div>
  )
}

export default function CadastroPage() {
  const [step, setStep]         = useState<'form' | 'pending'>('form')
  const [sentEmail, setSentEmail] = useState('')
  const [nome, setNome]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [termos, setTermos]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, tipo: 'arquiteto' },
        emailRedirectTo: 'https://www.usearc.com.br/auth/confirm',
      },
    })

    console.log('[cadastro] signUp result:', { data, error: signUpError })

    if (signUpError) {
      console.error('[cadastro] signUp error:', signUpError.message)
      const msg = signUpError.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
        setError('Este email já está cadastrado. Faça login ou recupere sua senha.')
      } else if (msg.includes('invalid email')) {
        setError('Email inválido. Verifique o endereço informado.')
      } else if (msg.includes('password') && msg.includes('6')) {
        setError('A senha deve ter no mínimo 8 caracteres.')
      } else if (msg.includes('weak password') || msg.includes('should be at least')) {
        setError('A senha deve ter no mínimo 8 caracteres.')
      } else if (msg.includes('rate limit') || msg.includes('too many')) {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      } else {
        setError(`Erro ao criar conta: ${signUpError.message}`)
      }
      setLoading(false)
      return
    }

    // When email confirmation is ON, Supabase returns success for duplicate emails
    // but data.user.identities will be empty — detect and surface the error
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      console.warn('[cadastro] identities empty — email already registered:', email)
      setError('Este email já está cadastrado. Faça login ou recupere sua senha.')
      setLoading(false)
      return
    }

    console.log('[cadastro] user created, awaiting confirmation:', data.user?.id)
    setSentEmail(email)
    setStep('pending')
    setLoading(false)
  }

  if (step === 'pending') {
    return <PendingScreen email={sentEmail} onBack={() => { setStep('form'); setEmail(''); setPassword('') }} />
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: '36px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 300, color: '#1a1a1a', marginBottom: 6 }}>
        Criar conta de arquiteto
      </h1>
      <p style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93', marginBottom: 28 }}>
        Comece a gerenciar seu escritório em minutos.
      </p>

      <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#6b6b6b', marginBottom: 6 }}>
            Nome completo
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="João Silva"
            required
            style={inputBase}
            onFocus={(e) => (e.target.style.borderColor = '#007AFF')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />
        </div>

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
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#6b6b6b', marginBottom: 6 }}>
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
            style={inputBase}
            onFocus={(e) => (e.target.style.borderColor = '#007AFF')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={termos}
            onChange={e => setTermos(e.target.checked)}
            style={{ marginTop: 2, accentColor: '#007AFF', width: 15, height: 15, flexShrink: 0 }}
          />
          <span style={{ fontSize: 12, fontWeight: 300, color: '#6b6b6b', lineHeight: 1.6 }}>
            Li e concordo com os{' '}
            <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer" style={{ color: '#007AFF', textDecoration: 'none' }}>
              Termos de Uso
            </a>{' '}
            e a{' '}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ color: '#007AFF', textDecoration: 'none' }}>
              Política de Privacidade
            </a>
          </span>
        </label>

        {error && (
          <p style={{
            fontSize: 13, color: '#ff3b30', textAlign: 'center', margin: 0,
            padding: '10px 14px', background: 'rgba(255,59,48,0.06)',
            borderRadius: 8, border: '1px solid rgba(255,59,48,0.15)',
          }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !termos}
          style={{
            width: '100%',
            padding: '13px',
            background: loading || !termos ? '#a0c4ff' : '#007AFF',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 400,
            cursor: loading || !termos ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s',
            marginTop: 4,
          }}
        >
          {loading ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, fontWeight: 300, color: '#8e8e93' }}>
        Já tem conta?{' '}
        <Link href="/login" style={{ color: '#007AFF', textDecoration: 'none' }}>
          Entrar
        </Link>
      </p>
    </div>
  )
}
