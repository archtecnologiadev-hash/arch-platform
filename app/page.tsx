'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, FolderOpen, Users, CheckCircle, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-black/[0.07] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-5">
          <Link href="/" className="text-[15px] font-light tracking-[0.35em] text-black md:text-lg" aria-label="ARC — Início">
            ARC
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Navegação principal">
            <a href="#como-funciona" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Como funciona</a>
            <a href="#precos" className="text-sm font-light text-[#8e8e93] transition-colors hover:text-black">Preços</a>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/login" className="hidden text-sm font-light text-[#8e8e93] hover:text-black md:block">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-[8px] bg-[#007AFF] px-3.5 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2 md:px-4 md:text-sm"
            >
              Começar grátis
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
            <a href="#como-funciona" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black" onClick={() => setMobileMenuOpen(false)}>Como funciona</a>
            <a href="#precos" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black" onClick={() => setMobileMenuOpen(false)}>Preços</a>
            <Link href="/login" className="block py-3 text-sm font-light text-[#6b6b6b] hover:text-black">Entrar</Link>
            <Link href="/cadastro" className="block py-3 text-sm font-medium text-[#007AFF]">Começar grátis</Link>
          </nav>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-14 text-center md:px-8">
        <p className="mb-4 text-[11px] font-light tracking-[0.45em] text-[#8e8e93] uppercase">
          Plataforma de gestão
        </p>
        <h1 className="max-w-3xl text-[36px] font-bold leading-[1.15] text-[#1a1a1a] md:text-[62px]">
          A plataforma de gestão para escritórios de arquitetura
        </h1>
        <p className="mt-5 max-w-xl text-[16px] font-light leading-relaxed text-[#555] md:text-[20px]">
          Pipeline de projetos, equipe, clientes e arquivos em um só lugar.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/cadastro"
            className="rounded-[10px] bg-[#007AFF] px-8 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2"
          >
            Começar grátis por 14 dias
          </Link>
          <a href="#como-funciona" className="flex items-center gap-2 text-sm font-light text-[#8e8e93] transition-colors hover:text-black">
            Ver como funciona <ArrowRight size={14} />
          </a>
        </div>
        <p className="mt-4 text-[12px] font-light text-[#c7c7cc]">
          Sem cartão de crédito · Cancele quando quiser
        </p>
      </section>

      {/* ── BENEFÍCIOS ───────────────────────────────────────────── */}
      <section className="bg-[#f2f2f7] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-center text-[11px] font-light tracking-[0.45em] text-[#8e8e93] uppercase">Benefícios</p>
          <h2 className="mb-12 text-center text-[26px] font-bold text-[#1a1a1a] md:text-[38px]">
            Tudo que seu escritório precisa
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: <FolderOpen size={22} color="#007AFF" />,
                title: 'Pipeline visual de 8 etapas',
                desc: 'Acompanhe cada projeto do atendimento à execução. Avance etapas, atribua responsáveis e nunca perca o controle.',
              },
              {
                icon: <Users size={22} color="#007AFF" />,
                title: 'Portal do cliente integrado',
                desc: 'Convide clientes para acompanhar o andamento sem reuniões desnecessárias. Eles veem o progresso e os arquivos em tempo real.',
              },
              {
                icon: <CheckCircle size={22} color="#007AFF" />,
                title: 'Equipe e auditoria completa',
                desc: 'Adicione membros com níveis de acesso definidos. Histórico completo de ações para manter tudo rastreável.',
              },
            ].map((b, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 16,
                  padding: '28px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  {b.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{b.title}</h3>
                <p style={{ fontSize: 14, fontWeight: 300, color: '#555', lineHeight: 1.65 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────── */}
      <section id="como-funciona" className="px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-center text-[11px] font-light tracking-[0.45em] text-[#8e8e93] uppercase">Como funciona</p>
          <h2 className="mb-14 text-center text-[26px] font-bold text-[#1a1a1a] md:text-[38px]">
            Em 4 passos simples
          </h2>
          <div className="flex flex-col gap-10">
            {[
              {
                n: '01',
                title: 'Crie seu escritório',
                desc: 'Cadastre-se, configure seu perfil e convide sua equipe. Leva menos de 5 minutos.',
              },
              {
                n: '02',
                title: 'Adicione seus projetos',
                desc: 'Crie projetos, defina a etapa atual e vincule clientes. Tudo organizado num só lugar.',
              },
              {
                n: '03',
                title: 'Gerencie em campo e no escritório',
                desc: 'Atualize etapas, fotografe obras, faça croquis à mão livre, anote e monitore o orçamento.',
              },
              {
                n: '04',
                title: 'Mantenha clientes informados',
                desc: 'O cliente acessa o portal, vê o andamento e os arquivos sem precisar entrar em contato.',
              },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{
                  width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#007AFF' }}>{step.n}</span>
                </div>
                <div style={{ paddingTop: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 5 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, fontWeight: 300, color: '#555', lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section id="precos" className="bg-[#f2f2f7] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-[11px] font-light tracking-[0.45em] text-[#8e8e93] uppercase">Comece hoje</p>
          <h2 className="text-[28px] font-bold text-[#1a1a1a] md:text-[40px]">
            Experimente grátis por 14 dias
          </h2>
          <p className="mt-4 text-[15px] font-light text-[#555]">
            Sem cartão de crédito. Cancele quando quiser.
          </p>
          <Link
            href="/cadastro"
            className="mt-8 inline-block rounded-[10px] bg-[#007AFF] px-10 py-4 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2"
          >
            Cadastre-se grátis
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-black/[0.06] bg-white px-4 py-5 md:py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 md:flex-row md:justify-between">
          <Link href="/" className="text-[14px] font-light tracking-[0.3em] text-black md:text-base" aria-label="ARC — Início">
            ARC
          </Link>
          <p className="text-[11px] font-light text-[#c7c7cc] md:text-xs">
            © 2026 ARC. Todos os direitos reservados.
          </p>
          <div className="flex gap-5">
            <a href="/termos-de-uso" className="text-[11px] font-light text-[#c7c7cc] transition-colors hover:text-[#8e8e93] md:text-xs">Termos</a>
            <a href="/privacidade" className="text-[11px] font-light text-[#c7c7cc] transition-colors hover:text-[#8e8e93] md:text-xs">Privacidade</a>
            <a href="mailto:contato@usearc.com.br" className="text-[11px] font-light text-[#c7c7cc] transition-colors hover:text-[#8e8e93] md:text-xs">Contato</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
