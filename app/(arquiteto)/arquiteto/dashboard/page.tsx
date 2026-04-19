'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  ChevronDown,
  FolderOpen,
  TrendingUp,
  Clock,
  FileText,
  Phone,
  CalendarDays,
  MapPin,
  Video,
  LogOut,
  Settings,
  User,
  ArrowRight,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type AgendaType = 'meeting' | 'call' | 'presentation' | 'visit'

interface Project {
  id: number
  name: string
  client: string
  initials: string
  stageIndex: number
  type: string
  dueDate: string
  image: string
}

interface Lead {
  id: number
  name: string
  contact: string
  date: string
  origin: string
  type: string
}

interface AgendaItem {
  id: number
  time: string
  title: string
  subtitle: string
  type: AgendaType
  duration: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  'Atendimento',
  'Reunião',
  'Briefing',
  '3D',
  'Alt. 3D',
  'Detalhamento',
  'Orçamento',
  'Execução',
]

const projects: Project[] = [
  {
    id: 1,
    name: 'Residência Costa',
    client: 'Marina Fernandes',
    initials: 'MF',
    stageIndex: 3,
    type: 'Residencial',
    dueDate: '30 Mai 2026',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
  },
  {
    id: 2,
    name: 'Escritório Zen',
    client: 'Rafael Monteiro',
    initials: 'RM',
    stageIndex: 5,
    type: 'Corporativo',
    dueDate: '15 Jun 2026',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
  },
  {
    id: 3,
    name: 'Cobertura Moderna',
    client: 'Juliana Carvalho',
    initials: 'JC',
    stageIndex: 2,
    type: 'Residencial',
    dueDate: '20 Jul 2026',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  },
  {
    id: 4,
    name: 'Vila Contemporânea',
    client: 'Eduardo Santos',
    initials: 'ES',
    stageIndex: 7,
    type: 'Residencial',
    dueDate: '10 Mai 2026',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
  },
]

const leads: Lead[] = [
  {
    id: 1,
    name: 'Paulo Henrique Borges',
    contact: '(11) 99834-5621',
    date: '17 Abr',
    origin: 'Instagram',
    type: 'Residencial',
  },
  {
    id: 2,
    name: 'Fernanda Luz',
    contact: '(21) 98756-3412',
    date: '16 Abr',
    origin: 'Indicação',
    type: 'Corporativo',
  },
  {
    id: 3,
    name: 'Rodrigo Mendes',
    contact: '(11) 97654-2109',
    date: '15 Abr',
    origin: 'Site',
    type: 'Residencial',
  },
  {
    id: 4,
    name: 'Camila Ribeiro',
    contact: '(31) 99123-4567',
    date: '14 Abr',
    origin: 'Instagram',
    type: 'Reforma',
  },
  {
    id: 5,
    name: 'André Lacerda',
    contact: '(11) 98901-2345',
    date: '13 Abr',
    origin: 'Indicação',
    type: 'Residencial',
  },
  {
    id: 6,
    name: 'Beatriz Nascimento',
    contact: '(51) 97890-1234',
    date: '12 Abr',
    origin: 'LinkedIn',
    type: 'Corporativo',
  },
]

const agenda: AgendaItem[] = [
  {
    id: 1,
    time: '09:00',
    title: 'Reunião de Briefing',
    subtitle: 'Marina Fernandes',
    type: 'meeting',
    duration: '1h',
  },
  {
    id: 2,
    time: '10:30',
    title: 'Call de Alinhamento',
    subtitle: 'TechSpace Ltda',
    type: 'call',
    duration: '30min',
  },
  {
    id: 3,
    time: '14:00',
    title: 'Apresentação 3D',
    subtitle: 'Rafael Monteiro',
    type: 'presentation',
    duration: '1h30',
  },
  {
    id: 4,
    time: '16:00',
    title: 'Visita à Obra',
    subtitle: 'Cobertura Moderna',
    type: 'visit',
    duration: '2h',
  },
  {
    id: 5,
    time: '17:30',
    title: 'Reunião com Fornecedor',
    subtitle: 'Madeiras Silva',
    type: 'meeting',
    duration: '45min',
  },
]

