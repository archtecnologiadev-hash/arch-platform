'use client'

import { useState, useEffect } from 'react'
import { Star, ExternalLink, CheckCircle2, Loader2, Clock, FileText, Paperclip, Package } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type OrcStatus = 'pendente' | 'em_analise' | 'respondido' | 'aprovado' | 'recusado' | 'agendado' | 'em_execucao' | 'concluido'

interface OrcCard {
  id: string
  projeto_nome: string | null
  arquiteto_nome: string | null
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

// Kanban columns — active pipeline
const KANBAN_COLS: Array<{ key: OrcStatus; title: string }> = [
  { key: 'pendente',   title: 'Aguardando' },
  { key: 'em_analise', title: 'Em análise' },
  { key: 'respondido', title: 'Enviado' },
  { key: 'aprovado',   title: 'Aprovado' },
]

// In-progress / done stages (shown as a compact list below)
const PROGRESS_STAGES: OrcStatus[] = ['agendado', 'em_execucao', 'concluido', 'recusado']

function OrcCard({ orc }: { orc: OrcCard }) {
  const meta = STATUS_META[orc.status]
  const initials = (orc.arquiteto_nome ?? 'A').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
  const dateStr = new Date(orc.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  return (
    <Link href={`/fornecedor/orcamentos/${orc.id}`} style={{ textDecoration: 'none' }}>
      <div className="dash-orc-card" style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
        padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#007AFF', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {orc.projeto_nome ?? 'Projeto sem nome'}
            </div>
            <div style={{ fontSize: 11, color: '#8e8e93' }}>{orc.arquiteto_nome ?? 'Arquiteto'}</div>
          </div>
        </div>

        {/* Message preview */}
        {orc.mensagem && (
          <p style={{ fontSize: 11.5, color: '#6b6b6b', lineHeight: 1.5, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
            {orc.mensagem}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={10} color="#8e8e93" />
            <span style={{ fontSize: 10.5, color: '#8e8e93' }}>{dateStr}</span>
            {orc.arquivo_url && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 4 }}>
                <Paperclip size={10} color="#8b5cf6" />
              </div>
            )}
          </div>
          <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color, fontWeight: 700 }}>
            {meta.label}
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
        .select('id, projeto_id, arquiteto_id, status, created_at, mensagem, arquivo_url')
        .eq('fornecedor_id', forn.id)
        .order('created_at', { ascending: false })

      if (rows && rows.length > 0) {
        const projIds = Array.from(new Set(rows.map((r: Record<string, unknown>) => r.projeto_id as string).filter(Boolean)))
        const arquIds = Array.from(new Set(rows.map((r: Record<string, unknown>) => r.arquiteto_id as string).filter(Boolean)))

        const [{ data: projs }, { data: arqus }] = await Promise.all([
          projIds.length > 0 ? supabase.from('projetos').select('id, nome').in('id', projIds) : Promise.resolve({ data: [] }),
          arquIds.length > 0 ? supabase.from('users').select('id, nome').in('id', arquIds) : Promise.resolve({ data: [] }),
        ])

        const projMap: Record<string, string> = {}
        for (const p of (projs ?? [])) projMap[(p as { id: string; nome: string }).id] = (p as { id: string; nome: string }).nome
        const arquMap: Record<string, string> = {}
        for (const a of (arqus ?? [])) arquMap[(a as { id: string; nome: string }).id] = (a as { id: string; nome: string }).nome

        setOrcamentos(rows.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          projeto_nome: r.projeto_id ? (projMap[r.projeto_id as string] ?? null) : null,
          arquiteto_nome: r.arquiteto_id ? (arquMap[r.arquiteto_id as string] ?? null) : null,
          status: (r.status as OrcStatus) ?? 'pendente',
          created_at: r.created_at as string,
          mensagem: r.mensagem as string | null,
          arquivo_url: r.arquivo_url as string | null,
        })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const total     = orcamentos.length
  const pendentes = orcamentos.filter(o => o.status === 'pendente').length
  const aprovados = orcamentos.filter(o => o.status === 'aprovado').length
  const concluidos = orcamentos.filter(o => o.status === 'concluido').length

  const kanbanOrcs = (col: OrcStatus) => orcamentos.filter(o => o.status === col)
  const progressOrcs = orcamentos.filter(o => PROGRESS_STAGES.includes(o.status))

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
        .fd-stat-card { background:#fff; border:1px solid rgba(0,0,0,0.08); border-radius:14px; padding:18px 22px; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
        .dash-orc-card:hover { border-color:rgba(0,122,255,0.2) !important; box-shadow:0 4px 12px rgba(0,0,0,0.1) !important; transform:translateY(-1px); }
        .dash-prog-row:hover { background:#f9f9fb !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Dashboard</h1>
          {userName && <p style={{ fontSize: 13, color: '#6b6b6b', margin: '5px 0 0' }}>Bem-vindo, {userName}</p>}
        </div>
        {perfilSlug ? (
          <Link href={`/fornecedor/${perfilSlug}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, padding: '8px 16px', borderRadius: 10, background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>
            <ExternalLink size={13} /> Ver Perfil Público
          </Link>
        ) : (
          <Link href="/fornecedor/perfil" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, padding: '8px 16px', borderRadius: 10, background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>
            Completar Perfil
          </Link>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 30 }}>
        {[
          { label: 'Total Recebidos', value: String(total),     icon: FileText,     color: '#007AFF' },
          { label: 'Pendentes',       value: String(pendentes), icon: Clock,        color: '#8b5cf6' },
          { label: 'Aprovados',       value: String(aprovados), icon: CheckCircle2, color: '#34d399' },
          { label: 'Concluídos',      value: String(concluidos), icon: Star,        color: '#10b981' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="fd-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: '#8e8e93', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{card.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', marginTop: 8 }}>{card.value}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${card.color}14`, border: `1px solid ${card.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={card.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Kanban header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Solicitações de Orçamento</div>
        <Link href="/fornecedor/orcamentos" style={{ fontSize: 12, color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>Ver lista completa →</Link>
      </div>

      {total === 0 ? (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '52px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Package size={36} color="#c7c7cc" style={{ marginBottom: 14 }} />
          <div style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 4 }}>Nenhum orçamento recebido</div>
          <div style={{ fontSize: 12, color: '#8e8e93' }}>Quando arquitetos solicitarem orçamentos, eles aparecerão aqui</div>
        </div>
      ) : (
        <>
          {/* Kanban columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            {KANBAN_COLS.map(col => {
              const cards = kanbanOrcs(col.key)
              const meta = STATUS_META[col.key]
              return (
                <div key={col.key}>
                  {/* Column header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{col.title}</span>
                    <div style={{ marginLeft: 'auto', fontSize: 11, padding: '1px 7px', borderRadius: 10, background: meta.bg, color: meta.color, fontWeight: 700, border: `1px solid ${meta.border}` }}>
                      {cards.length}
                    </div>
                  </div>

                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cards.length === 0 ? (
                      <div style={{ background: 'rgba(0,0,0,0.03)', border: '1.5px dashed rgba(0,0,0,0.1)', borderRadius: 12, padding: '20px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#c7c7cc' }}>Vazio</div>
                      </div>
                    ) : (
                      cards.slice(0, 5).map(orc => <OrcCard key={orc.id} orc={orc} />)
                    )}
                    {cards.length > 5 && (
                      <Link href={`/fornecedor/orcamentos`} style={{ fontSize: 11.5, color: '#007AFF', textDecoration: 'none', fontWeight: 600, textAlign: 'center', padding: '6px 0' }}>
                        +{cards.length - 5} ver todos
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* In-progress / concluded section */}
          {progressOrcs.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Em andamento &amp; Histórico</div>
                <div style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: 'rgba(0,0,0,0.05)', color: '#6b6b6b', fontWeight: 600 }}>{progressOrcs.length}</div>
              </div>
              {progressOrcs.slice(0, 6).map((orc, i) => {
                const meta = STATUS_META[orc.status]
                const initials = (orc.arquiteto_nome ?? 'A').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                const dateStr = new Date(orc.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                return (
                  <Link key={orc.id} href={`/fornecedor/orcamentos/${orc.id}`} style={{ textDecoration: 'none' }}>
                    <div className="dash-prog-row" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < progressOrcs.slice(0, 6).length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#007AFF', flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {orc.projeto_nome ?? 'Projeto sem nome'}
                        </div>
                        <div style={{ fontSize: 11, color: '#8e8e93' }}>{orc.arquiteto_nome ?? 'Arquiteto'} · {dateStr}</div>
                      </div>
                      <div style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 20, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
                        {meta.label}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
