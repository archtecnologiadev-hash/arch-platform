'use client'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { LayoutDashboard, FolderOpen, FileText } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/cliente/dashboard', icon: LayoutDashboard },
  { label: 'Meus Projetos', href: '/cliente/projetos', icon: FolderOpen },
  { label: 'Orçamentos', href: '/cliente/orcamentos', icon: FileText },
]

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={navItems} title="Cliente" userRole="cliente" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName="Ana Lima" userEmail="ana@email.com" />
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  )
}
