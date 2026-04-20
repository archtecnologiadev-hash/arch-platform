'use client'

import { useState, useRef, useEffect } from 'react'
import {
  LogOut,
  Download,
  MessageCircle,
  X,
  Send,
  Check,
  FileText,
  ImageIcon,
  File,
  CalendarDays,
  FolderOpen,
  Activity,
} from 'lucide-react'
import CalendarioObra, { CalendarioEvent } from '@/components/shared/CalendarioObra'

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = 'andamento' | 'calendario' | 'arquivos'

interface ChatMessage {
  id: number
  sender: 'client' | 'arq'
  name: string
  text: string
  time: string
}

interface Milestone {
  id: number
  date: string
  title: string
  desc: string
  author: string | null
  color: string
  isCurrent?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
  'Atendimento',
  'Reunião',
  'Briefing',
  '3D',
  'Alteração 3D',
  'Detalhamento',
  'Orçamento',
  'Execução',
]

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'andamento', label: 'Andamento', icon: Activity },
  { id: 'calendario', label: 'Calendário da Obra', icon: CalendarDays },
  { id: 'arquivos', label: 'Arquivos', icon: FolderOpen },
]

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PROJECT = {
  name: 'Residência Costa',
  client: { name: 'Marina Fernandes', initials: 'MF' },
  stageIndex: 3,
  dueDate: '30 Mai 2026',
  image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',
  area: '320 m²',
  value: 'R$ 485.000',
  type: 'Residencial',
}

const CALENDAR_EVENTS: CalendarioEvent[] = [
  { id: 101, type: 'arquiteto',   title: 'Reunião de Alinhamento', provider: 'Arq. Serafim',     startDate: '2026-04-19', endDate: '2026-04-19', startTime: '14:00', endTime: '15:30' },
  { id: 102, type: 'arquiteto',   title: 'Visita Técnica',         provider: 'Arq. Serafim',     startDate: '2026-04-22', endDate: '2026-04-22', startTime: '09:00', endTime: '11:00' },
  { id: 103, type: 'marceneiro',  title: 'Marcenaria',             provider: 'Madeiras Silva',   startDate: '2026-05-05', endDate: '2026-05-10', startTime: '08:00', endTime: '17:00' },
  { id: 104, type: 'eletricista', title: 'Instalação Elétrica',    provider: 'Rodrigo Elétrica', startDate: '2026-05-10', endDate: '2026-05-12', startTime: '08:00', endTime: '17:00' },
  { id: 105, type: 'vidracaria',  title: 'Vidraçaria',             provider: 'Cristal Vidros',   startDate: '2026-05-15', endDate: '2026-05-15', startTime: '09:00', endTime: '16:00' },
  { id: 106, type: 'arquiteto',   title: 'Reunião com Cliente',    provider: 'Arq. Serafim',     startDate: '2026-05-20', endDate: '2026-05-20', startTime: '14:00', endTime: '15:00' },
  { id: 107, type: 'pintor',      title: 'Pintura',                provider: 'Pinturas Belo',    startDate: '2026-05-22', endDate: '2026-05-25', startTime: '07:30', endTime: '17:30' },
  { id: 108, type: 'gesseiro',    title: 'Gesseiro',               provider: 'Gesso Arte',       startDate: '2026-05-27', endDate: '2026-05-29', startTime: '08:00', endTime: '17:00' },
]

const FILES = [
  { id: 1, name: 'Briefing_Residencia_Costa.pdf', type: 'pdf',   size: '2.4 MB',  date: '10 Abr 2026', label: 'Documento de briefing' },
  { id: 2, name: 'Planta_Baixa_v1.dwg',           type: 'dwg',   size: '8.1 MB',  date: '12 Abr 2026', label: 'Planta baixa v1' },
  { id: 3, name: 'Render_Sala_Principal.jpg',      type: 'image', size: '4.7 MB',  date: '14 Abr 2026', label: 'Render — Sala principal' },
  { id: 4, name: 'Render_Quarto_Master.jpg',       type: 'image', size: '3.9 MB',  date: '14 Abr 2026', label: 'Render — Quarto master' },
  { id: 5, name: 'Referências_Inspiração.pdf',     type: 'pdf',   size: '12.3 MB', date: '08 Abr 2026', label: 'Suas referências de estilo' },
]

