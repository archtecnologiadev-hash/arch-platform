'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import DetalhamentoProjeto from '../detalhamento'

export default function DetalhamentoPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [escritorioId, setEscritorioId] = useState<string | null>(null)
  const [nomeProjeto, setNomeProjeto] = useState<string | undefined>(undefined)
  const [nivelRank, setNivelRank] = useState(5)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    if (!projectId) return
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const [{ data: ud }, { data: proj }] = await Promise.all([
        supabase.from('users').select('nivel_permissao').eq('id', user.id).maybeSingle(),
        supabase.from('projetos').select('id, nome, escritorio_id').eq('id', projectId).single(),
      ])

      if (!proj) { setUnauthorized(true); setLoading(false); return }

      const NIVEL_RANK: Record<string, number> = { estagiario: 0, junior: 1, pleno: 2, senior: 3, admin: 4, owner: 5 }
      setNivelRank(NIVEL_RANK[ud?.nivel_permissao ?? 'owner'] ?? 5)
      setEscritorioId(proj.escritorio_id ?? null)
      setNomeProjeto(proj.nome)
      setLoading(false)
    }
    load()
  }, [projectId, router])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-3)', fontSize: 14 }}>
        Carregando...
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-3)', fontSize: 14 }}>
        Projeto não encontrado.
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Back nav */}
      <div style={{ padding: '16px 28px 0' }}>
        <Link
          href={`/arquiteto/projetos/${projectId}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13, textDecoration: 'none' }}
        >
          <ArrowLeft size={14} /> Voltar ao projeto
        </Link>
      </div>

      <div style={{ padding: '12px 28px 40px' }}>
        <DetalhamentoProjeto
          projectId={projectId}
          escritorioId={escritorioId}
          canEdit={nivelRank >= 1}
          nomeProjeto={nomeProjeto}
        />
      </div>
    </div>
  )
}
