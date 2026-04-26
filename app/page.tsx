'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
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
  instagram: string | null
  ano_fundacao: number | null
  galeria_urls: string[]
}

function seededRnd(n: number) { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x) }
function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return Math.abs(h) }

function getDisplayImages(s: Studio): string[] {
  if (s.galeria_urls.length > 0) return s.galeria_urls
  const fallbacks = [s.cover_url, s.image_url].filter(Boolean) as string[]
  return fallbacks.slice(0, 1)
}

// ─── StudioCard ───────────────────────────────────────────────────────────────

function StudioCard({ studio, index }: { studio: Studio; index: number }) {
  const [hoverIdx, setHoverIdx] = useState(0)
  const [hovering, setHovering] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const imgs = getDisplayImages(studio)
  const hasMultiple = imgs.length > 1
  const isPremium = studio.destaque_marketplace === 'premium'
  const igHandle = studio.instagram
    ? (studio.instagram.startsWith('@') ? studio.instagram : `@${studio.instagram}`)
    : null

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function handleMouseEnter() {
    setHovering(true)
    if (!hasMultiple) return
    timerRef.current = setInterval(() => {
      setHoverIdx(prev => (prev + 1) % imgs.length)
    }, 1200)
  }

  function handleMouseLeave() {
    setHovering(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setHoverIdx(0)
  }

  return (
    <Link
      href={`/escritorio/${studio.slug}`}
      className="group block cursor-pointer active:opacity-90"
      style={{ animation: `fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 70}ms both` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative overflow-hidden rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow duration-[400ms] group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.18)] active:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        style={{ aspectRatio: '4/5' }}
      >
        {imgs.length > 0 ? (
          imgs.map((url, i) => (
            <Image
              key={url}
              src={url}
              alt={i === 0 ? studio.nome : ''}
              fill
              quality={85}
              sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-all duration-500 ease-in-out ${
                i === hoverIdx
                  ? `opacity-100 ${hovering ? 'scale-[1.03]' : 'scale-100'}`
                  : 'opacity-0 scale-100'
              }`}
              priority={i === 0 && index < 3}
              loading={i === 0 && index < 3 ? undefined : 'lazy'}
            />
          ))
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
          >
            <span className="text-6xl font-extralight text-white/30" aria-hidden="true">
              {studio.nome.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[35%] bg-gradient-to-t from-black/50 to-transparent transition-all duration-300 group-hover:from-black/65"
          aria-hidden="true"
        />

        {/* Text overlay */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-4">
          <p className="line-clamp-1 text-[15px] font-semibold leading-snug text-white sm:text-[16px]">
            {studio.nome}
          </p>
          {studio.cidade && (
            <p className="mt-0.5 text-[12px] font-normal text-white/80 sm:text-[13px]">{studio.cidade}</p>
          )}
          {igHandle && (
            <p className="mt-0.5 text-[11px] font-normal text-white/70 sm:text-[12px]">{igHandle}</p>
          )}
          {studio.ano_fundacao && (
            <p className="mt-0.5 text-[10px] font-normal text-white/60 sm:text-[11px]">Desde {studio.ano_fundacao}</p>
          )}
        </div>

        {/* Dots — top-right when multiple images */}
        {hasMultiple && (
          <div
            className="absolute right-3 top-3 z-20 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-hidden="true"
          >
            {imgs.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                  i === hoverIdx ? 'w-4' : 'w-1.5 opacity-60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Premium badge — top-left */}
        {isPremium && (
          <div className="absolute left-3 top-3 z-20">
            <span className="rounded-full bg-white/96 px-3 py-1 text-[10px] font-semibold text-[#007AFF] shadow-sm backdrop-blur-sm">
              ★ Em Destaque
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStyle, setSelectedStyle] = useState('Todos')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const fields = 'id, slug, nome, cidade, estado, estilo, especialidades, bio, rating, image_url, cover_url, destaque_marketplace, instagram, ano_fundacao'

      const { data: raw } = await supabase
        .from('escritorios')
        .select(fields)
        .not('nome', 'is', null)

      if (!raw || raw.length === 0) { setLoading(false); return }

      const studioIds = raw.map(s => s.id as string)

      const { data: galleryRows } = await supabase
        .from('escritorio_galeria')
        .select('escritorio_id, url')
        .in('escritorio_id', studioIds)
        .order('eh_principal', { ascending: false, nullsFirst: false })
        .order('ordem', { ascending: true })

      const galleryMap: Record<string, string[]> = {}
      for (const row of (galleryRows ?? []) as { escritorio_id: string; url: string }[]) {
        if (!galleryMap[row.escritorio_id]) galleryMap[row.escritorio_id] = []
        if (galleryMap[row.escritorio_id].length < 3) {
          galleryMap[row.escritorio_id].push(row.url)
        }
      }

      const studioData: Studio[] = raw.map(s => ({
        ...(s as Omit<Studio, 'galeria_urls'>),
        galeria_urls: galleryMap[s.id as string] ?? [],
      }))

      setStudios(studioData)
      setLoading(false)
    }
    load()
  }, [])

  const withProfile = studios.filter(s =>
    s.nome && (s.galeria_urls.length > 0 || s.cover_url || s.image_url)
  )
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
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-5">
          <Link href="/" className="text-[15px] font-light tracking-[0.35em] text-black md:text-lg" aria-label="ARC — Página inicial">
            ARC
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Navegação principal">
            <a href="/" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Escritórios</a>
            <a href="/sobre" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Sobre</a>
            <a href="/contato" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Contato</a>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/cadastro" className="hidden text-sm font-light text-[#8e8e93] hover:text-black md:block">Cadastrar</Link>
            <Link
              href="/login"
              className="rounded-[8px] bg-[#007AFF] px-3.5 py-1.5 text-[13px] font-light text-white transition-opacity hover:opacity-90 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 md:px-4 md:text-sm"
            >
              Entrar
            </Link>
            <button
              className="flex h-10 w-10 items-center justify-center text-[#8e8e93] md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-black/[0.07] bg-white/95 px-4 py-2 md:hidden" aria-label="Menu mobile">
            <a href="/" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black">Escritórios</a>
            <a href="/sobre" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black">Sobre</a>
            <a href="/contato" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black">Contato</a>
            <a href="/cadastro" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black">Cadastrar</a>
          </nav>
        )}
      </header>

      {/* ── STUDIOS SECTION ─────────────────────────────────────── */}
      <section
        id="escritorios"
        className="bg-white px-4 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28 lg:px-[max(20px,5%)]"
        aria-label="Escritórios de arquitetura"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-6 md:mb-14">
            <p className="mb-1.5 text-[11px] font-light tracking-[0.45em] text-[#8e8e93] uppercase md:mb-2">Escritórios</p>
            <h2 className="text-[26px] font-bold leading-tight text-[#1a1a1a] md:text-[52px]">
              Todos os escritórios
            </h2>
            <p className="mt-2 text-[14px] font-light text-[#555] md:mt-3 md:text-[17px]">
              Profissionais verificados prontos para o seu projeto.
            </p>
          </div>

          {/* Filter pills — horizontal scroll on mobile */}
          <div className="relative mb-6 md:mb-10">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white to-transparent md:hidden" aria-hidden="true" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent md:hidden" aria-hidden="true" />
            <div
              className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible"
              role="group"
              aria-label="Filtrar por especialidade"
            >
              {FILTROS.map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedStyle(f)}
                  aria-pressed={selectedStyle === f}
                  style={{ transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)' }}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-light active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-1 md:px-5 md:text-sm ${
                    selectedStyle === f
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-[#f2f2f7] text-black hover:bg-[#e5e5ea]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3" aria-busy="true" aria-label="Carregando escritórios">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-[#f2f2f7]" style={{ aspectRatio: '4/5' }} />
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
            <div key={selectedStyle} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {filtered.map((studio, i) => (
                <StudioCard key={studio.id} studio={studio} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────── */}
      <section
        className="px-4 pb-12 md:px-8 md:pb-16 lg:px-[max(20px,5%)]"
        aria-label="Cadastre seu escritório"
      >
        <div className="mx-auto max-w-7xl rounded-2xl bg-[#f2f2f7] p-6 md:p-12">
          <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1.5 text-[10px] font-light tracking-[0.35em] text-[#8e8e93] uppercase md:mb-2">Para arquitetos</p>
              <h3 className="text-xl font-bold text-black md:text-3xl">
                Mostre seu trabalho para milhares de clientes.
              </h3>
              <p className="mt-1.5 text-[14px] font-light text-[#666] md:mt-2 md:text-[15px]">
                Cadastre seu escritório gratuitamente e comece a receber projetos.
              </p>
            </div>
            <Link
              href="/cadastro"
              className="shrink-0 rounded-[10px] bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 md:px-8 md:py-3.5"
            >
              Criar perfil grátis
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-black/[0.06] bg-white px-4 py-5 md:py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 md:flex-row md:justify-between">
          <Link href="/" className="text-[14px] font-light tracking-[0.3em] text-black md:text-base" aria-label="ARC — Página inicial">ARC</Link>
          <p className="text-[11px] font-light text-[#c7c7cc] md:text-xs">© 2026 ARC Marketplace. Todos os direitos reservados.</p>
          <div className="flex gap-5">
            <a href="/sobre" className="text-[11px] font-light text-[#c7c7cc] transition-colors hover:text-[#8e8e93] md:text-xs">Sobre</a>
            <a href="/termos-de-uso" className="text-[11px] font-light text-[#c7c7cc] transition-colors hover:text-[#8e8e93] md:text-xs">Termos</a>
            <a href="/privacidade" className="text-[11px] font-light text-[#c7c7cc] transition-colors hover:text-[#8e8e93] md:text-xs">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
