'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  ChevronDown,
  FolderOpen,
  TrendingUp,
  Clock,
  FileText,
  Phone,
  CalendarDays,
  LogOut,
  Settings,
  User,
  ArrowRight,
  Plus,
  X,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  client: string
  initials: string
  stageIndex: number
  type: string
  dueDate: string
  image: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  'Atendimento', 'Reunião', 'Briefing', '3D', 'Alt. 3D', 'Detalhamento', 'Orçamento', 'Execução',
]

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
]

const ETAPA_TO_STAGE: Record<string, number> = {
  atendimento: 0, reuniao: 1, briefing: 2,
  '3d': 3, alt_3d: 4, detalhamento: 5, orcamento: 6, execucao: 7,
}

const TIPO_LABEL: Record<string, string> = {
  residencial: 'Residencial', comercial: 'Comercial', institucional: 'Institucional',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 14,
  overflow: 'hidden' as const,
}

const sectionHeader = {
  padding: '18px 22px',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
  display: 'flex' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
}

const blueButton = {
  fontSize: 12,
  color: '#007AFF',
  background: 'rgba(0,122,255,0.08)',
  border: '1px solid rgba(0,122,255,0.2)',
  padding: '5px 12px',
  borderRadius: 6,
  cursor: 'pointer' as const,
  fontWeight: 400 as const,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArquitetoDashboardPage() {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const [userName, setUserName] = useState('Arquiteto')
  const [userEmail, setUserEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const [realProjects, setRealProjects] = useState<Project[]>([])
  const [escritorioId, setEscritorioId] = useState<string | null>(null)
  const [loadingProjects, setLoadingProjects] = useState(true)

  const [novoOpen, setNovoOpen] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', tipo: 'residencial', descricao: '' })
  const [novoSaving, setNovoSaving] = useState(false)

  const userInitials = userName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'A'

  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    async function loadProjects() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingProjects(false); return }

      const nome = user.user_metadata?.nome ?? user.email ?? 'Arquiteto'
      setUserName(nome)
      setUserEmail(user.email ?? '')

      if (user.user_metadata?.role === 'admin') {
        setIsAdmin(true)
      } else {
        const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
        if (userData?.role === 'admin') setIsAdmin(true)
      }

      const { data: escritorio } = await supabase
        .from('escritorios').select('id').eq('user_id', user.id).single()

      if (escritorio) {
        setEscritorioId(escritorio.id)
        const { data: projs } = await supabase
          .from('projetos').select('*').eq('escritorio_id', escritorio.id)
          .order('created_at', { ascending: false })

        if (projs && projs.length > 0) {
          setRealProjects(projs.map((p, i) => ({
            id: p.id,
            name: p.nome,
            client: '—',
            initials: p.nome.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase(),
            stageIndex: ETAPA_TO_STAGE[p.etapa_atual] ?? 2,
            type: TIPO_LABEL[p.tipo] ?? 'Residencial',
            dueDate: '—',
            image: FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
          })))
        }
      }
      setLoadingProjects(false)
    }
    loadProjects()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleCriarProjeto(e: React.FormEvent) {
    e.preventDefault()
    if (!escritorioId || !novoForm.nome) return
    setNovoSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projetos')
      .insert({ escritorio_id: escritorioId, nome: novoForm.nome, tipo: novoForm.tipo, descricao: novoForm.descricao })
      .select('*').single()

    if (!error && data) {
      const novo: Project = {
        id: data.id, name: data.nome, client: '—',
        initials: data.nome.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase(),
        stageIndex: 2, type: TIPO_LABEL[data.tipo] ?? 'Residencial',
        dueDate: '—', image: FALLBACK_IMAGES[realProjects.length % FALLBACK_IMAGES.length],
      }
      setRealProjects(prev => [novo, ...prev])
    }
    setNovoSaving(false)
    setNovoOpen(false)
    setNovoForm({ nome: '', tipo: 'residencial', descricao: '' })
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const statsData = [
    { title: 'Projetos Ativos', value: loadingProjects ? '—' : String(realProjects.length), delta: '', icon: FolderOpen, color: '#4f9cf9' },
    { title: 'Leads Recebidos', value: '0', delta: '', icon: TrendingUp, color: '#007AFF' },
    { title: 'Reuniões Agendadas', value: '0', delta: '', icon: Clock, color: '#a78bfa' },
    { title: 'Orçamentos Pendentes', value: '0', delta: '', icon: FileText, color: '#34d399' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', color: '#1a1a1a' }}>

      {/* ═══════════════════════════ HEADER ═══════════════════════════ */}
      <div style={{
        padding: '0 32px', height: 70, borderBottom: '1px solid rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff', position: 'sticky', top: 0, zIndex: 30,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div>
          <div style={{ fontSize: 11.5, color: '#007AFF', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Bom dia
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>
            {userName}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin && (
            <Link href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 8, textDecoration: 'none',
              background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)',
              color: '#007AFF', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,122,255,0.14)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,122,255,0.08)')}>
              <ShieldCheck size={14} />
              Painel Admin
            </Link>
          )}

          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false) }} style={{
              width: 38, height: 38, borderRadius: 8, background: 'transparent',
              border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Bell size={17} color="#8e8e93" />
            </button>
            {notifOpen && (
              <div style={{
                position: 'absolute', top: 46, right: 0, width: 260,
                background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden',
              }}>
                <div style={{ padding: '13px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Notificações</span>
                </div>
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#8e8e93', fontSize: 12 }}>
                  Nenhuma notificação
                </div>
              </div>
            )}
          </div>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false) }} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 10px 4px 4px', background: 'transparent',
              border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, cursor: 'pointer',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#007AFF',
              }}>
                {userInitials}
              </div>
              <div style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                <ChevronDown size={13} color="#8e8e93" />
              </div>
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 48, right: 0, width: 210,
                background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden',
              }}>
                <div style={{ padding: '13px 15px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{userName}</div>
                  <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>{userEmail}</div>
                </div>
                {[
                  { label: 'Meu Perfil', icon: User, href: '/arquiteto/perfil' },
                  { label: 'Configurações', icon: Settings, href: '/arquiteto/perfil' },
                ].map(({ label, icon: Icon, href }) => (
                  <Link key={label} href={href} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    width: '100%', padding: '10px 15px',
                    background: 'transparent', textDecoration: 'none',
                    fontSize: 13, color: '#6b6b6b',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f2f2f7'; e.currentTarget.style.color = '#1a1a1a' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b6b6b' }}>
                    <Icon size={14} />
                    {label}
                  </Link>
                ))}
                <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '3px 0' }} />
                <button onClick={handleLogout} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  width: '100%', padding: '10px 15px',
                  background: 'transparent', border: 'none',
                  textAlign: 'left', fontSize: 13, color: '#ef4444', cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {statsData.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.title} style={{
                background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12, padding: '20px 20px', transition: 'box-shadow 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: '#6b6b6b', fontWeight: 400 }}>{stat.title}</span>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={stat.color} />
                  </div>
                </div>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#1a1a1a', lineHeight: 1, marginBottom: 6 }}>
                  {stat.value}
                </div>
                {stat.delta && <div style={{ fontSize: 11, color: '#8e8e93' }}>{stat.delta}</div>}
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
                .proj-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
                @media (max-width: 1100px) { .proj-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 640px) { .proj-grid { grid-template-columns: 1fr; } }
                .proj-card { border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); background: #ffffff; cursor: pointer; transition: border-color 0.25s, box-shadow 0.25s; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
                .proj-card:hover { border-color: rgba(0,122,255,0.3); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
                .proj-card-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.45s ease; }
                .proj-card:hover .proj-card-img { transform: scale(1.06); }
              `}</style>

              <div style={sectionHeader}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Pipeline de Projetos</div>
                  <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 3 }}>
                    Atendimento · Reunião · Briefing · 3D · Alt. 3D · Detalhamento · Orçamento · Execução
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={blueButton}>Ver todos</button>
                  <button onClick={() => setNovoOpen(true)} style={{
                    ...blueButton, background: 'rgba(0,122,255,0.1)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Plus size={12} /> Novo Projeto
                  </button>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                {loadingProjects ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#8e8e93', fontSize: 13 }}>
                    Carregando projetos...
                  </div>
                ) : realProjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <FolderOpen size={40} color="#8e8e93" style={{ marginBottom: 14 }} />
                    <div style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 6 }}>Nenhum projeto ainda</div>
                    <div style={{ fontSize: 12, color: '#8e8e93', marginBottom: 18 }}>
                      Crie seu primeiro projeto para começar
                    </div>
                    <button onClick={() => setNovoOpen(true)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                      background: '#007AFF', color: '#ffffff', border: 'none',
                      fontSize: 13, fontWeight: 400,
                    }}>
                      <Plus size={14} /> Criar primeiro projeto
                    </button>
                  </div>
                ) : (
                  <div className="proj-grid">
                    {realProjects.map((project) => {
                      const progress = Math.round(((project.stageIndex + 1) / PIPELINE_STAGES.length) * 100)
                      const currentStage = PIPELINE_STAGES[project.stageIndex]
                      return (
                        <Link key={project.id} href={`/arquiteto/projetos/${project.id}`} className="proj-card" style={{ textDecoration: 'none', display: 'block' }}>
                          <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                            <img src={project.image} alt={project.name} className="proj-card-img" />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />
                            <div style={{
                              position: 'absolute', top: 10, right: 10,
                              fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                              background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,122,255,0.3)',
                              color: '#007AFF', backdropFilter: 'blur(8px)',
                              letterSpacing: '0.05em', textTransform: 'uppercase' as const,
                            }}>
                              {currentStage}
                            </div>
                            <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
                              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', lineHeight: 1.25, textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                                {project.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{project.client}</div>
                            </div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.2)' }}>
                              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, rgba(0,122,255,0.6) 0%, #007AFF 100%)' }} />
                            </div>
                          </div>
                          <div style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 9, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%',
                              background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, color: '#007AFF', flexShrink: 0,
                            }}>
                              {project.initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {project.client}
                              </div>
                              <div style={{ fontSize: 10, color: '#8e8e93', marginTop: 1 }}>{project.dueDate}</div>
                            </div>
                            <div style={{ flexShrink: 0, color: '#007AFF', opacity: 0.7 }}>
                              <ArrowRight size={12} />
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Leads table ── */}
            <div style={card}>
              <div style={sectionHeader}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Leads Recentes</div>
                  <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 3 }}>Últimos contatos recebidos</div>
                </div>
                <button style={blueButton}>Ver todos</button>
              </div>
              <div style={{ padding: '48px 22px', textAlign: 'center' }}>
                <Phone size={32} color="#8e8e93" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 4 }}>Nenhum lead ainda</div>
                <div style={{ fontSize: 11, color: '#8e8e93' }}>
                  Os leads recebidos aparecerão aqui
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right column — Agenda ─── */}
          <div>
            <div style={{ ...card, position: 'sticky', top: 90, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Agenda do Dia</div>
                <div style={{ fontSize: 11.5, color: '#8e8e93', marginTop: 3, textTransform: 'capitalize' }}>
                  {todayLabel}
                </div>
              </div>
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <CalendarDays size={32} color="#8e8e93" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 4 }}>Nenhum compromisso hoje</div>
                <div style={{ fontSize: 11, color: '#8e8e93' }}>
                  Acesse o calendário para adicionar eventos
                </div>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <Link href="/arquiteto/calendario" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', padding: '9px',
                  background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.18)',
                  borderRadius: 8, color: '#007AFF', fontSize: 12, fontWeight: 400,
                  letterSpacing: '0.03em', textDecoration: 'none',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,122,255,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,122,255,0.07)')}>
                  Ver Calendário
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ NOVO PROJETO MODAL ═══════ */}
      {novoOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={() => setNovoOpen(false)}>
          <div style={{
            background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16,
            padding: 32, width: '100%', maxWidth: 480, position: 'relative',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setNovoOpen(false)} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4,
            }}>
              <X size={18} />
            </button>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>Novo Projeto</h2>
            <p style={{ fontSize: 12, color: '#8e8e93', marginBottom: 24 }}>Adicione um novo projeto ao seu pipeline</p>

            <form onSubmit={handleCriarProjeto} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e8e93', marginBottom: 6, letterSpacing: '0.04em', fontWeight: 400 }}>
                  Nome do projeto
                </label>
                <input value={novoForm.nome} onChange={e => setNovoForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Residência Costa" required style={{
                    width: '100%', padding: '10px 14px', background: '#f2f2f7',
                    border: '1px solid rgba(0,0,0,0.08)', color: '#1a1a1a', fontSize: 13.5,
                    outline: 'none', boxSizing: 'border-box', borderRadius: 10,
                  }}
                  onFocus={e => (e.target.style.borderColor = '#007AFF')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e8e93', marginBottom: 6, letterSpacing: '0.04em', fontWeight: 400 }}>
                  Tipo
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['residencial', 'comercial', 'institucional'].map(t => (
                    <button key={t} type="button" onClick={() => setNovoForm(p => ({ ...p, tipo: t }))} style={{
                      flex: 1, padding: '9px 4px', fontSize: 12, fontWeight: 400,
                      borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                      background: novoForm.tipo === t ? 'rgba(0,122,255,0.1)' : '#f2f2f7',
                      border: `1px solid ${novoForm.tipo === t ? '#007AFF' : 'rgba(0,0,0,0.08)'}`,
                      color: novoForm.tipo === t ? '#007AFF' : '#6b6b6b', textTransform: 'capitalize',
                    }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e8e93', marginBottom: 6, letterSpacing: '0.04em', fontWeight: 400 }}>
                  Descrição (opcional)
                </label>
                <textarea value={novoForm.descricao} onChange={e => setNovoForm(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="Breve descrição do projeto..." rows={3} style={{
                    width: '100%', padding: '10px 14px', background: '#f2f2f7',
                    border: '1px solid rgba(0,0,0,0.08)', color: '#1a1a1a', fontSize: 13.5,
                    outline: 'none', boxSizing: 'border-box', borderRadius: 10, resize: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#007AFF')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
              </div>

              {!escritorioId && !loadingProjects && (
                <p style={{ fontSize: 12, color: '#f97316', padding: '10px 14px', background: 'rgba(249,115,22,0.06)', borderRadius: 8, border: '1px solid rgba(249,115,22,0.15)' }}>
                  Configure seu perfil em &quot;Meu Perfil&quot; antes de criar projetos.
                </p>
              )}

              <button type="submit" disabled={novoSaving || !escritorioId || !novoForm.nome} style={{
                width: '100%', padding: '12px', background: novoSaving ? 'rgba(0,122,255,0.4)' : '#007AFF',
                color: '#ffffff', border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 400, letterSpacing: '0.04em',
                cursor: novoSaving || !escritorioId || !novoForm.nome ? 'not-allowed' : 'pointer', marginTop: 4,
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
