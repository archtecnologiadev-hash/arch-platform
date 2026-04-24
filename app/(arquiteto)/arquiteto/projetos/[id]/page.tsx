'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Upload, FileText, ImageIcon, File, MessageCircle,
  Mail, Calendar, Plus, Package, DollarSign, Check, Pencil,
  Star, ExternalLink, Send, X, CheckCircle2, MapPin, Loader2,
  Download, AlertCircle, Heart, ChevronLeft, ChevronDown, UserPlus, Search, History,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import CalendarioObra, { CalendarioEvent, EVENT_META, EventType, getMeta } from '@/components/shared/CalendarioObra'
import { createClient } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjetoReal {
  id: string
  nome: string
  tipo: string | null
  etapa_atual: string | null
  status: string
  cliente_id: string | null
  cover_url: string | null
  created_at: string
  descricao: string | null
  metragem: number | null
  endereco: string | null
  email_cliente: string | null
  tipo_contrato: string | null
}

interface HistoricoItem {
  id: string
  acao: string
  detalhe: string | null
  created_at: string
  usuario_nome?: string
}

interface ClienteInfo {
  nome: string
  email: string
}

interface ArquivoProjeto {
  id: string
  nome: string
  url: string
  tipo: string | null
  tamanho: number | null
  enviado_por_nome: string | null
  created_at: string
}

interface AnotacaoProjeto {
  id: string
  texto: string
  autor_nome: string | null
  created_at: string
}

interface OrcItem {
  id: string
  categoria: string
  descricao: string
  valor: number
  quantidade: number | null
  observacao: string | null
  created_at: string
}

interface ProjetoMembro {
  id: string
  user_id: string
  papel: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users: any
}

