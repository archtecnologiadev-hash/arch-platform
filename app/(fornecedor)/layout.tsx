'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, UserCircle, Package, FileText, MessageCircle } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/fornecedor/dashboard', icon: LayoutDashboard },
  { label: 'Meu Perfil', href: '/fornecedor/perfil', icon: UserCircle },
  { label: 'Catálogo', href: '/fornecedor/catalogo', icon: Package },
  { label: 'Orçamentos', href: '/fornecedor/orcamentos', icon: FileText },
  { label: 'Mensagens', href: '/fornecedor/mensagens', icon: MessageCircle },
]

function FornecedorSidebar() {
  const pathname = usePathname()

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
          padding: '16px 18px',
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
          MS
        </div>
        <div style={{ minWidth: 0 }}>
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
            Marcenaria Silva & Filhos
          </div>
          <div style={{ fontSize: 11, color: '#4a4a4a', marginTop: 2 }}>Marcenaria</div>
        </div>
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
