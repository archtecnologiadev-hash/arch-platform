'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LogOut, Download, MessageCircle, FileText, ImageIcon, File,
  CalendarDays, FolderOpen, Activity, ArrowLeft, Check, DollarSign,
  type LucideIcon,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import CalendarioObra, { CalendarioEvent, EventType } from '@/components/shared/CalendarioObra'

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = 'andamento' | 'calendario' | 'arquivos' | 'orcamento' | 'financeiro'

interface OrcItem {
  id: string
  categoria: string
  descricao: string
  valor: number
  quantidade: number | null
  observacao: string | null
}

interface Projeto {
  id: string
  nome: string
  tipo: string | null
  etapa_atual: string | null
  cover_url: string | null
  created_at: string
  escritorio_id: string | null
  arquiteto_user_id: string | null
  escritorio_nome: string | null
}

interface Arquivo {
  id: string
  nome: string
  url: string
  tipo: string | null
  tamanho: number | null
  created_at: string
}

interface HistoricoItem {
  id: string
  acao: string
  detalhe: string | null
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = ['Atendimento', 'Reunião', 'Briefing', '3D', 'Alteração 3D', 'Detalhamento', 'Orçamento', 'Execução']
const STAGE_COLORS = ['#8b5cf6', '#007AFF', '#34d399', '#4f9cf9', '#f59e0b', '#f97316', '#ef4444', '#10b981']

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'andamento',  label: 'Andamento',  icon: Activity },
  { id: 'calendario', label: 'Calendário', icon: CalendarDays },
  { id: 'arquivos',   label: 'Arquivos',   icon: FolderOpen },
  { id: 'orcamento',  label: 'Orçamento',  icon: DollarSign },
  { id: 'financeiro', label: 'Financeiro', icon: FileText },
]

