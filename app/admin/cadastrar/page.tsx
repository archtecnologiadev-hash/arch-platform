'use client'

import { useState } from 'react'
import { UserPlus, Copy, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react'

const TIPOS = ['arquiteto', 'fornecedor', 'cliente']
const PLANOS = ['free', 'arquiteto', 'fornecedor']

const inp: React.CSSProperties = {
  width: '100%', background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#1a1a1a',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
}
const lbl: React.CSSProperties = {
  fontSize: 11, color: '#6b6b6b', fontWeight: 500, display: 'block', marginBottom: 5, letterSpacing: '0.03em',
}
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

interface FormState {
  nome: string; email: string; telefone: string; tipo: string
  plano: string; cidade: string; trial_dias: string
}

interface Result { senha_provisoria: string; user_id: string }

export default function AdminCadastrar() {
  const [form, setForm] = useState<FormState>({
    nome: '', email: '', telefone: '', tipo: 'arquiteto', plano: 'free', cidade: '', trial_dias: '',
  })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showSenha, setShowSenha] = useState(false)

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.email || !form.tipo) { setError('Nome, email e tipo são obrigatórios'); return }
    setSaving(true)
    setError('')
    setResult(null)

    const res = await fetch('/api/admin/criar-usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || undefined,
        tipo: form.tipo,
        plano: form.plano,
        cidade: form.cidade || undefined,
        trial_dias: form.trial_dias ? parseInt(form.trial_dias) : undefined,
      }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setSaving(false); return }
    setResult(data)
    setSaving(false)
    setForm({ nome: '', email: '', telefone: '', tipo: 'arquiteto', plano: 'free', cidade: '', trial_dias: '' })
  }

  function copyPassword() {
    if (!result) return
    navigator.clipboard.writeText(result.senha_provisoria)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: 32, color: '#1a1a1a', background: '#f2f2f7', minHeight: '100vh', maxWidth: 680 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#1a1a1a', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserPlus size={20} color="#007AFF" /> Cadastrar Usuário
        </h1>
        <p style={{ fontSize: 13, color: '#8e8e93' }}>Cadastro manual com senha provisória automática</p>
      </div>

      {/* Success card */}
      {result && (
        <div style={{
          marginBottom: 24, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)',
          borderRadius: 12, padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle2 size={18} color="#34d399" />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#34d399' }}>Usuário criado com sucesso</span>
          </div>
          <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 10 }}>
            ID: <span style={{ fontFamily: 'monospace', color: '#8e8e93' }}>{result.user_id}</span>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#8e8e93', fontWeight: 500, letterSpacing: '0.04em', marginBottom: 4 }}>SENHA PROVISÓRIA</div>
              <div style={{ fontFamily: 'monospace', fontSize: 15, color: '#007AFF', letterSpacing: '0.05em' }}>
                {showSenha ? result.senha_provisoria : '•'.repeat(result.senha_provisoria.length)}
              </div>
            </div>
            <button onClick={() => setShowSenha(s => !s)} style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: 4 }}>
              {showSenha ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button onClick={copyPassword} style={{
              background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(0,122,255,0.08)',
              border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(0,122,255,0.2)'}`,
              color: copied ? '#34d399' : '#007AFF',
              borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {copied ? <><CheckCircle2 size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#8e8e93', marginTop: 8 }}>
            Compartilhe a senha com o usuário. Ele poderá alterá-la no primeiro login.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#007AFF', letterSpacing: '0.04em', marginBottom: 18 }}>Informações do Usuário</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Nome completo *</label>
                <input required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="João Silva" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
              <div>
                <label style={lbl}>Email *</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="joao@email.com" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Telefone</label>
                <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-9999" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
              <div>
                <label style={lbl}>Cidade</label>
                <input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="São Paulo" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label style={lbl}>Tipo *</label>
                <select required value={form.tipo} onChange={e => set('tipo', e.target.value)} style={sel}>
                  {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Plano</label>
                <select value={form.plano} onChange={e => set('plano', e.target.value)} style={sel}>
                  {PLANOS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Trial (dias)</label>
                <input type="number" min={0} max={365} value={form.trial_dias} onChange={e => set('trial_dias', e.target.value)} placeholder="0 = sem trial" style={inp}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            marginTop: 22, width: '100%', padding: '13px', borderRadius: 10, fontSize: 13.5, fontWeight: 600,
            background: saving ? 'rgba(0,0,0,0.06)' : '#007AFF', color: saving ? '#8e8e93' : '#ffffff',
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Criando...</> : <><UserPlus size={15} /> Cadastrar Usuário</>}
          </button>
        </div>
      </form>
    </div>
  )
}
