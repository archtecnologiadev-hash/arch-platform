'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

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
  paddingRight: 42,
}

export default function NovaSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('erro') === 'link-invalido') {
      setInvalidLink(true)
      return
    }

    const supabase = createClient()

    // Flow 1: link customizado via Resend — token_hash do admin.generateLink
    const tokenHash = params.get('token_hash')
    const type = params.get('type')
    if (tokenHash && type === 'recovery') {
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
        if (error) {
          setInvalidLink(true)
        } else {
          window.history.replaceState({}, '', '/nova-senha')
          setReady(true)
        }
      })
      return
    }

    // Flow 2: PKCE code (ex: via /auth/confirm)
    const code = params.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setInvalidLink(true)
        } else {
          window.history.replaceState({}, '', '/nova-senha')
          setReady(true)
        }
      })
      return
    }

    // Flow 3: sessão já existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setInvalidLink(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('A senha deve ter no mínimo 8 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError('Não foi possível atualizar a senha. Tente solicitar um novo link.'); setLoading(false); return }
    await supabase.auth.signOut()
    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/login'), 3000)
  }

  const card: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 16,
    padding: '36px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    textAlign: 'center',
  }

  if (done) {
    return (
      <div style={card}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={26} color="#34c759" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 300, color: '#1a1a1a', marginBottom: 10 }}>Senha atualizada!</h2>
        <p style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93', lineHeight: 1.6, marginBottom: 24 }}>
          Sua senha foi alterada com sucesso.<br />Redirecionando para o login…
        </p>
        <Link href="/login" style={{ fontSize: 13, color: '#007AFF', textDecoration: 'none' }}>
          Ir para o login agora
        </Link>
      </div>
    )
  }

  if (invalidLink) {
    return (
      <div style={card}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={26} color="#ff3b30" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 300, color: '#1a1a1a', marginBottom: 10 }}>Link inválido ou expirado</h2>
        <p style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93', lineHeight: 1.6, marginBottom: 28 }}>
          O link de recuperação expirou ou já foi utilizado.<br />Solicite um novo link para continuar.
        </p>
        <Link href="/recuperar-senha" style={{ display: 'inline-block', padding: '11px 24px', background: '#007AFF', color: '#ffffff', fontSize: 13, fontWeight: 400, borderRadius: 10, textDecoration: 'none' }}>
          Solicitar novo link
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={{ ...card }}>
        <div style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93' }}>Verificando sessão…</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '36px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 22, background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Lock size={20} color="#007AFF" strokeWidth={1.5} />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 300, color: '#1a1a1a', marginBottom: 6 }}>Nova senha</h1>
      <p style={{ fontSize: 13, fontWeight: 300, color: '#8e8e93', marginBottom: 28 }}>
        Escolha uma nova senha segura para sua conta.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#6b6b6b', marginBottom: 6 }}>Nova senha</label>
          <div style={{ position: 'relative' }}>
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required style={inputBase}
              onFocus={e => (e.target.style.borderColor = '#007AFF')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')} />
            <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 0 }}>
              {showPass ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: '#6b6b6b', marginBottom: 6 }}>Confirmar senha</label>
          <div style={{ position: 'relative' }}>
            <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a nova senha" required style={inputBase}
              onFocus={e => (e.target.style.borderColor = '#007AFF')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')} />
            <button type="button" onClick={() => setShowConfirm(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 0 }}>
              {showConfirm ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
            </button>
          </div>
          {confirm && password !== confirm && (
            <p style={{ fontSize: 12, fontWeight: 300, color: '#ff3b30', marginTop: 6 }}>As senhas não coincidem.</p>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#ff3b30', margin: 0, padding: '10px 14px', background: 'rgba(255,59,48,0.06)', borderRadius: 8, border: '1px solid rgba(255,59,48,0.15)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#a0c4ff' : '#007AFF', color: '#ffffff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 400, cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s', marginTop: 4 }}>
          {loading ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}
