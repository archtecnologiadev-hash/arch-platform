'use client'

import { useState, useEffect, useRef } from 'react'
import { TicketCheck, Send, Loader2, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Ticket {
  id: number; titulo: string; mensagem: string; status: string
  created_at: string; updated_at: string
  users: { nome: string; email: string } | null
}

interface Resposta {
  id: number; mensagem: string; is_admin: boolean; created_at: string
  users: { nome: string } | null
}

const STATUS_COLOR: Record<string, string> = { aberto: '#ef4444', em_andamento: '#c8a96e', resolvido: '#34d399' }
const STATUS_LABEL: Record<string, string> = { aberto: 'Aberto', em_andamento: 'Em andamento', resolvido: 'Resolvido' }

function Badge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? '#666'
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: `${color}18`, color, border: `1px solid ${color}30`,
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [loadingResp, setLoadingResp] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => { if (data.user) setCurrentUserId(data.user.id) })
  }, [])

  async function loadTickets() {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('tickets')
      .select('id, titulo, mensagem, status, created_at, updated_at, users(nome, email)')
      .order('updated_at', { ascending: false })
    if (statusFilter) q = q.eq('status', statusFilter)
    const { data } = await q
    setTickets((data as unknown as Ticket[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadTickets() }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function openTicket(ticket: Ticket) {
    setSelected(ticket)
    setLoadingResp(true)
    setReply('')
    const supabase = createClient()
    const { data } = await supabase
      .from('ticket_respostas')
      .select('id, mensagem, is_admin, created_at, users(nome)')
      .eq('ticket_id', ticket.id)
      .order('created_at')
    setRespostas((data as unknown as Resposta[]) ?? [])
    setLoadingResp(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function sendReply() {
    if (!reply.trim() || !selected || !currentUserId) return
    setSending(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('ticket_respostas')
      .insert({ ticket_id: selected.id, user_id: currentUserId, mensagem: reply.trim(), is_admin: true })
      .select('id, mensagem, is_admin, created_at, users(nome)')
      .single()
    if (data) setRespostas(prev => [...prev, data as unknown as Resposta])
    // Update ticket status to em_andamento if still aberto
    if (selected.status === 'aberto') {
      await supabase.from('tickets').update({ status: 'em_andamento', updated_at: new Date().toISOString() }).eq('id', selected.id)
      setSelected(prev => prev ? { ...prev, status: 'em_andamento' } : null)
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'em_andamento' } : t))
    }
    setReply('')
    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function markResolved() {
    if (!selected) return
    const supabase = createClient()
    await supabase.from('tickets').update({ status: 'resolvido', updated_at: new Date().toISOString() }).eq('id', selected.id)
    setSelected(prev => prev ? { ...prev, status: 'resolvido' } : null)
    setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'resolvido' } : t))
  }

  return (
    <div style={{ padding: 32, color: '#e0e0e0', height: 'calc(100vh - 0px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <TicketCheck size={20} color="#c8a96e" /> Tickets de Suporte
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>

        {/* Ticket list */}
        <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
            background: '#0e0e0e', border: '1px solid #222', color: '#d0d0d0',
            borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none', cursor: 'pointer',
          }}>
            <option value="">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="em_andamento">Em andamento</option>
            <option value="resolvido">Resolvido</option>
          </select>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <Loader2 size={22} color="#c8a96e" style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#333', fontSize: 13, padding: '32px 0' }}>Nenhum ticket</div>
            ) : tickets.map(t => (
              <button key={t.id} onClick={() => openTicket(t)} style={{
                width: '100%', textAlign: 'left', background: selected?.id === t.id ? '#111' : '#0d0d0d',
                border: `1px solid ${selected?.id === t.id ? 'rgba(200,169,110,0.3)' : '#1c1c1c'}`,
                borderRadius: 10, padding: '13px 14px', cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { if (selected?.id !== t.id) e.currentTarget.style.borderColor = '#2a2a2a' }}
                onMouseLeave={e => { if (selected?.id !== t.id) e.currentTarget.style.borderColor = '#1c1c1c' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#d0d0d0', lineHeight: 1.3, flex: 1, marginRight: 8 }}>{t.titulo}</span>
                  <Badge status={t.status} />
                </div>
                <div style={{ fontSize: 11, color: '#444' }}>{t.users?.nome ?? 'Anônimo'} · #{t.id}</div>
                <div style={{ fontSize: 11, color: '#333', marginTop: 4 }}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket detail */}
        <div style={{ flex: 1, background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a2a2a', flexDirection: 'column', gap: 10 }}>
              <TicketCheck size={36} />
              <span style={{ fontSize: 13 }}>Selecione um ticket</span>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e0e0' }}>{selected.titulo}</div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
                    {selected.users?.nome ?? 'Anônimo'} · {selected.users?.email} · #{selected.id}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {selected.status !== 'resolvido' && (
                    <button onClick={markResolved} style={{
                      background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399',
                      borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <Check size={12} /> Resolver
                    </button>
                  )}
                  <Badge status={selected.status} />
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Original message */}
                <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '12px 14px', alignSelf: 'flex-start', maxWidth: '80%' }}>
                  <div style={{ fontSize: 10, color: '#444', marginBottom: 6, fontWeight: 700 }}>
                    {selected.users?.nome ?? 'Usuário'} · {new Date(selected.created_at).toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontSize: 13, color: '#d0d0d0', lineHeight: 1.6 }}>{selected.mensagem}</div>
                </div>

                {loadingResp ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Loader2 size={18} color="#c8a96e" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : respostas.map(r => (
                  <div key={r.id} style={{
                    background: r.is_admin ? 'rgba(200,169,110,0.08)' : '#111',
                    border: `1px solid ${r.is_admin ? 'rgba(200,169,110,0.2)' : '#1a1a1a'}`,
                    borderRadius: 10, padding: '12px 14px',
                    alignSelf: r.is_admin ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}>
                    <div style={{ fontSize: 10, color: r.is_admin ? '#c8a96e' : '#444', marginBottom: 6, fontWeight: 700 }}>
                      {r.is_admin ? '🛡 Admin' : (r.users?.nome ?? 'Usuário')} · {new Date(r.created_at).toLocaleString('pt-BR')}
                    </div>
                    <div style={{ fontSize: 13, color: '#d0d0d0', lineHeight: 1.6 }}>{r.mensagem}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply */}
              {selected.status !== 'resolvido' && (
                <div style={{ padding: '14px 20px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 10 }}>
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply() }}
                    placeholder="Responder... (Ctrl+Enter para enviar)"
                    rows={2}
                    style={{
                      flex: 1, background: '#111', border: '1px solid #222', color: '#d0d0d0',
                      borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none',
                      resize: 'none' as const, fontFamily: 'inherit',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#c8a96e')}
                    onBlur={e => (e.target.style.borderColor = '#222')}
                  />
                  <button onClick={sendReply} disabled={sending || !reply.trim()} style={{
                    background: sending || !reply.trim() ? '#111' : '#c8a96e',
                    border: 'none', borderRadius: 8, padding: '0 16px',
                    color: sending || !reply.trim() ? '#555' : '#080808',
                    cursor: sending || !reply.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700,
                  }}>
                    {sending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                    Enviar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
