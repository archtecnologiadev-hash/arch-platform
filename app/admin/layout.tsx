'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, UserPlus, TicketCheck, ScrollText, LogOut, ShieldCheck, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const NAV = [
  { label: 'Dashboard',    href: '/admin',              icon: LayoutDashboard, exact: true },
  { label: 'Assinaturas',  href: '/admin/assinaturas',  icon: CreditCard },
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
      width: 232, minWidth: 232, height: '100vh', background: '#ffffff',
      borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', gap: 10,
        paddingLeft: 20, borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <ShieldCheck size={16} color="#007AFF" strokeWidth={1.5} />
        <div>
          <span style={{ fontSize: 16, fontWeight: 300, letterSpacing: '0.3em', color: '#007AFF' }}>
            ARC
          </span>
          <span style={{ fontSize: 9, display: 'block', color: '#8e8e93', letterSpacing: '0.2em', fontWeight: 500, marginTop: -1, textTransform: 'uppercase' }}>
            Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const Icon = item.icon
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: isActive ? 500 : 400,
              textDecoration: 'none', transition: 'all 0.15s',
              background: isActive ? 'rgba(0,122,255,0.08)' : 'transparent',
              color: isActive ? '#007AFF' : '#6b6b6b',
            }}>
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(0,122,255,0.1)', border: '1.5px solid rgba(0,122,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 500, color: '#007AFF',
        }}>A</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 400, color: '#1a1a1a' }}>Administrador</div>
          <div style={{ fontSize: 10, color: '#8e8e93', marginTop: 1 }}>Painel interno</div>
        </div>
        <button onClick={handleLogout} title="Sair" style={{
          background: 'none', border: 'none', cursor: 'pointer', color: '#c7c7cc',
          padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ff3b30')}
          onMouseLeave={e => (e.currentTarget.style.color = '#c7c7cc')}>
          <LogOut size={15} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f2f2f7' }}>
      <AdminSidebar />
      <main style={{ flex: 1, marginLeft: 232, minHeight: '100vh', background: '#f2f2f7', overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}