const MILESTONES: Milestone[] = [
  {
    id: 1,
    date: '08 Abr 2026',
    title: 'Projeto iniciado',
    desc: 'Contrato assinado e projeto criado. Bem-vinda ao seu espaço de acompanhamento!',
    author: 'Arq. Serafim Figueiredo',
    color: '#c8a96e',
  },
  {
    id: 2,
    date: '10 Abr 2026',
    title: 'Reunião de briefing realizada',
    desc: 'Reunião presencial com levantamento completo de necessidades, referências de estilo e preferências de materiais.',
    author: 'Arq. Serafim Figueiredo',
    color: '#4f9cf9',
  },
  {
    id: 3,
    date: '12 Abr 2026',
    title: 'Briefing aprovado por você',
    desc: 'Você aprovou o documento de briefing. Iniciamos imediatamente o desenvolvimento do projeto 3D!',
    author: 'Marina Fernandes',
    color: '#34d399',
  },
  {
    id: 4,
    date: '14 Abr 2026',
    title: 'Primeiros renders disponíveis',
    desc: 'Render da sala principal e do quarto master enviados para a sua visualização e aprovação.',
    author: 'Arq. Serafim Figueiredo',
    color: '#a78bfa',
  },
  {
    id: 5,
    date: 'Agora',
    title: 'Aguardando sua aprovação do 3D',
    desc: 'Acesse a aba Arquivos para visualizar os renders. Seu feedback é fundamental para avançarmos para a próxima etapa.',
    author: null,
    color: '#c8a96e',
    isCurrent: true,
  },
]

