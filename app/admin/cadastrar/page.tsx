'use client'

import { useState } from 'react'
import { UserPlus, Copy, CheckCircle2, Loader2, Eye, EyeOff, Star } from 'lucide-react'

const TIPOS = ['arquiteto', 'fornecedor', 'cliente']

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.12)', color: 'var(--text)',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
}
const lbl: React.CSSProperties = {
  fontSize: 11, color: 'var(--text-2)', fontWeight: 500, display: 'block', marginBottom: 5, letterSpacing: '0.03em',
}

interface FormState {
  nome: string; email: string; telefone: string; tipo: string
  cidade: string; trial_dias: string; isFundador: boolean; observacao_admin: string
}

interface Result { senha_provisoria: string; user_id: string; isFundador: boolean }

export default function AdminCadastrar() {
  const [form, setForm] = useState<FormState>({
    nome: '', email: '', telefone: '', tipo: 'arquiteto',
    cidade: '', trial_dias: '', isFundador: false, observacao_admin: '',
  })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showSenha, setShowSenha] = useState(false)

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.email || !form.tipo) { setError('Nome, email e tipo são obrigatórios'); return }
    setSaving(true); setError(''); setResult(null)

    const res = await fetch('/api/admin/criar-usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || undefined,
        tipo: form.tipo,
        cidade: form.cidade || undefined,
        trial_dias: (!form.isFundador && form.trial_dias) ? parseInt(form.trial_dias) : undefined,
        isFundador: form.isFundador,
        observacao_admin: form.observacao_admin || undefined,
      }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setSaving(false); return }
    setResult(data)
    setSaving(false)
    setForm({ nome: '', email: '', telefone: '', tipo: 'arquiteto', cidade: '', trial_dias: '', isFundador: false, observacao_admin: '' })
  }

  function copyPassword() {
    if (!result) return
    navigator.clipboard.writeText(result.senha_provisoria)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: 32, color: 'var(--text)', background: 'var(--bg)', minHeight: '100vh', maxWidth: 680 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserPlus size={20} color="var(--accent)" /> Cadastrar Usuário
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Cadastro manual com senha provisória automática</p>
      </div>

      {/* Success card */}
      {result && (
        <div style={{
          marginBottom: 24,
          background: result.isFundador ? 'rgba(251,191,36,0.07)' : 'rgba(52,211,153,0.07)',
          border: `1px solid ${result.isFundador ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.2)'}`,
          borderRadius: 12, padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            {result.isFundador
              ? <Star size={18} color="#b45309" fill="#fbbf24" />
              : <CheckCircle2 size={18} color="#34d399" />}
            <span style={{ fontSize: 14, fontWeight: 500, color: result.isFundador ? '#92400e' : '#34d399' }}>
              {result.isFundador ? 'Fundador cadastrado! Email de boas-vindas enviado.' : 'Usuário criado com sucesso'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
            ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-3)' }}>{result.user_id}</span>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.04em', marginBottom: 4 }}>SENHA PROVISÓRIA</div>
              <div style={{ fontFamily: 'monospace', fontSize: 15, color: 'var(--accent)', letterSpacing: '0.05em' }}>
                {showSenha ? result.senha_provisoria : '•'.repeat(result.senha_provisoria.length)}
              </div>
            </div>
            <button onClick={() => setShowSenha(s => !s)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}>
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
          {result.isFundador && (
            <p style={{ fontSize: 11.5, color: '#92400e', marginTop: 8 }}>
              O fundador recebeu um email com as credenciais de acesso.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.04em', marginBottom: 18 }}>Informações do Usuário</p>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Tipo *</label>
                <select required value={form.tipo} onChange={e => set('tipo', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              {!form.isFundador && (
                <div>
                  <label style={lbl}>Trial (dias)</label>
                  <input type="number" min={0} max={365} value={form.trial_dias} onChange={e => set('trial_dias', e.target.value)} placeholder="14" style={inp}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')} />
                </div>
              )}
            </div>

            {/* Fundador checkbox */}
            <div style={{
              background: form.isFundador ? 'rgba(251,191,36,0.08)' : '#f9f9f9',
              border: `1px solid ${form.isFundador ? 'rgba(251,191,36,0.35)' : 'rgba(0,0,0,0.08)'}`,
              borderRadius: 10, padding: '14px 16px', transition: 'all 0.2s',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isFundador}
                  onChange={e => set('isFundador', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#b45309', cursor: 'pointer', flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: form.isFundador ? '#92400e' : '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={13} color={form.isFundador ? '#b45309' : '#c7c7cc'} fill={form.isFundador ? '#fbbf24' : 'none'} />
                    Cadastrar como Fundador (acesso vitalício gratuito)
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                    Sem necessidade de cartão. Status permanente até revogação manual.
                  </div>
                </div>
              </label>
            </div>

            {/* Observação interna */}
            <div>
              <label style={lbl}>Observação interna (visível apenas no admin)</label>
              <textarea
                value={form.observacao_admin}
                onChange={e => set('observacao_admin', e.target.value)}
                placeholder="Ex: Parceiro estratégico, indicação de João..."
                rows={2}
                style={{ ...inp, resize: 'none', lineHeight: 1.5 }}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')}
              />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            marginTop: 22, width: '100%', padding: '13px', borderRadius: 10, fontSize: 13.5, fontWeight: 600,
            background: saving ? 'rgba(0,0,0,0.06)' : (form.isFundador ? '#92400e' : '#007AFF'),
            color: saving ? '#8e8e93' : '#ffffff',
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.2s',
          }}>
            {saving
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Criando...</>
              : form.isFundador
                ? <><Star size={15} fill="#fbbf24" color="#fbbf24" /> Cadastrar como Fundador</>
                : <><UserPlus size={15} /> Cadastrar Usuário</>}
          </button>
        </div>
      </form>
    </div>
  )
}
