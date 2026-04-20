'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Upload,
  FileText,
  ImageIcon,
  File,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Plus,
  Package,
  DollarSign,
  MoreHorizontal,
  Check,
  Pencil,
  Star,
  ExternalLink,
  Send,
  X,
  CheckCircle2,
  MapPin,
  Loader2,
} from 'lucide-react'
import CalendarioObra, { CalendarioEvent, EVENT_META, EventType } from '@/components/shared/CalendarioObra'
import { createClient } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientInfo {
  name: string
  initials: string
  phone: string
  email: string
}

interface ProjectFile {
  id: number
  name: string
  type: string
  size: string
  date: string
  uploader: string
}

interface Note {
  id: number
  text: string
  date: string
  time: string
  author: string
}

interface Supplier {
  id: number
  name: string
  category: string
  contact: string
  status: string
}

interface BudgetItem {
  category: string
  description: string
  value: number
}

interface ProjectData {
  id: string
  name: string
  client: ClientInfo
  type: string
  stageIndex: number
  dueDate: string
  image: string
  area: string
  value: string
  nextMeeting: { title: string; date: string; time: string }
  files: ProjectFile[]
  notes: Note[]
  suppliers: Supplier[]
  budget: { total: number; spent: number; items: BudgetItem[] }
  events?: CalendarioEvent[]
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

const SUPPLIER_STATUS_COLORS: Record<string, string> = {
  Confirmado: '#34d399',
  'Em negociação': '#c8a96e',
  'Aguardando orçamento': '#4f9cf9',
}

interface DirSupplier {
  id: number; slug: string; name: string; segment: string; city: string
  rating: number; reviewCount: number; description: string; cover: string; color: string
}

const SUPPLIER_DIRECTORY: DirSupplier[] = [
  { id: 1, slug: 'marcenaria-silva',    name: 'Marcenaria Silva & Filhos',  segment: 'Marcenaria', city: 'São Paulo, SP',  rating: 4.9, reviewCount: 47,  description: 'Móveis planejados e marcenaria fina para projetos de alto padrão.',         cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', color: '#4f9cf9' },
  { id: 2, slug: 'eletrica-voltagem',   name: 'Elétrica Voltagem',          segment: 'Elétrica',   city: 'São Paulo, SP',  rating: 4.7, reviewCount: 89,  description: 'Instalações elétricas e automação residencial de alto padrão.',          cover: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80', color: '#34d399' },
  { id: 3, slug: 'vidracaria-cristal',  name: 'Vidraçaria Cristal',         segment: 'Vidraçaria', city: 'São Paulo, SP',  rating: 4.8, reviewCount: 63,  description: 'Vidros temperados, laminados e esquadrias de alumínio linha pesada.', cover: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80', color: '#a78bfa' },
  { id: 4, slug: 'gesseiro-acabamentos',name: 'Gesseiro Acabamentos Pro',   segment: 'Gesseiro',   city: 'Campinas, SP',   rating: 4.6, reviewCount: 34,  description: 'Tetos rebaixados, dry wall e sancas com acabamento milimétrico.',       cover: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80', color: '#f97316' },
  { id: 5, slug: 'pintura-arte-final',  name: 'Pintura Arte Final',         segment: 'Pintura',    city: 'São Paulo, SP',  rating: 4.9, reviewCount: 112, description: 'Pintura premium, texturas especiais e acabamentos diferenciados.',      cover: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80', color: '#ef4444' },
]

const DIR_SEGMENTS = ['Todos', 'Marcenaria', 'Elétrica', 'Vidraçaria', 'Gesseiro', 'Pintura']

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PROJECTS: Record<string, ProjectData> = {
  '1': {
    id: '1',
    name: 'Residência Costa',
    client: {
      name: 'Marina Fernandes',
      initials: 'MF',
      phone: '(11) 98765-1234',
      email: 'marina.fernandes@email.com',
    },
    type: 'Residencial',
    stageIndex: 3,
    dueDate: '30 Mai 2026',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',
    area: '320 m²',
    value: 'R$ 485.000',
    nextMeeting: { title: 'Apresentação 3D', date: '22 Mai 2026', time: '14h00' },
    files: [
      { id: 1, name: 'Briefing_Residencia_Costa.pdf', type: 'pdf', size: '2.4 MB', date: '10 Abr 2026', uploader: 'Marina Fernandes' },
      { id: 2, name: 'Planta_Baixa_v1.dwg', type: 'dwg', size: '8.1 MB', date: '12 Abr 2026', uploader: 'Arq. Serafim' },
      { id: 3, name: 'Render_Sala_Principal.jpg', type: 'image', size: '4.7 MB', date: '14 Abr 2026', uploader: 'Arq. Serafim' },
      { id: 4, name: 'Render_Quarto_Master.jpg', type: 'image', size: '3.9 MB', date: '14 Abr 2026', uploader: 'Arq. Serafim' },
      { id: 5, name: 'Referências_Inspiração.pdf', type: 'pdf', size: '12.3 MB', date: '08 Abr 2026', uploader: 'Marina Fernandes' },
    ],
    notes: [
      {
        id: 1,
        text: 'Cliente prefere tons neutros e madeira clara. Evitar elementos muito contemporâneos — gosto mais clássico moderno.',
        date: '10 Abr 2026',
        time: '14:22',
        author: 'Arq. Serafim',
      },
      {
        id: 2,
        text: 'Briefing aprovado em reunião presencial. Marina pediu área de home office no quarto de hóspedes. Verificar viabilidade estrutural com engenheiro.',
        date: '12 Abr 2026',
        time: '16:05',
        author: 'Arq. Serafim',
      },
      {
        id: 3,
        text: 'Primeira versão do 3D enviada para aprovação. Aguardando feedback sobre paleta de cores da sala de estar e posicionamento do sofá.',
        date: '14 Abr 2026',
        time: '09:30',
        author: 'Arq. Serafim',
      },
    ],
    suppliers: [
      { id: 1, name: 'Madeiras Silva', category: 'Marcenaria', contact: '(11) 98765-4321', status: 'Em negociação' },
      { id: 2, name: 'Lumini Iluminação', category: 'Iluminação', contact: '(11) 97654-3210', status: 'Confirmado' },
      { id: 3, name: 'Quartzolit Revestimentos', category: 'Acabamentos', contact: '(11) 96543-2109', status: 'Aguardando orçamento' },
    ],
    budget: {
      total: 485000,
      spent: 142000,
      items: [
        { category: 'Projeto e Honorários', description: 'Projeto completo de interiores', value: 45000 },
        { category: 'Marcenaria', description: 'Armários, estantes e mobiliário fixo', value: 120000 },
        { category: 'Iluminação', description: 'Luminárias e projeto luminotécnico', value: 38000 },
        { category: 'Revestimentos', description: 'Pisos, paredes e acabamentos', value: 85000 },
        { category: 'Mobiliário', description: 'Sofás, mesas, cadeiras e decoração', value: 95000 },
        { category: 'Instalações', description: 'Elétrica, hidráulica e ar-condicionado', value: 72000 },
        { category: 'Reserva Técnica', description: 'Imprevistos e ajustes finais', value: 30000 },
      ],
    },
    events: [
      { id: 101, type: 'arquiteto', title: 'Reunião de Alinhamento', provider: 'Arq. Serafim', startDate: '2026-04-19', endDate: '2026-04-19', startTime: '14:00', endTime: '15:30', note: 'Apresentação do 3D para a cliente' },
      { id: 102, type: 'arquiteto', title: 'Visita Técnica', provider: 'Arq. Serafim', startDate: '2026-04-22', endDate: '2026-04-22', startTime: '09:00', endTime: '11:00', note: 'Vistoria do imóvel com engenheiro' },
      { id: 103, type: 'marceneiro', title: 'Marcenaria', provider: 'Madeiras Silva', startDate: '2026-05-05', endDate: '2026-05-10', startTime: '08:00', endTime: '17:00', note: 'Instalação de armários e mobiliário fixo' },
      { id: 104, type: 'eletricista', title: 'Instalação Elétrica', provider: 'Rodrigo Elétrica', startDate: '2026-05-10', endDate: '2026-05-12', startTime: '08:00', endTime: '17:00', note: 'Passagem de fios e pontos elétricos — simultaneo com marcenaria no dia 10' },
      { id: 105, type: 'vidracaria', title: 'Vidraçaria', provider: 'Cristal Vidros', startDate: '2026-05-15', endDate: '2026-05-15', startTime: '09:00', endTime: '16:00', note: 'Instalação de espelhos e divisórias de vidro' },
      { id: 106, type: 'arquiteto', title: 'Reunião com Cliente', provider: 'Arq. Serafim', startDate: '2026-05-20', endDate: '2026-05-20', startTime: '14:00', endTime: '15:00', note: 'Aprovação dos acabamentos finais' },
      { id: 107, type: 'pintor', title: 'Pintura', provider: 'Pinturas Belo', startDate: '2026-05-22', endDate: '2026-05-25', startTime: '07:30', endTime: '17:30', note: 'Pintura interna — sala, quartos e cozinha' },
      { id: 108, type: 'gesseiro', title: 'Gesseiro', provider: 'Gesso Arte', startDate: '2026-05-27', endDate: '2026-05-29', startTime: '08:00', endTime: '17:00', note: 'Execução de sancas e molduras em gesso' },
    ],
  },
  '2': {
    id: '2',
    name: 'Escritório Zen',
    client: { name: 'Rafael Monteiro', initials: 'RM', phone: '(11) 97654-3210', email: 'rafael.monteiro@email.com' },
    type: 'Corporativo',
    stageIndex: 5,
    dueDate: '15 Jun 2026',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
    area: '180 m²',
    value: 'R$ 220.000',
    nextMeeting: { title: 'Revisão Detalhamento', date: '25 Mai 2026', time: '10h00' },
    files: [],
    notes: [],
    suppliers: [],
    budget: { total: 220000, spent: 165000, items: [] },
  },
  '3': {
    id: '3',
    name: 'Cobertura Moderna',
    client: { name: 'Juliana Carvalho', initials: 'JC', phone: '(11) 96543-2109', email: 'juliana.carvalho@email.com' },
    type: 'Residencial',
    stageIndex: 2,
    dueDate: '20 Jul 2026',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80',
    area: '250 m²',
    value: 'R$ 380.000',
    nextMeeting: { title: 'Reunião de Briefing', date: '20 Mai 2026', time: '15h30' },
    files: [],
    notes: [],
    suppliers: [],
    budget: { total: 380000, spent: 28000, items: [] },
  },
  '4': {
    id: '4',
    name: 'Vila Contemporânea',
    client: { name: 'Eduardo Santos', initials: 'ES', phone: '(11) 95432-1098', email: 'eduardo.santos@email.com' },
    type: 'Residencial',
    stageIndex: 7,
    dueDate: '10 Mai 2026',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
    area: '450 m²',
    value: 'R$ 920.000',
    nextMeeting: { title: 'Visita à Obra', date: '19 Mai 2026', time: '09h00' },
    files: [],
    notes: [],
    suppliers: [],
    budget: { total: 920000, spent: 890000, items: [] },
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type TabId = 'arquivos' | 'anotacoes' | 'fornecedores' | 'calendario' | 'orcamento'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'arquivos', label: 'Arquivos', icon: File },
  { id: 'anotacoes', label: 'Anotações', icon: Pencil },
  { id: 'fornecedores', label: 'Fornecedores', icon: Package },
  { id: 'calendario', label: 'Calendário', icon: Calendar },
  { id: 'orcamento', label: 'Orçamento', icon: DollarSign },
]

function FileTypeIcon({ type }: { type: string }) {
  if (type === 'pdf') return <FileText size={15} color="#ef4444" />
  if (type === 'image') return <ImageIcon size={15} color="#34d399" />
  if (type === 'dwg') return <File size={15} color="#4f9cf9" />
  return <File size={15} color="#666" />
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const panel = {
  background: '#0f0f0f',
  border: '1px solid #1c1c1c',
  borderRadius: 12,
  overflow: 'hidden' as const,
}

const panelHeader = {
  padding: '13px 16px',
  borderBottom: '1px solid #1c1c1c',
  fontSize: 11,
  color: '#3a3a3a',
  fontWeight: 600 as const,
  letterSpacing: '0.07em',
  textTransform: 'uppercase' as const,
}

const iconBox = (color = '#555') => ({
  width: 28,
  height: 28,
  borderRadius: 7,
  background: '#141414',
  border: '1px solid #1c1c1c',
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  flexShrink: 0 as const,
  color,
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjetoDetailPage() {
  const params = useParams()
  const projectId = (params?.id as string) ?? '1'
  const isRealProject = !/^\d+$/.test(projectId)
  const project = PROJECTS[projectId] ?? PROJECTS['1']

  const [activeTab, setActiveTab] = useState<TabId>('arquivos')
  const [dragOver, setDragOver] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<Note[]>(isRealProject ? [] : project.notes)
  const [calEvents, setCalEvents] = useState<CalendarioEvent[]>(isRealProject ? [] : (project.events ?? []))
  const [stageIndex, setStageIndex] = useState(project.stageIndex)
  const [advancingStage, setAdvancingStage] = useState(false)
  const [stageAdvanced, setStageAdvanced] = useState(false)

  // Load events + stage from Supabase for real (UUID) projects
  useEffect(() => {
    if (!isRealProject) return
    async function loadData() {
      const supabase = createClient()
      const [{ data: evs }, { data: proj }] = await Promise.all([
        supabase.from('eventos').select('*').eq('projeto_id', projectId).order('data_inicio'),
        supabase.from('projetos').select('etapa_atual').eq('id', projectId).single(),
      ])
      if (evs) {
        setCalEvents(evs.map(e => ({
          id: e.id,
          type: e.tipo as EventType,
          title: e.titulo,
          provider: e.observacao ?? '',
          startDate: e.data_inicio,
          endDate: e.data_fim,
          startTime: e.hora_inicio ?? undefined,
          endTime: e.hora_fim ?? undefined,
          note: e.observacao ?? undefined,
        })))
      }
      if (proj?.etapa_atual) {
        const idx = STAGES.findIndex(s => s.toLowerCase() === proj.etapa_atual.toLowerCase())
        if (idx >= 0) setStageIndex(idx)
      }
    }
    loadData()
  }, [projectId, isRealProject])

  async function handleAdvanceStage() {
    if (stageIndex >= STAGES.length - 1) return
    setAdvancingStage(true)
    const nextIndex = stageIndex + 1
    if (isRealProject) {
      const supabase = createClient()
      await supabase.from('projetos').update({ etapa_atual: STAGES[nextIndex] }).eq('id', projectId)
    }
    setStageIndex(nextIndex)
    setAdvancingStage(false)
    setStageAdvanced(true)
    setTimeout(() => setStageAdvanced(false), 2500)
  }
  const [dirFilter, setDirFilter] = useState<string>('Todos')
  const [dirQuoteTarget, setDirQuoteTarget] = useState<DirSupplier | null>(null)
  const [dirQuoteForm, setDirQuoteForm] = useState({ descricao: '', data: '' })
  const [dirQuoteSent, setDirQuoteSent] = useState(false)

  // Next 7 days para o painel lateral
  const todayBase = new Date()
  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayBase)
    d.setDate(todayBase.getDate() + i)
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      date: d,
      dStr,
      isToday: i === 0,
      dayEvents: calEvents.filter((e) => e.startDate <= dStr && e.endDate >= dStr),
    }
  })

  const addNote = () => {
    if (!noteText.trim()) return
    const now = new Date()
    setNotes((prev) => [
      {
        id: Date.now(),
        text: noteText.trim(),
        date: now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        author: 'Arq. Serafim',
      },
      ...prev,
    ])
    setNoteText('')
  }

  const progress = Math.round(((stageIndex + 1) / STAGES.length) * 100)
  const effectiveBudget = isRealProject ? { total: 0, spent: 0, items: [] } : project.budget
  const budgetPercent = effectiveBudget.total > 0 ? Math.round((effectiveBudget.spent / effectiveBudget.total) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e0e0e0' }}>

      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0   rgba(200,169,110,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(200,169,110,0);    }
          100% { box-shadow: 0 0 0 0   rgba(200,169,110,0);    }
        }
        .stage-pulse { animation: pulse-ring 1.8s ease-out infinite; }
        .proj-file-row:hover  { background: #111 !important; }
        .proj-note-card:hover { border-color: rgba(200,169,110,0.28) !important; }
        .proj-sup-row:hover   { background: #111 !important; }
        .proj-bud-row:hover   { background: #111 !important; }
        .proj-back-btn:hover  { color: #fff !important; border-color: rgba(255,255,255,0.2) !important; }
        .dir-card { background: #111; border: 1px solid #1a1a1a; border-radius: 10px; overflow: hidden; transition: border-color 0.2s; }
        .dir-card:hover { border-color: rgba(200,169,110,0.25); }
        .dir-card-img { width: 100%; height: 100px; object-fit: cover; display: block; transition: transform 0.4s; }
        .dir-card:hover .dir-card-img { transform: scale(1.05); }
        .dir-seg-btn { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .dir-inp { width: 100%; background: #0e0e0e; border: 1px solid #222; border-radius: 7px; padding: 9px 12px; color: #d0d0d0; font-size: 13px; outline: none; transition: border-color 0.15s; color-scheme: dark; box-sizing: border-box; font-family: inherit; }
        .dir-inp:focus { border-color: rgba(200,169,110,0.4); }
        @keyframes dir-modal-in { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .dir-modal-box { animation: dir-modal-in 0.2s ease; }
      `}</style>

      {/* ═══════════════════ COVER HEADER ═══════════════════ */}
      <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
        <img
          src={project.image}
          alt={project.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(8,8,8,0.96) 0%, rgba(8,8,8,0.38) 52%, rgba(8,8,8,0.12) 100%)',
          }}
        />

        {/* Top bar */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            right: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/arquiteto/dashboard"
            className="proj-back-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.65)',
              textDecoration: 'none',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '6px 13px 6px 10px',
              borderRadius: 8,
              fontWeight: 500,
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            <ArrowLeft size={13} />
            Dashboard
          </Link>

          <div style={{ display: 'flex', gap: 7 }}>
            {[project.type, project.area].map((tag) => (
              <div
                key={tag}
                style={{
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.45)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#777',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom info */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0 28px 26px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              }}
            >
              {project.name}
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: 'rgba(255,255,255,0.45)',
                marginTop: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap' as const,
              }}
            >
              <span>{project.client.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.18)' }}>·</span>
              <span>Previsão: {project.dueDate}</span>
              <span style={{ color: 'rgba(255,255,255,0.18)' }}>·</span>
              <span>{project.value}</span>
            </div>
          </div>

          {/* Stage badge */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 15px',
              borderRadius: 20,
              background: 'rgba(10,6,1,0.65)',
              border: '1.5px solid rgba(200,169,110,0.65)',
              color: '#c8a96e',
              backdropFilter: 'blur(10px)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            {STAGES[stageIndex]}
          </div>
        </div>
      </div>

      {/* ═══════════════════ TIMELINE ═══════════════════ */}
      <div
        style={{
          background: '#0a0a0a',
          borderBottom: '1px solid #1c1c1c',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 0',
            overflowX: 'auto',
          }}
        >
          {STAGES.map((stage, i) => {
            const done = i < stageIndex
            const current = i === stageIndex

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
                {/* Circle + label */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  <div
                    className={current ? 'stage-pulse' : ''}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: done
                        ? '#c8a96e'
                        : current
                        ? 'rgba(200,169,110,0.12)'
                        : '#111',
                      border: `2px solid ${done ? '#c8a96e' : current ? '#c8a96e' : '#252525'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {done ? (
                      <Check size={12} color="#080808" strokeWidth={3} />
                    ) : current ? (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8a96e' }} />
                    ) : (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#282828' }} />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: current ? 700 : 400,
                      color: done ? '#c8a96e' : current ? '#e0e0e0' : '#2e2e2e',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {stage}
                  </div>
                </div>

                {/* Connector */}
                {i < STAGES.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      marginBottom: 18,
                      background: done ? '#c8a96e' : '#1a1a1a',
                      minWidth: 6,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════ BODY ═══════════════════ */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          padding: '24px 28px',
          alignItems: 'flex-start',
        }}
      >

        {/* ─── Main content ─── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Tab bar */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #1c1c1c',
              marginBottom: 22,
            }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '11px 18px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${active ? '#c8a96e' : 'transparent'}`,
                    color: active ? '#c8a96e' : '#3e3e3e',
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    marginBottom: -1,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = '#888'
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = '#3e3e3e'
                  }}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* ══ TAB: Arquivos ══ */}
          {activeTab === 'arquivos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false) }}
                style={{
                  border: `2px dashed ${dragOver ? '#c8a96e' : '#1e1e1e'}`,
                  borderRadius: 12,
                  padding: '30px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  background: dragOver ? 'rgba(200,169,110,0.04)' : 'transparent',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: 'rgba(200,169,110,0.08)',
                    border: '1px solid rgba(200,169,110,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Upload size={18} color="#c8a96e" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#c8c8c8' }}>
                    Arraste arquivos aqui
                  </div>
                  <div style={{ fontSize: 11.5, color: '#2e2e2e', marginTop: 3 }}>
                    ou clique para selecionar · PDF, DWG, JPG, PNG
                  </div>
                </div>
              </div>

              {/* File list */}
              <div style={panel}>
                <div
                  style={{
                    padding: '13px 20px',
                    borderBottom: '1px solid #1c1c1c',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#c0c0c0' }}>
                    Arquivos do Projeto
                  </span>
                  <span style={{ fontSize: 11, color: '#3a3a3a' }}>
                    {(isRealProject ? [] : project.files).length} arquivo{(isRealProject ? [] : project.files).length !== 1 ? 's' : ''}
                  </span>
                </div>

                {(isRealProject ? [] : project.files).map((file, i) => (
                  <div
                    key={file.id}
                    className="proj-file-row"
                    style={{
                      padding: '13px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 13,
                      borderBottom: i < (isRealProject ? [] : project.files).length - 1 ? '1px solid #111' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: '#141414',
                        border: '1px solid #1c1c1c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileTypeIcon type={file.type} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#d0d0d0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {file.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#333', marginTop: 2 }}>
                        {file.size} · Enviado por {file.uploader}
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: '#333', flexShrink: 0 }}>{file.date}</div>

                    <button
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 5,
                        background: 'transparent',
                        border: '1px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#3a3a3a',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1a1a1a'
                        e.currentTarget.style.borderColor = '#222'
                        e.currentTarget.style.color = '#888'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.color = '#3a3a3a'
                      }}
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB: Anotações ══ */}
          {activeTab === 'anotacoes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Add note */}
              <div style={panel}>
                <div style={{ padding: 16 }}>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Escreva uma anotação sobre este projeto..."
                    rows={4}
                    style={{
                      width: '100%',
                      background: '#141414',
                      border: '1px solid #222',
                      borderRadius: 8,
                      padding: '11px 13px',
                      color: '#e0e0e0',
                      fontSize: 13,
                      resize: 'vertical' as const,
                      outline: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.65,
                      boxSizing: 'border-box' as const,
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#222')}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      onClick={addNote}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12.5,
                        padding: '7px 15px',
                        borderRadius: 7,
                        background: 'rgba(200,169,110,0.1)',
                        border: '1px solid rgba(200,169,110,0.28)',
                        color: '#c8a96e',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(200,169,110,0.2)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'rgba(200,169,110,0.1)')
                      }
                    >
                      <Plus size={12} />
                      Salvar anotação
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes list */}
              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#2a2a2a', fontSize: 13 }}>
                  Nenhuma anotação ainda
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="proj-note-card"
                      style={{
                        background: '#0f0f0f',
                        border: '1px solid #1c1c1c',
                        borderRadius: 10,
                        padding: '14px 16px',
                        transition: 'border-color 0.18s',
                      }}
                    >
                      <div style={{ fontSize: 13.5, color: '#d5d5d5', lineHeight: 1.65 }}>
                        {note.text}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          marginTop: 11,
                          paddingTop: 11,
                          borderTop: '1px solid #141414',
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'rgba(200,169,110,0.1)',
                            border: '1px solid rgba(200,169,110,0.22)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 7.5,
                            fontWeight: 700,
                            color: '#c8a96e',
                          }}
                        >
                          SF
                        </div>
                        <span style={{ fontSize: 11, color: '#3e3e3e' }}>{note.author}</span>
                        <span style={{ color: '#222' }}>·</span>
                        <span style={{ fontSize: 11, color: '#2e2e2e' }}>{note.date}</span>
                        <span style={{ color: '#222' }}>·</span>
                        <span style={{ fontSize: 11, color: '#2e2e2e' }}>{note.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: Fornecedores ══ */}
          {activeTab === 'fornecedores' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── Fornecedores do projeto ── */}
              {!isRealProject && project.suppliers.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#383838', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
                    No projeto
                  </div>
                  <div style={panel}>
                    {project.suppliers.map((sup, i) => (
                      <div
                        key={sup.id}
                        className="proj-sup-row"
                        style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < project.suppliers.length - 1 ? '1px solid #111' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: '#141414', border: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={13} color="#444" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#d0d0d0' }}>{sup.name}</div>
                          <div style={{ fontSize: 11, color: '#3e3e3e', marginTop: 1 }}>{sup.category} · {sup.contact}</div>
                        </div>
                        <div style={{ fontSize: 10.5, padding: '3px 10px', borderRadius: 20, background: `${SUPPLIER_STATUS_COLORS[sup.status] ?? '#888'}14`, border: `1px solid ${SUPPLIER_STATUS_COLORS[sup.status] ?? '#888'}30`, color: SUPPLIER_STATUS_COLORS[sup.status] ?? '#888', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' as const }}>
                          {sup.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Diretório ARC ── */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#383838', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
                    Diretório ARC
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                    {DIR_SEGMENTS.map((seg) => {
                      const isActive = dirFilter === seg
                      return (
                        <button key={seg} onClick={() => setDirFilter(seg)} className="dir-seg-btn" style={{ background: isActive ? 'rgba(200,169,110,0.12)' : 'transparent', border: isActive ? '1px solid rgba(200,169,110,0.28)' : '1px solid #1c1c1c', color: isActive ? '#c8a96e' : '#444' }}>
                          {seg}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {SUPPLIER_DIRECTORY.filter((s) => dirFilter === 'Todos' || s.segment === dirFilter).map((sup) => (
                    <div key={sup.id} className="dir-card">
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img src={sup.cover} alt={sup.name} className="dir-card-img" />
                        <div style={{ position: 'absolute', top: 8, right: 8, background: `${sup.color}22`, border: `1px solid ${sup.color}44`, color: sup.color, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                          {sup.segment}
                        </div>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#d0d0d0', marginBottom: 4 }}>{sup.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                          <div style={{ display: 'flex', gap: 1 }}>
                            {[1,2,3,4,5].map((s) => <Star key={s} size={9} fill={s <= Math.round(sup.rating) ? '#c8a96e' : 'none'} color="#c8a96e" />)}
                          </div>
                          <span style={{ fontSize: 11, color: '#c8a96e', fontWeight: 700 }}>{sup.rating}</span>
                          <span style={{ fontSize: 10, color: '#383838' }}>({sup.reviewCount})</span>
                          <span style={{ fontSize: 10, color: '#333' }}>·</span>
                          <MapPin size={9} color="#444" />
                          <span style={{ fontSize: 10, color: '#444' }}>{sup.city}</span>
                        </div>
                        <p style={{ fontSize: 11.5, color: '#555', lineHeight: 1.55, margin: '0 0 10px' }}>{sup.description}</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link href={`/fornecedor/${sup.slug}`} target="_blank" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, padding: '6px', borderRadius: 6, background: 'transparent', border: '1px solid #1c1c1c', color: '#555', textDecoration: 'none', fontWeight: 600 }}>
                            <ExternalLink size={10} /> Ver Perfil
                          </Link>
                          <button onClick={() => setDirQuoteTarget(sup)} style={{ flex: 1, fontSize: 11, padding: '6px', borderRadius: 6, background: 'rgba(200,169,110,0.09)', border: '1px solid rgba(200,169,110,0.22)', color: '#c8a96e', cursor: 'pointer', fontWeight: 600 }}>
                            Solicitar Orçamento
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote modal */}
              {dirQuoteTarget !== null && (
                <div onClick={(e) => { if (e.target === e.currentTarget) setDirQuoteTarget(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <div className="dir-modal-box" style={{ background: '#0e0e0e', border: '1px solid #222', borderRadius: 14, width: '100%', maxWidth: 460, padding: 26 }}>
                    {dirQuoteSent ? (
                      <div style={{ textAlign: 'center' as const, padding: '20px 0' }}>
                        <CheckCircle2 size={48} color="#34d399" style={{ marginBottom: 14 }} />
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#f0f0f0', marginBottom: 6 }}>Solicitação enviada!</div>
                        <div style={{ fontSize: 12.5, color: '#555' }}>{dirQuoteTarget.name} será notificado.</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0' }}>Solicitar Orçamento</div>
                            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{dirQuoteTarget.name}</div>
                          </div>
                          <button onClick={() => setDirQuoteTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4 }}><X size={16} /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); setDirQuoteSent(true); setTimeout(() => { setDirQuoteTarget(null); setDirQuoteSent(false); setDirQuoteForm({ descricao: '', data: '' }) }, 2200) }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 5, fontWeight: 600 }}>Descrição do serviço *</label>
                            <textarea className="dir-inp" required rows={3} placeholder="Descreva o que você precisa..." value={dirQuoteForm.descricao} onChange={(e) => setDirQuoteForm((f) => ({ ...f, descricao: e.target.value }))} style={{ resize: 'vertical' as const }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 5, fontWeight: 600 }}>Data prevista de início</label>
                            <input className="dir-inp" type="date" value={dirQuoteForm.data} onChange={(e) => setDirQuoteForm((f) => ({ ...f, data: e.target.value }))} />
                          </div>
                          <button type="submit" style={{ background: '#c8a96e', color: '#080808', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                            <Send size={13} /> Enviar Solicitação
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: Calendário ══ */}
          {activeTab === 'calendario' && (
            <CalendarioObra
              events={calEvents}
              readonly={false}
              onEventAdd={async (ev) => {
                const tempId = Date.now()
                setCalEvents(prev => [...prev, { ...ev, id: tempId }])
                if (isRealProject) {
                  const supabase = createClient()
                  const { data } = await supabase.from('eventos').insert({
                    projeto_id: projectId,
                    titulo: ev.title,
                    tipo: ev.type,
                    data_inicio: ev.startDate,
                    data_fim: ev.endDate,
                    hora_inicio: ev.startTime ?? null,
                    hora_fim: ev.endTime ?? null,
                    observacao: ev.note ?? null,
                  }).select('id').single()
                  if (data) {
                    setCalEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: data.id } : e))
                  }
                }
              }}
            />
          )}

          {/* ══ TAB: Orçamento ══ */}
          {activeTab === 'orcamento' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Orçamento Total', value: effectiveBudget.total > 0 ? `R$ ${effectiveBudget.total.toLocaleString('pt-BR')}` : '—', color: '#e0e0e0' },
                  { label: 'Executado', value: effectiveBudget.spent > 0 ? `R$ ${effectiveBudget.spent.toLocaleString('pt-BR')}` : '—', color: '#c8a96e' },
                  { label: 'Saldo Disponível', value: effectiveBudget.total > 0 ? `R$ ${(effectiveBudget.total - effectiveBudget.spent).toLocaleString('pt-BR')}` : '—', color: '#34d399' },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: '#0f0f0f',
                      border: '1px solid #1c1c1c',
                      borderRadius: 10,
                      padding: '16px 18px',
                    }}
                  >
                    <div style={{ fontSize: 10.5, color: '#3a3a3a', marginBottom: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div style={{ background: '#0f0f0f', border: '1px solid #1c1c1c', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: '#4a4a4a' }}>Execução do orçamento</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#c8a96e' }}>{budgetPercent}%</span>
                </div>
                <div style={{ height: 6, background: '#181818', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${budgetPercent}%`,
                      background: 'linear-gradient(90deg, rgba(200,169,110,0.5) 0%, #c8a96e 100%)',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>

              {/* Line items */}
              {effectiveBudget.items.length > 0 && (
                <div style={panel}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', padding: '10px 20px', borderBottom: '1px solid #141414' }}>
                    {['Categoria', 'Descrição', 'Valor'].map((h) => (
                      <span key={h} style={{ fontSize: 10.5, color: '#2e2e2e', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                        {h}
                      </span>
                    ))}
                  </div>
                  {effectiveBudget.items.map((item, i) => (
                    <div
                      key={i}
                      className="proj-bud-row"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 120px',
                        padding: '13px 20px',
                        borderBottom: i < effectiveBudget.items.length - 1 ? '1px solid #111' : 'none',
                        alignItems: 'center',
                        transition: 'background 0.12s',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#ccc' }}>{item.category}</div>
                      <div style={{ fontSize: 12, color: '#404040' }}>{item.description}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#c8a96e' }}>
                        R$ {item.value.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Right sidebar ─── */}
        <div
          style={{
            width: 282,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            position: 'sticky',
            top: 108,
          }}
        >

          {/* Client card */}
          <div style={panel}>
            <div style={panelHeader}>Cliente</div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: 'rgba(200,169,110,0.1)',
                    border: '2px solid rgba(200,169,110,0.32)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#c8a96e',
                    flexShrink: 0,
                  }}
                >
                  {project.client.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#e0e0e0' }}>
                    {project.client.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#333', marginTop: 2 }}>{project.type}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: Phone, text: project.client.phone },
                  { icon: Mail, text: project.client.email },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={iconBox()}>
                      <Icon size={11} color="#555" />
                    </div>
                    <span style={{ fontSize: 12, color: '#777', wordBreak: 'break-all' as const }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <button
                style={{
                  marginTop: 14,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '9px',
                  background: 'rgba(200,169,110,0.09)',
                  border: '1px solid rgba(200,169,110,0.22)',
                  borderRadius: 8,
                  color: '#c8a96e',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(200,169,110,0.18)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(200,169,110,0.09)')}
              >
                <MessageCircle size={13} />
                Iniciar conversa
              </button>
            </div>
          </div>

          {/* Next appointment */}
          <div style={panel}>
            <div style={panelHeader}>Próximo Compromisso</div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: 'rgba(200,169,110,0.07)',
                    border: '1px solid rgba(200,169,110,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={15} color="#c8a96e" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#d5d5d5', lineHeight: 1.3 }}>
                    {project.nextMeeting.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#4a4a4a', marginTop: 4 }}>
                    {project.nextMeeting.date}
                  </div>
                  <div style={{ fontSize: 11, color: '#2e2e2e', marginTop: 2 }}>
                    {project.nextMeeting.time}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div
            style={{
              background: '#0f0f0f',
              border: '1px solid #1c1c1c',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 11,
            }}
          >
            {[
              { label: 'Progresso', value: `${progress}%` },
              { label: 'Área total', value: project.area },
              { label: 'Etapa atual', value: STAGES[stageIndex] },
              { label: 'Orçamento exec.', value: `${budgetPercent}%` },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: 11.5, color: '#3a3a3a' }}>{stat.label}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#c8a96e' }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Avançar etapa */}
          {stageIndex < STAGES.length - 1 && (
            <button
              onClick={handleAdvanceStage}
              disabled={advancingStage}
              style={{
                width: '100%', padding: '12px', borderRadius: 9,
                background: stageAdvanced ? 'rgba(52,211,153,0.12)' : advancingStage ? '#111' : 'rgba(200,169,110,0.1)',
                border: stageAdvanced ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(200,169,110,0.28)',
                color: stageAdvanced ? '#34d399' : advancingStage ? '#555' : '#c8a96e',
                fontSize: 12.5, fontWeight: 700, cursor: advancingStage ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {stageAdvanced ? (
                <><CheckCircle2 size={14} /> ETAPA AVANÇADA</>
              ) : advancingStage ? (
                <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> SALVANDO...</>
              ) : (
                <>→ Avançar para {STAGES[stageIndex + 1]}</>
              )}
            </button>
          )}
          {stageIndex === STAGES.length - 1 && (
            <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 9, background: 'rgba(52,211,153,0.06)' }}>
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Projeto concluído
            </div>
          )}

          {/* Calendário da semana */}
          <div style={panel}>
            <div style={panelHeader}>Calendário da Semana</div>
            <div style={{ padding: '4px 0' }}>
              {next7.map(({ date, dStr, isToday, dayEvents }) => {
                const weekLabel = date.toLocaleDateString('pt-BR', { weekday: 'short' })
                const dayNum = date.getDate()
                const hasEvents = dayEvents.length > 0
                return (
                  <div
                    key={dStr}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '8px 14px',
                      borderBottom: `1px solid #111`,
                      opacity: !hasEvents && !isToday ? 0.35 : 1,
                    }}
                  >
                    {/* Date column */}
                    <div style={{ flexShrink: 0, width: 28, textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: '#3a3a3a',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          fontWeight: 600,
                        }}
                      >
                        {weekLabel.replace('.', '')}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: isToday ? '#c8a96e' : '#2e2e2e',
                          lineHeight: 1.1,
                          marginTop: 1,
                        }}
                      >
                        {dayNum}
                      </div>
                    </div>

                    {/* Events column */}
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                      {!hasEvents ? (
                        <div style={{ fontSize: 10.5, color: '#1e1e1e', paddingTop: 4 }}>—</div>
                      ) : (
                        dayEvents.map((ev) => {
                          const color = EVENT_META[ev.type].color
                          return (
                            <div
                              key={ev.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                marginBottom: 4,
                              }}
                            >
                              <div
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: '50%',
                                  background: color,
                                  flexShrink: 0,
                                  boxShadow: `0 0 4px ${color}66`,
                                }}
                              />
                              <div
                                style={{
                                  fontSize: 11,
                                  color,
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  flex: 1,
                                }}
                              >
                                {ev.title}
                              </div>
                              {ev.startTime && (
                                <div
                                  style={{ fontSize: 9.5, color: '#2e2e2e', flexShrink: 0 }}
                                >
                                  {ev.startTime}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
