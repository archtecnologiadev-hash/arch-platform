'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: '#111',
  border: '1px solid #222', color: '#e8e8e8', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
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
    const supabase = createClient()
    // Supabase processes the hash and fires PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // Also check if already in a recovery session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    // If no event fires within 4 seconds, the link is invalid or expired
    const timer = setTimeout(() => {
      setInvalidLink(prev => {
        if (!ready) return true
        return prev
      })
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Once ready, cancel the invalid-link timer
  useEffect(() => {
    if (ready) setInvalidLink(false)
  }, [ready])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/login'), 3000)
  }

  if (done) {
    return (
      <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', padding: '40px 36px', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle2 size={26} color="#34d399" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e8e8e8', marginBottom: 10 }}>
          Senha atualizada!
        </h2>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 24 }}>
          Sua senha foi alterada com sucesso.<br />
          Redirecionando para o login...
        </p>
        <Link href="/login" style={{
          fontSize: 13, color: '#c8a96e', textDecoration: 'none', fontWeight: 600,
        }}>
          Ir para o login agora
        </Link>
      </div>
    )
  }

  if (invalidLink) {
    return (
      <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', padding: '40px 36px', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertCircle size={26} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e8e8e8', marginBottom: 10 }}>
          Link inválido ou expirado
        </h2>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 28 }}>
          O link de recuperação expirou ou já foi utilizado.<br />
          Solicite um novo link.
        </p>
        <Link href="/recuperar-senha" style={{
          display: 'inline-block', padding: '11px 24px',
          background: '#c8a96e', color: '#0d0d0d',
          fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'none',
        }}>
          SOLICITAR NOVO LINK
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', padding: '40px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#444' }}>Verificando link de recuperação...</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', padding: '40px 36px' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, marginBottom: 24,
        background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Lock size={20} color="#c8a96e" />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e8e8', marginBottom: 6, letterSpacing: '0.02em' }}>
        Nova senha
      </h1>
      <p style={{ fontSize: 13, color: '#4a4a4a', marginBottom: 32 }}>
        Escolha uma nova senha segura para sua conta.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 7, letterSpacing: '0.08em' }}>
            NOVA SENHA
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              style={{ ...inp, paddingRight: 42 }}
              onFocus={e => (e.target.style.borderColor = '#c8a96e')}
              onBlur={e => (e.target.style.borderColor = '#222')}
            />
            <button type="button" onClick={() => setShowPass(s => !s)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 0,
            }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 7, letterSpacing: '0.08em' }}>
            CONFIRMAR SENHA
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repita a nova senha"
              required
              style={{ ...inp, paddingRight: 42 }}
              onFocus={e => (e.target.style.borderColor = '#c8a96e')}
              onBlur={e => (e.target.style.borderColor = '#222')}
            />
            <button type="button" onClick={() => setShowConfirm(s => !s)} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 0,
            }}>
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {confirm && password !== confirm && (
          <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>As senhas não coincidem.</p>
        )}

        {error && (
          <p style={{ fontSize: 13, color: '#ef4444', margin: 0, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '13px',
          background: loading ? '#2a2010' : '#c8a96e',
          color: loading ? '#666' : '#0d0d0d',
          border: 'none', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.15em', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s', marginTop: 4,
        }}>
          {loading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
        </button>
      </form>
    </div>
  )
}
