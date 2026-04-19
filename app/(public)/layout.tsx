import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Arch Platform
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/sobre" className="text-sm text-muted-foreground hover:text-foreground">Sobre</Link>
            <Link href="/contato" className="text-sm text-muted-foreground hover:text-foreground">Contato</Link>
            <Button variant="outline" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/cadastro">Cadastrar</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2026 Arch Platform. Todos os direitos reservados.
      </footer>
    </div>
  )
}
