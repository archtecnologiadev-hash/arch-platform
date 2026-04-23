'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ExternalLink, CheckCircle2, Loader2, Clock, Paperclip, Package, Percent } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type OrcStatus = 'pendente' | 'em_analise' | 'respondido' | 'aprovado' | 'recusado' | 'agendado' | 'em_execucao' | 'concluido'

interface OrcCard {
  id: string
  projeto_nome: string | null
  escritorio_nome: string | null
  titulo: string | null
  valor_orcado: number | null
  status: OrcStatus
  created_at: string
  mensagem: string | null
  arquivo_url: string | null
}

const STATUS_META: Record<OrcStatus, { label: string; color: string; bg: string; border: string }> = {
  pendente:    { label: 'Aguardando',   color: '#007AFF', bg: 'rgba(0,122,255,0.08)',   border: 'rgba(0,122,255,0.2)' },
  em_analise:  { label: 'Em análise',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.22)' },
  respondido:  { label: 'Enviado',      color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
  aprovado:    { label: 'Aprovado',     color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.22)' },
  recusado:    { label: 'Recusado',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.22)' },
  agendado:    { label: 'Agendado',     color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.22)' },
  em_execucao: { label: 'Em execução',  color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.22)' },
  concluido:   { label: 'Concluído',    color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
}

type FilterKey = 'todos' | 'pendentes' | 'em_andamento' | 'concluidos'

const FILTER_GROUPS: Record<FilterKey, OrcStatus[] | null> = {
  todos: null,
  pendentes: ['pendente'],
  em_andamento: ['em_analise', 'respondido', 'aprovado', 'agendado', 'em_execucao'],
  concluidos: ['concluido', 'recusado'],
}

const FILTER_LABELS: Record<FilterKey, string> = {
  todos: 'Todos',
  pendentes: 'Pendentes',
  em_andamento: 'Em andamento',
  concluidos: 'Concluídos',
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function OrcCardItem({ orc }: { orc: OrcCard }) {
  const meta = STATUS_META[orc.status]
  const initials = (orc.escritorio_nome ?? orc.projeto_nome ?? 'A').slice(0, 2).toUpperCase()
  const dateStr = new Date(orc.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  return (
    <Link href={`/fornecedor/orcamentos/${orc.id}`} style={{ textDecoration: 'none' }}>
      <div className="dash-card" style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
        padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#007AFF', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {orc.escritorio_nome && (
              <div style={{ fontSize: 10.5, color: '#8b5cf6', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {orc.escritorio_nome}
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {orc.titulo ?? orc.projeto_nome ?? 'Sem título'}
            </div>
            {orc.projeto_nome && (
              <div style={{ fontSize: 11.5, color: '#6b6b6b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {orc.projeto_nome}
              </div>
            )}
          </div>
          <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
            {meta.label}
          </div>
        </div>

        {/* Value + footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {orc.valor_orcado != null ? (
            <div style={{ fontSize: 14, fontWeight: 800, color: '#34d399' }}>{fmtBRL(orc.valor_orcado)}</div>
          ) : (
            orc.mensagem ? (
              <div style={{ fontSize: 11, color: '#8e8e93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {orc.mensagem.slice(0, 60)}{orc.mensagem.length > 60 ? '…' : ''}
              </div>
            ) : <div />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
            {orc.arquivo_url && <Paperclip size={10} color="#8b5cf6" />}
            <Clock size={10} color="#c7c7cc" />
            <span style={{ fontSize: 10.5, color: '#8e8e93' }}>{dateStr}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function FornecedorDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [perfilSlug, setPerfilSlug] = useState<string | null>(null)
  const [orcamentos, setOrcamentos] = useState<OrcCard[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterKey>('todos')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      setUserName(user.user_metadata?.nome ?? user.email ?? 'Fornecedor')

      const { data: forn } = await supabase
        .from('fornecedores').select('id, slug').eq('user_id', user.id).single()
      if (!forn) { setLoading(false); return }
      if (forn.slug) setPerfilSlug(forn.slug)

      const { data: rows } = await supabase
        .from('orcamentos')
        .select('id, projeto_id, status, created_at, mensagem, arquivo_url, titulo, valor_orcado')
        .eq('fornecedor_id', forn.id)
        .order('created_at', { ascending: false })

      if (rows && rows.length > 0) {
        const projIds = Array.from(new Set(rows.map((r: Record<string, unknown>) => r.projeto_id as string).filter(Boolean)))

        const { data: projs } = projIds.length > 0
          ? await supabase.from('projetos').select('id, nome, escritorio_id').in('id', projIds)
          : { data: [] }

        type ProjRow = { id: string; nome: string; escritorio_id: string | null }
        const projMap: Record<string, ProjRow> = {}
        for (const p of (projs ?? [])) {
          const pr = p as ProjRow
          projMap[pr.id] = pr
        }

        const escIds = Array.from(new Set(Object.values(projMap).map(p => p.escritorio_id).filter(Boolean) as string[]))
        const { data: escs } = escIds.length > 0
          ? await supabase.from('escritorios').select('id, nome').in('id', escIds)
          : { data: [] }
        const escMap: Record<string, string> = {}
        for (const e of (escs ?? [])) escMap[(e as { id: string; nome: string }).id] = (e as { id: string; nome: string }).nome

        setOrcamentos(rows.map((r: Record<string, unknown>) => {
          const proj = r.projeto_id ? projMap[r.projeto_id as string] : null
          return {
            id: r.id as string,
            projeto_nome: proj?.nome ?? null,
            escritorio_nome: proj?.escritorio_id ? (escMap[proj.escritorio_id] ?? null) : null,
            titulo: r.titulo as string | null,
            valor_orcado: r.valor_orcado as number | null,
            status: (r.status as OrcStatus) ?? 'pendente',
            created_at: r.created_at as string,
            mensagem: r.mensagem as string | null,
            arquivo_url: r.arquivo_url as string | null,
          }
        }))
      }
      setLoading(false)
    }
    load()
  }, [])

  // ── Derived metrics ────────────────────────────────────────────────────────

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const thisMonth = orcamentos.filter(o => o.created_at >= monthStart)
  const totalOrcado = thisMonth.reduce((s, o) => s + (o.valor_orcado ?? 0), 0)
  // For valor_fechado we don't have it in OrcCard — use valor_orcado of approved ones as proxy
  const totalFechado = thisMonth
    .filter(o => ['aprovado', 'agendado', 'em_execucao', 'concluido'].includes(o.status))
    .reduce((s, o) => s + (o.valor_orcado ?? 0), 0)
  const pendentesCount = orcamentos.filter(o => o.status === 'pendente').length
  const respondidos = orcamentos.filter(o => o.status !== 'pendente' && o.status !== 'em_analise').length
  const aprovadosTotal = orcamentos.filter(o => ['aprovado', 'agendado', 'em_execucao', 'concluido'].includes(o.status)).length
  const taxaAprov = respondidos > 0 ? Math.round((aprovadosTotal / respondidos) * 100) : 0

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filterGroup = FILTER_GROUPS[activeFilter]
  const filtered = filterGroup
    ? orcamentos.filter(o => filterGroup.includes(o.status))
    : orcamentos

  const countFor = (k: FilterKey) => {
    const g = FILTER_GROUPS[k]
    return g ? orcamentos.filter(o => g.includes(o.status)).length : orcamentos.length
  }

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
        .fd-stat { background:#fff; border:1px solid rgba(0,0,0,0.08); border-radius:14px; padding:18px 20px; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
        .dash-card:hover { border-color:rgba(0,122,255,0.22) !important; box-shadow:0 4px 14px rgba(0,0,0,0.1) !important; transform:translateY(-1px); }
        .fd-filter-btn { padding:7px 16px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; border:none; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Dashboard</h1>
          {userName && <p style={{ fontSize: 13, color: '#6b6b6b', margin: '5px 0 0' }}>Bem-vindo, {userName}</p>}
        </div>
        {perfilSlug ? (
          <Link href={`/fornecedor/${perfilSlug}`} target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, padding: '8px 16px', borderRadius: 10, background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>
            <ExternalLink size={13} /> Ver Perfil Público
          </Link>
        ) : (
          <Link href="/fornecedor/perfil"
            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, padding: '8px 16px', borderRadius: 10, background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>
            Completar Perfil
          </Link>
        )}
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          {
            label: 'Total Orçado',
            sublabel: 'mês atual',
            value: totalOrcado > 0 ? fmtBRL(totalOrcado) : '—',
            icon: TrendingUp,
            color: '#007AFF',
          },
          {
            label: 'Total Fechado',
            sublabel: 'mês atual',
            value: totalFechado > 0 ? fmtBRL(totalFechado) : '—',
            icon: CheckCircle2,
            color: '#34d399',
          },
          {
            label: 'Pendentes',
            sublabel: 'aguardando resposta',
            value: String(pendentesCount),
            icon: Clock,
            color: '#8b5cf6',
          },
          {
            label: 'Taxa de Aprovação',
            sublabel: 'orçamentos aprovados',
            value: respondidos > 0 ? `${taxaAprov}%` : '—',
            icon: Percent,
            color: '#f59e0b',
          },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="fd-stat">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: '#8e8e93', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{card.label}</div>
                  <div style={{ fontSize: card.value.length > 8 ? 17 : 24, fontWeight: 800, color: '#1a1a1a', marginTop: 6, lineHeight: 1.1 }}>{card.value}</div>
                  <div style={{ fontSize: 10, color: '#8e8e93', marginTop: 3 }}>{card.sublabel}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${card.color}14`, border: `1px solid ${card.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={card.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter pills + section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 7 }}>
          {(Object.keys(FILTER_GROUPS) as FilterKey[]).map(k => {
            const isActive = activeFilter === k
            const count = countFor(k)
            return (
              <button key={k} onClick={() => setActiveFilter(k)} className="fd-filter-btn"
                style={{
                  background: isActive ? '#007AFF' : '#fff',
                  color: isActive ? '#fff' : '#6b6b6b',
                  boxShadow: isActive ? '0 2px 8px rgba(0,122,255,0.28)' : '0 1px 2px rgba(0,0,0,0.06)',
                  border: isActive ? 'none' : '1px solid rgba(0,0,0,0.1)',
                }}>
                {FILTER_LABELS[k]}
                <span style={{ marginLeft: 5, opacity: 0.75, fontSize: 11 }}>({count})</span>
              </button>
            )
          })}
        </div>
        <Link href="/fornecedor/orcamentos" style={{ fontSize: 12, color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>
          Ver lista completa →
        </Link>
      </div>

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '52px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Package size={36} color="#c7c7cc" style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 4 }}>
            {orcamentos.length === 0 ? 'Nenhum orçamento recebido ainda.' : 'Nenhum orçamento nessa categoria.'}
          </div>
          {orcamentos.length === 0 && (
            <div style={{ fontSize: 12, color: '#8e8e93' }}>Quando arquitetos solicitarem orçamentos, aparecerão aqui.</div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map(orc => <OrcCardItem key={orc.id} orc={orc} />)}
        </div>
      )}
    </div>
  )
}
