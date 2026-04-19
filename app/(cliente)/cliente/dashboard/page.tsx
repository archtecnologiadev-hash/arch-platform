'use client'

import { useState, useEffect } from 'react'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen, FileText, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Project {
  id: string
  nome: string
  status: string
  etapa_atual: string
}

const statusLabels: Record<string, string> = {
  in_progress: 'Em andamento',
  review: 'Em revisão',
  completed: 'Concluído',
  draft: 'Rascunho',
  ativo: 'Em andamento',
}

export default function ClienteDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('projetos')
        .select('id, nome, status, etapa_atual')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false })
      setProjects(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Painel</h1>
        <p className="text-muted-foreground">Acompanhe seus projetos em andamento</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Projetos Ativos" value={loading ? '—' : String(projects.length)} icon={FolderOpen} />
        <StatsCard title="Orçamentos Recebidos" value="0" description="Nenhum aguardando aprovação" icon={FileText} />
        <StatsCard title="Último Acesso" value="Hoje" icon={Clock} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum projeto ainda</p>
              <p className="text-xs text-muted-foreground/60">
                Seus projetos com o arquiteto aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{project.nome}</p>
                    <span className="text-xs border rounded-full px-2 py-0.5 text-muted-foreground">
                      {statusLabels[project.status] ?? statusLabels[project.etapa_atual] ?? 'Em andamento'}
                    </span>
                  </div>
                  {project.etapa_atual && (
                    <p className="text-xs text-muted-foreground">Etapa: {project.etapa_atual}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
