import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.usearc.com.br'),
  title: {
    default: 'ARC — Plataforma de Arquitetura',
    template: '%s | ARC',
  },
  description: 'Conecte-se com os melhores escritórios de arquitetura do Brasil. Portfólios reais, profissionais verificados, sem intermediários.',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    siteName: 'ARC Plataforma de Arquitetura',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
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
