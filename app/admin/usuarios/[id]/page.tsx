'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertTriangle, Trash2, ShieldOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface UserData {
  id: string; nome: string; email: string; tipo: string; plano: string
  status_conta: string; telefone: string; trial_ate: string | null
  role: string; created_at: string
}

interface LogEntry { id: number; acao: string; detalhes: Record<string, unknown>; created_at: string }

const inp: React.CSSProperties = {
  width: '100%', background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', color: '#1a1a1a',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
}
const lbl: React.CSSProperties = { fontSize: 11, color: '#6b6b6b', fontWeight: 500, display: 'block', marginBottom: 5, letterSpacing: '0.03em' }
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

export default function EditarUsuario() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.id as string

  const [form, setForm] = useState<UserData | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: user }, { data: logData }] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase.from('admin_log').select('id, acao, detalhes, created_at').eq('target_user_id', userId).order('created_at', { ascending: false }).limit(20),
      ])
      if (user) setForm(user as UserData)
      setLogs((logData as LogEntry[]) ?? [])
      setLoading(false)
    }
    load()
  }, [userId])

  function set(field: keyof UserData, value: string) {
    setForm(prev => prev ? { ...prev, [field]: value } : null)
    setSaved(false)
    setError('')
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    setError('')
    const res = await fetch(`/api/admin/usuario/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome, email: form.email, telefone: form.telefone,
        tipo: form.tipo, plano: form.plano, status_conta: form.status_conta,
        trial_ate: form.trial_ate, role: form.role,
      }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setSaving(false); return }
    setSaved(true)
    setSaving(false)
  }

  async function handleSuspend() {
    if (!form) return
    setSaving(true)
    await fetch(`/api/admin/usuario/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status_conta: 'suspenso' }),
    })
    setForm(prev => prev ? { ...prev, status_conta: 'suspenso' } : null)
    setSaving(false)
    setSaved(true)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/admin/usuario/${userId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.error) { setError(data.error); setDeleting(false); return }
    router.push('/admin/usuarios')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7' }}>
      <Loader2 size={26} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!form) return (
    <div style={{ padding: 32, color: '#8e8e93', background: '#f2f2f7', minHeight: '100vh' }}>Usuário não encontrado.</div>
  )

  return (
    <div style={{ padding: 32, color: '#1a1a1a', background: '#f2f2f7', minHeight: '100vh', maxWidth: 900 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link href="/admin/usuarios" style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#007AFF',
          textDecoration: 'none', padding: '6px 12px', border: '1px solid rgba(0,122,255,0.25)', borderRadius: 8,
          background: 'rgba(0,122,255,0.06)',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,122,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,122,255,0.06)')}>
          <ArrowLeft size={13} /> Voltar
        </Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>{form.nome}</h1>
          <p style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>
            ID: <span style={{ fontFamily: 'monospace', color: '#6b6b6b' }}>{userId}</span>
            {' · '}Cadastrado em {new Date(form.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Form */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#007AFF', letterSpacing: '0.04em', marginBottom: 18 }}>Dados do Usuário</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Nome</label>
                <input value={form.nome} onChange={e => set('nome', e.target.value)} style={inp}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input value={form.email} onChange={e => set('email', e.target.value)} style={inp}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
            </div>

            <div>
              <label style={lbl}>Telefone</label>
              <input value={form.telefone ?? ''} onChange={e => set('telefone', e.target.value)} style={inp}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div>
                <label style={lbl}>Tipo</label>
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} style={sel}>
                  <option value="arquiteto">Arquiteto</option>
                  <option value="fornecedor">Fornecedor</option>
                  <option value="cliente">Cliente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Plano</label>
                <select value={form.plano ?? 'free'} onChange={e => set('plano', e.target.value)} style={sel}>
                  <option value="free">Free</option>
                  <option value="arquiteto">Arquiteto</option>
                  <option value="fornecedor">Fornecedor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select value={form.status_conta ?? 'ativo'} onChange={e => set('status_conta', e.target.value)} style={sel}>
                  <option value="ativo">Ativo</option>
                  <option value="trial">Trial</option>
                  <option value="suspenso">Suspenso</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Role</label>
                <select value={form.role ?? 'user'} onChange={e => set('role', e.target.value)} style={sel}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label style={lbl}>Trial até</label>
              <input type="datetime-local" value={form.trial_ate ? form.trial_ate.slice(0, 16) : ''} onChange={e => set('trial_ate', e.target.value)} style={inp}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.12)')} />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>
              {error}
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            marginTop: 20, width: '100%', padding: '12px', borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: saved ? 'rgba(52,211,153,0.1)' : '#007AFF',
            color: saved ? '#34d399' : '#ffffff',
            border: saved ? '1px solid rgba(52,211,153,0.3)' : 'none',
            cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {saved ? <><CheckCircle2 size={14} /> Salvo</> : saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><Save size={14} /> Salvar</>}
          </button>
        </div>

        {/* Sidebar actions + logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Actions */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#8e8e93', letterSpacing: '0.04em', marginBottom: 14 }}>AÇÕES</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleSuspend} disabled={saving || form.status_conta === 'suspenso'} style={{
                width: '100%', padding: '10px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(239,180,60,0.08)', border: '1px solid rgba(239,180,60,0.2)', color: '#f59e0b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: form.status_conta === 'suspenso' ? 0.4 : 1,
              }}>
                <ShieldOff size={13} />
                {form.status_conta === 'suspenso' ? 'Já suspenso' : 'Suspender conta'}
              </button>

              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} style={{
                  width: '100%', padding: '10px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}>
                  <Trash2 size={13} /> Excluir conta
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <AlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 3 }}>Excluir permanentemente?</div>
                      <div style={{ fontSize: 11, color: '#8e8e93', lineHeight: 1.5 }}>
                        Todos os dados vinculados — projetos, orçamentos, conversas e arquivos — serão apagados. Essa ação é irreversível.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setConfirmDelete(false)} disabled={deleting} style={{
                      flex: 1, padding: '8px', borderRadius: 7, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.1)', color: '#6b6b6b', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 500,
                    }}>Cancelar</button>
                    <button onClick={handleDelete} disabled={deleting} style={{
                      flex: 1, padding: '8px', borderRadius: 7, background: '#ef4444', border: 'none', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      opacity: deleting ? 0.7 : 1,
                    }}>
                      {deleting ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Excluindo...</> : <><Trash2 size={11} /> Excluir</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Log */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#8e8e93', letterSpacing: '0.04em', marginBottom: 14 }}>HISTÓRICO ADMIN</p>
            {logs.length === 0 ? (
              <p style={{ fontSize: 12, color: '#8e8e93', textAlign: 'center', padding: '12px 0' }}>Sem registros</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {logs.map(log => (
                  <div key={log.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#007AFF', fontWeight: 500 }}>{log.acao.replace('_', ' ')}</div>
                    <div style={{ fontSize: 10.5, color: '#8e8e93', marginTop: 2 }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
