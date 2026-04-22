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
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const nome = data.user.user_metadata?.nome ?? data.user.email ?? 'Fornecedor'
      setUserName(nome)
      setUserInitials(nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase())

      const { data: forn } = await supabase
        .from('fornecedores').select('id').eq('user_id', data.user.id).single()
      if (!forn) return

      const { count } = await supabase
        .from('orcamentos')
        .select('id', { count: 'exact', head: true })
        .eq('fornecedor_id', forn.id)
        .eq('status', 'pendente')
      setPendingCount(count ?? 0)
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      width: 248,
      minWidth: 248,
      height: '100vh',
      background: '#ffffff',
      borderRight: '1px solid rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 40,
    }}>
      {/* Logo + label */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 24,
        gap: 10,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <span style={{
          fontSize: 18,
          fontWeight: 300,
          letterSpacing: '0.35em',
          color: '#007AFF',
        }}>
          ARC
        </span>
        <span style={{
          fontSize: 9,
          color: '#8e8e93',
          letterSpacing: '0.15em',
          fontWeight: 500,
          marginTop: 3,
          textTransform: 'uppercase',
        }}>
          Fornecedor
        </span>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
      }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/fornecedor/dashboard' && pathname.startsWith(item.href))
          const showBadge = item.href === '/fornecedor/orcamentos' && pendingCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: isActive ? 500 : 400,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                background: isActive ? 'rgba(0,122,255,0.08)' : 'transparent',
                color: isActive ? '#007AFF' : '#6b6b6b',
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {showBadge && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#fff',
                  background: '#ef4444', borderRadius: 10,
                  padding: '1px 6px', lineHeight: '16px',
                }}>
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.06)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'rgba(0,122,255,0.1)',
          border: '1.5px solid rgba(0,122,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 500,
          color: '#007AFF',
          flexShrink: 0,
        }}>
          {userInitials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 400,
            color: '#1a1a1a',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {userName}
          </div>
          <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 1 }}>Fornecedor</div>
        </div>
        <button
          onClick={handleLogout}
          title="Sair"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#c7c7cc',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ff3b30')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#c7c7cc')}
        >
          <LogOut size={15} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  )
}

export default function FornecedorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f2f2f7' }}>
      <FornecedorSidebar />
      <main style={{
        flex: 1,
        marginLeft: 248,
        minHeight: '100vh',
        background: '#f2f2f7',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  )
}
