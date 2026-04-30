'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, Check, ChevronDown, Menu, X, Pause, Play,
  FolderOpen, MessageSquare, Calendar, FileText,
} from 'lucide-react'

// ─── Config ───────────────────────────────────────────────────────────────────

const HERO_VIDEO =
  process.env.NEXT_PUBLIC_HERO_VIDEO_URL ||
  'https://videos.pexels.com/video-files/3196284/3196284-uhd_3840_2160_25fps.mp4'

const HERO_POSTER =
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1920'

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Recursos',      href: '#recursos'      },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Preços',        href: '#precos'        },
]

const BENEFITS = [
  {
    num: '01',
    title: 'Pipeline Visual',
    desc: 'Acompanhe cada projeto em etapas claras. Nunca mais perca um prazo ou esqueça uma entrega.',
  },
  {
    num: '02',
    title: 'Portal do Cliente',
    desc: 'Seu cliente acompanha o projeto em tempo real. Menos reuniões, mais confiança.',
  },
  {
    num: '03',
    title: 'Equipe Integrada',
    desc: 'Permissões, tarefas e comunicação de toda a equipe organizados em um único lugar.',
  },
]

const FEATURES = [
  { icon: MessageSquare, label: 'Mensagens integradas'          },
  { icon: Calendar,      label: 'Agenda e prazos automáticos'   },
  { icon: FileText,      label: 'Orçamentos com aceite digital' },
  { icon: FolderOpen,    label: 'Arquivos e pastas por projeto' },
]

const STEPS = [
  { n: '01', title: 'Crie sua conta',             desc: '14 dias completos, sem cartão de crédito.' },
  { n: '02', title: 'Configure seu escritório',   desc: 'Personalize, convide a equipe, defina etapas.' },
  { n: '03', title: 'Adicione projetos e clientes', desc: 'Importe ou crie do zero em minutos.' },
  { n: '04', title: 'Cresça com organização',     desc: 'Foco no projeto. Não na gestão.' },
]

const FOR_WHOM = [
  'Escritórios independentes de 1 a 5 arquitetos',
  'Estúdios com equipes de até 20 profissionais',
  'Arquitetos gerenciando múltiplos projetos simultâneos',
  'Quem quer profissionalizar o atendimento ao cliente',
  'Quem cansou de planilhas e grupos de WhatsApp',
]

const PRICING_BENEFITS = [
  'Projetos ilimitados',
  'Portal do cliente incluso',
  'Gestão de equipe com permissões',
  'Armazenamento de 20 GB',
  'Mensagens integradas',
  'Orçamentos com aceite digital',
  'Suporte prioritário',
  'Atualizações contínuas',
]

// ─── Custom cursor ─────────────────────────────────────────────────────────────

