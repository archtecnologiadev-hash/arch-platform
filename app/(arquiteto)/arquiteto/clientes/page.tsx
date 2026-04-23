'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Search, Loader2, Mail, FolderOpen, ArrowRight, UserPlus, X, CheckCircle2 } from 'lucide-react'
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
  avatar_url: string | null
  projeto_nome: string
  projeto_id: string
  etapa_atual: string | null
}

interface Projeto {
  id: string
  nome: string
}

export default function ClientesPage() {
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [search, setSearch] = useState('')
  const [projetos, setProjetos] = useState<Projeto[]>([])

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteNome, setInviteNome] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteProjetoId, setInviteProjetoId] = useState('')
  const [inviteSaving, setInviteSaving] = useState(false)
  const [inviteDone, setInviteDone] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
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
      .order('created_at', { ascending: false })

    const allProjs = (projs ?? []) as Array<{ id: string; nome: string; cliente_id: string | null; etapa_atual: string | null }>
    setProjetos(allProjs.map(p => ({ id: p.id, nome: p.nome })))

    const withClients = allProjs.filter(p => p.cliente_id != null)
    if (withClients.length === 0) { setLoading(false); return }

    const clientIds = Array.from(new Set(withClients.map(p => p.cliente_id as string)))
    const { data: usersData } = await supabase
      .from('users').select('id, nome, email, avatar_url').in('id', clientIds)

    const userMap: Record<string, { nome: string; email: string; avatar_url: string | null }> = {}
    for (const u of (usersData ?? [])) {
      const row = u as { id: string; nome: string; email: string; avatar_url: string | null }
      userMap[row.id] = { nome: row.nome, email: row.email, avatar_url: row.avatar_url }
    }

    setClientes(withClients.map(p => ({
      cliente_id: p.cliente_id as string,
      nome: userMap[p.cliente_id as string]?.nome ?? 'Desconhecido',
      email: userMap[p.cliente_id as string]?.email ?? '—',
      avatar_url: userMap[p.cliente_id as string]?.avatar_url ?? null,
      projeto_nome: p.nome,
      projeto_id: p.id,
      etapa_atual: p.etapa_atual,
    })))
    setLoading(false)
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteProjetoId) return
    setInviteSaving(true)
    const supabase = createClient()
    await supabase.from('projetos')
      .update({ email_cliente: inviteEmail.trim() })
      .eq('id', inviteProjetoId)
    setInviteSaving(false)
    setInviteDone(true)
    setTimeout(() => {
      setInviteOpen(false)
      setInviteDone(false)
      setInviteNome('')
      setInviteEmail('')
      setInviteProjetoId('')
      load()
    }, 2000)
  }

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.projeto_nome.toLowerCase().includes(search.toLowerCase())
  )

  function Av({ nome, url }: { nome: string; url: string | null }) {
    return (
      <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'rgba(0,122,255,0.08)', border: '1.5px solid rgba(0,122,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#007AFF', flexShrink: 0 }}>
        {url
          ? <img src={url} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : nome.slice(0, 1).toUpperCase()
        }
      </div>
    )
  }

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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '8px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Search size={14} color="#8e8e93" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou email..."
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#1a1a1a', background: 'transparent', width: 200, fontFamily: 'inherit' }} />
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#007AFF', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <UserPlus size={15} /> Convidar Cliente
          </button>
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
            {search ? 'Tente outro termo.' : 'Use o botão "Convidar Cliente" para adicionar um cliente a um projeto.'}
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
                <div key={`${c.cliente_id}-${c.projeto_id}`}
                  style={{ padding: '16px 22px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: 16, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9f9fb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <Av nome={c.nome} url={c.avatar_url} />
                  <div style={{ flex: '0 0 200px', minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{c.nome}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b6b6b' }}>
                      <Mail size={11} color="#8e8e93" />
                      <a href={`mailto:${c.email}`} style={{ color: '#007AFF', textDecoration: 'none' }}>{c.email}</a>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FolderOpen size={12} color="#8e8e93" />
                      <span style={{ fontSize: 13, color: '#6b6b6b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.projeto_nome}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {etapaLabel ? (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: etapaColor, background: `${etapaColor}14`, border: `1px solid ${etapaColor}30`, padding: '3px 10px', borderRadius: 20 }}>
                        {etapaLabel}
                      </span>
                    ) : <span style={{ fontSize: 12, color: '#8e8e93' }}>—</span>}
                  </div>
                  <Link href={`/arquiteto/projetos/${c.projeto_id}`} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#007AFF', textDecoration: 'none', background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.18)', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                    Ver projeto <ArrowRight size={12} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>Convidar Cliente</div>
              <button onClick={() => { setInviteOpen(false); setInviteNome(''); setInviteEmail(''); setInviteProjetoId(''); setInviteDone(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {inviteDone ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={40} color="#34d399" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>Convite registrado!</div>
                <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 6 }}>
                  O email {inviteEmail} foi vinculado ao projeto.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>Nome (opcional)</label>
                  <input value={inviteNome} onChange={e => setInviteNome(e.target.value)} placeholder="Nome do cliente"
                    style={{ width: '100%', padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>E-mail *</label>
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="cliente@email.com"
                    style={{ width: '100%', padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>Projeto para vincular *</label>
                  <select value={inviteProjetoId} onChange={e => setInviteProjetoId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, fontSize: 13, color: inviteProjetoId ? '#1a1a1a' : '#8e8e93', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}>
                    <option value="">Selecione um projeto</option>
                    {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button onClick={() => { setInviteOpen(false); setInviteNome(''); setInviteEmail(''); setInviteProjetoId('') }}
                    style={{ flex: 1, padding: '10px', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#6b6b6b', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={handleInvite} disabled={inviteSaving || !inviteEmail.trim() || !inviteProjetoId}
                    style={{ flex: 1, padding: '10px', background: '#007AFF', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#fff', cursor: inviteSaving || !inviteEmail.trim() || !inviteProjetoId ? 'not-allowed' : 'pointer', opacity: inviteSaving || !inviteEmail.trim() || !inviteProjetoId ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {inviteSaving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : 'Vincular ao projeto'}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#8e8e93', margin: 0, textAlign: 'center' }}>
                  O cliente terá acesso ao projeto ao fazer login com este e-mail.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
