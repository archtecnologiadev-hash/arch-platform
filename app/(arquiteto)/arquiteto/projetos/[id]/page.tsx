'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Upload, FileText, ImageIcon, File, MessageCircle,
  Mail, Calendar, Plus, Package, DollarSign, Check, Pencil,
  Star, ExternalLink, Send, X, CheckCircle2, MapPin, Loader2,
  Download, AlertCircle, Camera,
} from 'lucide-react'
import CalendarioObra, { CalendarioEvent, EVENT_META, EventType } from '@/components/shared/CalendarioObra'
import ImageCropModal, { type CropConfig } from '@/components/shared/ImageCropModal'
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

interface DirSupplier {
  id: number; slug: string; name: string; segment: string; city: string
  rating: number; reviewCount: number; description: string; cover: string; color: string
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

const DIR_SEGMENTS = ['Todos', 'Marcenaria', 'Elétrica', 'Vidraçaria', 'Gesseiro', 'Pintura']

const COVER_FALLBACK = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80'

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
  const projectId = (params?.id as string) ?? ''

  const [loading, setLoading] = useState(true)
  const [projeto, setProjeto] = useState<ProjetoReal | null>(null)
  const [cliente, setCliente] = useState<ClienteInfo | null>(null)
  const [arquivos, setArquivos] = useState<ArquivoProjeto[]>([])
  const [anotacoes, setAnotacoes] = useState<AnotacaoProjeto[]>([])
  const [calEvents, setCalEvents] = useState<CalendarioEvent[]>([])
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

  const [dirFilter, setDirFilter] = useState('Todos')
  const [dirQuoteTarget, setDirQuoteTarget] = useState<DirSupplier | null>(null)
  const [dirQuoteForm, setDirQuoteForm] = useState({ descricao: '', data: '' })
  const [dirQuoteFile, setDirQuoteFile] = useState<File | null>(null)
  const [dirQuoteSending, setDirQuoteSending] = useState(false)
  const [dirQuoteSent, setDirQuoteSent] = useState(false)
  const dirQuoteFileRef = useRef<HTMLInputElement>(null)

