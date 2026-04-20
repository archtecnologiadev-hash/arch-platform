'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, UserPlus, TicketCheck, ScrollText, LogOut, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const NAV = [
  { label: 'Dashboard',  href: '/admin',            icon: LayoutDashboard, exact: true },
  { label: 'Usuários',   href: '/admin/usuarios',   icon: Users },
  { label: 'Cadastrar',  href: '/admin/cadastrar',  icon: UserPlus },
  { label: 'Tickets',    href: '/admin/tickets',    icon: TicketCheck },
  { label: 'Logs',       href: '/admin/logs',       icon: ScrollText },
]

function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      width: 240, minWidth: 240, height: '100vh', background: '#060606',
      borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        height: 70, display: 'flex', alignItems: 'center', gap: 10,
        paddingLeft: 24, borderBottom: '1px solid #1a1a1a',
      }}>
        <ShieldCheck size={18} color="#c8a96e" />
        <div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.25em', color: '#c8a96e', fontFamily: 'Georgia, serif' }}>
            ARC
          </span>
          <span style={{ fontSize: 9, display: 'block', color: '#444', letterSpacing: '0.2em', fontWeight: 700, marginTop: -2 }}>
            ADMIN
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: isActive ? 600 : 400,
              textDecoration: 'none', transition: 'all 0.15s',
              background: isActive ? 'rgba(200,169,110,0.1)' : 'transparent',
              color: isActive ? '#c8a96e' : '#4a4a4a',
              borderLeft: `2px solid ${isActive ? '#c8a96e' : 'transparent'}`,
            }}>
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a1a1a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(200,169,110,0.12)', border: '1.5px solid rgba(200,169,110,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#c8a96e',
        }}>A</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>Administrador</div>
          <div style={{ fontSize: 10, color: '#333', marginTop: 1 }}>Painel interno</div>
        </div>
        <button onClick={handleLogout} title="Sair" style={{
          background: 'none', border: 'none', cursor: 'pointer', color: '#333',
          padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#333')}>
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080808' }}>
      <AdminSidebar />
      <main style={{ flex: 1, marginLeft: 240, minHeight: '100vh', background: '#080808', overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}
