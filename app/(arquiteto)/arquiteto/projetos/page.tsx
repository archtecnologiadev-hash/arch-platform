'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { FolderOpen, Plus, ArrowRight, X, AlertCircle, LayoutGrid, List, Search, Download, Filter } from 'lucide-react'
import CoverUploadButton from '@/components/shared/CoverUploadButton'
import { usePlan } from '@/hooks/usePlan'
import KanbanBoard, { KanbanProjeto, diasDesde } from '@/components/shared/KanbanBoard'

const PIPELINE_STAGES = ['Atendimento', 'Reunião', 'Briefing', '3D', 'Alt. 3D', 'Detalhamento', 'Orçamento', 'Execução']

const ETAPA_TO_LABEL: Record<string, string> = {
  atendimento: 'Atendimento', reuniao: 'Reunião', briefing: 'Briefing',
  '3d': '3D', alt_3d: 'Alt. 3D', detalhamento: 'Detalhamento',
  orcamento: 'Orçamento', execucao: 'Execução',
  Atendimento: 'Atendimento', 'Reunião': 'Reunião', Briefing: 'Briefing',
  '3D': '3D', 'Alteração 3D': 'Alt. 3D', 'Alt. 3D': 'Alt. 3D',
  Detalhamento: 'Detalhamento', 'Orçamento': 'Orçamento', 'Execução': 'Execução',
}

const TIPO_LABEL: Record<string, string> = {
  residencial: 'Residencial', comercial: 'Comercial', institucional: 'Institucional',
}

interface Projeto {
  id: string
  nome: string
  etapa_atual: string | null
  tipo: string | null
  status: string
  cover_url: string | null
  created_at: string
  cliente_id: string | null
}

interface Escritorio {
  id: string
  nome: string
  cidade: string | null
}

interface EtapaTempoEntry { id: string; iniciado_em: string }

