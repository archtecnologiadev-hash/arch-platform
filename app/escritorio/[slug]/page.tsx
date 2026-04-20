'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import {
  Star, MapPin, ArrowLeft, CheckCircle2,
  Award, Users, FolderOpen, Calendar,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TeamMember {
  name: string
  role: string
  photo: string
}

interface PortfolioItem {
  id: number
  title: string
  category: string
  location: string
  year: number
  image: string
  tall: boolean
}

interface Testimonial {
  name: string
  city: string
  rating: number
  text: string
  photo: string
  project: string
}

interface Studio {
  name: string
  city: string
  state: string
  specialty: string
  rating: number
  reviews: number
  founded: number
  projects: number
  coverImage: string
  bio: string
  team: TeamMember[]
  portfolio: PortfolioItem[]
  testimonials: Testimonial[]
  email: string
  phone: string
  instagram: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const STUDIOS: Record<string, Studio> = {
  'estudio-brasilis': {
    name: 'Estúdio Brasilis',
    city: 'São Paulo',
    state: 'SP',
    specialty: 'Arquitetura Residencial Contemporânea',
    rating: 4.9,
    reviews: 124,
    founded: 2008,
    projects: 247,
    coverImage:
      'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1600&h=800&fit=crop&q=90',
    bio: `Fundado em 2008, o Estúdio Brasilis é referência em arquitetura residencial de alto padrão em São Paulo. Com quase duas décadas de experiência, desenvolvemos projetos que equilibram sofisticação, funcionalidade e identidade única para cada cliente.

Nossa filosofia parte de uma premissa simples: cada espaço deve ser um reflexo autêntico de quem o habita. Por isso, cada projeto começa com uma escuta profunda — dos sonhos, do modo de vida e das necessidades de cada família.

Premiados pelo IAB-SP em 2019 e 2022, somos reconhecidos pela excelência técnica, pelo comprometimento com os prazos e pelo acompanhamento próximo em todas as etapas da obra.`,
    team: [
      {
        name: 'Ricardo Almeida',
        role: 'Sócio-fundador & Diretor Criativo',
        photo:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&q=80',
      },
      {
        name: 'Fernanda Lopes',
        role: 'Arquiteta Sênior & Sócia',
        photo:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&q=80',
      },
      {
        name: 'Thiago Martins',
        role: 'Diretor de Projetos',
        photo:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&q=80',
      },
      {
        name: 'Camila Souza',
        role: 'Arquiteta de Interiores',
        photo:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&q=80',
      },
    ],
    portfolio: [
      {
        id: 1,
        title: 'Residência Vale Verde',
        category: 'Residencial',
        location: 'Granja Viana, SP',
        year: 2023,
        image:
          'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&h=540&fit=crop&q=85',
        tall: false,
      },
      {
        id: 2,
        title: 'Penthouse Jardins',
        category: 'Interior',
        location: 'Jardins, SP',
        year: 2023,
        image:
          'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=960&fit=crop&q=85',
        tall: true,
      },
      {
        id: 3,
        title: 'Casa Minimalista Alphaville',
        category: 'Residencial',
        location: 'Alphaville, SP',
        year: 2022,
        image:
          'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=520&fit=crop&q=85',
        tall: false,
      },
      {
        id: 4,
        title: 'Villa Morumbi',
        category: 'Residencial',
        location: 'Morumbi, SP',
        year: 2022,
        image:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=980&fit=crop&q=85',
        tall: true,
      },
      {
        id: 5,
        title: 'Loft Pinheiros',
        category: 'Interior',
        location: 'Pinheiros, SP',
        year: 2023,
        image:
          'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800&h=490&fit=crop&q=85',
        tall: false,
      },
      {
        id: 6,
        title: 'Cobertura Itaim',
        category: 'Interior',
        location: 'Itaim Bibi, SP',
        year: 2021,
        image:
          'https://images.unsplash.com/photo-1600607687939-ce8a6f349abc?w=800&h=680&fit=crop&q=85',
        tall: false,
      },
    ],
    testimonials: [
      {
        name: 'Ana Paula Vieira',
        city: 'São Paulo, SP',
        rating: 5,
        project: 'Residência Vale Verde',
        photo:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80',
        text: 'Trabalhar com o Estúdio Brasilis foi transformador. O Ricardo e a Fernanda entenderam exatamente o que queríamos — um espaço moderno, mas com alma. Cada detalhe foi pensado com precisão. O projeto foi entregue no prazo e superou todas as nossas expectativas.',
      },
      {
        name: 'Carlos Henrique Prado',
        city: 'Alphaville, SP',
        rating: 5,
        project: 'Casa Minimalista Alphaville',
        photo:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80',
        text: 'Já contratei outros escritórios antes, mas o nível de comprometimento do Estúdio Brasilis é diferente. A comunicação foi impecável, o cronograma foi respeitado e o resultado final é simplesmente deslumbrante. Recomendo sem hesitar.',
      },
      {
        name: 'Mariana Rezende',
        city: 'Jardins, SP',
        rating: 5,
        project: 'Penthouse Jardins',
        photo:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80',
        text: 'O Penthouse ficou exatamente como eu sonhei — e ainda melhor. A atenção aos materiais, à iluminação e aos pequenos detalhes faz toda a diferença. Um processo muito estruturado que transmite confiança desde o primeiro dia.',
      },
    ],
    email: 'contato@studiobrasilis.com.br',
    phone: '+55 11 3456-7890',
    instagram: '@studiobrasilis',
  },
}

// Fallback genérico para slugs sem dados detalhados
const GENERIC_FALLBACK = STUDIOS['estudio-brasilis']

// ─── Helper: Star rating ──────────────────────────────────────────────────────

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

function LeadForm({ studioName }: { studioName: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 900)
  }

