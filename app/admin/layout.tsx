'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, UserPlus, TicketCheck, ScrollText, LogOut, ShieldCheck, CreditCard, FlaskConical, Menu, X, Receipt, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import ThemeToggle from '@/components/ThemeToggle'

const NAV = [
  { label: 'Dashboard',      href: '/admin',             icon: LayoutDashboard, exact: true },
  { label: 'Cobranças',      href: '/admin/cobrancas',   icon: Receipt },
  { label: 'Assinaturas',    href: '/admin/assinaturas', icon: CreditCard },
  { label: 'Dados de Teste', href: '/admin/dados-teste', icon: FlaskConical },
  { label: 'Usuários',       href: '/admin/usuarios',    icon: Users },
  { label: 'Cadastrar',      href: '/admin/cadastrar',   icon: UserPlus },
  { label: 'Suporte',        href: '/admin/suporte',     icon: MessageSquare },
  { label: 'Tickets',        href: '/admin/tickets',     icon: TicketCheck },
  { label: 'Logs',           href: '/admin/logs',        icon: ScrollText },
]

function AdminSidebar({
  isOpen, isMobile, mounted, onClose,
}: {
  isOpen: boolean
  isMobile: boolean
  mounted: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadSuporte, setUnreadSuporte] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    const check = async () => {
      const { count } = await supabase
        .from('suporte_mensagens')
        .select('id', { count: 'exact', head: true })
        .eq('is_admin', false)
        .eq('lida', false)
      setUnreadSuporte(count ?? 0)
    }
    check()
    const interval = setInterval(check, 30000)
    const channel = supabase
      .channel('admin_suporte_unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'suporte_mensagens' }, check)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'suporte_mensagens' }, check)
      .subscribe()
    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const hidden = isMobile && !isOpen

  return (
    <>
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 39, backdropFilter: 'blur(2px)',
          }}
        />
      )}
      <aside style={{
        width: 232, minWidth: 232, height: '100vh', background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        position: 'fixed', left: 0, top: 0, zIndex: 40,
        transform: hidden ? 'translateX(-100%)' : 'translateX(0)',
        transition: mounted ? 'transform 0.3s ease' : 'none',
        boxShadow: isMobile && isOpen ? 'var(--shadow-sidebar)' : 'none',
      }}>
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', gap: 10,
          paddingLeft: 20, borderBottom: '1px solid var(--border-subtle)',
          justifyContent: 'space-between', paddingRight: isMobile ? 8 : 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={16} color="var(--text)" strokeWidth={1.5} />
            <div>
              <span style={{ fontSize: 16, fontWeight: 300, letterSpacing: '0.3em', color: 'var(--text)' }}>
                ARC
              </span>
              <span style={{ fontSize: 9, display: 'block', color: 'var(--text-3)', letterSpacing: '0.2em', fontWeight: 500, marginTop: -1, textTransform: 'uppercase' }}>
                Admin
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeToggle size={15} />
            {isMobile && (
              <button
                onClick={onClose}
                aria-label="Fechar menu"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 6, display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
            const showBadge = item.href === '/admin/suporte' && unreadSuporte > 0
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: isActive ? 500 : 400,
                  textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
                  background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                  color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
                }}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {showBadge && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#ef4444', borderRadius: 10, padding: '1px 6px', lineHeight: '16px' }}>
                    {unreadSuporte}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent-soft)', border: '1.5px solid var(--accent-soft-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500, color: 'var(--accent)',
          }}>A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--text)' }}>Administrador</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Painel interno</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--logout-btn)', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ff3b30')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--logout-btn)')}
          >
            <LogOut size={15} strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile]       = useState(false)
  const [mounted, setMounted]         = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    setMounted(true)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false)
  }, [isMobile])

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobile, sidebarOpen])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {isMobile && (
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 56,
          background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', zIndex: 38,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 6, display: 'flex', alignItems: 'center' }}
          >
            <Menu size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="var(--text)" strokeWidth={1.5} />
            <span style={{ fontSize: 15, fontWeight: 300, letterSpacing: '0.3em', color: 'var(--text)' }}>ARC</span>
          </div>
          <ThemeToggle size={15} />
        </header>
      )}

      <AdminSidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        mounted={mounted}
        onClose={() => setSidebarOpen(false)}
      />

      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : 232,
        minHeight: '100vh',
        background: 'var(--bg)',
        overflowX: 'hidden',
        paddingTop: isMobile ? 56 : 0,
      }}>
        {children}
      </main>
    </div>
  )
}
