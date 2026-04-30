'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell, ChevronDown, FolderOpen, TrendingUp, TrendingDown, Clock, Wallet,
  LogOut, Settings, User, ArrowRight, Plus, X, ShieldCheck,
  DollarSign, CheckSquare, Users, Download, Lightbulb,
  type LucideIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Projeto {
  id: string
  nome: string
  etapa_atual: string | null
  status: string
  tipo: string | null
  metragem: number | null
  cliente_id: string | null
  created_at: string
}

interface Transacao {
  tipo: string
  valor: number
  status: string
  data_pagamento: string | null
  data_vencimento: string | null
  descricao: string
}

interface EtapaTempo {
  projeto_id: string
  etapa: string
  iniciado_em: string
  dias_na_etapa: number | null
}

interface Subtarefa {
  projeto_id: string
  titulo: string
  data_limite: string | null
}

interface Membro {
  id: string
  nome: string
  nivel_permissao: string | null
  cargo: string | null
}

interface Lead {
  id: string
  nome: string
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  'Atendimento', 'Reunião', 'Briefing', '3D', 'Alt. 3D', 'Detalhamento', 'Orçamento', 'Execução',
]
const STAGE_COLORS = ['#8b5cf6', '#007AFF', '#34d399', '#4f9cf9', '#f59e0b', '#f97316', '#ef4444', '#10b981']

function normalizeEtapa(etapa: string | null | undefined): string {
  if (!etapa) return 'Atendimento'
  const norm: Record<string, string> = {
    'Alteração 3D': 'Alt. 3D', alteracao3d: 'Alt. 3D', alt_3d: 'Alt. 3D',
    reuniao: 'Reunião', Reuniao: 'Reunião',
    orcamento: 'Orçamento', Orcamento: 'Orçamento',
    execucao: 'Execução', Execucao: 'Execução',
    briefing: 'Briefing', '3d': '3D',
    atendimento: 'Atendimento', detalhamento: 'Detalhamento',
  }
  return norm[etapa] ?? etapa
}

function fmtBRL(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function last12Months() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (11 - i))
    return monthKey(d)
  })
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const W = 60, H = 26
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - (v / max) * H}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
    </svg>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExecCard({ label, value, delta, sparkline, color, icon: Icon, subLabel }: {
  label: string; value: string; delta: number | null; sparkline: number[]
  color: string; icon: LucideIcon; subLabel: string
}) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', transition: 'box-shadow .2s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,.10)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,.06)')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={13} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          {delta !== null ? (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: delta >= 0 ? '#10b981' : '#ef4444' }}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% vs mês ant.
            </span>
          ) : (
            <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{subLabel}</span>
          )}
          {delta !== null && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{subLabel}</div>}
        </div>
        {sparkline.length >= 2 && <Sparkline values={sparkline} color={color} />}
      </div>
    </div>
  )
}