const ORC_CATS = ['Projeto', 'Execução', 'Marcenaria', 'Decoração', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros']
const ORC_CAT_COLOR: Record<string, string> = {
  Projeto: '#007AFF', Execução: '#34d399', Marcenaria: '#4f9cf9',
  Decoração: '#a78bfa', Elétrica: '#f59e0b', Hidráulica: '#06b6d4',
  Pintura: '#f97316', Outros: '#8e8e93',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stageIdx(etapa: string | null) {
  if (!etapa) return 0
  const i = STAGES.findIndex(s => s.toLowerCase() === etapa.toLowerCase())
  return i >= 0 ? i : 0
}

function fmtBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ tipo }: { tipo: string | null }) {
  if (tipo === 'pdf') return <FileText size={16} color="#ef4444" />
  if (tipo === 'image') return <ImageIcon size={16} color="#34d399" />
  if (tipo === 'dwg') return <File size={16} color="#4f9cf9" />
  return <File size={16} color="#8e8e93" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClienteProjetoPage() {
  const params = useParams()
  const router = useRouter()
  const projetoId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [calEvents, setCalEvents] = useState<CalendarioEvent[]>([])
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [orcItems, setOrcItems] = useState<OrcItem[]>([])
  const [finItems, setFinItems] = useState<{ id: string; tipo: string; descricao: string; valor: number; status: string; data_vencimento: string | null; data_pagamento: string | null; categoria: string | null }[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('andamento')
  const [startingConv, setStartingConv] = useState(false)

  useEffect(() => {
    if (!projetoId) return
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: proj } = await supabase
        .from('projetos')
        .select('*, escritorios(nome, user_id)')
        .eq('id', projetoId)
        .single()

      if (!proj) { setDenied(true); setLoading(false); return }

      // Verify access
      const hasAccess =
        proj.cliente_id === user.id ||
        (proj.email_cliente && proj.email_cliente === user.email)

      if (!hasAccess) { setDenied(true); setLoading(false); return }

      setProjeto({
        id: proj.id,
        nome: proj.nome,
        tipo: proj.tipo,
        etapa_atual: proj.etapa_atual,
        cover_url: proj.cover_url ?? null,
        created_at: proj.created_at,
        escritorio_id: proj.escritorio_id,
        arquiteto_user_id: proj.escritorios?.user_id ?? null,
        escritorio_nome: proj.escritorios?.nome ?? null,
      })

      const [{ data: arqs }, { data: evs }, { data: hist }, { data: orcData }, { data: finData }] = await Promise.all([
        supabase.from('arquivos_projeto').select('*').eq('projeto_id', projetoId).order('created_at', { ascending: false }),
        supabase.from('eventos').select('*').eq('projeto_id', projetoId).order('data_inicio'),
        supabase.from('projeto_historico').select('*').eq('projeto_id', projetoId).order('created_at', { ascending: false }).limit(20),
        supabase.from('orcamento_itens').select('id,categoria,descricao,valor,quantidade,observacao').eq('projeto_id', projetoId).order('created_at'),
        supabase.from('transacoes_financeiras').select('id,tipo,descricao,valor,status,data_vencimento,data_pagamento,categoria').eq('projeto_id', projetoId).order('created_at', { ascending: false }),
      ])

      if (arqs) setArquivos(arqs as Arquivo[])
      if (orcData) setOrcItems(orcData as OrcItem[])
      if (finData) setFinItems(finData as typeof finItems)
      if (evs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = evs.map((e: any) => ({
          id: e.id,
          type: e.tipo as EventType,
          title: e.titulo,
          provider: e.observacao ?? '',
          startDate: e.data_inicio,
          endDate: e.data_fim,
          startTime: e.hora_inicio ?? undefined,
          endTime: e.hora_fim ?? undefined,
          note: e.observacao ?? undefined,
        }))
        setCalEvents(mapped)
      }
      if (hist) setHistorico(hist as HistoricoItem[])
      setLoading(false)
    }
    load()
  }, [projetoId, router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleFalarComArquiteto() {
    if (!projeto?.arquiteto_user_id || !userId || startingConv) return
    setStartingConv(true)
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('conversas')
      .select('id')
      .eq('arquiteto_id', projeto.arquiteto_user_id)
      .eq('participante_id', userId)
      .maybeSingle()
    let convId: string | null = existing?.id ?? null
    if (!convId) {
      const { data: created } = await supabase
        .from('conversas')
        .insert({ arquiteto_id: projeto.arquiteto_user_id, participante_id: userId, tipo: 'cliente' })
        .select('id').single()
      convId = created?.id ?? null
    }
    setStartingConv(false)
    router.push(convId ? `/cliente/mensagens?c=${convId}` : '/cliente/mensagens')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-3)', fontSize: 14 }}>Carregando...</span>
      </div>
    )
  }

  if (denied || !projeto) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <FolderOpen size={40} color="#c7c7cc" />
        <div style={{ fontSize: 15, fontWeight: 600, color: '#3a3a3c' }}>Acesso negado</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Você não tem permissão para ver este projeto.</div>
        <button onClick={() => router.push('/cliente/projetos')} style={{ marginTop: 8, padding: '8px 20px', background: 'var(--btn-bg)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Voltar
        </button>
      </div>
    )
  }

  const idx = stageIdx(projeto.etapa_atual)
  const stageColor = STAGE_COLORS[idx] ?? '#007AFF'
  const progress = Math.round(((idx + 1) / STAGES.length) * 100)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0   rgba(0,122,255,0.4); }
          70%  { box-shadow: 0 0 0 8px rgba(0,122,255,0);   }
          100% { box-shadow: 0 0 0 0   rgba(0,122,255,0);   }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 30,
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/cliente/projetos')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13 }}>
            <ArrowLeft size={14} /> Meus Projetos
          </button>
          <span style={{ color: 'rgba(0,0,0,0.2)' }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{projeto.nome}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {projeto.arquiteto_user_id && (
            <button
              onClick={handleFalarComArquiteto}
              disabled={startingConv}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.25)',
                borderRadius: 8, color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <MessageCircle size={14} />
              {startingConv ? 'Abrindo...' : 'Falar com arquiteto'}
            </button>
          )}
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid var(--border-input)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-2)', padding: '7px 12px', fontSize: 13 }}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 20px' }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{projeto.nome}</h1>
            <span style={{
              fontSize: 11, fontWeight: 700, color: stageColor,
              background: `${stageColor}15`, border: `1px solid ${stageColor}40`,
              padding: '3px 10px', borderRadius: 20,
            }}>{STAGES[idx]}</span>
          </div>
          {projeto.escritorio_nome && (
            <div style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 600 }}>{projeto.escritorio_nome}</div>
          )}

          {/* Progress bar */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Progresso do projeto</span>
              <span style={{ fontSize: 11, color: stageColor, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: '#e5e5ea', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: stageColor, borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#e5e5ea', borderRadius: 10, padding: 4 }}>
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? '#1a1a1a' : '#6b6b6b',
                fontWeight: isActive ? 600 : 400, fontSize: 13,
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab: Andamento */}
        {activeTab === 'andamento' && (
          <div>
            {/* Stage stepper */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '20px 24px', marginBottom: 20,
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
                Etapas do Projeto
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {STAGES.map((stage, i) => {
                  const isDone = i < idx
                  const isCurrent = i === idx
                  const color = STAGE_COLORS[i] ?? '#007AFF'
                  return (
                    <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: i < STAGES.length - 1 ? 16 : 0 }}>
                      {/* Circle */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: isDone ? `${color}15` : isCurrent ? color : '#f2f2f7',
                          border: isDone ? `2px solid ${color}` : isCurrent ? `2px solid ${color}` : '2px solid #e5e5ea',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          animation: isCurrent ? 'pulse-ring 2s infinite' : 'none',
                        }}>
                          {isDone
                            ? <Check size={14} color={color} strokeWidth={3} />
                            : <span style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? '#fff' : '#c7c7cc' }}>{i + 1}</span>
                          }
                        </div>
                        {i < STAGES.length - 1 && (
                          <div style={{
                            position: 'absolute', left: '50%', top: 32, width: 2, height: 16,
                            transform: 'translateX(-50%)',
                            background: i < idx ? color : '#e5e5ea',
                          }} />
                        )}
                      </div>
                      {/* Label */}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: isCurrent ? 700 : isDone ? 500 : 400, color: isCurrent ? color : isDone ? '#1a1a1a' : '#8e8e93' }}>
                          {stage}
                          {isCurrent && <span style={{ marginLeft: 8, fontSize: 10, background: `${color}15`, color, border: `1px solid ${color}30`, padding: '2px 8px', borderRadius: 20 }}>Atual</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Historico */}
            {historico.length > 0 && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
              }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Histórico de Atividades
                </div>
                <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {historico.map(h => (
                    <div key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--btn-bg)', marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{h.acao}</div>
                        {h.detalhe && <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>{h.detalhe}</div>}
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                          {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Calendário */}
        {activeTab === 'calendario' && (
          <CalendarioObra events={calEvents} readonly />
        )}

        {/* Tab: Orçamento */}
        {activeTab === 'orcamento' && (() => {
          const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          const grandTotal = orcItems.reduce((s, it) => s + Number(it.valor) * (it.quantidade || 1), 0)
          const pieData = ORC_CATS.map(cat => ({
            name: cat,
            value: orcItems.filter(it => it.categoria === cat).reduce((s, it) => s + Number(it.valor) * (it.quantidade || 1), 0),
            color: ORC_CAT_COLOR[cat],
          })).filter(d => d.value > 0)

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Total Geral */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Total do Orçamento</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{fmtBRL(grandTotal)}</div>
                {orcItems.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                    {orcItems.length} {orcItems.length === 1 ? 'item' : 'itens'} · {pieData.length} {pieData.length === 1 ? 'categoria' : 'categorias'}
                  </div>
                )}
              </div>

              {/* Gráfico */}
              {pieData.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>Distribuição por Categoria</div>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div style={{ width: 170, height: 160, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={74} innerRadius={36} dataKey="value" strokeWidth={2} stroke="#fff">
                            {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v) => fmtBRL(Number(v))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {pieData.map(d => (
                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                          <div style={{ fontSize: 12.5, color: 'var(--text)', flex: 1 }}>{d.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{grandTotal > 0 ? Math.round(d.value / grandTotal * 100) : 0}%</div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', minWidth: 100, textAlign: 'right' }}>{fmtBRL(d.value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Detalhamento por categoria */}
              {ORC_CATS.map(cat => {
                const items = orcItems.filter(it => it.categoria === cat)
                if (items.length === 0) return null
                const catTotal = items.reduce((s, it) => s + Number(it.valor) * (it.quantidade || 1), 0)
                const pct = grandTotal > 0 ? Math.round(catTotal / grandTotal * 100) : 0
                const color = ORC_CAT_COLOR[cat]
                return (
                  <div key={cat} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}`, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{cat}</span>
                        <span style={{ fontSize: 11, background: `${color}15`, color, border: `1px solid ${color}30`, padding: '2px 8px', borderRadius: 20 }}>{pct}%</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fmtBRL(catTotal)}</span>
                    </div>
                    {items.map((it, i) => (
                      <div key={it.id} style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{it.descricao}</div>
                          {it.observacao && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{it.observacao}</div>}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', flexShrink: 0 }}>
                          {(it.quantidade || 1) > 1 ? `${it.quantidade}× ` : ''}{fmtBRL(Number(it.valor))}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flexShrink: 0, minWidth: 100, textAlign: 'right' }}>
                          {fmtBRL(Number(it.valor) * (it.quantidade || 1))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}

              {orcItems.length === 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 24px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                  <DollarSign size={36} color="#c7c7cc" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#3a3a3c', marginBottom: 4 }}>Orçamento não disponível</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>O orçamento deste projeto ainda não foi preenchido.</div>
                </div>
              )}
            </div>
          )
        })()}

        {/* Tab: Arquivos */}
        {activeTab === 'arquivos' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {arquivos.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
                <FolderOpen size={36} color="#c7c7cc" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14 }}>Nenhum arquivo disponível ainda</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {arquivos.map((arq, i) => (
                  <div key={arq.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
                    borderBottom: i < arquivos.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}>
                    <FileIcon tipo={arq.tipo} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{arq.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                        {fmtBytes(arq.tamanho)} · {new Date(arq.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                    <a href={arq.url} download target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(0,122,255,0.07)', border: '1px solid var(--accent-soft-border)', borderRadius: 7, color: 'var(--accent)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      <Download size={12} /> Baixar
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Financeiro (read-only) */}
        {activeTab === 'financeiro' && (() => {
          const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          const fmtDt  = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
          const totalEntrada = finItems.filter(t => t.tipo === 'entrada' && t.status !== 'cancelado').reduce((s, t) => s + Number(t.valor), 0)
          const totalSaida   = finItems.filter(t => t.tipo === 'saida'   && t.status !== 'cancelado').reduce((s, t) => s + Number(t.valor), 0)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {finItems.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Entradas', value: fmtBRL(totalEntrada), color: '#10b981' },
                    { label: 'Saídas',   value: fmtBRL(totalSaida),   color: '#ef4444' },
                    { label: 'Saldo',    value: fmtBRL(totalEntrada - totalSaida), color: totalEntrada - totalSaida >= 0 ? '#10b981' : '#ef4444' },
                  ].map(c => (
                    <div key={c.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {finItems.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
                    <DollarSign size={36} color="#c7c7cc" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 14 }}>Nenhum lançamento financeiro para este projeto</div>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Tipo', 'Descrição', 'Valor', 'Status', 'Vencimento'].map(h => (
                          <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {finItems.map((t, i) => {
                        const statusColors: Record<string, string> = { pendente: '#f59e0b', pago: '#10b981', atrasado: '#ef4444', cancelado: '#8e8e93' }
                        const statusLabels: Record<string, string> = { pendente: 'Pendente', pago: 'Pago', atrasado: 'Atrasado', cancelado: 'Cancelado' }
                        const sc = statusColors[t.status] ?? '#8e8e93'
                        return (
                          <tr key={t.id} style={{ borderBottom: i < finItems.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                            <td style={{ padding: '11px 16px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: t.tipo === 'entrada' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                color: t.tipo === 'entrada' ? '#10b981' : '#ef4444' }}>
                                {t.tipo === 'entrada' ? '+ Entrada' : '− Saída'}
                              </span>
                            </td>
                            <td style={{ padding: '11px 16px', color: 'var(--text)', fontWeight: 500 }}>
                              {t.descricao}
                              {t.categoria && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>· {t.categoria}</span>}
                            </td>
                            <td style={{ padding: '11px 16px', fontWeight: 700, color: t.tipo === 'entrada' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                              {t.tipo === 'entrada' ? '+' : '−'} {fmtBRL(Number(t.valor))}
                            </td>
                            <td style={{ padding: '11px 16px' }}>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: `${sc}18`, color: sc }}>
                                {statusLabels[t.status] ?? t.status}
                              </span>
                            </td>
                            <td style={{ padding: '11px 16px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmtDt(t.data_vencimento)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
