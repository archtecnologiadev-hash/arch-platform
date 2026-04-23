'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { X, MapPin, Phone, Globe, Send, CheckCircle2, Loader2, Package, AtSign, Heart, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FornecedorData {
  id: string
  nome: string
  segmento: string | null
  cidade: string | null
  bio: string | null
  founded: string | null
  instagram: string | null
  whatsapp: string | null
  website: string | null
  email: string | null
  image_url: string | null
  cover_url: string | null
}

interface ProdutoImagem {
  id: string
  url: string
  ordem: number
}

interface Comentario {
  id: string
  user_id: string
  texto: string
  created_at: string
  user_nome: string | null
}

interface Produto {
  id: string
  nome: string
  descricao: string | null
  tipo: string
  imagens: ProdutoImagem[]
  likeCount: number
  liked: boolean
  comentarios: Comentario[]
}

const SEG_COLOR: Record<string, string> = {
  Marcenaria: '#4f9cf9', Elétrica: '#34d399', Vidraçaria: '#a78bfa',
  Gesseiro: '#f97316', Pintura: '#ef4444', Iluminação: '#007AFF', Outro: '#6b6b6b',
}

const TIPO_LABEL: Record<string, string> = {
  produto: 'Produto', servico: 'Serviço', portfolio: 'Portfólio',
  'serviço': 'Serviço', portfólio: 'Portfólio',
}

// ─── Carousel ────────────────────────────────────────────────────────────────

