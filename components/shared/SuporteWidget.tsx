'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle, X, Send, ChevronDown, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Msg {
  id: string
  conteudo: string
  is_admin: boolean
  lida: boolean
  created_at: string
}

interface Conv {
  id: string
  assunto: string | null
  status: string
}

const QUICK_REPLIES = [
  'Preciso de ajuda com minha conta',
  'Tenho uma dúvida sobre o sistema',
  'Encontrei um problema técnico',
  'Quero saber sobre planos',
]

const WELCOME = 'Olá! 👋 Como posso ajudar você hoje? Nossa equipe responde em até 24h úteis.'

export default function SuporteWidget() {
  const [open, setOpen]         = useState(false)
  const [conv, setConv]         = useState<Conv | null>(null)
  const [msgs, setMsgs]         = useState<Msg[]>([])
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [unread, setUnread]     = useState(0)
  const [userId, setUserId]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [subject, setSubject]   = useState('')
  const [showSubject, setShowSubject] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const supabase  = createClient()

  // Load user
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
    })
  }, [])

  const loadConv = useCallback(async (uid: string) => {
    setLoading(true)
    const { data: convData } = await supabase
      .from('suporte_conversas')
      .select('id, assunto, status')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (convData) {
      setConv(convData)
      const { data: msgData } = await supabase
        .from('suporte_mensagens')
        .select('id, conteudo, is_admin, lida, created_at')
        .eq('conversa_id', convData.id)
        .order('created_at', { ascending: true })
      setMsgs(msgData ?? [])
      // mark admin msgs as read
      const unreadIds = (msgData ?? []).filter(m => m.is_admin && !m.lida).map(m => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('suporte_mensagens').update({ lida: true }).in('id', unreadIds)
        setUnread(0)
      }
    }
    setLoading(false)
  }, [])

  // Poll unread count when widget is closed
  useEffect(() => {
    if (!userId || open) return
    const check = async () => {
      const { data: convData } = await supabase
        .from('suporte_conversas')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      if (!convData) return
      const { count } = await supabase
        .from('suporte_mensagens')
        .select('id', { count: 'exact', head: true })
        .eq('conversa_id', convData.id)
        .eq('is_admin', true)
        .eq('lida', false)
      setUnread(count ?? 0)
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [userId, open])

  // Open panel
  const handleOpen = useCallback(async () => {
    setOpen(true)
    if (!userId) return
    await loadConv(userId)
  }, [userId, loadConv])

  // Realtime subscription
  useEffect(() => {
    if (!open || !conv) return
    const channel = supabase
      .channel(`suporte_msgs_${conv.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'suporte_mensagens', filter: `conversa_id=eq.${conv.id}` },
        async (payload) => {
          const newMsg = payload.new as Msg
          setMsgs(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          if (newMsg.is_admin) {
            await supabase.from('suporte_mensagens').update({ lida: true }).eq('id', newMsg.id)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [open, conv?.id])

  // Scroll to bottom on new msgs
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, open])

  async function createConvAndSend(content: string) {
    if (!userId) return
    setSending(true)
    const assunto = subject.trim() || content.slice(0, 60)
    const { data: newConv } = await supabase
      .from('suporte_conversas')
      .insert({ user_id: userId, assunto })
      .select('id, assunto, status')
      .single()
    if (!newConv) { setSending(false); return }
    setConv(newConv)
    // Insert welcome message from admin side
    await supabase.from('suporte_mensagens').insert({
      conversa_id: newConv.id,
      conteudo: WELCOME,
      is_admin: true,
      lida: false,
    })
    // Insert user message
    await supabase
      .from('suporte_mensagens')
      .insert({ conversa_id: newConv.id, remetente_id: userId, conteudo: content, is_admin: false, lida: false })
    // Update ultima_mensagem_em
    await supabase.from('suporte_conversas').update({ ultima_mensagem_em: new Date().toISOString() }).eq('id', newConv.id)
    // Load full messages
    const { data: msgData } = await supabase
      .from('suporte_mensagens')
      .select('id, conteudo, is_admin, lida, created_at')
      .eq('conversa_id', newConv.id)
      .order('created_at', { ascending: true })
    setMsgs(msgData ?? [])
    setText('')
    setSubject('')
    setShowSubject(false)
    setSending(false)
  }

  async function sendMsg(content?: string) {
    const txt = (content ?? text).trim()
    if (!txt || sending) return
    if (!conv) {
      await createConvAndSend(txt)
      return
    }
    setSending(true)
    setText('')

    const tempId = `temp-${Date.now()}`
    const tempMsg: Msg = { id: tempId, conteudo: txt, is_admin: false, lida: false, created_at: new Date().toISOString() }
    setMsgs(prev => [...prev, tempMsg])

    const { data } = await supabase
      .from('suporte_mensagens')
      .insert({ conversa_id: conv.id, remetente_id: userId, conteudo: txt, is_admin: false, lida: false })
      .select('id, conteudo, is_admin, lida, created_at')
      .single()

    setMsgs(prev => {
      if (data) {
        const hasReal = prev.some(m => m.id === data.id)
        return hasReal ? prev.filter(m => m.id !== tempId) : prev.map(m => m.id === tempId ? data : m)
      }
      return prev.filter(m => m.id !== tempId)
    })

    await supabase.from('suporte_conversas').update({ ultima_mensagem_em: new Date().toISOString() }).eq('id', conv.id)
    setSending(false)
    inputRef.current?.focus()
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const isResolved = conv?.status === 'resolvido' || conv?.status === 'fechado'

  return (
    <>
      {/* Floating button */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
            borderRadius: 10, padding: '2px 5px', lineHeight: '14px',
            border: '2px solid var(--bg)', zIndex: 1,
          }}>
            {unread}
          </span>
        )}
        <button
          onClick={open ? () => setOpen(false) : handleOpen}
          aria-label={open ? 'Fechar suporte' : 'Abrir suporte'}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            color: 'var(--accent-text)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        >
          {open ? <ChevronDown size={22} /> : <MessageCircle size={22} />}
        </button>
      </div>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 9998,
          width: 360, maxWidth: 'calc(100vw - 32px)',
          height: 520, maxHeight: 'calc(100vh - 120px)',
          background: 'var(--bg-card)', borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent-text)' }}>Suporte ARC</div>
              <div style={{ fontSize: 11, color: 'var(--accent-text)', opacity: 0.7, marginTop: 2 }}>
                {isResolved ? 'Conversa encerrada' : 'Respondemos em até 24h úteis'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-text)', display: 'flex', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <Loader2 size={20} style={{ color: 'var(--text-3)', animation: 'spin 1s linear infinite' }} />
              </div>
            )}

            {!loading && msgs.length === 0 && !conv && (
              <>
                <div style={{
                  background: 'var(--bg)', borderRadius: 12, borderBottomLeftRadius: 4,
                  padding: '10px 12px', fontSize: 13, color: 'var(--text)', maxWidth: '85%', lineHeight: 1.5,
                }}>
                  {WELCOME}
                </div>
                {/* Quick replies */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {QUICK_REPLIES.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMsg(q)}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 20, padding: '6px 14px', fontSize: 12, color: 'var(--accent)',
                        cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-soft)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}

            {msgs.map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.is_admin ? 'flex-start' : 'flex-end',
                }}
              >
                <div style={{
                  background: m.is_admin ? 'var(--bg)' : 'var(--accent)',
                  color: m.is_admin ? 'var(--text)' : '#fff',
                  borderRadius: 12,
                  borderBottomLeftRadius: m.is_admin ? 4 : 12,
                  borderBottomRightRadius: m.is_admin ? 12 : 4,
                  padding: '8px 12px', fontSize: 13, maxWidth: '85%', lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {m.conteudo}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>
                  {fmtTime(m.created_at)}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Subject field (only for first message) */}
          {!conv && showSubject && (
            <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Assunto (opcional)"
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 12,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Input area */}
          {!isResolved && (
            <div style={{
              padding: '10px 12px', borderTop: '1px solid var(--border-subtle)',
              display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
            }}>
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => { setText(e.target.value); if (!conv && !showSubject && e.target.value.length > 10) setShowSubject(true) }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                placeholder="Digite sua mensagem..."
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: '1px solid var(--border)', borderRadius: 10,
                  padding: '8px 10px', fontSize: 13, background: 'var(--bg)', color: 'var(--text)',
                  outline: 'none', lineHeight: 1.5, maxHeight: 80, overflowY: 'auto',
                  fontFamily: 'inherit',
                }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 80) + 'px'
                }}
              />
              <button
                onClick={() => sendMsg()}
                disabled={!text.trim() || sending}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none',
                  background: text.trim() ? 'var(--accent)' : 'var(--border)',
                  color: text.trim() ? 'var(--accent-text)' : 'var(--text-3)',
                  cursor: text.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}
              >
                {sending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
              </button>
            </div>
          )}

          {isResolved && (
            <div style={{
              padding: '10px 14px', borderTop: '1px solid var(--border-subtle)',
              fontSize: 12, color: 'var(--text-3)', textAlign: 'center', flexShrink: 0,
            }}>
              Esta conversa foi encerrada pelo suporte.
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
