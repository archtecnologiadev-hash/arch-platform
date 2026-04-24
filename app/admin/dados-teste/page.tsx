'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Loader2, Copy, Check, LogIn, Trash2, AlertTriangle, FlaskConical } from 'lucide-react'

interface TestUser {
  id: string
  nome: string
  email: string
  tipo: string
  senha_padrao: string
  created_at: string
}

const TIPO_COLOR: Record<string, { color: string; bg: string; label: string }> = {
  arquiteto: { color: '#007AFF', bg: 'rgba(0,122,255,0.08)', label: 'Arquiteto' },
  fornecedor: { color: '#4f9cf9', bg: 'rgba(79,156,249,0.08)', label: 'Fornecedor' },
  cliente:   { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  label: 'Cliente' },
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handle() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={handle} title="Copiar" style={{
      background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6,
      cursor: 'pointer', padding: '3px 7px', display: 'flex', alignItems: 'center', gap: 4,
      color: copied ? '#059669' : '#6b6b6b', fontSize: 11, transition: 'all 0.15s',
    }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

export default function DadosTestePage() {
  const [users, setUsers] = useState<TestUser[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState('')
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('dados_teste_view')
      .select('*')
      .order('tipo')
      .order('nome')
    setUsers((data ?? []) as TestUser[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    setDeleting(true)
    setConfirmOpen(false)
    const res = await fetch('/api/admin/dados-teste', { method: 'DELETE' })
    const json = await res.json()
    if (res.ok) {
      setResult(json.result ?? 'Dados removidos.')
      setUsers([])
      showToast('Dados de teste removidos com sucesso.')
    } else {
      showToast(json.error ?? 'Erro ao remover dados.', false)
    }
    setDeleting(false)
  }

  async function handleImpersonate(email: string) {
    setImpersonating(email)
    const res = await fetch('/api/admin/dados-teste/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const json = await res.json()
    setImpersonating(null)
    if (res.ok && json.link) {
      window.open(json.link, '_blank')
    } else {
      showToast(json.error ?? 'Erro ao gerar link de acesso.', false)
    }
  }

  const byTipo: Record<string, TestUser[]> = {}
  users.forEach(u => {
    if (!byTipo[u.tipo]) byTipo[u.tipo] = []
    byTipo[u.tipo].push(u)
  })

  const tipoOrder = ['arquiteto', 'fornecedor', 'cliente']
  const counts = {
    arquiteto: byTipo.arquiteto?.length ?? 0,
    fornecedor: byTipo.fornecedor?.length ?? 0,
    cliente:   byTipo.cliente?.length ?? 0,
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7' }}>
      <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: 32, background: '#f2f2f7', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#1c1c1e', color: '#fff', padding: '12px 20px', borderRadius: 12,
          fontSize: 13, zIndex: 9999, animation: 'slideDown 0.2s ease',
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
        }}>
          {toast.ok ? <Check size={14} color="#34d399" /> : <AlertTriangle size={14} color="#ff3b30" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <FlaskConical size={20} color="#007AFF" />
            <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Dados de Teste</h1>
          </div>
          <p style={{ fontSize: 13, color: '#8e8e93', margin: 0 }}>
            Usuários fictícios para desenvolvimento — todos com domínio @arc-test.local
          </p>
        </div>

        {users.length > 0 && (
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: deleting ? 0.5 : 1, transition: 'opacity 0.15s',
            }}>
            {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
            Remover todos os dados de teste
          </button>
        )}
      </div>

      {/* Resumo */}
      {users.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {tipoOrder.map(tipo => {
            const m = TIPO_COLOR[tipo]
            const c = counts[tipo as keyof typeof counts]
            if (!c) return null
            return (
              <div key={tipo} style={{
                background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
                padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}s</span>
                <span style={{ fontSize: 20, fontWeight: 300, color: m.color }}>{c}</span>
              </div>
            )
          })}
          <div style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
            padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <span style={{ fontSize: 13, color: '#8e8e93' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 300, color: '#1a1a1a' }}>{users.length}</span>
          </div>
        </div>
      )}

      {/* Result message */}
      {result && users.length === 0 && (
        <div style={{
          background: '#fff', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12,
          padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Check size={16} color="#059669" />
          <span style={{ fontSize: 13, color: '#059669', fontWeight: 500 }}>{result}</span>
        </div>
      )}

      {/* No data */}
      {users.length === 0 && !result && (
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14,
          padding: '48px 24px', textAlign: 'center', color: '#8e8e93',
        }}>
          <FlaskConical size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px' }}>Nenhum dado de teste encontrado</p>
          <p style={{ fontSize: 12, margin: 0 }}>Execute o SQL em <code style={{ background: '#f2f2f7', padding: '2px 6px', borderRadius: 4 }}>supabase/seed-test-data.sql</code> para criar os dados.</p>
        </div>
      )}

      {/* Tables by tipo */}
      {tipoOrder.map(tipo => {
        const group = byTipo[tipo]
        if (!group?.length) return null
        const m = TIPO_COLOR[tipo]
        return (
          <div key={tipo} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                background: m.bg, border: `1px solid ${m.color}30`,
                color: m.color, fontSize: 10.5, fontWeight: 700,
                padding: '3px 10px', borderRadius: 20,
              }}>
                {m.label}s — {group.length}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: '#f9f9f9' }}>
                    {['Nome', 'Email', 'Senha', 'Acesso'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, color: '#8e8e93', fontWeight: 600, letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.map((u, i) => (
                    <tr key={u.id} style={{
                      borderBottom: i < group.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    }}>
                      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 500 }}>{u.nome}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 12, color: '#6b6b6b', fontFamily: 'monospace' }}>{u.email}</span>
                          <CopyBtn text={u.email} />
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 12, fontFamily: 'monospace', background: '#f2f2f7', padding: '2px 8px', borderRadius: 5 }}>senha123</span>
                          <CopyBtn text="senha123" />
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <button
                          onClick={() => handleImpersonate(u.email)}
                          disabled={impersonating === u.email}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)',
                            color: '#007AFF', borderRadius: 7, padding: '5px 11px',
                            fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                            opacity: impersonating === u.email ? 0.5 : 1,
                          }}>
                          {impersonating === u.email
                            ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                            : <LogIn size={11} />}
                          Acessar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Confirmation modal */}
      {confirmOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) setConfirmOpen(false) }}>
          <div style={{
            background: '#fff', borderRadius: 18, padding: 28, maxWidth: 420, width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)', animation: 'slideDown 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Remover dados de teste?</div>
                <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>Esta ação não pode ser desfeita</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, margin: '0 0 20px' }}>
              Isso apagará <strong>{users.length} usuários de teste</strong> ({counts.arquiteto} arquitetos, {counts.fornecedor} fornecedores, {counts.cliente} clientes) e todos os dados vinculados (escritórios, projetos, produtos, etc).
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmOpen(false)} style={{
                flex: 1, background: '#f2f2f7', border: 'none', borderRadius: 10,
                padding: '12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#1a1a1a',
              }}>Cancelar</button>
              <button onClick={handleDelete} style={{
                flex: 1, background: '#ef4444', border: 'none', borderRadius: 10,
                padding: '12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#fff',
              }}>Sim, remover tudo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
