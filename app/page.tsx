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
    accent: '#c8a96e',
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
    accent: '#8fb3a0',
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
    accent: '#7a9cb8',
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
    accent: '#b8a99a',
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
    accent: '#91b89c',
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
    accent: '#c0a87a',
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
    accent: '#d4b896',
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
    accent: '#88aec0',
  },
]

const STYLES = ['Todos', 'Residencial', 'Contemporâneo', 'Minimalista', 'Comercial', 'Sustentável', 'Urbanismo']
const CITIES = ['Todas', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Brasília', 'Florianópolis']

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
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
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8]">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#080808]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-[0.25em] text-white">ARCH</span>
            <span className="hidden text-xs font-light tracking-[0.2em] text-[#888] sm:block">MARKETPLACE</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {['Escritórios', 'Projetos', 'Sobre', 'Blog'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-light tracking-wide text-[#888] transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/cadastro"
              className="hidden text-sm font-light text-[#888] transition-colors hover:text-white md:block"
            >
              Cadastrar
            </Link>
            <Link
              href="/login"
              className="rounded-none border border-[#c8a96e] bg-transparent px-5 py-2 text-sm font-light tracking-widest text-[#c8a96e] transition-all hover:bg-[#c8a96e] hover:text-black"
            >
              ENTRAR
            </Link>
            <button
              className="text-[#888] md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/5 bg-[#080808] px-6 py-4 md:hidden">
            {['Escritórios', 'Projetos', 'Sobre', 'Blog', 'Cadastrar'].map((item) => (
              <a key={item} href="#" className="block py-3 text-sm text-[#888] hover:text-white">
                {item}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c8a96e]/5 blur-[120px]" />

        <div className="relative z-10 max-w-5xl text-center">
          <p className="mb-6 text-xs font-light tracking-[0.4em] text-[#c8a96e]">
            PLATAFORMA DE ARQUITETURA
          </p>

          <h1 className="mb-8 text-5xl font-black leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
            Conecte-se ao{' '}
            <span
              className="relative inline-block"
              style={{
                background: 'linear-gradient(135deg, #c8a96e 0%, #e8d5a3 50%, #c8a96e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              melhor
            </span>
            <br />
            da arquitetura
            <br />
            brasileira.
          </h1>

          <p className="mx-auto mb-12 max-w-xl text-base font-light leading-relaxed text-[#666] md:text-lg">
            Descubra escritórios de arquitetura excepcionais. Compare portfólios,
            leia avaliações reais e inicie seu projeto com confiança.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#escritorios"
              className="group flex items-center gap-2 bg-[#c8a96e] px-8 py-4 text-sm font-semibold tracking-widest text-black transition-all hover:bg-[#e8d5a3]"
            >
              EXPLORAR ESCRITÓRIOS
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <Link
              href="/cadastro"
              className="px-8 py-4 text-sm font-light tracking-widest text-[#888] transition-colors hover:text-white"
            >
              SOU ARQUITETO →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-24 grid grid-cols-3 gap-12 border-t border-white/5 pt-12">
          {[
            { value: '500+', label: 'Projetos concluídos' },
            { value: '200+', label: 'Escritórios cadastrados' },
            { value: '98%', label: 'Clientes satisfeitos' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black text-white md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-xs font-light tracking-wider text-[#555]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-8 w-[1px] bg-gradient-to-b from-[#c8a96e] to-transparent" />
        </div>
      </section>

      {/* ── STUDIOS SECTION ─────────────────────────────────── */}
      <section id="escritorios" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">

          {/* Section header */}
          <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-light tracking-[0.4em] text-[#c8a96e]">ESCRITÓRIOS</p>
              <h2 className="text-4xl font-black text-white md:text-5xl">
                Talentos que transformam
                <br />
                espaços em experiências.
              </h2>
            </div>
            <p className="max-w-sm text-sm font-light leading-relaxed text-[#555]">
              Cada escritório foi cuidadosamente verificado. Analise portfólios,
              avaliações e entre em contato diretamente.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-12 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="mr-2 self-center text-xs tracking-widest text-[#444]">ESTILO</span>
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStyle(s)}
                  className={`px-4 py-1.5 text-xs font-light tracking-wider transition-all ${
                    selectedStyle === s
                      ? 'bg-[#c8a96e] text-black'
                      : 'border border-white/10 text-[#666] hover:border-white/30 hover:text-white'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="mr-2 self-center text-xs tracking-widest text-[#444]">CIDADE</span>
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCity(c)}
                  className={`px-4 py-1.5 text-xs font-light tracking-wider transition-all ${
                    selectedCity === c
                      ? 'bg-white/10 text-white'
                      : 'border border-white/10 text-[#666] hover:border-white/30 hover:text-white'
                  }`}
                >
                  {c.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          {filtered.length === 0 ? (
            <div className="py-24 text-center text-[#444]">
              <p className="text-lg">Nenhum escritório encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((studio) => (
                <Link
                  key={studio.id}
                  href={`/escritorio/${studio.slug}`}
                  className="group relative block overflow-hidden border border-white/5 bg-[#0f0f0f] transition-all duration-500 hover:border-white/15 hover:shadow-[0_0_40px_rgba(200,169,110,0.08)]"
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={studio.image}
                      alt={studio.name}
                      className="h-full w-full object-cover transition-all duration-700 grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-90 group-hover:scale-105"
                    />
                    {/* Bottom gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent opacity-80" />

                    {/* Style badge */}
                    <div className="absolute left-3 top-3">
                      <span className="bg-black/60 px-2 py-1 text-[10px] font-light tracking-widest text-[#888] backdrop-blur-sm transition-colors group-hover:text-[#c8a96e]">
                        {studio.style.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="mb-1 text-base font-bold text-white">{studio.name}</h3>
                    <p className="mb-3 text-xs font-light text-[#555]">{studio.tagline}</p>

                    <div className="mb-4 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-[#444] transition-colors group-hover:text-[#c8a96e]" />
                      <span className="text-xs text-[#555]">
                        {studio.city}, {studio.state}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#888]">{studio.rating}</span>
                      <div className="text-[#555] transition-colors group-hover:text-[#c8a96e]">
                        <StarRating rating={studio.rating} />
                      </div>
                      <span className="text-[10px] text-[#444]">({studio.reviews})</span>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex items-center gap-1 text-xs font-light tracking-wider text-[#444] transition-all group-hover:text-[#c8a96e]">
                      Ver portfólio
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Gold left border accent on hover */}
                  <div
                    className="absolute left-0 top-0 h-0 w-[2px] bg-[#c8a96e] transition-all duration-500 group-hover:h-full"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Load more */}
          <div className="mt-16 text-center">
            <button className="border border-white/10 px-10 py-3 text-xs font-light tracking-[0.3em] text-[#555] transition-all hover:border-white/30 hover:text-white">
              CARREGAR MAIS ESCRITÓRIOS
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section className="mx-6 mb-24 border border-white/5 bg-[#0d0d0d] px-10 py-16 md:mx-auto md:max-w-7xl">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="mb-2 text-xs tracking-[0.4em] text-[#c8a96e]">PARA ARQUITETOS</p>
            <h3 className="text-3xl font-black text-white md:text-4xl">
              Mostre seu trabalho para
              <br />
              milhares de clientes.
            </h3>
            <p className="mt-3 text-sm font-light text-[#555]">
              Cadastre seu escritório gratuitamente e comece a receber projetos hoje.
            </p>
          </div>
          <Link
            href="/cadastro"
            className="shrink-0 bg-white px-10 py-4 text-sm font-bold tracking-[0.2em] text-black transition-all hover:bg-[#c8a96e]"
          >
            CRIAR PERFIL GRÁTIS
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <span className="text-2xl font-black tracking-[0.25em] text-white">ARCH</span>
              <p className="mt-4 max-w-xs text-sm font-light leading-relaxed text-[#444]">
                A maior plataforma de conexão entre clientes e escritórios de arquitetura do Brasil.
              </p>
            </div>
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.3em] text-[#c8a96e]">PLATAFORMA</p>
              <ul className="space-y-3">
                {['Escritórios', 'Projetos', 'Como funciona', 'Preços'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm font-light text-[#444] transition-colors hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.3em] text-[#c8a96e]">EMPRESA</p>
              <ul className="space-y-3">
                {['Sobre', 'Blog', 'Carreiras', 'Contato'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm font-light text-[#444] transition-colors hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
            <p className="text-xs font-light text-[#333]">
              © 2026 ARCH Marketplace. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              {['Privacidade', 'Termos', 'Cookies'].map((item) => (
                <a key={item} href="#" className="text-xs font-light text-[#333] hover:text-[#666]">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
