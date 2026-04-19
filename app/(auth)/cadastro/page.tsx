'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const TIPOS = [
  { value: 'cliente', label: 'Cliente', desc: 'Quero contratar um arquiteto' },
  { value: 'arquiteto', label: 'Arquiteto', desc: 'Quero captar projetos e clientes' },
  { value: 'fornecedor', label: 'Fornecedor', desc: 'Quero oferecer produtos e serviços' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: '#111',
  border: '1px solid #222',
  color: '#e8e8e8',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#666',
  marginBottom: 7,
  letterSpacing: '0.08em',
}

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tipo, setTipo] = useState<'cliente' | 'arquiteto' | 'fornecedor'>('cliente')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, tipo },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Profile is created automatically via database trigger on auth.users insert

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
        Criar conta
      </h1>
      <p style={{ fontSize: 13, color: '#4a4a4a', marginBottom: 32 }}>
        Escolha seu perfil e comece a usar a plataforma
      </p>

      <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Tipo de conta */}
        <div>
          <label style={labelStyle}>TIPO DE CONTA</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipo(t.value as typeof tipo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  background: tipo === t.value ? 'rgba(200,169,110,0.08)' : '#111',
                  border: `1px solid ${tipo === t.value ? '#c8a96e' : '#1e1e1e'}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: `2px solid ${tipo === t.value ? '#c8a96e' : '#333'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {tipo === t.value && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c8a96e' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tipo === t.value ? '#c8a96e' : '#888' }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 2 }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>NOME COMPLETO</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="João Silva"
            required
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#c8a96e')}
            onBlur={(e) => (e.target.style.borderColor = '#222')}
          />
        </div>

        <div>
          <label style={labelStyle}>EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#c8a96e')}
            onBlur={(e) => (e.target.style.borderColor = '#222')}
          />
        </div>

        <div>
          <label style={labelStyle}>SENHA</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
            style={inputStyle}
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
          {loading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
        </button>
      </form>

      <p style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: '#3a3a3a' }}>
        Já tem conta?{' '}
        <Link href="/login" style={{ color: '#c8a96e', textDecoration: 'none' }}>
          Entrar
        </Link>
      </p>
    </div>
  )
}
