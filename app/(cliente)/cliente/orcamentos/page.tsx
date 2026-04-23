import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const quotes = [
  { id: '1', project: 'Residência Moderna', fornecedor: 'Madeiras Silva', total: 12500, status: 'pending' },
  { id: '2', project: 'Residência Moderna', fornecedor: 'Cerâmicas Norte', total: 8900, status: 'pending' },
  { id: '3', project: 'Reforma Cozinha', fornecedor: 'Móveis Premium', total: 6800, status: 'approved' },
]

const statusLabels: Record<string, string> = {
  pending: 'Aguardando aprovação',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
}

export default function ClienteOrcamentosPage() {
  return (
    <div className="space-y-6" style={{ padding: '28px 32px' }}>
      <div>
        <h1 className="text-3xl font-bold">Orçamentos</h1>
        <p className="text-muted-foreground">Analise e aprove os orçamentos dos fornecedores</p>
      </div>
      <div className="space-y-3">
        {quotes.map((quote) => (
          <Card key={quote.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{quote.project}</CardTitle>
              <Badge variant={quote.status === 'approved' ? 'default' : 'outline'}>
                {statusLabels[quote.status]}
              </Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Fornecedor: {quote.fornecedor}</p>
              <div className="flex items-center gap-3">
                <p className="font-semibold">R$ {quote.total.toLocaleString('pt-BR')}</p>
                {quote.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Recusar</Button>
                    <Button size="sm">Aprovar</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
