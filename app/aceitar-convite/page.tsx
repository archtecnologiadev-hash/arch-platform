'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Convite {
  id: string
  email: string
  nome: string
  cargo: string | null
  nivel_permissao: string
  escritorio_id: string
  escritorios: { nome: string } | null
}

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: '#f2f2f7',
  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontSize: 14,
  color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

function AceitarConviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading]     = useState(true)
  const [convite, setConvite]     = useState<Convite | null>(null)
  const [invalid, setInvalid]     = useState(false)
  const [form, setForm]           = useState({ senha: '', confirmar: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

  useEffect(() => {
    if (!token) { setInvalid(true); setLoading(false); return }
    async function fetchConvite() {
      const supabase = createClient()
      const { data } = await supabase
        .from('convites_equipe')
        .select('id, email, nome, cargo, nivel_permissao, escritorio_id, escritorios(nome)')
        .eq('token', token)
        .eq('status', 'pendente')
        .single()
      if (!data) { setInvalid(true) }
      else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const esc = (data as any).escritorios
        setConvite({ ...data, escritorios: Array.isArray(esc) ? esc[0] ?? null : esc ?? null })
      }
      setLoading(false)
    }
    fetchConvite()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!convite) return
    if (form.senha !== form.confirmar) { setError('As senhas não coincidem.'); return }
    if (form.senha.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    setSubmitting(true); setError(null)

    const supabase = createClient()

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: convite.email,
      password: form.senha,
      options: { data: { nome: convite.nome } },
    })

    if (signUpError) {
      setError(`Erro ao criar conta: ${signUpError.message}`)
      setSubmitting(false); return
    }
    if (!authData.user) {
      setError('Erro ao criar conta. Tente novamente.')
      setSubmitting(false); return
    }

    // Upsert user record with team info
    await supabase.from('users').upsert({
      id: authData.user.id,
      nome: convite.nome,
      email: convite.email,
      cargo: convite.cargo,
      escritorio_vinculado_id: convite.escritorio_id,
      nivel_permissao: convite.nivel_permissao,
    }, { onConflict: 'id' })

    // Mark invite accepted
    await supabase.from('convites_equipe').update({
      status: 'aceito',
      aceito_em: new Date().toISOString(),
    }).eq('id', convite.id)

    // Auto sign-in
    await supabase.auth.signInWithPassword({ email: convite.email, password: form.senha })

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => router.push('/arquiteto/dashboard'), 1500)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f2f7' }}>
      <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (invalid) return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <AlertCircle size={40} color="#ef4444" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Convite inválido</h2>
        <p style={{ fontSize: 13, color: '#6b6b6b' }}>Este link não é válido ou já foi utilizado.</p>
      </div>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CheckCircle2 size={44} color="#34d399" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Bem-vindo à equipe!</h2>
        <p style={{ fontSize: 13, color: '#6b6b6b' }}>Conta criada. Redirecionando para o painel...</p>
      </div>
    </div>
  )

  const escritorioNome = convite?.escritorios?.nome ?? 'Escritório'

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, padding: '36px 32px', maxWidth: 440, width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 22, fontWeight: 300, letterSpacing: '0.35em', color: '#007AFF' }}>ARC</span>
        </div>

        <div style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.18)', borderRadius: 12, padding: '16px 18px', marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#007AFF', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>CONVITE PARA EQUIPE</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{escritorioNome}</div>
          <div style={{ fontSize: 13, color: '#6b6b6b' }}>
            Você foi convidado como <strong>{convite?.cargo || convite?.nivel_permissao}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>E-mail</label>
            <input value={convite?.email ?? ''} disabled style={{ ...inp, background: '#f7f7f7', color: '#8e8e93', cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Crie sua senha *</label>
            <input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
              placeholder="Mínimo 6 caracteres" style={inp}
              onFocus={e => (e.target.style.borderColor = '#007AFF')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Confirmar senha *</label>
            <input type="password" value={form.confirmar} onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
              placeholder="Repita a senha" style={inp}
              onFocus={e => (e.target.style.borderColor = '#007AFF')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#ef4444' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting || !form.senha || !form.confirmar}
            style={{ padding: '13px', background: submitting || !form.senha || !form.confirmar ? 'rgba(0,122,255,0.4)' : '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Criando conta...</> : 'Entrar na equipe →'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AceitarConvitePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f2f7' }}>
        <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <AceitarConviteContent />
    </Suspense>
  )
}
