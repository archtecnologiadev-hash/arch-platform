'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    const tipo = data.user?.user_metadata?.tipo ?? 'cliente'
    router.push(`/${tipo}/dashboard`)
    router.refresh()
  }

  return (
    <div
      style={{
        background: '#0d0d0d',
        border: '1px solid #1c1c1c',
        padding: '40px 36px',
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#e8e8e8',
          marginBottom: 6,
          letterSpacing: '0.02em',
        }}
      >
        Entrar
      </h1>
      <p style={{ fontSize: 13, color: '#4a4a4a', marginBottom: 32 }}>
        Acesse sua conta na ARCH Platform
      </p>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 7, letterSpacing: '0.08em' }}>
            EMAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            style={{
              width: '100%',
              padding: '11px 14px',
              background: '#111',
              border: '1px solid #222',
              color: '#e8e8e8',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#c8a96e')}
            onBlur={(e) => (e.target.style.borderColor = '#222')}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <label style={{ fontSize: 12, color: '#666', letterSpacing: '0.08em' }}>SENHA</label>
            <Link href="#" style={{ fontSize: 11, color: '#c8a96e', textDecoration: 'none' }}>
              Esqueceu a senha?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              width: '100%',
              padding: '11px 14px',
              background: '#111',
              border: '1px solid #222',
              color: '#e8e8e8',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#c8a96e')}
            onBlur={(e) => (e.target.style.borderColor = '#222')}
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#ef4444', textAlign: 'center', margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            background: loading ? '#2a2010' : '#c8a96e',
            color: loading ? '#666' : '#0d0d0d',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.15em',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            marginTop: 4,
          }}
        >
          {loading ? 'ENTRANDO...' : 'ENTRAR'}
        </button>
      </form>

      <p style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: '#3a3a3a' }}>
        Não tem conta?{' '}
        <Link href="/cadastro" style={{ color: '#c8a96e', textDecoration: 'none' }}>
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
