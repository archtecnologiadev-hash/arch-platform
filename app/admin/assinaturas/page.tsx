'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Loader2, Star, CheckCircle2, XCircle, Filter, RefreshCw, AlertTriangle } from 'lucide-react'

interface SubRow {
  id: string
  status: string
  ciclo: string | null
  trial_fim: string | null
  proxima_cobranca: string | null
  valor_cobrado: number | null
  created_at: string
  user_id: string
  users: { nome: string; email: string; tipo: string } | null
  planos: { nome: string; slug: string; valor_mensal: number } | null
}

type Filter = 'todos' | 'trial' | 'ativa' | 'fundador' | 'inadimplente' | 'cancelada'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  trial:        { label: 'Trial',        color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  ativa:        { label: 'Ativa',        color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  fundador:     { label: 'Fundador',     color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  inadimplente: { label: 'Inadimplente', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  cancelada:    { label: 'Cancelada',    color: '#6b6b6b', bg: 'rgba(0,0,0,0.06)' },
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.cancelada
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: m.bg, color: m.color, whiteSpace: 'nowrap',
    }}>
      {m.label}
    </span>
  )
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'trial', label: 'Trial' },
  { key: 'ativa', label: 'Ativas' },
  { key: 'fundador', label: 'Fundadores' },
  { key: 'inadimplente', label: 'Inadimplentes' },
  { key: 'cancelada', label: 'Canceladas' },
]

export default function AdminAssinaturas() {
  const [rows, setRows] = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('todos')
  const [actioning, setActioning] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('assinaturas')
      .select('id, status, ciclo, trial_fim, proxima_cobranca, valor_cobrado, created_at, user_id, users(nome, email, tipo), planos(nome, slug, valor_mensal)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(200)
    if (filter !== 'todos') q = q.eq('status', filter)
    const { data, count } = await q
    setRows((data ?? []) as unknown as SubRow[])
    setTotal(count ?? 0)
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleAction(subId: string, acao: string) {
    setActioning(subId + acao)
    setActionError('')
    const res = await fetch(`/api/admin/assinatura/${subId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao }),
    })
    const data = await res.json()
    if (data.error) {
      setActionError(data.error)
    } else {
      setRows(prev => prev.map(r => {
        if (r.id !== subId) return r
        const proxima = new Date()
        proxima.setMonth(proxima.getMonth() + (acao === 'marcar_fundador' ? 3 : 1))
        return {
          ...r,
          status: acao === 'marcar_fundador' ? 'fundador' : acao === 'ativar' ? 'ativa' : 'cancelada',
          proxima_cobranca: acao !== 'cancelar' ? proxima.toISOString() : r.proxima_cobranca,
        }
      }))
    }
    setActioning(null)
  }

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('pt-BR') : '—'

  return (
    <div style={{ padding: 32, color: '#1a1a1a', background: '#f2f2f7', minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>Assinaturas</h1>
        <p style={{ fontSize: 13, color: '#8e8e93' }}>{total} assinatura{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            background: filter === f.key ? '#007AFF' : '#fff',
            color: filter === f.key ? '#fff' : '#6b6b6b',
            border: filter === f.key ? 'none' : '1px solid rgba(0,0,0,0.1)',
            transition: 'all 0.15s',
          }}>
            {f.label}
          </button>
        ))}
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF',
        }}>
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>

      {actionError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12.5, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 7 }}>
          <AlertTriangle size={13} /> {actionError}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={24} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                  {['Usuário', 'Tipo', 'Plano', 'Status', 'Trial / Cobrança', 'Valor', 'Ações'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#8e8e93', fontWeight: 500, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>Nenhuma assinatura encontrada</td></tr>
                )}
                {rows.map((row, i) => {
                  const isActioning = (k: string) => actioning === row.id + k
                  const dateInfo = row.status === 'trial'
                    ? `Trial até ${fmtDate(row.trial_fim)}`
                    : row.proxima_cobranca
                    ? `Próx. ${fmtDate(row.proxima_cobranca)}`
                    : '—'

                  return (
                    <tr key={row.id}
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{row.users?.nome ?? '—'}</div>
                        <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 1 }}>{row.users?.email ?? '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b6b6b', textTransform: 'capitalize' }}>
                        {row.users?.tipo ?? '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#1a1a1a' }}>
                        {row.planos?.nome ?? '—'}
                        {row.ciclo && <div style={{ fontSize: 10, color: '#8e8e93', marginTop: 1, textTransform: 'capitalize' }}>{row.ciclo}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11.5, color: '#6b6b6b', whiteSpace: 'nowrap' }}>
                        {dateInfo}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#1a1a1a' }}>
                        {row.valor_cobrado ? `R$ ${Number(row.valor_cobrado).toFixed(2).replace('.', ',')}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {row.status !== 'fundador' && (
                            <button
                              onClick={() => handleAction(row.id, 'marcar_fundador')}
                              disabled={!!actioning}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed',
                                opacity: actioning ? 0.6 : 1,
                              }}>
                              {isActioning('marcar_fundador')
                                ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                                : <Star size={10} />}
                              Fundador
                            </button>
                          )}
                          {row.status !== 'ativa' && (
                            <button
                              onClick={() => handleAction(row.id, 'ativar')}
                              disabled={!!actioning}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', color: '#059669',
                                opacity: actioning ? 0.6 : 1,
                              }}>
                              {isActioning('ativar')
                                ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                                : <CheckCircle2 size={10} />}
                              Ativar
                            </button>
                          )}
                          {row.status !== 'cancelada' && (
                            <button
                              onClick={() => handleAction(row.id, 'cancelar')}
                              disabled={!!actioning}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444',
                                opacity: actioning ? 0.6 : 1,
                              }}>
                              {isActioning('cancelar')
                                ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                                : <XCircle size={10} />}
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
