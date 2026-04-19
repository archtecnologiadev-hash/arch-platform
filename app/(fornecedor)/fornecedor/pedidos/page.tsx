import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const orders = [
  { id: '1', project: 'Residência Moderna', arquiteto: 'Arq. João Silva', items: 3, total: 12500, status: 'pending', date: '2026-04-15' },
  { id: '2', project: 'Casa de Praia', arquiteto: 'Arq. Lucia Barros', items: 2, total: 8200, status: 'approved', date: '2026-04-10' },
  { id: '3', project: 'Loft Industrial', arquiteto: 'Arq. Pedro Nunes', items: 5, total: 21800, status: 'delivered', date: '2026-03-28' },
]

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  delivered: 'Entregue',
}

export default function PedidosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie os pedidos recebidos</p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{order.project}</CardTitle>
              <Badge variant={order.status === 'delivered' ? 'default' : 'outline'}>
                {statusLabels[order.status]}
              </Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{order.arquiteto}</p>
                <p>{order.items} itens · {new Date(order.date).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">R$ {order.total.toLocaleString('pt-BR')}</p>
                {order.status === 'pending' && (
                  <Button size="sm">Confirmar</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