interface DirSupplier {
  id: number; slug: string; name: string; segment: string; city: string
  rating: number; reviewCount: number; description: string; cover: string; color: string
  logo?: string | null
  isReal?: boolean
  dbId?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = ['Atendimento', 'Reunião', 'Briefing', '3D', 'Alteração 3D', 'Detalhamento', 'Orçamento', 'Execução']

const TIPO_LABEL_MAP: Record<string, string> = {
  residencial: 'Residencial', comercial: 'Comercial', institucional: 'Institucional',
}

const SUPPLIER_DIRECTORY: DirSupplier[] = [
  { id: 1, slug: 'marcenaria-silva',     name: 'Marcenaria Silva & Filhos', segment: 'Marcenaria', city: 'São Paulo, SP', rating: 4.9, reviewCount: 47,  description: 'Móveis planejados e marcenaria fina para projetos de alto padrão.',        cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', color: '#4f9cf9' },
  { id: 2, slug: 'eletrica-voltagem',    name: 'Elétrica Voltagem',         segment: 'Elétrica',   city: 'São Paulo, SP', rating: 4.7, reviewCount: 89,  description: 'Instalações elétricas e automação residencial de alto padrão.',         cover: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80', color: '#34d399' },
  { id: 3, slug: 'vidracaria-cristal',   name: 'Vidraçaria Cristal',        segment: 'Vidraçaria', city: 'São Paulo, SP', rating: 4.8, reviewCount: 63,  description: 'Vidros temperados, laminados e esquadrias de alumínio linha pesada.', cover: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80', color: '#a78bfa' },
  { id: 4, slug: 'gesseiro-acabamentos', name: 'Gesseiro Acabamentos Pro',  segment: 'Gesseiro',   city: 'Campinas, SP',  rating: 4.6, reviewCount: 34,  description: 'Tetos rebaixados, dry wall e sancas com acabamento milimétrico.',      cover: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80', color: '#f97316' },
  { id: 5, slug: 'pintura-arte-final',   name: 'Pintura Arte Final',        segment: 'Pintura',    city: 'São Paulo, SP', rating: 4.9, reviewCount: 112, description: 'Pintura premium, texturas especiais e acabamentos diferenciados.',     cover: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=400&q=80', color: '#ef4444' },
]

const DIR_SEGMENTS = ['Todos', 'Marcenaria', 'Elétrica', 'Vidraçaria', 'Gesseiro', 'Pintura', 'Iluminação', 'Outro']

const SEG_COLOR: Record<string, string> = {
  Marcenaria: '#4f9cf9', Elétrica: '#34d399', Vidraçaria: '#a78bfa',
  Gesseiro: '#f97316', Pintura: '#ef4444', Iluminação: '#007AFF', Outro: '#6b6b6b',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectTipo(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
  if (['dwg', 'dxf'].includes(ext)) return 'dwg'
  return 'file'
}

function fmtBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileTypeIcon({ tipo }: { tipo: string | null }) {
  if (tipo === 'pdf') return <FileText size={15} color="#ef4444" />
  if (tipo === 'image') return <ImageIcon size={15} color="#34d399" />
  if (tipo === 'dwg') return <File size={15} color="#4f9cf9" />
  return <File size={15} color="#6b6b6b" />
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const panel = { background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden' as const, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
const panelHeader = { padding: '13px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', fontSize: 11, color: '#8e8e93', fontWeight: 600 as const, letterSpacing: '0.07em', textTransform: 'uppercase' as const }
const iconBox = (color = '#6b6b6b') => ({ width: 28, height: 28, borderRadius: 7, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 as const, color })

type TabId = 'arquivos' | 'anotacoes' | 'fornecedores' | 'calendario' | 'orcamento'
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'arquivos',    label: 'Arquivos',    icon: File },
  { id: 'anotacoes',  label: 'Anotações',   icon: Pencil },
  { id: 'fornecedores', label: 'Fornecedores', icon: Package },
  { id: 'calendario', label: 'Calendário',  icon: Calendar },
  { id: 'orcamento',  label: 'Orçamento',   icon: DollarSign },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjetoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = (params?.id as string) ?? ''

  const [loading, setLoading] = useState(true)
  const [projeto, setProjeto] = useState<ProjetoReal | null>(null)
  const [cliente, setCliente] = useState<ClienteInfo | null>(null)
  const [arquivos, setArquivos] = useState<ArquivoProjeto[]>([])
  const [anotacoes, setAnotacoes] = useState<AnotacaoProjeto[]>([])
  const [calEvents, setCalEvents] = useState<CalendarioEvent[]>([])
  const [orcItems, setOrcItems] = useState<OrcItem[]>([])
  const [orcForm, setOrcForm] = useState({ categoria: 'Projeto', descricao: '', valor: '', quantidade: '1', observacao: '' })
  const [orcSaving, setOrcSaving] = useState(false)
  const [orcModal, setOrcModal] = useState(false)
  const [orcEditItem, setOrcEditItem] = useState<OrcItem | null>(null)
  const [orcExpandedCats, setOrcExpandedCats] = useState<Set<string>>(new Set(['Projeto', 'Execução', 'Marcenaria', 'Decoração', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros']))
  const [currentUser, setCurrentUser] = useState<{ id: string; nome: string } | null>(null)
  const [stageIndex, setStageIndex] = useState(0)

  const [activeTab, setActiveTab] = useState<TabId>('arquivos')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [advancingStage, setAdvancingStage] = useState(false)
  const [stageAdvanced, setStageAdvanced] = useState(false)
  const [regressingStage, setRegressingStage] = useState(false)

  // Edit project modal
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nome: '', tipo: 'residencial', descricao: '', metragem: '', endereco: '', email_cliente: '', tipo_contrato: '' })
  const [editSaving, setEditSaving] = useState(false)

  // Link client modal
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkTab, setLinkTab] = useState<'buscar' | 'convidar'>('buscar')
  const [linkQuery, setLinkQuery] = useState('')
  const [linkResults, setLinkResults] = useState<Array<{ id: string; nome: string; email: string }>>([])
  const [linkSearching, setLinkSearching] = useState(false)
  const [linkInviteEmail, setLinkInviteEmail] = useState('')
  const [linkInviting, setLinkInviting] = useState(false)
  const [linkInviteSent, setLinkInviteSent] = useState(false)
  const [linkingId, setLinkingId] = useState<string | null>(null)

  // Historico
  const [historico, setHistorico] = useState<HistoricoItem[]>([])

  // Sidebar event edit modal
  const [sidebarEditTarget, setSidebarEditTarget] = useState<CalendarioEvent | null>(null)
  const [sidebarEditForm, setSidebarEditForm] = useState({ type: 'arquiteto' as EventType, title: '', provider: '', startDate: '', endDate: '', startTime: '08:00', endTime: '17:00', note: '' })
  const [sidebarEditSaving, setSidebarEditSaving] = useState(false)
  const [sidebarEditDeleting, setSidebarEditDeleting] = useState(false)

  const [projetoMembros, setProjetoMembros] = useState<ProjetoMembro[]>([])
  const [membrosEscritorio, setMembrosEscritorio] = useState<Array<{ id: string; nome: string; cargo: string | null }>>([])
  const [addMembroOpen, setAddMembroOpen] = useState(false)
  const [addMembroId, setAddMembroId] = useState('')
  const [addMembroPapel, setAddMembroPapel] = useState('')
  const [addMembroSaving, setAddMembroSaving] = useState(false)

  const [dirFilter, setDirFilter] = useState('Todos')
  const [dirQuoteTarget, setDirQuoteTarget] = useState<DirSupplier | null>(null)
  const [dirQuoteForm, setDirQuoteForm] = useState({ descricao: '', data: '' })
  const [dirQuoteFile, setDirQuoteFile] = useState<File | null>(null)
  const [dirQuoteSending, setDirQuoteSending] = useState(false)
  const [dirQuoteSent, setDirQuoteSent] = useState(false)
  const dirQuoteFileRef = useRef<HTMLInputElement>(null)

  const [dbSuppliers, setDbSuppliers] = useState<DirSupplier[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!projectId) return
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const nome = user.user_metadata?.nome ?? user.email ?? 'Arquiteto'
        setCurrentUser({ id: user.id, nome })
      }
      const currentUid = user?.id ?? ''

      const [
        { data: proj },
        { data: evs },
        { data: arqs },
        { data: anots },
        { data: forn },
        { data: favs },
        { data: orcData },
        { data: histData },
      ] = await Promise.all([
        supabase.from('projetos').select('*').eq('id', projectId).single(),
        supabase.from('eventos').select('*').eq('projeto_id', projectId).order('data_inicio'),
        supabase.from('arquivos_projeto').select('*').eq('projeto_id', projectId).order('created_at', { ascending: false }),
        supabase.from('anotacoes_projeto').select('*').eq('projeto_id', projectId).order('created_at', { ascending: false }),
        supabase.from('fornecedores').select('id, slug, nome, segmento, cidade, bio, image_url, cover_url').order('created_at', { ascending: false }),
        currentUid ? supabase.from('fornecedores_favoritos').select('fornecedor_id').eq('arquiteto_id', currentUid) : Promise.resolve({ data: [] as Array<{ fornecedor_id: string }> }),
        supabase.from('orcamento_itens').select('*').eq('projeto_id', projectId).order('created_at'),
        supabase.from('projeto_historico').select('*').eq('projeto_id', projectId).order('created_at', { ascending: false }).limit(30),
      ])

      if (proj) {
        setProjeto(proj as ProjetoReal)
        const idx = STAGES.findIndex(s => s.toLowerCase() === (proj.etapa_atual ?? '').toLowerCase())
        if (idx >= 0) setStageIndex(idx)
        setEditForm({
          nome: proj.nome ?? '',
          tipo: proj.tipo ?? 'residencial',
          descricao: proj.descricao ?? '',
          metragem: proj.metragem != null ? String(proj.metragem) : '',
          endereco: proj.endereco ?? '',
          email_cliente: proj.email_cliente ?? '',
          tipo_contrato: proj.tipo_contrato ?? '',
        })

        if (proj.cliente_id) {
          const { data: cli } = await supabase
            .from('users').select('nome, email').eq('id', proj.cliente_id).single()
          if (cli) setCliente(cli as ClienteInfo)
        }
      }

      if (evs) {
        setCalEvents(evs.map((e: Record<string, unknown>) => ({
          id: e.id as number,
          type: e.tipo as EventType,
          title: e.titulo as string,
          provider: (e.observacao as string) ?? '',
          startDate: e.data_inicio as string,
          endDate: e.data_fim as string,
          startTime: (e.hora_inicio as string) ?? undefined,
          endTime: (e.hora_fim as string) ?? undefined,
          note: (e.observacao as string) ?? undefined,
        })))
      }
      if (arqs) setArquivos(arqs as ArquivoProjeto[])
      if (anots) setAnotacoes(anots as AnotacaoProjeto[])
      if (orcData) setOrcItems(orcData as OrcItem[])
      if (histData) setHistorico(histData as HistoricoItem[])
      if (favs) {
        const favSet = new Set((favs as Array<{ fornecedor_id: string }>).map(r => r.fornecedor_id))
        setFavorites(favSet)
      }
      if (forn && forn.length > 0) {
        setDbSuppliers(forn.map((f: Record<string, unknown>, i: number) => ({
          id: i + 1,
          slug: (f.slug as string) ?? '',
          name: (f.nome as string) ?? '—',
          segment: (f.segmento as string) ?? 'Outro',
          city: (f.cidade as string) ?? '—',
          rating: 0,
          reviewCount: 0,
          description: (f.bio as string) ?? '',
          cover: (f.cover_url as string) ?? '',
          color: SEG_COLOR[(f.segmento as string) ?? ''] ?? '#6b6b6b',
          logo: f.image_url as string | null,
          isReal: true,
          dbId: f.id as string,
        })))
      }
      // Load projeto_membros and available escritório members
      const { data: pmData } = await supabase
        .from('projeto_membros')
        .select('id, user_id, papel, users(nome, cargo, nivel_permissao)')
        .eq('projeto_id', projectId)
      if (pmData) setProjetoMembros(pmData as ProjetoMembro[])

      // Load escritório members for the "add" dropdown
      if (proj?.escritorio_id) {
        const { data: emData } = await supabase
          .from('users').select('id, nome, cargo')
          .or(`escritorio_vinculado_id.eq.${proj.escritorio_id}`)
        if (emData) setMembrosEscritorio(emData as Array<{ id: string; nome: string; cargo: string | null }>)
      }

      setLoading(false)
    }
    loadData()
  }, [projectId])

  async function handleAddMembro() {
    if (!addMembroId || addMembroSaving) return
    setAddMembroSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('projeto_membros').insert({
      projeto_id: projectId, user_id: addMembroId, papel: addMembroPapel || null,
    }).select('id, user_id, papel, users(nome, cargo, nivel_permissao)').single()
    if (data) setProjetoMembros(prev => [...prev, data as ProjetoMembro])
    setAddMembroOpen(false); setAddMembroId(''); setAddMembroPapel('')
    setAddMembroSaving(false)
  }

  async function handleRemoveMembro(id: string) {
    const supabase = createClient()
    await supabase.from('projeto_membros').delete().eq('id', id)
    setProjetoMembros(prev => prev.filter(m => m.id !== id))
  }

  async function handleEventEdit(ev: CalendarioEvent) {
    const supabase = createClient()
    await supabase.from('eventos').update({
      titulo: ev.title, tipo: ev.type,
      data_inicio: ev.startDate, data_fim: ev.endDate,
      hora_inicio: ev.startTime ?? null, hora_fim: ev.endTime ?? null, observacao: ev.note ?? null,
    }).eq('id', ev.id)
    setCalEvents(prev => prev.map(e => e.id === ev.id ? ev : e))
  }

  async function handleEventDelete(id: number) {
    const supabase = createClient()
    await supabase.from('eventos').delete().eq('id', id)
    setCalEvents(prev => prev.filter(e => e.id !== id))
  }

  async function handleSidebarEditSave() {
    if (!sidebarEditTarget) return
    setSidebarEditSaving(true)
    const ev = { ...sidebarEditForm, id: sidebarEditTarget.id }
    await handleEventEdit(ev)
    setSidebarEditTarget(null)
    setSidebarEditSaving(false)
  }

  async function handleSidebarEditDelete() {
    if (!sidebarEditTarget) return
    setSidebarEditDeleting(true)
    await handleEventDelete(sidebarEditTarget.id)
    setSidebarEditTarget(null)
    setSidebarEditDeleting(false)
  }

  async function toggleFavorite(fornecedorDbId: string) {
    if (!currentUser) return
    const supabase = createClient()
    const isFav = favorites.has(fornecedorDbId)
    if (isFav) {
      await supabase.from('fornecedores_favoritos')
        .delete()
        .eq('arquiteto_id', currentUser.id)
        .eq('fornecedor_id', fornecedorDbId)
      setFavorites(prev => { const s = new Set(prev); s.delete(fornecedorDbId); return s })
    } else {
      await supabase.from('fornecedores_favoritos')
        .insert({ arquiteto_id: currentUser.id, fornecedor_id: fornecedorDbId })
      setFavorites(prev => new Set(Array.from(prev).concat(fornecedorDbId)))
    }
  }

  async function handleIniciarConversa(participanteId: string, tipo: 'cliente' | 'fornecedor', fornecedorDbId?: string) {
    if (!currentUser) return
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('conversas')
      .select('id')
      .eq('arquiteto_id', currentUser.id)
      .eq('participante_id', participanteId)
      .maybeSingle()
    let convId: string
    if (existing) {
      convId = existing.id
    } else {
      const { data: created } = await supabase
        .from('conversas')
        .insert({
          arquiteto_id: currentUser.id,
          participante_id: participanteId,
          tipo,
          fornecedor_id: fornecedorDbId ?? null,
        })
        .select('id')
        .single()
      convId = created?.id
    }
    if (convId) router.push(`/arquiteto/mensagens?c=${convId}`)
  }

  async function handleMensagemFornecedor(fornecedorDbId: string) {
    if (!currentUser) return
    const supabase = createClient()
    const { data: forn } = await supabase
      .from('fornecedores').select('user_id').eq('id', fornecedorDbId).single()
    if (!forn?.user_id) return
    await handleIniciarConversa(forn.user_id, 'fornecedor', fornecedorDbId)
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length || !currentUser || !projeto) return
    setUploading(true)
    setUploadError(null)
    const supabase = createClient()

    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_')
      const path = `${currentUser.id}/${projeto.id}/${Date.now()}_${safeName}`
      const { error: upErr } = await supabase.storage.from('projetos').upload(path, file, { upsert: false })
      if (upErr) {
        console.error('[arquivos] upload error:', upErr)
        setUploadError(`Erro ao enviar ${file.name}: ${upErr.message}`)
        continue
      }
      const { data: { publicUrl } } = supabase.storage.from('projetos').getPublicUrl(path)
      const { data: arq, error: dbErr } = await supabase
        .from('arquivos_projeto')
        .insert({ projeto_id: projeto.id, nome: file.name, url: publicUrl, tipo: detectTipo(file.name), tamanho: file.size, enviado_por: currentUser.id, enviado_por_nome: currentUser.nome })
        .select('*').single()
      if (!dbErr && arq) setArquivos(prev => [arq as ArquivoProjeto, ...prev])
    }
    setUploading(false)
  }

  async function addNote() {
    if (!noteText.trim() || !projeto || !currentUser) return
    setSavingNote(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('anotacoes_projeto')
      .insert({ projeto_id: projeto.id, texto: noteText.trim(), autor_id: currentUser.id, autor_nome: currentUser.nome })
      .select('*').single()
    if (!error && data) {
      setAnotacoes(prev => [data as AnotacaoProjeto, ...prev])
      setNoteText('')
    }
    setSavingNote(false)
  }

  async function logHistorico(acao: string, detalhe?: string) {
    if (!currentUser || !projeto) return
    const supabase = createClient()
    const { data } = await supabase.from('projeto_historico')
      .insert({ projeto_id: projeto.id, usuario_id: currentUser.id, acao, detalhe: detalhe ?? null })
      .select('*').single()
    if (data) setHistorico(prev => [data as HistoricoItem, ...prev])
  }

  async function handleAdvanceStage() {
    if (!projeto || stageIndex >= STAGES.length - 1) return
    setAdvancingStage(true)
    const next = stageIndex + 1
    const supabase = createClient()
    await supabase.from('projetos').update({ etapa_atual: STAGES[next] }).eq('id', projeto.id)
    setStageIndex(next)
    setProjeto(prev => prev ? { ...prev, etapa_atual: STAGES[next] } : prev)
    await logHistorico('Etapa avançada', `${STAGES[stageIndex]} → ${STAGES[next]}`)
    setAdvancingStage(false)
    setStageAdvanced(true)
    setTimeout(() => setStageAdvanced(false), 2500)
  }

  async function handleRegressStage() {
    if (!projeto || stageIndex <= 0) return
    setRegressingStage(true)
    const prev = stageIndex - 1
    const supabase = createClient()
    await supabase.from('projetos').update({ etapa_atual: STAGES[prev] }).eq('id', projeto.id)
    setStageIndex(prev)
    setProjeto(p => p ? { ...p, etapa_atual: STAGES[prev] } : p)
    await logHistorico('Etapa retrocedida', `${STAGES[stageIndex]} → ${STAGES[prev]}`)
    setRegressingStage(false)
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!projeto || !editForm.nome.trim()) return
    setEditSaving(true)
    const supabase = createClient()
    const updates = {
      nome: editForm.nome.trim(),
      tipo: editForm.tipo,
      descricao: editForm.descricao || null,
      metragem: editForm.metragem ? parseFloat(editForm.metragem) : null,
      endereco: editForm.endereco || null,
      email_cliente: editForm.email_cliente || null,
      tipo_contrato: editForm.tipo_contrato || null,
    }
    const { error } = await supabase.from('projetos').update(updates).eq('id', projeto.id)
    if (!error) {
      setProjeto(prev => prev ? { ...prev, ...updates } : prev)
      await logHistorico('Projeto editado', `Nome: ${updates.nome}`)
      setEditOpen(false)
    }
    setEditSaving(false)
  }

  async function handleLinkSearch() {
    if (!linkQuery.trim()) return
    setLinkSearching(true)
    const supabase = createClient()
    const q = linkQuery.trim().toLowerCase()
    const { data } = await supabase.from('users')
      .select('id, nome, email')
      .eq('tipo', 'cliente')
      .or(`email.ilike.%${q}%,nome.ilike.%${q}%`)
      .limit(10)
    setLinkResults((data ?? []) as Array<{ id: string; nome: string; email: string }>)
    setLinkSearching(false)
  }

  async function handleLinkClient(userId: string, userName: string, userEmail: string) {
    if (!projeto) return
    setLinkingId(userId)
    const supabase = createClient()
    await supabase.from('projetos')
      .update({ cliente_id: userId, email_cliente: userEmail })
      .eq('id', projeto.id)
    setProjeto(prev => prev ? { ...prev, cliente_id: userId, email_cliente: userEmail } : prev)
    setCliente({ nome: userName, email: userEmail })
    await logHistorico('Cliente vinculado', userName)
    setLinkingId(null)
    setLinkOpen(false)
  }

  async function handleInviteClient() {
    if (!linkInviteEmail.trim() || !projeto) return
    setLinkInviting(true)
    const supabase = createClient()
    await supabase.from('projetos').update({ email_cliente: linkInviteEmail.trim() }).eq('id', projeto.id)
    setProjeto(prev => prev ? { ...prev, email_cliente: linkInviteEmail.trim() } : prev)
    await logHistorico('Convite enviado', linkInviteEmail.trim())
    setLinkInviting(false)
    setLinkInviteSent(true)
    setTimeout(() => { setLinkOpen(false); setLinkInviteSent(false); setLinkInviteEmail('') }, 2500)
  }

  async function handleSendQuote(e: React.FormEvent) {
    e.preventDefault()
    if (!dirQuoteTarget || !projeto || !currentUser) return
    setDirQuoteSending(true)
    const supabase = createClient()

    let arquivoUrl: string | null = null
    if (dirQuoteFile) {
      const safeName = dirQuoteFile.name.replace(/[^a-zA-Z0-9._\-]/g, '_')
      const path = `${currentUser.id}/${projeto.id}/${Date.now()}_${safeName}`
      const { error: upErr } = await supabase.storage.from('orcamentos').upload(path, dirQuoteFile)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('orcamentos').getPublicUrl(path)
        arquivoUrl = publicUrl
      }
    }

    if (dirQuoteTarget.dbId) {
      await supabase.from('orcamentos').insert({
        projeto_id: projeto.id,
        fornecedor_id: dirQuoteTarget.dbId,
        arquiteto_id: currentUser.id,
        mensagem: dirQuoteForm.descricao,
        arquivo_url: arquivoUrl,
        status: 'pendente',
      })
    } else {
      await supabase.from('solicitacoes_orcamento').insert({
        projeto_id: projeto.id,
        fornecedor_slug: dirQuoteTarget.slug,
        fornecedor_nome: dirQuoteTarget.name,
        descricao: dirQuoteForm.descricao,
        data_prevista: dirQuoteForm.data || null,
        arquivo_url: arquivoUrl,
        solicitante_id: currentUser.id,
      })
    }

    setDirQuoteSending(false)
    setDirQuoteSent(true)
    setTimeout(() => {
      setDirQuoteTarget(null)
      setDirQuoteSent(false)
      setDirQuoteForm({ descricao: '', data: '' })
      setDirQuoteFile(null)
    }, 2200)
  }

