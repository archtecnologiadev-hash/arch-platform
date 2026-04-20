'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, MapPin, ArrowRight, Menu, X } from 'lucide-react'

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
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&h=460&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=700&h=460&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&h=460&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=700&h=460&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=700&h=460&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=460&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=700&h=460&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6f349abc?w=700&h=460&fit=crop&q=80',
    tagline: 'Modernidade à beira-mar',
  },
]

const STYLES = ['Todos', 'Residencial', 'Contemporâneo', 'Minimalista', 'Comercial', 'Sustentável', 'Urbanismo']
const CITIES = ['Todas', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Brasília', 'Florianópolis']

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-3 w-3"
          fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [selectedStyle, setSelectedStyle] = useState('Todos')
  const [selectedCity, setSelectedCity] = useState('Todas')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const filtered = studios.filter(
    (s) =>
      (selectedStyle === 'Todos' || s.style === selectedStyle) &&
      (selectedCity === 'Todas' || s.city === selectedCity)
  )

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-lg font-light tracking-[0.35em] text-black">ARC</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {['Escritórios', 'Projetos', 'Sobre', 'Blog'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-light text-[#aaa] transition-colors hover:text-black"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/cadastro"
              className="hidden text-sm font-light text-[#aaa] transition-colors hover:text-black md:block"
            >
              Cadastrar
            </Link>
            <Link
              href="/login"
              className="border border-black/70 px-5 py-1.5 text-sm font-light text-black transition-all hover:bg-black hover:text-white"
            >
              Entrar
            </Link>
            <button
              className="text-[#aaa] md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-black/[0.06] bg-white px-6 py-4 md:hidden">
            {['Escritórios', 'Projetos', 'Sobre', 'Blog', 'Cadastrar'].map((item) => (
              <a key={item} href="#" className="block py-3 text-sm font-light text-[#777] hover:text-black">
                {item}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">

          {/* Left: text */}
          <div>
            <p className="mb-8 text-[11px] font-light tracking-[0.45em] text-[#bbb] uppercase">
              Plataforma de Arquitetura
            </p>
            <h1 className="mb-6 text-[2.6rem] font-extralight leading-[1.18] tracking-tight text-black md:text-5xl">
              Encontre o arquiteto
              <br />
              certo para o seu
              <br />
              projeto.
            </h1>
            <p className="mb-10 max-w-[340px] text-sm font-light leading-relaxed text-[#999]">
              Descubra escritórios excepcionais, compare portfólios e inicie seu projeto com confiança.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#escritorios"
                className="flex items-center gap-2 bg-black px-6 py-3 text-sm font-light text-white transition-colors hover:bg-[#222]"
              >
                Explorar escritórios
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <Link
                href="/cadastro"
                className="text-sm font-light text-[#999] transition-colors hover:text-black"
              >
                Sou arquiteto →
              </Link>
            </div>

            <div className="mt-14 flex gap-10 border-t border-black/[0.07] pt-10">
              {[
                { value: '500+', label: 'Projetos' },
                { value: '200+', label: 'Escritórios' },
                { value: '98%', label: 'Satisfação' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-extralight text-black">{stat.value}</p>
                  <p className="mt-0.5 text-xs font-light text-[#bbb]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: preview grid of first 4 cards */}
          <div className="hidden grid-cols-2 gap-4 lg:grid">
            {studios.slice(0, 4).map((studio) => (
              <Link
                key={studio.id}
                href={`/escritorio/${studio.slug}`}
                className="group block overflow-hidden border border-black/[0.07] bg-white transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)]"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={studio.image}
                    alt={studio.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-light text-[#bbb]">{studio.style}</p>
                  <h3 className="mt-0.5 text-sm font-light text-black">{studio.name}</h3>
                  <div className="mt-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#ccc]" />
                    <span className="text-xs font-light text-[#bbb]">{studio.city}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDIOS SECTION ─────────────────────────────────── */}
      <section id="escritorios" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">

          {/* Section header */}
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-light tracking-[0.35em] text-[#bbb] uppercase">Escritórios</p>
              <h2 className="text-3xl font-extralight text-black">
                Talentos que transformam
                <br />
                espaços em experiências.
              </h2>
            </div>
            <p className="max-w-xs text-sm font-light leading-relaxed text-[#aaa]">
              Cada escritório foi verificado. Analise portfólios, avaliações e entre em contato diretamente.
            </p>
          </div>

          {/* Filters — iOS pill style */}
          <div className="mb-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-light text-[#ccc]">Estilo</span>
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStyle(s)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-light transition-all ${
                    selectedStyle === s
                      ? 'bg-black text-white'
                      : 'bg-[#efefef] text-[#555] hover:bg-[#e4e4e4]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-light text-[#ccc]">Cidade</span>
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-light transition-all ${
                    selectedCity === c
                      ? 'bg-black text-white'
                      : 'bg-[#efefef] text-[#555] hover:bg-[#e4e4e4]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm font-light text-[#bbb]">Nenhum escritório encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((studio) => (
                <Link
                  key={studio.id}
                  href={`/escritorio/${studio.slug}`}
                  className="group block overflow-hidden border border-black/[0.07] bg-white transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)]"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={studio.image}
                      alt={studio.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-light text-[#666] backdrop-blur-sm">
                        {studio.style}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="mb-1 text-sm font-light text-black">{studio.name}</h3>
                    <p className="mb-3 text-xs font-light text-[#bbb]">{studio.tagline}</p>

                    <div className="mb-4 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-[#ccc]" />
                      <span className="text-xs font-light text-[#bbb]">
                        {studio.city}, {studio.state}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-light text-[#666]">{studio.rating}</span>
                      <div className="text-[#ccc]">
                        <StarRating rating={studio.rating} />
                      </div>
                      <span className="text-[10px] font-light text-[#ccc]">({studio.reviews})</span>
                    </div>

                    <div className="mt-4 flex items-center gap-1 text-xs font-light text-[#ccc] transition-colors group-hover:text-black">
                      Ver portfólio
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Load more */}
          <div className="mt-14 text-center">
            <button className="border border-black/10 px-8 py-2.5 text-xs font-light text-[#999] transition-all hover:border-black/25 hover:text-black">
              Carregar mais escritórios
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section className="mx-6 mb-20 border border-black/[0.07] bg-white px-10 py-14 md:mx-auto md:max-w-7xl">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="mb-2 text-[11px] font-light tracking-[0.35em] text-[#bbb] uppercase">Para arquitetos</p>
            <h3 className="text-2xl font-extralight text-black">
              Mostre seu trabalho para
              <br />
              milhares de clientes.
            </h3>
            <p className="mt-3 text-sm font-light text-[#aaa]">
              Cadastre seu escritório gratuitamente e comece a receber projetos hoje.
            </p>
          </div>
          <Link
            href="/cadastro"
            className="shrink-0 bg-black px-8 py-3 text-sm font-light text-white transition-colors hover:bg-[#222]"
          >
            Criar perfil grátis
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-black/[0.06] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-base font-light tracking-[0.3em] text-black">ARC</span>
          <p className="text-xs font-light text-[#ccc]">© 2026 ARC Marketplace. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            {['Privacidade', 'Termos', 'Cookies'].map((item) => (
              <a key={item} href="#" className="text-xs font-light text-[#ccc] transition-colors hover:text-[#888]">
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
