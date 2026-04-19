'use client'

import { useState } from 'react'
import { TrendingUp, Star, FileText, ExternalLink, X, Send, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteRequest {
  id: number
  project: string
  projectImg: string
  arquiteto: string
  avatar: string
  service: string
  date: string
  value: string
  status: 'Pendente' | 'Em análise' | 'Aprovado' | 'Recusado'
}

interface MessagePreview {
  id: number
  arquiteto: string
  avatar: string
  project: string
  lastMsg: string
  time: string
  unread: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const QUOTES: QuoteRequest[] = [
  {
    id: 1,
    project: 'Residência Costa',
    projectImg: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&q=80',
    arquiteto: 'Arq. Serafim Figueiredo',
    avatar: 'SF',
    service: 'Armários planejados para cozinha e closet master com acabamento em nogueira',
    date: '18 Abr 2026',
    value: 'R$ 18.500',
    status: 'Pendente',
  },
  {
    id: 2,
    project: 'Cobertura Moderna',
    projectImg: 'https://images.unsplash.com/photo-1560185127-6a35cba96e9a?w=100&q=80',
    arquiteto: 'Arq. Marina Castro',
    avatar: 'MC',
    service: 'Marcenaria completa — sala, quartos e banheiros com MDF lacado branco',
    date: '16 Abr 2026',
    value: 'R$ 45.000',
    status: 'Em análise',
  },
  {
    id: 3,
    project: 'Escritório Zen',
    projectImg: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=100&q=80',
    arquiteto: 'Arq. Ricardo Leal',
    avatar: 'RL',
    service: 'Bancadas e prateleiras modulares para sala de reunião e recepção',
    date: '10 Abr 2026',
    value: 'R$ 12.800',
    status: 'Aprovado',
  },
  {
    id: 4,
    project: 'Vila Contemporânea',
    projectImg: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&q=80',
    arquiteto: 'Arq. Fernanda Lima',
    avatar: 'FL',
    service: 'Closet planejado em carvalho americano com espelhos e iluminação integrada',
    date: '05 Abr 2026',
    value: 'R$ 22.000',
    status: 'Aprovado',
  },
  {
    id: 5,
    project: 'Residência Jardins',
    projectImg: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=100&q=80',
    arquiteto: 'Arq. Paulo Mendes',
    avatar: 'PM',
    service: 'Cozinha planejada completa com ilha central em laminado carvalho natural',
    date: '28 Mar 2026',
    value: 'R$ 38.500',
    status: 'Recusado',
  },
]

const MESSAGES: MessagePreview[] = [
  {
    id: 1,
    arquiteto: 'Arq. Serafim Figueiredo',
    avatar: 'SF',
    project: 'Residência Costa',
    lastMsg: 'Quando vocês podem vir fazer a visita técnica?',
    time: '14h32',
    unread: 2,
  },
  {
    id: 2,
    arquiteto: 'Arq. Marina Castro',
    avatar: 'MC',
    project: 'Cobertura Moderna',
    lastMsg: 'Gostaria de discutir o orçamento enviado...',
    time: 'Ontem',
    unread: 0,
  },
  {
    id: 3,
    arquiteto: 'Arq. Ricardo Leal',
    avatar: 'RL',
    project: 'Escritório Zen',
    lastMsg: 'Confirmado! Quando iniciam os serviços?',
    time: '10 Abr',
    unread: 0,
  },
]

const STATUS_META: Record<string, { color: string; bg: string; border: string }> = {
  Pendente:    { color: '#c8a96e', bg: 'rgba(200,169,110,0.1)', border: 'rgba(200,169,110,0.22)' },
  'Em análise': { color: '#4f9cf9', bg: 'rgba(79,156,249,0.1)', border: 'rgba(79,156,249,0.22)' },
  Aprovado:    { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.22)' },
  Recusado:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FornecedorDashboardPage() {
  const [replyId, setReplyId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySent, setReplySent] = useState(false)

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    setReplySent(true)
    setTimeout(() => {
      setReplyId(null)
      setReplySent(false)
      setReplyText('')
    }, 2200)
  }

  const replyQuote = QUOTES.find((q) => q.id === replyId)

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
        .fd-quote-card { background: #0e0e0e; border: 1px solid #161616; border-radius: 12px; padding: 18px 20px; transition: border-color 0.18s; }
        .fd-quote-card:hover { border-color: #222; }
        .fd-msg-row:hover { background: #111 !important; }
        .fd-stat-card { background: #0e0e0e; border: 1px solid #161616; border-radius: 12px; padding: 20px 22px; }
        @keyframes fd-modal-in { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .fd-modal-box { animation: fd-modal-in 0.2s ease; }
        .fd-reply-inp { width: 100%; background: #111; border: 1px solid #222; border-radius: 8px; padding: 10px 14px; color: #d0d0d0; font-size: 13px; outline: none; transition: border-color 0.15s; color-scheme: dark; box-sizing: border-box; font-family: inherit; resize: vertical; }
        .fd-reply-inp:focus { border-color: rgba(200,169,110,0.45); }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 30,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f0', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#444', margin: '5px 0 0' }}>
            Bem-vindo, Marcenaria Silva & Filhos
          </p>
        </div>
        <Link
          href="/fornecedor/marcenaria-silva"
          target="_blank"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 12.5,
            padding: '8px 16px',
            borderRadius: 8,
            background: 'rgba(200,169,110,0.08)',
            border: '1px solid rgba(200,169,110,0.2)',
            color: '#c8a96e',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <ExternalLink size={13} />
          Ver Perfil Público
        </Link>
      </div>

      {/* ── Stats ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: 'Orçamentos Recebidos',
            value: '12',
            sub: 'este mês',
            icon: FileText,
            color: '#4f9cf9',
          },
          {
            label: 'Aprovados',
            value: '4',
            sub: 'este mês',
            icon: CheckCircle2,
            color: '#34d399',
          },
          {
            label: 'Receita Estimada',
            value: 'R$ 98.300',
            sub: '+12% vs. mês anterior',
            icon: TrendingUp,
            color: '#c8a96e',
          },
          {
            label: 'Avaliação Média',
            value: '4.9 ★',
            sub: 'baseado em 47 avaliações',
            icon: Star,
            color: '#f97316',
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="fd-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: '#3e3e3e',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                    }}
                  >
                    {card.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f0', marginTop: 8 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: 11, color: '#383838', marginTop: 4 }}>{card.sub}</div>
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: `${card.color}14`,
                    border: `1px solid ${card.color}28`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} color={card.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Body: quotes + messages ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* Quote list */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#d0d0d0' }}>
              Orçamentos Solicitados
            </div>
            <Link
              href="/fornecedor/orcamentos"
              style={{ fontSize: 12, color: '#c8a96e', textDecoration: 'none', fontWeight: 600 }}
            >
              Ver todos →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {QUOTES.map((q) => {
              const meta = STATUS_META[q.status]
              const canReply = q.status === 'Pendente' || q.status === 'Em análise'
              return (
                <div key={q.id} className="fd-quote-card">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <img
                      src={q.projectImg}
                      alt={q.project}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 8,
                        objectFit: 'cover' as const,
                        flexShrink: 0,
                        border: '1px solid #1a1a1a',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#d0d0d0' }}>
                            {q.project}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#555', marginTop: 2 }}>
                            {q.arquiteto} · {q.date}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            padding: '3px 10px',
                            borderRadius: 20,
                            background: meta.bg,
                            border: `1px solid ${meta.border}`,
                            color: meta.color,
                            fontWeight: 700,
                            flexShrink: 0,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {q.status}
                        </div>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#666', marginTop: 7, lineHeight: 1.5 }}>
                        {q.service}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 10,
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#c8a96e' }}>
                          {q.value}
                        </div>
                        {canReply && (
                          <button
                            onClick={() => setReplyId(q.id)}
                            style={{
                              fontSize: 12,
                              padding: '5px 14px',
                              borderRadius: 7,
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
                </div>
              )
            })}
          </div>
        </div>

        {/* Messages sidebar */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#d0d0d0' }}>Mensagens</div>
            <Link
              href="/fornecedor/mensagens"
              style={{ fontSize: 12, color: '#c8a96e', textDecoration: 'none', fontWeight: 600 }}
            >
              Ver todas →
            </Link>
          </div>
          <div
            style={{
              background: '#0e0e0e',
              border: '1px solid #161616',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {MESSAGES.map((msg, i) => (
              <Link
                key={msg.id}
                href="/fornecedor/mensagens"
                className="fd-msg-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 14px',
                  borderBottom: i < MESSAGES.length - 1 ? '1px solid #111' : 'none',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(200,169,110,0.1)',
                    border: '1.5px solid rgba(200,169,110,0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#c8a96e',
                    flexShrink: 0,
                    position: 'relative' as const,
                  }}
                >
                  {msg.avatar}
                  {msg.unread > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: '#c8a96e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 800,
                        color: '#080808',
                      }}
                    >
                      {msg.unread}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: msg.unread > 0 ? 700 : 500,
                        color: '#d0d0d0',
                        whiteSpace: 'nowrap' as const,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 140,
                      }}
                    >
                      {msg.arquiteto}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#383838', flexShrink: 0 }}>{msg.time}</div>
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: '#444',
                      marginTop: 2,
                      whiteSpace: 'nowrap' as const,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {msg.lastMsg}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div
            style={{
              marginTop: 14,
              background: '#0e0e0e',
              border: '1px solid #161616',
              borderRadius: 12,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#383838',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                marginBottom: 12,
              }}
            >
              Avaliação Média
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#c8a96e' }}>4.9</div>
              <div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={13} fill="#c8a96e" color="#c8a96e" />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#3e3e3e', marginTop: 3 }}>
                  47 avaliações de arquitetos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Reply Modal ══ */}
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
            className="fd-modal-box"
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
                <div
                  style={{
                    background: '#111',
                    border: '1px solid #1a1a1a',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 11, color: '#444', marginBottom: 4 }}>Serviço solicitado</div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{replyQuote?.service}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#c8a96e', marginTop: 8 }}>
                    {replyQuote?.value}
                  </div>
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
                      Sua proposta / resposta *
                    </label>
                    <textarea
                      className="fd-reply-inp"
                      required
                      rows={4}
                      placeholder="Descreva sua proposta, prazo e condições..."
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
