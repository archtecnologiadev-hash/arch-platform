import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const projects = [
  { id: '1', title: 'Residência Moderna', client: 'Ana Lima', budget: 85000, status: 'in_progress', date: '2026-01-15' },
  { id: '2', title: 'Escritório Corporativo', client: 'TechCorp Ltda', budget: 230000, status: 'review', date: '2026-02-01' },
  { id: '3', title: 'Apartamento Minimalista', client: 'Carlos Souza', budget: 45000, status: 'completed', date: '2025-11-20' },
  { id: '4', title: 'Casa de Campo', client: 'Família Pereira', budget: 120000, status: 'draft', date: '2026-03-10' },
]

const statusLabels: Record<string, string> = {
  in_progress: 'Em andamento',
  review: 'Em revisão',
  completed: 'Concluído',
  draft: 'Rascunho',
}

export default function ProjetosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus projetos</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-base">{project.title}</CardTitle>
              <Badge variant="outline">{statusLabels[project.status]}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Cliente: {project.client}</p>
                <p>Orçamento: R$ {project.budget.toLocaleString('pt-BR')}</p>
                <p>Criado em: {new Date(project.date).toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
