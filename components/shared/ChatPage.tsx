'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Search, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type UserType = 'arquiteto' | 'cliente' | 'fornecedor'

interface Conversa {
  id: string
  tipo: 'cliente' | 'fornecedor'
  participante_id: string
  participante_nome: string
  participante_email: string
  projeto_nome: string | null
  unread: number
  ultima_msg: string
  ultima_msg_at: string | null
}

interface Mensagem {
  id: string
  remetente_id: string
  texto: string
  created_at: string
  lida: boolean
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800000) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function ChatInner({ userType }: { userType: UserType }) {
  const searchParams = useSearchParams()
  const initConvId = searchParams.get('c')

  const [userId, setUserId] = useState<string | null>(null)
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(initConvId)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const selectedConversa = conversas.find(c => c.id === selectedId) ?? null

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      await loadConversas(supabase, user.id)
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function fetchMsgMeta(supabase: ReturnType<typeof createClient>, convId: string, uid: string) {
    const [{ data: msgs }, { count }] = await Promise.all([
      supabase.from('mensagens').select('texto, created_at').eq('conversa_id', convId)
        .order('created_at', { ascending: false }).limit(1),
      supabase.from('mensagens').select('id', { count: 'exact', head: true })
        .eq('conversa_id', convId).eq('lida', false).neq('remetente_id', uid),
    ])
    return { last: msgs?.[0] ?? null, unread: count ?? 0 }
  }

  async function loadConversas(supabase: ReturnType<typeof createClient>, uid: string) {
    if (userType === 'arquiteto') {
      const { data: convsData } = await supabase
        .from('conversas')
        .select('id, tipo, participante_id, fornecedor_id')
        .eq('arquiteto_id', uid)
        .order('created_at', { ascending: false })

      if (!convsData || convsData.length === 0) return

      // Fetch all participant user records in one query
      const participanteIds = Array.from(new Set(convsData.map(c => c.participante_id)))
      const { data: usersData } = await supabase
        .from('users').select('id, nome, email').in('id', participanteIds)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usersMap: Record<string, any> = Object.fromEntries((usersData ?? []).map(u => [u.id, u]))

      // Fetch fornecedor business names for supplier convos
      const fornecedorDbIds = convsData
        .filter(c => c.tipo === 'fornecedor' && c.fornecedor_id)
        .map(c => c.fornecedor_id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fornsMap: Record<string, any> = {}
      if (fornecedorDbIds.length > 0) {
        const { data: fornsData } = await supabase
          .from('fornecedores').select('id, nome').in('id', fornecedorDbIds)
        fornsMap = Object.fromEntries((fornsData ?? []).map(f => [f.id, f]))
      }

      // Fetch project names for cliente convos (map participante_id -> nome)
      const clienteParticipanteIds = convsData
        .filter(c => c.tipo === 'cliente').map(c => c.participante_id)
      const projetosMap: Record<string, string> = {}
      if (clienteParticipanteIds.length > 0) {
        const { data: escritoriosData } = await supabase
          .from('escritorios').select('id').eq('user_id', uid)
        const escritorioIds = (escritoriosData ?? []).map(e => e.id)
        if (escritorioIds.length > 0) {
          const { data: projetosData } = await supabase
            .from('projetos').select('nome, cliente_id')
            .in('cliente_id', clienteParticipanteIds)
            .in('escritorio_id', escritorioIds)
            .order('created_at', { ascending: false })
          for (const p of projetosData ?? []) {
            if (p.cliente_id && !projetosMap[p.cliente_id]) projetosMap[p.cliente_id] = p.nome
          }
        }
      }

      const result: Conversa[] = await Promise.all(convsData.map(async (c) => {
        const { last, unread } = await fetchMsgMeta(supabase, c.id, uid)
        const user = usersMap[c.participante_id]
        let participante_nome = user?.nome ?? user?.email ?? 'Usuário'
        if (c.tipo === 'fornecedor' && c.fornecedor_id && fornsMap[c.fornecedor_id]) {
          participante_nome = fornsMap[c.fornecedor_id].nome
        }
        return {
          id: c.id,
          tipo: c.tipo as 'cliente' | 'fornecedor',
          participante_id: c.participante_id,
          participante_nome,
          participante_email: user?.email ?? '',
          projeto_nome: c.tipo === 'cliente' ? (projetosMap[c.participante_id] ?? null) : null,
          unread,
          ultima_msg: last?.texto ?? '',
          ultima_msg_at: last?.created_at ?? null,
        }
      }))

      setConversas(result)
      if (initConvId && result.find(c => c.id === initConvId)) setSelectedId(initConvId)
      else if (!selectedId && result.length > 0) setSelectedId(result[0].id)
    } else {
      // cliente or fornecedor: load their conversas and fetch arquiteto name separately
      const tipoField = userType === 'cliente' ? 'cliente' : 'fornecedor'
      const { data: convsData } = await supabase
        .from('conversas')
        .select('id, tipo, arquiteto_id, participante_id, fornecedor_id')
        .eq('participante_id', uid)
        .eq('tipo', tipoField)
        .order('created_at', { ascending: false })

      if (!convsData || convsData.length === 0) return

      const arquitetoIds = Array.from(new Set(convsData.map(c => c.arquiteto_id)))
      const { data: arquitetosData } = await supabase
        .from('users').select('id, nome, email').in('id', arquitetoIds)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const arquitetosMap: Record<string, any> = Object.fromEntries((arquitetosData ?? []).map(u => [u.id, u]))

      const convsList: Conversa[] = await Promise.all(convsData.map(async (c) => {
        const { last, unread } = await fetchMsgMeta(supabase, c.id, uid)
        const arq = arquitetosMap[c.arquiteto_id]
        return {
          id: c.id,
          tipo: c.tipo as 'cliente' | 'fornecedor',
          participante_id: c.arquiteto_id,
          participante_nome: arq?.nome ?? arq?.email ?? 'Arquiteto',
          participante_email: arq?.email ?? '',
          projeto_nome: null,
          unread,
          ultima_msg: last?.texto ?? '',
          ultima_msg_at: last?.created_at ?? null,
        }
      }))

      setConversas(convsList)
      if (initConvId && convsList.find(c => c.id === initConvId)) setSelectedId(initConvId)
      else if (convsList.length > 0) setSelectedId(convsList[0].id)
    }
  }

  useEffect(() => {
    if (!selectedId || !userId) return
    const supabase = createClient()

    supabase
      .from('mensagens')
      .select('*')
      .eq('conversa_id', selectedId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMensagens(data ?? [])
        supabase
          .from('mensagens')
          .update({ lida: true })
          .eq('conversa_id', selectedId)
          .eq('lida', false)
          .neq('remetente_id', userId)
          .then(() => {
            setConversas(prev => prev.map(c => c.id === selectedId ? { ...c, unread: 0 } : c))
          })
      })

    const channel = supabase
      .channel(`msgs-${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens',
        filter: `conversa_id=eq.${selectedId}`,
      }, (payload) => {
        const m = payload.new as Mensagem
        setMensagens(prev => {
          if (prev.find(x => x.id === m.id)) return prev
          return [...prev, m]
        })
        if (m.remetente_id !== userId) {
          supabase.from('mensagens').update({ lida: true }).eq('id', m.id).then(() => {})
        }
        setConversas(prev => prev.map(c =>
          c.id === selectedId ? { ...c, ultima_msg: m.texto, ultima_msg_at: m.created_at } : c
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedId, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function sendMessage() {
    if (!texto.trim() || !selectedId || !userId || sending) return
    setSending(true)
    const t = texto.trim()
    setTexto('')
    const supabase = createClient()
    await supabase.from('mensagens').insert({ conversa_id: selectedId, remetente_id: userId, texto: t })
    setSending(false)
    inputRef.current?.focus()
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const filtered = search.trim()
    ? conversas.filter(c => c.participante_nome.toLowerCase().includes(search.toLowerCase()))
    : conversas
  const filtClientes = filtered.filter(c => c.tipo === 'cliente')
  const filtFornecedores = filtered.filter(c => c.tipo === 'fornecedor')

  function ConvItem({ c }: { c: Conversa }) {
    const isActive = c.id === selectedId
    return (
      <button
        onClick={() => setSelectedId(c.id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px',
          background: isActive ? 'rgba(0,122,255,0.08)' : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.1s',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: isActive ? 'rgba(0,122,255,0.15)' : 'rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 600,
          color: isActive ? '#007AFF' : '#6b6b6b', flexShrink: 0,
        }}>
          {initials(c.participante_nome)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontSize: 13.5, fontWeight: c.unread > 0 ? 600 : 400,
              color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis', flex: 1,
            }}>
              {c.participante_nome}
            </span>
            {c.ultima_msg_at && (
              <span style={{ fontSize: 11, color: '#8e8e93', flexShrink: 0 }}>
                {fmtTime(c.ultima_msg_at)}
              </span>
            )}
          </div>
          {c.projeto_nome && (
            <div style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 500, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.projeto_nome}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <span style={{
              fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
              color: c.unread > 0 ? '#1a1a1a' : '#8e8e93',
              fontWeight: c.unread > 0 ? 500 : 400,
            }}>
              {c.ultima_msg || 'Nenhuma mensagem ainda'}
            </span>
            {c.unread > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#fff',
                background: '#007AFF', borderRadius: 10,
                padding: '1px 6px', lineHeight: '16px', flexShrink: 0,
              }}>
                {c.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f2f2f7', overflow: 'hidden' }}>
      {/* Left: conversation list */}
      <div style={{
        width: 300, minWidth: 300, background: '#fff',
        borderRight: '1px solid rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}>
        <div style={{
          height: 56, display: 'flex', alignItems: 'center',
          padding: '0 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0,
        }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>Mensagens</span>
        </div>

        <div style={{ padding: '8px 10px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#f2f2f7', borderRadius: 10, padding: '6px 10px',
          }}>
            <Search size={13} color="#8e8e93" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent', fontSize: 13, color: '#1a1a1a',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>
              Carregando...
            </div>
          ) : conversas.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#8e8e93' }}>
              <MessageCircle size={32} color="#c7c7cc" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13 }}>Nenhuma conversa ainda</div>
            </div>
          ) : (
            <>
              {userType === 'arquiteto' ? (
                <>
                  {filtClientes.length > 0 && (
                    <>
                      <div style={{
                        padding: '10px 16px 4px', fontSize: 11, fontWeight: 600,
                        color: '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>Clientes</div>
                      {filtClientes.map(c => <ConvItem key={c.id} c={c} />)}
                    </>
                  )}
                  {filtFornecedores.length > 0 && (
                    <>
                      <div style={{
                        padding: '10px 16px 4px', fontSize: 11, fontWeight: 600,
                        color: '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>Fornecedores</div>
                      {filtFornecedores.map(c => <ConvItem key={c.id} c={c} />)}
                    </>
                  )}
                  {filtered.length === 0 && search && (
                    <div style={{ padding: 16, textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>
                      Nenhum resultado
                    </div>
                  )}
                </>
              ) : (
                filtered.map(c => <ConvItem key={c.id} c={c} />)
              )}
            </>
          )}
        </div>
      </div>

      {/* Right: chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
        {selectedConversa ? (
          <>
            <div style={{
              height: 56, display: 'flex', alignItems: 'center',
              padding: '0 16px', borderBottom: '1px solid rgba(0,0,0,0.08)',
              background: '#fff', gap: 10, flexShrink: 0,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(0,122,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, color: '#007AFF',
              }}>
                {initials(selectedConversa.participante_nome)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                  {selectedConversa.participante_nome}
                  {selectedConversa.projeto_nome && (
                    <span style={{ fontWeight: 400, color: '#8b5cf6' }}>
                      {' — Projeto: '}{selectedConversa.projeto_nome}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#8e8e93' }}>
                  {selectedConversa.participante_email}
                </div>
              </div>
            </div>

            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '16px 16px 8px',
              display: 'flex', flexDirection: 'column', gap: 2,
              background: '#f2f2f7',
            }}>
              {mensagens.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', color: '#8e8e93' }}>
                    <MessageCircle size={32} color="#c7c7cc" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13 }}>Inicie a conversa</div>
                  </div>
                </div>
              ) : (
                mensagens.map((msg, idx) => {
                  const isMine = msg.remetente_id === userId
                  const prev = idx > 0 ? mensagens[idx - 1] : null
                  const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString()
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div style={{ textAlign: 'center', margin: '8px 0 4px', fontSize: 11, color: '#8e8e93' }}>
                          {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                        <div style={{
                          maxWidth: '70%',
                          background: isMine ? '#007AFF' : '#ffffff',
                          color: isMine ? '#ffffff' : '#1a1a1a',
                          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          padding: '8px 12px', fontSize: 14, lineHeight: 1.4,
                          boxShadow: isMine ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
                          wordBreak: 'break-word',
                        }}>
                          {msg.texto}
                          <div style={{ fontSize: 10, textAlign: 'right', marginTop: 2, opacity: 0.65 }}>
                            {fmtTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{
              padding: '10px 12px', borderTop: '1px solid rgba(0,0,0,0.08)',
              background: '#fff', display: 'flex', alignItems: 'flex-end', gap: 8, flexShrink: 0,
            }}>
              <textarea
                ref={inputRef}
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Mensagem..."
                rows={1}
                style={{
                  flex: 1, border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 20, padding: '8px 14px',
                  fontSize: 14, outline: 'none', resize: 'none',
                  background: '#f2f2f7', color: '#1a1a1a',
                  maxHeight: 120, overflowY: 'auto',
                  lineHeight: 1.4, fontFamily: 'inherit',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!texto.trim() || sending}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: texto.trim() && !sending ? '#007AFF' : '#c7c7cc',
                  border: 'none', cursor: texto.trim() && !sending ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}
              >
                <Send size={15} color="#fff" />
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7' }}>
            <div style={{ textAlign: 'center', color: '#8e8e93' }}>
              <MessageCircle size={48} color="#c7c7cc" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, fontWeight: 500, color: '#3a3a3c' }}>Selecione uma conversa</div>
              <div style={{ marginTop: 4, fontSize: 13 }}>Escolha uma conversa para começar</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatPage({ userType }: { userType: UserType }) {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7' }}>
        <span style={{ color: '#8e8e93', fontSize: 14 }}>Carregando mensagens...</span>
      </div>
    }>
      <ChatInner userType={userType} />
    </Suspense>
  )
}