  const [coverUploading, setCoverUploading] = useState(false)
  const [cropConfig, setCropConfig] = useState<CropConfig | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!projectId) return
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const nome = user.user_metadata?.nome ?? user.email ?? 'Arquiteto'
        setCurrentUser({ id: user.id, nome })
      }

      const [
        { data: proj },
        { data: evs },
        { data: arqs },
        { data: anots },
      ] = await Promise.all([
        supabase.from('projetos').select('*').eq('id', projectId).single(),
        supabase.from('eventos').select('*').eq('projeto_id', projectId).order('data_inicio'),
        supabase.from('arquivos_projeto').select('*').eq('projeto_id', projectId).order('created_at', { ascending: false }),
        supabase.from('anotacoes_projeto').select('*').eq('projeto_id', projectId).order('created_at', { ascending: false }),
      ])

      if (proj) {
        setProjeto(proj as ProjetoReal)
        const idx = STAGES.findIndex(s => s.toLowerCase() === (proj.etapa_atual ?? '').toLowerCase())
        if (idx >= 0) setStageIndex(idx)

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
      setLoading(false)
    }
    loadData()
  }, [projectId])

  async function handleCoverUpload(blob: Blob) {
    if (!currentUser || !projeto) return
    setCoverUploading(true)
    setCropConfig(null)
    const supabase = createClient()
    const path = `${currentUser.id}/${projeto.id}/cover_${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage.from('projetos').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('projetos').getPublicUrl(path)
      await supabase.from('projetos').update({ cover_url: publicUrl }).eq('id', projeto.id)
      setProjeto(prev => prev ? { ...prev, cover_url: publicUrl } : prev)
    }
    setCoverUploading(false)
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

  async function handleAdvanceStage() {
    if (!projeto || stageIndex >= STAGES.length - 1) return
    setAdvancingStage(true)
    const next = stageIndex + 1
    const supabase = createClient()
    await supabase.from('projetos').update({ etapa_atual: STAGES[next] }).eq('id', projeto.id)
    setStageIndex(next)
    setAdvancingStage(false)
    setStageAdvanced(true)
    setTimeout(() => setStageAdvanced(false), 2500)
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

    await supabase.from('solicitacoes_orcamento').insert({
      projeto_id: projeto.id,
      fornecedor_slug: dirQuoteTarget.slug,
      fornecedor_nome: dirQuoteTarget.name,
      descricao: dirQuoteForm.descricao,
      data_prevista: dirQuoteForm.data || null,
      arquivo_url: arquivoUrl,
      solicitante_id: currentUser.id,
    })

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

      {/* ═══════════════════ COVER HEADER ═══════════════════ */}
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) {
            const src = URL.createObjectURL(f)
            setCropConfig({ src, aspect: 16 / 9, circular: false, onConfirm: handleCoverUpload, onCancel: () => setCropConfig(null) })
          }
          e.target.value = ''
        }} />
      <div style={{ position: 'relative', height: 300, overflow: 'hidden', background: '#e5e5ea' }}>
        {(projeto.cover_url || COVER_FALLBACK) && (
          <img src={projeto.cover_url ?? COVER_FALLBACK} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 52%, rgba(0,0,0,0.08) 100%)' }} />

        {/* Top bar */}
        <div style={{ position: 'absolute', top: 20, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/arquiteto/projetos" className="proj-back-btn" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', textDecoration: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 13px 6px 10px', borderRadius: 8, fontWeight: 500, transition: 'color 0.15s, border-color 0.15s' }}>
            <ArrowLeft size={13} /> Projetos
          </Link>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            {[displayType].map(tag => tag !== '—' && (
              <div key={tag} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.9)' }}>
                {tag}
              </div>
            ))}
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', padding: '5px 11px 5px 9px', borderRadius: 8, cursor: coverUploading ? 'not-allowed' : 'pointer', fontWeight: 500 }}
            >
              {coverUploading
                ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                : <><Camera size={12} /> Trocar capa</>}
            </button>
          </div>
        </div>

        {/* Bottom info */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 28px 26px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{cliente?.nome ?? 'Cliente não vinculado'}</span>
              {displayType !== '—' && <><span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span><span>{displayType}</span></>}
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, padding: '6px 15px', borderRadius: 20, background: 'rgba(0,122,255,0.9)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', backdropFilter: 'blur(10px)', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
            {STAGES[stageIndex]}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {SUPPLIER_DIRECTORY.filter(s => dirFilter === 'Todos' || s.segment === dirFilter).map(sup => (
                    <div key={sup.id} className="dir-card">
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img src={sup.cover} alt={sup.name} className="dir-card-img" />
                        <div style={{ position: 'absolute', top: 8, right: 8, background: `${sup.color}22`, border: `1px solid ${sup.color}44`, color: sup.color, fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>{sup.segment}</div>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{sup.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                          <div style={{ display: 'flex', gap: 1 }}>{[1,2,3,4,5].map(s => <Star key={s} size={9} fill={s <= Math.round(sup.rating) ? '#007AFF' : 'none'} color="#007AFF" />)}</div>
                          <span style={{ fontSize: 11, color: '#007AFF', fontWeight: 700 }}>{sup.rating}</span>
                          <span style={{ fontSize: 10, color: '#8e8e93' }}>({sup.reviewCount})</span>
                          <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.15)' }}>·</span>
                          <MapPin size={9} color="#6b6b6b" />
                          <span style={{ fontSize: 10, color: '#6b6b6b' }}>{sup.city}</span>
                        </div>
                        <p style={{ fontSize: 11.5, color: '#6b6b6b', lineHeight: 1.55, margin: '0 0 10px' }}>{sup.description}</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link href={`/fornecedor/${sup.slug}`} target="_blank" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, padding: '6px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(0,0,0,0.08)', color: '#6b6b6b', textDecoration: 'none', fontWeight: 600 }}>
                            <ExternalLink size={10} /> Ver Perfil
                          </Link>
                          <button onClick={() => { setDirQuoteTarget(sup); setDirQuoteForm({ descricao: '', data: '' }); setDirQuoteFile(null); setDirQuoteSent(false) }} style={{ flex: 1, fontSize: 11, padding: '6px', borderRadius: 6, background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.22)', color: '#007AFF', cursor: 'pointer', fontWeight: 600 }}>
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
                const { data } = await supabase.from('eventos').insert({
                  projeto_id: projectId, titulo: ev.title, tipo: ev.type,
                  data_inicio: ev.startDate, data_fim: ev.endDate,
                  hora_inicio: ev.startTime ?? null, hora_fim: ev.endTime ?? null, observacao: ev.note ?? null,
                }).select('id').single()
                if (data) setCalEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: data.id } : e))
              }} />
          )}

          {/* ══ TAB: Orçamento ══ */}
          {activeTab === 'orcamento' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Orçamento Total', value: '—', color: '#1a1a1a' },
                  { label: 'Executado',        value: '—', color: '#007AFF' },
                  { label: 'Saldo Disponível', value: '—', color: '#34d399' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: 10.5, color: '#8e8e93', marginBottom: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '24px', textAlign: 'center', color: '#8e8e93', fontSize: 13, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                Módulo de orçamento em desenvolvimento.
              </div>
            </div>
          )}
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
                  <button style={{ marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px', background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.22)', borderRadius: 8, color: '#007AFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,122,255,0.18)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,122,255,0.09)')}>
                    <MessageCircle size={13} /> Iniciar conversa
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#8e8e93', fontSize: 12 }}>
                  Cliente não vinculado
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

          {/* Avançar etapa */}
          {stageIndex < STAGES.length - 1 ? (
            <button onClick={handleAdvanceStage} disabled={advancingStage} style={{ width: '100%', padding: '12px', borderRadius: 9, background: stageAdvanced ? 'rgba(52,211,153,0.1)' : advancingStage ? '#f2f2f7' : 'rgba(0,122,255,0.1)', border: stageAdvanced ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(0,122,255,0.28)', color: stageAdvanced ? '#34d399' : advancingStage ? '#8e8e93' : '#007AFF', fontSize: 12.5, fontWeight: 700, cursor: advancingStage ? 'not-allowed' : 'pointer', letterSpacing: '0.04em', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {stageAdvanced ? <><CheckCircle2 size={14} /> ETAPA AVANÇADA</> : advancingStage ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> SALVANDO...</> : <>→ Avançar para {STAGES[stageIndex + 1]}</>}
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 9, background: 'rgba(52,211,153,0.06)' }}>
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Projeto concluído
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
                        const color = EVENT_META[ev.type].color
                        return (
                          <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
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
        </div>
      </div>

      {/* ── Crop Modal ── */}
      {cropConfig && <ImageCropModal {...cropConfig} />}
    </div>
  )
}
