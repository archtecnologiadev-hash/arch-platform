import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const products = [
  { id: '1', name: 'Madeira de Lei Ipê', category: 'Madeira', price: 450, unit: 'm²', inStock: true },
  { id: '2', name: 'Deck Cumaru', category: 'Madeira', price: 280, unit: 'm²', inStock: true },
  { id: '3', name: 'Laminado Carvalho', category: 'Piso', price: 120, unit: 'm²', inStock: false },
  { id: '4', name: 'Rodapé MDF 10cm', category: 'Acabamento', price: 35, unit: 'ml', inStock: true },
]

export default function CatalogoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Produtos</h1>
          <p className="text-muted-foreground">Gerencie seus produtos e preços</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{product.name}</CardTitle>
              <Badge variant={product.inStock ? 'default' : 'secondary'}>
                {product.inStock ? 'Em estoque' : 'Esgotado'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline">{product.category}</Badge>
              <p className="text-2xl font-bold">
                R$ {product.price}
                <span className="text-sm font-normal text-muted-foreground">/{product.unit}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
