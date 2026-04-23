import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const projects = [
  { id: '1', title: 'Residência Moderna', arquiteto: 'Arq. João Silva', status: 'in_progress', budget: 85000 },
  { id: '2', title: 'Reforma Cozinha', arquiteto: 'Arq. Maria Costa', status: 'review', budget: 15000 },
]

const statusLabels: Record<string, string> = {
  in_progress: 'Em andamento',
  review: 'Em revisão',
  completed: 'Concluído',
}

export default function ClienteProjetosPage() {
  return (
    <div className="space-y-6" style={{ padding: '28px 32px' }}>
      <div>
        <h1 className="text-3xl font-bold">Meus Projetos</h1>
        <p className="text-muted-foreground">Acompanhe o andamento dos seus projetos</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-base">{project.title}</CardTitle>
              <Badge variant="outline">{statusLabels[project.status]}</Badge>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Arquiteto: {project.arquiteto}</p>
              <p>Orçamento: R$ {project.budget.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