function Carousel({ imagens, nome }: { imagens: ProdutoImagem[]; nome: string }) {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef<number | null>(null)

  if (imagens.length === 0) {
    return (
      <div style={{ width: '100%', height: 260, background: 'linear-gradient(135deg, #e8e8f0, #d4d4dc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Package size={32} color="#c7c7cc" />
      </div>
    )
  }

  const go = (n: number) => setIdx(i => (i + n + imagens.length) % imagens.length)

  return (
    <div
      style={{ position: 'relative', height: 260, overflow: 'hidden', background: '#000', userSelect: 'none' }}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        touchStartX.current = null
      }}
    >
      <img src={imagens[idx].url} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {imagens.length > 1 && (
        <>
          <button onClick={() => go(-1)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 2 }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => go(1)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 2 }}>
            <ChevronRight size={16} />
          </button>
          {/* Dots */}
          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5, zIndex: 2 }}>
            {imagens.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s' }} />
            ))}
          </div>
          {/* Counter */}
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, zIndex: 2 }}>
            {idx + 1}/{imagens.length}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProdutoCard({ prod, segColor, currentUserId, onLike, onComment }: {
  prod: Produto
  segColor: string
  currentUserId: string | null
  onLike: (prodId: string) => void
  onComment: (prodId: string, texto: string) => Promise<void>
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleComment = async () => {
    if (!commentText.trim() || !currentUserId) return
    setSubmitting(true)
    await onComment(prod.id, commentText.trim())
    setCommentText('')
    setSubmitting(false)
    setShowComments(true)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <Carousel imagens={prod.imagens} nome={prod.nome} />

      {/* Card body */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{prod.nome}</div>
          <div style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 20, background: `${segColor}14`, border: `1px solid ${segColor}33`, color: segColor, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
            {TIPO_LABEL[prod.tipo] ?? prod.tipo}
          </div>
        </div>
        {prod.descricao && (
          <p style={{ fontSize: 12.5, color: '#6b6b6b', lineHeight: 1.55, margin: '0 0 10px' }}>{prod.descricao}</p>
        )}
      </div>

      {/* Like & comment bar */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 18 }}>
        <button
          className="fp-action-btn"
          onClick={() => currentUserId && onLike(prod.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: currentUserId ? 'pointer' : 'default', padding: 0, color: prod.liked ? '#ef4444' : '#8e8e93' }}
        >
          <Heart size={18} fill={prod.liked ? '#ef4444' : 'none'} color={prod.liked ? '#ef4444' : '#8e8e93'} style={{ transition: 'transform 0.15s' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{prod.likeCount}</span>
        </button>
        <button
          className="fp-action-btn"
          onClick={() => setShowComments(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: showComments ? '#007AFF' : '#8e8e93' }}
        >
          <MessageCircle size={18} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{prod.comentarios.length}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '12px 16px 14px' }}>
          {prod.comentarios.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, maxHeight: 220, overflowY: 'auto' }}>
              {prod.comentarios.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#007AFF', flexShrink: 0 }}>
                    {(c.user_nome ?? 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ background: '#f2f2f7', borderRadius: '0 10px 10px 10px', padding: '7px 11px', flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{c.user_nome ?? 'Usuário'}</div>
                    <div style={{ fontSize: 12.5, color: '#3a3a3a', lineHeight: 1.45 }}>{c.texto}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentUserId ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                placeholder="Escrever comentário..."
                style={{ flex: 1, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, padding: '8px 14px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', color: '#1a1a1a' }}
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || submitting}
                style={{ width: 32, height: 32, borderRadius: '50%', background: commentText.trim() ? '#007AFF' : '#e8e8e8', border: 'none', cursor: commentText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}
              >
                <Send size={13} color={commentText.trim() ? '#fff' : '#c7c7cc'} />
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#8e8e93', textAlign: 'center' as const, padding: '4px 0' }}>
              Faça login para comentar
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FornecedorPublicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = (params?.slug as string) ?? ''

  const [loading, setLoading] = useState(true)
  const [fornecedor, setFornecedor] = useState<FornecedorData | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [quoteOpen, setQuoteOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', descricao: '', data: '' })

  useEffect(() => {
    if (!slug) return
    async function load() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id ?? null
      setCurrentUserId(userId)

      const { data: forn } = await supabase
        .from('fornecedores')
        .select('id, nome, segmento, cidade, bio, founded, instagram, whatsapp, website, email, image_url, cover_url')
        .eq('slug', slug)
        .single()

      if (!forn) { router.replace('/'); return }
      setFornecedor(forn as FornecedorData)

      const { data: prods } = await supabase
        .from('fornecedor_produtos')
        .select('id, nome, descricao, tipo, fornecedor_produto_imagens(id, url, ordem)')
        .eq('fornecedor_id', forn.id)
        .order('created_at', { ascending: false })

      if (!prods || prods.length === 0) { setLoading(false); return }

      const prodIds = prods.map((p: Record<string, unknown>) => p.id as string)

      const [curtidasRes, comentariosRes] = await Promise.all([
        supabase.from('curtidas_fornecedor').select('produto_id, user_id').in('produto_id', prodIds),
        supabase.from('comentarios_fornecedor').select('id, produto_id, user_id, texto, created_at').in('produto_id', prodIds).order('created_at', { ascending: true }),
      ])

      const commenterIds = Array.from(new Set((comentariosRes.data ?? []).map((c: Record<string, unknown>) => c.user_id as string)))
      const { data: usersData } = commenterIds.length > 0
        ? await supabase.from('users').select('id, nome').in('id', commenterIds)
        : { data: [] }

      const userMap: Record<string, string> = {}
      for (const u of (usersData ?? [])) userMap[(u as { id: string; nome: string }).id] = (u as { id: string; nome: string }).nome

      const likeMap: Record<string, { count: number; liked: boolean }> = {}
      for (const c of (curtidasRes.data ?? [])) {
        const row = c as { produto_id: string; user_id: string }
        if (!likeMap[row.produto_id]) likeMap[row.produto_id] = { count: 0, liked: false }
        likeMap[row.produto_id].count++
        if (userId && row.user_id === userId) likeMap[row.produto_id].liked = true
      }

      const comentMap: Record<string, Comentario[]> = {}
      for (const c of (comentariosRes.data ?? [])) {
        const row = c as { id: string; produto_id: string; user_id: string; texto: string; created_at: string }
        if (!comentMap[row.produto_id]) comentMap[row.produto_id] = []
        comentMap[row.produto_id].push({ id: row.id, user_id: row.user_id, texto: row.texto, created_at: row.created_at, user_nome: userMap[row.user_id] ?? null })
      }

      setProdutos(prods.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        nome: p.nome as string,
        descricao: p.descricao as string | null,
        tipo: (p.tipo as string) ?? 'produto',
        imagens: ((p.fornecedor_produto_imagens as ProdutoImagem[]) ?? []).sort((a, b) => a.ordem - b.ordem),
        likeCount: likeMap[p.id as string]?.count ?? 0,
        liked: likeMap[p.id as string]?.liked ?? false,
        comentarios: comentMap[p.id as string] ?? [],
      })))

      setLoading(false)
    }
    load()
  }, [slug, router])

  const handleLike = async (prodId: string) => {
    if (!currentUserId || !fornecedor) return
    const supabase = createClient()
    const prod = produtos.find(p => p.id === prodId)
    if (!prod) return

    if (prod.liked) {
      await supabase.from('curtidas_fornecedor').delete().eq('produto_id', prodId).eq('user_id', currentUserId)
      setProdutos(ps => ps.map(p => p.id === prodId ? { ...p, liked: false, likeCount: p.likeCount - 1 } : p))
    } else {
      await supabase.from('curtidas_fornecedor').insert({ produto_id: prodId, user_id: currentUserId, fornecedor_id: fornecedor.id })
      setProdutos(ps => ps.map(p => p.id === prodId ? { ...p, liked: true, likeCount: p.likeCount + 1 } : p))
    }
  }

  const handleComment = async (prodId: string, texto: string) => {
    if (!currentUserId) return
    const supabase = createClient()
    const { data: newComment } = await supabase
      .from('comentarios_fornecedor')
      .insert({ produto_id: prodId, user_id: currentUserId, texto })
      .select('id, created_at')
      .single()

    if (newComment) {
      const { data: userData } = await supabase.from('users').select('nome').eq('id', currentUserId).single()
      const comentario: Comentario = {
        id: (newComment as Record<string, unknown>).id as string,
        user_id: currentUserId,
        texto,
        created_at: (newComment as Record<string, unknown>).created_at as string,
        user_nome: (userData as { nome: string } | null)?.nome ?? null,
      }
      setProdutos(ps => ps.map(p => p.id === prodId ? { ...p, comentarios: [...p.comentarios, comentario] } : p))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setQuoteOpen(false)
      setSubmitted(false)
      setForm({ nome: '', email: '', telefone: '', descricao: '', data: '' })
    }, 2200)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f2f7' }}>
        <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!fornecedor) return null

  const segColor = SEG_COLOR[fornecedor.segmento ?? ''] ?? '#007AFF'
  const coverFallback = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', color: '#1a1a1a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .fp-inp { width:100%; background:#f2f2f7; border:1px solid rgba(0,0,0,0.08); border-radius:10px; padding:10px 14px; color:#1a1a1a; font-size:13.5px; outline:none; transition:border-color 0.15s,background 0.15s; box-sizing:border-box; font-family:inherit; }
        .fp-inp:focus { border-color:rgba(0,122,255,0.4); background:#fff; }
        @keyframes fp-modal-in { from{opacity:0;transform:scale(0.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .fp-modal-box { animation:fp-modal-in 0.22s ease; }
        .fp-action-btn:hover svg { transform:scale(1.18); }
      `}</style>

      {/* Cover + profile card */}
      <div style={{ background: '#fff', marginBottom: 20 }}>
        {/* Cover */}
        <div style={{ height: 280, overflow: 'hidden', position: 'relative' }}>
          {fornecedor.cover_url
            ? <img src={fornecedor.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: coverFallback }} />}
        </div>

        {/* Profile info */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 28px', position: 'relative' }}>
          {/* Avatar overlapping cover */}
          <div style={{ width: 120, height: 120, borderRadius: '50%', border: '4px solid #fff', overflow: 'hidden', background: '#e8e8f0', boxShadow: '0 2px 14px rgba(0,0,0,0.18)', position: 'relative', marginTop: -60, marginBottom: 16 }}>
            {fornecedor.image_url
              ? <img src={fornecedor.image_url} alt={fornecedor.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(0,122,255,0.15),rgba(0,122,255,0.35))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 800, color: '#007AFF' }}>
                  {fornecedor.nome.slice(0, 1).toUpperCase()}
                </div>}
          </div>

          {/* Name + actions row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 14, marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px', letterSpacing: '-0.01em' }}>{fornecedor.nome}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                {fornecedor.segmento && (
                  <span style={{ background: `${segColor}14`, border: `1px solid ${segColor}33`, color: segColor, fontSize: 11.5, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                    {fornecedor.segmento}
                  </span>
                )}
                {fornecedor.cidade && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b6b6b' }}>
                    <MapPin size={13} color="#8e8e93" />{fornecedor.cidade}
                  </span>
                )}
                {fornecedor.founded && (
                  <span style={{ fontSize: 12.5, color: '#8e8e93' }}>Desde {fornecedor.founded}</span>
                )}
              </div>
            </div>
            <button onClick={() => setQuoteOpen(true)}
              style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
              Solicitar Orçamento
            </button>
          </div>

          {/* Bio */}
          {fornecedor.bio && (
            <p style={{ fontSize: 14, color: '#6b6b6b', lineHeight: 1.65, margin: '0 0 14px', maxWidth: 640 }}>{fornecedor.bio}</p>
          )}

          {/* Contact links */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const }}>
            {fornecedor.whatsapp && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b6b6b' }}>
                <Phone size={13} color="#8e8e93" />{fornecedor.whatsapp}
              </span>
            )}
            {fornecedor.instagram && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b6b6b' }}>
                <AtSign size={13} color="#8e8e93" />{fornecedor.instagram}
              </span>
            )}
            {fornecedor.website && (
              <a href={fornecedor.website} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#007AFF', textDecoration: 'none' }}>
                <Globe size={13} />{fornecedor.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 60px' }}>
        {produtos.length > 0 ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#8e8e93', textTransform: 'uppercase' as const, marginBottom: 18 }}>
              Produtos &amp; Portfólio ({produtos.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {produtos.map(prod => (
                <ProdutoCard
                  key={prod.id}
                  prod={prod}
                  segColor={segColor}
                  currentUserId={currentUserId}
                  onLike={handleLike}
                  onComment={handleComment}
                />
              ))}
            </div>
          </>
        ) : (
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '52px 24px', textAlign: 'center' as const, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Package size={36} color="#c7c7cc" style={{ marginBottom: 14 }} />
            <div style={{ fontSize: 14, color: '#6b6b6b' }}>Nenhum produto ou serviço cadastrado ainda.</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: '#fff', padding: '22px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.3em', color: '#1a1a1a', fontFamily: 'Georgia, serif' }}>ARC</span>
        <span style={{ fontSize: 12, color: '#8e8e93' }}>Plataforma de conexão entre arquitetos e fornecedores premium</span>
      </div>

      {/* Quote Modal */}
      {quoteOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setQuoteOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="fp-modal-box"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, width: '100%', maxWidth: 520, padding: 32, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center' as const, padding: '24px 0' }}>
                <CheckCircle2 size={54} color="#34d399" style={{ marginBottom: 18 }} />
                <div style={{ fontSize: 21, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Solicitação enviada!</div>
                <div style={{ fontSize: 13.5, color: '#6b6b6b' }}>A {fornecedor.nome} entrará em contato em breve.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>Solicitar Orçamento</div>
                    <div style={{ fontSize: 12.5, color: '#6b6b6b', marginTop: 3 }}>{fornecedor.nome}</div>
                  </div>
                  <button onClick={() => setQuoteOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Nome completo *</label>
                      <input className="fp-inp" required placeholder="Seu nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Telefone *</label>
                      <input className="fp-inp" required placeholder="(11) 99999-9999" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>E-mail *</label>
                    <input className="fp-inp" type="email" required placeholder="seu@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Descrição do serviço *</label>
                    <textarea className="fp-inp" required rows={3} placeholder="Descreva o que você precisa..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={{ resize: 'vertical' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Data prevista de início</label>
                    <input className="fp-inp" type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                  </div>
                  <button type="submit" style={{ marginTop: 4, background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Send size={15} /> Enviar Solicitação
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
