'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, MapPin, ArrowRight, Menu, X, SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Studio {
  id: string
  slug: string
  nome: string
  cidade: string | null
  estado: string | null
  estilo: string | null
  especialidades: string[] | null
  bio: string | null
  rating: number | null
  image_url: string | null
  cover_url: string | null
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="h-3 w-3" fill={i <= Math.round(rating) ? 'currentColor' : 'none'} />
      ))}
    </div>
  )
}

function StudioImage({ url, alt }: { url: string | null; alt: string }) {
  if (url) {
    return <img src={url} alt={alt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
  }
  return (
    <div className="h-full w-full bg-gradient-to-br from-[#e5e5ea] to-[#d1d1d6] flex items-center justify-center">
      <span className="text-[11px] font-light text-[#8e8e93]">{alt}</span>
    </div>
  )
}

export default function LandingPage() {
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStyle, setSelectedStyle] = useState('Todos')
  const [selectedCity, setSelectedCity] = useState('Todas')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('escritorios')
        .select('id, slug, nome, cidade, estado, estilo, especialidades, bio, rating, image_url, cover_url')
        .not('nome', 'is', null)
        .order('created_at', { ascending: false })
      setStudios(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // show studios that have a nome and at least one photo
  const withProfile = studios.filter(s => s.nome && (s.image_url || s.cover_url))

  const allEspecialidades = withProfile.flatMap(s => s.especialidades ?? (s.estilo ? [s.estilo] : []))
  const styles = ['Todos', ...Array.from(new Set(allEspecialidades))]
  const cities = ['Todas', ...Array.from(new Set(withProfile.map(s => s.cidade).filter(Boolean) as string[]))]

  const filtered = withProfile.filter((s) => {
    const espec = s.especialidades ?? (s.estilo ? [s.estilo] : [])
    return (
      (selectedStyle === 'Todos' || espec.includes(selectedStyle)) &&
      (selectedCity === 'Todas' || s.cidade === selectedCity)
    )
  })

  return (
    <div className="min-h-screen bg-[#f2f2f7] text-[#1a1a1a]">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-black/[0.07] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-light tracking-[0.35em] text-black">
            ARC
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="/" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Escritórios</a>
            <a href="/sobre" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Sobre</a>
            <a href="/contato" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Contato</a>
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
            <a href="/" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black">Escritórios</a>
            <a href="/sobre" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black">Sobre</a>
            <a href="/contato" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black">Contato</a>
            <a href="/cadastro" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black">Cadastrar</a>
          </div>
        )}
      </header>

      {/* ── HERO — full-width dense grid with text overlay ── */}
      <section className="relative pt-14">
        {loading ? (
          <div className="grid grid-cols-1 gap-px bg-black/[0.06] sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[42vh] min-h-[240px] bg-[#e5e5ea] animate-pulse" />
            ))}
          </div>
        ) : withProfile.length === 0 ? (
          <div className="flex h-[60vh] items-center justify-center bg-[#f2f2f7]">
            <div className="text-center px-6">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-black/[0.06]">
                <span className="text-2xl">🏛️</span>
              </div>
              <p className="text-base font-light text-[#1a1a1a]">Em breve novos escritórios</p>
              <p className="mt-2 text-sm font-light text-[#8e8e93]">Estamos integrando os primeiros escritórios à plataforma.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-black/[0.06] sm:grid-cols-2 lg:grid-cols-3">
            {withProfile.map((studio) => (
              <Link
                key={studio.id}
                href={`/escritorio/${studio.slug}`}
                className="group relative block overflow-hidden bg-white"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <StudioImage url={studio.cover_url ?? studio.image_url} alt={studio.nome} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute inset-0 bg-white/0 transition-all duration-300 group-hover:bg-white/[0.04]" />

                  {(studio.especialidades?.[0] || studio.estilo) && (
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-light text-[#3a3a3a] backdrop-blur-sm">
                        {studio.especialidades?.[0] ?? studio.estilo}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-light text-white">{studio.nome}</p>
                    {(studio.cidade || studio.estado) && (
                      <div className="mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-white/60" />
                        <span className="text-xs font-light text-white/70">
                          {[studio.cidade, studio.estado].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

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
              { value: `${withProfile.length || '—'}`, label: 'Escritórios' },
              { value: '500+', label: 'Projetos' },
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
            {withProfile.length > 0 && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-light transition-all ${
                  showFilters ? 'bg-black text-white' : 'bg-white text-[#6b6b6b] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtros
              </button>
            )}
          </div>

          {/* Filters — iOS pill style */}
          {showFilters && (
            <div className="mb-6 space-y-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11px] font-light text-[#8e8e93]">Estilo</span>
                {styles.map((s) => (
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
                {cities.map((c) => (
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
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)] animate-pulse">
                  <div className="h-52 bg-[#e5e5ea]" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-[#e5e5ea] rounded w-2/3" />
                    <div className="h-2 bg-[#e5e5ea] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
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
                    <StudioImage url={studio.image_url ?? studio.cover_url} alt={studio.nome} />
                    {(studio.especialidades?.[0] || studio.estilo) && (
                      <div className="absolute left-3 top-3">
                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-light text-[#3a3a3a] backdrop-blur-sm">
                          {studio.especialidades?.[0] ?? studio.estilo}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="mb-0.5 text-sm font-light text-black">{studio.nome}</h3>
                    {studio.bio && (
                      <p className="mb-3 text-xs font-light text-[#8e8e93] line-clamp-2">{studio.bio}</p>
                    )}
                    {(studio.cidade || studio.estado) && (
                      <div className="mb-3 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-[#c7c7cc]" />
                        <span className="text-xs font-light text-[#8e8e93]">
                          {[studio.cidade, studio.estado].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {studio.rating && studio.rating > 0 ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-light text-[#6b6b6b]">{studio.rating.toFixed(1)}</span>
                          <div className="text-[#c7c7cc]">
                            <StarRating rating={studio.rating} />
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-xs font-light text-[#007AFF] opacity-0 transition-opacity group-hover:opacity-100">
                          Ver portfólio <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-light text-[#007AFF] opacity-0 transition-opacity group-hover:opacity-100">
                        Ver portfólio <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
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
            <a href="/sobre" className="text-xs font-light text-[#c7c7cc] transition-colors hover:text-[#8e8e93]">Sobre</a>
            <a href="/termos-de-uso" className="text-xs font-light text-[#c7c7cc] transition-colors hover:text-[#8e8e93]">Termos</a>
            <a href="/privacidade" className="text-xs font-light text-[#c7c7cc] transition-colors hover:text-[#8e8e93]">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
