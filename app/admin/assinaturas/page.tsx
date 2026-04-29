'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Loader2, Star, CheckCircle2, XCircle, RefreshCw,
  AlertTriangle, Zap, Download, Calendar, X,
} from 'lucide-react'

interface SubRow {
  id: string
  status: string
  ciclo: string | null
  trial_fim: string | null
  proxima_cobranca: string | null
  valor_cobrado: number | null
  created_at: string
  user_id: string
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  card_last4: string | null
  card_brand: string | null
  observacao_admin: string | null
  users: { nome: string; email: string; tipo: string } | null
  planos: { nome: string; slug: string; valor_mensal: number } | null
}

type Filter = 'todos' | 'trial' | 'ativa' | 'fundador' | 'inadimplente' | 'cancelada'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  trial:        { label: 'Trial',        color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  ativa:        { label: 'Ativa',        color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  fundador:     { label: 'Fundador',     color: '#92400e', bg: 'rgba(251,191,36,0.15)' },
  inadimplente: { label: 'Inadimplente', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  cancelada:    { label: 'Cancelada',    color: '#6b6b6b', bg: 'rgba(0,0,0,0.06)' },
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.cancelada
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: m.bg, color: m.color, whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {status === 'fundador' && '★ '}
      {m.label}
    </span>
  )
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todos',       label: 'Todos' },
  { key: 'trial',       label: 'Trial' },
  { key: 'ativa',       label: 'Ativas' },
  { key: 'fundador',    label: '★ Fundadores' },
  { key: 'inadimplente',label: 'Inadimplentes' },
  { key: 'cancelada',   label: 'Canceladas' },
]

function exportCsv(rows: SubRow[]) {
  const headers = ['Nome', 'Email', 'Tipo', 'Plano', 'Status', 'Ciclo', 'Trial/Cobrança', 'Valor', 'Criado em', 'Observação']
  const lines = rows.map(r => [
    r.users?.nome ?? '',
    r.users?.email ?? '',
    r.users?.tipo ?? '',
    r.planos?.nome ?? '',
    r.status,
    r.ciclo ?? '',
    r.status === 'trial' ? (r.trial_fim ? new Date(r.trial_fim).toLocaleDateString('pt-BR') : '') : (r.proxima_cobranca ? new Date(r.proxima_cobranca).toLocaleDateString('pt-BR') : ''),
    r.valor_cobrado ? `R$ ${Number(r.valor_cobrado).toFixed(2)}` : '',
    new Date(r.created_at).toLocaleDateString('pt-BR'),
    r.observacao_admin ?? '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `assinaturas_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminAssinaturas() {
  const [rows, setRows] = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('todos')
  const [actioning, setActioning] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [total, setTotal] = useState(0)

  // Extend trial state
  const [extendId, setExtendId] = useState<string | null>(null)
  const [extendDate, setExtendDate] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('assinaturas')
      .select('id, status, ciclo, trial_fim, proxima_cobranca, valor_cobrado, created_at, user_id, asaas_customer_id, asaas_subscription_id, card_last4, card_brand, observacao_admin, users(nome, email, tipo), planos(nome, slug, valor_mensal)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(300)
    if (filter !== 'todos') q = q.eq('status', filter)
    const { data, count } = await q
    setRows((data ?? []) as unknown as SubRow[])
    setTotal(count ?? 0)
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleForcarCobranca(row: SubRow) {
    if (!row.asaas_subscription_id || !row.asaas_customer_id) {
      setActionError('Assinatura sem dados Asaas'); return
    }
    setActioning(row.id + 'forcar'); setActionError('')
    const res = await fetch('/api/admin/assinatura/forcar-cobranca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assinaturaId: row.id }),
    })
    const data = await res.json()
    if (data.error) setActionError(data.error)
    setActioning(null)
  }

  async function handleAction(subId: string, acao: string, extra?: Record<string, unknown>) {
    setActioning(subId + acao); setActionError('')
    const res = await fetch(`/api/admin/assinatura/${subId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao, ...extra }),
    })
    const data = await res.json()
    if (data.error) {
      setActionError(data.error)
    } else {
      await load()
    }
    setActioning(null)
  }

  async function handleEstenderTrial(subId: string) {
    if (!extendDate) { setActionError('Escolha uma data'); return }
    await handleAction(subId, 'estender_trial', { nova_data: extendDate })
    setExtendId(null); setExtendDate('')
  }

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('pt-BR') : '—'
  const founderCount = rows.filter(r => r.status === 'fundador').length

  return (
    <div style={{ padding: 32, color: '#1a1a1a', background: '#f2f2f7', minHeight: '100vh' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>Assinaturas</h1>
          <p style={{ fontSize: 13, color: '#8e8e93' }}>
            {total} assinatura{total !== 1 ? 's' : ''}
            {founderCount > 0 && filter === 'todos' && (
              <span style={{ marginLeft: 10, color: '#92400e', fontWeight: 600 }}>★ {founderCount} fundador{founderCount !== 1 ? 'es' : ''}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => exportCsv(rows)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            background: '#fff', border: '1px solid rgba(0,0,0,0.12)', color: '#1a1a1a',
          }}>
          <Download size={13} /> Exportar CSV
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            background: filter === f.key ? (f.key === 'fundador' ? '#92400e' : '#007AFF') : '#fff',
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
          <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: 'auto', padding: 2 }}><X size={12} /></button>
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
                  {['Usuário', 'Tipo', 'Plano', 'Status', 'Trial / Cobrança', 'Valor', 'Obs.', 'Ações'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#8e8e93', fontWeight: 500, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>Nenhuma assinatura encontrada</td></tr>
                )}
                {rows.map((row, i) => {
                  const isActioning = (k: string) => actioning === row.id + k
                  const dateInfo = row.status === 'trial'
                    ? `Trial até ${fmtDate(row.trial_fim)}`
                    : row.status === 'fundador'
                    ? 'Vitalício'
                    : row.proxima_cobranca
                    ? `Próx. ${fmtDate(row.proxima_cobranca)}`
                    : '—'
                  const isFounder = row.status === 'fundador'

                  return (
                    <>
                      <tr key={row.id}
                        style={{
                          borderBottom: i < rows.length - 1 && extendId !== row.id ? '1px solid rgba(0,0,0,0.06)' : 'none',
                          transition: 'background 0.12s',
                          background: isFounder ? 'rgba(251,191,36,0.03)' : 'transparent',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = isFounder ? 'rgba(251,191,36,0.06)' : 'rgba(0,0,0,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = isFounder ? 'rgba(251,191,36,0.03)' : 'transparent')}>
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
                          {isFounder
                            ? <span style={{ fontSize: 11, color: '#92400e', fontWeight: 600 }}>Gratuito</span>
                            : row.valor_cobrado ? `R$ ${Number(row.valor_cobrado).toFixed(2).replace('.', ',')}` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', maxWidth: 140 }}>
                          {row.observacao_admin
                            ? <span style={{ fontSize: 11, color: '#6b6b6b', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={row.observacao_admin}>{row.observacao_admin}</span>
                            : <span style={{ color: '#c7c7cc', fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {/* Marcar / Remover Fundador */}
                            {!isFounder ? (
                              <button
                                onClick={() => handleAction(row.id, 'marcar_fundador')}
                                disabled={!!actioning}
                                title="Marcar como Fundador"
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)', color: '#92400e', opacity: actioning ? 0.6 : 1 }}>
                                {isActioning('marcar_fundador') ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Star size={10} />}
                                Fundador
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(row.id, 'remover_fundador')}
                                disabled={!!actioning}
                                title="Remover status Fundador"
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.2)', color: '#6b7280', opacity: actioning ? 0.6 : 1 }}>
                                {isActioning('remover_fundador') ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={10} />}
                                Remover
                              </button>
                            )}

                            {/* Ativar */}
                            {row.status !== 'ativa' && row.status !== 'fundador' && (
                              <button
                                onClick={() => handleAction(row.id, 'ativar')}
                                disabled={!!actioning}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', color: '#059669', opacity: actioning ? 0.6 : 1 }}>
                                {isActioning('ativar') ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={10} />}
                                Ativar
                              </button>
                            )}

                            {/* Estender Trial */}
                            {(row.status === 'trial' || row.status === 'inadimplente') && (
                              <button
                                onClick={() => { setExtendId(extendId === row.id ? null : row.id); setExtendDate('') }}
                                disabled={!!actioning}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF', opacity: actioning ? 0.6 : 1 }}>
                                <Calendar size={10} /> Estender
                              </button>
                            )}

                            {/* Cancelar */}
                            {row.status !== 'cancelada' && row.status !== 'fundador' && (
                              <button
                                onClick={() => handleAction(row.id, 'cancelar')}
                                disabled={!!actioning}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444', opacity: actioning ? 0.6 : 1 }}>
                                {isActioning('cancelar') ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={10} />}
                                Cancelar
                              </button>
                            )}

                            {/* Forçar cobrança */}
                            {row.asaas_subscription_id && row.status !== 'cancelada' && row.status !== 'fundador' && (
                              <button
                                onClick={() => handleForcarCobranca(row)}
                                disabled={!!actioning}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#d97706', opacity: actioning ? 0.6 : 1 }}>
                                {isActioning('forcar') ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={10} />}
                                Cobrar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Extend trial inline form */}
                      {extendId === row.id && (
                        <tr key={row.id + '_extend'} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,122,255,0.03)' }}>
                          <td colSpan={8} style={{ padding: '10px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: '#007AFF', fontWeight: 600 }}>Estender trial até:</span>
                              <input
                                type="date"
                                value={extendDate}
                                onChange={e => setExtendDate(e.target.value)}
                                min={new Date().toISOString().slice(0, 10)}
                                style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(0,122,255,0.3)', fontSize: 12, color: '#1a1a1a', background: '#fff', outline: 'none' }}
                              />
                              <button
                                onClick={() => handleEstenderTrial(row.id)}
                                disabled={!extendDate || !!actioning}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: !extendDate ? 'not-allowed' : 'pointer', background: '#007AFF', color: '#fff', border: 'none', opacity: !extendDate ? 0.5 : 1 }}>
                                {isActioning('estender_trial') ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={11} />}
                                Confirmar
                              </button>
                              <button onClick={() => { setExtendId(null); setExtendDate('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}>
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
