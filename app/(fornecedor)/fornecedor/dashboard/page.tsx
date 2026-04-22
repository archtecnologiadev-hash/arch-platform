'use client'

import { useState, useEffect } from 'react'
import { Star, FileText, ExternalLink, CheckCircle2, MessageSquare, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type OrcStatus = 'pendente' | 'respondido' | 'aprovado' | 'recusado'

interface OrcResumo {
  id: string
  projeto_nome: string | null
  arquiteto_nome: string | null
  status: OrcStatus
  created_at: string
}

const STATUS_META: Record<OrcStatus, { label: string; color: string; bg: string; border: string }> = {
  pendente:   { label: 'Pendente',   color: '#007AFF', bg: 'rgba(0,122,255,0.08)',   border: 'rgba(0,122,255,0.2)' },
  respondido: { label: 'Respondido', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
  aprovado:   { label: 'Aprovado',   color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.22)' },
  recusado:   { label: 'Recusado',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.22)' },
}

export default function FornecedorDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [perfilSlug, setPerfilSlug] = useState<string | null>(null)
  const [orcamentos, setOrcamentos] = useState<OrcResumo[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const nome = user.user_metadata?.nome ?? user.email ?? 'Fornecedor'
      setUserName(nome)

      const { data: forn } = await supabase
        .from('fornecedores').select('id, slug').eq('user_id', user.id).single()
      if (!forn) { setLoading(false); return }
      if (forn.slug) setPerfilSlug(forn.slug)

      const { data: rows } = await supabase
        .from('orcamentos')
        .select('id, projeto_id, arquiteto_id, status, created_at')
        .eq('fornecedor_id', forn.id)
        .order('created_at', { ascending: false })
        .limit(10)

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
        })))
      }

      setLoading(false)
    }
    load()
  }, [])

  const total     = orcamentos.length
  const pendentes = orcamentos.filter(o => o.status === 'pendente').length
  const aprovados = orcamentos.filter(o => o.status === 'aprovado').length

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
        .fd-stat-card { background:#fff; border:1px solid rgba(0,0,0,0.08); border-radius:14px; padding:20px 22px; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
        .fd-orc-row:hover { background:#f9f9fb !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Recebidos', value: String(total),     icon: FileText,     color: '#007AFF' },
          { label: 'Pendentes',       value: String(pendentes), icon: Clock,        color: '#f59e0b' },
          { label: 'Aprovados',       value: String(aprovados), icon: CheckCircle2, color: '#34d399' },
          { label: 'Avaliação',       value: '—',               icon: Star,         color: '#f97316' },
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

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>

        {/* Recent orcamentos */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Orçamentos Recentes</div>
            <Link href="/fornecedor/orcamentos" style={{ fontSize: 12, color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
          </div>

          {orcamentos.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <FileText size={36} color="#c7c7cc" style={{ marginBottom: 14 }} />
              <div style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 4 }}>Nenhum orçamento recebido</div>
              <div style={{ fontSize: 12, color: '#8e8e93' }}>Quando arquitetos solicitarem orçamentos, eles aparecerão aqui</div>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              {orcamentos.slice(0, 8).map((orc, i) => {
                const meta = STATUS_META[orc.status]
                const initials = (orc.arquiteto_nome ?? 'A').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                const dateStr = new Date(orc.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                return (
                  <div key={orc.id} className="fd-orc-row" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: i < orcamentos.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', transition: 'background 0.12s' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#007AFF', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {orc.projeto_nome ?? 'Projeto sem nome'}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#6b6b6b', marginTop: 2 }}>
                        {orc.arquiteto_nome ?? 'Arquiteto'} · {dateStr}
                      </div>
                    </div>
                    <div style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 20, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
                      {meta.label}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Mensagens</div>
            <Link href="/fornecedor/mensagens" style={{ fontSize: 12, color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>Ver todas →</Link>
          </div>
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '36px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <MessageSquare size={28} color="#c7c7cc" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 3 }}>Nenhuma mensagem</div>
            <div style={{ fontSize: 11, color: '#8e8e93' }}>Conversas com arquitetos aparecerão aqui</div>
          </div>
          <div style={{ marginTop: 14, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 10, color: '#8e8e93', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Avaliação Média</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#c7c7cc' }}>—</div>
              <div style={{ fontSize: 12, color: '#6b6b6b' }}>Sem avaliações ainda</div>
            </div>
          </div>
          <div style={{ marginTop: 14, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 10, color: '#8e8e93', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Links Rápidos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Editar Perfil', href: '/fornecedor/perfil' },
                { label: 'Catálogo',      href: '/fornecedor/catalogo' },
                { label: 'Orçamentos',    href: '/fornecedor/orcamentos' },
              ].map(link => (
                <Link key={link.href} href={link.href} style={{ fontSize: 12.5, color: '#007AFF', textDecoration: 'none', padding: '7px 12px', borderRadius: 8, background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.12)', fontWeight: 600, display: 'block' }}>
                  {link.label} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