function AlertCard({ title, count, color, icon: Icon, href, items }: {
  title: string; count: number; color: string
  icon: LucideIcon
  href: string; items: Array<{ text: string; href: string }>
}) {
  const router = useRouter()
  if (count === 0) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${color}35`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '13px 18px', borderBottom: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={12} color={color} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          <span style={{ fontSize: 10, background: color, color: '#fff', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>{count}</span>
        </div>
        <Link href={href} style={{ fontSize: 11, color, textDecoration: 'none', fontWeight: 600 }}>Ver →</Link>
      </div>
      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, i) => (
          <div key={i} onClick={() => router.push(item.href)}
            style={{ fontSize: 12, color: 'var(--text-2)', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', lineHeight: 1.4 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {item.text}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArquitetoDashboardPage() {
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const [userName, setUserName] = useState('Arquiteto')
  const [userEmail, setUserEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [nivelRank, setNivelRank] = useState(5)
  const [escritorioId, setEscritorioId] = useState<string | null>(null)
  const [onboardingCompleto, setOnboardingCompleto] = useState<boolean | null>(null)
  const [onboardingPassos, setOnboardingPassos] = useState<string[]>([])

  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [etapasAbertas, setEtapasAbertas] = useState<EtapaTempo[]>([])
  const [etapasFechadas, setEtapasFechadas] = useState<EtapaTempo[]>([])
  const [subtarefas, setSubtarefas] = useState<Subtarefa[]>([])
  const [membros, setMembros] = useState<Membro[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [clienteMap, setClienteMap] = useState<Record<string, string>>({})
  const [membroProjetosMap, setMembroProjetosMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [novoOpen, setNovoOpen] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', tipo: 'residencial', descricao: '' })
  const [novoSaving, setNovoSaving] = useState(false)

  const userInitials = userName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'A'
  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      setUserName(user.user_metadata?.nome ?? user.email ?? 'Arquiteto')
      setUserEmail(user.email ?? '')

      const { data: ud } = await supabase
        .from('users').select('role, nivel_permissao, onboarding_completo, onboarding_passos_completos, escritorio_vinculado_id')
        .eq('id', user.id).maybeSingle()

      if (ud?.role === 'admin' || user.user_metadata?.role === 'admin') setIsAdmin(true)
      setOnboardingCompleto(ud?.onboarding_completo ?? false)
      setOnboardingPassos((ud?.onboarding_passos_completos ?? []) as string[])

      const RANK: Record<string, number> = { estagiario: 0, junior: 1, operacional: 1, pleno: 2, senior: 3, gestor: 4, admin: 4, owner: 5 }
      const nivel = ud?.nivel_permissao ?? 'owner'
      const rank = RANK[nivel] ?? 5
      setNivelRank(rank)

      // Operacional: only assigned projects
      if (rank < 3) {
        const { data: memberRows } = await supabase.from('projeto_membros').select('projeto_id').eq('user_id', user.id)
        const ids = (memberRows ?? []).map((r: { projeto_id: string }) => r.projeto_id)
        if (ids.length > 0) {
          const [projRes, clientsData, subRes] = await Promise.all([
            supabase.from('projetos').select('id,nome,etapa_atual,status,tipo,metragem,cliente_id,created_at').in('id', ids).order('created_at', { ascending: false }),
            (async () => {
              const { data: ps } = await supabase.from('projetos').select('cliente_id').in('id', ids)
              const cids = Array.from(new Set((ps ?? []).filter((p: { cliente_id: string | null }) => p.cliente_id).map((p: { cliente_id: string }) => p.cliente_id)))
              if (cids.length === 0) return []
              const { data } = await supabase.from('users').select('id, nome').in('id', cids)
              return data ?? []
            })(),
            supabase.from('projeto_subtarefas').select('projeto_id,titulo,data_limite').in('projeto_id', ids).eq('concluida', false),
          ])
          setProjetos((projRes.data ?? []) as Projeto[])
          const cm: Record<string, string> = {}
          for (const c of (clientsData as Array<{ id: string; nome: string }>)) cm[c.id] = c.nome
          setClienteMap(cm)
          setSubtarefas((subRes.data ?? []) as Subtarefa[])
        }
        setLoading(false)
        return
      }

      // Owner / senior
      let escId: string | null = null
      const { data: escOwn } = await supabase.from('escritorios').select('id').eq('user_id', user.id).maybeSingle()
      escId = escOwn?.id ?? ud?.escritorio_vinculado_id ?? null
      if (!escId) { setLoading(false); return }
      setEscritorioId(escId)

      // Step 1: fetch projects
      const { data: projData } = await supabase
        .from('projetos').select('id,nome,etapa_atual,status,tipo,metragem,cliente_id,created_at')
        .eq('escritorio_id', escId).order('created_at', { ascending: false })
      const projs = (projData ?? []) as Projeto[]
      setProjetos(projs)
      const projIds = projs.map(p => p.id)

      // Step 2: parallel fetches
      const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear() - 1); yearAgo.setDate(1)
      const clientIds = Array.from(new Set(projs.filter(p => p.cliente_id).map(p => p.cliente_id as string)))

      const [txRes, abertoRes, fechadoRes, subRes, membrosRes, leadsRes, cltRes, mpRes] = await Promise.all([
        supabase.from('transacoes_financeiras')
          .select('tipo,valor,status,data_pagamento,data_vencimento,descricao')
          .eq('escritorio_id', escId).gte('created_at', yearAgo.toISOString()),
        projIds.length > 0
          ? supabase.from('projeto_etapa_tempo').select('projeto_id,etapa,iniciado_em,dias_na_etapa').in('projeto_id', projIds).is('finalizado_em', null)
          : Promise.resolve({ data: [] }),
        projIds.length > 0
          ? supabase.from('projeto_etapa_tempo').select('projeto_id,etapa,iniciado_em,dias_na_etapa').in('projeto_id', projIds).not('finalizado_em', 'is', null).not('dias_na_etapa', 'is', null)
          : Promise.resolve({ data: [] }),
        projIds.length > 0
          ? supabase.from('projeto_subtarefas').select('projeto_id,titulo,data_limite').in('projeto_id', projIds).eq('concluida', false)
          : Promise.resolve({ data: [] }),
        supabase.from('users').select('id,nome,nivel_permissao,cargo').eq('escritorio_vinculado_id', escId),
        supabase.from('leads').select('id,nome,created_at').eq('escritorio_id', escId).order('created_at', { ascending: false }).limit(15),
        clientIds.length > 0
          ? supabase.from('users').select('id,nome').in('id', clientIds)
          : Promise.resolve({ data: [] }),
        projIds.length > 0
          ? supabase.from('projeto_membros').select('projeto_id,user_id').in('projeto_id', projIds)
          : Promise.resolve({ data: [] }),
      ])

      setTransacoes((txRes.data ?? []) as Transacao[])
      setEtapasAbertas((abertoRes.data ?? []) as EtapaTempo[])
      setEtapasFechadas((fechadoRes.data ?? []) as EtapaTempo[])
      setSubtarefas((subRes.data ?? []) as Subtarefa[])
      setMembros((membrosRes.data ?? []) as Membro[])
      setLeads((leadsRes.data ?? []) as Lead[])

      const cm: Record<string, string> = {}
      for (const c of (cltRes.data ?? []) as Array<{ id: string; nome: string }>) cm[c.id] = c.nome
      setClienteMap(cm)

      const mm: Record<string, number> = {}
      for (const mp of (mpRes.data ?? []) as Array<{ user_id: string }>) mm[mp.user_id] = (mm[mp.user_id] ?? 0) + 1
      setMembroProjetosMap(mm)

      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login'); router.refresh()
  }

  async function handleCriarProjeto(e: React.FormEvent) {
    e.preventDefault()
    if (!escritorioId || !novoForm.nome) return
    setNovoSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projetos')
      .insert({ escritorio_id: escritorioId, nome: novoForm.nome, tipo: novoForm.tipo, descricao: novoForm.descricao })
      .select('id,nome,etapa_atual,status,tipo,metragem,cliente_id,created_at').single()
    if (!error && data) {
      setProjetos(prev => [data as Projeto, ...prev])
      await supabase.from('projeto_etapa_tempo').insert({ projeto_id: data.id, etapa: 'Atendimento', iniciado_em: new Date().toISOString() })
    }
    setNovoSaving(false); setNovoOpen(false)
    setNovoForm({ nome: '', tipo: 'residencial', descricao: '' })
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const now = new Date()
  const mesMes = monthKey(now)
  const prevD = new Date(now); prevD.setMonth(prevD.getMonth() - 1)
  const mesAnt = monthKey(prevD)
  const hoje = now.toISOString().slice(0, 10)
  const months12 = last12Months()

  const revenueByMonth: Record<string, number> = {}
  const expenseByMonth: Record<string, number> = {}
  for (const tx of transacoes) {
    // Fallback: data_pagamento → data_vencimento → epoch (transactions with no dates stay out of current month)
    const mk = (tx.data_pagamento ?? tx.data_vencimento ?? '1900-01').slice(0, 7)
    if (tx.status === 'pago') {
      if (tx.tipo === 'entrada') revenueByMonth[mk] = (revenueByMonth[mk] ?? 0) + Number(tx.valor)
      else if (tx.tipo === 'saida') expenseByMonth[mk] = (expenseByMonth[mk] ?? 0) + Number(tx.valor)
    }
  }
  const receitaMes = revenueByMonth[mesMes] ?? 0
  const receitaAnt = revenueByMonth[mesAnt] ?? 0
  const receitaDelta = receitaAnt > 0 ? Math.round(((receitaMes - receitaAnt) / receitaAnt) * 100) : null
  const sparkReceita = months12.slice(6).map(m => revenueByMonth[m] ?? 0)

  const despesasMes = expenseByMonth[mesMes] ?? 0
  const despesasAnt = expenseByMonth[mesAnt] ?? 0
  const despesasDelta = despesasAnt > 0 ? Math.round(((despesasMes - despesasAnt) / despesasAnt) * 100) : null
  const sparkDespesas = months12.slice(6).map(m => expenseByMonth[m] ?? 0)
  const saldoMes = receitaMes - despesasMes

  const pendenteEntradas = transacoes.filter(t => t.tipo === 'entrada' && t.status === 'pendente')
  const totalPendenteEntrada = pendenteEntradas.reduce((s, t) => s + Number(t.valor), 0)
  const pendentesVencidos = transacoes.filter(t => t.status === 'pendente' && t.data_vencimento && t.data_vencimento < hoje).length
  const pendente = totalPendenteEntrada

  const projAtivos = projetos.filter(p => p.status !== 'concluido')
  const projNovosMes = projetos.filter(p => p.created_at.slice(0, 7) === mesMes).length
  const projNovosAnt = projetos.filter(p => p.created_at.slice(0, 7) === mesAnt).length
  const projetosDelta = projNovosAnt > 0 ? Math.round(((projNovosMes - projNovosAnt) / projNovosAnt) * 100) : null

  const totalM2 = projAtivos.reduce((s, p) => s + (p.metragem ?? 0), 0)

  const clientesAtivos = new Set(projAtivos.filter(p => p.cliente_id).map(p => p.cliente_id as string)).size
  const clientesMes = new Set(projetos.filter(p => p.created_at.slice(0, 7) === mesMes && p.cliente_id).map(p => p.cliente_id as string)).size
  const clientesAnt = new Set(projetos.filter(p => p.created_at.slice(0, 7) === mesAnt && p.cliente_id).map(p => p.cliente_id as string)).size
  const clientesDelta = clientesAnt > 0 ? Math.round(((clientesMes - clientesAnt) / clientesAnt) * 100) : null

  const limite15 = Date.now() - 15 * 86400000
  const projParados = etapasAbertas.filter(et => {
    const proj = projetos.find(p => p.id === et.projeto_id)
    return proj && new Date(et.iniciado_em).getTime() < limite15 && normalizeEtapa(proj.etapa_atual) !== 'Execução'
  })
  const pagAtrasados = transacoes.filter(tx =>
    tx.tipo === 'entrada' && (tx.status === 'atrasado' || (tx.status === 'pendente' && tx.data_vencimento && tx.data_vencimento < hoje))
  )
  const tarefasVencidas = subtarefas.filter(s => s.data_limite && s.data_limite < hoje)

  // Pipeline counts
  const stageCount: Record<string, number> = {}
  for (const s of PIPELINE_STAGES) stageCount[s] = 0
  for (const p of projAtivos) {
    const s = normalizeEtapa(p.etapa_atual)
    const key = PIPELINE_STAGES.find(x => x === s) ?? PIPELINE_STAGES[0]
    stageCount[key]++
  }
  const maxStage = Math.max(...Object.values(stageCount), 1)

  // Performance averages
  const stageSums: Record<string, { total: number; count: number }> = {}
  for (const et of etapasFechadas) {
    if (et.dias_na_etapa !== null) {
      const s = normalizeEtapa(et.etapa)
      if (!stageSums[s]) stageSums[s] = { total: 0, count: 0 }
      stageSums[s].total += et.dias_na_etapa
      stageSums[s].count++
    }
  }
  const stageAvg: Record<string, number> = {}
  for (const [s, d] of Object.entries(stageSums)) stageAvg[s] = Math.round(d.total / d.count)
  const maxAvg = Math.max(...Object.values(stageAvg), 1)

  // Revenue chart
  const maxMonthRev = Math.max(...months12.map(m => revenueByMonth[m] ?? 0), 1)

  // Insights
  const insights: Array<{ text: string; href: string; color: string }> = []
  const projPronto = projAtivos.find(p => {
    const subs = subtarefas.filter(s => s.projeto_id === p.id)
    return subs.length > 0 && subs.every(() => false) // placeholder: all tasks done check needs concluida field
  })
  void projPronto // suppress unused

  // Financial insights
  if (receitaDelta !== null && receitaMes > 0) {
    const dir = receitaDelta >= 0 ? `${receitaDelta}% acima` : `${Math.abs(receitaDelta)}% abaixo`
    insights.push({ text: `Receita do mês: ${fmtBRL(receitaMes)} — ${dir} do mês anterior`, href: '/arquiteto/financeiro', color: '#10b981' })
  }
  if (pendenteEntradas.length > 0) {
    insights.push({ text: `${pendenteEntradas.length} recebimento${pendenteEntradas.length !== 1 ? 's' : ''} pendente${pendenteEntradas.length !== 1 ? 's' : ''} — ${fmtBRL(totalPendenteEntrada)} a receber`, href: '/arquiteto/financeiro', color: '#f59e0b' })
  }
  const proxParcela = transacoes
    .filter(t => t.status === 'pendente' && t.data_vencimento && t.data_vencimento >= hoje)
    .sort((a, b) => (a.data_vencimento ?? '').localeCompare(b.data_vencimento ?? ''))[0]
  if (proxParcela?.data_vencimento) {
    const dtFmt = new Date(proxParcela.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
    insights.push({ text: `Próxima cobrança: "${proxParcela.descricao}" — ${fmtBRL(Number(proxParcela.valor))} vence em ${dtFmt}`, href: '/arquiteto/financeiro', color: '#4f9cf9' })
  }

  const etapaLenta = Object.entries(stageAvg).filter(([, v]) => v > 14).sort((a, b) => b[1] - a[1])[0]
  if (etapaLenta) insights.push({ text: `Etapa "${etapaLenta[0]}" demora em média ${etapaLenta[1]} dias (acima do ideal)`, href: '/arquiteto/projetos', color: '#f59e0b' })

  if (pagAtrasados.length > 0) {
    const total = pagAtrasados.reduce((s, t) => s + Number(t.valor), 0)
    insights.push({ text: `${pagAtrasados.length} pagamento${pagAtrasados.length !== 1 ? 's' : ''} em atraso — ${fmtBRL(total)} a receber`, href: '/arquiteto/financeiro', color: '#ef4444' })
  }

  if (projParados.length > 0) {
    const et = projParados[0]
    const proj = projetos.find(p => p.id === et.projeto_id)
    const dias = Math.floor((Date.now() - new Date(et.iniciado_em).getTime()) / 86400000)
    if (proj) insights.push({ text: `"${proj.nome}" está há ${dias} dias em ${normalizeEtapa(proj.etapa_atual)} sem avançar`, href: `/arquiteto/projetos/${proj.id}`, color: '#f59e0b' })
  }

  if (tarefasVencidas.length > 0) {
    insights.push({ text: `${tarefasVencidas.length} tarefa${tarefasVencidas.length !== 1 ? 's' : ''} com prazo vencido aguardando conclusão`, href: '/arquiteto/projetos', color: '#8b5cf6' })
  }

  const leadsRecentes = leads.filter(l => Date.now() - new Date(l.created_at).getTime() < 7 * 86400000)
  if (leadsRecentes.length > 0) {
    insights.push({ text: `${leadsRecentes.length} novo${leadsRecentes.length !== 1 ? 's' : ''} lead${leadsRecentes.length !== 1 ? 's' : ''} nos últimos 7 dias`, href: '/arquiteto/dashboard', color: '#4f9cf9' })
  }

  if (projAtivos.length === 0 && projetos.length === 0) {
    insights.push({ text: 'Crie seu primeiro projeto para começar a usar o pipeline', href: '/arquiteto/projetos', color: '#10b981' })
  }

  function openExportReport() {
    const mesLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const rows = projetos.slice(0, 50).map(p => {
      const et = etapasAbertas.find(e => e.projeto_id === p.id)
      const dias = et ? Math.floor((Date.now() - new Date(et.iniciado_em).getTime()) / 86400000) : '—'
      const cliente = p.cliente_id ? (clienteMap[p.cliente_id] ?? '—') : '—'
      return `<tr><td>${p.nome}</td><td>${cliente}</td><td>${normalizeEtapa(p.etapa_atual)}</td><td>${dias}d</td><td>${p.metragem ? p.metragem + ' m²' : '—'}</td></tr>`
    }).join('')
    const html = `<!DOCTYPE html><html><head><title>Relatório ${mesLabel}</title><style>
      body{font-family:sans-serif;font-size:12px;padding:24px;color:#222}h1{font-size:18px;margin-bottom:4px}
      p{color:#666;margin-bottom:16px;font-size:11px}.cards{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
      .card{padding:12px 18px;border:1px solid #e5e5e5;border-radius:8px;min-width:120px}
      .cv{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.06em}.cn{font-size:22px;font-weight:700;margin-top:4px}
      table{width:100%;border-collapse:collapse}th{text-align:left;border-bottom:2px solid #007AFF;padding:6px 8px;font-size:10px;color:#007AFF;text-transform:uppercase;letter-spacing:.06em}
      td{padding:6px 8px;border-bottom:1px solid #eee;font-size:11px}@media print{button{display:none}}
    </style></head><body>
    <h1>Relatório — ${mesLabel}</h1>
    <p>Gerado em ${now.toLocaleDateString('pt-BR')}</p>
    <div class="cards">
      <div class="card"><div class="cv">Receita do mês</div><div class="cn">${fmtBRL(receitaMes)}</div></div>
      <div class="card"><div class="cv">Projetos ativos</div><div class="cn">${projAtivos.length}</div></div>
      <div class="card"><div class="cv">m² em dev.</div><div class="cn">${totalM2 > 0 ? totalM2.toLocaleString('pt-BR') + ' m²' : '—'}</div></div>
      <div class="card"><div class="cv">Clientes ativos</div><div class="cn">${clientesAtivos}</div></div>
    </div>
    <table><thead><tr><th>Projeto</th><th>Cliente</th><th>Etapa</th><th>Dias na Etapa</th><th>Metragem</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`
    const w = window.open('', '_blank'); if (!w) return
    w.document.write(html); w.document.close(); w.onload = () => w.print()
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .dg4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .dg3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .dg2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .d2r{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start}
        .d2r-wide{display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start}
        @media(max-width:1100px){.dg4{grid-template-columns:repeat(2,1fr)}.d2r,.d2r-wide{grid-template-columns:1fr}}
        @media(max-width:800px){.dg3{grid-template-columns:1fr 1fr}.dg2{grid-template-columns:1fr}}
        @media(max-width:540px){.dg4,.dg3{grid-template-columns:1fr}}
      `}</style>

      {/* ═══ HEADER ═══ */}
      <div style={{
        padding: '0 32px', height: 70, borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 30,
        boxShadow: '0 1px 3px rgba(0,0,0,.08)',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {todayLabel}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, marginTop: 1 }}>{userName}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {nivelRank >= 3 && escritorioId && (
            <>
              <button onClick={() => setNovoOpen(true)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px',
                background: 'var(--btn-bg)', color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                <Plus size={12} /> Novo Projeto
              </button>
              <Link href="/arquiteto/financeiro" style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                background: 'var(--bg-card)', color: 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 8,
                fontSize: 12, fontWeight: 500, textDecoration: 'none',
              }}>
                <DollarSign size={12} /> Financeiro
              </Link>
              <button onClick={openExportReport} title="Exportar relatório" style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px',
                background: 'var(--bg-card)', color: 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 12,
              }}>
                <Download size={13} />
              </button>
            </>
          )}

          {isAdmin && (
            <Link href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px',
              borderRadius: 8, textDecoration: 'none',
              background: 'var(--accent-soft)', border: '1px solid var(--accent-soft-border)',
              color: 'var(--accent)', fontSize: 12, fontWeight: 600,
            }}>
              <ShieldCheck size={13} /> Admin
            </Link>
          )}

          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => { setNotifOpen(v => !v); setDropdownOpen(false) }} style={{
              width: 36, height: 36, borderRadius: 8, background: 'transparent',
              border: '1px solid var(--border-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Bell size={15} color="#8e8e93" />
            </button>
            {notifOpen && (
              <div style={{ position: 'absolute', top: 44, right: 0, width: 240, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 100 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Notificações</div>
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Nenhuma notificação</div>
              </div>
            )}
          </div>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => { setDropdownOpen(v => !v); setNotifOpen(false) }} style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px 4px 4px',
              background: 'transparent', border: '1px solid var(--border-input)', borderRadius: 10, cursor: 'pointer',
            }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                {userInitials}
              </div>
              <ChevronDown size={12} color="#8e8e93" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .15s' }} />
            </button>
            {dropdownOpen && (
              <div style={{ position: 'absolute', top: 46, right: 0, width: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 100, overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{userName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{userEmail}</div>
                </div>
                {[
                  { label: 'Meu Perfil', icon: User, href: '/arquiteto/perfil' },
                  { label: 'Configurações', icon: Settings, href: '/arquiteto/perfil' },
                ].map(({ label, icon: Icon, href }) => (
                  <Link key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', textDecoration: 'none', fontSize: 13, color: 'var(--text-2)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
                    <Icon size={13} />{label}
                  </Link>
                ))}
                <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 13, color: '#ef4444', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                  <LogOut size={13} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ONBOARDING BANNER ═══ */}
      {onboardingCompleto === false && nivelRank >= 2 && (
        <Link href="/arquiteto/onboarding" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{ background: 'linear-gradient(90deg,rgba(0,122,255,.08),rgba(0,122,255,.03))', borderBottom: '1px solid rgba(0,122,255,.15)', padding: '11px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--btn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>!</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Complete a configuração do escritório</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>— {onboardingPassos.length} de 4 passos</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              Continuar <ArrowRight size={13} />
            </span>
          </div>
        </Link>
      )}

      {/* ═══ CONTENT ═══ */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ width: 24, height: 24, border: '2px solid var(--accent)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>

          {/* ══ ZONE 1 — EXECUTIVE SUMMARY ══ */}
          {nivelRank >= 3 && (
            <section style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Resumo Executivo</div>
              <div className="dg4">
                <ExecCard label="Receita do Mês" value={fmtBRL(receitaMes)} delta={receitaDelta}
                  sparkline={sparkReceita} color="#10b981" icon={DollarSign}
                  subLabel={`A receber: ${fmtBRL(totalPendenteEntrada)}`} />
                <ExecCard label="Despesas do Mês" value={fmtBRL(despesasMes)} delta={null}
                  sparkline={sparkDespesas} color="#ef4444" icon={TrendingDown}
                  subLabel={despesasDelta !== null ? `${despesasDelta >= 0 ? '↑' : '↓'}${Math.abs(despesasDelta)}% vs mês ant.` : `Mês ant.: ${fmtBRL(despesasAnt)}`} />
                <ExecCard label="Saldo do Mês" value={fmtBRL(saldoMes)} delta={null}
                  sparkline={[]} color={saldoMes >= 0 ? '#007AFF' : '#ef4444'} icon={Wallet}
                  subLabel={saldoMes >= 0 ? 'Resultado positivo' : 'Resultado negativo'} />
                <ExecCard label="Pendências" value={fmtBRL(totalPendenteEntrada)} delta={null}
                  sparkline={[]} color="#f59e0b" icon={Clock}
                  subLabel={`${pendentesVencidos} vencida${pendentesVencidos !== 1 ? 's' : ''} · ${pendenteEntradas.length} total`} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
                {[
                  { label: 'Projetos Ativos', value: String(projAtivos.length), sub: `${projNovosMes} novo${projNovosMes !== 1 ? 's' : ''} este mês` },
                  { label: 'm² em Desenvolvimento', value: totalM2 > 0 ? `${totalM2.toLocaleString('pt-BR')} m²` : '—', sub: `${projAtivos.length} projeto${projAtivos.length !== 1 ? 's' : ''} em andamento` },
                  { label: 'Clientes Ativos', value: String(clientesAtivos), sub: `${clientesMes} novo${clientesMes !== 1 ? 's' : ''} este mês` },
                  { label: 'Leads Recentes', value: String(leadsRecentes.length), sub: 'últimos 7 dias' },
                ].map(({ label, value, sub }) => (
                  <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ══ ZONE 2 — ACTION NEEDED ══ */}
          {nivelRank >= 3 && (projParados.length > 0 || pagAtrasados.length > 0 || tarefasVencidas.length > 0) && (
            <section style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>Ações Necessárias</div>
              <div className="dg3">
                <AlertCard title="Projetos Parados" count={projParados.length} color="#f59e0b" icon={Clock}
                  href="/arquiteto/projetos"
                  items={projParados.slice(0, 3).map(et => {
                    const proj = projetos.find(p => p.id === et.projeto_id)
                    const dias = Math.floor((Date.now() - new Date(et.iniciado_em).getTime()) / 86400000)
                    return { text: proj ? `"${proj.nome}" — ${dias} dias em ${normalizeEtapa(proj.etapa_atual)}` : '', href: `/arquiteto/projetos/${et.projeto_id}` }
                  }).filter(x => x.text)} />
                <AlertCard title="Pagamentos em Atraso" count={pagAtrasados.length} color="#ef4444" icon={DollarSign}
                  href="/arquiteto/financeiro"
                  items={pagAtrasados.slice(0, 3).map(tx => ({ text: `${tx.descricao} — ${fmtBRL(Number(tx.valor))}`, href: '/arquiteto/financeiro' }))} />
                <AlertCard title="Tarefas Vencidas" count={tarefasVencidas.length} color="#8b5cf6" icon={CheckSquare}
                  href="/arquiteto/projetos"
                  items={tarefasVencidas.slice(0, 3).map(s => ({
                    text: `"${s.titulo}" — venceu ${new Date(s.data_limite!).toLocaleDateString('pt-BR')}`,
                    href: `/arquiteto/projetos/${s.projeto_id}`,
                  }))} />
              </div>
            </section>
          )}

          {/* ══ ZONE 3 — DEEP VIEW (owner) ══ */}
          {nivelRank >= 3 ? (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Pipeline + Insights */}
              <div className="d2r">
                {/* Pipeline */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Pipeline de Projetos</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{projAtivos.length} projeto{projAtivos.length !== 1 ? 's' : ''} em andamento</div>
                    </div>
                    <Link href="/arquiteto/projetos" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Ver kanban →</Link>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {PIPELINE_STAGES.map((stage, idx) => {
                      const count = stageCount[stage] ?? 0
                      const pct = Math.round((count / maxStage) * 100)
                      const color = STAGE_COLORS[idx]
                      return (
                        <div key={stage} style={{ cursor: 'pointer' }} onClick={() => router.push('/arquiteto/projetos')}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: count > 0 ? 600 : 400 }}>{stage}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: count > 0 ? color : 'var(--text-3)' }}>{count}</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, opacity: count > 0 ? 1 : 0.15, transition: 'width .4s ease' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Insights */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Lightbulb size={14} color="#f59e0b" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Insights</span>
                  </div>
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {insights.length === 0 ? (
                      <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Tudo em ordem!</div>
                    ) : insights.slice(0, 5).map((ins, i) => (
                      <div key={i} onClick={() => router.push(ins.href)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 10px', borderRadius: 8, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: ins.color, marginTop: 5, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>{ins.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Revenue chart + Performance */}
              <div className="d2r-wide">
                {/* 12-month revenue */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Receita Mensal</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Últimos 12 meses</div>
                    </div>
                    <Link href="/arquiteto/financeiro" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Detalhes →</Link>
                  </div>
                  <div style={{ padding: '20px 20px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90 }}>
                      {months12.map((m, idx) => {
                        const v = revenueByMonth[m] ?? 0
                        const h = Math.max(3, Math.round((v / maxMonthRev) * 90))
                        const isCur = m === mesMes
                        const lbl = new Date(m + '-02').toLocaleDateString('pt-BR', { month: 'short' })
                        return (
                          <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'default' }} title={`${lbl}: ${fmtBRL(v)}`}>
                            <div style={{ width: '100%', height: h, borderRadius: '3px 3px 0 0', background: isCur ? '#007AFF' : 'var(--border)', transition: 'height .3s' }} />
                            {(idx === 0 || idx === 5 || idx === 11 || isCur) && (
                              <span style={{ fontSize: 8, color: isCur ? 'var(--accent)' : 'var(--text-3)', fontWeight: isCur ? 700 : 400 }}>{lbl}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Receita</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#10b981' }}>{fmtBRL(receitaMes)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Despesas</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#ef4444' }}>{fmtBRL(despesasMes)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Saldo</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: saldoMes >= 0 ? '#007AFF' : '#ef4444' }}>{fmtBRL(saldoMes)}</div>
                      </div>
                      {receitaDelta !== null && (
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Var. receita</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: receitaDelta >= 0 ? '#10b981' : '#ef4444' }}>
                            {receitaDelta >= 0 ? '↑' : '↓'} {Math.abs(receitaDelta)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Performance por Etapa</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Tempo médio (dias) · verde ≤7 · amarelo ≤14 · vermelho &gt;14</div>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    {Object.keys(stageAvg).length === 0 ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Dados insuficientes — conclua projetos para ver médias</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {PIPELINE_STAGES.filter(s => stageAvg[s] !== undefined).map(s => {
                          const avg = stageAvg[s]
                          const pct = Math.round((avg / maxAvg) * 100)
                          const color = avg <= 7 ? '#10b981' : avg <= 14 ? '#f59e0b' : '#ef4444'
                          return (
                            <div key={s}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                                <span style={{ color: 'var(--text-2)' }}>{s}</span>
                                <span style={{ fontWeight: 700, color }}>{avg}d</span>
                              </div>
                              <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .4s' }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Team */}
              {membros.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Equipe</div>
                    <Link href="/arquiteto/equipe" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Gerenciar →</Link>
                  </div>
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {membros.slice(0, 6).map(m => {
                      const initials = (m.nome ?? '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                      const projCount = membroProjetosMap[m.id] ?? 0
                      const nivelLbl: Record<string, string> = { owner: 'Dono', admin: 'Admin', pleno: 'Pleno', operacional: 'Operacional', gestor: 'Gestor' }
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8 }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{initials}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nome}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                              {m.cargo ?? nivelLbl[m.nivel_permissao ?? ''] ?? m.nivel_permissao}
                              {projCount > 0 && ` · ${projCount} projeto${projCount !== 1 ? 's' : ''}`}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

          ) : (
            /* ══ OPERACIONAL VIEW ══ */
            <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="dg3">
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Projetos Atribuídos</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{projetos.length}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Tarefas Pendentes</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{subtarefas.length}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Tarefas Vencidas</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: tarefasVencidas.length > 0 ? '#ef4444' : 'var(--text)' }}>{tarefasVencidas.length}</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Meus Projetos</div>
                </div>
                {projetos.length === 0 ? (
                  <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <FolderOpen size={32} color="#8e8e93" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Nenhum projeto atribuído ainda</div>
                  </div>
                ) : (
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {projetos.slice(0, 8).map(p => {
                      const etapa = normalizeEtapa(p.etapa_atual)
                      const idx = PIPELINE_STAGES.indexOf(etapa)
                      const color = STAGE_COLORS[idx >= 0 ? idx : 0]
                      return (
                        <div key={p.id} onClick={() => router.push(`/arquiteto/projetos/${p.id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</div>
                            {p.cliente_id && clienteMap[p.cliente_id] && (
                              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{clienteMap[p.cliente_id]}</div>
                            )}
                          </div>
                          <span style={{ fontSize: 10.5, fontWeight: 600, color, background: color + '18', padding: '2px 8px', borderRadius: 10, flexShrink: 0 }}>{etapa}</span>
                          <ArrowRight size={12} color="var(--text-3)" />
                        </div>
                      )
                    })}
                    {projetos.length > 8 && (
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <Link href="/arquiteto/projetos" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Ver todos ({projetos.length}) →</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══ NEW PROJECT MODAL ══ */}
      {novoOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setNovoOpen(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setNovoOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
              <X size={18} />
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Novo Projeto</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>Adicione ao pipeline</p>
            <form onSubmit={handleCriarProjeto} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Nome do projeto *</label>
                <input value={novoForm.nome} onChange={e => setNovoForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Residência Costa" required
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', borderRadius: 10 }}
                  onFocus={e => (e.target.style.borderColor = '#007AFF')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Tipo</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['residencial', 'comercial', 'institucional'].map(t => (
                    <button key={t} type="button" onClick={() => setNovoForm(p => ({ ...p, tipo: t }))} style={{
                      flex: 1, padding: '9px 4px', fontSize: 12, borderRadius: 8, cursor: 'pointer',
                      background: novoForm.tipo === t ? 'rgba(0,122,255,.1)' : 'var(--bg)',
                      border: `1px solid ${novoForm.tipo === t ? '#007AFF' : 'var(--border)'}`,
                      color: novoForm.tipo === t ? '#007AFF' : 'var(--text-2)', textTransform: 'capitalize',
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>Descrição (opcional)</label>
                <textarea value={novoForm.descricao} onChange={e => setNovoForm(p => ({ ...p, descricao: e.target.value }))} rows={3}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', borderRadius: 10, resize: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#007AFF')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              {!escritorioId && <p style={{ fontSize: 12, color: '#f97316', padding: '10px 14px', background: 'rgba(249,115,22,.06)', borderRadius: 8 }}>Configure seu perfil antes de criar projetos.</p>}
              <button type="submit" disabled={novoSaving || !escritorioId || !novoForm.nome} style={{
                width: '100%', padding: '12px', background: novoSaving || !escritorioId || !novoForm.nome ? 'rgba(0,122,255,.4)' : '#007AFF',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: novoSaving || !escritorioId || !novoForm.nome ? 'not-allowed' : 'pointer',
              }}>
                {novoSaving ? 'Criando...' : 'Criar Projeto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
