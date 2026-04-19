'use client'

import { useState } from 'react'
import { X, Send, CheckCircle2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type QuoteStatus = 'Pendente' | 'Em análise' | 'Aprovado' | 'Recusado'

interface QuoteRequest {
  id: number
  project: string
  projectImg: string
  arquiteto: string
  avatar: string
  service: string
  date: string
  value: string
  status: QuoteStatus
  details: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_QUOTES: QuoteRequest[] = [
  {
    id: 1,
    project: 'Residência Costa',
    projectImg: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=120&q=80',
    arquiteto: 'Arq. Serafim Figueiredo',
    avatar: 'SF',
    service: 'Armários planejados para cozinha e closet master',
    date: '18 Abr 2026',
    value: 'R$ 18.500',
    status: 'Pendente',
    details:
      'Necessário orçamento para armários da cozinha (linha MDF lacado branco) + closet master em nogueira com espelho. Medidas enviadas por email. Prazo de entrega ideal: 30 dias.',
  },
  {
    id: 2,
    project: 'Cobertura Moderna',
    projectImg: 'https://images.unsplash.com/photo-1560185127-6a35cba96e9a?w=120&q=80',
    arquiteto: 'Arq. Marina Castro',
    avatar: 'MC',
    service: 'Marcenaria completa — sala, quartos e banheiros',
    date: '16 Abr 2026',
    value: 'R$ 45.000',
    status: 'Em análise',
    details:
      'Projeto completo de marcenaria para cobertura 280m². Inclui painel TV com ripado, armários embutidos em 3 quartos, bancadas de banheiro e estante de escritório. MDF lacado branco fosco.',
  },
  {
    id: 3,
    project: 'Escritório Zen',
    projectImg: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=120&q=80',
    arquiteto: 'Arq. Ricardo Leal',
    avatar: 'RL',
    service: 'Bancadas e prateleiras modulares para sala de reunião',
    date: '10 Abr 2026',
    value: 'R$ 12.800',
    status: 'Aprovado',
    details:
      'Bancada corrida 4,2m em laminato amadeirado para sala de reunião, mais estante modular com nichos abertos na recepção. Prazo de entrega: 21 dias. Contrato já assinado.',
  },
  {
    id: 4,
    project: 'Vila Contemporânea',
    projectImg: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=120&q=80',
    arquiteto: 'Arq. Fernanda Lima',
    avatar: 'FL',
    service: 'Closet planejado em carvalho americano com espelhos',
    date: '05 Abr 2026',
    value: 'R$ 22.000',
    status: 'Aprovado',
    details:
      'Closet casal 8m² em carvalho americano com iluminação LED integrada, cabideiro duplo, gaveteiros e painel de espelho na parede fundos. Entregue e instalado com sucesso.',
  },
  {
    id: 5,
    project: 'Residência Jardins',
    projectImg: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=120&q=80',
    arquiteto: 'Arq. Paulo Mendes',
    avatar: 'PM',
    service: 'Cozinha planejada completa com ilha central',
    date: '28 Mar 2026',
    value: 'R$ 38.500',
    status: 'Recusado',
    details:
      'Cozinha com ilha central 2,0x1,2m em laminato carvalho com tampa em porcelanato. Orçamento não aprovado pelo cliente por questões de prazo e custo total do projeto.',
  },
  {
    id: 6,
    project: 'Studio Minimalista',
    projectImg: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&q=80',
    arquiteto: 'Arq. Cláudia Rebelo',
    avatar: 'CR',
    service: 'Móveis multifuncionais para studio 45m²',
    date: '22 Mar 2026',
    value: 'R$ 9.200',
    status: 'Aprovado',
    details:
      'Cama retrátil com sofá integrado, mesa de jantar dobrável e nicho TV com gavetas ocultas. Projeto aprovado, entregue em 18 dias dentro do prazo.',
  },
]

const STATUS_META: Record<QuoteStatus, { color: string; bg: string; border: string }> = {
  Pendente:    { color: '#c8a96e', bg: 'rgba(200,169,110,0.1)', border: 'rgba(200,169,110,0.22)' },
  'Em análise': { color: '#4f9cf9', bg: 'rgba(79,156,249,0.1)', border: 'rgba(79,156,249,0.22)' },
  Aprovado:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.22)' },
  Recusado:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)' },
}

