'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ArrowRight, Menu, X, ChevronDown,
  FolderOpen, Users, BarChart3, MessageSquare, Calendar, FileText,
} from 'lucide-react'

const HeroScene3D = dynamic(() => import('@/components/landing/HeroScene3D'), { ssr: false })
const CubeScene3D  = dynamic(() => import('@/components/landing/CubeScene3D'),  { ssr: false })

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Recursos',       href: '#recursos'      },
  { label: 'Como funciona',  href: '#como-funciona' },
  { label: 'Preços',         href: '#precos'        },
]

const BENEFITS = [
  {
    icon: BarChart3,
    title: 'Pipeline Visual',
    desc: 'Acompanhe cada projeto em etapas claras. Nunca perca um prazo, nunca esqueça uma entrega.',
    color: '#007AFF',
  },
  {
    icon: Users,
    title: 'Portal do Cliente',
    desc: 'Seu cliente acompanha o projeto em tempo real. Menos reuniões, mais confiança.',
    color: '#34d399',
  },
  {
    icon: FolderOpen,
    title: 'Equipe Integrada',
    desc: 'Gerencie permissões, tarefas e comunicação de toda a equipe em um só lugar.',
    color: '#a78bfa',
  },
]

const CUBE_FEATURES = [
  { icon: BarChart3,     label: 'Pipeline de Projetos', desc: 'Visualize o andamento de cada projeto em etapas personalizáveis. Saiba exatamente onde cada entrega está.' },
  { icon: Users,         label: 'Portal do Cliente',    desc: 'Ofereça ao cliente um portal exclusivo com acesso a fotos, documentos e etapas do projeto.' },
  { icon: FolderOpen,    label: 'Arquivos e Pastas',    desc: 'Organize fotos de obra, plantas, contratos e referências em pastas inteligentes por projeto.' },
  { icon: MessageSquare, label: 'Mensagens Integradas', desc: 'Comunique-se com cliente e equipe direto na plataforma. Tudo registrado e organizado.' },
  { icon: Calendar,      label: 'Agenda e Prazos',      desc: 'Cadastre marcos, entregas e reuniões. Receba alertas automáticos de vencimento.' },
  { icon: FileText,      label: 'Orçamentos',           desc: 'Crie e envie orçamentos profissionais com aceite digital do cliente.' },
]

const STEPS = [
  { n: '01', title: 'Crie sua conta grátis', desc: '14 dias completos sem cartão. Configure em 5 minutos.' },
  { n: '02', title: 'Configure seu escritório', desc: 'Personalize seu perfil e convide a equipe.' },
  { n: '03', title: 'Adicione projetos e clientes', desc: 'Crie projetos, defina etapas, convide clientes.' },
  { n: '04', title: 'Cresça com organização', desc: 'Menos e-mail, menos reunião, mais resultado.' },
]

const TESTIMONIALS = [
  {
    name: 'Ana Lima',
    office: 'Lima Arquitetura · São Paulo',
    text: '"A ARC transformou como gerenciamos nossos projetos. Agora toda a equipe está alinhada e os clientes adoram o portal."',
    initial: 'AL',
    color: '#007AFF',
  },
  {
    name: 'Carlos Mendes',
    office: 'Studio Mendes · Rio de Janeiro',
    text: '"O portal do cliente é incrível. Eles ficam atualizados sem precisar de reuniões constantes. Economizo horas por semana."',
    initial: 'CM',
    color: '#34d399',
  },
  {
    name: 'Mariana Costa',
    office: 'MC Arquitetura · Belo Horizonte',
    text: '"Finalmente uma ferramenta feita para arquitetos de verdade. Vale cada centavo — e os 14 dias grátis me convenceram na hora."',
    initial: 'MC',
    color: '#a78bfa',
  },
]

const PRICING_BENEFITS = [
  'Projetos ilimitados',
  'Portal do cliente incluso',
  'Equipe com permissões',
  'Armazenamento 20 GB',
  'Mensagens integradas',
  'Orçamentos com aceite digital',
  'Suporte por email e chat',
  'Atualizações contínuas',
]

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useMouse() {
  const ref = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      ref.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])
  return ref
}

