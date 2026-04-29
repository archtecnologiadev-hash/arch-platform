'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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

export default function CadastroPage() {
  const router = useRouter()
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

    try {
      console.log('[cadastro] 1. iniciando signUp para:', email)

      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome, tipo: 'arquiteto' } },
      })

      console.log('[cadastro] 2. signUp retornou:', {
        userId: data?.user?.id ?? null,
        identities: data?.user?.identities?.length ?? 'null user',
        hasSession: !!data?.session,
        error: signUpError?.message ?? null,
      })

      if (signUpError) {
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
        } else if (msg.includes('signup') && msg.includes('disabled')) {
          setError('Cadastro desabilitado. Entre em contato com o suporte.')
        } else {
          setError(`Erro ao criar conta: ${signUpError.message}`)
        }
        setLoading(false)
        return
      }

      // Supabase returns success silently for duplicate emails when confirm is ON
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        console.warn('[cadastro] 3. identities vazio — email já cadastrado')
        setError('Este email já está cadastrado. Faça login ou recupere sua senha.')
        setLoading(false)
        return
      }

      const targetUrl = `/confirmar-email/codigo?email=${encodeURIComponent(email)}`
      console.log('[cadastro] 3. sucesso, redirecionando para:', targetUrl)

      setLoading(false)
      router.push(targetUrl)

      // Fallback: se router.push não navegar em 800ms, força via window.location
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname.includes('/cadastro')) {
          console.warn('[cadastro] fallback redirect via window.location')
          window.location.href = targetUrl
        }
      }, 800)

    } catch (err) {
      console.error('[cadastro] erro inesperado:', err)
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
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
            width: '100%', padding: '13px',
            background: loading || !termos ? '#a0c4ff' : '#007AFF',
            color: '#ffffff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 400,
            cursor: loading || !termos ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s', marginTop: 4,
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
