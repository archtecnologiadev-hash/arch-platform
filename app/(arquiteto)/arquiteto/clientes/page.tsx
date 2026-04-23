'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Search, Loader2, Mail, FolderOpen, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const ETAPA_LABEL: Record<string, string> = {
  atendimento: 'Atendimento', reuniao: 'Reunião', briefing: 'Briefing',
  '3d': '3D', alt_3d: 'Alt. 3D', detalhamento: 'Detalhamento',
  orcamento: 'Orçamento', execucao: 'Execução',
}

const ETAPA_COLOR: Record<string, string> = {
  atendimento: '#8b5cf6', reuniao: '#007AFF', briefing: '#34d399',
  '3d': '#4f9cf9', alt_3d: '#f59e0b', detalhamento: '#f97316',
  orcamento: '#ef4444', execucao: '#10b981',
}

interface ClienteRow {
  cliente_id: string
  nome: string
  email: string
  projeto_nome: string
  projeto_id: string
  etapa_atual: string | null
}

export default function ClientesPage() {
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: escritorio } = await supabase
        .from('escritorios').select('id').eq('user_id', user.id).maybeSingle()
      if (!escritorio) { setLoading(false); return }

      const { data: projs } = await supabase
        .from('projetos')
        .select('id, nome, cliente_id, etapa_atual')
        .eq('escritorio_id', escritorio.id)
        .not('cliente_id', 'is', null)
        .order('created_at', { ascending: false })

      if (!projs || projs.length === 0) { setLoading(false); return }

      const clientIds = Array.from(new Set(projs.map((p: Record<string, unknown>) => p.cliente_id as string)))
      const { data: usersData } = await supabase.from('users').select('id, nome, email').in('id', clientIds)

      const userMap: Record<string, { nome: string; email: string }> = {}
      for (const u of (usersData ?? [])) {
        const row = u as { id: string; nome: string; email: string }
        userMap[row.id] = { nome: row.nome, email: row.email }
      }

      setClientes(projs.map((p: Record<string, unknown>) => ({
        cliente_id: p.cliente_id as string,
        nome: userMap[p.cliente_id as string]?.nome ?? 'Desconhecido',
        email: userMap[p.cliente_id as string]?.email ?? '—',
        projeto_nome: p.nome as string,
        projeto_id: p.id as string,
        etapa_atual: (p.etapa_atual as string | null),
      })))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.projeto_nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#f2f2f7', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={20} color="#007AFF" /> Clientes
          </h1>
          <p style={{ fontSize: 13, color: '#6b6b6b', margin: '5px 0 0' }}>Clientes vinculados aos seus projetos</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '8px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <Search size={14} color="#8e8e93" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            style={{ border: 'none', outline: 'none', fontSize: 13, color: '#1a1a1a', background: 'transparent', width: 220, fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={26} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '64px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Users size={40} color="#c7c7cc" style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 6 }}>
            {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente vinculado ainda.'}
          </p>
          <p style={{ fontSize: 12, color: '#8e8e93' }}>
            {search ? 'Tente outro termo.' : 'Adicione o email do cliente ao criar um projeto.'}
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ padding: '13px 22px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div>
            {filtered.map((c, i) => {
              const etapa = c.etapa_atual ?? ''
              const etapaLabel = ETAPA_LABEL[etapa] ?? etapa
              const etapaColor = ETAPA_COLOR[etapa] ?? '#8e8e93'
              return (
                <div key={`${c.cliente_id}-${c.projeto_id}`} style={{ padding: '16px 22px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: 16, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9f9fb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,122,255,0.08)', border: '1.5px solid rgba(0,122,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#007AFF', flexShrink: 0 }}>
                    {c.nome.slice(0, 1).toUpperCase()}
                  </div>
                  {/* Name + email */}
                  <div style={{ flex: '0 0 200px', minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{c.nome}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b6b6b' }}>
                      <Mail size={11} color="#8e8e93" />
                      <a href={`mailto:${c.email}`} style={{ color: '#007AFF', textDecoration: 'none' }}>{c.email}</a>
                    </div>
                  </div>
                  {/* Project */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FolderOpen size={12} color="#8e8e93" />
                      <span style={{ fontSize: 13, color: '#6b6b6b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.projeto_nome}</span>
                    </div>
                  </div>
                  {/* Stage */}
                  <div style={{ flexShrink: 0 }}>
                    {etapaLabel ? (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: etapaColor, background: `${etapaColor}14`, border: `1px solid ${etapaColor}30`, padding: '3px 10px', borderRadius: 20 }}>
                        {etapaLabel}
                      </span>
                    ) : <span style={{ fontSize: 12, color: '#8e8e93' }}>—</span>}
                  </div>
                  {/* Link */}
                  <Link href={`/arquiteto/projetos/${c.projeto_id}`} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#007AFF', textDecoration: 'none', background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.18)', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                    Ver projeto <ArrowRight size={12} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
