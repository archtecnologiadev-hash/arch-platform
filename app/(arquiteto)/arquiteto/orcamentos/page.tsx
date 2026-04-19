import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const quotes = [
  { id: '1', project: 'Residência Moderna', fornecedor: 'Madeiras Silva', total: 12500, status: 'pending' },
  { id: '2', project: 'Escritório Corporativo', fornecedor: 'Móveis Premium', total: 85000, status: 'approved' },
  { id: '3', project: 'Apartamento Minimalista', fornecedor: 'Acabamentos Arte', total: 8700, status: 'rejected' },
]

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
}

export default function OrcamentosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">Controle os orçamentos dos projetos</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Solicitar Orçamento
        </Button>
      </div>

      <div className="space-y-3">
        {quotes.map((quote) => (
          <Card key={quote.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{quote.project}</CardTitle>
              <Badge variant="outline">{statusLabels[quote.status]}</Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Fornecedor: {quote.fornecedor}</p>
              <p className="font-semibold">R$ {quote.total.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
