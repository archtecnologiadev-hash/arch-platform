'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, MapPin, ArrowRight, Menu, X, SlidersHorizontal } from 'lucide-react'

const studios = [
  {
    id: 1,
    slug: 'estudio-brasilis',
    name: 'Estúdio Brasilis',
    city: 'São Paulo',
    state: 'SP',
    style: 'Contemporâneo',
    rating: 4.9,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80',
    tagline: 'Residências de alto padrão',
  },
  {
    id: 2,
    slug: 'arquitetura-viva',
    name: 'Arquitetura Viva',
    city: 'Rio de Janeiro',
    state: 'RJ',
    style: 'Minimalista',
    rating: 4.8,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop&q=80',
    tagline: 'Espaços que respiram',
  },
  {
    id: 3,
    slug: 'nova-forma-studio',
    name: 'Nova Forma Studio',
    city: 'Belo Horizonte',
    state: 'MG',
    style: 'Comercial',
    rating: 4.7,
    reviews: 67,
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop&q=80',
    tagline: 'Arquitetura corporativa',
  },
  {
    id: 4,
    slug: 'atelie-minimal',
    name: 'Ateliê Minimal',
    city: 'Curitiba',
    state: 'PR',
    style: 'Minimalista',
    rating: 4.9,
    reviews: 103,
    image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop&q=80',
    tagline: 'Menos é infinitamente mais',
  },
  {
    id: 5,
    slug: 'forma-e-espaco',
    name: 'Forma & Espaço',
    city: 'Porto Alegre',
    state: 'RS',
    style: 'Sustentável',
    rating: 4.8,
    reviews: 78,
    image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&h=600&fit=crop&q=80',
    tagline: 'Design com propósito',
  },
  {
    id: 6,
    slug: 'urbano-arquitetura',
    name: 'Urbano Arquitetura',
    city: 'Brasília',
    state: 'DF',
    style: 'Urbanismo',
    rating: 4.6,
    reviews: 45,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80',
    tagline: 'Cidade e identidade urbana',
  },
  {
    id: 7,
    slug: 'casa-e-conceito',
    name: 'Casa & Conceito',
    city: 'São Paulo',
    state: 'SP',
    style: 'Residencial',
    rating: 4.7,
    reviews: 91,
    image: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800&h=600&fit=crop&q=80',
    tagline: 'Interiores que contam histórias',
  },
  {
    id: 8,
    slug: 'linha-arquitetos',
    name: 'Linha Arquitetos',
    city: 'Florianópolis',
    state: 'SC',
    style: 'Contemporâneo',
    rating: 4.9,
    reviews: 56,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6f349abc?w=800&h=600&fit=crop&q=80',
    tagline: 'Modernidade à beira-mar',
  },
]