const INITIAL_CHAT: ChatMessage[] = [
  { id: 1, sender: 'arq',    name: 'Arq. Serafim', text: 'Olá Marina! Seja bem-vinda ao portal do seu projeto. Por aqui você acompanha tudo em tempo real. 😊',             time: '08 Abr · 10:05' },
  { id: 2, sender: 'client', name: 'Marina',        text: 'Que incrível! Adorei a plataforma. Quando os renders estarão prontos?',                                        time: '14 Abr · 14:22' },
  { id: 3, sender: 'arq',    name: 'Arq. Serafim', text: 'Os primeiros renders já estão disponíveis na aba Arquivos! São a sala principal e o quarto master. Me diga o que achou!', time: '14 Abr · 14:35' },
  { id: 4, sender: 'client', name: 'Marina',        text: 'Adorei o quarto master! Mas seria possível ampliar um pouco a janela da sala?',                                 time: '14 Abr · 15:00' },
  { id: 5, sender: 'arq',    name: 'Arq. Serafim', text: 'Claro! Vou ajustar no próximo round de alterações. Deve ficar pronto até sexta-feira.',                         time: '14 Abr · 15:05' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FileIcon({ type }: { type: string }) {
  if (type === 'pdf')   return <FileText  size={18} color="#ef4444" />
  if (type === 'image') return <ImageIcon size={18} color="#34d399" />
  if (type === 'dwg')   return <File      size={18} color="#4f9cf9" />
  return <File size={18} color="#888" />
}

function fileBadge(type: string) {
  if (type === 'pdf')   return { label: 'PDF', color: '#ef4444' }
  if (type === 'image') return { label: 'JPG', color: '#34d399' }
  if (type === 'dwg')   return { label: 'DWG', color: '#4f9cf9' }
  return { label: 'ARQ', color: '#888' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClienteProjetoPage() {
  const [activeTab, setActiveTab] = useState<TabId>('andamento')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const progress = Math.round(((PROJECT.stageIndex + 1) / STAGES.length) * 100)

  const sendMsg = () => {
    const text = chatMsg.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'client', name: 'Marina', text, time: 'Agora' },
    ])
    setChatMsg('')
  }

  useEffect(() => {
    if (chatOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatOpen])

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e0e0e0' }}>

      <style>{`
        @keyframes stage-pulse-cl {
          0%   { box-shadow: 0 0 0 0   rgba(200,169,110,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(200,169,110,0);    }
          100% { box-shadow: 0 0 0 0   rgba(200,169,110,0);    }
        }
        @keyframes dot-breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes chat-pulse {
          0%   { box-shadow: 0 6px 20px rgba(200,169,110,0.4), 0 0 0 0   rgba(200,169,110,0.4); }
          70%  { box-shadow: 0 6px 20px rgba(200,169,110,0.4), 0 0 0 12px rgba(200,169,110,0); }
          100% { box-shadow: 0 6px 20px rgba(200,169,110,0.4), 0 0 0 0   rgba(200,169,110,0); }
        }
        .cl-tab:hover { color: #b89060 !important; }
        .cl-file-row:hover { background: #0e0e0e !important; }
        .cl-chat-fab { animation: chat-pulse 2.8s ease-out infinite; }
        .cl-chat-fab:hover { transform: scale(1.1) !important; }
      `}</style>

      {/* ════════════════════ HEADER ════════════════════ */}
      <header
        style={{
          height: 64,
          background: 'rgba(8,8,8,0.97)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #141414',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.3em',
            color: '#c8a96e',
            fontFamily: 'Georgia, serif',
          }}
        >
          ARC
        </span>

        {/* Client ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(200,169,110,0.1)',
              border: '1.5px solid rgba(200,169,110,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#c8a96e',
            }}
          >
            {PROJECT.client.initials}
          </div>
          <span style={{ fontSize: 13.5, color: '#777', fontWeight: 500 }}>
            {PROJECT.client.name}
          </span>
        </div>

        {/* Logout */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            color: '#3e3e3e',
            background: 'transparent',
            border: '1px solid #1a1a1a',
            borderRadius: 7,
            padding: '6px 13px',
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#777'
            e.currentTarget.style.borderColor = '#2e2e2e'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#3e3e3e'
            e.currentTarget.style.borderColor = '#1a1a1a'
          }}
        >
          <LogOut size={13} />
          Sair
        </button>
      </header>

      {/* ════════════════════ HERO ════════════════════ */}
      <div style={{ position: 'relative', height: 310, overflow: 'hidden' }}>
        <img
          src={PROJECT.image}
          alt={PROJECT.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.35) 55%, transparent 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0 32px 28px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: 'rgba(200,169,110,0.6)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 7,
              }}
            >
              Seu Projeto
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                textShadow: '0 2px 16px rgba(0,0,0,0.6)',
              }}
            >
              {PROJECT.name}
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: 'rgba(255,255,255,0.38)',
                marginTop: 6,
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span>{PROJECT.area}</span>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
              <span>{PROJECT.type}</span>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
              <span>Previsão: {PROJECT.dueDate}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '6px 16px',
                borderRadius: 20,
                background: 'rgba(10,6,1,0.7)',
                border: '1.5px solid rgba(200,169,110,0.6)',
                color: '#c8a96e',
                backdropFilter: 'blur(10px)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {STAGES[PROJECT.stageIndex]}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
              Etapa {PROJECT.stageIndex + 1} de {STAGES.length}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════ TIMELINE ════════════════════ */}
      <div
        style={{
          background: '#090909',
          borderBottom: '1px solid #141414',
          padding: '0 32px',
          position: 'sticky',
          top: 64,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', overflowX: 'auto' }}>
          {STAGES.map((stage, i) => {
            const done    = i < PROJECT.stageIndex
            const current = i === PROJECT.stageIndex
            return (
              <div
                key={stage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: i < STAGES.length - 1 ? '1 1 0' : '0 0 auto',
                  minWidth: 0,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <div
                    className={current ? 'stage-pulse-cl' : ''}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: done ? '#c8a96e' : current ? 'rgba(200,169,110,0.12)' : '#111',
                      border: `2px solid ${done ? '#c8a96e' : current ? '#c8a96e' : '#1e1e1e'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: current ? 'stage-pulse-cl 1.8s ease-out infinite' : 'none',
                    }}
                  >
                    {done ? (
                      <Check size={12} color="#080808" strokeWidth={3} />
                    ) : current ? (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8a96e' }} />
                    ) : (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#1e1e1e' }} />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: current ? 700 : 400,
                      color: done ? '#c8a96e' : current ? '#e0e0e0' : '#222',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {stage}
                  </div>
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      marginBottom: 18,
                      background: done ? '#c8a96e' : '#191919',
                      minWidth: 6,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ════════════════════ BODY ════════════════════ */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px 100px' }}>

        {/* Progress summary card */}
        <div
          style={{
            background: '#0f0f0f',
            border: '1px solid #1c1c1c',
            borderRadius: 14,
            padding: '18px 22px',
            marginBottom: 26,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
              <span style={{ fontSize: 13, color: '#4a4a4a' }}>Progresso geral do seu projeto</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#c8a96e' }}>{progress}%</span>
            </div>
            <div style={{ height: 7, background: '#181818', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, rgba(200,169,110,0.45) 0%, #c8a96e 100%)',
                  borderRadius: 4,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 8, borderLeft: '1px solid #1c1c1c' }}>
            <div style={{ fontSize: 12.5, color: '#c8a96e', fontWeight: 700 }}>
              {STAGES[PROJECT.stageIndex]}
            </div>
            <div style={{ fontSize: 11, color: '#2e2e2e', marginTop: 2 }}>etapa atual</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1c1c1c', marginBottom: 26 }}>
          {TABS.map((tab) => {
            const Icon   = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                className="cl-tab"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${active ? '#c8a96e' : 'transparent'}`,
                  color: active ? '#c8a96e' : '#3a3a3a',
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  marginBottom: -1,
                  transition: 'color 0.15s',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ══ TAB: Andamento ══ */}
        {activeTab === 'andamento' && (
          <div style={{ position: 'relative', paddingLeft: 36 }}>
            {/* Vertical connector line */}
            <div
              style={{
                position: 'absolute',
                left: 11,
                top: 14,
                bottom: 24,
                width: 1.5,
                background: 'linear-gradient(to bottom, #c8a96e 30%, rgba(200,169,110,0.15) 80%, transparent 100%)',
              }}
            />

            {MILESTONES.map((m) => (
              <div
                key={m.id}
                style={{ position: 'relative', marginBottom: 22 }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: -36,
                    top: 4,
                    width: 23,
                    height: 23,
                    borderRadius: '50%',
                    background: m.isCurrent ? 'rgba(200,169,110,0.1)' : `${m.color}18`,
                    border: `2px solid ${m.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: m.isCurrent ? 'stage-pulse-cl 1.8s ease-out infinite' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: m.color,
                      animation: m.isCurrent ? 'dot-breathe 1.8s ease-in-out infinite' : 'none',
                    }}
                  />
                </div>

                {/* Card */}
                <div
                  style={{
                    background: m.isCurrent ? 'rgba(200,169,110,0.035)' : '#0f0f0f',
                    border: `1px solid ${m.isCurrent ? 'rgba(200,169,110,0.22)' : '#1c1c1c'}`,
                    borderRadius: 12,
                    padding: '15px 18px',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 7,
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: m.isCurrent ? '#c8a96e' : '#d5d5d5', lineHeight: 1.3 }}>
                      {m.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {m.isCurrent && (
                        <div
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: '2px 9px',
                            borderRadius: 20,
                            background: 'rgba(200,169,110,0.12)',
                            border: '1px solid rgba(200,169,110,0.28)',
                            color: '#c8a96e',
                            letterSpacing: '0.04em',
                          }}
                        >
                          AGORA
                        </div>
                      )}
                      <div style={{ fontSize: 11.5, color: '#2e2e2e' }}>{m.date}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13.5, color: '#555', lineHeight: 1.65 }}>{m.desc}</div>

                  {m.author && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, color: '#333' }}>{m.author}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ TAB: Calendário ══ */}
        {activeTab === 'calendario' && (
          <CalendarioObra events={CALENDAR_EVENTS} readonly={true} />
        )}

        {/* ══ TAB: Arquivos ══ */}
        {activeTab === 'arquivos' && (
          <div
            style={{
              background: '#0f0f0f',
              border: '1px solid #1c1c1c',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 22px',
                borderBottom: '1px solid #1c1c1c',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#d0d0d0' }}>
                  Arquivos do Projeto
                </div>
                <div style={{ fontSize: 12, color: '#3a3a3a', marginTop: 2 }}>
                  Documentos e imagens disponibilizados pelo seu arquiteto
                </div>
              </div>
              <span style={{ fontSize: 11.5, color: '#333' }}>
                {FILES.length} arquivos
              </span>
            </div>

            {FILES.map((file, i) => {
              const badge = fileBadge(file.type)
              return (
                <div
                  key={file.id}
                  className="cl-file-row"
                  style={{
                    padding: '15px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    borderBottom: i < FILES.length - 1 ? '1px solid #111' : 'none',
                    transition: 'background 0.12s',
                  }}
                >
                  {/* Icon + type badge */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: '#141414',
                      border: '1px solid #1c1c1c',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      flexShrink: 0,
                    }}
                  >
                    <FileIcon type={file.type} />
                    <div
                      style={{
                        fontSize: 7.5,
                        fontWeight: 700,
                        color: badge.color,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {badge.label}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#c8c8c8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {file.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#2e2e2e', marginTop: 2 }}>
                      {file.name} · {file.size}
                    </div>
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 12, color: '#2e2e2e', flexShrink: 0 }}>{file.date}</div>

                  {/* Download button */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#c8a96e',
                      textDecoration: 'none',
                      background: 'rgba(200,169,110,0.07)',
                      border: '1px solid rgba(200,169,110,0.18)',
                      borderRadius: 8,
                      padding: '6px 13px',
                      flexShrink: 0,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(200,169,110,0.15)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'rgba(200,169,110,0.07)')
                    }
                  >
                    <Download size={12} />
                    Baixar
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ════════════════════ FAB CHAT ════════════════════ */}
      {!chatOpen && (
        <button
          className="cl-chat-fab"
          onClick={() => setChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: '#c8a96e',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 50,
            transition: 'transform 0.2s ease',
          }}
        >
          <MessageCircle size={23} color="#080808" />
        </button>
      )}

      {/* ════════════════════ CHAT PANEL ════════════════════ */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 360,
          height: '100vh',
          background: '#0d0d0d',
          borderLeft: '1px solid #1c1c1c',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          transform: chatOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: chatOpen ? '-24px 0 64px rgba(0,0,0,0.65)' : 'none',
        }}
      >
        {/* Chat header */}
        <div
          style={{
            height: 66,
            padding: '0 18px',
            borderBottom: '1px solid #1c1c1c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(200,169,110,0.1)',
                border: '1.5px solid rgba(200,169,110,0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#c8a96e',
              }}
            >
              SF
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#ddd' }}>
                Arq. Serafim Figueiredo
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                <span style={{ fontSize: 10.5, color: '#3a3a3a' }}>Online</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setChatOpen(false)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'transparent',
              border: '1px solid #1e1e1e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#444',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1a1a1a'
              e.currentTarget.style.color = '#999'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#444'
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {messages.map((msg) => {
            const isClient = msg.sender === 'client'
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isClient ? 'row-reverse' : 'row',
                  gap: 8,
                  alignItems: 'flex-end',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 27,
                    height: 27,
                    borderRadius: '50%',
                    background: isClient ? 'rgba(200,169,110,0.1)' : 'rgba(79,156,249,0.1)',
                    border: `1.5px solid ${isClient ? 'rgba(200,169,110,0.28)' : 'rgba(79,156,249,0.28)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: isClient ? '#c8a96e' : '#4f9cf9',
                    flexShrink: 0,
                  }}
                >
                  {isClient ? 'MF' : 'SF'}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '74%' }}>
                  <div
                    style={{
                      background: isClient ? 'rgba(200,169,110,0.1)' : '#161616',
                      border: `1px solid ${isClient ? 'rgba(200,169,110,0.18)' : '#1e1e1e'}`,
                      borderRadius: isClient
                        ? '13px 13px 3px 13px'
                        : '13px 13px 13px 3px',
                      padding: '10px 13px',
                    }}
                  >
                    <div style={{ fontSize: 13.5, color: '#d5d5d5', lineHeight: 1.58 }}>
                      {msg.text}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#282828',
                      marginTop: 3,
                      textAlign: isClient ? 'right' : 'left',
                    }}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid #1c1c1c',
            display: 'flex',
            gap: 8,
            flexShrink: 0,
            background: '#0d0d0d',
          }}
        >
          <input
            value={chatMsg}
            onChange={(e) => setChatMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
            }}
            placeholder="Escreva uma mensagem..."
            style={{
              flex: 1,
              background: '#141414',
              border: '1px solid #222',
              borderRadius: 10,
              padding: '9px 13px',
              color: '#e0e0e0',
              fontSize: 13.5,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#222')}
          />
          <button
            onClick={sendMsg}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(200,169,110,0.12)',
              border: '1px solid rgba(200,169,110,0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(200,169,110,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(200,169,110,0.12)')}
          >
            <Send size={15} color="#c8a96e" />
          </button>
        </div>
      </div>
    </div>
  )
}