  const progress = Math.round(((stageIndex + 1) / STAGES.length) * 100)
  const displayName = projeto?.nome ?? '...'
  const displayType = projeto?.tipo ? (TIPO_LABEL_MAP[projeto.tipo] ?? projeto.tipo) : '—'

  const todayBase = new Date()
  const next7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayBase)
    d.setDate(todayBase.getDate() + i)
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { date: d, dStr, isToday: i === 0, dayEvents: calEvents.filter(e => e.startDate <= dStr && e.endDate >= dStr) }
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f2f7' }}>
        <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!projeto) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, background: '#f2f2f7' }}>
        <AlertCircle size={36} color="#8e8e93" />
        <p style={{ fontSize: 14, color: '#6b6b6b' }}>Projeto não encontrado.</p>
        <Link href="/arquiteto/projetos" style={{ fontSize: 13, color: '#007AFF', textDecoration: 'none' }}>← Voltar</Link>
      </div>
    )
  }

  const clientInitials = cliente ? cliente.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', color: '#1a1a1a' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(0,122,255,0.4)} 70%{box-shadow:0 0 0 8px rgba(0,122,255,0)} 100%{box-shadow:0 0 0 0 rgba(0,122,255,0)} }
        .stage-pulse { animation: pulse-ring 1.8s ease-out infinite; }
        .proj-file-row:hover  { background: #f2f2f7 !important; }
        .proj-note-card:hover { border-color: rgba(0,122,255,0.25) !important; }
        .proj-back-btn:hover  { color: #1a1a1a !important; border-color: rgba(0,0,0,0.18) !important; }
        .dir-card { background:#fff; border:1px solid rgba(0,0,0,0.08); border-radius:10px; overflow:hidden; transition:border-color 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
        .dir-card:hover { border-color:rgba(0,122,255,0.25); box-shadow:0 8px 24px rgba(0,0,0,0.12); }
        .dir-card-img { width:100%; height:100px; object-fit:cover; display:block; transition:transform 0.4s; }
        .dir-card:hover .dir-card-img { transform:scale(1.05); }
        .dir-seg-btn { padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; cursor:pointer; transition:all 0.15s; }
        .dir-inp { width:100%; background:#f2f2f7; border:1px solid rgba(0,0,0,0.08); border-radius:7px; padding:9px 12px; color:#1a1a1a; font-size:13px; outline:none; transition:border-color 0.15s; box-sizing:border-box; font-family:inherit; }
        .dir-inp:focus { border-color:rgba(0,122,255,0.4); }
        @keyframes dir-modal-in { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .dir-modal-box { animation: dir-modal-in 0.2s ease; }
      `}</style>

      {/* ═══════════════════ CLEAN HEADER ═══════════════════ */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '20px 28px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <Link href="/arquiteto/projetos" className="proj-back-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8e8e93', textDecoration: 'none', marginBottom: 14, transition: 'color 0.15s' }}>
          <ArrowLeft size={12} /> Projetos
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 7px', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#6b6b6b', flexWrap: 'wrap' }}>
              <span style={{ color: '#007AFF', fontWeight: 600 }}>{STAGES[stageIndex]}</span>
              {displayType !== '—' && (
                <><span style={{ color: 'rgba(0,0,0,0.18)' }}>·</span><span>{displayType}</span></>
              )}
              {cliente && (
                <><span style={{ color: 'rgba(0,0,0,0.18)' }}>·</span><span>{cliente.nome}</span></>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={() => { setEditForm({ nome: projeto.nome, tipo: projeto.tipo ?? 'residencial', descricao: projeto.descricao ?? '', metragem: projeto.metragem != null ? String(projeto.metragem) : '', endereco: projeto.endereco ?? '', email_cliente: projeto.email_cliente ?? '', tipo_contrato: projeto.tipo_contrato ?? '' }); setEditOpen(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '7px 13px', borderRadius: 8, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', color: '#6b6b6b', cursor: 'pointer' }}>
              <Pencil size={12} /> Editar
            </button>
            <div style={{ fontSize: 11, fontWeight: 700, padding: '7px 16px', borderRadius: 22, background: 'rgba(0,122,255,0.08)', border: '1.5px solid rgba(0,122,255,0.25)', color: '#007AFF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {STAGES[stageIndex]}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ TIMELINE ═══════════════════ */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 28px', position: 'sticky', top: 0, zIndex: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', overflowX: 'auto' }}>
          {STAGES.map((stage, i) => {
            const done = i < stageIndex
            const current = i === stageIndex
            return (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: i < STAGES.length - 1 ? '1 1 0' : '0 0 auto', minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <div className={current ? 'stage-pulse' : ''} style={{ width: 26, height: 26, borderRadius: '50%', background: done ? '#007AFF' : current ? 'rgba(0,122,255,0.12)' : '#f2f2f7', border: `2px solid ${done ? '#007AFF' : current ? '#007AFF' : 'rgba(0,0,0,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {done ? <Check size={12} color="#fff" strokeWidth={3} /> : current ? <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#007AFF' }} /> : <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(0,0,0,0.2)' }} />}
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: current ? 700 : 400, color: done ? '#007AFF' : current ? '#1a1a1a' : '#8e8e93', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{stage}</div>
                </div>
                {i < STAGES.length - 1 && <div style={{ flex: 1, height: 2, marginBottom: 18, background: done ? '#007AFF' : 'rgba(0,0,0,0.08)', minWidth: 6 }} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════ BODY ═══════════════════ */}
      <div style={{ display: 'flex', gap: 20, padding: '24px 28px', alignItems: 'flex-start' }}>

        {/* ─── Main content ─── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 22, background: '#fff', borderRadius: '12px 12px 0 0', padding: '0 4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', background: 'transparent', border: 'none', borderBottom: `2px solid ${active ? '#007AFF' : 'transparent'}`, color: active ? '#007AFF' : '#8e8e93', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', marginBottom: -1, transition: 'color 0.15s' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#6b6b6b' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#8e8e93' }}>
                  <Icon size={13} />{tab.label}
                </button>
              )
            })}
          </div>

          {/* ══ TAB: Arquivos ══ */}
          {activeTab === 'arquivos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input ref={fileInputRef} type="file" multiple accept="*/*" style={{ display: 'none' }}
                onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? '#007AFF' : 'rgba(0,0,0,0.15)'}`, borderRadius: 12, padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', background: dragOver ? 'rgba(0,122,255,0.04)' : '#fff', transition: 'border-color 0.2s, background 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {uploading ? <Loader2 size={18} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} color="#007AFF" />}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a' }}>{uploading ? 'Enviando...' : 'Arraste arquivos aqui'}</div>
                  <div style={{ fontSize: 11.5, color: '#8e8e93', marginTop: 3 }}>ou clique para selecionar · PDF, DWG, JPG, PNG e outros</div>
                </div>
              </div>

              {uploadError && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>
                  {uploadError}
                </div>
              )}

              {/* File list */}
              <div style={panel}>
                <div style={{ padding: '13px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Arquivos do Projeto</span>
                  <span style={{ fontSize: 11, color: '#8e8e93' }}>{arquivos.length} arquivo{arquivos.length !== 1 ? 's' : ''}</span>
                </div>
                {arquivos.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>Nenhum arquivo enviado ainda</div>
                ) : arquivos.map((file, i) => (
                  <div key={file.id} className="proj-file-row" style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 13, borderBottom: i < arquivos.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', transition: 'background 0.12s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileTypeIcon tipo={file.tipo} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.nome}</div>
                      <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>
                        {fmtBytes(file.tamanho)}{file.enviado_por_nome ? ` · ${file.enviado_por_nome}` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#8e8e93', flexShrink: 0 }}>
                      {new Date(file.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </div>
                    <a href={file.url} download={file.nome} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#007AFF', textDecoration: 'none' }}>
                      <Download size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB: Anotações ══ */}
          {activeTab === 'anotacoes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={panel}>
                <div style={{ padding: 16 }}>
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Escreva uma anotação sobre este projeto..." rows={4} style={{ width: '100%', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '11px 13px', color: '#1a1a1a', fontSize: 13, resize: 'vertical' as const, outline: 'none', fontFamily: 'inherit', lineHeight: 1.65, boxSizing: 'border-box' as const, transition: 'border-color 0.15s' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,122,255,0.4)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button onClick={addNote} disabled={savingNote || !noteText.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '7px 15px', borderRadius: 7, background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.25)', color: '#007AFF', cursor: savingNote ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: !noteText.trim() ? 0.5 : 1 }}>
                      {savingNote ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={12} />}
                      Salvar anotação
                    </button>
                  </div>
                </div>
              </div>

              {anotacoes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8e8e93', fontSize: 13 }}>Nenhuma anotação ainda</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {anotacoes.map(note => {
                    const initials = (note.autor_nome ?? 'U').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                    return (
                      <div key={note.id} className="proj-note-card" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px', transition: 'border-color 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <div style={{ fontSize: 13.5, color: '#1a1a1a', lineHeight: 1.65 }}>{note.texto}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, paddingTop: 11, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, fontWeight: 700, color: '#007AFF' }}>{initials}</div>
                          <span style={{ fontSize: 11, color: '#6b6b6b' }}>{note.autor_nome ?? 'Arquiteto'}</span>
                          <span style={{ color: 'rgba(0,0,0,0.15)' }}>·</span>
                          <span style={{ fontSize: 11, color: '#8e8e93' }}>{new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span style={{ color: 'rgba(0,0,0,0.15)' }}>·</span>
                          <span style={{ fontSize: 11, color: '#8e8e93' }}>{new Date(note.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: Fornecedores ══ */}
          {activeTab === 'fornecedores' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8e8e93', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>Diretório ARC</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                    {DIR_SEGMENTS.map(seg => {
                      const isActive = dirFilter === seg
                      return <button key={seg} onClick={() => setDirFilter(seg)} className="dir-seg-btn" style={{ background: isActive ? 'rgba(0,122,255,0.1)' : 'transparent', border: isActive ? '1px solid rgba(0,122,255,0.25)' : '1px solid rgba(0,0,0,0.08)', color: isActive ? '#007AFF' : '#6b6b6b' }}>{seg}</button>
                    })}
                  </div>
                </div>
                {(() => {
                  const sourceList = dbSuppliers.length > 0 ? dbSuppliers : SUPPLIER_DIRECTORY
                  const filtered = sourceList
                    .filter(s => dirFilter === 'Todos' || s.segment === dirFilter)
                    .sort((a, b) => {
                      const aFav = a.dbId ? favorites.has(a.dbId) : false
                      const bFav = b.dbId ? favorites.has(b.dbId) : false
                      return (bFav ? 1 : 0) - (aFav ? 1 : 0)
                    })
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      {filtered.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#8e8e93', fontSize: 13 }}>
                          Nenhum fornecedor encontrado para &quot;{dirFilter}&quot;
                        </div>
                      )}
                      {filtered.map(sup => (
                        <div key={sup.id} className="dir-card">
                          <div style={{ position: 'relative', overflow: 'hidden', background: '#f2f2f7' }}>
                            {sup.cover
                              ? <img src={sup.cover} alt={sup.name} className="dir-card-img" />
                              : <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8e8f0, #d4d4dc)' }}>
                                  {sup.logo
                                    ? <img src={sup.logo} alt={sup.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                                    : <Package size={24} color="#c7c7cc" />}
                                </div>}
                            {sup.logo && sup.cover && (
                              <div style={{ position: 'absolute', bottom: 8, left: 10, width: 34, height: 34, borderRadius: '50%', border: '2px solid #fff', overflow: 'hidden', background: '#e5e5ea', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                                <img src={sup.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            )}
                            <div style={{ position: 'absolute', top: 8, right: 8, background: `${sup.color}22`, border: `1px solid ${sup.color}44`, color: sup.color, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>{sup.segment}</div>
                          </div>
                          <div style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{sup.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                              {sup.rating > 0
                                ? <><div style={{ display: 'flex', gap: 1 }}>{[1,2,3,4,5].map(s => <Star key={s} size={9} fill={s <= Math.round(sup.rating) ? '#007AFF' : 'none'} color="#007AFF" />)}</div>
                                    <span style={{ fontSize: 11, color: '#007AFF', fontWeight: 700 }}>{sup.rating}</span>
                                    <span style={{ fontSize: 10, color: '#8e8e93' }}>({sup.reviewCount})</span>
                                    <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.15)' }}>·</span></>
                                : null}
                              <MapPin size={9} color="#6b6b6b" />
                              <span style={{ fontSize: 10, color: '#6b6b6b' }}>{sup.city}</span>
                            </div>
                            {sup.description && <p style={{ fontSize: 11.5, color: '#6b6b6b', lineHeight: 1.55, margin: '0 0 10px' }}>{sup.description}</p>}
                            <div style={{ display: 'flex', gap: 6 }}>
                              {sup.dbId && (
                                <button
                                  onClick={() => toggleFavorite(sup.dbId!)}
                                  style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: favorites.has(sup.dbId) ? 'rgba(239,68,68,0.08)' : 'transparent', border: `1px solid ${favorites.has(sup.dbId) ? 'rgba(239,68,68,0.25)' : 'rgba(0,0,0,0.08)'}`, cursor: 'pointer' }}
                                  title={favorites.has(sup.dbId) ? 'Remover dos favoritos' : 'Favoritar'}
                                >
                                  <Heart size={11} fill={favorites.has(sup.dbId) ? '#ef4444' : 'none'} color={favorites.has(sup.dbId) ? '#ef4444' : '#8e8e93'} />
                                </button>
                              )}
                              {sup.slug && (
                                <Link href={`/fornecedor/${sup.slug}`} target="_blank" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, padding: '6px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', color: '#6b6b6b', textDecoration: 'none', fontWeight: 600 }}>
                                  <ExternalLink size={10} /> Ver Perfil
                                </Link>
                              )}
                              {sup.dbId && (
                                <button onClick={() => handleMensagemFornecedor(sup.dbId!)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 11, padding: '6px 8px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', color: '#6b6b6b', cursor: 'pointer', fontWeight: 600 }}>
                                  <MessageCircle size={10} /> Mensagem
                                </button>
                              )}
                              <button onClick={() => { setDirQuoteTarget(sup); setDirQuoteForm({ descricao: '', data: '' }); setDirQuoteFile(null); setDirQuoteSent(false) }} style={{ flex: 1, fontSize: 11, padding: '6px', borderRadius: 6, background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.22)', color: '#007AFF', cursor: 'pointer', fontWeight: 600 }}>
                                Solicitar Orçamento
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Quote modal */}
              {dirQuoteTarget !== null && (
                <div onClick={e => { if (e.target === e.currentTarget) setDirQuoteTarget(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <div className="dir-modal-box" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, width: '100%', maxWidth: 460, padding: 26, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    {dirQuoteSent ? (
                      <div style={{ textAlign: 'center' as const, padding: '20px 0' }}>
                        <CheckCircle2 size={48} color="#34d399" style={{ marginBottom: 14 }} />
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>Solicitação enviada!</div>
                        <div style={{ fontSize: 12.5, color: '#6b6b6b' }}>{dirQuoteTarget.name} será notificado.</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Solicitar Orçamento</div>
                            <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{dirQuoteTarget.name}</div>
                          </div>
                          <button onClick={() => setDirQuoteTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}><X size={16} /></button>
                        </div>
                        <input ref={dirQuoteFileRef} type="file" style={{ display: 'none' }} onChange={e => setDirQuoteFile(e.target.files?.[0] ?? null)} />
                        <form onSubmit={handleSendQuote} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Descrição do serviço *</label>
                            <textarea className="dir-inp" required rows={3} placeholder="Descreva o que você precisa..." value={dirQuoteForm.descricao} onChange={e => setDirQuoteForm(f => ({ ...f, descricao: e.target.value }))} style={{ resize: 'vertical' as const }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Data prevista de início</label>
                            <input className="dir-inp" type="date" value={dirQuoteForm.data} onChange={e => setDirQuoteForm(f => ({ ...f, data: e.target.value }))} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Anexar arquivo (opcional)</label>
                            <div onClick={() => dirQuoteFileRef.current?.click()} style={{ padding: '9px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 7, fontSize: 12, color: dirQuoteFile ? '#1a1a1a' : '#8e8e93', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Upload size={13} color="#8e8e93" />
                              {dirQuoteFile ? dirQuoteFile.name : 'Clique para selecionar um arquivo'}
                              {dirQuoteFile && <X size={13} color="#8e8e93" onClick={e => { e.stopPropagation(); setDirQuoteFile(null) }} />}
                            </div>
                          </div>
                          <button type="submit" disabled={dirQuoteSending} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, fontWeight: 700, cursor: dirQuoteSending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: dirQuoteSending ? 0.7 : 1 }}>
                            {dirQuoteSending ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : <><Send size={13} /> Enviar Solicitação</>}
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
            <CalendarioObra events={calEvents} readonly={false}
              onEventAdd={async ev => {
                const tempId = Date.now()
                setCalEvents(prev => [...prev, { ...ev, id: tempId }])
                const supabase = createClient()
                const { data, error } = await supabase.from('eventos').insert({
                  projeto_id: projectId, titulo: ev.title, tipo: ev.type || 'arquiteto',
                  data_inicio: ev.startDate, data_fim: ev.endDate || ev.startDate,
                  hora_inicio: ev.startTime ?? null, hora_fim: ev.endTime ?? null, observacao: ev.note ?? null,
                }).select('id').single()
                if (error) {
                  console.error('eventos insert error:', error)
                  setCalEvents(prev => prev.filter(e => e.id !== tempId))
                } else if (data) {
                  setCalEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: data.id } : e))
                }
              }}
              onEventEdit={handleEventEdit}
              onEventDelete={handleEventDelete}
            />
          )}

          {/* ══ TAB: Orçamento ══ */}
          {activeTab === 'orcamento' && (() => {
            const ORC_CATS = ['Projeto', 'Execução', 'Marcenaria', 'Decoração', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros']
            const ORC_CAT_COLOR: Record<string, string> = {
              Projeto: '#007AFF', Execução: '#34d399', Marcenaria: '#4f9cf9',
              Decoração: '#a78bfa', Elétrica: '#f59e0b', Hidráulica: '#06b6d4',
              Pintura: '#f97316', Outros: '#8e8e93',
            }
            const grandTotal = orcItems.reduce((s, it) => s + Number(it.valor) * (it.quantidade || 1), 0)
            const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            const pieData = ORC_CATS.map(cat => ({
              name: cat,
              value: orcItems.filter(it => it.categoria === cat).reduce((s, it) => s + Number(it.valor) * (it.quantidade || 1), 0),
              color: ORC_CAT_COLOR[cat],
            })).filter(d => d.value > 0)

            async function saveOrcItem() {
              if (!orcForm.descricao.trim() || !orcForm.valor || !projeto) return
              const val = parseFloat(orcForm.valor.replace(',', '.'))
              if (isNaN(val) || val <= 0) return
              const qty = Math.max(1, parseInt(orcForm.quantidade) || 1)
              setOrcSaving(true)
              const supabase = createClient()
              if (orcEditItem) {
                const { data, error } = await supabase
                  .from('orcamento_itens')
                  .update({ categoria: orcForm.categoria, descricao: orcForm.descricao.trim(), valor: val, quantidade: qty, observacao: orcForm.observacao || null })
                  .eq('id', orcEditItem.id).select('*').single()
                if (!error && data) {
                  setOrcItems(prev => prev.map(it => it.id === orcEditItem.id ? data as OrcItem : it))
                  setOrcEditItem(null)
                  setOrcModal(false)
                }
              } else {
                const { data, error } = await supabase
                  .from('orcamento_itens')
                  .insert({ projeto_id: projeto.id, categoria: orcForm.categoria, descricao: orcForm.descricao.trim(), valor: val, quantidade: qty, observacao: orcForm.observacao || null })
                  .select('*').single()
                if (!error && data) {
                  setOrcItems(prev => [...prev, data as OrcItem])
                  setOrcModal(false)
                }
              }
              setOrcForm({ categoria: 'Projeto', descricao: '', valor: '', quantidade: '1', observacao: '' })
              setOrcSaving(false)
            }

            async function deleteOrcItem(id: string) {
              const supabase = createClient()
              await supabase.from('orcamento_itens').delete().eq('id', id)
              setOrcItems(prev => prev.filter(it => it.id !== id))
            }

            function openEdit(it: OrcItem) {
              setOrcEditItem(it)
              setOrcForm({ categoria: it.categoria, descricao: it.descricao, valor: String(it.valor), quantidade: String(it.quantidade || 1), observacao: it.observacao || '' })
              setOrcModal(true)
            }

            function openNew() {
              setOrcEditItem(null)
              setOrcForm({ categoria: 'Projeto', descricao: '', valor: '', quantidade: '1', observacao: '' })
              setOrcModal(true)
            }

            function exportPDF() {
              const win = window.open('', '', 'width=900,height=700')
              if (!win) return
              const now = new Date().toLocaleDateString('pt-BR')
              const rows = ORC_CATS.flatMap(cat => {
                const items = orcItems.filter(it => it.categoria === cat)
                if (items.length === 0) return []
                return [
                  `<tr><td colspan="4" style="background:#f5f5f7;font-weight:700;font-size:13px;padding:8px 12px;border-top:2px solid #e5e5ea">${cat}</td></tr>`,
                  ...items.map(it => `<tr>
                    <td style="padding:7px 12px;border-bottom:1px solid #f0f0f0">${it.descricao}${it.observacao ? `<div style="font-size:11px;color:#8e8e93;margin-top:2px">${it.observacao}</div>` : ''}</td>
                    <td style="padding:7px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${it.quantidade || 1}</td>
                    <td style="padding:7px 12px;border-bottom:1px solid #f0f0f0;text-align:right">${fmtBRL(Number(it.valor))}</td>
                    <td style="padding:7px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">${fmtBRL(Number(it.valor) * (it.quantidade || 1))}</td>
                  </tr>`)
                ]
              }).join('')
              const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Orçamento - ${projeto?.nome}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#1a1a1a;margin:0;padding:40px;background:#fff}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #007AFF}.brand{font-size:22px;font-weight:800;color:#007AFF;letter-spacing:-0.02em}.meta{font-size:12px;color:#6b6b6b;text-align:right;line-height:1.8}h2{font-size:18px;font-weight:700;margin:0 0 4px}.sub{font-size:13px;color:#6b6b6b;margin:0 0 24px}table{width:100%;border-collapse:collapse;font-size:13px}thead th{background:#007AFF;color:#fff;padding:10px 12px;text-align:left;font-size:12px;font-weight:600}thead th:nth-child(2){text-align:center}thead th:nth-child(3),thead th:nth-child(4){text-align:right}.total-row td{background:#1a1a1a;color:#fff;font-weight:700;font-size:14px;padding:10px 12px}.total-row td:last-child{text-align:right}.footer{margin-top:40px;font-size:11px;color:#8e8e93;border-top:1px solid #e5e5ea;padding-top:16px;display:flex;justify-content:space-between}@media print{body{padding:20px}}</style>
</head><body>
<div class="header"><div><div class="brand">ARC Platform</div><h2>${projeto?.nome}</h2><div class="sub">${cliente?.nome ?? ''}</div></div><div class="meta"><div>Data: ${now}</div><div>Orçamento do Projeto</div></div></div>
<table><thead><tr><th>Descrição</th><th style="width:80px">Qtd.</th><th style="width:140px">Valor Unit.</th><th style="width:140px">Total</th></tr></thead>
<tbody>${rows}<tr class="total-row"><td colspan="3">Total Geral</td><td>${fmtBRL(grandTotal)}</td></tr></tbody></table>
<div class="footer"><span>ARC Platform — Gestão de Projetos de Arquitetura</span><span>Gerado em ${now}</span></div>
<script>window.onload=function(){window.print();window.close()}<\/script></body></html>`
              win.document.write(html)
              win.document.close()
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Modal Novo / Editar Item */}
                {orcModal && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setOrcModal(false)}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{orcEditItem ? 'Editar Item' : 'Novo Item'}</div>
                        <button onClick={() => setOrcModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>Categoria</label>
                          <select value={orcForm.categoria} onChange={e => setOrcForm(f => ({ ...f, categoria: e.target.value }))} style={{ width: '100%', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                            {ORC_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>Descrição</label>
                          <input value={orcForm.descricao} onChange={e => setOrcForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Armário de cozinha em MDF" style={{ width: '100%', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>Valor unitário (R$)</label>
                            <input type="number" min="0" step="0.01" value={orcForm.valor} onChange={e => setOrcForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" style={{ width: '100%', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>Quantidade</label>
                            <input type="number" min="1" step="1" value={orcForm.quantidade} onChange={e => setOrcForm(f => ({ ...f, quantidade: e.target.value }))} placeholder="1" style={{ width: '100%', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>Observação (opcional)</label>
                          <textarea value={orcForm.observacao} onChange={e => setOrcForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Detalhes adicionais..." rows={2} style={{ width: '100%', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'none' }} />
                        </div>
                        <button onClick={saveOrcItem} disabled={orcSaving || !orcForm.descricao.trim() || !orcForm.valor} style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#007AFF', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: orcSaving || !orcForm.descricao.trim() || !orcForm.valor ? 0.5 : 1 }}>
                          {orcSaving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                          {orcEditItem ? 'Salvar Alterações' : 'Adicionar Item'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Header — Total + Ações */}
                <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8e8e93', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Orçamento do Projeto</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.1)', color: '#6b6b6b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                        <Download size={13} /> Exportar PDF
                      </button>
                      <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#007AFF', border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                        <Plus size={13} /> Novo Item
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1 }}>{fmtBRL(grandTotal)}</div>
                  {orcItems.length > 0 && (
                    <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 6 }}>
                      {orcItems.length} {orcItems.length === 1 ? 'item' : 'itens'} · {pieData.length} {pieData.length === 1 ? 'categoria' : 'categorias'}
                    </div>
                  )}
                </div>

                {/* Gráfico de Pizza */}
                {pieData.length > 0 && (
                  <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8e8e93', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>Distribuição por Categoria</div>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      <div style={{ width: 180, height: 170, flexShrink: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={78} innerRadius={38} dataKey="value" strokeWidth={2} stroke="#fff">
                              {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(v) => fmtBRL(Number(v))} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                        {pieData.map(d => (
                          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                            <div style={{ fontSize: 12.5, color: '#1a1a1a', flex: 1 }}>{d.name}</div>
                            <div style={{ fontSize: 11.5, color: '#8e8e93', minWidth: 34, textAlign: 'right' }}>{grandTotal > 0 ? Math.round(d.value / grandTotal * 100) : 0}%</div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a1a1a', minWidth: 110, textAlign: 'right' }}>{fmtBRL(d.value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Seções por categoria */}
                {ORC_CATS.map(cat => {
                  const items = orcItems.filter(it => it.categoria === cat)
                  if (items.length === 0) return null
                  const catTotal = items.reduce((s, it) => s + Number(it.valor) * (it.quantidade || 1), 0)
                  const pct = grandTotal > 0 ? Math.round(catTotal / grandTotal * 100) : 0
                  const color = ORC_CAT_COLOR[cat]
                  const isExpanded = orcExpandedCats.has(cat)
                  return (
                    <div key={cat} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderLeft: `3px solid ${color}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <button onClick={() => setOrcExpandedCats(prev => { const s = new Set(prev); if (s.has(cat)) s.delete(cat); else s.add(cat); return s })} style={{ width: '100%', padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', borderBottom: isExpanded ? '1px solid rgba(0,0,0,0.06)' : 'none', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color }}>{cat}</span>
                          <span style={{ fontSize: 11, background: `${color}15`, color, border: `1px solid ${color}30`, padding: '2px 8px', borderRadius: 20 }}>{pct}%</span>
                          <span style={{ fontSize: 11, color: '#8e8e93' }}>{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{fmtBRL(catTotal)}</span>
                          <ChevronDown size={14} color="#8e8e93" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </div>
                      </button>
                      {isExpanded && items.map((it, i) => (
                        <div key={it.id} style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{it.descricao}</div>
                            {it.observacao && <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>{it.observacao}</div>}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#8e8e93', flexShrink: 0 }}>
                            {(it.quantidade || 1) > 1 ? `${it.quantidade}× ` : ''}{fmtBRL(Number(it.valor))}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', flexShrink: 0, minWidth: 100, textAlign: 'right' }}>
                            {fmtBRL(Number(it.valor) * (it.quantidade || 1))}
                          </div>
                          <button onClick={() => openEdit(it)} title="Editar" style={{ width: 26, height: 26, borderRadius: 6, background: '#f2f2f7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Pencil size={11} color="#6b6b6b" />
                          </button>
                          <button onClick={() => deleteOrcItem(it.id)} title="Remover" style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c7c7cc', flexShrink: 0 }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#c7c7cc')}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })}

                {orcItems.length === 0 && (
                  <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <DollarSign size={36} color="#c7c7cc" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#3a3a3c', marginBottom: 4 }}>Nenhum item no orçamento</div>
                    <div style={{ fontSize: 12, color: '#8e8e93', marginBottom: 20 }}>Adicione itens clicando em &quot;Novo Item&quot;</div>
                    <button onClick={openNew} style={{ padding: '9px 22px', borderRadius: 9, background: '#007AFF', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={13} /> Adicionar primeiro item
                    </button>
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* ─── Right sidebar ─── */}
        <div style={{ width: 282, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 108 }}>

          {/* Client card */}
          <div style={panel}>
            <div style={panelHeader}>Cliente</div>
            <div style={{ padding: 16 }}>
              {cliente ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(0,122,255,0.1)', border: '2px solid rgba(0,122,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#007AFF', flexShrink: 0 }}>
                      {clientInitials}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1a1a1a' }}>{cliente.nome}</div>
                      <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>{displayType}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={iconBox()}><Mail size={11} color="#6b6b6b" /></div>
                      <span style={{ fontSize: 12, color: '#6b6b6b', wordBreak: 'break-all' as const }}>{cliente.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => projeto?.cliente_id && handleIniciarConversa(projeto.cliente_id, 'cliente')}
                    style={{ marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px', background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.22)', borderRadius: 8, color: '#007AFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,122,255,0.18)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,122,255,0.09)')}>
                    <MessageCircle size={13} /> Iniciar conversa
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 12, color: '#8e8e93', marginBottom: 12 }}>Cliente não vinculado</div>
                  <button onClick={() => { setLinkOpen(true); setLinkTab('buscar'); setLinkQuery(''); setLinkResults([]); setLinkInviteSent(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.22)', borderRadius: 8, color: '#007AFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                    <UserPlus size={13} /> Vincular cliente
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 11, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {[
              { label: 'Progresso',    value: `${progress}%` },
              { label: 'Etapa atual',  value: STAGES[stageIndex] },
              { label: 'Arquivos',     value: String(arquivos.length) },
              { label: 'Anotações',    value: String(anotacoes.length) },
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: '#8e8e93' }}>{stat.label}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#007AFF' }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Etapa buttons */}
          {stageIndex === STAGES.length - 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 9, background: 'rgba(52,211,153,0.06)' }}>
                <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Projeto concluído
              </div>
              <button onClick={handleRegressStage} disabled={regressingStage} style={{ width: '100%', padding: '9px', borderRadius: 9, background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#8e8e93', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {regressingStage ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ChevronLeft size={13} />} Retroceder etapa
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleAdvanceStage} disabled={advancingStage} style={{ width: '100%', padding: '12px', borderRadius: 9, background: stageAdvanced ? 'rgba(52,211,153,0.1)' : advancingStage ? '#f2f2f7' : 'rgba(0,122,255,0.1)', border: stageAdvanced ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(0,122,255,0.28)', color: stageAdvanced ? '#34d399' : advancingStage ? '#8e8e93' : '#007AFF', fontSize: 12.5, fontWeight: 700, cursor: advancingStage ? 'not-allowed' : 'pointer', letterSpacing: '0.04em', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {stageAdvanced ? <><CheckCircle2 size={14} /> ETAPA AVANÇADA</> : advancingStage ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> SALVANDO...</> : <>→ Avançar para {STAGES[stageIndex + 1]}</>}
              </button>
              {stageIndex > 0 && (
                <button onClick={handleRegressStage} disabled={regressingStage} style={{ width: '100%', padding: '9px', borderRadius: 9, background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#8e8e93', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {regressingStage ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ChevronLeft size={13} />} Retroceder etapa
                </button>
              )}
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
                  <div key={dStr} style={{ display: 'flex', gap: 10, padding: '8px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', opacity: !hasEvents && !isToday ? 0.35 : 1 }}>
                    <div style={{ flexShrink: 0, width: 28, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{weekLabel.replace('.', '')}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isToday ? '#007AFF' : '#8e8e93', lineHeight: 1.1, marginTop: 1 }}>{dayNum}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                      {!hasEvents ? <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,0.2)', paddingTop: 4 }}>—</div> : dayEvents.map(ev => {
                        const color = getMeta(ev.type).color
                        return (
                          <div key={ev.id} onClick={() => { setSidebarEditTarget(ev); setSidebarEditForm({ type: ev.type, title: ev.title, provider: ev.provider ?? '', startDate: ev.startDate, endDate: ev.endDate, startTime: ev.startTime ?? '08:00', endTime: ev.endTime ?? '17:00', note: ev.note ?? '' }) }} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, cursor: 'pointer', borderRadius: 5, padding: '2px 3px', margin: '0 -3px 4px' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 4px ${color}66` }} />
                            <div style={{ fontSize: 11, color, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{ev.title}</div>
                            {ev.startTime && <div style={{ fontSize: 9.5, color: '#8e8e93', flexShrink: 0 }}>{ev.startTime}</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Histórico */}
          {historico.length > 0 && (
            <div style={panel}>
              <div style={{ ...panelHeader, display: 'flex', alignItems: 'center', gap: 6 }}><History size={11} /> Histórico</div>
              <div style={{ padding: '4px 0' }}>
                {historico.slice(0, 8).map((h, i) => (
                  <div key={h.id} style={{ padding: '9px 14px', borderBottom: i < Math.min(historico.length, 8) - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{h.acao}</div>
                    {h.detalhe && <div style={{ fontSize: 11, color: '#6b6b6b', marginTop: 1 }}>{h.detalhe}</div>}
                    <div style={{ fontSize: 10, color: '#aeaeb2', marginTop: 3 }}>{new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipe do Projeto */}
          <div style={panel}>
            <div style={{ ...panelHeader, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><UserPlus size={11} /> Equipe do Projeto</span>
              <button onClick={() => setAddMembroOpen(v => !v)}
                style={{ background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Plus size={9} /> Add
              </button>
            </div>
            {addMembroOpen && membrosEscritorio.length > 0 && (
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <select value={addMembroId} onChange={e => setAddMembroId(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 7, background: '#fff', color: '#1a1a1a', outline: 'none' }}>
                  <option value="">Selecionar membro...</option>
                  {membrosEscritorio.filter(m => !projetoMembros.find(pm => pm.user_id === m.id)).map(m => (
                    <option key={m.id} value={m.id}>{m.nome}{m.cargo ? ` (${m.cargo})` : ''}</option>
                  ))}
                </select>
                <input value={addMembroPapel} onChange={e => setAddMembroPapel(e.target.value)} placeholder="Papel neste projeto (opcional)"
                  style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 7, background: '#fff', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }} />
                <button onClick={handleAddMembro} disabled={!addMembroId || addMembroSaving}
                  style={{ padding: '7px', background: !addMembroId ? 'rgba(0,122,255,0.3)' : '#007AFF', color: '#fff', border: 'none', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: addMembroId ? 'pointer' : 'not-allowed' }}>
                  {addMembroSaving ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            )}
            <div style={{ padding: '4px 0' }}>
              {projetoMembros.length === 0 ? (
                <div style={{ padding: '14px 16px', fontSize: 11, color: '#aeaeb2', textAlign: 'center' }}>Nenhum membro atribuído</div>
              ) : projetoMembros.map((m, i) => {
                const nome = m.users?.nome ?? '—'
                const initials = nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', borderBottom: i < projetoMembros.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,122,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#007AFF', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</div>
                      {m.papel && <div style={{ fontSize: 10, color: '#8e8e93' }}>{m.papel}</div>}
                    </div>
                    <button onClick={() => handleRemoveMembro(m.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c7cc', padding: 2, display: 'flex', flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#c7c7cc')}>
                      <X size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ══ MODAL: Editar Projeto ══ */}
      {editOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setEditOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="dir-modal-box" style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Editar Projeto</div>
                <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>Altere os dados do projeto</div>
              </div>
              <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Nome do projeto *</label>
                <input value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} required style={{ width: '100%', padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Tipo</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['residencial', 'comercial', 'institucional'].map(t => (
                    <button key={t} type="button" onClick={() => setEditForm(f => ({ ...f, tipo: t }))} style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', background: editForm.tipo === t ? 'rgba(0,122,255,0.1)' : '#f2f2f7', border: `1px solid ${editForm.tipo === t ? '#007AFF' : 'rgba(0,0,0,0.08)'}`, color: editForm.tipo === t ? '#007AFF' : '#6b6b6b', textTransform: 'capitalize' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Descrição</label>
                <textarea value={editForm.descricao} onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} rows={3} placeholder="Descrição do projeto..." style={{ width: '100%', padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Metragem (m²)</label>
                  <input type="number" min="0" step="0.01" value={editForm.metragem} onChange={e => setEditForm(f => ({ ...f, metragem: e.target.value }))} placeholder="Ex: 120" style={{ width: '100%', padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Tipo de contrato</label>
                  <select value={editForm.tipo_contrato} onChange={e => setEditForm(f => ({ ...f, tipo_contrato: e.target.value }))} style={{ width: '100%', padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: editForm.tipo_contrato ? '#1a1a1a' : '#8e8e93', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}>
                    <option value="">Selecionar...</option>
                    <option value="execucao">Execução</option>
                    <option value="somente_projeto">Somente Projeto</option>
                    <option value="acompanhamento">Acompanhamento de Obra</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Endereço da obra</label>
                <input value={editForm.endereco} onChange={e => setEditForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Rua, número, bairro..." style={{ width: '100%', padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Email do cliente</label>
                <input type="email" value={editForm.email_cliente} onChange={e => setEditForm(f => ({ ...f, email_cliente: e.target.value }))} placeholder="cliente@email.com" style={{ width: '100%', padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
              </div>
              <button type="submit" disabled={editSaving || !editForm.nome.trim()} style={{ width: '100%', padding: '12px', background: editSaving ? 'rgba(0,122,255,0.5)' : '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: editSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4 }}>
                {editSaving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><Check size={14} /> Salvar alterações</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: Vincular Cliente ══ */}
      {linkOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setLinkOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="dir-modal-box" style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            {linkInviteSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={48} color="#34d399" style={{ marginBottom: 14 }} />
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>Convite registrado!</div>
                <div style={{ fontSize: 12.5, color: '#6b6b6b' }}>Quando {linkInviteEmail} criar conta, será vinculado automaticamente.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Vincular Cliente</div>
                  <button onClick={() => setLinkOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}><X size={18} /></button>
                </div>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 20 }}>
                  {(['buscar', 'convidar'] as const).map(t => (
                    <button key={t} onClick={() => setLinkTab(t)} style={{ padding: '9px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${linkTab === t ? '#007AFF' : 'transparent'}`, color: linkTab === t ? '#007AFF' : '#8e8e93', fontSize: 13, fontWeight: linkTab === t ? 600 : 400, cursor: 'pointer', marginBottom: -1, textTransform: 'capitalize' }}>
                      {t === 'buscar' ? 'Buscar cadastrado' : 'Convidar por email'}
                    </button>
                  ))}
                </div>
                {linkTab === 'buscar' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={linkQuery} onChange={e => setLinkQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLinkSearch()} placeholder="Buscar por nome ou email..." style={{ flex: 1, padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: '#1a1a1a', outline: 'none', fontFamily: 'inherit' }} onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
                      <button onClick={handleLinkSearch} disabled={linkSearching} style={{ padding: '10px 14px', background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.25)', borderRadius: 9, color: '#007AFF', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600 }}>
                        {linkSearching ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                      </button>
                    </div>
                    {linkResults.length > 0 && (
                      <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                        {linkResults.map((u, i) => (
                          <div key={u.id} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < linkResults.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#007AFF', flexShrink: 0 }}>
                              {u.nome.slice(0, 1).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{u.nome}</div>
                              <div style={{ fontSize: 11, color: '#8e8e93' }}>{u.email}</div>
                            </div>
                            <button onClick={() => handleLinkClient(u.id, u.nome, u.email)} disabled={linkingId === u.id} style={{ padding: '7px 14px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, opacity: linkingId === u.id ? 0.6 : 1 }}>
                              {linkingId === u.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />} Vincular
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {linkResults.length === 0 && linkQuery && !linkSearching && (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#8e8e93', fontSize: 13, background: '#f9f9fb', borderRadius: 10 }}>Nenhum usuário encontrado. Tente convidar por email.</div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 12.5, color: '#6b6b6b', margin: 0 }}>Informe o email do cliente. Quando ele criar conta com esse email, será vinculado automaticamente.</p>
                    <input type="email" value={linkInviteEmail} onChange={e => setLinkInviteEmail(e.target.value)} placeholder="cliente@email.com" style={{ width: '100%', padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
                    <button onClick={handleInviteClient} disabled={linkInviting || !linkInviteEmail.trim()} style={{ width: '100%', padding: '12px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: linkInviting || !linkInviteEmail.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: !linkInviteEmail.trim() ? 0.5 : 1 }}>
                      {linkInviting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><Send size={14} /> Salvar email do cliente</>}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ MODAL: Editar evento da semana ══ */}
      {sidebarEditTarget && (
        <div onClick={e => { if (e.target === e.currentTarget) setSidebarEditTarget(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="dir-modal-box" style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Editar Evento</div>
              <button onClick={() => setSidebarEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Tipo</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(Object.keys(EVENT_META) as EventType[]).map(t => {
                    const meta = EVENT_META[t]
                    const sel = sidebarEditForm.type === t
                    return (
                      <button key={t} type="button" onClick={() => setSidebarEditForm(f => ({ ...f, type: t }))} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 16, border: `1.5px solid ${sel ? meta.color : 'rgba(0,0,0,0.1)'}`, background: sel ? meta.bg : '#f2f2f7', color: sel ? meta.color : '#6b6b6b', fontSize: 11.5, fontWeight: sel ? 600 : 400, cursor: 'pointer' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />{meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Serviço</label>
                  <input value={sidebarEditForm.title} onChange={e => setSidebarEditForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%', padding: '9px 11px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 12.5, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Fornecedor</label>
                  <input value={sidebarEditForm.provider} onChange={e => setSidebarEditForm(f => ({ ...f, provider: e.target.value }))} style={{ width: '100%', padding: '9px 11px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 12.5, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Data início</label>
                  <input type="date" value={sidebarEditForm.startDate} onChange={e => setSidebarEditForm(f => ({ ...f, startDate: e.target.value }))} style={{ width: '100%', padding: '9px 11px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 12.5, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', colorScheme: 'light' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Data fim</label>
                  <input type="date" value={sidebarEditForm.endDate} onChange={e => setSidebarEditForm(f => ({ ...f, endDate: e.target.value }))} style={{ width: '100%', padding: '9px 11px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 12.5, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', colorScheme: 'light' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Horário início</label>
                  <input type="time" value={sidebarEditForm.startTime} onChange={e => setSidebarEditForm(f => ({ ...f, startTime: e.target.value }))} style={{ width: '100%', padding: '9px 11px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 12.5, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', colorScheme: 'light' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Horário fim</label>
                  <input type="time" value={sidebarEditForm.endTime} onChange={e => setSidebarEditForm(f => ({ ...f, endTime: e.target.value }))} style={{ width: '100%', padding: '9px 11px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 12.5, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', colorScheme: 'light' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Observação</label>
                <textarea value={sidebarEditForm.note} onChange={e => setSidebarEditForm(f => ({ ...f, note: e.target.value }))} rows={2} style={{ width: '100%', padding: '9px 11px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 12.5, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                <button onClick={handleSidebarEditDelete} disabled={sidebarEditDeleting} style={{ padding: '9px 16px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {sidebarEditDeleting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={12} />} Excluir
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setSidebarEditTarget(null)} style={{ padding: '9px 16px', borderRadius: 9, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.1)', color: '#6b6b6b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={handleSidebarEditSave} disabled={sidebarEditSaving || !sidebarEditForm.title.trim()} style={{ padding: '9px 18px', borderRadius: 9, background: '#007AFF', border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: sidebarEditSaving || !sidebarEditForm.title.trim() ? 0.6 : 1 }}>
                    {sidebarEditSaving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null} Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
