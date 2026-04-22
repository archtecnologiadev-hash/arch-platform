'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, Download, Send, Upload, X,
  CheckCircle2, Loader2, ChevronRight, ChevronLeft, Clock, AlertCircle, Building2
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrcStatus = 'pendente' | 'em_analise' | 'respondido' | 'aprovado' | 'recusado' | 'agendado' | 'em_execucao' | 'concluido'

interface OrcDetail {
  id: string
  projeto_id: string | null
  arquiteto_id: string | null
  fornecedor_id: string | null
  mensagem: string | null
  arquivo_url: string | null
  arquivo_nome: string | null
  status: OrcStatus
  resposta: string | null
  resposta_arquivo_url: string | null
  created_at: string
  updated_at: string | null
  projeto_nome: string | null
  escritorio_nome: string | null
  arquiteto_nome: string | null
  arquiteto_email: string | null
}

interface HistItem {
  id: string
  etapa_anterior: string | null
  etapa_nova: string
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE: Array<{ key: OrcStatus; label: string; short: string }> = [
  { key: 'pendente',    label: 'Aguardando análise', short: 'Aguardando' },
  { key: 'em_analise',  label: 'Em orçamento',        short: 'Em análise' },
  { key: 'respondido',  label: 'Orçamento enviado',   short: 'Enviado' },
  { key: 'aprovado',    label: 'Aprovado',             short: 'Aprovado' },
  { key: 'agendado',    label: 'Agendado',             short: 'Agendado' },
  { key: 'em_execucao', label: 'Em execução',          short: 'Execução' },
  { key: 'concluido',   label: 'Concluído',            short: 'Concluído' },
]

const LABEL: Record<string, string> = Object.fromEntries(PIPELINE.map(p => [p.key, p.label]))

const STATUS_COLOR: Record<OrcStatus, string> = {
  pendente:    '#007AFF',
  em_analise:  '#8b5cf6',
  respondido:  '#f59e0b',
  aprovado:    '#34d399',
  recusado:    '#ef4444',
  agendado:    '#06b6d4',
  em_execucao: '#f97316',
  concluido:   '#10b981',
}

function nextFor(s: OrcStatus): OrcStatus | null {
  const idx = PIPELINE.findIndex(p => p.key === s)
  return idx !== -1 && idx < PIPELINE.length - 1 ? PIPELINE[idx + 1].key : null
}

function prevFor(s: OrcStatus): OrcStatus | null {
  const idx = PIPELINE.findIndex(p => p.key === s)
  return idx > 0 ? PIPELINE[idx - 1].key : null
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrcamentoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [orc, setOrc] = useState<OrcDetail | null>(null)
  const [historico, setHistorico] = useState<HistItem[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [moving, setMoving] = useState<'fwd' | 'bck' | null>(null)

  const [replyText, setReplyText] = useState('')
  const [replyFile, setReplyFile] = useState<File | null>(null)
  const [replySending, setReplySending] = useState(false)
  const [replySent, setReplySent] = useState(false)
  const replyFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const [{ data: row }, { data: hist }] = await Promise.all([
        supabase.from('orcamentos').select('*').eq('id', id).single(),
        supabase.from('orcamento_historico')
          .select('id, etapa_anterior, etapa_nova, created_at')
          .eq('orcamento_id', id)
          .order('created_at', { ascending: true }),
      ])

      if (!row) { setLoading(false); return }

      if (hist) setHistorico(hist as HistItem[])

      // Parallel: projeto + arquiteto
      const [{ data: proj }, { data: arq }] = await Promise.all([
        row.projeto_id
          ? supabase.from('projetos').select('nome, escritorio_id').eq('id', row.projeto_id).single()
          : Promise.resolve({ data: null }),
        row.arquiteto_id
          ? supabase.from('users').select('nome, email').eq('id', row.arquiteto_id).single()
          : Promise.resolve({ data: null }),
      ])

      // Escritório via projeto.escritorio_id
      let escritorio_nome: string | null = null
      if ((proj as { nome: string; escritorio_id: string } | null)?.escritorio_id) {
        const { data: esc } = await supabase
          .from('escritorios')
          .select('nome')
          .eq('id', (proj as { nome: string; escritorio_id: string }).escritorio_id)
          .single()
        escritorio_nome = (esc as { nome: string } | null)?.nome ?? null
      }

      setOrc({
        ...row,
        projeto_nome: (proj as { nome: string } | null)?.nome ?? null,
        escritorio_nome,
        arquiteto_nome: (arq as { nome: string; email: string } | null)?.nome ?? null,
        arquiteto_email: (arq as { nome: string; email: string } | null)?.email ?? null,
      })
      setLoading(false)
    }
    load()
  }, [id])

  async function moveStage(dir: 'fwd' | 'bck') {
    if (!orc || !currentUserId) return
    const targetStatus = dir === 'fwd' ? nextFor(orc.status) : prevFor(orc.status)
    if (!targetStatus) return

    setMoving(dir)
    const supabase = createClient()
    const now = new Date().toISOString()
    const prev = orc.status

    const { error } = await supabase
      .from('orcamentos')
      .update({ status: targetStatus, updated_at: now })
      .eq('id', orc.id)

    if (!error) {
      // Insert history entry
      const { data: newHist } = await supabase
        .from('orcamento_historico')
        .insert({
          orcamento_id: orc.id,
          etapa_anterior: prev,
          etapa_nova: targetStatus,
          usuario_id: currentUserId,
        })
        .select('id, etapa_anterior, etapa_nova, created_at')
        .single()

      setOrc(o => o ? { ...o, status: targetStatus, updated_at: now } : o)
      if (newHist) setHistorico(h => [...h, newHist as HistItem])
    }
    setMoving(null)
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!orc) return
    setReplySending(true)
    const supabase = createClient()

    let respostaArquivoUrl: string | null = null
    if (replyFile && orc.fornecedor_id) {
      const safeName = replyFile.name.replace(/[^a-zA-Z0-9._\-]/g, '_')
      const path = `${orc.fornecedor_id}/${orc.id}/${Date.now()}_${safeName}`
      const { error: upErr } = await supabase.storage.from('orcamentos').upload(path, replyFile)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('orcamentos').getPublicUrl(path)
        respostaArquivoUrl = publicUrl
      }
    }

    const now = new Date().toISOString()
    const prev = orc.status
    const { error } = await supabase.from('orcamentos')
      .update({ resposta: replyText.trim(), resposta_arquivo_url: respostaArquivoUrl, status: 'respondido', updated_at: now })
      .eq('id', orc.id)

    if (!error && currentUserId) {
      const { data: newHist } = await supabase
        .from('orcamento_historico')
        .insert({
          orcamento_id: orc.id,
          etapa_anterior: prev,
          etapa_nova: 'respondido',
          usuario_id: currentUserId,
        })
        .select('id, etapa_anterior, etapa_nova, created_at')
        .single()

      setOrc(o => o ? { ...o, resposta: replyText.trim(), resposta_arquivo_url: respostaArquivoUrl, status: 'respondido', updated_at: now } : o)
      if (newHist) setHistorico(h => [...h, newHist as HistItem])
    }
    setReplySending(false)
    setReplySent(true)
    setReplyText('')
    setReplyFile(null)
  }

  // ─── Loading / not found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f2f7' }}>
        <Loader2 size={26} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!orc) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f2f7', flexDirection: 'column', gap: 12 }}>
        <AlertCircle size={32} color="#c7c7cc" />
        <div style={{ fontSize: 14, color: '#6b6b6b' }}>Orçamento não encontrado.</div>
        <button onClick={() => router.push('/fornecedor/orcamentos')}
          style={{ fontSize: 12.5, color: '#007AFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Voltar para orçamentos
        </button>
      </div>
    )
  }

  const currentStep = PIPELINE.findIndex(p => p.key === orc.status)
  const isRecusado = orc.status === 'recusado'
  const activeColor = isRecusado ? '#ef4444' : STATUS_COLOR[orc.status]
  const canAdvance = !isRecusado && nextFor(orc.status) !== null
  const canRetreat = !isRecusado && prevFor(orc.status) !== null
  const canReply = orc.status === 'em_analise'

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .od-inp { width:100%; background:#f2f2f7; border:1px solid rgba(0,0,0,0.1); border-radius:10px; padding:10px 14px; color:#1a1a1a; font-size:13px; outline:none; transition:border-color 0.15s; box-sizing:border-box; font-family:inherit; resize:vertical; }
        .od-inp:focus { border-color:#007AFF; }
        .od-btn-fwd:hover:not(:disabled) { opacity:0.87; transform:translateY(-1px); }
        .od-btn-bck:hover:not(:disabled) { background:rgba(0,0,0,0.06) !important; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <button onClick={() => router.push('/fornecedor/orcamentos')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#007AFF', fontSize: 13.5, fontWeight: 600, padding: 0 }}>
          <ArrowLeft size={15} /> Orçamentos
        </button>
        <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.1)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {orc.escritorio_nome && (
            <div style={{ fontSize: 11, color: '#8e8e93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {orc.escritorio_nome}
            </div>
          )}
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {orc.projeto_nome ?? 'Projeto sem nome'}
          </div>
        </div>
        <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${activeColor}14`, border: `1px solid ${activeColor}30`, color: activeColor, fontWeight: 700, flexShrink: 0 }}>
          {isRecusado ? 'Recusado' : (PIPELINE[currentStep]?.label ?? orc.status)}
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>

        {/* Header card */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '22px 24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              {/* Escritório (primary) */}
              {orc.escritorio_nome && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Building2 size={14} color="#8b5cf6" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6' }}>{orc.escritorio_nome}</span>
                </div>
              )}
              {/* Project name */}
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>
                {orc.projeto_nome ?? 'Projeto sem nome'}
              </div>
              <div style={{ fontSize: 13, color: '#6b6b6b', display: 'flex', gap: 14, flexWrap: 'wrap' as const }}>
                {orc.arquiteto_nome && (
                  <span>Arquiteto: <strong style={{ color: '#1a1a1a' }}>{orc.arquiteto_nome}</strong></span>
                )}
                {orc.arquiteto_email && (
                  <span style={{ color: '#8e8e93' }}>{orc.arquiteto_email}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                Recebido em {fmt(orc.created_at)}
              </div>
            </div>

            {/* Stage buttons */}
            {!isRecusado && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {canRetreat && (
                  <button
                    onClick={() => moveStage('bck')}
                    disabled={moving !== null}
                    className="od-btn-bck"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 16px', borderRadius: 10,
                      background: '#f2f2f7', color: '#6b6b6b',
                      border: '1px solid rgba(0,0,0,0.12)',
                      cursor: moving ? 'not-allowed' : 'pointer',
                      fontSize: 13, fontWeight: 600,
                      transition: 'all 0.15s', opacity: moving === 'bck' ? 0.7 : 1,
                    }}>
                    {moving === 'bck'
                      ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      : <ChevronLeft size={13} />}
                    Retroceder
                  </button>
                )}
                {canAdvance && (
                  <button
                    onClick={() => moveStage('fwd')}
                    disabled={moving !== null}
                    className="od-btn-fwd"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 18px', borderRadius: 10,
                      background: '#007AFF', color: '#fff',
                      border: 'none',
                      cursor: moving ? 'not-allowed' : 'pointer',
                      fontSize: 13, fontWeight: 700,
                      transition: 'all 0.15s', opacity: moving === 'fwd' ? 0.7 : 1,
                      boxShadow: '0 2px 8px rgba(0,122,255,0.3)',
                    }}>
                    {moving === 'fwd'
                      ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Avançando...</>
                      : <><ChevronRight size={13} /> Avançar etapa</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        {!isRecusado && (
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '22px 28px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
            <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 20 }}>Progresso</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 580 }}>
              {PIPELINE.map((step, i) => {
                const done = i < currentStep
                const current = i === currentStep
                const color = current ? activeColor : done ? '#34d399' : '#c7c7cc'
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < PIPELINE.length - 1 ? 1 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <div style={{
                        width: current ? 34 : 26, height: current ? 34 : 26,
                        borderRadius: '50%',
                        background: done ? '#34d399' : current ? activeColor : '#f2f2f7',
                        border: `2px solid ${color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.25s',
                        boxShadow: current ? `0 0 0 5px ${activeColor}1a` : 'none',
                      }}>
                        {done
                          ? <CheckCircle2 size={13} color="#fff" />
                          : <div style={{ width: current ? 9 : 7, height: current ? 9 : 7, borderRadius: '50%', background: current ? '#fff' : '#c7c7cc' }} />}
                      </div>
                      <div style={{ fontSize: 9.5, fontWeight: current ? 700 : 500, color: current ? activeColor : done ? '#34d399' : '#8e8e93', textAlign: 'center', maxWidth: 58 }}>
                        {step.short}
                      </div>
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div style={{ flex: 1, height: 2.5, background: done ? '#34d399' : 'rgba(0,0,0,0.07)', margin: '0 3px', marginBottom: 30, borderRadius: 2, transition: 'background 0.3s' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isRecusado && (
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={18} color="#ef4444" />
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#ef4444' }}>Este orçamento foi recusado.</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Message + files */}
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Descrição do Pedido</div>
              {orc.mensagem
                ? <p style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.7, margin: 0 }}>{orc.mensagem}</p>
                : <p style={{ fontSize: 13, color: '#8e8e93', fontStyle: 'italic', margin: 0 }}>Sem descrição.</p>}
              {orc.arquivo_url && (
                <a href={orc.arquivo_url} target="_blank" rel="noopener noreferrer"
                  style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#007AFF', background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.18)', borderRadius: 8, padding: '8px 14px', textDecoration: 'none', fontWeight: 600 }}>
                  <FileText size={13} /> {orc.arquivo_nome ?? 'Arquivo anexado'} <Download size={11} />
                </a>
              )}
            </div>

            {/* Reply area */}
            {orc.resposta ? (
              <div style={{ background: '#fff', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 11, color: '#34d399', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Sua Proposta Enviada</div>
                {replySent && <div style={{ fontSize: 12, color: '#34d399', marginBottom: 10 }}>✓ Proposta atualizada.</div>}
                <p style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 1.7, margin: '0 0 14px' }}>{orc.resposta}</p>
                {orc.resposta_arquivo_url && (
                  <a href={orc.resposta_arquivo_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '8px 14px', textDecoration: 'none', fontWeight: 600 }}>
                    <FileText size={13} /> Arquivo da proposta <Download size={11} />
                  </a>
                )}
              </div>
            ) : canReply ? (
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 14 }}>Enviar Proposta</div>
                {replySent ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0' }}>
                    <CheckCircle2 size={22} color="#34d399" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#34d399' }}>Proposta enviada com sucesso!</span>
                  </div>
                ) : (
                  <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <textarea className="od-inp" required rows={5}
                      placeholder="Descreva sua proposta: prazo, valor, condições, materiais..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)} />
                    <input ref={replyFileRef} type="file" style={{ display: 'none' }}
                      onChange={e => setReplyFile(e.target.files?.[0] ?? null)} />
                    {replyFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.18)', borderRadius: 8 }}>
                        <FileText size={13} color="#007AFF" />
                        <span style={{ flex: 1, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyFile.name}</span>
                        <button type="button" onClick={() => { setReplyFile(null); if (replyFileRef.current) replyFileRef.current.value = '' }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 0 }}>
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => replyFileRef.current?.click()}
                        style={{ padding: '9px', borderRadius: 8, border: '1.5px dashed rgba(0,0,0,0.15)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#8e8e93', fontSize: 12.5 }}>
                        <Upload size={13} /> Anexar PDF ou arquivo
                      </button>
                    )}
                    <button type="submit" disabled={replySending}
                      style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: replySending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: replySending ? 0.7 : 1 }}>
                      {replySending ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : <><Send size={13} /> Enviar Proposta</>}
                    </button>
                  </form>
                )}
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* History */}
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 16 }}>Histórico de movimentos</div>

              {/* Initial event */}
              <div style={{ display: 'flex', gap: 12, paddingBottom: historico.length > 0 ? 16 : 0, position: 'relative' }}>
                {historico.length > 0 && (
                  <div style={{ position: 'absolute', left: 7, top: 16, bottom: 0, width: 1, background: 'rgba(0,0,0,0.07)' }} />
                )}
                <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#e5e5ea', border: '2px solid #d1d1d6', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a1a1a' }}>Solicitação recebida</div>
                  <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>{fmt(orc.created_at)}</div>
                </div>
              </div>

              {historico.map((h, i) => {
                const isLast = i === historico.length - 1
                const fromLabel = h.etapa_anterior ? (LABEL[h.etapa_anterior] ?? h.etapa_anterior) : '—'
                const toLabel = LABEL[h.etapa_nova] ?? h.etapa_nova
                return (
                  <div key={h.id} style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 16, position: 'relative' }}>
                    {!isLast && (
                      <div style={{ position: 'absolute', left: 7, top: 16, bottom: 0, width: 1, background: 'rgba(0,0,0,0.07)' }} />
                    )}
                    <div style={{
                      width: 15, height: 15, borderRadius: '50%',
                      background: isLast ? activeColor : '#e5e5ea',
                      border: `2px solid ${isLast ? activeColor : '#d1d1d6'}`,
                      flexShrink: 0, marginTop: 2,
                    }} />
                    <div>
                      <div style={{ fontSize: 12, color: '#6b6b6b' }}>
                        <span style={{ color: '#8e8e93' }}>{fromLabel}</span>
                        <span style={{ margin: '0 5px', color: '#c7c7cc' }}>→</span>
                        <span style={{ fontWeight: 700, color: isLast ? activeColor : '#1a1a1a' }}>{toLabel}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>{fmt(h.created_at)}</div>
                    </div>
                  </div>
                )
              })}

              {historico.length === 0 && (
                <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 4, fontStyle: 'italic' }}>Nenhum movimento ainda.</div>
              )}
            </div>

            {/* Details */}
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Detalhes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orc.escritorio_nome && (
                  <div>
                    <div style={{ fontSize: 10.5, color: '#8e8e93', marginBottom: 2 }}>Escritório</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{orc.escritorio_nome}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 10.5, color: '#8e8e93', marginBottom: 2 }}>Projeto</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{orc.projeto_nome ?? '—'}</div>
                </div>
                {orc.arquiteto_nome && (
                  <div>
                    <div style={{ fontSize: 10.5, color: '#8e8e93', marginBottom: 2 }}>Arquiteto</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{orc.arquiteto_nome}</div>
                  </div>
                )}
                {orc.arquiteto_email && (
                  <div>
                    <div style={{ fontSize: 10.5, color: '#8e8e93', marginBottom: 2 }}>Email</div>
                    <div style={{ fontSize: 12.5, color: '#007AFF' }}>{orc.arquiteto_email}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 10.5, color: '#8e8e93', marginBottom: 2 }}>Arquivo anexado</div>
                  <div style={{ fontSize: 13, color: orc.arquivo_url ? '#1a1a1a' : '#8e8e93' }}>
                    {orc.arquivo_url ? (orc.arquivo_nome ?? 'Sim') : 'Não'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
