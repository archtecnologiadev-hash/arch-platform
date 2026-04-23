'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FolderOpen, LogOut, MessageCircle, UserCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const NAV_ITEMS = [
  { label: 'Meus Projetos', href: '/cliente/projetos', icon: FolderOpen },
  { label: 'Mensagens', href: '/cliente/mensagens', icon: MessageCircle },
  { label: 'Meu Perfil', href: '/cliente/perfil', icon: UserCircle },
]

function ClienteSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState('Cliente')
  const [userInitials, setUserInitials] = useState('C')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [unreadMsgs, setUnreadMsgs] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const nome = data.user.user_metadata?.nome ?? data.user.email ?? 'Cliente'
      setUserName(nome)
      setUserInitials(nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase())

      const { data: userData } = await supabase
        .from('users').select('avatar_url').eq('id', data.user.id).maybeSingle()
      if (userData?.avatar_url) setAvatarUrl(userData.avatar_url)

      const { data: convs } = await supabase
        .from('conversas').select('id')
        .eq('participante_id', data.user.id).eq('tipo', 'cliente')
      const ids = convs?.map((c: { id: string }) => c.id) ?? []
      if (ids.length > 0) {
        const { count } = await supabase
          .from('mensagens')
          .select('id', { count: 'exact', head: true })
          .in('conversa_id', ids)
          .eq('lida', false)
          .neq('remetente_id', data.user.id)
        setUnreadMsgs(count ?? 0)
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
    <aside style={{
      width: 248, minWidth: 248, height: '100vh',
      background: '#ffffff', borderRight: '1px solid rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 40,
    }}>
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        paddingLeft: 24, gap: 10, borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <span style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.35em', color: '#007AFF' }}>ARC</span>
        <span style={{ fontSize: 9, color: '#8e8e93', letterSpacing: '0.15em', fontWeight: 500, marginTop: 3, textTransform: 'uppercase' as const }}>
          Cliente
        </span>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const showBadge = item.href === '/cliente/mensagens' && unreadMsgs > 0
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10,
              fontSize: 13.5, fontWeight: isActive ? 500 : 400, textDecoration: 'none',
              transition: 'all 0.15s ease',
              background: isActive ? 'rgba(0,122,255,0.08)' : 'transparent',
              color: isActive ? '#007AFF' : '#6b6b6b',
            }}>
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {showBadge && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#007AFF', borderRadius: 10, padding: '1px 6px', lineHeight: '16px' }}>
                  {unreadMsgs}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
          background: 'rgba(0,122,255,0.1)', border: '1.5px solid rgba(0,122,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 500, color: '#007AFF', flexShrink: 0,
        }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : userInitials
          }
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 400, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName}
          </div>
          <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 1 }}>Cliente</div>
        </div>
        <button onClick={handleLogout} title="Sair" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c7cc', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s', flexShrink: 0 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ff3b30')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#c7c7cc')}>
          <LogOut size={15} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  )
}

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f2f2f7' }}>
      <ClienteSidebar />
      <main style={{ flex: 1, marginLeft: 248, minHeight: '100vh', background: '#f2f2f7', overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}