const STATS = [
  {
    title: 'Projetos Ativos',
    value: '12',
    delta: '+2 este mês',
    icon: FolderOpen,
    color: '#4f9cf9',
  },
  {
    title: 'Leads Recebidos',
    value: '28',
    delta: '+11 este mês',
    icon: TrendingUp,
    color: '#c8a96e',
  },
  {
    title: 'Reuniões Agendadas',
    value: '5',
    delta: '3 esta semana',
    icon: Clock,
    color: '#a78bfa',
  },
  {
    title: 'Orçamentos Pendentes',
    value: '7',
    delta: '4 aguardando aprovação',
    icon: FileText,
    color: '#34d399',
  },
]

const ORIGIN_COLORS: Record<string, string> = {
  Instagram: '#e1306c',
  Indicação: '#c8a96e',
  Site: '#4f9cf9',
  LinkedIn: '#0077b5',
}

const AGENDA_ICONS: Record<AgendaType, typeof CalendarDays> = {
  meeting: CalendarDays,
  call: Phone,
  presentation: Video,
  visit: MapPin,
}

const AGENDA_COLORS: Record<AgendaType, string> = {
  meeting: '#c8a96e',
  call: '#4f9cf9',
  presentation: '#a78bfa',
  visit: '#34d399',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card = {
  background: '#0f0f0f',
  border: '1px solid #1c1c1c',
  borderRadius: 14,
  overflow: 'hidden' as const,
}

const sectionHeader = {
  padding: '18px 22px',
  borderBottom: '1px solid #1c1c1c',
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
}

const goldButton = {
  fontSize: 12,
  color: '#c8a96e',
  background: 'rgba(200,169,110,0.08)',
  border: '1px solid rgba(200,169,110,0.2)',
  padding: '5px 12px',
  borderRadius: 6,
  cursor: 'pointer' as const,
  fontWeight: 500 as const,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArquitetoDashboardPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e0e0e0' }}>

      {/* ═══════════════════════════ HEADER ═══════════════════════════ */}
      <div
        style={{
          padding: '0 32px',
          height: 70,
          borderBottom: '1px solid #1c1c1c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0a0a0a',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div>
          <div style={{ fontSize: 11.5, color: '#c8a96e', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Bom dia
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0', lineHeight: 1.2 }}>
            Serafim Figueiredo
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false) }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <Bell size={17} color="#666" />
              <div
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#c8a96e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#080808',
                  border: '2px solid #0a0a0a',
                }}
              >
                3
              </div>
            </button>

            {notifOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 46,
                  right: 0,
                  width: 300,
                  background: '#111',
                  border: '1px solid #1c1c1c',
                  borderRadius: 12,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '13px 16px',
                    borderBottom: '1px solid #1c1c1c',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>Notificações</span>
                  <span style={{ fontSize: 11, color: '#c8a96e', cursor: 'pointer' }}>
                    Marcar todas como lidas
                  </span>
                </div>
                {[
                  { text: 'Novo lead: Paulo Henrique Borges', time: '2h atrás' },
                  { text: 'Briefing aprovado — Escritório Zen', time: '5h atrás' },
                  { text: 'Orçamento pendente: Vila Contemporânea', time: '1 dia atrás' },
                ].map((n, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 16px',
                      borderBottom: i < 2 ? '1px solid #141414' : 'none',
                      display: 'flex',
                      gap: 10,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#151515')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#c8a96e',
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 12.5, color: '#ccc' }}>{n.text}</div>
                      <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avatar + dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px 4px 4px',
                background: 'transparent',
                border: '1px solid #222',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(200,169,110,0.15)',
                  border: '1px solid rgba(200,169,110,0.4)',
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
              <div
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              >
                <ChevronDown size={13} color="#555" />
              </div>
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 48,
                  right: 0,
                  width: 210,
                  background: '#111',
                  border: '1px solid #1c1c1c',
                  borderRadius: 10,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '13px 15px', borderBottom: '1px solid #1c1c1c' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>
                    Arq. Serafim Figueiredo
                  </div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>serafim@arch.com</div>
                </div>
                {[
                  { label: 'Meu Perfil', icon: User },
                  { label: 'Configurações', icon: Settings },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      width: '100%',
                      padding: '10px 15px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      fontSize: 13,
                      color: '#999',
                      cursor: 'pointer',
                      transition: 'background 0.1s, color 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1a1a1a'
                      e.currentTarget.style.color = '#e0e0e0'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#999'
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
                <div style={{ height: 1, background: '#1c1c1c', margin: '3px 0' }} />
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    width: '100%',
                    padding: '10px 15px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: 13,
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════ CONTENT ═══════════════════════════ */}
      <div style={{ padding: '28px 32px' }}>

        {/* ─── Stats Cards ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.title}
                style={{
                  background: '#0f0f0f',
                  border: '1px solid #1c1c1c',
                  borderRadius: 12,
                  padding: '20px 20px',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(200,169,110,0.3)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = '#1c1c1c')
                }
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>{stat.title}</span>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${stat.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={15} color={stat.color} />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    color: '#f0f0f0',
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: '#3a3a3a' }}>{stat.delta}</div>
              </div>
            )
          })}
        </div>

        {/* ─── Two-column layout ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 296px', gap: 20 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

            {/* ── Pipeline ── */}
            <div style={card}>
              <style>{`
                .proj-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 16px;
                }
                @media (max-width: 1100px) {
                  .proj-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 640px) {
                  .proj-grid { grid-template-columns: 1fr; }
                }
                .proj-card {
                  border-radius: 12px;
                  overflow: hidden;
                  border: 1px solid #1c1c1c;
                  background: #0d0d0d;
                  cursor: pointer;
                  transition: border-color 0.25s, box-shadow 0.25s;
                }
                .proj-card:hover {
                  border-color: rgba(200,169,110,0.5);
                  box-shadow: 0 8px 32px rgba(200,169,110,0.07);
                }
                .proj-card-img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  display: block;
                  transition: transform 0.45s ease;
                }
                .proj-card:hover .proj-card-img {
                  transform: scale(1.06);
                }
              `}</style>

              <div style={sectionHeader}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8e8' }}>
                    Pipeline de Projetos
                  </div>
                  <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 3 }}>
                    Atendimento · Reunião · Briefing · 3D · Alt. 3D · Detalhamento · Orçamento · Execução
                  </div>
                </div>
                <button style={goldButton}>Ver todos</button>
              </div>

              <div style={{ padding: 20 }}>
                <div className="proj-grid">
                  {projects.map((project) => {
                    const progress = Math.round(
                      ((project.stageIndex + 1) / PIPELINE_STAGES.length) * 100
                    )
                    const currentStage = PIPELINE_STAGES[project.stageIndex]

                    return (
                      <div key={project.id} className="proj-card">

                        {/* Image area — ~60% of card height */}
                        <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                          <img
                            src={project.image}
                            alt={project.name}
                            className="proj-card-img"
                          />

                          {/* Dark gradient overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background:
                                'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
                            }}
                          />

                          {/* Stage badge — top right */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 20,
                              background: 'rgba(14,10,3,0.55)',
                              border: '1px solid rgba(200,169,110,0.55)',
                              color: '#c8a96e',
                              backdropFilter: 'blur(8px)',
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase' as const,
                            }}
                          >
                            {currentStage}
                          </div>

                          {/* Project name + client on overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 10,
                              left: 14,
                              right: 14,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 14.5,
                                fontWeight: 700,
                                color: '#fff',
                                lineHeight: 1.25,
                                textShadow: '0 1px 6px rgba(0,0,0,0.6)',
                              }}
                            >
                              {project.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'rgba(255,255,255,0.5)',
                                marginTop: 2,
                              }}
                            >
                              {project.client}
                            </div>
                          </div>

                          {/* Progress bar — bottom of image */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: 3,
                              background: 'rgba(0,0,0,0.5)',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${progress}%`,
                                background:
                                  'linear-gradient(90deg, rgba(200,169,110,0.5) 0%, #c8a96e 100%)',
                              }}
                            />
                          </div>
                        </div>

                        {/* Card footer */}
                        <div
                          style={{
                            padding: '11px 13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                            borderTop: '1px solid #181818',
                          }}
                        >
                          {/* Client avatar */}
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: 'rgba(200,169,110,0.1)',
                              border: '1px solid rgba(200,169,110,0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#c8a96e',
                              flexShrink: 0,
                            }}
                          >
                            {project.initials}
                          </div>

                          {/* Client name + due date */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 11.5,
                                fontWeight: 600,
                                color: '#c8c8c8',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {project.client}
                            </div>
                            <div style={{ fontSize: 10, color: '#3a3a3a', marginTop: 1 }}>
                              {project.dueDate}
                            </div>
                          </div>

                          {/* Action icon */}
                          <Link
                            href={`/arquiteto/projetos/${project.id}`}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              background: 'rgba(200,169,110,0.07)',
                              border: '1px solid rgba(200,169,110,0.18)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              textDecoration: 'none',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = 'rgba(200,169,110,0.18)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = 'rgba(200,169,110,0.07)')
                            }
                          >
                            <ArrowRight size={12} color="#c8a96e" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── Leads table ── */}
            <div style={card}>
              <div style={sectionHeader}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8e8' }}>
                    Leads Recentes
                  </div>
                  <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 3 }}>
                    Últimos contatos recebidos
                  </div>
                </div>
                <button style={goldButton}>Ver todos</button>
              </div>

              {/* Table header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 148px 68px 96px 90px',
                  padding: '10px 22px',
                  borderBottom: '1px solid #141414',
                }}
              >
                {['Nome', 'Contato', 'Data', 'Origem', ''].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10.5,
                      color: '#3a3a3a',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Table rows */}
              {leads.map((lead, i) => (
                <div
                  key={lead.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 148px 68px 96px 90px',
                    padding: '13px 22px',
                    borderBottom: i < leads.length - 1 ? '1px solid #111' : 'none',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#131313')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#d0d0d0' }}>
                      {lead.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 1 }}>{lead.type}</div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12,
                      color: '#555',
                    }}
                  >
                    <Phone size={10} color="#3a3a3a" />
                    {lead.contact}
                  </div>
                  <div style={{ fontSize: 12, color: '#444' }}>{lead.date}</div>
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: `${ORIGIN_COLORS[lead.origin] ?? '#555'}18`,
                        color: ORIGIN_COLORS[lead.origin] ?? '#888',
                        fontWeight: 600,
                      }}
                    >
                      {lead.origin}
                    </span>
                  </div>
                  <div>
                    <button
                      style={{
                        fontSize: 11.5,
                        padding: '5px 10px',
                        borderRadius: 6,
                        background: 'rgba(200,169,110,0.08)',
                        border: '1px solid rgba(200,169,110,0.2)',
                        color: '#c8a96e',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(200,169,110,0.15)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'rgba(200,169,110,0.08)')
                      }
                    >
                      Contatar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right column — Agenda ─── */}
          <div>
            <div
              style={{
                ...card,
                position: 'sticky',
                top: 90,
              }}
            >
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #1c1c1c' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8e8' }}>
                  Agenda do Dia
                </div>
                <div style={{ fontSize: 11.5, color: '#3a3a3a', marginTop: 3 }}>
                  Sexta-feira, 18 de Abril
                </div>
              </div>

              <div style={{ padding: '10px 0 4px' }}>
                {agenda.map((item, i) => {
                  const Icon = AGENDA_ICONS[item.type]
                  const color = AGENDA_COLORS[item.type]
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px 20px',
                        display: 'flex',
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#131313')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Time */}
                      <div
                        style={{
                          fontSize: 11,
                          color: '#444',
                          fontWeight: 600,
                          minWidth: 40,
                          paddingTop: 2,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {item.time}
                      </div>

                      {/* Timeline dot + line */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: color,
                            flexShrink: 0,
                            marginTop: 3,
                            boxShadow: `0 0 6px ${color}60`,
                          }}
                        />
                        {i < agenda.length - 1 && (
                          <div
                            style={{
                              width: 1,
                              flex: 1,
                              background: '#1c1c1c',
                              minHeight: 24,
                              marginTop: 3,
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0, paddingBottom: i < agenda.length - 1 ? 8 : 0 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: '#d8d8d8',
                            lineHeight: 1.3,
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            marginTop: 3,
                          }}
                        >
                          <Icon size={10} color={color} />
                          <span style={{ fontSize: 11, color: '#444' }}>{item.subtitle}</span>
                        </div>
                        <div style={{ fontSize: 10.5, color: '#2e2e2e', marginTop: 2 }}>
                          {item.duration}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ padding: '12px 20px', borderTop: '1px solid #141414' }}>
                <button
                  style={{
                    width: '100%',
                    padding: '9px',
                    background: 'rgba(200,169,110,0.07)',
                    border: '1px solid rgba(200,169,110,0.18)',
                    borderRadius: 8,
                    color: '#c8a96e',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '0.03em',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(200,169,110,0.13)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'rgba(200,169,110,0.07)')
                  }
                >
                  + Adicionar compromisso
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