function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf: number
    let cx = 0, cy = 0
    const tx = { v: -100 }, ty = { v: -100 }

    const move = (e: MouseEvent) => { tx.v = e.clientX; ty.v = e.clientY }
    window.addEventListener('mousemove', move)

    const tick = () => {
      cx += (tx.v - cx) * 0.1
      cy += (ty.v - cy) * 0.1
      if (ringRef.current) ringRef.current.style.transform = `translate(${cx - 18}px,${cy - 18}px)`
      if (dotRef.current)  dotRef.current.style.transform  = `translate(${tx.v - 2}px,${ty.v - 2}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])

  return (
    <>
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0,
        width: 36, height: 36,
        border: '1px solid rgba(255,255,255,0.55)',
        borderRadius: '50%', pointerEvents: 'none',
        zIndex: 9999, willChange: 'transform',
        mixBlendMode: 'difference',
      }} />
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0,
        width: 4, height: 4,
        background: 'var(--bg-card)', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999,
        willChange: 'transform', mixBlendMode: 'difference',
      }} />
    </>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const textColor = scrolled ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.72)'
  const textHover = scrolled ? '#0a0a0a' : '#fff'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
      transition: 'background 0.45s ease, backdrop-filter 0.45s ease, border-color 0.45s ease',
      background: scrolled ? 'rgba(255,255,255,0.93)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
      borderBottom: `1px solid ${scrolled ? 'rgba(0,0,0,0.07)' : 'transparent'}`,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        height: 68, padding: '0 40px',
      }}>
        <Link href="/" style={{
          fontSize: 18, fontWeight: 200, letterSpacing: '0.3em',
          color: scrolled ? '#0a0a0a' : '#fff',
          textDecoration: 'none',
          transition: 'color 0.3s ease',
        }}>
          ARC
        </Link>

        {/* Desktop center links */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 40,
        }} className="hide-mobile">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} style={{
              fontSize: 13.5, fontWeight: 300, letterSpacing: '0.01em',
              color: textColor, textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = textHover)}
              onMouseLeave={e => (e.currentTarget.style.color = textColor)}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop right CTAs */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }} className="hide-mobile">
          <Link href="/login" style={{
            fontSize: 13.5, fontWeight: 300, padding: '9px 18px',
            color: textColor, textDecoration: 'none', borderRadius: 100,
            transition: 'color 0.2s ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = textHover)}
            onMouseLeave={e => (e.currentTarget.style.color = textColor)}
          >
            Entrar
          </Link>
          <Link href="/cadastro" style={{
            fontSize: 13, fontWeight: 500, padding: '10px 22px',
            background: scrolled ? '#0a0a0a' : 'rgba(255,255,255,0.13)',
            color: '#fff',
            border: `1px solid ${scrolled ? 'transparent' : 'rgba(255,255,255,0.22)'}`,
            backdropFilter: scrolled ? 'none' : 'blur(8px)',
            textDecoration: 'none', borderRadius: 100,
            transition: 'all 0.3s ease',
          }}>
            Começar grátis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(v => !v)} style={{
          marginLeft: 'auto', background: 'none', border: 'none', padding: 8,
          color: scrolled ? '#0a0a0a' : '#fff', display: 'none',
        }} className="show-mobile">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}
          >
            <div style={{ padding: '20px 28px 32px' }}>
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{
                  display: 'block', fontSize: 15, fontWeight: 300, color: '#0a0a0a',
                  textDecoration: 'none', padding: '14px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                }}>{l.label}</a>
              ))}
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/login" style={{
                  textAlign: 'center', padding: '14px', border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 100, color: '#0a0a0a', textDecoration: 'none', fontSize: 14, fontWeight: 300,
                }}>Entrar</Link>
                <Link href="/cadastro" style={{
                  textAlign: 'center', padding: '14px', background: '#0a0a0a',
                  borderRadius: 100, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500,
                }}>Começar grátis</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const [paused, setPaused]     = useState(false)
  const [vidReady, setVidReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { scrollY } = useScroll()
  const contentY = useTransform(scrollY, [0, 700], ['0%', '14%'])
  const contentO = useTransform(scrollY, [0, 500], [1, 0])

  const togglePause = () => {
    if (!videoRef.current) return
    if (paused) { videoRef.current.play(); setPaused(false) }
    else        { videoRef.current.pause(); setPaused(true) }
  }

  return (
    <section style={{
      position: 'relative', height: '100svh', minHeight: 640,
      overflow: 'hidden', background: '#080810',
    }}>
      {/* Poster — always visible immediately (desktop + mobile) */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${HERO_POSTER})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.62,
      }} />

      {/* Video — fades in over the poster when actually playing (desktop only) */}
      <video
        ref={videoRef}
        src={HERO_VIDEO}
        autoPlay muted loop playsInline
        preload="auto"
        onPlaying={() => setVidReady(true)}
        className="hero-video"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          opacity: vidReady ? 0.62 : 0,
          transition: 'opacity 1.8s ease',
        }}
      />

      {/* Gradient overlays */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(8,8,16,0.88) 0%, rgba(8,8,16,0.3) 50%, rgba(8,8,16,0.15) 100%)',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 75% 55% at 50% 35%, rgba(0,102,255,0.07) 0%, transparent 70%)',
        zIndex: 1,
      }} />

      {/* Content with parallax */}
      <motion.div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 24px',
        y: contentY, opacity: contentO,
      }}>
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 11.5, letterSpacing: '0.32em', fontWeight: 300,
            color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 44,
          }}
        >
          ARC · Plataforma para Arquitetos
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 'clamp(38px, 6.5vw, 82px)',
            fontWeight: 300, color: '#fff',
            lineHeight: 1.06, letterSpacing: '-0.028em',
            maxWidth: 900, margin: '0 auto',
          }}
        >
          A nova forma de gerir
          <br />escritórios de arquitetura
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.75 }}
          style={{
            fontSize: 'clamp(15px, 1.8vw, 19px)',
            fontWeight: 300, color: 'rgba(255,255,255,0.55)',
            marginTop: 28, maxWidth: 480, lineHeight: 1.65,
          }}
        >
          Pipeline visual, equipe e clientes em um só lugar.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          style={{ display: 'flex', gap: 14, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Link href="/cadastro" style={{
            padding: '15px 34px', background: 'var(--bg-card)', color: '#0a0a0a',
            borderRadius: 100, textDecoration: 'none', fontSize: 14, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.025)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(0,0,0,0.28)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            Começar 14 dias grátis <ArrowRight size={14} />
          </Link>
          <a href="#como-funciona" style={{
            padding: '15px 34px', color: '#fff', borderRadius: 100,
            textDecoration: 'none', fontSize: 14, fontWeight: 300,
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
            transition: 'border-color 0.22s ease, background 0.22s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          >
            Ver demonstração
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
        style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}
      >
        <motion.div animate={{ y: [0, 9, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}>
          <ChevronDown size={18} color="rgba(255,255,255,0.3)" />
        </motion.div>
      </motion.div>

      {/* Pause / play button */}
      <button
        onClick={togglePause}
        title={paused ? 'Retomar vídeo' : 'Pausar vídeo'}
        className="hero-video-ctrl"
        style={{
          position: 'absolute', bottom: 28, right: 36, zIndex: 3,
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.55)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}
      </button>
    </section>
  )
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11, letterSpacing: '0.14em', fontWeight: 500,
      color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 18,
    }}>
      {children}
    </p>
  )
}

function Reveal({ children, delay = 0, x = 0 }: { children: React.ReactNode; delay?: number; x?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay }}
      viewport={{ once: true, margin: '-50px' }}
    >
      {children}
    </motion.div>
  )
}

// ─── Benefit icons (custom SVG, black/white, animated) ───────────────────────

function IconPipeline() {
  const [hov, setHov] = useState(false)
  return (
    <svg
      width="40" height="28" viewBox="0 0 40 28" fill="none"
      strokeLinecap="round" overflow="visible"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {/* Three Gantt bars — on hover they rebalance, simulating work flowing */}
      <motion.rect x={0} y={0}    width={38} height={7} rx={3.5}
        stroke="#0a0a0a" strokeWidth={1.4}
        animate={{ scaleX: hov ? 0.68 : 1 }}
        style={{ transformOrigin: '0px 3.5px' }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.rect x={0} y={10.5} width={26} height={7} rx={3.5}
        stroke="#0a0a0a" strokeWidth={1.4}
        animate={{ scaleX: hov ? 1.46 : 1 }}
        style={{ transformOrigin: '0px 14px' }}
        transition={{ duration: 0.42, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.rect x={0} y={21}   width={16} height={7} rx={3.5}
        stroke="#0a0a0a" strokeWidth={1.4}
        animate={{ scaleX: hov ? 2.0 : 1 }}
        style={{ transformOrigin: '0px 24.5px' }}
        transition={{ duration: 0.42, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )
}

function IconPortal() {
  const [hov, setHov] = useState(false)
  return (
    <svg
      width="38" height="32" viewBox="0 0 38 32" fill="none" strokeLinecap="round"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {/* Browser frame */}
      <rect x={1} y={1} width={36} height={30} rx={4} stroke="#0a0a0a" strokeWidth={1.4}/>
      <line x1={1} y1={9} x2={37} y2={9} stroke="#0a0a0a" strokeWidth={1.4}/>
      {/* Chrome dots */}
      <circle cx={6.5}  cy={5} r={1.4} fill="#0a0a0a"/>
      <circle cx={11.5} cy={5} r={1.4} fill="#0a0a0a"/>
      <circle cx={16.5} cy={5} r={1.4} fill="#0a0a0a"/>
      {/* User avatar — springs up on hover */}
      <motion.g
        animate={{ y: hov ? -1.5 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      >
        <motion.circle cx={19} cy={18} r={4}
          stroke="#0a0a0a"
          animate={{ strokeWidth: hov ? 1.9 : 1.4 }}
          transition={{ duration: 0.22 }}
        />
        <motion.path
          d="M11 30 Q11 25 19 25 Q27 25 27 30"
          stroke="#0a0a0a"
          animate={{ strokeWidth: hov ? 1.9 : 1.4, opacity: hov ? 1 : 0.55 }}
          transition={{ duration: 0.22 }}
        />
      </motion.g>
    </svg>
  )
}

function IconTeam() {
  const [hov, setHov] = useState(false)
  return (
    <svg
      width="38" height="34" viewBox="0 0 38 34" fill="none" strokeLinecap="round"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {/* Connection lines — fade in on hover */}
      <motion.line x1={15.5} y1={9.5} x2={8.5}  y2={23.5}
        stroke="#0a0a0a" strokeWidth={1.2}
        animate={{ opacity: hov ? 0.85 : 0.2 }}
        transition={{ duration: 0.28 }}
      />
      <motion.line x1={22.5} y1={9.5} x2={29.5} y2={23.5}
        stroke="#0a0a0a" strokeWidth={1.2}
        animate={{ opacity: hov ? 0.85 : 0.2 }}
        transition={{ duration: 0.28, delay: 0.05 }}
      />
      <motion.line x1={9.5}  y1={27}  x2={28.5} y2={27}
        stroke="#0a0a0a" strokeWidth={1.2}
        animate={{ opacity: hov ? 0.85 : 0.2 }}
        transition={{ duration: 0.28, delay: 0.1 }}
      />
      {/* Nodes — spring-scale on hover */}
      <motion.circle cx={19} cy={6}  r={4}
        stroke="#0a0a0a" strokeWidth={1.4}
        animate={{ scale: hov ? 1.14 : 1 }}
        style={{ transformOrigin: '19px 6px' }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      />
      <motion.circle cx={6}  cy={27} r={3.5}
        stroke="#0a0a0a" strokeWidth={1.3}
        animate={{ scale: hov ? 1.1 : 1 }}
        style={{ transformOrigin: '6px 27px' }}
        transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.05 }}
      />
      <motion.circle cx={32} cy={27} r={3.5}
        stroke="#0a0a0a" strokeWidth={1.3}
        animate={{ scale: hov ? 1.1 : 1 }}
        style={{ transformOrigin: '32px 27px' }}
        transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.1 }}
      />
    </svg>
  )
}

const BENEFIT_ICONS = [IconPipeline, IconPortal, IconTeam]

// ─── Benefits ─────────────────────────────────────────────────────────────────

function Benefits() {
  return (
    <section id="recursos" style={{ padding: '140px 40px', background: 'var(--bg-card)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Reveal>
          <div style={{ maxWidth: 580, marginBottom: 72 }}>
            <Label>Recursos</Label>
            <h2 style={{
              fontSize: 'clamp(30px, 4vw, 54px)', fontWeight: 300,
              color: '#0a0a0a', letterSpacing: '-0.025em', lineHeight: 1.1,
            }}>
              Tudo que seu escritório
              <br />precisa, em um só lugar.
            </h2>
          </div>
        </Reveal>

        {/* 3-col grid with hairline separators (Apple style) */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, overflow: 'hidden',
        }} className="benefits-grid">
          {BENEFITS.map((b, i) => {
            const BIcon = BENEFIT_ICONS[i]
            return (
              <Reveal key={b.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ backgroundColor: '#fafafa' }}
                  transition={{ duration: 0.18 }}
                  style={{
                    padding: '52px 44px', background: 'var(--bg-card)', height: '100%',
                    borderRight: i < BENEFITS.length - 1 ? '1px solid rgba(0,0,0,0.07)' : 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.25)', fontWeight: 300, letterSpacing: '0.06em' }}>
                    {b.num}
                  </span>
                  <div style={{ marginTop: 28, marginBottom: 28 }}>
                    <BIcon />
                  </div>
                  <h3 style={{
                    fontSize: 17, fontWeight: 400, color: '#0a0a0a',
                    marginBottom: 12, letterSpacing: '-0.01em',
                  }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.48)', lineHeight: 1.72, fontWeight: 300 }}>
                    {b.desc}
                  </p>
                </motion.div>
              </Reveal>
            )
          })}
        </div>

        {/* Extra features row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24,
        }}>
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 18px', border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: 100, background: 'var(--bg-card)',
              }}>
                <Icon size={14} color="rgba(0,0,0,0.4)" />
                <span style={{ fontSize: 13, fontWeight: 300, color: 'rgba(0,0,0,0.55)' }}>{f.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="como-funciona" style={{ padding: '140px 40px', background: '#f9f9f9' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Reveal>
          <div style={{ marginBottom: 80 }}>
            <Label>Como funciona</Label>
            <h2 style={{
              fontSize: 'clamp(30px, 4vw, 54px)', fontWeight: 300,
              color: '#0a0a0a', letterSpacing: '-0.025em', lineHeight: 1.1,
            }}>
              Comece em minutos.
            </h2>
          </div>
        </Reveal>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          gap: 0, position: 'relative',
        }} className="steps-grid">
          {/* Connector */}
          <div style={{
            position: 'absolute', top: 19, left: '6%', right: '6%',
            height: 1, background: 'rgba(0,0,0,0.1)', zIndex: 0,
          }} className="hide-mobile" />

          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div style={{ padding: '0 28px 0 0', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', marginBottom: 28,
                  background: i === 0 ? '#0a0a0a' : '#fff',
                  border: `1px solid ${i === 0 ? '#0a0a0a' : 'rgba(0,0,0,0.12)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 11.5, fontWeight: 400, color: i === 0 ? '#fff' : 'rgba(0,0,0,0.35)' }}>
                    {s.n}
                  </span>
                </div>
                <h3 style={{ fontSize: 15.5, fontWeight: 400, color: '#0a0a0a', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, color: 'rgba(0,0,0,0.45)', lineHeight: 1.65, fontWeight: 300 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── For whom ─────────────────────────────────────────────────────────────────

function ForWhom() {
  return (
    <section style={{ padding: '160px 40px', background: '#0a0a0a' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 80, alignItems: 'start',
        }} className="for-whom-grid">
          <Reveal>
            <Label>Para quem</Label>
            <h2 style={{
              fontSize: 'clamp(32px, 4.5vw, 66px)', fontWeight: 300,
              color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.07,
              marginTop: 16,
            }}>
              Para arquitetos
              <br />que levam a gestão
              <br />a sério.
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <div style={{ paddingTop: 4 }}>
              {FOR_WHOM.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 18,
                    padding: '22px 0', borderBottom: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span style={{
                    fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.2)',
                    paddingTop: 3, minWidth: 22,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.58 }}>
                    {item}
                  </span>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="precos" style={{ padding: '140px 40px', background: 'var(--bg-card)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <Label>Preços</Label>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 300,
              color: '#0a0a0a', letterSpacing: '-0.025em', lineHeight: 1.1,
            }}>
              Um plano. Simples assim.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '44px 48px 36px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 300, color: 'rgba(0,0,0,0.38)', marginBottom: 10, letterSpacing: '0.04em' }}>
                    ARC PRO
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 56, fontWeight: 300, color: '#0a0a0a', letterSpacing: '-0.04em' }}>R$297</span>
                    <span style={{ fontSize: 14, fontWeight: 300, color: 'rgba(0,0,0,0.38)' }}>/mês</span>
                  </div>
                </div>
                <div style={{
                  padding: '8px 15px', background: '#0a0a0a',
                  borderRadius: 100, fontSize: 10.5, fontWeight: 500,
                  color: '#fff', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                }}>
                  14 DIAS GRÁTIS
                </div>
              </div>
              <Link href="/cadastro" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '15px', background: '#0a0a0a', color: '#fff',
                borderRadius: 100, textDecoration: 'none', fontSize: 14, fontWeight: 400,
                transition: 'opacity 0.2s ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Começar 14 dias grátis <ArrowRight size={14} />
              </Link>
            </div>

            {/* Benefits */}
            <div style={{ padding: '36px 48px 40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {PRICING_BENEFITS.map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Check size={13} color="#0a0a0a" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 300, color: 'rgba(0,0,0,0.6)' }}>{b}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(0,0,0,0.3)', marginTop: 28, textAlign: 'center' }}>
                Sem fidelidade. Cancele quando quiser.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── CTA Final ────────────────────────────────────────────────────────────────

function CTAFinal() {
  return (
    <section style={{ padding: '180px 40px', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 800, height: 500, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,102,255,0.07) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />
      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 68px)', fontWeight: 300,
            color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.07, marginBottom: 24,
          }}>
            Pronto para transformar
            <br />seu escritório?
          </h2>
          <p style={{
            fontSize: 16, fontWeight: 300,
            color: 'rgba(255,255,255,0.4)', marginBottom: 52, lineHeight: 1.65,
          }}>
            Junte-se aos escritórios que já gerenciam melhor com a ARC.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/cadastro" style={{
              padding: '16px 36px', background: 'var(--bg-card)', color: '#0a0a0a',
              borderRadius: 100, textDecoration: 'none', fontSize: 14, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              Começar agora <ArrowRight size={14} />
            </Link>
            <Link href="/login" style={{
              padding: '16px 36px', color: 'rgba(255,255,255,0.55)',
              borderRadius: 100, textDecoration: 'none', fontSize: 14, fontWeight: 300,
              border: '1px solid rgba(255,255,255,0.14)',
              transition: 'border-color 0.2s ease, color 0.2s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
            >
              Já tenho conta
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '56px 40px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 52 }}>
          <div>
            <span style={{ fontSize: 17, fontWeight: 200, letterSpacing: '0.3em', color: '#fff' }}>ARC</span>
            <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.28)', marginTop: 8 }}>
              Plataforma de gestão para arquitetos
            </p>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Sobre',       href: '/sobre'         },
              { label: 'Termos',      href: '/termos-de-uso' },
              { label: 'Privacidade', href: '/privacidade'   },
              { label: 'Contato',     href: '/contato'       },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.32)',
                textDecoration: 'none', transition: 'color 0.2s ease',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.32)')}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <a href="mailto:contato@usearc.com.br" style={{
            fontSize: 12.5, fontWeight: 300, color: 'rgba(255,255,255,0.28)', textDecoration: 'none',
          }}>
            contato@usearc.com.br
          </a>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24 }}>
          <p style={{ fontSize: 11.5, fontWeight: 300, color: 'rgba(255,255,255,0.18)' }}>
            © {new Date().getFullYear()} ARC Tecnologia. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; font-size: 16px; }
  body {
    font-family: var(--font-inter-tight, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
    cursor: none;
    background: #fff;
    color: #0a0a0a;
  }
  a, button { cursor: none; }

  /* Responsive helpers */
  @media (max-width: 768px) {
    .hide-mobile      { display: none !important; }
    .show-mobile      { display: flex !important; }
    .hero-video       { display: none !important; }
    .hero-mobile-bg   { display: block !important; }
    .benefits-grid    { grid-template-columns: 1fr !important; }
    .steps-grid       { grid-template-columns: 1fr 1fr !important; gap: 40px !important; }
    .for-whom-grid    { grid-template-columns: 1fr !important; gap: 40px !important; }
  }
  @media (min-width: 769px) {
    .show-mobile { display: none !important; }
  }
`

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <CustomCursor />
      <Nav />
      <main>
        <Hero />
        <Benefits />
        <HowItWorks />
        <ForWhom />
        <Pricing />
        <CTAFinal />
      </main>
      <Footer />
    </>
  )
}
