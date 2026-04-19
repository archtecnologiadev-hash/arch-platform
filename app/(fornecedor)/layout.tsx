'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, UserCircle, Package, FileText, MessageCircle, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/fornecedor/dashboard', icon: LayoutDashboard },
  { label: 'Meu Perfil', href: '/fornecedor/perfil', icon: UserCircle },
  { label: 'Catálogo', href: '/fornecedor/catalogo', icon: Package },
  { label: 'Orçamentos', href: '/fornecedor/orcamentos', icon: FileText },
  { label: 'Mensagens', href: '/fornecedor/mensagens', icon: MessageCircle },
]

function FornecedorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState('Fornecedor')
  const [userInitials, setUserInitials] = useState('F')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const nome = data.user.user_metadata?.nome ?? data.user.email ?? 'Fornecedor'
        setUserName(nome)
        setUserInitials(
          nome
            .split(' ')
            .slice(0, 2)
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
        )
      }
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      style={{
        width: 256,
        minWidth: 256,
        height: '100vh',
        background: '#0a0a0a',
        borderRight: '1px solid #1c1c1c',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          height: 70,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 28,
          borderBottom: '1px solid #1c1c1c',
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.3em',
            color: '#c8a96e',
            fontFamily: 'Georgia, serif',
          }}
        >
          ARCH
        </span>
        <span
          style={{
            fontSize: 9,
            color: '#383838',
            letterSpacing: '0.12em',
            fontWeight: 600,
            marginTop: 3,
          }}
        >
          FORNECEDOR
        </span>
      </div>

      <nav
        style={{
          flex: 1,
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/fornecedor/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                borderRadius: 8,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                background: isActive ? 'rgba(200,169,110,0.1)' : 'transparent',
                color: isActive ? '#c8a96e' : '#5a5a5a',
                borderLeft: `2px solid ${isActive ? '#c8a96e' : 'transparent'}`,
              }}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div
        style={{
          borderTop: '1px solid #1c1c1c',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(79,156,249,0.12)',
            border: '1.5px solid rgba(79,156,249,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#4f9cf9',
            flexShrink: 0,
          }}
        >
          {userInitials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#d0d0d0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {userName}
          </div>
          <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>Fornecedor</div>
        </div>
        <button
          onClick={handleLogout}
          title="Sair"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#3a3a3a',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#3a3a3a')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}

export default function FornecedorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080808' }}>
      <FornecedorSidebar />
      <main
        style={{
          flex: 1,
          marginLeft: 256,
          minHeight: '100vh',
          background: '#080808',
          overflowX: 'hidden',
        }}
      >
        {children}
      </main>
    </div>
  )
}