// ─── Custom cursor ─────────────────────────────────────────────────────────────

function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf: number
    let cx = 0, cy = 0
    const tx = { v: 0 }, ty = { v: 0 }

    const move = (e: MouseEvent) => { tx.v = e.clientX; ty.v = e.clientY }
    window.addEventListener('mousemove', move)

    const tick = () => {
      cx += (tx.v - cx) * 0.12
      cy += (ty.v - cy) * 0.12
      if (ringRef.current) ringRef.current.style.transform = `translate(${cx - 16}px,${cy - 16}px)`
      if (dotRef.current)  dotRef.current.style.transform  = `translate(${tx.v - 3}px,${ty.v - 3}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])

  return (
    <>
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0, width: 32, height: 32,
        border: '1.5px solid rgba(0,122,255,0.55)', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999, willChange: 'transform',
      }} />
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0, width: 6, height: 6,
        background: '#007AFF', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999, willChange: 'transform',
      }} />
    </>
  )
}

// ─── Tilt card ────────────────────────────────────────────────────────────────

function TiltCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width  / 2) / (r.width  / 2)
    const y = (e.clientY - r.top  - r.height / 2) / (r.height / 2)
    el.style.transform = `perspective(1200px) rotateX(${-y * 9}deg) rotateY(${x * 9}deg) scale(1.025)`
  }
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) scale(1)'
  }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition: 'transform 0.22s ease-out', transformStyle: 'preserve-3d', ...style }}>
      {children}
    </div>
  )
}

// ─── Reveal wrapper ────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, y = 36 }: { children: React.ReactNode; delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay }}
      viewport={{ once: true, margin: '-80px' }}
    >
      {children}
    </motion.div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      padding: '0 32px',
      background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : 'none',
      transition: 'background 0.35s ease, border-color 0.35s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64 }}>
        {/* Logo */}
        <Link href="/" style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.4em', color: scrolled ? '#007AFF' : '#fff', textDecoration: 'none', marginRight: 'auto' }}>
          ARC
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginRight: 32 }} className="hide-mobile">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} style={{
              fontSize: 14, fontWeight: 400, color: scrolled ? '#1a1a1a' : 'rgba(255,255,255,0.82)',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#007AFF')}
              onMouseLeave={e => (e.currentTarget.style.color = scrolled ? '#1a1a1a' : 'rgba(255,255,255,0.82)')}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} className="hide-mobile">
          <Link href="/login" style={{
            fontSize: 13.5, fontWeight: 500, color: scrolled ? '#1a1a1a' : 'rgba(255,255,255,0.82)',
            textDecoration: 'none', padding: '8px 16px',
          }}>
            Entrar
          </Link>
          <Link href="/cadastro" style={{
            fontSize: 13.5, fontWeight: 600, color: '#fff',
            background: '#007AFF', borderRadius: 10, padding: '9px 20px',
            textDecoration: 'none', transition: 'opacity 0.18s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Começar grátis
          </Link>
        </div>

        {/* Hamburger */}
        <button onClick={() => setMobileOpen(v => !v)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 8,
          color: scrolled ? '#1a1a1a' : '#fff', display: 'none',
        }} className="show-mobile">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.07)', padding: '16px 24px 24px' }}>
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                style={{ display: 'block', fontSize: 15, color: '#1a1a1a', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                {l.label}
              </a>
            ))}
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '11px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, color: '#1a1a1a', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Entrar</Link>
              <Link href="/cadastro" style={{ flex: 1, textAlign: 'center', padding: '11px', background: '#007AFF', borderRadius: 10, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Começar grátis</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  return (
    <section style={{ position: 'relative', height: '100dvh', minHeight: 640, background: '#080912', overflow: 'hidden' }}>
      {/* 3D background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <HeroScene3D mouseRef={mouseRef} />
      </div>

      {/* Gradient overlays */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,122,255,0.08) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(8,9,18,0.3) 0%, rgba(8,9,18,0.1) 40%, rgba(8,9,18,0.85) 85%, #080912 100%)' }} />

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 24px',
      }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.25)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 32,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#007AFF', boxShadow: '0 0 8px #007AFF' }} />
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', fontWeight: 500, letterSpacing: '0.04em' }}>
            Plataforma para arquitetos
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 'clamp(36px, 6vw, 76px)',
            fontWeight: 700, color: '#ffffff',
            lineHeight: 1.08, letterSpacing: '-0.03em',
            maxWidth: 860, margin: '0 auto 20px',
          }}
        >
          A plataforma que transforma{' '}
          <span style={{ color: '#007AFF' }}>a gestão</span>{' '}
          do seu escritório
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 'clamp(15px, 2vw, 20px)',
            color: 'rgba(255,255,255,0.58)', fontWeight: 300,
            maxWidth: 560, margin: '0 auto 44px', lineHeight: 1.65,
          }}
        >
          Pipeline visual, equipe e clientes em um só lugar.{' '}
          <br className="hide-mobile" />
          Comece grátis por 14 dias.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Link href="/cadastro" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', background: '#007AFF',
            color: '#fff', borderRadius: 12, textDecoration: 'none',
            fontSize: 15, fontWeight: 700,
            boxShadow: '0 0 40px rgba(0,122,255,0.4)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'scale(1.03)'; el.style.boxShadow = '0 0 60px rgba(0,122,255,0.6)' }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'scale(1)'; el.style.boxShadow = '0 0 40px rgba(0,122,255,0.4)' }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          >
            Começar grátis <ArrowRight size={16} />
          </Link>
          <a href="#como-funciona" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 32px',
            color: '#fff', borderRadius: 12, textDecoration: 'none',
            fontSize: 15, fontWeight: 500,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            transition: 'background 0.18s ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            Ver demonstração
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)' }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.3))' }} />
            <ChevronDown size={14} color="rgba(255,255,255,0.35)" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Benefits ─────────────────────────────────────────────────────────────────

function Benefits() {
  return (
    <section id="recursos" style={{ padding: '120px 24px', background: '#ffffff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Reveal>
          <p style={{ textAlign: 'center', fontSize: 12, letterSpacing: '0.12em', color: '#007AFF', fontWeight: 700, marginBottom: 12 }}>RECURSOS</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.025em', marginBottom: 16, lineHeight: 1.15 }}>
            Tudo que seu escritório precisa
          </h2>
          <p style={{ textAlign: 'center', fontSize: 17, color: '#6b7280', fontWeight: 300, maxWidth: 520, margin: '0 auto 72px' }}>
            Uma plataforma completa pensada por quem entende o dia a dia do arquiteto.
          </p>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.12}>
              <TiltCard style={{ height: '100%' }}>
                <div style={{
                  background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 20, padding: '36px 32px',
                  boxShadow: '0 2px 24px rgba(0,0,0,0.06)',
                  height: '100%', boxSizing: 'border-box',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${b.color}14`,
                    border: `1px solid ${b.color}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24,
                  }}>
                    <b.icon size={22} color={b.color} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.01em' }}>
                    {b.title}
                  </h3>
                  <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.7, fontWeight: 300 }}>
                    {b.desc}
                  </p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Cube Features ─────────────────────────────────────────────────────────────

function CubeFeatures() {
  const [active, setActive] = useState(0)
  const Feature = CUBE_FEATURES[active]

  return (
    <section style={{ padding: '120px 24px', background: '#080912', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Reveal>
          <p style={{ textAlign: 'center', fontSize: 12, letterSpacing: '0.12em', color: '#007AFF', fontWeight: 700, marginBottom: 12 }}>PLATAFORMA</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.025em', marginBottom: 72, lineHeight: 1.15 }}>
            Tudo que você precisa,<br />em um só lugar
          </h2>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="cube-grid">
          {/* Feature tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CUBE_FEATURES.map((f, i) => {
              const Icon = f.icon
              const isActive = i === active
              return (
                <motion.button
                  key={f.label}
                  onClick={() => setActive(i)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: isActive ? 'rgba(0,122,255,0.12)' : 'rgba(255,255,255,0.04)',
                    borderLeft: isActive ? '3px solid #007AFF' : '3px solid transparent',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <Icon size={18} color={isActive ? '#007AFF' : 'rgba(255,255,255,0.4)'} />
                  <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                    {f.label}
                  </span>
                </motion.button>
              )
            })}

            {/* Feature description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{ marginTop: 16, padding: '20px 22px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontWeight: 300, margin: 0 }}>
                  {Feature.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 3D Cube */}
          <div style={{ height: 400, position: 'relative' }}>
            <CubeScene3D />
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap',
            }}>
              Arraste para girar
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="como-funciona" style={{ padding: '120px 24px', background: '#f2f2f7' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <p style={{ textAlign: 'center', fontSize: 12, letterSpacing: '0.12em', color: '#007AFF', fontWeight: 700, marginBottom: 12 }}>COMO FUNCIONA</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.025em', marginBottom: 72, lineHeight: 1.15 }}>
            Comece em minutos
          </h2>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0, position: 'relative' }}>
          {/* Connecting line */}
          <div style={{ position: 'absolute', top: 28, left: '12%', right: '12%', height: 1, background: 'linear-gradient(to right, #007AFF, rgba(0,122,255,0.2))', zIndex: 0 }} className="hide-mobile" />

          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.14}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 16px', position: 'relative', zIndex: 1 }}>
                {/* Number circle */}
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: i === 0 ? '#007AFF' : '#fff',
                  border: `2px solid ${i === 0 ? '#007AFF' : 'rgba(0,0,0,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 24, boxShadow: i === 0 ? '0 0 24px rgba(0,122,255,0.35)' : 'none',
                  transition: 'all 0.3s',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: i === 0 ? '#fff' : '#8e8e93' }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6, fontWeight: 300 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive(v => (v + 1) % TESTIMONIALS.length), 4200)
    return () => clearInterval(t)
  }, [])

  return (
    <section style={{ padding: '120px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <p style={{ textAlign: 'center', fontSize: 12, letterSpacing: '0.12em', color: '#007AFF', fontWeight: 700, marginBottom: 12 }}>DEPOIMENTOS</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.025em', marginBottom: 64 }}>
            O que dizem os arquitetos
          </h2>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              onClick={() => setActive(i)}
              animate={{
                scale: active === i ? 1.025 : 1,
                boxShadow: active === i ? '0 8px 40px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
              }}
              transition={{ duration: 0.4 }}
              style={{
                background: '#fff', border: `1.5px solid ${active === i ? t.color + '50' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: 20, padding: '28px 28px 24px',
                cursor: 'pointer', userSelect: 'none',
              }}
            >
              {/* Quote */}
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, fontWeight: 300, marginBottom: 24, fontStyle: 'italic' }}>
                {t.text}
              </p>
              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `${t.color}20`, border: `1px solid ${t.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: t.color,
                }}>
                  {t.initial}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1a1a1a' }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{t.office}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              width: active === i ? 24 : 8, height: 8, borderRadius: 4,
              background: active === i ? '#007AFF' : 'rgba(0,0,0,0.15)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="precos" style={{ padding: '120px 24px', background: '#f2f2f7' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Reveal>
          <p style={{ textAlign: 'center', fontSize: 12, letterSpacing: '0.12em', color: '#007AFF', fontWeight: 700, marginBottom: 12 }}>PREÇO</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.025em', marginBottom: 40 }}>
            Um plano. Simples assim.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <TiltCard>
            <div style={{
              background: '#fff', borderRadius: 24,
              border: '1.5px solid rgba(0,122,255,0.2)',
              boxShadow: '0 8px 60px rgba(0,122,255,0.1)',
              padding: '40px 36px', position: 'relative', overflow: 'hidden',
            }}>
              {/* Glow */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,122,255,0.06)', pointerEvents: 'none' }} />

              {/* Badge */}
              <div style={{
                position: 'absolute', top: 24, right: 24,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: 100, padding: '5px 14px',
                fontSize: 11.5, fontWeight: 700, color: '#fff', letterSpacing: '0.04em',
              }}>
                14 DIAS GRÁTIS
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 300, color: '#8e8e93', marginBottom: 8 }}>Plano Arquiteto</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 32 }}>
                <span style={{ fontSize: 48, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.03em' }}>R$149</span>
                <span style={{ fontSize: 15, color: '#8e8e93', fontWeight: 300 }}>/mês</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 36 }}>
                {PRICING_BENEFITS.map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color="#34d399" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 300 }}>{b}</span>
                  </div>
                ))}
              </div>

              <Link href="/cadastro" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '15px', background: '#007AFF', color: '#fff',
                borderRadius: 12, textDecoration: 'none', fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 24px rgba(0,122,255,0.35)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'scale(1.02)'; el.style.boxShadow = '0 6px 32px rgba(0,122,255,0.5)' }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'scale(1)'; el.style.boxShadow = '0 4px 24px rgba(0,122,255,0.35)' }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
              >
                Começar agora <ArrowRight size={16} />
              </Link>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 14 }}>
                Sem fidelidade. Cancele quando quiser.
              </p>
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  )
}

