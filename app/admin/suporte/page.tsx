'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Send, Loader2, Circle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Conv {
  id: string
  assunto: string | null
  status: string
  prioridade: string
  ultima_mensagem_em: string
  created_at: string
  user_id: string
  user_nome?: string
  user_email?: string
  unread: number
}

interface Msg {
  id: string
  texto: string
  eh_admin: boolean
  lida: boolean
  created_at: string
  remetente_id: string | null
}

const STATUS_OPTS = ['aberto', 'em_andamento', 'resolvido', 'fechado']
const PRIORIDADE_OPTS = ['baixa', 'normal', 'alta', 'urgente']

const STATUS_COLOR: Record<string, string> = {
  aberto: '#3b82f6',
  em_andamento: '#f59e0b',
  resolvido: '#10b981',
  fechado: '#6b7280',
}

const PRIO_COLOR: Record<string, string> = {
  baixa: '#6b7280',
  normal: '#3b82f6',
  alta: '#f59e0b',
  urgente: '#ef4444',
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`
  if (diff < 86400000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const QUICK = [
  'Olá! Entendemos sua solicitação e já estamos verificando.',
  'Isso será resolvido em breve. Pode aguardar!',
  'Poderia nos dar mais detalhes sobre o problema?',
  'Problema identificado e corrigido! Tente novamente.',
]

export default function AdminSuportePage() {
  const [convs, setConvs]             = useState<Conv[]>([])
  const [selected, setSelected]       = useState<Conv | null>(null)
  const [msgs, setMsgs]               = useState<Msg[]>([])
  const [text, setText]               = useState('')
  const [sending, setSending]         = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const bottomRef = useRef<HTMLDivElement>(null)
  // Stable client — must not be recreated on every render or channel cleanup breaks
  const supabase = useRef(createClient()).current

  const loadConvs = useCallback(async () => {
    setLoadingConvs(true)
    let q = supabase
      .from('suporte_conversas')
      .select('id, assunto, status, prioridade, ultima_mensagem_em, created_at, user_id')
      .order('ultima_mensagem_em', { ascending: false })

    if (filterStatus !== 'todos') q = q.eq('status', filterStatus)

    const { data } = await q

    if (!data) { setLoadingConvs(false); return }

    // Fetch user info
    const userIds = Array.from(new Set(data.map(c => c.user_id)))
    const { data: users } = await supabase
      .from('users')
      .select('id, nome, email')
      .in('id', userIds)

    // Fetch unread counts (msgs from user not read by admin — eh_admin=false AND lida=false)
    const convIds = data.map(c => c.id)
    const { data: unreadData } = await supabase
      .from('suporte_mensagens')
      .select('conversa_id')
      .in('conversa_id', convIds)
      .eq('eh_admin', false)
      .eq('lida', false)

    const unreadMap: Record<string, number> = {}
    unreadData?.forEach(m => {
      unreadMap[m.conversa_id] = (unreadMap[m.conversa_id] ?? 0) + 1
    })

    const enriched: Conv[] = data.map(c => {
      const u = users?.find(u => u.id === c.user_id)
      return { ...c, user_nome: u?.nome, user_email: u?.email, unread: unreadMap[c.id] ?? 0 }
    })

    setConvs(enriched)
    setLoadingConvs(false)
  }, [filterStatus])

  useEffect(() => { loadConvs() }, [loadConvs])

  // Realtime for new convs
  useEffect(() => {
    const channel = supabase
      .channel('admin_suporte_convs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suporte_conversas' }, () => {
        loadConvs()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadConvs])

  const loadMsgs = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
    const { data } = await supabase
      .from('suporte_mensagens')
      .select('id, texto, eh_admin, lida, created_at, remetente_id')
      .eq('conversa_id', convId)
      .order('created_at', { ascending: true })
    setMsgs(data ?? [])
    setLoadingMsgs(false)
    // Mark user messages as read
    const unreadIds = (data ?? []).filter(m => !m.eh_admin && !m.lida).map(m => m.id)
    if (unreadIds.length > 0) {
      await supabase.from('suporte_mensagens').update({ lida: true }).in('id', unreadIds)
      setConvs(prev => prev.map(c => c.id === convId ? { ...c, unread: 0 } : c))
    }
  }, [])

  // Realtime for messages in selected conv
  useEffect(() => {
    if (!selected) return
    console.log('[admin-suporte] subscribing conv:', selected.id)
    const channel = supabase
      .channel(`admin-suporte-msgs-${selected.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'suporte_mensagens', filter: `conversa_id=eq.${selected.id}` },
        async (payload) => {
          console.log('[admin-suporte] msg recebida:', payload.new)
          const newMsg = payload.new as Msg
          setMsgs(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
          if (!newMsg.eh_admin) {
            await supabase.from('suporte_mensagens').update({ lida: true }).eq('id', newMsg.id)
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`[admin-suporte] canal status: ${status}`, err ?? '')
        if (status === 'CHANNEL_ERROR') {
          console.error('[admin-suporte] ❌ CHANNEL_ERROR — verifique RLS e REPLICA IDENTITY FULL')
        }
        if (status === 'TIMED_OUT') {
          console.error('[admin-suporte] ❌ TIMED_OUT — verifique se a tabela está na publicação supabase_realtime')
        }
      })
    return () => {
      console.log('[admin-suporte] removendo canal')
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  function selectConv(c: Conv) {
    setSelected(c)
    loadMsgs(c.id)
    setText('')
  }

  async function sendMsg(content?: string) {
    const txt = (content ?? text).trim()
    if (!txt || !selected || sending) return
    console.log(`[admin-suporte] ▶ enviando | conv=${selected.id}`)
    setSending(true)
    setText('')

    const tempId = `temp-${Date.now()}`
    const tempMsg: Msg = { id: tempId, texto: txt, eh_admin: true, lida: false, created_at: new Date().toISOString(), remetente_id: null }
    setMsgs(prev => [...prev, tempMsg])

    const { data, error } = await supabase
      .from('suporte_mensagens')
      .insert({ conversa_id: selected.id, texto: txt, eh_admin: true, lida: false })
      .select('id, texto, eh_admin, lida, created_at, remetente_id')
      .single()
    console.log(`[admin-suporte] insert result | data=${data?.id} | error=${error?.message}`)

    setMsgs(prev => {
      if (data) {
        const hasReal = prev.some(m => m.id === data.id)
        return hasReal ? prev.filter(m => m.id !== tempId) : prev.map(m => m.id === tempId ? data : m)
      }
      return prev.filter(m => m.id !== tempId)
    })

    await supabase.from('suporte_conversas').update({
      ultima_mensagem_em: new Date().toISOString(),
      status: selected.status === 'aberto' ? 'em_andamento' : selected.status,
    }).eq('id', selected.id)
    if (selected.status === 'aberto') {
      setSelected(prev => prev ? { ...prev, status: 'em_andamento' } : prev)
      setConvs(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'em_andamento' } : c))
    }
    setSending(false)
  }

  async function updateStatus(status: string) {
    if (!selected) return
    await supabase.from('suporte_conversas').update({ status }).eq('id', selected.id)
    setSelected(prev => prev ? { ...prev, status } : prev)
    setConvs(prev => prev.map(c => c.id === selected.id ? { ...c, status } : c))
  }

  async function updatePrioridade(prioridade: string) {
    if (!selected) return
    await supabase.from('suporte_conversas').update({ prioridade }).eq('id', selected.id)
    setSelected(prev => prev ? { ...prev, prioridade } : prev)
    setConvs(prev => prev.map(c => c.id === selected.id ? { ...c, prioridade } : c))
  }

  const isResolved = selected?.status === 'resolvido' || selected?.status === 'fechado'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)', flexShrink: 0,
      }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Suporte</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>
            {convs.length} conversa{convs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer',
            }}
          >
            <option value="todos">Todos</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button
            onClick={loadConvs}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 8,
              padding: '5px 8px', cursor: 'pointer', color: 'var(--text-2)',
              display: 'flex', alignItems: 'center',
            }}
            title="Atualizar"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Conversations list */}
        <div style={{
          width: 300, minWidth: 300, borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--bg-card)',
        }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConvs && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <Loader2 size={20} style={{ color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
              </div>
            )}
            {!loadingConvs && convs.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                Nenhuma conversa
              </div>
            )}
            {convs.map(c => (
              <button
                key={c.id}
                onClick={() => selectConv(c)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px',
                  background: selected?.id === c.id ? 'var(--nav-active-bg)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.unread > 0 && (
                        <span style={{
                          minWidth: 16, height: 16, background: 'var(--accent)', color: '#fff',
                          fontSize: 9, fontWeight: 700, borderRadius: 8, padding: '0 4px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {c.unread}
                        </span>
                      )}
                      <span style={{
                        fontSize: 13, fontWeight: c.unread > 0 ? 600 : 400,
                        color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {c.user_nome || c.user_email || 'Usuário'}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 11, color: 'var(--text-3)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {c.assunto || 'Sem assunto'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{fmtTime(c.ultima_mensagem_em)}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                      background: STATUS_COLOR[c.status] + '20',
                      color: STATUS_COLOR[c.status],
                      textTransform: 'capitalize',
                    }}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 14 }}>
            Selecione uma conversa
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Conv header */}
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid var(--border)',
              background: 'var(--bg-card)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>
                  {selected.user_nome || selected.user_email || 'Usuário'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                  {selected.assunto || 'Sem assunto'} · {new Date(selected.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Circle size={8} fill={PRIO_COLOR[selected.prioridade]} color={PRIO_COLOR[selected.prioridade]} />
                  <select
                    value={selected.prioridade}
                    onChange={e => updatePrioridade(e.target.value)}
                    style={{
                      padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)',
                      background: 'var(--bg)', color: 'var(--text)', fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    {PRIORIDADE_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <select
                  value={selected.status}
                  onChange={e => updateStatus(e.target.value)}
                  style={{
                    padding: '4px 8px', borderRadius: 6,
                    border: `1px solid ${STATUS_COLOR[selected.status]}`,
                    background: STATUS_COLOR[selected.status] + '15',
                    color: STATUS_COLOR[selected.status],
                    fontSize: 11, cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loadingMsgs && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <Loader2 size={20} style={{ color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
                </div>
              )}
              {msgs.map(m => (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.eh_admin ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: m.eh_admin ? 'var(--accent)' : 'var(--bg-card)',
                    color: m.eh_admin ? '#fff' : 'var(--text)',
                    border: m.eh_admin ? 'none' : '1px solid var(--border)',
                    borderRadius: 12,
                    borderBottomRightRadius: m.eh_admin ? 4 : 12,
                    borderBottomLeftRadius: m.eh_admin ? 12 : 4,
                    padding: '8px 12px', fontSize: 13, maxWidth: '70%', lineHeight: 1.5,
                    wordBreak: 'break-word',
                  }}>
                    {m.texto}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>
                    {m.eh_admin ? 'Admin · ' : ''}{fmtFull(m.created_at)}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            {!isResolved && (
              <div style={{
                padding: '0 20px 8px',
                display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0,
              }}>
                {QUICK.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMsg(q)}
                    style={{
                      padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)',
                      background: 'var(--bg)', color: 'var(--text-2)', fontSize: 11, cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)' }}
                  >
                    {q.length > 40 ? q.slice(0, 38) + '…' : q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            {!isResolved ? (
              <div style={{
                padding: '10px 16px', borderTop: '1px solid var(--border-subtle)',
                display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
                background: 'var(--bg-card)',
              }}>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                  placeholder="Responder ao usuário..."
                  rows={1}
                  style={{
                    flex: 1, resize: 'none', border: '1px solid var(--border)', borderRadius: 10,
                    padding: '8px 10px', fontSize: 13, background: 'var(--bg)', color: 'var(--text)',
                    outline: 'none', lineHeight: 1.5, maxHeight: 100, overflowY: 'auto',
                    fontFamily: 'inherit',
                  }}
                  onInput={e => {
                    const el = e.currentTarget
                    el.style.height = 'auto'
                    el.style.height = Math.min(el.scrollHeight, 100) + 'px'
                  }}
                />
                <button
                  onClick={() => sendMsg()}
                  disabled={!text.trim() || sending}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', border: 'none',
                    background: text.trim() ? 'var(--accent)' : 'var(--border)',
                    color: text.trim() ? '#fff' : 'var(--text-3)',
                    cursor: text.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s',
                  }}
                >
                  {sending
                    ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Send size={16} />}
                </button>
              </div>
            ) : (
              <div style={{
                padding: '12px 16px', borderTop: '1px solid var(--border-subtle)',
                fontSize: 12, color: 'var(--text-3)', textAlign: 'center', flexShrink: 0,
                background: 'var(--bg-card)',
              }}>
                Conversa encerrada
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
