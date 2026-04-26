'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import CarrosselImagens from '@/components/shared/CarrosselImagens'
import Link from 'next/link'
import {
  Star, MapPin, CheckCircle2,
  Award, FolderOpen, Calendar, Globe,
  ChevronLeft, ChevronRight, X, MessageCircle,
} from 'lucide-react'

function InstagramIcon({ size = 15, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.01" strokeWidth="3" />
    </svg>
  )
}

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
  verificado?: boolean | null
}

// ─── StarRating ───────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i} size={13}
          fill={i <= Math.round(rating) ? '#FFB800' : 'none'}
          stroke={i <= Math.round(rating) ? '#FFB800' : '#c7c7cc'}
        />
      ))}
    </div>
  )
}

// ─── FadeSection — fade-in on scroll ─────────────────────────────────────────

function FadeSection({
  children, delay = 0, className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.unobserve(el) }
      },
      { threshold: 0.06 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(22px)',
        transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
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

  const inputCls =
    'w-full rounded-xl border border-black/[0.08] bg-[#f7f7f9] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none placeholder-[#b0b0b8] transition-all focus:border-[#007AFF]/40 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/10'

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#007AFF]/10">
          <CheckCircle2 size={22} className="text-[#007AFF]" />
        </div>
        <p className="font-semibold text-[#1a1a1a]">Mensagem enviada!</p>
        <p className="mt-1 text-sm text-[#8e8e93]">{studioName} entrará em contato em breve.</p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', message: '' }) }}
          className="mt-5 text-xs text-[#8e8e93] transition-colors hover:text-[#6b6b6b]"
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-[#8e8e93]">NOME COMPLETO</label>
        <input type="text" required placeholder="Seu nome" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-[#8e8e93]">EMAIL</label>
        <input type="email" required placeholder="seu@email.com" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-[#8e8e93]">TELEFONE</label>
        <input type="tel" placeholder="+55 11 99999-9999" value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-[#8e8e93]">MENSAGEM</label>
        <textarea required rows={3} placeholder="Descreva seu projeto, metragem, prazo estimado..."
          value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
          className={`${inputCls} resize-none`} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full rounded-xl bg-[#007AFF] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#0066d6] active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? 'Enviando...' : 'Enviar mensagem'}
      </button>
      <p className="text-center text-xs text-[#8e8e93]">Resposta em até 24h · Sem compromisso</p>
    </form>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EstudioPage({ params }: { params: { slug: string } }) {
  const [studio, setStudio] = useState<StudioData | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([])
  const [galeria, setGaleria] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#007AFF] border-t-transparent" />
      </div>
    )
  }

  if (!studio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
        <p className="text-lg font-semibold text-[#1a1a1a]">Escritório não encontrado</p>
        <Link href="/" className="text-sm text-[#007AFF] hover:underline">← Voltar ao marketplace</Link>
      </div>
    )
  }

  const yearsExp = studio.created_at
    ? new Date().getFullYear() - new Date(studio.created_at).getFullYear()
    : 0
  const locationStr = [studio.cidade, studio.estado].filter(Boolean).join(', ')
  const whatsappUrl = studio.telefone
    ? `https://wa.me/55${studio.telefone.replace(/\D/g, '')}`
    : null
  const instagramHandle = studio.instagram?.replace('@', '') ?? null
  const instagramUrl = instagramHandle ? `https://instagram.com/${instagramHandle}` : null

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.07)]'
            : 'bg-white border-b border-black/[0.06]'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10">
          <Link
            href="/"
            className="text-xl font-light tracking-[0.42em] text-[#1a1a1a] transition-opacity hover:opacity-60"
          >
            ARC
          </Link>
          <button
            onClick={() =>
              document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="rounded-[10px] bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-[#0066d6] active:scale-[0.97]"
          >
            Solicitar contato
          </button>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <div className="pt-16 bg-[#f7f7f9]">
        <div className="mx-auto max-w-[540px] px-4 py-10 md:py-14">
          <CarrosselImagens images={galeria} fallbackUrl={studio.cover_url} />
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-12 pb-32 lg:pb-20">
        <div className="flex flex-col lg:flex-row lg:items-start gap-10 xl:gap-20">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1 space-y-20">

            {/* IDENTITY */}
            <section>
              <div className="flex items-start gap-5">
                {studio.image_url && (
                  <div className="shrink-0 h-20 w-20 overflow-hidden rounded-full border border-black/[0.08] shadow-sm">
                    <img
                      src={studio.image_url} alt={studio.nome}
                      className="h-full w-full object-cover" loading="eager"
                    />
                  </div>
                )}
                <div className="min-w-0 pt-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h1 className="text-[28px] font-bold leading-tight text-[#1a1a1a]">
                      {studio.nome}
                    </h1>
                    {studio.verificado && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#007AFF]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#007AFF]">
                        <CheckCircle2 size={11} />
                        Verificado
                      </span>
                    )}
                  </div>

                  {locationStr && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin size={13} className="shrink-0 text-[#007AFF]" />
                      <span className="text-base text-[#666]">{locationStr}</span>
                    </div>
                  )}

                  {studio.rating && studio.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <StarRating rating={studio.rating} />
                      <span className="text-sm font-semibold text-[#1a1a1a]">
                        {studio.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {studio.bio && (
                <div className="mt-8 max-w-2xl">
                  {studio.bio.split('\n\n').map((p, i) => (
                    <p key={i} className="mb-4 text-base leading-[1.75] text-[#444] last:mb-0">{p}</p>
                  ))}
                </div>
              )}

              {studio.especialidades && studio.especialidades.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {studio.especialidades.map(e => (
                    <span
                      key={e}
                      className="rounded-full border border-black/[0.09] bg-white px-4 py-1.5 text-sm text-[#444] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* PORTFÓLIO */}
            {portfolio.length > 0 && (
              <FadeSection>
                <p className="mb-1.5 text-[11px] font-semibold tracking-[0.35em] text-[#007AFF]">
                  PORTFÓLIO
                </p>
                <h2 className="mb-8 text-2xl font-bold text-[#1a1a1a]">Projetos</h2>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {portfolio.map((project) => {
                    const firstImg = project.imagens[0]?.url
                    return (
                      <div
                        key={project.id}
                        onClick={() => openProject(project)}
                        className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_10px_32px_rgba(0,0,0,0.14)]"
                        style={{ aspectRatio: '4/5' }}
                      >
                        {firstImg ? (
                          <img
                            src={firstImg} alt={project.nome} loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#eee]">
                            <FolderOpen size={28} className="text-[#c7c7cc]" />
                          </div>
                        )}

                        {/* Bottom gradient always visible */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/65 to-transparent" />

                        {/* Project info */}
                        <div className="absolute inset-x-0 bottom-0 p-4">
                          {project.categoria && (
                            <p className="mb-0.5 text-[10px] font-semibold tracking-[0.25em] text-white/65">
                              {project.categoria.toUpperCase()}
                            </p>
                          )}
                          <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                            {project.nome}
                          </p>
                        </div>

                        {/* Blue tint on hover */}
                        <div className="pointer-events-none absolute inset-0 bg-[#007AFF]/8 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </div>
                    )
                  })}
                </div>
              </FadeSection>
            )}

            {/* SOBRE */}
            <FadeSection>
              <p className="mb-1.5 text-[11px] font-semibold tracking-[0.35em] text-[#007AFF]">
                SOBRE
              </p>
              <h2 className="mb-8 text-2xl font-bold text-[#1a1a1a]">O Escritório</h2>

              {/* Stats */}
              <div className="mb-10 grid grid-cols-3 gap-3">
                {[
                  {
                    icon: Calendar,
                    value: yearsExp > 0 ? `${yearsExp}` : '—',
                    unit: yearsExp === 1 ? 'ano' : 'anos',
                    label: 'na plataforma',
                  },
                  { icon: FolderOpen, value: `${portfolio.length}`, unit: '', label: 'projetos' },
                  {
                    icon: Award,
                    value: studio.rating ? studio.rating.toFixed(1) : '—',
                    unit: '',
                    label: 'avaliação',
                  },
                ].map(({ icon: Icon, value, unit, label }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-black/[0.07] bg-[#f9f9fb] p-5"
                  >
                    <Icon size={18} className="mb-3 text-[#007AFF]" />
                    <p className="text-2xl font-bold text-[#1a1a1a]">
                      {value}
                      {unit && (
                        <span className="ml-1 text-base font-normal text-[#8e8e93]">{unit}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-[#8e8e93]">{label}</p>
                  </div>
                ))}
              </div>

              {/* Responsável */}
              {studio.nome_responsavel && (
                <div>
                  <p className="mb-4 text-[11px] font-semibold tracking-[0.35em] text-[#8e8e93]">
                    RESPONSÁVEL
                  </p>
                  <div className="flex items-center gap-4">
                    {studio.image_url && (
                      <img
                        src={studio.image_url} alt={studio.nome_responsavel}
                        className="h-14 w-14 rounded-full border border-black/[0.08] object-cover"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-[#1a1a1a]">{studio.nome_responsavel}</p>
                      <p className="text-sm text-[#8e8e93]">Arquiteto responsável</p>
                    </div>
                  </div>
                </div>
              )}
            </FadeSection>

          </div>

          {/* ── RIGHT COLUMN — STICKY CONTACT ───────────────────────────── */}
          <div id="contact-section" className="w-full lg:w-[380px] xl:w-[420px] shrink-0">
            <div className="lg:sticky" style={{ top: 96 }}>

              {/* Contact form card */}
              <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
                <div className="border-b border-black/[0.06] px-6 py-5">
                  <h3 className="text-lg font-bold text-[#1a1a1a]">Entre em contato</h3>
                  <p className="mt-0.5 text-xs text-[#8e8e93]">
                    Resposta em até 24h · Sem compromisso
                  </p>
                </div>
                <div className="px-6 py-5">
                  <LeadForm studioId={studio.id} studioName={studio.nome} />
                </div>
              </div>

              {/* Contact links */}
              {(studio.telefone || studio.instagram || studio.website) && (
                <div className="mt-3 space-y-0 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  {studio.telefone && whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#f9f9fb] group border-b border-black/[0.04] last:border-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/12">
                        <MessageCircle size={15} className="text-[#25D366]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-[0.15em] text-[#8e8e93]">
                          WHATSAPP
                        </p>
                        <p className="truncate text-sm text-[#1a1a1a] transition-colors group-hover:text-[#007AFF]">
                          {studio.telefone}
                        </p>
                      </div>
                    </a>
                  )}
                  {instagramUrl && instagramHandle && (
                    <a
                      href={instagramUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#f9f9fb] group border-b border-black/[0.04] last:border-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E1306C]/10">
                        <InstagramIcon size={15} className="text-[#E1306C]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-[0.15em] text-[#8e8e93]">
                          INSTAGRAM
                        </p>
                        <p className="truncate text-sm text-[#1a1a1a] transition-colors group-hover:text-[#007AFF]">
                          @{instagramHandle}
                        </p>
                      </div>
                    </a>
                  )}
                  {studio.website && (
                    <a
                      href={studio.website}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#f9f9fb] group border-b border-black/[0.04] last:border-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#007AFF]/10">
                        <Globe size={15} className="text-[#007AFF]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-[0.15em] text-[#8e8e93]">
                          WEBSITE
                        </p>
                        <p className="truncate text-sm text-[#1a1a1a] transition-colors group-hover:text-[#007AFF]">
                          {studio.website.replace(/^https?:\/\//, '')}
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              )}

              {/* Trust badges */}
              <div className="mt-4 space-y-2 px-1">
                {[
                  'Verificado pela ARC Platform',
                  'Gratuito e sem compromisso',
                  'Resposta garantida em 24 horas',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-[#8e8e93]">
                    <div className="h-1 w-1 shrink-0 rounded-full bg-[#007AFF]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE FIXED CTA ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.06] bg-white/92 p-4 backdrop-blur-md lg:hidden">
        <button
          onClick={() =>
            document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })
          }
          className="w-full rounded-xl bg-[#007AFF] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#0066d6] active:scale-[0.98]"
        >
          Solicitar contato
        </button>
      </div>

      {/* ── PORTFOLIO MODAL ─────────────────────────────────────────────── */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#111] shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
            style={{ maxHeight: '92vh' }}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                {selectedProject.categoria && (
                  <p className="mb-0.5 text-[10px] font-semibold tracking-[0.35em] text-[#007AFF]">
                    {selectedProject.categoria.toUpperCase()}
                  </p>
                )}
                <h3 className="text-base font-bold text-white">{selectedProject.nome}</h3>
                {selectedProject.descricao && (
                  <p className="mt-1 line-clamp-2 text-xs text-white/50">
                    {selectedProject.descricao}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            {/* Image area */}
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
                      <button
                        onClick={prevImg}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextImg}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                      >
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

            {/* Thumbnails */}
            {selectedProject.imagens.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto px-5 py-3">
                <span className="mr-2 shrink-0 text-[10px] text-white/30">
                  {imgIdx + 1}/{selectedProject.imagens.length}
                </span>
                {selectedProject.imagens.map((img, i) => (
                  <button
                    key={i} onClick={() => setImgIdx(i)}
                    className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      i === imgIdx ? 'border-[#007AFF] opacity-100' : 'border-transparent opacity-40 hover:opacity-70'
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-black/[0.08] bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="text-xl font-light tracking-[0.42em] text-[#1a1a1a]">ARC</Link>
          <p className="text-xs text-[#8e8e93]">© 2026 ARC Marketplace. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/privacidade" className="text-xs text-[#8e8e93] transition-colors hover:text-[#6b6b6b]">
              Privacidade
            </Link>
            <Link href="/termos-de-uso" className="text-xs text-[#8e8e93] transition-colors hover:text-[#6b6b6b]">
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
