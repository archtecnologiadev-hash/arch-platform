'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const FILTROS = ['Todos', 'Residencial', 'Comercial', 'Interiores', 'Corporativo', 'Institucional', 'Paisagismo']
const DESTAQUE_ORDER: Record<string, number> = { premium: 0, padrao: 1, nenhum: 2 }

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
  destaque_marketplace: string | null
  imagem_principal_id: string | null
  imagem_principal_url?: string | null
}

function seededRnd(n: number) { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x) }
function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return Math.abs(h) }
function getBestImage(s: Studio) { return s.imagem_principal_url ?? s.cover_url ?? s.image_url ?? null }

function StudioCard({ studio }: { studio: Studio }) {
  const img = getBestImage(studio)
  const espec = studio.especialidades?.[0] ?? studio.estilo ?? null
  const location = [studio.cidade, studio.estado].filter(Boolean).join(', ')
  const subtitle = [location, espec].filter(Boolean).join(' · ')
  const isPremium = studio.destaque_marketplace === 'premium'

  return (
    <Link href={`/escritorio/${studio.slug}`} className="group block cursor-pointer">
      {/* Image — 4:5 aspect ratio */}
      <div
        className="relative overflow-hidden rounded-2xl transition-shadow duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_2px_8px_rgba(0,0,0,0.07)] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
        style={{ aspectRatio: '4/5' }}
      >
        {img ? (
          <img
            src={img}
            alt={studio.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{ background: 'linear-gradient(145deg, #ececf2 0%, #dcdce8 100%)' }}
          >
            <span className="text-5xl font-extralight text-[#c7c7cc]">
              {studio.nome.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {isPremium && (
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-white/96 px-3 py-1 text-[10px] font-semibold text-[#007AFF] shadow-sm backdrop-blur-sm">
              ★ Em Destaque
            </span>
          </div>
        )}
      </div>

      {/* Text below image */}
      <div className="mt-3 px-0.5">
        <h3 className="text-[17px] font-semibold leading-snug text-[#1a1a1a] group-hover:text-[#007AFF] transition-colors duration-200">
          {studio.nome}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-[14px] font-normal text-[#666]">{subtitle}</p>
        )}
        {isPremium && (
          <span className="mt-1.5 inline-flex items-center rounded-full bg-[#007AFF]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#007AFF]">
            Verificado
          </span>
        )}
      </div>
    </Link>
  )
}

export default function LandingPage() {
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStyle, setSelectedStyle] = useState('Todos')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const base = 'id, slug, nome, cidade, estado, estilo, especialidades, bio, rating, image_url, cover_url, destaque_marketplace'

      const { data: raw, error } = await supabase
        .from('escritorios')
        .select(`${base}, imagem_principal_id`)
        .not('nome', 'is', null)

      let studioData: Studio[]

      if (!error && raw) {
        const ids = raw.filter(s => s.imagem_principal_id).map(s => s.imagem_principal_id as string)
        let urlMap: Record<string, string> = {}
        if (ids.length > 0) {
          const { data: gal } = await supabase.from('escritorio_galeria').select('id, url').in('id', ids)
          urlMap = Object.fromEntries((gal ?? []).map(g => [g.id as string, g.url as string]))
        }
        studioData = raw.map(s => ({
          ...s,
          imagem_principal_url: s.imagem_principal_id ? (urlMap[s.imagem_principal_id as string] ?? null) : null,
        })) as Studio[]
      } else {
        const { data: fb } = await supabase.from('escritorios').select(base).not('nome', 'is', null)
        studioData = (fb ?? []).map(s => ({ ...s, imagem_principal_id: null, imagem_principal_url: null })) as Studio[]
      }

      setStudios(studioData)
      setLoading(false)
    }
    load()
  }, [])

  const withProfile = studios.filter(s => s.nome && (s.imagem_principal_url || s.image_url || s.cover_url))
  const todaySeed = +new Date().toISOString().slice(0, 10).replace(/-/g, '')

  const filtered = withProfile
    .filter(s => {
      if (selectedStyle === 'Todos') return true
      const espec = s.especialidades ?? (s.estilo ? [s.estilo] : [])
      return espec.includes(selectedStyle)
    })
    .sort((a, b) => {
      const ao = DESTAQUE_ORDER[a.destaque_marketplace ?? 'nenhum'] ?? 2
      const bo = DESTAQUE_ORDER[b.destaque_marketplace ?? 'nenhum'] ?? 2
      if (ao !== bo) return ao - bo
      return seededRnd(todaySeed + hashStr(a.id)) - seededRnd(todaySeed + hashStr(b.id))
    })

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-black/[0.07] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-light tracking-[0.35em] text-black">ARC</Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="/" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Escritórios</a>
            <a href="/sobre" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Sobre</a>
            <a href="/contato" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Contato</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/cadastro" className="hidden text-sm font-light text-[#8e8e93] hover:text-black md:block">Cadastrar</Link>
            <Link href="/login" className="rounded-[8px] bg-[#007AFF] px-4 py-1.5 text-sm font-light text-white transition-opacity hover:opacity-90">
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

      {/* ── HERO — fullscreen grid com overlay ──────────────────── */}
      <section className="relative pt-14">
        {loading ? (
          <div className="grid grid-cols-1 gap-px bg-black/[0.06] sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[42vh] min-h-[240px] animate-pulse bg-[#e5e5ea]" />
            ))}
          </div>
        ) : withProfile.length === 0 ? (
          <div className="flex h-[60vh] items-center justify-center bg-[#f2f2f7]">
            <div className="text-center px-6">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.06] bg-white shadow-sm">
                <span className="text-2xl">🏛️</span>
              </div>
              <p className="text-base font-light text-[#1a1a1a]">Em breve novos escritórios</p>
              <p className="mt-2 text-sm font-light text-[#8e8e93]">Estamos integrando os primeiros escritórios à plataforma.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-black/[0.06] sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, 6).map((studio) => {
              const img = getBestImage(studio)
              return (
                <Link key={studio.id} href={`/escritorio/${studio.slug}`}
                  className="group relative block overflow-hidden bg-white">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {img ? (
                      <img src={img} alt={studio.nome} loading="eager"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#e5e5ea] to-[#d1d1d6]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-sm font-light text-white">{studio.nome}</p>
                      {(studio.cidade || studio.estado) && (
                        <p className="mt-0.5 text-xs font-light text-white/60">
                          {[studio.cidade, studio.estado].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Frosted glass hero card */}
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
              <a href="#escritorios"
                className="flex items-center justify-center gap-2 rounded-[8px] bg-[#007AFF] py-2.5 text-sm font-light text-white transition-opacity hover:opacity-90">
                Explorar escritórios <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <Link href="/cadastro"
                className="py-2 text-center text-sm font-light text-[#007AFF] transition-opacity hover:opacity-70">
                Sou arquiteto →
              </Link>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            {[
              { value: `${withProfile.length || '—'}`, label: 'Escritórios' },
              { value: '500+', label: 'Projetos' },
              { value: '98%', label: 'Satisfação' },
            ].map((stat) => (
              <div key={stat.label}
                className="flex-1 rounded-xl bg-white/88 py-3 text-center shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-xl">
                <p className="text-base font-extralight text-black">{stat.value}</p>
                <p className="text-[10px] font-light text-[#8e8e93]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STUDIOS SECTION ─────────────────────────────────────── */}
      <section id="escritorios" className="bg-white px-5 py-16 md:py-24" style={{ paddingLeft: 'max(20px, 5%)', paddingRight: 'max(20px, 5%)' }}>
        <div className="mx-auto max-w-7xl">

          {/* Section header */}
          <div className="mb-10 md:mb-14">
            <p className="mb-2 text-[11px] font-light tracking-[0.45em] text-[#8e8e93] uppercase">Escritórios</p>
            <h2 className="text-[36px] font-bold leading-tight text-[#1a1a1a] md:text-[52px]">
              Todos os escritórios
            </h2>
            <p className="mt-3 text-[17px] font-light text-[#555]">
              Profissionais verificados prontos para o seu projeto.
            </p>
          </div>

          {/* Specialty filter pills — always visible */}
          <div className="mb-10 flex flex-wrap gap-2">
            {FILTROS.map(f => (
              <button
                key={f}
                onClick={() => setSelectedStyle(f)}
                style={{ transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)' }}
                className={`rounded-full px-5 py-2 text-sm font-light ${
                  selectedStyle === f
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-[#f2f2f7] text-black hover:bg-[#e5e5ea]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-2xl bg-[#f2f2f7]" style={{ aspectRatio: '4/5' }} />
                  <div className="mt-3 space-y-2 px-0.5">
                    <div className="h-[18px] w-2/3 rounded-md bg-[#e5e5ea]" />
                    <div className="h-[14px] w-1/2 rounded-md bg-[#e5e5ea]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-lg font-light text-[#8e8e93]">
                {withProfile.length === 0
                  ? 'Em breve novos escritórios'
                  : 'Nenhum escritório encontrado nesta categoria'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(studio => <StudioCard key={studio.id} studio={studio} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────── */}
      <section className="px-5 pb-16" style={{ paddingLeft: 'max(20px, 5%)', paddingRight: 'max(20px, 5%)' }}>
        <div className="mx-auto max-w-7xl rounded-2xl bg-[#f2f2f7] p-8 md:p-12">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <p className="mb-2 text-[10px] font-light tracking-[0.35em] text-[#8e8e93] uppercase">Para arquitetos</p>
              <h3 className="text-2xl font-bold text-black md:text-3xl">
                Mostre seu trabalho para<br className="hidden md:block" /> milhares de clientes.
              </h3>
              <p className="mt-2 text-[15px] font-light text-[#666]">
                Cadastre seu escritório gratuitamente e comece a receber projetos.
              </p>
            </div>
            <Link href="/cadastro"
              className="shrink-0 rounded-[10px] bg-[#007AFF] px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Criar perfil grátis
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
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