  const field = (
    key: keyof typeof form,
    label: string,
    type: string,
    placeholder: string,
    required = true
  ) => (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-[#8e8e93]">
        {label}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={form[key]}
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
        <p className="mt-2 text-sm text-[#6b6b6b]">
          O {studioName} retornará em até 24 horas úteis.
        </p>
        <button
          onClick={() => {
            setSubmitted(false)
            setForm({ name: '', email: '', phone: '', message: '' })
          }}
          className="mt-6 text-xs text-[#8e8e93] transition-colors hover:text-[#6b6b6b]"
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="border-b border-black/[0.08] px-5 py-4">
        <h3 className="text-sm font-bold text-[#1a1a1a]">Solicitar Contato</h3>
        <p className="mt-0.5 text-xs text-[#8e8e93]">Resposta em até 24 horas úteis · Sem compromisso</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 p-5">
        {field('name', 'NOME COMPLETO', 'text', 'Seu nome completo')}
        {field('email', 'EMAIL', 'email', 'seu@email.com')}
        {field('phone', 'TELEFONE', 'tel', '+55 11 99999-9999', false)}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.18em] text-[#8e8e93]">
            MENSAGEM
          </label>
          <textarea
            required
            rows={4}
            placeholder="Descreva seu projeto, metragem, prazo estimado..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full resize-none rounded-xl border border-black/[0.08] bg-[#f2f2f7] px-3 py-2.5 text-sm text-[#1a1a1a] outline-none placeholder-[#8e8e93] transition-colors focus:border-[#007AFF]/40 focus:bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[10px] bg-[#007AFF] py-3.5 text-xs font-bold tracking-[0.22em] text-white transition-all hover:bg-[#0066d6] disabled:opacity-60"
        >
          {loading ? 'ENVIANDO...' : 'SOLICITAR CONTATO'}
        </button>
      </form>
    </div>
  )
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = ['portfolio', 'sobre', 'avaliacoes', 'contato'] as const
type Tab = (typeof TABS)[number]
const TAB_LABELS: Record<Tab, string> = {
  portfolio: 'Portfólio',
  sobre: 'Sobre',
  avaliacoes: 'Avaliações',
  contato: 'Contato',
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EstudioPage({ params }: { params: { slug: string } }) {
  const mockBase = STUDIOS[params.slug] ?? GENERIC_FALLBACK
  const [studio, setStudio] = useState<Studio>(mockBase)
  const [activeTab, setActiveTab] = useState<Tab>('portfolio')

  useEffect(() => {
    async function loadFromDB() {
      const supabase = createClient()
      const { data } = await supabase
        .from('escritorios').select('*').eq('slug', params.slug).single()
      if (data) {
        setStudio(prev => ({
          ...prev,
          name: data.nome ?? prev.name,
          city: data.cidade ?? prev.city,
          state: data.estado ?? prev.state,
          specialty: data.estilo ?? prev.specialty,
          bio: data.bio ?? prev.bio,
          rating: data.rating ?? prev.rating,
          phone: data.telefone ?? prev.phone,
          instagram: data.instagram ?? prev.instagram,
        }))
      }
    }
    loadFromDB()
  }, [params.slug])
  const yearsExp = new Date().getFullYear() - studio.founded

  return (
    <div className="min-h-screen bg-[#f2f2f7] text-[#1a1a1a]">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-black/[0.08] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="flex items-center gap-2 text-[#8e8e93] transition-colors hover:text-[#1a1a1a]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden text-xs tracking-wider sm:block">VOLTAR</span>
            </Link>
            <div className="h-4 w-px bg-black/[0.08]" />
            <Link href="/" className="text-xl font-black tracking-[0.25em] text-[#1a1a1a]">
              ARC
            </Link>
          </div>
          <Link
            href="/login"
            className="rounded-[10px] border border-[#007AFF] px-5 py-2 text-xs font-semibold tracking-widest text-[#007AFF] transition-all hover:bg-[#007AFF] hover:text-white"
          >
            ENTRAR
          </Link>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative h-[72vh] max-h-[700px] min-h-[480px] pt-16">
        <img
          src={studio.coverImage}
          alt={studio.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

        {/* Studio info anchored to bottom */}
        <div className="absolute inset-x-0 bottom-0 pb-10">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-2 text-xs font-semibold tracking-[0.4em] text-[#007AFF]">
              {studio.specialty.toUpperCase()}
            </p>
            <h1 className="mb-5 text-5xl font-black leading-none text-white md:text-7xl lg:text-8xl">
              {studio.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5 text-white/70">
                <MapPin className="h-3.5 w-3.5 text-[#007AFF]" />
                <span className="text-sm">{studio.city}, {studio.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={studio.rating} size="md" />
                <span className="font-bold text-white">{studio.rating}</span>
                <span className="text-sm text-white/50">({studio.reviews} avaliações)</span>
              </div>
              <div className="hidden items-center gap-3 text-xs text-white/50 sm:flex">
                <span>Desde {studio.founded}</span>
                <span className="text-white/20">·</span>
                <span>{studio.projects}+ projetos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TAB NAV ─────────────────────────────────────────────────── */}
      <nav className="sticky top-16 z-30 border-b border-black/[0.08] bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 border-b-2 px-5 py-4 text-xs font-semibold tracking-[0.2em] transition-all md:px-7 ${
                  activeTab === tab
                    ? 'border-[#007AFF] text-[#007AFF]'
                    : 'border-transparent text-[#8e8e93] hover:text-[#6b6b6b]'
                }`}
              >
                {TAB_LABELS[tab].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-start gap-10">

          {/* ── LEFT: tab content ── */}
          <div className="min-w-0 flex-1">

            {/* PORTFÓLIO */}
            {activeTab === 'portfolio' && (
              <section>
                <header className="mb-8">
                  <p className="text-xs tracking-[0.35em] text-[#007AFF]">PORTFÓLIO</p>
                  <h2 className="mt-1 text-3xl font-black text-[#1a1a1a]">Projetos Selecionados</h2>
                </header>

                {/* CSS masonry via columns */}
                <div className="columns-1 gap-4 sm:columns-2">
                  {studio.portfolio.map((project) => (
                    <div
                      key={project.id}
                      className="group relative mb-4 cursor-pointer overflow-hidden break-inside-avoid rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    >
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        style={{ height: project.tall ? '430px' : '270px' }}
                      />
                      {/* Static bottom fade */}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 group-hover:opacity-0" />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6 text-center opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                        <span className="mb-2 text-[10px] font-semibold tracking-[0.35em] text-[#007AFF]">
                          {project.category.toUpperCase()}
                        </span>
                        <h3 className="text-lg font-bold text-white">{project.title}</h3>
                        <p className="mt-1.5 text-xs text-white/70">
                          {project.location} · {project.year}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SOBRE */}
            {activeTab === 'sobre' && (
              <section className="space-y-14">
                <div>
                  <p className="text-xs tracking-[0.35em] text-[#007AFF]">SOBRE</p>
                  <h2 className="mt-1 mb-8 text-3xl font-black text-[#1a1a1a]">O Estúdio</h2>

                  {/* Stats grid */}
                  <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { icon: Calendar, value: `${yearsExp} anos`, label: 'de experiência' },
                      { icon: FolderOpen, value: `${studio.projects}+`, label: 'projetos' },
                      { icon: Users, value: `${studio.team.length}`, label: 'profissionais' },
                      { icon: Award, value: '7', label: 'prêmios IAB' },
                    ].map(({ icon: Icon, value, label }) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                      >
                        <Icon className="mb-3 h-5 w-5 text-[#007AFF]" />
                        <p className="text-2xl font-black text-[#1a1a1a]">{value}</p>
                        <p className="mt-0.5 text-xs text-[#8e8e93]">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Bio */}
                  <div className="max-w-2xl space-y-4">
                    {studio.bio.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="leading-relaxed text-[#6b6b6b]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Team */}
                <div>
                  <p className="mb-6 text-xs tracking-[0.35em] text-[#007AFF]">EQUIPE</p>
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                    {studio.team.map((member) => (
                      <div key={member.name} className="group text-center">
                        <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="h-full w-full object-cover transition-all duration-500"
                          />
                        </div>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{member.name}</p>
                        <p className="mt-1 text-xs leading-snug text-[#8e8e93]">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* AVALIAÇÕES */}
            {activeTab === 'avaliacoes' && (
              <section>
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-[0.35em] text-[#007AFF]">AVALIAÇÕES</p>
                    <h2 className="mt-1 text-3xl font-black text-[#1a1a1a]">O que dizem os clientes</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black text-[#1a1a1a]">{studio.rating}</p>
                    <StarRating rating={studio.rating} size="md" />
                    <p className="mt-1 text-xs text-[#8e8e93]">{studio.reviews} avaliações</p>
                  </div>
                </div>

                {/* Rating breakdown bars */}
                <div className="mb-10 max-w-xs space-y-2">
                  {[
                    { stars: 5, pct: 87 },
                    { stars: 4, pct: 10 },
                    { stars: 3, pct: 3 },
                    { stars: 2, pct: 0 },
                    { stars: 1, pct: 0 },
                  ].map(({ stars, pct }) => (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="w-3 text-right text-xs text-[#8e8e93]">{stars}</span>
                      <Star className="h-3 w-3 shrink-0 text-[#007AFF]" fill="currentColor" />
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className="h-full rounded-full bg-[#007AFF]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-xs text-[#8e8e93]">{pct}%</span>
                    </div>
                  ))}
                </div>

                {/* Testimonial cards */}
                <div className="space-y-4">
                  {studio.testimonials.map((t) => (
                    <div
                      key={t.name}
                      className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={t.photo}
                            alt={t.name}
                            className="h-11 w-11 shrink-0 rounded-full border border-black/[0.08] object-cover"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#1a1a1a]">{t.name}</p>
                            <p className="text-xs text-[#8e8e93]">{t.city}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <StarRating rating={t.rating} />
                          <p className="mt-1 text-[10px] text-[#8e8e93]">{t.project}</p>
                        </div>
                      </div>
                      <p className="leading-relaxed text-sm italic text-[#6b6b6b]">
                        &ldquo;{t.text}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CONTATO */}
            {activeTab === 'contato' && (
              <section>
                <div className="mb-8">
                  <p className="text-xs tracking-[0.35em] text-[#007AFF]">CONTATO</p>
                  <h2 className="mt-1 mb-8 text-3xl font-black text-[#1a1a1a]">Fale com o Estúdio</h2>
                  <div className="mb-8 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: 'EMAIL', value: studio.email },
                      { label: 'TELEFONE', value: studio.phone },
                      { label: 'INSTAGRAM', value: studio.instagram },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                      >
                        <p className="mb-1 text-[10px] tracking-[0.2em] text-[#8e8e93]">{label}</p>
                        <p className="text-sm text-[#6b6b6b]">{value}</p>
                      </div>
                    ))}
                  </div>
                  <LeadForm studioName={studio.name} />
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT: sticky lead form (desktop, hidden on Contato tab) ── */}
          {activeTab !== 'contato' && (
            <div className="hidden w-80 shrink-0 lg:block xl:w-96">
              <div className="sticky top-[8.5rem]">
                <LeadForm studioName={studio.name} />
                <div className="mt-4 space-y-2.5">
                  {[
                    'Verificado pela ARC Platform',
                    'Gratuito e sem compromisso',
                    'Resposta garantida em 24 horas',
                  ].map((item) => (
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

        {/* ── MOBILE: form below content (all tabs except Contato) ── */}
        {activeTab !== 'contato' && (
          <div className="mt-12 lg:hidden">
            <p className="mb-4 text-xs tracking-[0.35em] text-[#007AFF]">FALE COM O ESTÚDIO</p>
            <LeadForm studioName={studio.name} />
          </div>
        )}
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="mt-8 border-t border-black/[0.08] bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="text-xl font-black tracking-[0.25em] text-[#1a1a1a]">
            ARC
          </Link>
          <p className="text-xs text-[#8e8e93]">© 2026 ARC Marketplace. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            {['Privacidade', 'Termos'].map((item) => (
              <a key={item} href="#" className="text-xs text-[#8e8e93] transition-colors hover:text-[#6b6b6b]">
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