export default function ProjetosPage() {
  const router = useRouter()
  const planInfo = usePlan()

  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [clienteMap, setClienteMap] = useState<Record<string, string>>({})
  const [projetoMembrosMap, setProjetoMembrosMap] = useState<Record<string, Array<{ nome: string }>>>({})
  const [etapaTempoMap, setEtapaTempoMap] = useState<Record<string, EtapaTempoEntry>>({})
  const [subtarefasPendMap, setSubtarefasPendMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [escritorio, setEscritorio] = useState<Escritorio | null>(null)

  // View & filter state
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista')
  const [filtroBusca, setFiltroBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [showFilters, setShowFilters] = useState(false)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', tipo: 'residencial', descricao: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const perfilCompleto = !!(escritorio?.nome)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let { data: esc } = await supabase
      .from('escritorios').select('id, nome, cidade').eq('user_id', user.id).maybeSingle()

    let nivelPermissao = 'owner'

    if (!esc) {
      const { data: ud } = await supabase
        .from('users').select('escritorio_vinculado_id, nivel_permissao').eq('id', user.id).maybeSingle()
      if (ud?.escritorio_vinculado_id) {
        nivelPermissao = ud.nivel_permissao ?? 'operacional'
        const { data: le } = await supabase
          .from('escritorios').select('id, nome, cidade').eq('id', ud.escritorio_vinculado_id).maybeSingle()
        esc = le
      }
    }

    if (esc) {
      setEscritorio(esc)
      let projs: Projeto[] = []

      if (nivelPermissao === 'operacional') {
        const { data: membros } = await supabase
          .from('projeto_membros').select('projeto_id').eq('user_id', user.id)
        const ids = (membros ?? []).map((m: { projeto_id: string }) => m.projeto_id)
        if (ids.length > 0) {
          const { data } = await supabase.from('projetos').select('*').in('id', ids).order('created_at', { ascending: false })
          projs = (data ?? []) as Projeto[]
        }
      } else {
        const { data } = await supabase
          .from('projetos').select('*')
          .eq('escritorio_id', esc.id)
          .order('created_at', { ascending: false })
        projs = (data ?? []) as Projeto[]
      }

      setProjetos(projs)

      if (projs.length > 0) {
        const projIds = projs.map(p => p.id)

        // Membros, clientes, etapa tempo, subtarefas in parallel
        const [membrosRes, clienteIdsData, tempoRes, subRes] = await Promise.all([
          supabase.from('projeto_membros').select('projeto_id, users(nome)').in('projeto_id', projIds),
          Promise.resolve(projs.filter(p => p.cliente_id).map(p => p.cliente_id as string)),
          supabase.from('projeto_etapa_tempo').select('id, projeto_id, iniciado_em').in('projeto_id', projIds).is('finalizado_em', null),
          supabase.from('projeto_subtarefas').select('projeto_id').in('projeto_id', projIds).eq('concluida', false),
        ])

        // Membros map
        if (membrosRes.data) {
          const map: Record<string, Array<{ nome: string }>> = {}
          for (const m of membrosRes.data as unknown as Array<{ projeto_id: string; users: { nome: string } | null }>) {
            if (!map[m.projeto_id]) map[m.projeto_id] = []
            map[m.projeto_id].push({ nome: m.users?.nome ?? '?' })
          }
          setProjetoMembrosMap(map)
        }

        // Cliente map
        const clienteIds = Array.from(new Set(clienteIdsData))
        if (clienteIds.length > 0) {
          const { data: clientes } = await supabase.from('users').select('id, nome').in('id', clienteIds)
          const cm: Record<string, string> = {}
          for (const c of (clientes ?? []) as Array<{ id: string; nome: string }>) cm[c.id] = c.nome
          setClienteMap(cm)
        }

        // Etapa tempo map
        if (tempoRes.data) {
          const tm: Record<string, EtapaTempoEntry> = {}
          for (const t of tempoRes.data as Array<{ id: string; projeto_id: string; iniciado_em: string }>) {
            tm[t.projeto_id] = { id: t.id, iniciado_em: t.iniciado_em }
          }
          setEtapaTempoMap(tm)
        }

        // Subtarefas pending count
        if (subRes.data) {
          const sm: Record<string, number> = {}
          for (const s of subRes.data as Array<{ projeto_id: string }>) {
            sm[s.projeto_id] = (sm[s.projeto_id] ?? 0) + 1
          }
          setSubtarefasPendMap(sm)
        }
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCriarProjeto(e: React.FormEvent) {
    e.preventDefault()
    if (!escritorio || !form.nome.trim()) return
    setSaving(true)
    setFormError(null)
    const supabase = createClient()

    if (planInfo.maxProjetos !== null && projetos.length >= planInfo.maxProjetos) {
      setFormError(`Limite de ${planInfo.maxProjetos} projeto${planInfo.maxProjetos !== 1 ? 's' : ''} atingido. Faça upgrade para continuar.`)
      setSaving(false)
      return
    }
    const { data, error } = await supabase
      .from('projetos')
      .insert({ escritorio_id: escritorio.id, nome: form.nome.trim(), tipo: form.tipo, descricao: form.descricao || null })
      .select('*').single()

    if (error) {
      setFormError(error.message ?? 'Erro ao criar projeto. Tente novamente.')
    } else if (data) {
      const { data: { user } } = await supabase.auth.getUser()
      const pastas = ['Fotos de Obra', 'Croquis e Esboços', 'Plantas e Projetos', 'Documentos', 'Referências']
      if (user) {
        await supabase.from('projeto_pastas').insert(
          pastas.map((nome, ordem) => ({ projeto_id: data.id, nome, pasta_pai_id: null, criado_por: user.id, ordem }))
        )
        // Open etapa_tempo for first stage
        await supabase.from('projeto_etapa_tempo').insert({
          projeto_id: data.id, etapa: 'Atendimento', iniciado_em: new Date().toISOString(),
        })
      }
      setProjetos(prev => [data as Projeto, ...prev])
      setModalOpen(false)
      setForm({ nome: '', tipo: 'residencial', descricao: '' })
    }
    setSaving(false)
  }

  function handleCoverUpdate(id: string, url: string) {
    setProjetos(prev => prev.map(p => p.id === id ? { ...p, cover_url: url } : p))
  }

  async function handleKanbanMove(projetoId: string, novaEtapa: string) {
    const proj = projetos.find(p => p.id === projetoId)
    if (!proj) return
    const supabase = createClient()
    const now = new Date().toISOString()
    const oldTempo = etapaTempoMap[projetoId]

    // Close old tempo record
    if (oldTempo) {
      const dias = diasDesde(oldTempo.iniciado_em) ?? 0
      await supabase.from('projeto_etapa_tempo').update({ finalizado_em: now, dias_na_etapa: dias }).eq('id', oldTempo.id)
    }

    // Open new tempo record
    const { data: newTempo } = await supabase
      .from('projeto_etapa_tempo')
      .insert({ projeto_id: projetoId, etapa: novaEtapa, iniciado_em: now })
      .select('id, iniciado_em').single()

    // Update projeto
    await supabase.from('projetos').update({ etapa_atual: novaEtapa }).eq('id', projetoId)

    // Notify client
    fetch('/api/notifications/etapa-avancada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projeto_id: projetoId, etapa_anterior: proj.etapa_atual, nova_etapa: novaEtapa }),
    }).catch(() => {})

    setProjetos(prev => prev.map(p => p.id === projetoId ? { ...p, etapa_atual: novaEtapa } : p))
    if (newTempo) {
      setEtapaTempoMap(prev => ({ ...prev, [projetoId]: { id: newTempo.id, iniciado_em: newTempo.iniciado_em } }))
    }
  }

  function openExportReport() {
    const html = buildReportHtml()
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.onload = () => w.print()
  }

  function buildReportHtml() {
    const byStage: Record<string, Projeto[]> = {}
    for (const s of PIPELINE_STAGES) byStage[s] = []
    for (const p of projetos) {
      const etapa = ETAPA_TO_LABEL[p.etapa_atual ?? ''] ?? p.etapa_atual ?? 'Atendimento'
      const stage = PIPELINE_STAGES.find(s => s === etapa) ?? PIPELINE_STAGES[0]
      byStage[stage].push(p)
    }
    const today = new Date().toLocaleDateString('pt-BR')
    let rows = ''
    for (const stage of PIPELINE_STAGES) {
      for (const p of byStage[stage]) {
        const cliente = p.cliente_id ? (clienteMap[p.cliente_id] ?? '—') : '—'
        const tempo = etapaTempoMap[p.id]
        const dias = tempo ? (diasDesde(tempo.iniciado_em) ?? '—') : '—'
        const sub = subtarefasPendMap[p.id] ?? 0
        rows += `<tr><td>${stage}</td><td><b>${p.nome}</b></td><td>${cliente}</td><td>${TIPO_LABEL[p.tipo ?? ''] ?? '—'}</td><td>${dias}d</td><td>${sub}</td></tr>`
      }
    }
    return `<!DOCTYPE html><html><head><title>Relatório de Projetos</title><style>
      body{font-family:sans-serif;font-size:12px;padding:24px;color:#222}
      h1{font-size:18px;margin-bottom:4px}p{color:#666;margin-bottom:16px;font-size:11px}
      table{width:100%;border-collapse:collapse}
      th{text-align:left;border-bottom:2px solid #007AFF;padding:6px 8px;font-size:10px;color:#007AFF;text-transform:uppercase;letter-spacing:.06em}
      td{padding:6px 8px;border-bottom:1px solid #eee;font-size:11px}
      tr:hover td{background:#f9f9fb}
      @media print{button{display:none}}
    </style></head><body>
    <h1>Relatório de Projetos</h1>
    <p>Gerado em ${today} · ${projetos.length} projeto(s) · ${escritorio?.nome ?? ''}</p>
    <table><thead><tr><th>Etapa</th><th>Projeto</th><th>Cliente</th><th>Tipo</th><th>Dias na Etapa</th><th>Tarefas Pend.</th></tr></thead>
    <tbody>${rows}</tbody></table>
    </body></html>`
  }

  // Build kanban projetos list
  const kanbanProjetos: KanbanProjeto[] = projetos.map(p => ({
    id: p.id,
    nome: p.nome,
    tipo: p.tipo,
    etapa_atual: p.etapa_atual,
    status: p.status,
    cover_url: p.cover_url,
    cliente_nome: p.cliente_id ? (clienteMap[p.cliente_id] ?? null) : null,
    iniciado_em: etapaTempoMap[p.id]?.iniciado_em ?? null,
    subtarefas_pendentes: subtarefasPendMap[p.id] ?? 0,
  }))

  // Filter for list view
  const projetosFiltrados = projetos.filter(p => {
    if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false
    if (filtroTipo !== 'todos' && (p.tipo ?? '') !== filtroTipo) return false
    if (filtroBusca) {
      const q = filtroBusca.toLowerCase()
      const nomeCliente = p.cliente_id ? (clienteMap[p.cliente_id] ?? '') : ''
      if (!p.nome.toLowerCase().includes(q) && !nomeCliente.toLowerCase().includes(q)) return false
    }
    return true
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ width: 24, height: 24, border: '2px solid #007AFF', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '28px 32px' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .proj-card{border-radius:12px;overflow:hidden;border:1px solid rgba(0,0,0,0.08);background:var(--bg-card);cursor:pointer;transition:border-color 0.25s,box-shadow 0.25s;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
        .proj-card:hover{border-color:rgba(0,122,255,0.3);box-shadow:0 4px 16px rgba(0,0,0,0.1)}
        .proj-card-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.45s ease}
        .proj-card:hover .proj-card-img{transform:scale(1.06)}
        .cover-edit-btn{opacity:0;pointer-events:none;transition:opacity 0.18s}
        .proj-card:hover .cover-edit-btn{opacity:1;pointer-events:auto}
        .kanban-card:hover{border-color:rgba(0,122,255,0.3)!important;box-shadow:0 2px 8px rgba(0,0,0,0.1)!important;}
      `}</style>

      {/* ─── Header ─── */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 4 }}>PIPELINE</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
            Projetos{' '}
            {projetos.length > 0 && (
              <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-3)' }}>({projetos.length})</span>
            )}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View toggle */}
          {escritorio && projetos.length > 0 && (
            <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {(['lista', 'kanban'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                    background: viewMode === mode ? 'var(--accent)' : 'transparent',
                    color: viewMode === mode ? '#fff' : 'var(--text-3)',
                    border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {mode === 'lista' ? <List size={13} /> : <LayoutGrid size={13} />}
                  {mode === 'lista' ? 'Lista' : 'Kanban'}
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          {projetos.length > 0 && (
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
              <input
                value={filtroBusca}
                onChange={e => setFiltroBusca(e.target.value)}
                placeholder="Buscar projeto..."
                style={{
                  paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                  border: '1px solid var(--border)', borderRadius: 8, fontSize: 12,
                  background: 'var(--bg-card)', color: 'var(--text)', outline: 'none', width: 160,
                }}
              />
            </div>
          )}

          {/* Filters toggle */}
          {projetos.length > 0 && (
            <button
              onClick={() => setShowFilters(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                background: showFilters ? 'var(--accent-soft)' : 'var(--bg-card)',
                color: showFilters ? 'var(--accent)' : 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 12,
              }}
            >
              <Filter size={12} />
              Filtros
            </button>
          )}

          {/* Export */}
          {viewMode === 'kanban' && projetos.length > 0 && (
            <button
              onClick={openExportReport}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                background: 'var(--bg-card)', color: 'var(--text-2)',
                border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 12,
              }}
            >
              <Download size={12} /> Exportar
            </button>
          )}

          {/* Novo projeto */}
          {escritorio && (
            perfilCompleto ? (
              <button
                onClick={() => { setModalOpen(true); setFormError(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--btn-bg)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus size={14} /> Novo Projeto
              </button>
            ) : (
              <Link href="/arquiteto/perfil" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                <AlertCircle size={14} /> Completar perfil
              </Link>
            )
          )}
        </div>
      </div>

      {/* ─── Filters bar ─── */}
      {showFilters && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Status</label>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', fontSize: 12 }}>
              <option value="todos">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Tipo</label>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', fontSize: 12 }}>
              <option value="todos">Todos</option>
              <option value="residencial">Residencial</option>
              <option value="comercial">Comercial</option>
              <option value="institucional">Institucional</option>
            </select>
          </div>
          {(filtroStatus !== 'todos' || filtroTipo !== 'todos') && (
            <button
              onClick={() => { setFiltroStatus('todos'); setFiltroTipo('todos') }}
              style={{ alignSelf: 'flex-end', padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'none', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer' }}
            >
              Limpar
            </button>
          )}
        </div>
      )}

      {!escritorio ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 20px', textAlign: 'center' }}>
          <FolderOpen size={40} color="#8e8e93" style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 6 }}>Configure seu perfil antes de criar projetos.</p>
          <Link href="/arquiteto/perfil" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>Ir para Meu Perfil →</Link>
        </div>
      ) : !perfilCompleto ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 14, padding: '40px 20px', textAlign: 'center', marginBottom: 20 }}>
          <AlertCircle size={32} color="#f97316" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 6 }}>Preencha o nome do escritório no perfil para criar projetos.</p>
          <Link href="/arquiteto/perfil" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>Completar perfil →</Link>
        </div>
      ) : projetos.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 20px', textAlign: 'center' }}>
          <FolderOpen size={40} color="#8e8e93" style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 14 }}>Nenhum projeto ainda.</p>
          <button
            onClick={() => { setModalOpen(true); setFormError(null) }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, cursor: 'pointer', background: 'var(--btn-bg)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600 }}
          >
            <Plus size={14} /> Criar primeiro projeto
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          projetos={kanbanProjetos}
          onMove={handleKanbanMove}
          filtroBusca={filtroBusca}
          filtroStatus={filtroStatus !== 'todos' ? filtroStatus : undefined}
          filtroTipo={filtroTipo !== 'todos' ? filtroTipo : undefined}
        />
      ) : (
        <>
          {projetosFiltrados.length === 0 && (filtroBusca || filtroStatus !== 'todos' || filtroTipo !== 'todos') && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
              Nenhum projeto encontrado com os filtros aplicados.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projetosFiltrados.map((proj) => {
              const etapaLabel = ETAPA_TO_LABEL[proj.etapa_atual ?? ''] ?? proj.etapa_atual ?? 'Atendimento'
              const stageIdx = PIPELINE_STAGES.findIndex(s => s === etapaLabel)
              const progress = Math.round(((Math.max(0, stageIdx) + 1) / PIPELINE_STAGES.length) * 100)
              const tipoLabel = TIPO_LABEL[proj.tipo ?? ''] ?? proj.tipo ?? 'Residencial'
              const hasCover = !!proj.cover_url
              const diasNaEtapa = diasDesde(etapaTempoMap[proj.id]?.iniciado_em)
              const subPend = subtarefasPendMap[proj.id] ?? 0
              const clienteNome = proj.cliente_id ? (clienteMap[proj.cliente_id] ?? null) : null

              return (
                <div key={proj.id} className="proj-card" onClick={() => router.push(`/arquiteto/projetos/${proj.id}`)}>
                  <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: 'linear-gradient(135deg, #e8e8f0 0%, #d4d4dc 100%)' }}>
                    {hasCover && <img src={proj.cover_url!} alt={proj.nome} className="proj-card-img" />}
                    {hasCover && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />}
                    {!hasCover && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, pointerEvents: 'none' }}>
                        <FolderOpen size={26} color="#c7c7cc" />
                        <span style={{ fontSize: 11, color: '#aeaeb2', fontWeight: 500 }}>Sem capa</span>
                      </div>
                    )}
                    <CoverUploadButton
                      projectId={proj.id}
                      hasCover={hasCover}
                      onUpdate={(url) => handleCoverUpdate(proj.id, url)}
                      btnClassName={hasCover ? 'cover-edit-btn' : undefined}
                    />
                    <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.92)', color: 'var(--accent)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,122,255,0.3)' }}>
                      {etapaLabel}
                    </div>
                    {diasNaEtapa !== null && (
                      <div style={{
                        position: 'absolute', top: 10, left: 10, fontSize: 9.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                        background: diasNaEtapa <= 7 ? 'rgba(16,185,129,0.9)' : diasNaEtapa <= 14 ? 'rgba(245,158,11,0.9)' : 'rgba(239,68,68,0.9)',
                        color: '#fff', backdropFilter: 'blur(4px)',
                      }}>
                        {diasNaEtapa}d
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: hasCover ? '#fff' : '#1a1a1a', lineHeight: 1.25, textShadow: hasCover ? '0 1px 6px rgba(0,0,0,0.6)' : 'none' }}>
                        {proj.nome}
                      </div>
                      {clienteNome && <div style={{ fontSize: 11, color: hasCover ? 'rgba(255,255,255,0.7)' : '#6b6b6b', marginTop: 2 }}>{clienteNome}</div>}
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: hasCover ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, rgba(0,122,255,0.6) 0%, #007AFF 100%)' }} />
                    </div>
                  </div>
                  <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)' }}>{tipoLabel}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
                        {new Date(proj.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {subPend > 0 && <span style={{ marginLeft: 8, color: '#f59e0b' }}>· {subPend} tarefa{subPend !== 1 ? 's' : ''} pend.</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {(projetoMembrosMap[proj.id] ?? []).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {(projetoMembrosMap[proj.id] ?? []).slice(0, 3).map((m, idx) => {
                            const ini = m.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                            return (
                              <div key={idx} title={m.nome} style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-soft)', border: '1.5px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: 'var(--accent)', marginLeft: idx > 0 ? -6 : 0, flexShrink: 0 }}>
                                {ini}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <ArrowRight size={12} color="var(--accent)" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Modal: Novo Projeto ── */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
              <X size={18} />
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Novo Projeto</h2>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>Adicione um novo projeto ao seu pipeline</p>
            <form onSubmit={handleCriarProjeto} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.04em' }}>Nome do projeto *</label>
                <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Residência Costa" required
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', borderRadius: 10 }}
                  onFocus={e => (e.target.style.borderColor = '#007AFF')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.04em' }}>Tipo</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['residencial', 'comercial', 'institucional'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(p => ({ ...p, tipo: t }))} style={{
                      flex: 1, padding: '9px 4px', fontSize: 12, fontWeight: 400, borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                      background: form.tipo === t ? 'rgba(0,122,255,0.1)' : '#f2f2f7',
                      border: `1px solid ${form.tipo === t ? '#007AFF' : 'rgba(0,0,0,0.08)'}`,
                      color: form.tipo === t ? '#007AFF' : '#6b6b6b', textTransform: 'capitalize',
                    }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.04em' }}>Descrição (opcional)</label>
                <textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Breve descrição do projeto..." rows={3}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', borderRadius: 10, resize: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#007AFF')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
              {formError && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>
                  {formError}
                </div>
              )}
              <button type="submit" disabled={saving || !form.nome.trim()} style={{
                width: '100%', padding: '12px', background: saving || !form.nome.trim() ? 'rgba(0,122,255,0.4)' : '#007AFF',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: saving || !form.nome.trim() ? 'not-allowed' : 'pointer', marginTop: 4,
              }}>
                {saving ? 'Criando...' : 'Criar Projeto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
