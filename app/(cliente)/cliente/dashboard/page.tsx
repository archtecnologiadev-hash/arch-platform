'use client'

import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, FileText, Clock } from 'lucide-react'

const myProjects = [
  { id: '1', title: 'Residência Moderna', arquiteto: 'Arq. João Silva', status: 'in_progress', progress: 65 },
  { id: '2', title: 'Reforma Cozinha', arquiteto: 'Arq. Maria Costa', status: 'review', progress: 90 },
]

const statusLabels: Record<string, string> = {
  in_progress: 'Em andamento',
  review: 'Em revisão',
  completed: 'Concluído',
  draft: 'Rascunho',
}

export default function ClienteDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Painel</h1>
        <p className="text-muted-foreground">Acompanhe seus projetos em andamento</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Projetos Ativos" value="2" icon={FolderOpen} />
        <StatsCard title="Orçamentos Recebidos" value="5" description="2 aguardando sua aprovação" icon={FileText} />
        <StatsCard title="Último Acesso" value="Hoje" description="18/04/2026 às 09:30" icon={Clock} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myProjects.map((project) => (
              <div key={project.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{project.title}</p>
                    <p className="text-sm text-muted-foreground">{project.arquiteto}</p>
                  </div>
                  <Badge variant="outline">{statusLabels[project.status]}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progresso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
