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
        <p>© 2026 ARC Tecnologia. Todos os direitos reservados.</p>
        <div className="mt-3 flex justify-center gap-5">
          <a href="/sobre" className="text-xs text-muted-foreground hover:text-foreground">Sobre</a>
          <a href="/termos-de-uso" className="text-xs text-muted-foreground hover:text-foreground">Termos de Uso</a>
          <a href="/privacidade" className="text-xs text-muted-foreground hover:text-foreground">Privacidade</a>
          <a href="mailto:contato@usearc.com.br" className="text-xs text-muted-foreground hover:text-foreground">Contato</a>
        </div>
      </footer>
    </div>
  )
}
