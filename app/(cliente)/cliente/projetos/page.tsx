'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FolderOpen, ArrowRight, MessageCircle, Clock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const STAGES = ['Atendimento', 'Reunião', 'Briefing', '3D', 'Alteração 3D', 'Detalhamento', 'Orçamento', 'Execução']
const STAGE_COLORS = ['#8b5cf6', '#007AFF', '#34d399', '#4f9cf9', '#f59e0b', '#f97316', '#ef4444', '#10b981']

interface Projeto {
  id: string
  nome: string
  etapa_atual: string | null
  tipo: string | null
  cover_url: string | null
  created_at: string
  arquiteto_user_id: string | null
  escritorio_nome: string | null
}

function stageIdx(etapa: string | null) {
  if (!etapa) return 0
  const i = STAGES.findIndex(s => s.toLowerCase() === etapa.toLowerCase())
  return i >= 0 ? i : 0
}

export default function ClienteProjetosPage() {
  const router = useRouter()
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [startingConv, setStartingConv] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      // Projects linked by user ID
      const { data: byId } = await supabase
        .from('projetos')
        .select('id, nome, etapa_atual, tipo, cover_url, created_at, escritorio_id, escritorios(nome, user_id)')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false })

      // Projects linked by email (not yet bound to a user)
      const { data: byEmail } = await supabase
        .from('projetos')
        .select('id, nome, etapa_atual, tipo, cover_url, created_at, escritorio_id, escritorios(nome, user_id)')
        .eq('email_cliente', user.email)
        .is('cliente_id', null)
        .order('created_at', { ascending: false })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapRow = (p: any): Projeto => ({
        id: p.id,
        nome: p.nome,
        etapa_atual: p.etapa_atual,
        tipo: p.tipo,
        cover_url: p.cover_url ?? null,
        created_at: p.created_at,
        arquiteto_user_id: p.escritorios?.user_id ?? null,
        escritorio_nome: p.escritorios?.nome ?? null,
      })

      const all = [...(byId ?? []).map(mapRow), ...(byEmail ?? []).map(mapRow)]
      const unique = Array.from(new Map(all.map(p => [p.id, p])).values())
      setProjetos(unique)
      setLoading(false)
    }
    load()
  }, [])

  async function handleFalarComArquiteto(p: Projeto, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!p.arquiteto_user_id || !userId || startingConv) return
    setStartingConv(p.id)
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('conversas')
      .select('id')
      .eq('arquiteto_id', p.arquiteto_user_id)
      .eq('participante_id', userId)
      .maybeSingle()
    let convId: string | null = existing?.id ?? null
    if (!convId) {
      const { data: created } = await supabase
        .from('conversas')
        .insert({ arquiteto_id: p.arquiteto_user_id, participante_id: userId, tipo: 'cliente' })
        .select('id').single()
      convId = created?.id ?? null
    }
    setStartingConv(null)
    if (convId) router.push(`/cliente/mensagens?c=${convId}`)
    else router.push('/cliente/mensagens')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={26} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Meus Projetos</h1>
        <p style={{ fontSize: 13, color: '#8e8e93', margin: '5px 0 0' }}>
          Acompanhe o andamento dos seus projetos
        </p>
      </div>

      {projetos.length === 0 ? (
        <div style={{
          background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 16, padding: '64px 32px', textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <FolderOpen size={48} color="#c7c7cc" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 17, fontWeight: 600, color: '#3a3a3c', marginBottom: 8 }}>
            Nenhum projeto ainda
          </div>
          <div style={{ fontSize: 13, color: '#8e8e93', maxWidth: 380, margin: '0 auto' }}>
            Aguardando seu arquiteto vincular você a um projeto. Você receberá acesso assim que o projeto for configurado.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projetos.map(p => {
            const idx = stageIdx(p.etapa_atual)
            const stageColor = STAGE_COLORS[idx] ?? '#007AFF'
            const progress = Math.round(((idx + 1) / STAGES.length) * 100)
            const dateStr = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

            return (
              <div
                key={p.id}
                onClick={() => router.push(`/cliente/projeto/${p.id}`)}
                style={{
                  background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,122,255,0.25)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.08)'
                }}
              >
                {/* Cover */}
                <div style={{ position: 'relative', height: 140, overflow: 'hidden', background: '#e5e5ea' }}>
                  {p.cover_url
                    ? <img src={p.cover_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8e8f0, #d4d4dc)' }}>
                        <FolderOpen size={28} color="#c7c7cc" />
                      </div>
                  }
                  {p.cover_url && (
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                  )}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    fontSize: 10, fontWeight: 700, color: stageColor,
                    background: 'rgba(255,255,255,0.92)', border: `1px solid ${stageColor}40`,
                    padding: '3px 9px', borderRadius: 20, backdropFilter: 'blur(6px)',
                  }}>
                    {STAGES[idx]}
                  </div>
                  {p.cover_url && (
                    <div style={{ position: 'absolute', bottom: 10, left: 14 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
                        {p.nome}
                      </div>
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: stageColor }} />
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '14px 16px' }}>
                  {!p.cover_url && (
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{p.nome}</div>
                  )}

                  {p.escritorio_nome && (
                    <div style={{ fontSize: 11.5, color: '#8b5cf6', fontWeight: 600, marginBottom: 6 }}>
                      {p.escritorio_nome}
                    </div>
                  )}

                  {/* Progress bar labels */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#8e8e93' }}>Progresso</span>
                      <span style={{ fontSize: 11, color: stageColor, fontWeight: 600 }}>{progress}%</span>
                    </div>
                    <div style={{ height: 4, background: '#f2f2f7', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: stageColor, borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} color="#8e8e93" />
                      <span style={{ fontSize: 11, color: '#8e8e93' }}>{dateStr}</span>
                    </div>
                    <ArrowRight size={14} color="#007AFF" />
                  </div>

                  {p.arquiteto_user_id && (
                    <button
                      onClick={e => handleFalarComArquiteto(p, e)}
                      disabled={startingConv === p.id}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '8px', background: 'rgba(0,122,255,0.07)',
                        border: '1px solid rgba(0,122,255,0.2)', borderRadius: 8,
                        color: '#007AFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <MessageCircle size={13} />
                      {startingConv === p.id ? 'Abrindo...' : 'Falar com arquiteto'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
