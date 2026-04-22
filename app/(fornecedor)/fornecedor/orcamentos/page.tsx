'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Send, CheckCircle2, Upload, Loader2, FileText, Download, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrcStatus = 'pendente' | 'em_analise' | 'respondido' | 'aprovado' | 'recusado' | 'agendado' | 'em_execucao' | 'concluido'

interface Orcamento {
  id: string
  projeto_id: string | null
  arquiteto_id: string | null
  mensagem: string | null
  arquivo_url: string | null
  arquivo_nome: string | null
  status: OrcStatus
  resposta: string | null
  resposta_arquivo_url: string | null
  created_at: string
  projeto_nome: string | null
  arquiteto_nome: string | null
  arquiteto_email: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const PIPELINE: OrcStatus[] = ['pendente', 'em_analise', 'respondido', 'aprovado', 'agendado', 'em_execucao', 'concluido']

const FILTERS: Array<OrcStatus | 'todos'> = ['todos', 'pendente', 'em_analise', 'respondido', 'aprovado', 'agendado', 'em_execucao', 'concluido', 'recusado']

function pipelineStep(status: OrcStatus): number {
  const idx = PIPELINE.indexOf(status)
  return idx === -1 ? 0 : idx
}

function nextStepLabel(status: OrcStatus): string | null {
  switch (status) {
    case 'pendente':    return 'Iniciar análise'
    case 'aprovado':    return 'Agendar'
    case 'agendado':    return 'Iniciar execução'
    case 'em_execucao': return 'Concluir'
    default: return null
  }
}

function nextStatus(status: OrcStatus): OrcStatus | null {
  switch (status) {
    case 'pendente':    return 'em_analise'
    case 'aprovado':    return 'agendado'
    case 'agendado':    return 'em_execucao'
    case 'em_execucao': return 'concluido'
    default: return null
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FornecedorOrcamentosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [fornecedorId, setFornecedorId] = useState<string | null>(null)

  const [filter, setFilter] = useState<OrcStatus | 'todos'>('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyTarget, setReplyTarget] = useState<Orcamento | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyFile, setReplyFile] = useState<File | null>(null)
  const [replySending, setReplySending] = useState(false)
  const [replySent, setReplySent] = useState(false)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const replyFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: forn } = await supabase
        .from('fornecedores').select('id').eq('user_id', user.id).single()
      if (!forn) { setLoading(false); return }

      setFornecedorId(forn.id)

      const { data: rows } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('fornecedor_id', forn.id)
        .order('created_at', { ascending: false })

      if (!rows || rows.length === 0) { setLoading(false); return }

      const projetoIds = Array.from(new Set(rows.map((r: Record<string, unknown>) => r.projeto_id as string).filter(Boolean)))
      const arquitetoIds = Array.from(new Set(rows.map((r: Record<string, unknown>) => r.arquiteto_id as string).filter(Boolean)))

      const [{ data: projetos }, { data: arquitetos }] = await Promise.all([
        projetoIds.length > 0
          ? supabase.from('projetos').select('id, nome').in('id', projetoIds)
          : Promise.resolve({ data: [] }),
        arquitetoIds.length > 0
          ? supabase.from('users').select('id, nome, email').in('id', arquitetoIds)
          : Promise.resolve({ data: [] }),
      ])

      const projMap: Record<string, string> = {}
      for (const p of (projetos ?? [])) projMap[(p as { id: string; nome: string }).id] = (p as { id: string; nome: string }).nome

      const arquMap: Record<string, { nome: string; email: string }> = {}
      for (const a of (arquitetos ?? [])) {
        const rec = a as { id: string; nome: string; email: string }
        arquMap[rec.id] = { nome: rec.nome, email: rec.email }
      }

      setOrcamentos(rows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        projeto_id: r.projeto_id as string | null,
        arquiteto_id: r.arquiteto_id as string | null,
        mensagem: r.mensagem as string | null,
        arquivo_url: r.arquivo_url as string | null,
        arquivo_nome: r.arquivo_nome as string | null,
        status: (r.status as OrcStatus) ?? 'pendente',
        resposta: r.resposta as string | null,
        resposta_arquivo_url: r.resposta_arquivo_url as string | null,
        created_at: r.created_at as string,
        projeto_nome: r.projeto_id ? (projMap[r.projeto_id as string] ?? null) : null,
        arquiteto_nome: r.arquiteto_id ? (arquMap[r.arquiteto_id as string]?.nome ?? null) : null,
        arquiteto_email: r.arquiteto_id ? (arquMap[r.arquiteto_id as string]?.email ?? null) : null,
      })))

      setLoading(false)
    }
    load()
  }, [])

  async function advanceStage(orc: Orcamento) {
    const next = nextStatus(orc.status)
    if (!next) return
    setAdvancing(orc.id)
    const supabase = createClient()
    const { error } = await supabase.from('orcamentos').update({ status: next }).eq('id', orc.id)
    if (!error) {
      setOrcamentos(prev => prev.map(o => o.id === orc.id ? { ...o, status: next } : o))
    }
    setAdvancing(null)
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyTarget || !fornecedorId) return
    setReplySending(true)

    const supabase = createClient()
    let respostaArquivoUrl: string | null = null

    if (replyFile) {
      const safeName = replyFile.name.replace(/[^a-zA-Z0-9._\-]/g, '_')
      const path = `${fornecedorId}/${replyTarget.id}/${Date.now()}_${safeName}`
      const { error: upErr } = await supabase.storage.from('orcamentos').upload(path, replyFile)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('orcamentos').getPublicUrl(path)
        respostaArquivoUrl = publicUrl
      }
    }

    const { error } = await supabase.from('orcamentos')
      .update({ resposta: replyText.trim(), resposta_arquivo_url: respostaArquivoUrl, status: 'respondido' })
      .eq('id', replyTarget.id)

    if (!error) {
      setOrcamentos(prev => prev.map(o =>
        o.id === replyTarget.id
          ? { ...o, resposta: replyText.trim(), resposta_arquivo_url: respostaArquivoUrl, status: 'respondido' }
          : o
      ))
    }

    setReplySending(false)
    setReplySent(true)
    setTimeout(() => {
      setReplyTarget(null)
      setReplySent(false)
      setReplyText('')
      setReplyFile(null)
    }, 2200)
  }

  const filtered = filter === 'todos' ? orcamentos : orcamentos.filter(o => o.status === filter)
  const countByStatus = (s: OrcStatus) => orcamentos.filter(o => o.status === s).length

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
        .orc-card { background:#fff; border:1px solid rgba(0,0,0,0.08); border-radius:14px; overflow:hidden; transition:box-shadow 0.18s; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
        .orc-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .orc-filter-btn { padding:6px 14px; border-radius:20px; font-size:11.5px; font-weight:600; cursor:pointer; transition:all 0.15s; }
        .orc-inp { width:100%; background:#f2f2f7; border:1px solid rgba(0,0,0,0.1); border-radius:10px; padding:10px 14px; color:#1a1a1a; font-size:13px; outline:none; transition:border-color 0.15s; box-sizing:border-box; font-family:inherit; resize:vertical; }
        .orc-inp:focus { border-color:#007AFF; }
        .orc-inp::placeholder { color:#8e8e93; }
        @keyframes orc-in { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .orc-modal-box { animation:orc-in 0.2s ease; }
        .orc-adv-btn:hover { opacity:0.85; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Orçamentos</h1>
        <p style={{ fontSize: 13, color: '#6b6b6b', margin: '5px 0 0' }}>
          Gerencie todas as solicitações recebidas · {orcamentos.length} total
        </p>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 22, flexWrap: 'wrap' as const }}>
        {FILTERS.map(f => {
          const count = f !== 'todos' ? countByStatus(f as OrcStatus) : orcamentos.length
          if (f !== 'todos' && count === 0) return null
          const isActive = filter === f
          const meta = f !== 'todos' ? STATUS_META[f as OrcStatus] : null
          return (
            <button key={f} onClick={() => setFilter(f)} className="orc-filter-btn"
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
          {orcamentos.length === 0 ? 'Nenhuma solicitação recebida ainda.' : 'Nenhuma solicitação com esse status.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(orc => {
            const meta = STATUS_META[orc.status]
            const isExpanded = expandedId === orc.id
            const step = pipelineStep(orc.status)
            const canReply = orc.status === 'em_analise'
            const advLabel = nextStepLabel(orc.status)
            const isAdvancing = advancing === orc.id
            const initials = (orc.arquiteto_nome ?? 'A').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
            const dateStr = new Date(orc.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

            return (
              <div key={orc.id} className="orc-card">
                <div style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#007AFF', flexShrink: 0 }}>
                    {initials}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div onClick={() => router.push(`/fornecedor/orcamentos/${orc.id}`)}
                          style={{ fontSize: 14.5, fontWeight: 700, color: '#1a1a1a', cursor: 'pointer' }}>
                          {orc.projeto_nome ?? 'Projeto sem nome'}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 3 }}>
                          {orc.arquiteto_nome ?? 'Arquiteto'} · {dateStr}
                        </div>
                      </div>
                      <div style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 20, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color, fontWeight: 700, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                        {meta.label}
                      </div>
                    </div>

                    {/* Pipeline progress (only non-terminal statuses) */}
                    {orc.status !== 'recusado' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
                        {PIPELINE.map((s, i) => {
                          const done = i <= step
                          const sm = STATUS_META[s]
                          return (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div title={sm.label} style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: done ? meta.color : 'rgba(0,0,0,0.12)',
                                opacity: i === step ? 1 : done ? 0.6 : 0.3,
                                transition: 'all 0.2s',
                              }} />
                              {i < PIPELINE.length - 1 && (
                                <div style={{ width: 18, height: 1.5, background: done && i < step ? meta.color : 'rgba(0,0,0,0.1)', opacity: done && i < step ? 0.5 : 1, borderRadius: 2 }} />
                              )}
                            </div>
                          )
                        })}
                        <span style={{ fontSize: 10, color: meta.color, fontWeight: 600, marginLeft: 6 }}>
                          etapa {step + 1}/{PIPELINE.length}
                        </span>
                      </div>
                    )}

                    {orc.mensagem && (
                      <p style={{ fontSize: 13, color: '#6b6b6b', marginTop: 8, lineHeight: 1.55, margin: '8px 0 0' }}>
                        {orc.mensagem.length > 120 ? orc.mensagem.slice(0, 120) + '…' : orc.mensagem}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' as const }}>
                      <button onClick={() => router.push(`/fornecedor/orcamentos/${orc.id}`)}
                        style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF', cursor: 'pointer', fontWeight: 600 }}>
                        Abrir →
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : orc.id)}
                        style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.1)', color: '#6b6b6b', cursor: 'pointer', fontWeight: 600 }}>
                        {isExpanded ? 'Menos' : 'Resumo'}
                      </button>

                      {canReply && (
                        <button onClick={() => { setReplyTarget(orc); setReplyText(''); setReplyFile(null); setReplySent(false) }}
                          style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF', cursor: 'pointer', fontWeight: 600 }}>
                          Enviar proposta
                        </button>
                      )}

                      {advLabel && (
                        <button onClick={() => advanceStage(orc)} disabled={isAdvancing} className="orc-adv-btn"
                          style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 8, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color, cursor: isAdvancing ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {isAdvancing
                            ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                            : <ChevronRight size={11} />}
                          {advLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '14px 20px', background: '#f9f9fb' }}>
                    {orc.mensagem && (
                      <>
                        <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Mensagem do arquiteto</div>
                        <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.65, margin: '0 0 12px' }}>{orc.mensagem}</p>
                      </>
                    )}
                    {orc.arquivo_url && (
                      <a href={orc.arquivo_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#007AFF', background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.18)', borderRadius: 7, padding: '5px 11px', textDecoration: 'none', fontWeight: 600, marginBottom: 12 }}>
                        <FileText size={12} /> {orc.arquivo_nome ?? 'Arquivo anexado'} <Download size={11} />
                      </a>
                    )}
                    {orc.resposta && (
                      <>
                        <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Sua proposta</div>
                        <p style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.65, margin: '0 0 8px', background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.12)', borderRadius: 8, padding: '10px 13px' }}>{orc.resposta}</p>
                        {orc.resposta_arquivo_url && (
                          <a href={orc.resposta_arquivo_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#007AFF', background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.18)', borderRadius: 7, padding: '5px 11px', textDecoration: 'none', fontWeight: 600 }}>
                            <FileText size={12} /> Seu arquivo <Download size={11} />
                          </a>
                        )}
                      </>
                    )}
                    {orc.arquiteto_email && (
                      <div style={{ marginTop: 10, fontSize: 11.5, color: '#8e8e93' }}>
                        Email: <span style={{ color: '#1a1a1a' }}>{orc.arquiteto_email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget !== null && (
        <div onClick={e => { if (e.target === e.currentTarget) setReplyTarget(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="orc-modal-box"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            {replySent ? (
              <div style={{ textAlign: 'center' as const, padding: '22px 0' }}>
                <CheckCircle2 size={52} color="#34d399" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 19, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Proposta enviada!</div>
                <div style={{ fontSize: 13, color: '#6b6b6b' }}>{replyTarget.arquiteto_nome ?? 'O arquiteto'} será notificado.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Enviar Proposta</div>
                    <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 3 }}>
                      {replyTarget.projeto_nome ?? 'Projeto'} · {replyTarget.arquiteto_nome ?? 'Arquiteto'}
                    </div>
                  </div>
                  <button onClick={() => setReplyTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>

                <input ref={replyFileRef} type="file" style={{ display: 'none' }} onChange={e => setReplyFile(e.target.files?.[0] ?? null)} />

                <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Sua proposta *</label>
                    <textarea className="orc-inp" required rows={5}
                      placeholder="Descreva sua proposta, prazo, condições e detalhes técnicos..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Anexar arquivo (opcional)</label>
                    <div onClick={() => replyFileRef.current?.click()}
                      style={{ padding: '9px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 7, fontSize: 12, color: replyFile ? '#1a1a1a' : '#8e8e93', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Upload size={13} color="#8e8e93" />
                      {replyFile ? replyFile.name : 'Clique para selecionar um arquivo'}
                      {replyFile && <X size={13} color="#8e8e93" style={{ marginLeft: 'auto' }} onClick={ev => { ev.stopPropagation(); setReplyFile(null) }} />}
                    </div>
                  </div>
                  <button type="submit" disabled={replySending}
                    style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: replySending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: replySending ? 0.7 : 1 }}>
                    {replySending ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : <><Send size={14} /> Enviar Proposta</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
