'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2, Download, CheckCircle2, XCircle, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrcStatus = 'pendente' | 'em_analise' | 'respondido' | 'aprovado' | 'recusado' | 'agendado' | 'em_execucao' | 'concluido'

interface OrcItem {
  id: string
  projeto_nome: string | null
  fornecedor_nome: string | null
  fornecedor_logo: string | null
  mensagem: string | null
  arquivo_url: string | null
  arquivo_nome: string | null
  status: OrcStatus
  resposta: string | null
  resposta_arquivo_url: string | null
  created_at: string
}

const STATUS_META: Record<OrcStatus, { label: string; color: string; bg: string; border: string }> = {
  pendente:    { label: 'Pendente',    color: '#007AFF', bg: 'rgba(0,122,255,0.08)',   border: 'rgba(0,122,255,0.2)' },
  em_analise:  { label: 'Em análise',  color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.22)' },
  respondido:  { label: 'Respondido',  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
  aprovado:    { label: 'Aprovado',    color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.22)' },
  recusado:    { label: 'Recusado',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.22)' },
  agendado:    { label: 'Agendado',    color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.22)' },
  em_execucao: { label: 'Em execução', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.22)' },
  concluido:   { label: 'Concluído',   color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
}

const FILTERS: Array<OrcStatus | 'todos'> = ['todos', 'pendente', 'em_analise', 'respondido', 'aprovado', 'agendado', 'em_execucao', 'concluido', 'recusado']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArquitetoOrcamentosPage() {
  const [loading, setLoading] = useState(true)
  const [orcamentos, setOrcamentos] = useState<OrcItem[]>([])
  const [filter, setFilter] = useState<OrcStatus | 'todos'>('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: rows } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('arquiteto_id', user.id)
        .order('created_at', { ascending: false })

      if (!rows || rows.length === 0) { setLoading(false); return }

      const projIds = Array.from(new Set(rows.map((r: Record<string, unknown>) => r.projeto_id as string).filter(Boolean)))
      const fornIds = Array.from(new Set(rows.map((r: Record<string, unknown>) => r.fornecedor_id as string).filter(Boolean)))

      const [{ data: projs }, { data: forns }] = await Promise.all([
        projIds.length > 0 ? supabase.from('projetos').select('id, nome').in('id', projIds) : Promise.resolve({ data: [] }),
        fornIds.length > 0 ? supabase.from('fornecedores').select('id, nome, image_url').in('id', fornIds) : Promise.resolve({ data: [] }),
      ])

      const projMap: Record<string, string> = {}
      for (const p of (projs ?? [])) projMap[(p as { id: string; nome: string }).id] = (p as { id: string; nome: string }).nome

      const fornMap: Record<string, { nome: string; image_url: string | null }> = {}
      for (const f of (forns ?? [])) fornMap[(f as { id: string; nome: string; image_url: string | null }).id] = { nome: (f as { id: string; nome: string; image_url: string | null }).nome, image_url: (f as { id: string; nome: string; image_url: string | null }).image_url }

      setOrcamentos(rows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        projeto_nome: r.projeto_id ? (projMap[r.projeto_id as string] ?? null) : null,
        fornecedor_nome: r.fornecedor_id ? (fornMap[r.fornecedor_id as string]?.nome ?? null) : null,
        fornecedor_logo: r.fornecedor_id ? (fornMap[r.fornecedor_id as string]?.image_url ?? null) : null,
        mensagem: r.mensagem as string | null,
        arquivo_url: r.arquivo_url as string | null,
        arquivo_nome: r.arquivo_nome as string | null,
        status: (r.status as OrcStatus) ?? 'pendente',
        resposta: r.resposta as string | null,
        resposta_arquivo_url: r.resposta_arquivo_url as string | null,
        created_at: r.created_at as string,
      })))

      setLoading(false)
    }
    load()
  }, [])

  async function updateStatus(id: string, status: OrcStatus) {
    setUpdatingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('orcamentos').update({ status }).eq('id', id)
    if (!error) {
      setOrcamentos(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    }
    setUpdatingId(null)
  }

  const filtered = filter === 'todos' ? orcamentos : orcamentos.filter(o => o.status === (filter as OrcStatus))
  const countBy = (s: OrcStatus) => orcamentos.filter(o => o.status === s).length

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f2f7' }}>
        <Loader2 size={26} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 36px', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a', background: '#f2f2f7' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .arc-orc-card { background:#fff; border:1px solid rgba(0,0,0,0.08); border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); transition:box-shadow 0.18s; }
        .arc-orc-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .arc-filter-btn { padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Orçamentos Enviados</h1>
        <p style={{ fontSize: 13, color: '#6b6b6b', margin: '5px 0 0' }}>
          Acompanhe suas solicitações a fornecedores · {orcamentos.length} total
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' as const }}>
        {FILTERS.map(f => {
          const count = f !== 'todos' ? countBy(f as OrcStatus) : orcamentos.length
          if (f !== 'todos' && count === 0) return null
          const isActive = filter === f
          const meta = f !== 'todos' ? STATUS_META[f as OrcStatus] : null
          return (
            <button key={f} onClick={() => setFilter(f)} className="arc-filter-btn"
              style={{
                background: isActive ? (meta ? meta.bg : 'rgba(0,122,255,0.1)') : '#fff',
                border: isActive ? `1px solid ${meta ? meta.border : 'rgba(0,122,255,0.25)'}` : '1px solid rgba(0,0,0,0.1)',
                color: isActive ? (meta ? meta.color : '#007AFF') : '#6b6b6b',
                boxShadow: isActive ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
              }}>
              {f === 'todos' ? 'Todos' : STATUS_META[f as OrcStatus].label}
              <span style={{ marginLeft: 4, opacity: 0.65 }}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8e8e93', fontSize: 14 }}>
          {orcamentos.length === 0
            ? <><FileText size={40} color="#c7c7cc" style={{ display: 'block', margin: '0 auto 14px' }} /><div>Nenhum orçamento enviado ainda.</div><div style={{ fontSize: 12, marginTop: 6 }}>Solicite orçamentos na aba Fornecedores de um projeto.</div></>
            : 'Nenhum orçamento com esse status.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(orc => {
            const meta = STATUS_META[orc.status]
            const isExpanded = expandedId === orc.id
            const isUpdating = updatingId === orc.id
            const fornInitial = (orc.fornecedor_nome ?? 'F')[0].toUpperCase()
            const dateStr = new Date(orc.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

            return (
              <div key={orc.id} className="arc-orc-card">
                <div style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Supplier avatar */}
                  <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {orc.fornecedor_logo
                      ? <img src={orc.fornecedor_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : orc.fornecedor_nome
                        ? <span style={{ fontSize: 18, fontWeight: 800, color: '#007AFF' }}>{fornInitial}</span>
                        : <Package size={20} color="#007AFF" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#1a1a1a' }}>
                          {orc.fornecedor_nome ?? 'Fornecedor'}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 3 }}>
                          {orc.projeto_nome ?? 'Projeto sem nome'} · {dateStr}
                        </div>
                      </div>
                      <div style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 20, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
                        {meta.label}
                      </div>
                    </div>

                    {orc.mensagem && (
                      <p style={{ fontSize: 13, color: '#6b6b6b', marginTop: 8, lineHeight: 1.55, margin: '8px 0 0' }}>
                        {orc.mensagem.length > 100 ? orc.mensagem.slice(0, 100) + '…' : orc.mensagem}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' as const }}>
                      <button onClick={() => setExpandedId(isExpanded ? null : orc.id)}
                        style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.1)', color: '#6b6b6b', cursor: 'pointer', fontWeight: 600 }}>
                        {isExpanded ? 'Menos' : 'Ver detalhes'}
                      </button>

                      {orc.status === 'respondido' && (
                        <>
                          <button onClick={() => updateStatus(orc.id, 'aprovado')} disabled={isUpdating}
                            style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', cursor: isUpdating ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isUpdating ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={10} />} Aprovar
                          </button>
                          <button onClick={() => updateStatus(orc.id, 'recusado')} disabled={isUpdating}
                            style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: isUpdating ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isUpdating ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={10} />} Recusar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '14px 20px', background: '#f9f9fb' }}>
                    {orc.mensagem && (
                      <>
                        <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Sua mensagem</div>
                        <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.65, margin: '0 0 12px' }}>{orc.mensagem}</p>
                      </>
                    )}
                    {orc.arquivo_url && (
                      <a href={orc.arquivo_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#007AFF', background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.18)', borderRadius: 7, padding: '5px 11px', textDecoration: 'none', fontWeight: 600, marginBottom: 12 }}>
                        <FileText size={12} /> {orc.arquivo_nome ?? 'Arquivo anexado'} <Download size={11} />
                      </a>
                    )}
                    {orc.resposta ? (
                      <>
                        <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Resposta do Fornecedor</div>
                        <p style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.65, margin: '0 0 8px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 8, padding: '10px 13px' }}>{orc.resposta}</p>
                        {orc.resposta_arquivo_url && (
                          <a href={orc.resposta_arquivo_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#34d399', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 7, padding: '5px 11px', textDecoration: 'none', fontWeight: 600 }}>
                            <FileText size={12} /> Arquivo do fornecedor <Download size={11} />
                          </a>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 12.5, color: '#8e8e93', fontStyle: 'italic' }}>Aguardando resposta do fornecedor...</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
