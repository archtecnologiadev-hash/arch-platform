'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: number
  from: 'me' | 'them'
  text: string
  time: string
}

interface Conversation {
  id: number
  arquiteto: string
  avatar: string
  project: string
  online: boolean
  unread: number
  messages: Message[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    arquiteto: 'Arq. Serafim Figueiredo',
    avatar: 'SF',
    project: 'Residência Costa',
    online: true,
    unread: 2,
    messages: [
      { id: 1, from: 'them', text: 'Olá! Vim verificar o progresso da Residência Costa.', time: '10h00' },
      { id: 2, from: 'me', text: 'Tudo certo por aqui! Já iniciamos o estudo das madeiras conforme briefing.', time: '10h15' },
      { id: 3, from: 'them', text: 'Ótimo! Quando vocês podem vir fazer a visita técnica?', time: '14h30' },
      { id: 4, from: 'them', text: 'Precisamos confirmar as medidas antes de iniciar a produção.', time: '14h32' },
      { id: 5, from: 'them', text: 'Qualquer dia essa semana está ótimo para mim!', time: '14h33' },
    ],
  },
  {
    id: 2,
    arquiteto: 'Arq. Marina Castro',
    avatar: 'MC',
    project: 'Cobertura Moderna',
    online: false,
    unread: 0,
    messages: [
      { id: 1, from: 'me', text: 'Enviamos o orçamento detalhado por email com todas as especificações técnicas.', time: 'Ontem 09h00' },
      { id: 2, from: 'them', text: 'Recebi, obrigada! Gostaria de discutir o orçamento enviado...', time: 'Ontem 15h20' },
    ],
  },
  {
    id: 3,
    arquiteto: 'Arq. Ricardo Leal',
    avatar: 'RL',
    project: 'Escritório Zen',
    online: false,
    unread: 0,
    messages: [
      { id: 1, from: 'them', text: 'O orçamento foi aprovado pelo cliente!', time: '10 Abr 11h00' },
      { id: 2, from: 'me', text: 'Que ótima notícia! Já podemos assinar o contrato de prestação de serviços.', time: '10 Abr 11h30' },
      { id: 3, from: 'them', text: 'Confirmado! Quando iniciam os serviços?', time: '10 Abr 14h00' },
    ],
  },
  {
    id: 4,
    arquiteto: 'Arq. Fernanda Lima',
    avatar: 'FL',
    project: 'Vila Contemporânea',
    online: true,
    unread: 0,
    messages: [
      { id: 1, from: 'them', text: 'O closet ficou perfeito! A Marina adorou.', time: '05 Abr 16h00' },
      { id: 2, from: 'me', text: 'Que ótimo! Foi um prazer trabalhar nesse projeto. Ficou muito elegante mesmo.', time: '05 Abr 16h30' },
      { id: 3, from: 'them', text: 'Com certeza! Já tenho outro projeto em mente para vocês 😊', time: '05 Abr 16h45' },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function FornecedorMensagensPage() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS)
  const [selectedId, setSelectedId] = useState<number>(1)
  const [newMsg, setNewMsg] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selected = conversations.find((c) => c.id === selectedId)!

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedId, conversations])

  const handleSelect = (id: number) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    )
    setSelectedId(id)
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim()) return
    const msg: Message = {
      id: Date.now(),
      from: 'me',
      text: newMsg.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, messages: [...c.messages, msg] } : c
      )
    )
    setNewMsg('')
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#d0d0d0',
      }}
    >
      <style>{`
        .msg-conv-item { display: flex; align-items: center; gap: 12px; padding: 13px 16px; cursor: pointer; transition: background 0.12s; border-bottom: 1px solid #0f0f0f; }
        .msg-conv-item:hover { background: #111; }
        .msg-conv-item.selected { background: rgba(200,169,110,0.07); border-left: 2px solid #c8a96e; }
        .msg-bubble-me { background: rgba(200,169,110,0.14); border: 1px solid rgba(200,169,110,0.2); border-radius: 12px 12px 4px 12px; padding: 10px 14px; max-width: 72%; }
        .msg-bubble-them { background: #111; border: 1px solid #1a1a1a; border-radius: 12px 12px 12px 4px; padding: 10px 14px; max-width: 72%; }
        .msg-inp { flex: 1; background: transparent; border: none; outline: none; color: #d0d0d0; font-size: 13.5px; font-family: inherit; }
      `}</style>

      {/* ── Conversation list ── */}
      <div
        style={{
          width: 300,
          minWidth: 300,
          borderRight: '1px solid #111',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0a0a',
        }}
      >
        {/* List header */}
        <div
          style={{
            padding: '20px 16px 14px',
            borderBottom: '1px solid #111',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>Mensagens</div>
            {totalUnread > 0 && (
              <div
                style={{
                  background: '#c8a96e',
                  color: '#080808',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 20,
                }}
              >
                {totalUnread}
              </div>
            )}
          </div>
        </div>

        {/* Conversations */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`msg-conv-item${selectedId === conv.id ? ' selected' : ''}`}
              onClick={() => handleSelect(conv.id)}
            >
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(200,169,110,0.1)',
                    border: '1.5px solid rgba(200,169,110,0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#c8a96e',
                  }}
                >
                  {conv.avatar}
                </div>
                {conv.online && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 1,
                      right: 1,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#34d399',
                      border: '2px solid #0a0a0a',
                    }}
                  />
                )}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: conv.unread > 0 ? 700 : 500,
                      color: '#d0d0d0',
                      whiteSpace: 'nowrap' as const,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 130,
                    }}
                  >
                    {conv.arquiteto}
                  </div>
                  {conv.unread > 0 && (
                    <div
                      style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#c8a96e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 800,
                        color: '#080808',
                        flexShrink: 0,
                      }}
                    >
                      {conv.unread}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#c8a96e',
                    opacity: 0.6,
                    marginTop: 1,
                  }}
                >
                  {conv.project}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: '#3e3e3e',
                    marginTop: 2,
                    whiteSpace: 'nowrap' as const,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {conv.messages[conv.messages.length - 1]?.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#080808' }}>
        {/* Chat header */}
        <div
          style={{
            height: 64,
            borderBottom: '1px solid #111',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 14,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(200,169,110,0.1)',
              border: '1.5px solid rgba(200,169,110,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#c8a96e',
              flexShrink: 0,
            }}
          >
            {selected.avatar}
            {selected.online && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 1,
                  right: 1,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: '#34d399',
                  border: '2px solid #080808',
                }}
              />
            )}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#d0d0d0' }}>
              {selected.arquiteto}
            </div>
            <div style={{ fontSize: 11, color: selected.online ? '#34d399' : '#444', marginTop: 1 }}>
              {selected.online ? 'Online agora' : 'Offline'} · {selected.project}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {selected.messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start',
              }}
            >
              <div>
                <div className={msg.from === 'me' ? 'msg-bubble-me' : 'msg-bubble-them'}>
                  <div style={{ fontSize: 13.5, color: '#d0d0d0', lineHeight: 1.55 }}>{msg.text}</div>
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: '#333',
                    marginTop: 4,
                    textAlign: msg.from === 'me' ? 'right' : 'left' as const,
                  }}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          style={{
            borderTop: '1px solid #111',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#0a0a0a',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              background: '#111',
              border: '1px solid #1c1c1c',
              borderRadius: 10,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              className="msg-inp"
              placeholder="Escreva sua mensagem..."
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={!newMsg.trim()}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: newMsg.trim() ? '#c8a96e' : '#1a1a1a',
              border: 'none',
              cursor: newMsg.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            <Send size={15} color={newMsg.trim() ? '#080808' : '#333'} />
          </button>
        </form>
      </div>
    </div>
  )
}
