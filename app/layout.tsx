import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ARC — Plataforma de Arquitetura',
  description: 'Conectando arquitetos, clientes e fornecedores em um único ambiente digital.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
