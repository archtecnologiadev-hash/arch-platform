'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

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
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const supabase = createClient()

    console.log('[nova-senha] href:', window.location.href)

    if (params.get('erro') === 'link-invalido') {
      console.log('[nova-senha] flow=erro-param')
      setInvalidLink(true)
      return
    }

    const tokenHash = params.get('token_hash')
    const type = params.get('type')
    if (tokenHash && type === 'recovery') {
      console.log('[nova-senha] flow=token_hash')
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
        console.log('[nova-senha] verifyOtp:', error?.message ?? 'ok')
        if (error) setInvalidLink(true)
        else { window.history.replaceState({}, '', '/nova-senha'); setReady(true) }
      })
      return
    }

    const code = params.get('code')
    if (code) {
      console.log('[nova-senha] flow=code (PKCE direto)')
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        console.log('[nova-senha] exchangeCode:', error?.message ?? 'ok', 'session=', !!data?.session)
        if (error) setInvalidLink(true)
        else { window.history.replaceState({}, '', '/nova-senha'); setReady(true) }
      })
      return
    }

    const accessToken = hash.get('access_token')
    const refreshToken = hash.get('refresh_token')
    if (accessToken && refreshToken) {
      console.log('[nova-senha] flow=hash-implicit')
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        console.log('[nova-senha] setSession:', error?.message ?? 'ok')
        if (error) setInvalidLink(true)
        else { window.history.replaceState({}, '', '/nova-senha'); setReady(true) }
      })
      return
    }

    console.log('[nova-senha] flow=getSession (via /auth/confirm)')
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[nova-senha] getSession: session=', !!session)
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
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '36px 32px',
    boxShadow: 'var(--shadow-card)',
    textAlign: 'center',
  }

  if (done) {
    return (
      <div style={card}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={26} color="#34c759" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 300, color: 'var(--text)', marginBottom: 10 }}>Senha atualizada!</h2>
        <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 24 }}>
          Sua senha foi alterada com sucesso.<br />Redirecionando para o login…
        </p>
        <Link href="/login" style={{ fontSize: 13, color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>
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
        <h2 style={{ fontSize: 20, fontWeight: 300, color: 'var(--text)', marginBottom: 10 }}>Link inválido ou expirado</h2>
        <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 28 }}>
          O link de recuperação expirou ou já foi utilizado.<br />Solicite um novo link para continuar.
        </p>
        <Link href="/recuperar-senha" style={{ display: 'inline-block', padding: '11px 24px', background: 'var(--btn-bg)', color: 'var(--btn-text)', fontSize: 13, fontWeight: 400, borderRadius: 10, textDecoration: 'none' }}>
          Solicitar novo link
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={{ ...card }}>
        <div style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-3)' }}>Verificando sessão…</div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '36px 32px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 22, background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Lock size={20} color="var(--accent)" strokeWidth={1.5} />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 300, color: 'var(--text)', marginBottom: 6 }}>Nova senha</h1>
      <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text-3)', marginBottom: 28 }}>
        Escolha uma nova senha segura para sua conta.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--text-2)', marginBottom: 6 }}>Nova senha</label>
          <div style={{ position: 'relative' }}>
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required style={inputBase}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border-input)')} />
            <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}>
              {showPass ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--text-2)', marginBottom: 6 }}>Confirmar senha</label>
          <div style={{ position: 'relative' }}>
            <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repita a nova senha" required style={inputBase}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border-input)')} />
            <button type="button" onClick={() => setShowConfirm(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}>
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

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? 'var(--btn-disabled)' : 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 400, cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s', marginTop: 4 }}>
          {loading ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}
