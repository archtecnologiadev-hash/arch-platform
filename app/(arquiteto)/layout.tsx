'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, FolderOpen, Users, Calendar, Package,
  FileText, UserCircle, LogOut, MessageCircle, UsersRound, CreditCard, UserCog,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import TrialGate from '@/components/shared/TrialGate'

// Rank: higher = more privileged
const NIVEL_RANK: Record<string, number> = {
  operacional: 0, gestor: 1, owner: 2,
}
const NIVEL_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  owner:       { label: 'Owner',       bg: 'rgba(139,92,246,0.12)',  color: '#7c3aed' },
  gestor:      { label: 'Gestor',      bg: 'rgba(0,122,255,0.10)',   color: '#007AFF' },
  operacional: { label: 'Operacional', bg: 'rgba(52,211,153,0.12)',  color: '#059669' },
}
function rank(n: string) { return NIVEL_RANK[n] ?? 2 }

// minRank = minimum rank to see. maxRank = maximum rank to see.
const BASE_NAV = [
  { label: 'Dashboard',    href: '/arquiteto/dashboard',    icon: LayoutDashboard },
  { label: 'Projetos',     href: '/arquiteto/projetos',     icon: FolderOpen },
  { label: 'Clientes',     href: '/arquiteto/clientes',     icon: Users,        minRank: 1 }, // gestor+
  { label: 'Equipe',       href: '/arquiteto/equipe',       icon: UsersRound,   minRank: 2 }, // owner only
  { label: 'Calendário',   href: '/arquiteto/calendario',   icon: Calendar },
  { label: 'Fornecedores', href: '/arquiteto/fornecedores', icon: Package,      minRank: 1 }, // gestor+
  { label: 'Mensagens',    href: '/arquiteto/mensagens',    icon: MessageCircle },
  { label: 'Orçamentos',   href: '/arquiteto/orcamentos',   icon: FileText,     minRank: 1 }, // gestor+
  { label: 'Meu Perfil',   href: '/arquiteto/perfil',       icon: UserCircle,   minRank: 1 }, // gestor+
  { label: 'Planos',       href: '/arquiteto/planos',       icon: CreditCard,   minRank: 2 }, // owner only
  { label: 'Minha Conta',  href: '/arquiteto/conta',        icon: UserCog,      maxRank: 0 }, // operacional only
]

function ArquitetoSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName]         = useState('Arquiteto')
  const [userInitials, setUserInitials] = useState('A')
  const [avatarUrl, setAvatarUrl]       = useState<string | null>(null)
  const [unreadMsgs, setUnreadMsgs]     = useState(0)
  const [nivelPermissao, setNivelPermissao] = useState<string>('owner')
  const [cargoLabel, setCargoLabel]     = useState('Arquiteto')
  const [escritorioNome, setEscritorioNome] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return

      const [{ data: userData }, { data: escOwnerData }] = await Promise.all([
        supabase.from('users').select('nome, nivel_permissao, cargo, avatar_url, escritorio_vinculado_id').eq('id', data.user.id).maybeSingle(),
        supabase.from('escritorios').select('image_url, nome').eq('user_id', data.user.id).maybeSingle(),
      ])

      const nome = userData?.nome?.trim() || data.user.user_metadata?.nome || data.user.email?.split('@')[0] || 'Arquiteto'
      setUserName(nome)
      setUserInitials(nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase())

      const nivel = userData?.nivel_permissao ?? 'owner'
      setNivelPermissao(nivel)
      setCargoLabel(userData?.cargo || (nivel === 'owner' ? 'Arquiteto' : (NIVEL_BADGE[nivel]?.label ?? nivel)))

      const userRank = rank(nivel)
      if (userRank < 2) {
        // gestor/operacional: own avatar + studio name
        if (userData?.avatar_url) setAvatarUrl(userData.avatar_url)
        if (userData?.escritorio_vinculado_id) {
          const { data: escData } = await supabase
            .from('escritorios').select('nome').eq('id', userData.escritorio_vinculado_id).maybeSingle()
          if (escData?.nome) setEscritorioNome(escData.nome)
        }
      } else {
        // owner: studio cover photo takes precedence
        const avatar = escOwnerData?.image_url || userData?.avatar_url || null
        if (avatar) setAvatarUrl(avatar)
      }

      const { data: convs } = await supabase.from('conversas').select('id').eq('arquiteto_id', data.user.id)
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

  const userRank = rank(nivelPermissao)
  const badge = NIVEL_BADGE[nivelPermissao]
  const navItems = BASE_NAV.filter(item => {
    if (item.minRank !== undefined && userRank < item.minRank) return false
    if (item.maxRank !== undefined && userRank > item.maxRank) return false
    return true
  })

  return (
    <aside style={{
      width: 248, minWidth: 248, height: '100vh',
      background: '#ffffff', borderRight: '1px solid rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 40,
    }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', paddingLeft: 24, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.35em', color: '#007AFF' }}>ARC</span>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/arquiteto/dashboard' && pathname.startsWith(item.href))
          const showBadge = item.href === '/arquiteto/mensagens' && unreadMsgs > 0
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
        <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', background: 'rgba(0,122,255,0.1)', border: '1.5px solid rgba(0,122,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#007AFF', flexShrink: 0 }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : userInitials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 400, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName}
          </div>
          {badge && userRank < 2 && escritorioNome ? (
            <div style={{ fontSize: 10, marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ background: badge.bg, border: `1px solid ${badge.color}33`, borderRadius: 4, padding: '1px 5px', fontWeight: 700, color: badge.color, letterSpacing: '0.04em' }}>
                {badge.label}
              </span>
              <span style={{ color: '#8e8e93', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {escritorioNome}</span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 1 }}>{cargoLabel}</div>
          )}
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

export default function ArquitetoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f2f2f7' }}>
      <ArquitetoSidebar />
      <main style={{ flex: 1, marginLeft: 248, minHeight: '100vh', background: '#f2f2f7', overflowX: 'hidden' }}>
        <TrialGate tipo="arquiteto">
          {children}
        </TrialGate>
      </main>
    </div>
  )
}
