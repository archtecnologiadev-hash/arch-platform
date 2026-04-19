import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const clients = [
  { id: '1', name: 'Ana Lima', email: 'ana@email.com', projects: 2, status: 'active' },
  { id: '2', name: 'Carlos Souza', email: 'carlos@email.com', projects: 1, status: 'active' },
  { id: '3', name: 'TechCorp Ltda', email: 'contato@techcorp.com', projects: 3, status: 'active' },
  { id: '4', name: 'Família Pereira', email: 'pereira@email.com', projects: 1, status: 'inactive' },
]

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="space-y-3">
        {clients.map((client) => {
          const initials = client.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
          return (
            <Card key={client.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {client.projects} projeto(s)
                </div>
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
