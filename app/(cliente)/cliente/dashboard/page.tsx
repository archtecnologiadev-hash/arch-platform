'use client'

import { useState, useEffect } from 'react'
import { StatsCard } from '@/components/shared/stats-card'

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
        <h1 className="text-3xl font-medium" style={{ color: '#1a1a1a' }}>Meu Painel</h1>
        <p className="text-muted-foreground">Acompanhe seus projetos em andamento</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Projetos Ativos" value={loading ? '—' : String(projects.length)} icon={FolderOpen} />
        <StatsCard title="Orçamentos Recebidos" value="0" description="Nenhum aguardando aprovação" icon={FileText} />
        <StatsCard title="Último Acesso" value="Hoje" icon={Clock} />
      </div>

      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>Meus Projetos</h2>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#8e8e93', fontSize: 13 }}>Carregando...</div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <FolderOpen size={40} color="#8e8e93" style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 13, color: '#8e8e93', margin: 0 }}>Nenhum projeto ainda</p>
              <p style={{ fontSize: 12, color: '#8e8e93', opacity: 0.6, margin: 0 }}>
                Seus projetos com o arquiteto aparecerão aqui
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map((project) => (
                <div key={project.id} style={{
                  background: '#f2f2f7',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 10,
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: project.etapa_atual ? 6 : 0 }}>
                    <p style={{ fontWeight: 500, fontSize: 14, color: '#1a1a1a', margin: 0 }}>{project.nome}</p>
                    <span style={{
                      fontSize: 11, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 20,
                      padding: '2px 10px', color: '#6b6b6b', background: '#ffffff',
                    }}>
                      {statusLabels[project.status] ?? statusLabels[project.etapa_atual] ?? 'Em andamento'}
                    </span>
                  </div>
                  {project.etapa_atual && (
                    <p style={{ fontSize: 12, color: '#8e8e93', margin: 0 }}>Etapa: {project.etapa_atual}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