const STYLES = ['Todos', 'Residencial', 'Contemporâneo', 'Minimalista', 'Comercial', 'Sustentável', 'Urbanismo']
const CITIES = ['Todas', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Brasília', 'Florianópolis']

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="h-3 w-3" fill={i <= Math.round(rating) ? 'currentColor' : 'none'} />
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [selectedStyle, setSelectedStyle] = useState('Todos')
  const [selectedCity, setSelectedCity] = useState('Todas')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const filtered = studios.filter(
    (s) =>
      (selectedStyle === 'Todos' || s.style === selectedStyle) &&
      (selectedCity === 'Todas' || s.city === selectedCity)
  )

  return (
    <div className="min-h-screen bg-[#f2f2f7] text-[#1a1a1a]">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-black/[0.07] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-light tracking-[0.35em] text-black">
            ARC
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {['Escritórios', 'Projetos', 'Sobre'].map((item) => (
              <a key={item} href="#" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/cadastro" className="hidden text-sm font-light text-[#8e8e93] hover:text-black md:block">
              Cadastrar
            </Link>
            <Link
              href="/login"
              className="rounded-[8px] bg-[#007AFF] px-4 py-1.5 text-sm font-light text-white transition-opacity hover:opacity-90"
            >
              Entrar
            </Link>
            <button className="text-[#8e8e93] md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-black/[0.07] bg-white/95 px-5 py-3 md:hidden">
            {['Escritórios', 'Projetos', 'Sobre', 'Cadastrar'].map((item) => (
              <a key={item} href="#" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black">
                {item}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO — full-width dense grid with text overlay ── */}
      <section className="relative pt-14">
        {/* Dense cards grid — fills the screen */}
        <div className="grid grid-cols-1 gap-px bg-black/[0.06] sm:grid-cols-2 lg:grid-cols-3">
          {studios.map((studio) => (
            <Link
              key={studio.id}
              href={`/escritorio/${studio.slug}`}
              className="group relative block overflow-hidden bg-white"
            >
              <div className="relative h-[42vh] min-h-[240px] overflow-hidden sm:h-[46vh]">
                <img
                  src={studio.image}
                  alt={studio.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient for bottom text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                {/* Hover shimmer */}
                <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover:bg-white/[0.04]" />

                {/* Style pill */}
                <div className="absolute left-3 top-3">
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-light text-[#3a3a3a] backdrop-blur-sm">
                    {studio.style}
                  </span>
                </div>

                {/* Studio info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-sm font-light text-white">{studio.name}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-white/60" />
                    <span className="text-xs font-light text-white/70">{studio.city}, {studio.state}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Text overlay — frosted glass card, top-left */}
        <div className="absolute left-5 top-[calc(3.5rem+1.5rem)] z-10 w-72 sm:left-8 sm:w-80">
          <div className="rounded-2xl bg-white/88 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl">
            <p className="mb-3 text-[10px] font-light tracking-[0.45em] text-[#8e8e93] uppercase">
              Plataforma de Arquitetura
            </p>
            <h1 className="mb-3 text-[1.55rem] font-extralight leading-snug text-black">
              Encontre o arquiteto certo para o seu projeto.
            </h1>
            <p className="mb-5 text-xs font-light leading-relaxed text-[#8e8e93]">
              Escritórios verificados. Portfólios reais. Sem intermediários.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="#escritorios"
                className="flex items-center justify-center gap-2 rounded-[8px] bg-[#007AFF] py-2.5 text-sm font-light text-white transition-opacity hover:opacity-90"
              >
                Explorar escritórios
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <Link
                href="/cadastro"
                className="py-2 text-center text-sm font-light text-[#007AFF] transition-opacity hover:opacity-70"
              >
                Sou arquiteto →
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-3 flex gap-2">
            {[
              { value: '500+', label: 'Projetos' },
              { value: '200+', label: 'Escritórios' },
              { value: '98%', label: 'Satisfação' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-xl bg-white/88 py-3 text-center backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
              >
                <p className="text-base font-extralight text-black">{stat.value}</p>
                <p className="text-[10px] font-light text-[#8e8e93]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDIOS SECTION ─────────────────────────────────── */}
      <section id="escritorios" className="bg-[#f2f2f7] px-5 py-10">
        <div className="mx-auto max-w-7xl">

          {/* Section header + filter toggle */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-light tracking-[0.4em] text-[#8e8e93] uppercase">Escritórios</p>
              <h2 className="mt-1 text-2xl font-extralight text-black">Todos os escritórios</h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-light transition-all ${
                showFilters ? 'bg-black text-white' : 'bg-white text-[#6b6b6b] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
            </button>
          </div>

          {/* Filters — iOS pill style */}
          {showFilters && (
            <div className="mb-6 space-y-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11px] font-light text-[#8e8e93]">Estilo</span>
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStyle(s)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-light transition-all ${
                      selectedStyle === s ? 'bg-black text-white' : 'bg-[#f2f2f7] text-[#3a3a3a] hover:bg-[#e5e5ea]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11px] font-light text-[#8e8e93]">Cidade</span>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCity(c)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-light transition-all ${
                      selectedCity === c ? 'bg-black text-white' : 'bg-[#f2f2f7] text-[#3a3a3a] hover:bg-[#e5e5ea]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white py-20 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <p className="text-sm font-light text-[#8e8e93]">Nenhum escritório encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((studio) => (
                <Link
                  key={studio.id}
                  href={`/escritorio/${studio.slug}`}
                  className="group block overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={studio.image}
                      alt={studio.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-light text-[#3a3a3a] backdrop-blur-sm">
                        {studio.style}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-0.5 text-sm font-light text-black">{studio.name}</h3>
                    <p className="mb-3 text-xs font-light text-[#8e8e93]">{studio.tagline}</p>
                    <div className="mb-3 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-[#c7c7cc]" />
                      <span className="text-xs font-light text-[#8e8e93]">{studio.city}, {studio.state}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-light text-[#6b6b6b]">{studio.rating}</span>
                        <div className="text-[#c7c7cc]">
                          <StarRating rating={studio.rating} />
                        </div>
                        <span className="text-[10px] font-light text-[#c7c7cc]">({studio.reviews})</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-light text-[#007AFF] opacity-0 transition-opacity group-hover:opacity-100">
                        Ver portfólio <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section className="px-5 pb-12">
        <div className="mx-auto max-w-7xl rounded-2xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] md:p-10">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <p className="mb-2 text-[10px] font-light tracking-[0.35em] text-[#8e8e93] uppercase">Para arquitetos</p>
              <h3 className="text-xl font-extralight text-black">
                Mostre seu trabalho para milhares de clientes.
              </h3>
              <p className="mt-2 text-sm font-light text-[#8e8e93]">
                Cadastre seu escritório gratuitamente e comece a receber projetos.
              </p>
            </div>
            <Link
              href="/cadastro"
              className="shrink-0 rounded-[8px] bg-[#007AFF] px-7 py-3 text-sm font-light text-white transition-opacity hover:opacity-90"
            >
              Criar perfil grátis
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-black/[0.06] bg-white px-5 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 md:flex-row">
          <span className="text-base font-light tracking-[0.3em] text-black">ARC</span>
          <p className="text-xs font-light text-[#c7c7cc]">© 2026 ARC Marketplace. Todos os direitos reservados.</p>
          <div className="flex gap-5">
            {['Privacidade', 'Termos', 'Cookies'].map((item) => (
              <a key={item} href="#" className="text-xs font-light text-[#c7c7cc] transition-colors hover:text-[#8e8e93]">
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