const FILTERS: Array<QuoteStatus | 'Todos'> = [
  'Todos', 'Pendente', 'Em análise', 'Aprovado', 'Recusado',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function FornecedorOrcamentosPage() {
  const [filter, setFilter] = useState<QuoteStatus | 'Todos'>('Todos')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [replyId, setReplyId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySent, setReplySent] = useState(false)

  const filtered =
    filter === 'Todos' ? ALL_QUOTES : ALL_QUOTES.filter((q) => q.status === filter)

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    setReplySent(true)
    setTimeout(() => {
      setReplyId(null)
      setReplySent(false)
      setReplyText('')
    }, 2200)
  }

  const replyQuote = ALL_QUOTES.find((q) => q.id === replyId)

  return (
    <div
      style={{
        padding: '32px 36px',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#d0d0d0',
      }}
    >
      <style>{`
        .orc-card { background: #0e0e0e; border: 1px solid #161616; border-radius: 12px; overflow: hidden; transition: border-color 0.18s; }
        .orc-card:hover { border-color: #222; }
        .orc-filter-btn { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .orc-inp { width: 100%; background: #111; border: 1px solid #222; border-radius: 8px; padding: 10px 14px; color: #d0d0d0; font-size: 13px; outline: none; transition: border-color 0.15s; color-scheme: dark; box-sizing: border-box; font-family: inherit; resize: vertical; }
        .orc-inp:focus { border-color: rgba(200,169,110,0.45); }
        @keyframes orc-modal-in { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .orc-modal-box { animation: orc-modal-in 0.2s ease; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f0', margin: 0 }}>Orçamentos</h1>
        <p style={{ fontSize: 13, color: '#444', margin: '5px 0 0' }}>
          Gerencie todas as solicitações recebidas
        </p>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' as const }}>
        {FILTERS.map((f) => {
          const isActive = filter === f
          const meta = f !== 'Todos' ? STATUS_META[f] : null
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="orc-filter-btn"
              style={{
                background: isActive
                  ? meta
                    ? meta.bg
                    : 'rgba(200,169,110,0.12)'
                  : 'transparent',
                border: isActive
                  ? `1px solid ${meta ? meta.border : 'rgba(200,169,110,0.25)'}`
                  : '1px solid #222',
                color: isActive ? (meta ? meta.color : '#c8a96e') : '#555',
              }}
            >
              {f}
              {f !== 'Todos' && (
                <span style={{ marginLeft: 5, opacity: 0.7 }}>
                  ({ALL_QUOTES.filter((q) => q.status === f).length})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Quote list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((q) => {
          const meta = STATUS_META[q.status]
          const isExpanded = expandedId === q.id
          const canReply = q.status === 'Pendente' || q.status === 'Em análise'
          return (
            <div key={q.id} className="orc-card">
              {/* Main row */}
              <div style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <img
                  src={q.projectImg}
                  alt={q.project}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 9,
                    objectFit: 'cover' as const,
                    flexShrink: 0,
                    border: '1px solid #1c1c1c',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#d0d0d0' }}>
                        {q.project}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'rgba(200,169,110,0.1)',
                            border: '1px solid rgba(200,169,110,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 8,
                            fontWeight: 700,
                            color: '#c8a96e',
                          }}
                        >
                          {q.avatar}
                        </div>
                        <span style={{ fontSize: 12, color: '#555' }}>
                          {q.arquiteto} · {q.date}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: 10.5,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: meta.bg,
                          border: `1px solid ${meta.border}`,
                          color: meta.color,
                          fontWeight: 700,
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {q.status}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#c8a96e' }}>{q.value}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
                    {q.service}
                  </div>
                  <div
                    style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      style={{
                        fontSize: 11.5,
                        padding: '5px 12px',
                        borderRadius: 6,
                        background: 'transparent',
                        border: '1px solid #222',
                        color: '#555',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {isExpanded ? 'Menos detalhes' : 'Ver detalhes'}
                    </button>
                    {canReply && (
                      <button
                        onClick={() => setReplyId(q.id)}
                        style={{
                          fontSize: 11.5,
                          padding: '5px 12px',
                          borderRadius: 6,
                          background: 'rgba(200,169,110,0.09)',
                          border: '1px solid rgba(200,169,110,0.22)',
                          color: '#c8a96e',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Responder
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div
                  style={{
                    borderTop: '1px solid #111',
                    padding: '14px 20px',
                    background: '#0b0b0b',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#444', fontWeight: 600, marginBottom: 6 }}>
                    Detalhes da solicitação
                  </div>
                  <p style={{ fontSize: 13, color: '#777', lineHeight: 1.65, margin: 0 }}>
                    {q.details}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Reply Modal */}
      {replyId !== null && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setReplyId(null)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            className="orc-modal-box"
            style={{
              background: '#0e0e0e',
              border: '1px solid #222',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              padding: 28,
            }}
          >
            {replySent ? (
              <div style={{ textAlign: 'center' as const, padding: '22px 0' }}>
                <CheckCircle2 size={52} color="#34d399" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 19, fontWeight: 700, color: '#f0f0f0', marginBottom: 8 }}>
                  Resposta enviada!
                </div>
                <div style={{ fontSize: 13, color: '#555' }}>
                  {replyQuote?.arquiteto} será notificado.
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>
                      Responder Solicitação
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>
                      {replyQuote?.project} · {replyQuote?.arquiteto}
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyId(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label
                      style={{
                        fontSize: 11.5,
                        color: '#555',
                        display: 'block',
                        marginBottom: 6,
                        fontWeight: 600,
                      }}
                    >
                      Sua proposta *
                    </label>
                    <textarea
                      className="orc-inp"
                      required
                      rows={5}
                      placeholder="Descreva sua proposta, prazo, condições e detalhes técnicos..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      background: '#c8a96e',
                      color: '#080808',
                      border: 'none',
                      borderRadius: 9,
                      padding: '12px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Send size={14} />
                    Enviar Resposta
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
