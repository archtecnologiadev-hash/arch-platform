import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ContatoPage() {
  return (
    <div className="container mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Fale conosco</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input id="subject" placeholder="Como podemos ajudar?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <textarea
              id="message"
              rows={5}
              placeholder="Descreva sua dúvida ou sugestão..."
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Button className="w-full">Enviar mensagem</Button>
        </CardContent>
      </Card>
    </div>
  )
}
