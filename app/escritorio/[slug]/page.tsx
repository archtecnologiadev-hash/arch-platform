'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import CarrosselImagens from '@/components/shared/CarrosselImagens'
import Link from 'next/link'
import {
  Star, MapPin, ArrowLeft, CheckCircle2,
  Award, FolderOpen, Calendar, Globe, AtSign, Phone,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PortfolioProject {
  id: string
  nome: string
  descricao: string | null
  categoria: string | null
  imagens: { url: string; ordem: number }[]
}

interface StudioData {
  id: string
  nome: string
  nome_responsavel: string | null
  cidade: string | null
  estado: string | null
  estilo: string | null
  especialidades: string[] | null
  bio: string | null
  rating: number | null
  telefone: string | null
  instagram: string | null
  website: string | null
  image_url: string | null
  cover_url: string | null
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5 text-[#007AFF]">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cls} fill={i <= Math.round(rating) ? 'currentColor' : 'none'} />
      ))}
    </div>
  )
}

// ─── Lead Form ───────────────────────────────────────────────────────────────

function LeadForm({ studioId, studioName }: { studioId: string | null; studioName: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!studioId) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('leads').insert({
      escritorio_id: studioId,
      nome: form.name,
      email: form.email,
      telefone: form.phone || null,
      mensagem: form.message,
    })
    setLoading(false)
    if (err) {
      setError('Erro ao enviar. Tente novamente.')
    } else {
      setSubmitted(true)
      fetch('/api/notifications/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escritorio_id: studioId,
          nome: form.name,
          email: form.email,
          telefone: form.phone || null,
          mensagem: form.message,
        }),
      }).catch(() => {})
    }
  }

  const field = (key: keyof typeof form, label: string, type: string, placeholder: string, required = true) => (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-[#8e8e93]">{label}</label>
      <input
        type={type} required={required} placeholder={placeholder} value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full rounded-xl border border-black/[0.08] bg-[#f2f2f7] px-3 py-2.5 text-sm text-[#1a1a1a] outline-none placeholder-[#8e8e93] transition-colors focus:border-[#007AFF]/40 focus:bg-white"
      />
    </div>
  )

  if (submitted) {
    return (
      <div className="rounded-2xl border border-black/[0.08] bg-white p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#007AFF]/30 bg-[#007AFF]/10">
          <CheckCircle2 className="h-7 w-7 text-[#007AFF]" />
        </div>
        <h3 className="text-lg font-bold text-[#1a1a1a]">Mensagem enviada!</h3>
        <p className="mt-2 text-sm text-[#6b6b6b]">{studioName} entrará em contato em breve.</p>
        <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }) }}
          className="mt-6 text-xs text-[#8e8e93] transition-colors hover:text-[#6b6b6b]">
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="border-b border-black/[0.08] px-5 py-4">
        <h3 className="text-sm font-bold text-[#1a1a1a]">Solicitar Contato</h3>
        <p className="mt-0.5 text-xs text-[#8e8e93]">Resposta em até 24 horas · Sem compromisso</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 p-5">
        {field('name', 'NOME COMPLETO', 'text', 'Seu nome completo')}
        {field('email', 'EMAIL', 'email', 'seu@email.com')}
        {field('phone', 'TELEFONE', 'tel', '+55 11 99999-9999', false)}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-[#8e8e93]">MENSAGEM</label>
          <textarea required rows={4} placeholder="Descreva seu projeto, metragem, prazo estimado..."
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full resize-none rounded-xl border border-black/[0.08] bg-[#f2f2f7] px-3 py-2.5 text-sm text-[#1a1a1a] outline-none placeholder-[#8e8e93] transition-colors focus:border-[#007AFF]/40 focus:bg-white" />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-[10px] bg-[#007AFF] py-3.5 text-xs font-bold tracking-[0.22em] text-white transition-all hover:bg-[#0066d6] disabled:opacity-60">
          {loading ? 'ENVIANDO...' : 'SOLICITAR CONTATO'}
        </button>
      </form>
    </div>
  )
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = ['portfolio', 'sobre', 'contato'] as const
type Tab = (typeof TABS)[number]
const TAB_LABELS: Record<Tab, string> = { portfolio: 'Portfólio', sobre: 'Sobre', contato: 'Contato' }

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EstudioPage({ params }: { params: { slug: string } }) {
  const [studio, setStudio] = useState<StudioData | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([])
  const [galeria, setGaleria] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('portfolio')
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null)
  const [imgIdx, setImgIdx] = useState(0)

  const openProject = useCallback((project: PortfolioProject) => {
    setSelectedProject(project)
    setImgIdx(0)
  }, [])

  const closeModal = useCallback(() => setSelectedProject(null), [])

  const prevImg = useCallback(() => {
    if (!selectedProject) return
    setImgIdx(i => (i - 1 + selectedProject.imagens.length) % selectedProject.imagens.length)
  }, [selectedProject])

  const nextImg = useCallback(() => {
    if (!selectedProject) return
    setImgIdx(i => (i + 1) % selectedProject.imagens.length)
  }, [selectedProject])

  useEffect(() => {
    if (!selectedProject) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
      if (e.key === 'ArrowLeft') prevImg()
      if (e.key === 'ArrowRight') nextImg()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedProject, closeModal, prevImg, nextImg])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('escritorios').select('*').eq('slug', params.slug).maybeSingle()

      if (data) {
        setStudio(data as StudioData)
        const { data: projs } = await supabase
          .from('projetos_portfolio')
          .select('*, portfolio_imagens(*)')
          .eq('escritorio_id', data.id)
          .order('created_at', { ascending: false })

        if (projs) {
          setPortfolio(projs.map((p: Record<string, unknown>) => {
            const imgs = ((p.portfolio_imagens as Record<string, unknown>[] | null) ?? [])
              .sort((a, b) => (a.ordem as number) - (b.ordem as number))
            return {
              id: p.id as string,
              nome: p.nome as string,
              descricao: (p.descricao ?? null) as string | null,
              categoria: (p.categoria ?? null) as string | null,
              imagens: imgs.map(img => ({ url: img.url as string, ordem: img.ordem as number })),
            }
          }))
        }

        const { data: gal } = await supabase
          .from('escritorio_galeria')
          .select('url, ordem')
          .eq('escritorio_id', data.id)
          .order('ordem')
        if (gal) setGaleria((gal as { url: string; ordem: number }[]).map(g => g.url))
      }
      setLoading(false)
    }
    load()
  }, [params.slug])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f2f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#007AFF] border-t-transparent" />
      </div>
    )
  }

  if (!studio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f2f2f7]">
        <p className="text-lg font-semibold text-[#1a1a1a]">Escritório não encontrado</p>
        <Link href="/" className="text-sm text-[#007AFF] hover:underline">← Voltar ao marketplace</Link>
      </div>
    )
  }

  const yearsExp = studio.created_at
    ? new Date().getFullYear() - new Date(studio.created_at).getFullYear()
    : 0

  return (
    <div className="min-h-screen bg-[#f2f2f7] text-[#1a1a1a]">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-black/[0.08] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2 text-[#8e8e93] transition-colors hover:text-[#1a1a1a]">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden text-xs tracking-wider sm:block">VOLTAR</span>
            </Link>
            <div className="h-4 w-px bg-black/[0.08]" />
            <Link href="/" className="text-xl font-black tracking-[0.25em] text-[#1a1a1a]">ARC</Link>
          </div>
          <Link href="/login"
            className="rounded-[10px] border border-[#007AFF] px-5 py-2 text-xs font-semibold tracking-widest text-[#007AFF] transition-all hover:bg-[#007AFF] hover:text-white">
            ENTRAR
          </Link>
        </div>
      </header>

      {/* ── STUDIO INFO ──────────────────────────────────────────────── */}
      <div className="bg-white pt-16 border-b border-black/[0.06]">
        <div className="mx-auto max-w-2xl px-6 py-6">
          <div className="flex items-center gap-4">
            {studio.image_url && (
              <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden border border-black/10 shadow-sm">
                <img src={studio.image_url} alt={studio.nome} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              {(studio.estilo || (studio.especialidades && studio.especialidades.length > 0)) && (
                <p className="text-xs font-semibold tracking-[0.35em] text-[#007AFF] mb-0.5">
                  {studio.estilo ?? studio.especialidades?.slice(0, 2).join(' · ')}
                </p>
              )}
              <h1 className="text-2xl font-black text-[#1a1a1a] leading-tight">{studio.nome}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                {(studio.cidade || studio.estado) && (
                  <div className="flex items-center gap-1 text-[#8e8e93]">
                    <MapPin className="h-3 w-3 text-[#007AFF]" />
                    <span className="text-xs">{[studio.cidade, studio.estado].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {studio.rating && studio.rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={studio.rating} size="sm" />
                    <span className="text-xs font-bold text-[#1a1a1a]">{studio.rating.toFixed(1)}</span>
                  </div>
                )}
                {yearsExp > 0 && (
                  <span className="text-xs text-[#aeaeb2]">
                    {yearsExp} {yearsExp === 1 ? 'ano' : 'anos'} na plataforma
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CAROUSEL ─────────────────────────────────────────────────── */}
      <div className="bg-[#f2f2f7] py-8">
        <div className="mx-auto max-w-2xl px-6">
          <CarrosselImagens images={galeria} fallbackUrl={studio.cover_url} />
        </div>
      </div>

      {/* ── TAB NAV ─────────────────────────────────────────────────── */}
      <nav className="sticky top-16 z-30 border-b border-black/[0.08] bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`shrink-0 border-b-2 px-5 py-4 text-xs font-semibold tracking-[0.2em] transition-all md:px-7 ${
                  activeTab === tab
                    ? 'border-[#007AFF] text-[#007AFF]'
                    : 'border-transparent text-[#8e8e93] hover:text-[#6b6b6b]'
                }`}>
                {TAB_LABELS[tab].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-start gap-10">

          {/* LEFT: tab content */}
          <div className="min-w-0 flex-1">

            {/* PORTFÓLIO */}
            {activeTab === 'portfolio' && (
              <section>
                <header className="mb-8">
                  <p className="text-xs tracking-[0.35em] text-[#007AFF]">PORTFÓLIO</p>
                  <h2 className="mt-1 text-3xl font-black text-[#1a1a1a]">Projetos</h2>
                </header>

                {portfolio.length === 0 ? (
                  <div className="rounded-2xl border border-black/[0.08] bg-white py-20 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                    <FolderOpen className="mx-auto mb-3 h-8 w-8 text-[#c7c7cc]" />
                    <p className="text-sm text-[#8e8e93]">Nenhum projeto publicado ainda.</p>
                  </div>
                ) : (
                  <div className="columns-1 gap-4 sm:columns-2">
                    {portfolio.map((project) => {
                      const firstImg = project.imagens[0]?.url
                      const tall = project.imagens.length > 2
                      return (
                        <div key={project.id}
                          onClick={() => openProject(project)}
                          className="group relative mb-4 cursor-pointer overflow-hidden break-inside-avoid rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                          {firstImg ? (
                            <img src={firstImg} alt={project.nome}
                              className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              style={{ height: tall ? '420px' : '260px' }} />
                          ) : (
                            <div className="flex items-center justify-center bg-[#e5e5ea]"
                              style={{ height: '220px' }}>
                              <span className="text-xs text-[#8e8e93]">Sem foto</span>
                            </div>
                          )}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 group-hover:opacity-0" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6 text-center opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                            {project.categoria && (
                              <span className="mb-2 text-[10px] font-semibold tracking-[0.35em] text-[#007AFF]">
                                {project.categoria.toUpperCase()}
                              </span>
                            )}
                            <h3 className="text-lg font-bold text-white">{project.nome}</h3>
                            {project.descricao && (
                              <p className="mt-2 text-xs text-white/70 line-clamp-2">{project.descricao}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* SOBRE */}
            {activeTab === 'sobre' && (
              <section className="space-y-10">
                <div>
                  <p className="text-xs tracking-[0.35em] text-[#007AFF]">SOBRE</p>
                  <h2 className="mt-1 mb-8 text-3xl font-black text-[#1a1a1a]">O Escritório</h2>

                  {/* Stats grid */}
                  <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { icon: Calendar, value: yearsExp > 0 ? `${yearsExp} anos` : '—', label: 'na plataforma' },
                      { icon: FolderOpen, value: `${portfolio.length}`, label: 'projetos' },
                      { icon: Award, value: studio.rating ? studio.rating.toFixed(1) : '—', label: 'avaliação' },
                    ].map(({ icon: Icon, value, label }) => (
                      <div key={label}
                        className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                        <Icon className="mb-3 h-5 w-5 text-[#007AFF]" />
                        <p className="text-2xl font-black text-[#1a1a1a]">{value}</p>
                        <p className="mt-0.5 text-xs text-[#8e8e93]">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Bio */}
                  {studio.bio ? (
                    <div className="max-w-2xl space-y-4">
                      {studio.bio.split('\n\n').map((p, i) => (
                        <p key={i} className="leading-relaxed text-[#6b6b6b]">{p}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#8e8e93]">Nenhuma descrição cadastrada.</p>
                  )}
                </div>

                {/* Especialidades */}
                {studio.especialidades && studio.especialidades.length > 0 && (
                  <div>
                    <p className="mb-4 text-xs tracking-[0.35em] text-[#007AFF]">ESPECIALIDADES</p>
                    <div className="flex flex-wrap gap-2">
                      {studio.especialidades.map(e => (
                        <span key={e} className="rounded-full border border-black/[0.08] bg-white px-4 py-1.5 text-sm text-[#3a3a3a] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Responsável */}
                {studio.nome_responsavel && (
                  <div>
                    <p className="mb-4 text-xs tracking-[0.35em] text-[#007AFF]">RESPONSÁVEL</p>
                    <div className="flex items-center gap-4">
                      {studio.image_url && (
                        <img src={studio.image_url} alt={studio.nome_responsavel}
                          className="h-14 w-14 rounded-full border border-black/[0.08] object-cover" />
                      )}
                      <div>
                        <p className="font-semibold text-[#1a1a1a]">{studio.nome_responsavel}</p>
                        <p className="text-xs text-[#8e8e93]">Arquiteto responsável</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* CONTATO */}
            {activeTab === 'contato' && (
              <section>
                <div className="mb-8">
                  <p className="text-xs tracking-[0.35em] text-[#007AFF]">CONTATO</p>
                  <h2 className="mt-1 mb-8 text-3xl font-black text-[#1a1a1a]">Fale com o Escritório</h2>

                  <div className="mb-8 grid gap-3 sm:grid-cols-3">
                    {studio.telefone && (
                      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                        <Phone className="mb-2 h-4 w-4 text-[#007AFF]" />
                        <p className="mb-1 text-[10px] tracking-[0.2em] text-[#8e8e93]">TELEFONE</p>
                        <p className="text-sm text-[#6b6b6b]">{studio.telefone}</p>
                      </div>
                    )}
                    {studio.instagram && (
                      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                        <AtSign className="mb-2 h-4 w-4 text-[#007AFF]" />
                        <p className="mb-1 text-[10px] tracking-[0.2em] text-[#8e8e93]">INSTAGRAM</p>
                        <p className="text-sm text-[#6b6b6b]">{studio.instagram}</p>
                      </div>
                    )}
                    {studio.website && (
                      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                        <Globe className="mb-2 h-4 w-4 text-[#007AFF]" />
                        <p className="mb-1 text-[10px] tracking-[0.2em] text-[#8e8e93]">WEBSITE</p>
                        <a href={studio.website} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-[#007AFF] hover:underline">
                          {studio.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                  <LeadForm studioId={studio.id} studioName={studio.nome} />
                </div>
              </section>
            )}
          </div>

          {/* RIGHT: sticky lead form (desktop, non-contact tabs) */}
          {activeTab !== 'contato' && (
            <div className="hidden w-80 shrink-0 lg:block xl:w-96">
              <div className="sticky top-[8.5rem]">
                <LeadForm studioId={studio.id} studioName={studio.nome} />
                <div className="mt-4 space-y-2.5">
                  {['Verificado pela ARC Platform', 'Gratuito e sem compromisso', 'Resposta garantida em 24 horas'].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-xs text-[#8e8e93]">
                      <div className="h-1 w-1 shrink-0 rounded-full bg-[#007AFF]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MOBILE: lead form below content */}
        {activeTab !== 'contato' && (
          <div className="mt-12 lg:hidden">
            <p className="mb-4 text-xs tracking-[0.35em] text-[#007AFF]">FALE COM O ESTÚDIO</p>
            <LeadForm studioId={studio.id} studioName={studio.nome} />
          </div>
        )}
      </div>

      {/* ── PORTFOLIO MODAL ─────────────────────────────────────────── */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#111] shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
            style={{ maxHeight: '92vh' }}>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                {selectedProject.categoria && (
                  <p className="mb-0.5 text-[10px] font-semibold tracking-[0.35em] text-[#007AFF]">
                    {selectedProject.categoria.toUpperCase()}
                  </p>
                )}
                <h3 className="text-base font-bold text-white">{selectedProject.nome}</h3>
                {selectedProject.descricao && (
                  <p className="mt-1 text-xs text-white/50 line-clamp-2">{selectedProject.descricao}</p>
                )}
              </div>
              <button onClick={closeModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white">
                <X size={15} />
              </button>
            </div>

            {/* Image */}
            <div className="relative flex-1 overflow-hidden bg-black" style={{ minHeight: 240 }}>
              {selectedProject.imagens.length > 0 ? (
                <>
                  <img
                    key={imgIdx}
                    src={selectedProject.imagens[imgIdx].url}
                    alt={`${selectedProject.nome} — foto ${imgIdx + 1}`}
                    className="h-full w-full object-contain"
                    style={{ maxHeight: '65vh' }}
                  />
                  {selectedProject.imagens.length > 1 && (
                    <>
                      <button onClick={prevImg}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70">
                        <ChevronLeft size={20} />
                      </button>
                      <button onClick={nextImg}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70">
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-60 items-center justify-center text-xs text-white/30">
                  Sem fotos neste projeto
                </div>
              )}
            </div>

            {/* Thumbnails + counter */}
            {selectedProject.imagens.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto px-5 py-3">
                <span className="mr-2 shrink-0 text-[10px] text-white/30">
                  {imgIdx + 1}/{selectedProject.imagens.length}
                </span>
                {selectedProject.imagens.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      i === imgIdx ? 'border-[#007AFF] opacity-100' : 'border-transparent opacity-40 hover:opacity-70'
                    }`}>
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="mt-8 border-t border-black/[0.08] bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="text-xl font-black tracking-[0.25em] text-[#1a1a1a]">ARC</Link>
          <p className="text-xs text-[#8e8e93]">© 2026 ARC Marketplace. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/privacidade" className="text-xs text-[#8e8e93] transition-colors hover:text-[#6b6b6b]">Privacidade</Link>
            <Link href="/termos-de-uso" className="text-xs text-[#8e8e93] transition-colors hover:text-[#6b6b6b]">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