// ─── CTA Final ────────────────────────────────────────────────────────────────

function CTAFinal() {
  return (
    <section style={{ padding: '140px 24px', background: '#080912', position: 'relative', overflow: 'hidden' }}>
      {/* Animated gradient blobs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '20%', left: '30%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,122,255,0.2) 0%, transparent 70%)', pointerEvents: 'none' }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut', delay: 2 }}
        style={{ position: 'absolute', bottom: '10%', right: '20%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', pointerEvents: 'none' }}
      />

      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
            Pronto para transformar<br />seu escritório?
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', fontWeight: 300, marginBottom: 44 }}>
            Junte-se aos arquitetos que já gerenciam melhor com a ARC.
          </p>
          <Link href="/cadastro" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '18px 44px', background: '#007AFF', color: '#fff',
            borderRadius: 14, textDecoration: 'none', fontSize: 17, fontWeight: 700,
            boxShadow: '0 0 60px rgba(0,122,255,0.5)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.transform = 'scale(1.04)'; el.style.boxShadow = '0 0 80px rgba(0,122,255,0.7)' }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.transform = 'scale(1)'; el.style.boxShadow = '0 0 60px rgba(0,122,255,0.5)' }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          >
            Começar grátis <ArrowRight size={18} />
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', marginTop: 18 }}>
            Sem fidelidade. Cancele quando quiser.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: '#05050d', padding: '48px 32px 36px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.4em', color: '#007AFF' }}>ARC</span>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6, fontWeight: 300 }}>
            Plataforma de gestão para arquitetos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Sobre',        href: '/sobre'        },
            { label: 'Termos',       href: '/termos-de-uso'},
            { label: 'Privacidade',  href: '/privacidade'  },
            { label: 'Contato',      href: '/contato'      },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 300,transition: 'color 0.18s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <a href="mailto:contato@usearc.com.br" style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 300 }}>
            contato@usearc.com.br
          </a>
          <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.2)', fontWeight: 300 }}>
            © {new Date().getFullYear()} ARC Tecnologia
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; cursor: none; }
  @media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .show-mobile { display: flex !important; }
    .cube-grid   { grid-template-columns: 1fr !important; }
  }
  @media (min-width: 769px) {
    .show-mobile { display: none !important; }
  }
`

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const mouseRef = useMouse()

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <CustomCursor />
      <Nav />
      <main>
        <Hero mouseRef={mouseRef} />
        <Benefits />
        <CubeFeatures />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTAFinal />
      </main>
      <Footer />
    </>
  )
}
